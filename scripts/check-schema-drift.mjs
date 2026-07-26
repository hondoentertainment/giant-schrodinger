#!/usr/bin/env node
// check-schema-drift.mjs
//
// Verifies that supabase/schema.sql (consolidated snapshot) defines the same
// schema as the concatenation of supabase/migrations/*.sql (in filename order).
//
// Strategy: parse both sources with lightweight regex-based extractors into a
// canonical, order-insensitive set of structural records, then diff.
//
// Records captured:
//   - tables       { name, columns (sorted), tableConstraints (sorted) }
//   - indexes      { name, table, body (normalized) }
//   - rls          { table }
//   - policies     { name, table, command, body (normalized) }
//   - publications { table }
//   - doBlocks     { hash } (opaque)
//
// What IS detected:
//   - Added/removed/renamed tables, columns, indexes, policies
//   - Column type changes, NOT NULL / DEFAULT / CHECK changes
//   - Foreign-key reference target + ON DELETE/UPDATE action changes
//     (CASCADE vs SET NULL vs RESTRICT etc.) — they're part of the
//     normalized column-def string, so any textual difference trips drift.
//   - RLS enabled/disabled, policy command (SELECT/INSERT/...) changes,
//     policy USING / WITH CHECK body differences
//   - Publication membership (ALTER PUBLICATION ADD TABLE, including the
//     common `do $$ ... $$` wrapper used to make it idempotent)
//   - Table-level constraints (PRIMARY KEY, UNIQUE, FOREIGN KEY) as sorted
//     bags — order doesn't matter but content must match textually.
//
// Known limitations (honest list):
//   - Regex parsing only; cannot handle arbitrary deeply nested constructs
//     perfectly. Works for the current controlled schema.
//   - Comparison of FK actions is TEXTUAL, not semantic: "ON DELETE NO ACTION"
//     vs omitted clause (both PostgreSQL defaults) would appear as a diff.
//   - DEFAULT expressions are compared as normalized text; semantically
//     equivalent but syntactically different defaults (`now()` vs
//     `CURRENT_TIMESTAMP`) would flag.
//   - Does not follow schema-qualified names (public.x vs x).
//   - Does not understand triggers, functions, views, sequences, or GRANTs
//     (none exist in this schema today; would need parser extension to add).
//   - Does not validate migration filename monotonicity or gaps.
//   - Unrecognized opaque `do $$ ... $$` blocks are compared by sha-256 hash
//     of their normalized text — cosmetic formatting changes inside such a
//     block can cause false-positive drift.
//
// Exit codes: 0 = equivalent, 1 = drift detected (or parse error).

import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SCHEMA_PATH = join(REPO_ROOT, 'supabase', 'schema.sql');
const MIGRATIONS_DIR = join(REPO_ROOT, 'supabase', 'migrations');

// ---------------------------------------------------------------------------
// Tokenization helpers
// ---------------------------------------------------------------------------

/** Strip -- line comments and /* block comments *\/ from SQL. */
function stripComments(sql) {
  // Remove /* ... */ block comments (non-greedy, multi-line).
  let out = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove -- line comments up to end of line.
  out = out.replace(/--[^\n]*/g, '');
  return out;
}

/** Collapse whitespace to single spaces. */
function collapseWs(s) {
  return s.replace(/\s+/g, ' ').trim();
}

/** Lowercase but preserve quoted string literals and "quoted identifiers". */
function lowerPreservingQuotes(s) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "'" || c === '"') {
      const quote = c;
      let j = i + 1;
      while (j < s.length) {
        if (s[j] === quote) {
          // doubled quote = escape
          if (s[j + 1] === quote) {
            j += 2;
            continue;
          }
          break;
        }
        j++;
      }
      out += s.slice(i, Math.min(j + 1, s.length));
      i = j + 1;
    } else {
      out += c.toLowerCase();
      i++;
    }
  }
  return out;
}

/**
 * Split a SQL source into top-level statements, respecting `do $$ ... $$`
 * dollar-quoted blocks and string literals. Comments are stripped from
 * non-dollar-quoted regions BEFORE the `;` split so that a `;` inside a `--`
 * comment doesn't falsely terminate a statement.
 */
