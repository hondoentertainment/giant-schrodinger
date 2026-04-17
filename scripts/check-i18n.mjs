#!/usr/bin/env node
/**
 * i18n audit: scans the `src/` tree for likely-untranslated English strings.
 *
 * Uses regex heuristics (no AST) to flag user-facing text that should go
 * through the `t()` helper from `src/hooks/useTranslation.js`. Designed to
 * be conservative: prefers false negatives over false positives.
 *
 * Heuristics (flagged):
 *   - JSX text:        `>Some Text<`            (2+ chars, starts with capital)
 *   - placeholder:     placeholder="Enter name"
 *   - aria-label:      aria-label="Close"
 *   - title attr:      title="Help"
 *   - toast calls:     toast.success('Saved')   (success/error/warn/info)
 *
 * Exclusions:
 *   - Any line containing a `t(` call
 *   - Single-word all-caps (BETA, ENTER) are skipped
 *   - Strings under 2 chars, pure digits/punctuation
 *   - src/locales/**, scripts/**, e2e/**, supabase/**, **\/*.test.{js,jsx}
 *   - node_modules, dist, coverage, test-results, playwright-report, .git
 *
 * Flags:
 *   --report-only   Always exit 0 (for non-blocking CI runs)
 *
 * Exit codes:
 *   0 - no findings (or --report-only)
 *   1 - findings exist and --report-only not passed
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SRC_DIR = resolve(REPO_ROOT, "src");

const REPORT_ONLY = process.argv.includes("--report-only");

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  "coverage",
  "test-results",
  "playwright-report",
  "locales",
]);

// Any path containing one of these segments is skipped entirely.
const SKIP_PATH_SEGMENTS = [
  `${sep}locales${sep}`,
  `${sep}scripts${sep}`,
  `${sep}e2e${sep}`,
  `${sep}supabase${sep}`,
];

function shouldSkipFile(absPath) {
  const rel = relative(REPO_ROOT, absPath);
  const normalized = sep + rel + sep;
  for (const seg of SKIP_PATH_SEGMENTS) {
    if (normalized.includes(seg)) return true;
  }
  if (/\.test\.(js|jsx)$/.test(absPath)) return true;
  if (/\.stories\.(js|jsx)$/.test(absPath)) return true;
  return false;
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (entry.isFile()) {
      if (/\.(js|jsx)$/.test(entry.name)) out.push(full);
    }
  }
  return out;
}

// ---------- heuristics ----------

const STOP_WORDS = new Set([
  "true",
  "false",
  "null",
  "undefined",
  "px",
  "em",
  "rem",
  "auto",
  "none",
  "inherit",
  "initial",
  "unset",
  "div",
  "span",
  "button",
  "input",
]);

function isNoise(text) {
  const trimmed = text.trim();
  if (trimmed.length < 2) return true;
  // No alphabetic character -> noise
  if (!/[A-Za-z]/.test(trimmed)) return true;
  // Need at least 2 alphabetic chars
  const alpha = trimmed.replace(/[^A-Za-z]/g, "");
  if (alpha.length < 2) return true;
  // Single word all caps is ambiguous (acronyms, constants); skip
  if (/^[A-Z]+$/.test(trimmed)) return true;
  // Single lowercase technical token
  if (/^[a-z_]+$/.test(trimmed) && !trimmed.includes(" ")) {
    if (STOP_WORDS.has(trimmed.toLowerCase())) return true;
    // Tokens like camelCase/snake_case without spaces are unlikely copy
    if (trimmed.length < 4) return true;
  }
  // Pure template-interpolation-looking string
  if (/^\$\{/.test(trimmed)) return true;
  // Looks like a JS expression (property access, function call, assignment)
  // e.g. `e.target.value`, `Date.now()`, `i + 1`. User copy almost never
  // contains parentheses or `=` at this granularity.
  if (/[()]/.test(trimmed)) return true;
  if (/[a-z]\.[a-z]/i.test(trimmed)) return true;
  // Ternary-looking expressions captured between `>` and `<` in JS code:
  // e.g. `aiScore ? 'player' : playerScore`. Real JSX text rarely mixes
  // `?` and `:` together with quote marks.
  if (/\?.*:/.test(trimmed) && /['"]/.test(trimmed)) return true;
  return false;
}

function lineHasTranslate(line) {
  // If the line already has a t('...') call, assume the author handled i18n.
  return /\bt\s*\(/.test(line);
}

// JSX text between tags: >Some Text<  — starts with a letter, 3+ chars, no JSX braces.
// Capture group must avoid `<`, `>`, `{`, `}` so we don't cross tag boundaries.
const JSX_TEXT_RE = /> *([A-Za-z][^<>{}\n]{2,}?) *</g;

const PLACEHOLDER_RE = /\bplaceholder\s*=\s*"([^"\n]{2,})"/g;
const ARIA_LABEL_RE = /\baria-label\s*=\s*"([^"\n]{2,})"/g;
const TITLE_ATTR_RE = /\btitle\s*=\s*"([^"\n]{2,})"/g;
const TOAST_RE = /toast\.(?:success|error|warn|info)\(\s*['"`]([^'"`\n]{2,})['"`]/g;

function offsetToLine(source, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) line++;
  }
  return line;
}

function lineTextAt(source, line) {
  const lines = source.split("\n");
  return lines[line - 1] ?? "";
}

function looksTranslatedCall(source, matchIndex) {
  // If the match occurs inside (or right next to) a `t(` call, skip it.
  const window = source.slice(Math.max(0, matchIndex - 40), matchIndex);
  return /\bt\s*\([^)]*$/.test(window);
}

function scanFile(absPath) {
  const source = readFileSync(absPath, "utf8");
  const findings = [];

  const pushFinding = (regex, category, label) => {
    regex.lastIndex = 0;
    for (let m; (m = regex.exec(source)); ) {
      const raw = m[1];
      if (!raw) continue;
      const text = raw.trim();
      if (isNoise(text)) continue;
      const line = offsetToLine(source, m.index);
      const lineText = lineTextAt(source, line);
      if (lineHasTranslate(lineText)) continue;
      if (looksTranslatedCall(source, m.index)) continue;
      findings.push({ line, category, label, text });
    }
  };

  pushFinding(PLACEHOLDER_RE, "placeholder", "placeholder attr");
  pushFinding(ARIA_LABEL_RE, "aria-label", "aria-label attr");
  pushFinding(TITLE_ATTR_RE, "title", "title attr");
  pushFinding(TOAST_RE, "toast", "toast call");
  // JSX text is only meaningful in .jsx files; in .js files `>foo<` is almost
  // always a comparison or arrow-function body (`() => now - t < 5`).
  if (absPath.endsWith(".jsx")) {
    pushFinding(JSX_TEXT_RE, "jsx-text", "JSX text");
  }

  // Dedupe: same line + same text + same category
  const seen = new Set();
  const deduped = [];
  for (const f of findings) {
    const key = `${f.line}|${f.category}|${f.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(f);
  }
  deduped.sort((a, b) => a.line - b.line);
  return deduped;
}

// ---------- run ----------

const files = walk(SRC_DIR).filter((f) => !shouldSkipFile(f)).sort();

const byFile = [];
const categoryCounts = {
  "jsx-text": 0,
  placeholder: 0,
  "aria-label": 0,
  title: 0,
  toast: 0,
};
let totalFindings = 0;

for (const file of files) {
  const findings = scanFile(file);
  if (findings.length === 0) continue;
  byFile.push({ file, findings });
  totalFindings += findings.length;
  for (const f of findings) categoryCounts[f.category]++;
}

// ---------- print ----------

function formatDisplay(f) {
  switch (f.category) {
    case "jsx-text":
      return `>${f.text}<`;
    case "placeholder":
      return `placeholder="${f.text}"`;
    case "aria-label":
      return `aria-label="${f.text}"`;
    case "title":
      return `title="${f.text}"`;
    case "toast":
      return `toast(...'${f.text}')`;
    default:
      return f.text;
  }
}

const lines = [];
const log = (s = "") => lines.push(s);

log("i18n audit report");
log("=================");
log("");

if (byFile.length === 0) {
  log("No potentially-untranslated strings detected.");
} else {
  for (const { file, findings } of byFile) {
    const rel = relative(REPO_ROOT, file);
    log(`File: ${rel}`);
    // Column width for line numbers
    const lineWidth = String(
      findings.reduce((m, f) => Math.max(m, f.line), 0),
    ).length;
    const displayWidth = Math.min(
      60,
      findings.reduce((m, f) => Math.max(m, formatDisplay(f).length), 0),
    );
    for (const f of findings) {
      const display = formatDisplay(f);
      const padded =
        display.length >= displayWidth
          ? display
          : display + " ".repeat(displayWidth - display.length);
      const linePad = String(f.line).padStart(lineWidth, " ");
      log(`  Line ${linePad}: ${padded}  [${f.label}]`);
    }
    log(
      `Summary: ${findings.length} potentially-untranslated string${
        findings.length === 1 ? "" : "s"
      } in ${rel.split("/").pop()}`,
    );
    log("");
  }
}

log("Summary:");
log(
  `  Total findings: ${totalFindings} strings across ${byFile.length} file${
    byFile.length === 1 ? "" : "s"
  }`,
);
log("  By category:");
log(`    JSX text:        ${categoryCounts["jsx-text"]}`);
log(`    placeholder:     ${categoryCounts.placeholder}`);
log(`    aria-label:      ${categoryCounts["aria-label"]}`);
log(`    title:           ${categoryCounts.title}`);
log(`    toast call:      ${categoryCounts.toast}`);

const output = lines.join("\n");
process.stdout.write(output + "\n");

if (totalFindings > 0 && !REPORT_ONLY) {
  process.exit(1);
}
process.exit(0);
