#!/usr/bin/env node
// 1.17 / 12.5 — Apps release independently: bump one app's version, prepend its changelog and
// tag `<app>@<version>` (the same string is the Sentry release name). The tag triggers that
// app's pipeline only. Internal packages are not published, so there are no changesets.
//   pnpm release <app> <patch|minor|major> [--dry-run]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { listApps } from './workspaces.mjs';

const [appName, bump = 'patch', ...rest] = process.argv.slice(2);
const dryRun = rest.includes('--dry-run');
const root = path.resolve(import.meta.dirname, '../..');
const app = listApps(root).find((a) => a.folder === appName);
if (!app || !['patch', 'minor', 'major'].includes(bump)) {
  console.error(
    `Usage: pnpm release <${listApps(root)
      .map((a) => a.folder)
      .join('|')}> <patch|minor|major> [--dry-run]`,
  );
  process.exit(1);
}

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const [major, minor, patch] = app.pkg.version.split('.').map(Number);
const next =
  bump === 'major'
    ? `${major + 1}.0.0`
    : bump === 'minor'
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;
const tag = `${app.folder}@${next}`;

// Changes since the app's last release that touched the app or anything it depends on.
const lastTag = (() => {
  try {
    return git('describe', '--tags', '--abbrev=0', '--match', `${app.folder}@*`);
  } catch {
    return null;
  }
})();
const deps = Object.keys({ ...app.pkg.dependencies })
  .filter((d) => d.startsWith('@repo/'))
  .map((d) => `packages/${d.slice(6)}`);
const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
const log = git(
  'log',
  range,
  '--no-merges',
  '--format=- %s (%h)',
  '--',
  `apps/${app.folder}`,
  ...deps.filter((d) => fs.existsSync(path.join(root, d))),
);

const entry = `## ${next} — ${new Date().toISOString().slice(0, 10)}\n\n${log || '- Maintenance release'}\n\n`;
console.log(`${app.folder}: ${app.pkg.version} → ${next}\n\n${entry}`);
if (dryRun) process.exit(0);

const pkgFile = path.join(app.dir, 'package.json');
fs.writeFileSync(pkgFile, JSON.stringify({ ...app.pkg, version: next }, null, 2) + '\n');
const changelog = path.join(app.dir, 'CHANGELOG.md');
const previous = fs.existsSync(changelog)
  ? fs.readFileSync(changelog, 'utf8').replace(/^# Changelog\n\n/, '')
  : '';
fs.writeFileSync(changelog, `# Changelog\n\n${entry}${previous}`);
git('add', pkgFile, changelog);
git('commit', '-m', `release: ${tag}`);
git('tag', '-a', tag, '-m', tag);
console.log(`Tagged ${tag}. Push with: git push --follow-tags`);
