import { routes } from '@repo/domain';
import fs from 'node:fs';
import path from 'node:path';

// 2.4 / 11.3 — every route in the shared deep-link map has a screen in this app, so a
// notification or universal link can never land on "not found".
const appDir = path.join(__dirname, '../app');
const toFile = (p: string) => (p === '/' ? 'index' : p.slice(1).replace(/:(\w+)/g, '[$1]'));

it.each(Object.entries(routes))('%s → app%s', (_name, { path: routePath }) => {
  const base = path.join(appDir, toFile(routePath));
  expect(fs.existsSync(`${base}.tsx`) || fs.existsSync(path.join(base, 'index.tsx'))).toBe(true);
});
