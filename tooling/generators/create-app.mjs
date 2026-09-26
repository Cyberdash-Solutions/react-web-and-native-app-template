#!/usr/bin/env node
// 1.8 — Choose deployment targets at scaffold time:
//   pnpm create-app --targets mobile|web|both [--name my-product] [--dry-run] [--skip-install]
// Only the chosen apps remain under apps/. packages/ stays intact (shared packages are
// target-agnostic); platform-scoped packages go with their target (1.11). Nothing else needs
// editing afterwards: scripts and CI are derived from apps/* (1.10).
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { presentTargets, removeTarget, ROOT, syncWorkspace, TARGET_NAMES } from './targets.mjs';

const { values } = parseArgs({
  options: {
    targets: { type: 'string' },
    name: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    'skip-install': { type: 'boolean', default: false },
  },
});

const choice = values.targets;
if (!choice || !['mobile', 'web', 'both'].includes(choice)) {
  console.error('Usage: pnpm create-app --targets mobile|web|both [--name <product>] [--dry-run]');
  process.exit(1);
}
const keep = choice === 'both' ? TARGET_NAMES : [choice];
const missing = keep.filter((t) => !presentTargets().includes(t));
if (missing.length) {
  console.error(
    `Target(s) not present to keep: ${missing.join(', ')}. Use \`pnpm gen add-target <target>\` instead.`,
  );
  process.exit(1);
}

console.log(`Scaffolding for: ${keep.join(' + ')}`);
for (const target of TARGET_NAMES.filter((t) => !keep.includes(t))) {
  console.log(`Removing target "${target}":`);
  removeTarget(target, { dryRun: values['dry-run'] });
}

if (values.name && !values['dry-run']) {
  const pkgFile = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  pkg.name = values.name;
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n');
  console.log(
    `Renamed workspace to "${values.name}". Rename app display names in apps/*/app.config.ts.`,
  );
}

if (!values['dry-run']) syncWorkspace({ install: !values['skip-install'] });
