#!/usr/bin/env node
/**
 * Bundle size budget checker.
 *
 * Reads `dist/assets/*.js`, measures gzipped size with Node's built-in zlib,
 * and enforces the following budgets:
 *   - Main chunk (largest `index-*.js`): <= 170 KB gzipped
 *   - Any single lazy chunk: <= 50 KB gzipped
 *   - Total JS (sum gzipped): <= 300 KB
 *
 * Prints a table and exits 1 if any budget fails; 0 otherwise.
 *
 * Usage: node scripts/check-bundle-size.mjs (run AFTER `vite build`).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KB = 1024;
const MAIN_BUDGET = 170 * KB;
const LAZY_BUDGET = 50 * KB;
const TOTAL_BUDGET = 300 * KB;

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = resolve(__dirname, "..", "dist", "assets");

function formatKB(bytes) {
  return `${(bytes / KB).toFixed(2)} KB`;
}

function pad(str, len) {
  const s = String(str);
  return s.length >= len ? s : s + " ".repeat(len - s.length);
}

let assetFiles;
try {
  assetFiles = readdirSync(assetsDir);
} catch (err) {
  console.error(`Cannot read ${assetsDir}: ${err.message}`);
  console.error("Did you run `npm run build` first?");
  process.exit(1);
}

const jsFiles = assetFiles
  .filter((f) => f.endsWith(".js"))
  .map((name) => {
    const full = join(assetsDir, name);
    const raw = readFileSync(full);
    const gz = gzipSync(raw);
    return {
      name,
      rawSize: statSync(full).size,
      gzSize: gz.length,
    };
  })
  .sort((a, b) => b.gzSize - a.gzSize);

if (jsFiles.length === 0) {
  console.error(`No .js files found in ${assetsDir}`);
  process.exit(1);
}

// Identify the main chunk: largest file matching index-*.js
const indexChunks = jsFiles.filter((f) => /^index-.*\.js$/.test(f.name));
if (indexChunks.length === 0) {
  console.error("No main chunk (index-*.js) found in dist/assets/");
  process.exit(1);
}
const mainChunk = indexChunks.reduce((a, b) => (a.gzSize >= b.gzSize ? a : b));

const rows = [];
let failed = false;
let totalGz = 0;

for (const file of jsFiles) {
  totalGz += file.gzSize;
  const isMain = file.name === mainChunk.name;
  const budget = isMain ? MAIN_BUDGET : LAZY_BUDGET;
  const ok = file.gzSize <= budget;
  if (!ok) failed = true;
  rows.push({
    filename: file.name,
    size: formatKB(file.rawSize),
    gzip: formatKB(file.gzSize),
    budget: formatKB(budget),
    status: ok ? "OK" : "FAIL",
    kind: isMain ? "main" : "lazy",
  });
}

// Column widths
const colFilename = Math.max(
  "filename".length,
  ...rows.map((r) => r.filename.length),
);
const colSize = Math.max("size".length, ...rows.map((r) => r.size.length));
const colGzip = Math.max("gzip".length, ...rows.map((r) => r.gzip.length));
const colBudget = Math.max(
  "budget".length,
  ...rows.map((r) => r.budget.length),
);
const colStatus = Math.max("status".length, 4);
const colKind = Math.max("kind".length, 4);

function printRow(r) {
  console.log(
    [
      pad(r.filename, colFilename),
      pad(r.size, colSize),
      pad(r.gzip, colGzip),
      pad(r.budget, colBudget),
      pad(r.kind, colKind),
      pad(r.status, colStatus),
    ].join("  "),
  );
}

console.log("");
console.log("Bundle size budget report");
console.log("=========================");
printRow({
  filename: "filename",
  size: "size",
  gzip: "gzip",
  budget: "budget",
  kind: "kind",
  status: "status",
});
console.log(
  "-".repeat(colFilename + colSize + colGzip + colBudget + colKind + colStatus + 10),
);
for (const r of rows) printRow(r);

console.log("");
const totalOk = totalGz <= TOTAL_BUDGET;
if (!totalOk) failed = true;
console.log(
  `Total JS (gzipped): ${formatKB(totalGz)} / budget ${formatKB(TOTAL_BUDGET)} - ${
    totalOk ? "OK" : "FAIL"
  }`,
);
console.log(
  `Main chunk        : ${mainChunk.name} (${formatKB(mainChunk.gzSize)} / ${formatKB(MAIN_BUDGET)})`,
);

if (failed) {
  console.error("");
  console.error("Bundle budget check FAILED");
  process.exit(1);
}

console.log("");
console.log("Bundle budget check passed.");
process.exit(0);
