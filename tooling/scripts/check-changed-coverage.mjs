#!/usr/bin/env node
// 13.23 — Fail on a coverage drop in *changed files* rather than on a global percentage.
// Each workspace declares its bar in package.json → "coverage": { "changedFiles": <lines %> }
// (defaults below); domain, data and auth carry the highest bars.
//   node tooling/scripts/check-changed-coverage.mjs --base <sha>
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { listWorkspaces } from './workspaces.mjs';

const { values } = parseArgs({ options: { base: { type: 'string', default: 'origin/main' } } });
const root = path.resolve(import.meta.dirname, '../..');
const DEFAULT_BAR = 70;

const changed = execFileSync(
  'git',
  ['diff', '--name-only', '--diff-filter=AM', `${values.base}...HEAD`],
  { cwd: root, encoding: 'utf8' },
)
  .split('\n')
  .filter(
    (f) =>
      /\.(ts|tsx)$/.test(f) &&
      !/\.(test|stories|perf-test)\.tsx?$|\.d\.ts$|__tests__|\/e2e\//.test(f),
  );

let failures = 0;
let checked = 0;
for (const ws of listWorkspaces(root)) {
  const summaryFile = path.join(ws.dir, 'coverage/coverage-summary.json');
  const mine = changed.filter((f) => path.join(root, f).startsWith(ws.dir + path.sep));
  if (!mine.length || !fs.existsSync(summaryFile)) continue;
  const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
  const bar = ws.pkg.coverage?.changedFiles ?? DEFAULT_BAR;
  for (const file of mine) {
    const entry = summary[path.join(root, file)];
    if (!entry) continue; // not collected (e.g. app route files outside collectCoverageFrom)
    checked++;
    const pct = entry.lines.pct;
    if (pct < bar) {
      failures++;
      console.error(`✖ ${file}: ${pct}% lines covered (bar for ${ws.name}: ${bar}%)`);
    } else {
      console.log(`✔ ${file}: ${pct}%`);
    }
  }
}
console.log(`\n${checked} changed file(s) checked, ${failures} below their package's bar.`);
process.exit(failures ? 1 : 0);