function splitStatements(sql) {
  const statements = [];
  let buf = '';
  let i = 0;
  const n = sql.length;
  while (i < n) {
    // Dollar-quoted block: copy verbatim, no comment stripping inside.
    if (sql[i] === '$') {
      const tagMatch = sql.slice(i).match(/^\$([A-Za-z0-9_]*)\$/);
      if (tagMatch) {
        const tag = tagMatch[0];
        const endIdx = sql.indexOf(tag, i + tag.length);
        if (endIdx !== -1) {
          buf += sql.slice(i, endIdx + tag.length);
          i = endIdx + tag.length;
          continue;
        }
      }
    }
    // Line comment: skip to end-of-line.
    if (sql[i] === '-' && sql[i + 1] === '-') {
      while (i < n && sql[i] !== '\n') i++;
      continue;
    }
    // Block comment: skip to */.
    if (sql[i] === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    // String literal: copy verbatim so that ; and -- inside strings are safe.
    if (sql[i] === "'" || sql[i] === '"') {
      const quote = sql[i];
      buf += sql[i];
      i++;
      while (i < n) {
        buf += sql[i];
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) {
            buf += sql[i + 1];
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (sql[i] === ';') {
      const stmt = buf.trim();
      if (stmt) statements.push(stmt);
      buf = '';
      i++;
      continue;
    }
    buf += sql[i];
    i++;
  }
  const tail = buf.trim();
  if (tail) statements.push(tail);
  return statements;
}

// ---------------------------------------------------------------------------
// Parenthesis-aware splitting
// ---------------------------------------------------------------------------

/** Split a comma-separated list at depth 0 of parens/quotes. */
function splitTopLevel(body, sep = ',') {
  const parts = [];
  let depth = 0;
  let buf = '';
  let i = 0;
  while (i < body.length) {
    const c = body[i];
    if (c === "'" || c === '"') {
      const quote = c;
      buf += c;
      i++;
      while (i < body.length) {
        buf += body[i];
        if (body[i] === quote) {
          if (body[i + 1] === quote) {
            buf += body[i + 1];
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (c === '(') {
      depth++;
      buf += c;
      i++;
      continue;
    }
    if (c === ')') {
      depth--;
      buf += c;
      i++;
      continue;
    }
    if (c === sep && depth === 0) {
      parts.push(buf);
      buf = '';
      i++;
      continue;
    }
    buf += c;
    i++;
  }
  if (buf.trim()) parts.push(buf);
  return parts;
}

/** Extract the parenthesised body of the first top-level ( ) group. */
function extractParenBody(s) {
  const start = s.indexOf('(');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') {
      depth--;
      if (depth === 0) {
        return { before: s.slice(0, start), body: s.slice(start + 1, i), after: s.slice(i + 1) };
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Record extraction
// ---------------------------------------------------------------------------

const TABLE_CONSTRAINT_STARTERS = /^(primary\s+key|unique|foreign\s+key|check|constraint)\b/;

function parseCreateTable(stmt) {
  // `create table [if not exists] <name> ( <body> )`
  const lower = lowerPreservingQuotes(stmt);
  const m = lower.match(/^create\s+table(?:\s+if\s+not\s+exists)?\s+([a-z0-9_."]+)\s*\(/);
  if (!m) return null;
  const name = m[1].replace(/"/g, '');
  const paren = extractParenBody(lower);
  if (!paren) return null;
  const parts = splitTopLevel(paren.body).map((p) => collapseWs(p));
  const columns = [];
  const tableConstraints = [];
  for (const part of parts) {
    if (!part) continue;
    if (TABLE_CONSTRAINT_STARTERS.test(part)) {
      tableConstraints.push(part);
    } else {
      // column def: first token = name, rest = type + constraints
      const tokens = part.split(/\s+/);
      const colName = tokens[0].replace(/"/g, '');
      const rest = tokens.slice(1).join(' ');
      columns.push({ name: colName, def: rest });
    }
  }
  columns.sort((a, b) => a.name.localeCompare(b.name));
  tableConstraints.sort();
  return { name, columns, tableConstraints };
}

function parseCreateIndex(stmt) {
  const lower = lowerPreservingQuotes(stmt);
  // create [unique] index [if not exists] <name> on <table> ...
  const m = lower.match(
    /^create\s+(unique\s+)?index(?:\s+if\s+not\s+exists)?\s+([a-z0-9_."]+)\s+on\s+([a-z0-9_."]+)\s*(.*)$/s
  );
  if (!m) return null;
  return {
    name: m[2].replace(/"/g, ''),
    table: m[3].replace(/"/g, ''),
    unique: !!m[1],
    body: collapseWs(m[4]),
  };
}

function parseAlterTable(stmt) {
  const lower = lowerPreservingQuotes(stmt);
  const rls = lower.match(/^alter\s+table\s+([a-z0-9_."]+)\s+enable\s+row\s+level\s+security\s*$/);
  if (rls) return { kind: 'rls', table: rls[1].replace(/"/g, '') };
  const pub = lower.match(
    /^alter\s+publication\s+([a-z0-9_."]+)\s+add\s+table\s+([a-z0-9_."]+)\s*$/
  );
  if (pub) {
    return {
      kind: 'publication',
      publication: pub[1].replace(/"/g, ''),
      table: pub[2].replace(/"/g, ''),
    };
  }
  // ALTER TABLE ... ADD COLUMN <name> <def...>
  const addCol = lower.match(
    /^alter\s+table(?:\s+if\s+exists)?\s+([a-z0-9_."]+)\s+add\s+(?:column\s+)?(?:if\s+not\s+exists\s+)?([a-z0-9_."]+)\s+(.*)$/s
  );
  if (addCol) {
    return {
      kind: 'addColumn',
      table: addCol[1].replace(/"/g, ''),
      column: addCol[2].replace(/"/g, ''),
      def: collapseWs(addCol[3]),
    };
  }
  // ALTER TABLE ... DROP COLUMN <name>
  const dropCol = lower.match(
    /^alter\s+table(?:\s+if\s+exists)?\s+([a-z0-9_."]+)\s+drop\s+(?:column\s+)?(?:if\s+exists\s+)?([a-z0-9_."]+)\b/
  );
  if (dropCol) {
    return {
      kind: 'dropColumn',
      table: dropCol[1].replace(/"/g, ''),
      column: dropCol[2].replace(/"/g, ''),
    };
  }
  return null;
}

function parseCreatePolicy(stmt) {
  const lower = lowerPreservingQuotes(stmt);
  // create policy "name" on <table> [for <cmd>] [using (...)] [with check (...)]
  const m = lower.match(
    /^create\s+policy\s+("[^"]+"|[a-z0-9_]+)\s+on\s+([a-z0-9_."]+)\s+(.*)$/s
  );
  if (!m) return null;
  const rawName = m[1];
  const name = rawName.startsWith('"') ? rawName.slice(1, -1) : rawName;
  const table = m[2].replace(/"/g, '');
  let body = collapseWs(m[3]);
  let command = 'all';
  const cmdMatch = body.match(/\bfor\s+(select|insert|update|delete|all)\b/);
  if (cmdMatch) command = cmdMatch[1];
  // Normalize body: lowercase, collapse, remove trailing semicolons.
  body = body.replace(/;+\s*$/, '');
  return { name, table, command, body };
}

function parseDoBlock(stmt) {
  const lower = lowerPreservingQuotes(stmt);
  if (!/^do\s+\$/.test(lower)) return null;
  // Check whether the DO block is specifically "alter publication ... add table X"
  // which is the only DO-block pattern in this schema. If so, emit a
  // publication record so it compares equal to plain ALTER PUBLICATION.
  const pub = lower.match(
    /alter\s+publication\s+([a-z0-9_."]+)\s+add\s+table\s+([a-z0-9_."]+)/
  );
  if (pub) {
    return {
      kind: 'publication',
      publication: pub[1].replace(/"/g, ''),
      table: pub[2].replace(/"/g, ''),
    };
  }
  // Fallback: opaque hash over normalized text (strip comments + whitespace).
  const normalized = collapseWs(stripComments(lower));
  const hash = createHash('sha256').update(normalized).digest('hex').slice(0, 16);
  return { kind: 'doBlock', hash };
}

// ---------------------------------------------------------------------------
// Build normalized schema model
// ---------------------------------------------------------------------------

function buildModel(sqlSource) {
  const model = {
    tables: new Map(),      // name -> { columns, tableConstraints }
    indexes: new Map(),     // name -> { table, unique, body }
    rls: new Set(),         // tableName
    policies: new Map(),    // `${table}::${name}` -> { command, body }
    publications: new Set(), // `${publication}::${table}`
    doBlocks: new Set(),    // hash
  };

  const statements = splitStatements(sqlSource);

  for (const stmt of statements) {
    const lower = lowerPreservingQuotes(stmt).trimStart();
    if (lower.startsWith('create table')) {
      const rec = parseCreateTable(stmt);
      if (rec) model.tables.set(rec.name, {
        columns: rec.columns,
        tableConstraints: rec.tableConstraints,
      });
      continue;
    }
    if (lower.startsWith('create index') || lower.startsWith('create unique index')) {
      const rec = parseCreateIndex(stmt);
      if (rec) model.indexes.set(rec.name, {
        table: rec.table,
        unique: rec.unique,
        body: rec.body,
      });
      continue;
    }
    if (lower.startsWith('alter table') || lower.startsWith('alter publication')) {
      const rec = parseAlterTable(stmt);
      if (!rec) continue;
      if (rec.kind === 'rls') {
        model.rls.add(rec.table);
      } else if (rec.kind === 'publication') {
        model.publications.add(`${rec.publication}::${rec.table}`);
      } else if (rec.kind === 'addColumn') {
        const t = model.tables.get(rec.table) || { columns: [], tableConstraints: [] };
        // Upsert column (replace if same name already present).
        const filtered = t.columns.filter((c) => c.name !== rec.column);
        filtered.push({ name: rec.column, def: rec.def });
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        model.tables.set(rec.table, { columns: filtered, tableConstraints: t.tableConstraints });
      } else if (rec.kind === 'dropColumn') {
        const t = model.tables.get(rec.table);
        if (t) {
          t.columns = t.columns.filter((c) => c.name !== rec.column);
          model.tables.set(rec.table, t);
        }
      }
      continue;
    }
    if (lower.startsWith('create policy')) {
      const rec = parseCreatePolicy(stmt);
      if (rec) {
        model.policies.set(`${rec.table}::${rec.name}`, {
          command: rec.command,
          body: rec.body,
        });
      }
      continue;
    }
    if (lower.startsWith('do ')) {
      const rec = parseDoBlock(stmt);
      if (!rec) continue;
      if (rec.kind === 'publication') {
        model.publications.add(`${rec.publication}::${rec.table}`);
      } else if (rec.kind === 'doBlock') {
        model.doBlocks.add(rec.hash);
      }
    }
  }

  return model;
}

// ---------------------------------------------------------------------------
// Diffing
// ---------------------------------------------------------------------------

function diffSets(aSet, bSet, labelA, labelB) {
  const onlyA = [];
  const onlyB = [];
  for (const v of aSet) if (!bSet.has(v)) onlyA.push(v);
  for (const v of bSet) if (!aSet.has(v)) onlyB.push(v);
  return { onlyA, onlyB, labelA, labelB };
}

function diffModels(migModel, schemaModel) {
  const issues = [];

  // Tables
  const migTableNames = new Set(migModel.tables.keys());
  const schemaTableNames = new Set(schemaModel.tables.keys());
  for (const t of migTableNames) {
    if (!schemaTableNames.has(t)) {
      issues.push(`table "${t}" exists in migrations but is MISSING from schema.sql`);
    }
  }
  for (const t of schemaTableNames) {
    if (!migTableNames.has(t)) {
      issues.push(`table "${t}" exists in schema.sql but is MISSING from migrations`);
    }
  }

  // Column diffs per shared table
  for (const t of migTableNames) {
    if (!schemaTableNames.has(t)) continue;
    const mig = migModel.tables.get(t);
    const sch = schemaModel.tables.get(t);
    const migCols = new Map(mig.columns.map((c) => [c.name, c.def]));
    const schCols = new Map(sch.columns.map((c) => [c.name, c.def]));
    for (const [name, def] of migCols) {
      if (!schCols.has(name)) {
        issues.push(`schema.sql is MISSING column "${name}" on table "${t}" (present in migrations as: ${def})`);
      } else if (schCols.get(name) !== def) {
        issues.push(
          `column "${t}.${name}" differs:\n    migrations: ${def}\n    schema.sql: ${schCols.get(name)}`
        );
      }
    }
    for (const [name, def] of schCols) {
      if (!migCols.has(name)) {
        issues.push(`schema.sql has extra column "${name}" on table "${t}" (not present in migrations; def: ${def})`);
      }
    }
    // Table-level constraints
    const migCons = new Set(mig.tableConstraints);
    const schCons = new Set(sch.tableConstraints);
    for (const c of migCons) {
      if (!schCons.has(c)) issues.push(`table "${t}" constraint MISSING from schema.sql: ${c}`);
    }
    for (const c of schCons) {
      if (!migCons.has(c)) issues.push(`table "${t}" has extra constraint in schema.sql: ${c}`);
    }
  }

  // Indexes
  const migIdx = new Set(migModel.indexes.keys());
  const schIdx = new Set(schemaModel.indexes.keys());
  for (const n of migIdx) {
    if (!schIdx.has(n)) issues.push(`index "${n}" MISSING from schema.sql`);
  }
  for (const n of schIdx) {
    if (!migIdx.has(n)) issues.push(`index "${n}" MISSING from migrations (extra in schema.sql)`);
  }
  for (const n of migIdx) {
    if (!schIdx.has(n)) continue;
    const mi = migModel.indexes.get(n);
    const si = schemaModel.indexes.get(n);
    if (mi.table !== si.table) {
      issues.push(`index "${n}" targets different tables: migrations=${mi.table} schema.sql=${si.table}`);
    }
    if (mi.unique !== si.unique) {
      issues.push(`index "${n}" UNIQUE flag differs: migrations=${mi.unique} schema.sql=${si.unique}`);
    }
    if (mi.body !== si.body) {
      issues.push(
        `index "${n}" body differs:\n    migrations: ${mi.body}\n    schema.sql: ${si.body}`
      );
    }
  }

  // RLS
  const rlsDiff = diffSets(migModel.rls, schemaModel.rls, 'migrations', 'schema.sql');
  for (const t of rlsDiff.onlyA) issues.push(`RLS enabled on "${t}" in migrations but NOT in schema.sql`);
  for (const t of rlsDiff.onlyB) issues.push(`RLS enabled on "${t}" in schema.sql but NOT in migrations`);

  // Policies
  const migPolKeys = new Set(migModel.policies.keys());
  const schPolKeys = new Set(schemaModel.policies.keys());
  for (const k of migPolKeys) {
    if (!schPolKeys.has(k)) issues.push(`policy "${k}" MISSING from schema.sql`);
  }
  for (const k of schPolKeys) {
    if (!migPolKeys.has(k)) issues.push(`policy "${k}" MISSING from migrations (extra in schema.sql)`);
  }
  for (const k of migPolKeys) {
    if (!schPolKeys.has(k)) continue;
    const mp = migModel.policies.get(k);
    const sp = schemaModel.policies.get(k);
    if (mp.command !== sp.command) {
      issues.push(`policy "${k}" command differs: migrations=${mp.command} schema.sql=${sp.command}`);
    }
    if (mp.body !== sp.body) {
      issues.push(
        `policy "${k}" body differs:\n    migrations: ${mp.body}\n    schema.sql: ${sp.body}`
      );
    }
  }

  // Publications
  const pubDiff = diffSets(migModel.publications, schemaModel.publications, 'migrations', 'schema.sql');
  for (const p of pubDiff.onlyA) issues.push(`publication entry "${p}" in migrations but NOT in schema.sql`);
  for (const p of pubDiff.onlyB) issues.push(`publication entry "${p}" in schema.sql but NOT in migrations`);

  return issues;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  let schemaSql;
  try {
    schemaSql = readFileSync(SCHEMA_PATH, 'utf8');
  } catch (err) {
    console.error(`error: could not read ${SCHEMA_PATH}: ${err.message}`);
    process.exit(1);
  }

  let migrationFiles;
  try {
    migrationFiles = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();
  } catch (err) {
    console.error(`error: could not read ${MIGRATIONS_DIR}: ${err.message}`);
    process.exit(1);
  }

  if (migrationFiles.length === 0) {
    console.error(`error: no migration files found in ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const concatenated = migrationFiles
    .map((f) => readFileSync(join(MIGRATIONS_DIR, f), 'utf8'))
    .join('\n');

  const migModel = buildModel(concatenated);
  const schemaModel = buildModel(schemaSql);

  const issues = diffModels(migModel, schemaModel);

  if (issues.length === 0) {
    const summary =
      `schema drift check: OK\n` +
      `  migrations: ${migrationFiles.length} files, ` +
      `${migModel.tables.size} tables, ${migModel.indexes.size} indexes, ` +
      `${migModel.policies.size} policies, ${migModel.publications.size} publication entries\n` +
      `  schema.sql: ${schemaModel.tables.size} tables, ${schemaModel.indexes.size} indexes, ` +
      `${schemaModel.policies.size} policies, ${schemaModel.publications.size} publication entries`;
    console.log(summary);
    process.exit(0);
  }

  console.error('schema drift detected between supabase/schema.sql and supabase/migrations/:');
  console.error('');
  for (const issue of issues) {
    console.error(`  - ${issue}`);
  }
  console.error('');
  console.error(`${issues.length} issue(s). Fix by regenerating schema.sql from migrations or by adding the missing migration.`);
  process.exit(1);
}

main();
