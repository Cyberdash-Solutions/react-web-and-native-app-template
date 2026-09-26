#!/usr/bin/env node
// 1.10 — Prints the apps that exist under apps/* as JSON, e.g. for the CI matrix:
//   pnpm -s apps:list  →  ["mobile","web"]
import path from 'node:path';

import { listApps } from './workspaces.mjs';

const apps = listApps(path.resolve(import.meta.dirname, '../..')).map((a) => a.folder);
console.log(JSON.stringify(apps));
