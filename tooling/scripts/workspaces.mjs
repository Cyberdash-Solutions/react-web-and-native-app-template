import fs from 'node:fs';
import path from 'node:path';

/** All workspaces (apps/*, packages/*, tooling/*) with their package.json. */
export function listWorkspaces(root) {
  return ['apps', 'packages', 'tooling'].flatMap((group) => {
    const dir = path.join(root, group);
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'package.json')))
      .map((d) => {
        const wsDir = path.join(dir, d.name);
        const pkg = JSON.parse(fs.readFileSync(path.join(wsDir, 'package.json'), 'utf8'));
        return { name: pkg.name, dir: wsDir, group, folder: d.name, pkg };
      });
  });
}

/** 1.10 — apps are discovered, never hardcoded. */
export function listApps(root) {
  return listWorkspaces(root).filter((w) => w.group === 'apps');
}
