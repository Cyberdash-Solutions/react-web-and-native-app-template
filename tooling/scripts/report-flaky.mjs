#!/usr/bin/env node
// 13.24 — Tests that failed and then passed on their single retry are flaky. They are never
// silently accepted: each one gets a tracking issue (label "flaky-test"); repeat offenders are
// quarantined with test.fixme / it.skip *referencing that issue* in a follow-up PR.
//   node tooling/scripts/report-flaky.mjs <playwright results.json>
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const file = process.argv[2];
if (!file || !fs.existsSync(file)) process.exit(0);
const report = JSON.parse(fs.readFileSync(file, 'utf8'));

const flaky = [];
const walk = (suite, titles = []) => {
  for (const s of suite.suites ?? []) walk(s, [...titles, s.title]);
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? [])
      if (t.status === 'flaky')
        flaky.push(`${[...titles, spec.title].filter(Boolean).join(' › ')} [${t.projectName}]`);
  }
};
walk(report);

if (!flaky.length) {
  console.log('No flaky tests.');
  process.exit(0);
}
console.warn(`Flaky tests (passed only on retry):\n  ${flaky.join('\n  ')}`);
if (!process.env.GH_TOKEN) process.exit(0);
for (const title of flaky) {
  const issueTitle = `Flaky test: ${title}`;
  const existing = execFileSync(
    'gh',
    [
      'issue',
      'list',
      '--label',
      'flaky-test',
      '--state',
      'open',
      '--search',
      `"${issueTitle}" in:title`,
      '--json',
      'number',
    ],
    { encoding: 'utf8' },
  );
  const [hit] = JSON.parse(existing);
  const body = `Passed only on retry in ${process.env.GITHUB_SERVER_URL ?? ''}/${process.env.GITHUB_REPOSITORY ?? ''}/actions/runs/${process.env.GITHUB_RUN_ID ?? ''}`;
  if (hit) execFileSync('gh', ['issue', 'comment', String(hit.number), '--body', body]);
  else
    execFileSync('gh', [
      'issue',
      'create',
      '--title',
      issueTitle,
      '--label',
      'flaky-test',
      '--body',
      body,
    ]);
}
