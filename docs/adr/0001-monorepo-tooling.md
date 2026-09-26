# 0001. pnpm workspaces + catalogs, Turborepo, source-compiled packages

- Status: Accepted
- Date: 2026-09-26
- Spec items: 1.1, 1.2, 1.3, 1.6, 12.1, 12.2

## Context

Two Expo apps and a dozen internal packages must share one dependency set, build only what
changed, and give a fast inner loop.

## Decision

- **pnpm workspaces** with isolated `node_modules` (no hoisting) so an app can't lean on a
  dependency it didn't declare (1.14). `auto-install-peers=false` keeps optional native modules
  out of the web app (1.11).
- **pnpm catalogs** (`pnpm-workspace.yaml`) hold every version once; workspaces reference
  `catalog:`. `overrides` hard-pin React / React Native / RN peers, and **syncpack** fails CI on
  drift (1.3).
- **Turborepo** for the task graph, caching, `--affected` runs and the remote cache (1.1, 12.1, 12.2).
- Internal packages export **TypeScript source** (`"exports": { ".": "./src/index.ts" }`), compiled
  by Metro / Babel in the consuming app — no build step (1.6). Expo's Metro config handles the
  symlinked workspace automatically (1.2).
- TypeScript **project references** (`tsc -b`) mirror the package graph; `tooling/scripts/sync-ts-references.mjs`
  keeps them in sync and CI checks it (13.27).

## Consequences

- Upgrades of Expo / React Native happen in one catalog edit (15.1).
- Packages can't be published as-is; if one ever is, add a build step and Changesets for it (12.5).
