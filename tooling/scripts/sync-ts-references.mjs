#!/usr/bin/env node
// 13.27 — Keeps TypeScript project references in sync with package.json dependencies, so the
// `tsc -b` graph always matches the workspace graph. `--check` fails (CI) instead of writing.
import fs from 'node:fs';
import path from 'node:path';

import { listWorkspaces } from './workspaces.mjs';

const check = process.argv.includes('--check');
const root = path.resolve(import.meta.dirname, '../..');
const workspaces = listWorkspaces(root);
const byName = new Map(workspaces.map((w) => [w.name, w]));
const isComposite = (w) => {
  const file = path.join(w.dir, 'tsconfig.json');
  if (!fs.existsSync(file)) return false;
  const text = fs.readFileSync(file, 'utf8');
  return !/"composite"\s*:\s*false/.test(text);
};

let drift = [];
const rootRefs = [];
for (const ws of workspaces) {
  if (!isComposite(ws)) continue;
  rootRefs.push(path.relative(root, ws.dir));
  // devDependencies count too, except @repo/testing: composite projects exclude tests, and no
  // source file may import it (13.3), so it never belongs in the build graph.
  const deps = { ...ws.pkg.dependencies, ...ws.pkg.peerDependencies, ...ws.pkg.devDependencies };
  const refs = Object.keys(deps)
    .filter((d) => d !== '@repo/testing' && byName.has(d) && isComposite(byName.get(d)))
    .map((d) => path.relative(ws.dir, byName.get(d).dir))
    .sort();
  const file = path.join(ws.dir, 'tsconfig.json');
  const tsconfig = JSON.parse(fs.readFileSync(file, 'utf8'));
  const current = (tsconfig.references ?? []).map((r) => r.path).sort();
  if (JSON.stringify(current) !== JSON.stringify(refs)) {
    drift.push(ws.name);
    if (!check) {
      if (refs.length) tsconfig.references = refs.map((p) => ({ path: p }));
      else delete tsconfig.references;
      fs.writeFileSync(file, JSON.stringify(tsconfig, null, 2) + '\n');
    }
  }
}

const rootFile = path.join(root, 'tsconfig.json');
const rootConfig = JSON.parse(fs.readFileSync(rootFile, 'utf8').replace(/^\s*\/\/.*$/gm, ''));
const wanted = rootRefs.sort();
if (
  JSON.stringify((rootConfig.references ?? []).map((r) => r.path).sort()) !== JSON.stringify(wanted)
) {
  drift.push('<root>');
  if (!check) {
    rootConfig.references = wanted.map((p) => ({ path: p }));
    fs.writeFileSync(rootFile, JSON.stringify(rootConfig, null, 2) + '\n');
  }
}

if (drift.length) {
  console[check ? 'error' : 'log'](`${check ? '✖ out of sync' : '✔ updated'}: ${drift.join(', ')}`);
  if (check) {
    console.error('Run `pnpm ts:refs` to fix.');
    process.exit(1);
  }
} else {
  console.log('✔ TypeScript project references are in sync');
}
