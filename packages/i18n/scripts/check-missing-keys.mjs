#!/usr/bin/env node
// 10.2 — Fails when any locale is missing a key present in the source locale (en), or has
// keys the source doesn't (stale translations). Run in CI via `pnpm i18n:check`.
import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(import.meta.dirname, '../src/locales');
const source = 'en';
const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
const load = (l) =>
  new Set(flatten(JSON.parse(fs.readFileSync(path.join(dir, `${l}.json`), 'utf8'))));

const sourceKeys = load(source);
let failed = false;
for (const file of fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.json') && f !== `${source}.json`)) {
  const locale = path.basename(file, '.json');
  const keys = load(locale);
  const missing = [...sourceKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !sourceKeys.has(k));
  if (missing.length || extra.length) {
    failed = true;
    if (missing.length)
      console.error(`✖ ${locale}: missing ${missing.length} key(s):\n  ${missing.join('\n  ')}`);
    if (extra.length)
      console.error(`✖ ${locale}: ${extra.length} stale key(s):\n  ${extra.join('\n  ')}`);
  } else {
    console.log(`✔ ${locale}: ${keys.size} keys`);
  }
}
process.exit(failed ? 1 : 0);
