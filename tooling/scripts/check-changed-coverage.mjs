#!/usr/bin/env node
// 13.23 — Fail on a coverage *drop* in changed files rather than on a global percentage.
//
//   - A file that existed on the base branch (modified, or renamed with edits) fails only if its
//     line coverage is lower than the base branch's coverage of the same file. Touching an
//     under-tested file doesn't force new tests; making it worse does.
//   - A new file must meet its bar: package.json → "coverage": { "changedFiles": <lines %> }, or
//     per folder: { "changedFiles": { "src/domain/": 90, "default": 70 } } (longest prefix wins).
//
// Base coverage comes from the `coverage` artifact that CI uploads on every push to main
// (--baseline <dir> with the downloaded coverage-summary.json files). Without a baseline for an
// existing file the check can't tell whether it dropped: it's reported, not failed.
//
//   node tooling/scripts/check-changed-coverage.mjs --base <sha> [--baseline <dir>]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { listWorkspaces } from './workspaces.mjs';

const { values } = parseArgs({
  options: {
    base: { type: 'string', default: 'origin/main' },
    baseline: { type: 'string' },
  },
});
const root = path.resolve(import.meta.dirname, '../..');
const DEFAULT_BAR = 70;
const EPSILON = 0.1; // percentage points of noise tolerated

// A base without a workspace (the repository's first PR) has no coverage to drop from.
try {
  execFileSync('git', ['cat-file', '-e', `${values.base}:package.json`], {
    cwd: root,
    stdio: 'ignore',
  });
} catch {
  console.log(`Base ${values.base} has no workspace yet; nothing to compare against.`);
  process.exit(0);
}

/** Coverage summaries key files by absolute path; reduce them to repo-relative paths. */
const repoRelative = (absolute) => {
  if (absolute.startsWith(root + path.sep)) return path.relative(root, absolute);
  const match = absolute.match(/(?:^|\/)((?:apps|packages|tooling)\/.+)$/);
  return match ? match[1] : null;
};

/** Merges every coverage-summary.json under `dir` into { repoRelativePath: linesPct }. */
function loadCoverage(dir) {
  const result = new Map();
  if (!dir || !fs.existsSync(dir)) return result;
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') walk(p);
      } else if (entry.name === 'coverage-summary.json') {
        for (const [file, data] of Object.entries(JSON.parse(fs.readFileSync(p, 'utf8')))) {
          const rel = file === 'total' ? null : repoRelative(file);
          if (rel) result.set(rel, data.lines.pct);
        }
      }
    }
  };
  walk(dir);
  return result;
}

/** Pure re-export entry points (`export * from …`) have no logic of their own to cover. */
const isReExportOnly = (file) =>
  fs
    .readFileSync(path.join(root, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
    .replace(/export\s+(type\s+)?(\*|\{[^}]*\})\s+from\s+['"][^'"]+['"];?/g, '')
    .trim() === '';

// Added, modified, and renamed-with-edits files (a pure move, R100, has nothing new to cover).
const changes = execFileSync(
  'git',
  ['diff', '--name-status', '--find-renames', '--diff-filter=AMR', `${values.base}...HEAD`],
  { cwd: root, encoding: 'utf8' },
)
  .split('\n')
  .map((line) => line.split('\t'))
  .filter(([status]) => status && status !== 'R100')
  .map(([status, ...paths]) => ({
    status: status[0], // A | M | R
    file: paths[paths.length - 1],
    basePath: status[0] === 'A' ? null : paths[0],
  }))
  .filter(
    ({ file }) =>
      /\.(ts|tsx)$/.test(file) &&
      !/\.(test|stories|perf-test)\.tsx?$|\.d\.ts$|__tests__|\/e2e\//.test(file) &&
      !isReExportOnly(file),
  );

const baseline = loadCoverage(values.baseline && path.resolve(values.baseline));
const current = new Map();
for (const ws of listWorkspaces(root)) {
  const summary = path.join(ws.dir, 'coverage/coverage-summary.json');
  if (!fs.existsSync(summary)) continue;
  for (const [file, data] of Object.entries(JSON.parse(fs.readFileSync(summary, 'utf8')))) {
    const rel = file === 'total' ? null : repoRelative(file);
    if (rel) current.set(rel, data.lines.pct);
  }
}
if (values.baseline) console.log(`Baseline: ${baseline.size} files from ${values.baseline}\n`);

let failures = 0;
let checked = 0;
let unknown = 0;
for (const ws of listWorkspaces(root)) {
  const bars = ws.pkg.coverage?.changedFiles ?? DEFAULT_BAR;
  const barFor = (rel) => {
    if (typeof bars === 'number') return bars;
    const prefix = Object.keys(bars)
      .filter((k) => k !== 'default' && rel.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    return prefix ? bars[prefix] : (bars.default ?? DEFAULT_BAR);
  };
  for (const { status, file, basePath } of changes) {
    if (!path.join(root, file).startsWith(ws.dir + path.sep)) continue;
    const pct = current.get(file);
    if (pct === undefined) continue; // not collected (e.g. app routes outside collectCoverageFrom)
    checked++;

    if (status === 'A') {
      const bar = barFor(path.relative(ws.dir, path.join(root, file)));
      if (pct < bar) {
        failures++;
        console.error(`✖ ${file} (new): ${pct}% lines covered, bar ${bar}%`);
      } else console.log(`✔ ${file} (new): ${pct}%`);
      continue;
    }

    const before = baseline.get(basePath);
    if (before === undefined) {
      unknown++;
      console.log(`• ${file}: ${pct}% (no baseline for ${basePath})`);
    } else if (pct + EPSILON < before) {
      failures++;
      console.error(`✖ ${file}: coverage dropped ${before}% → ${pct}%`);
    } else {
      console.log(`✔ ${file}: ${before}% → ${pct}%`);
    }
  }
}
console.log(
  `\n${checked} changed file(s) checked: ${failures} failing, ${unknown} without a baseline.`,
);
process.exit(failures ? 1 : 0);
