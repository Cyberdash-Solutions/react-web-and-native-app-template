# 0008. Consolidate shared code into three packages

- Status: Accepted
- Date: 2026-09-26
- Spec items: repository layout, 1.4, 1.6, 1.11, 13.2–13.5, 13.23, 13.27
- Supersedes: the per-concern package list in the spec's repository layout, and the package
  columns of [ADR 0001](0001-monorepo-tooling.md) / [ADR 0002](0002-shared-vs-platform.md)

## Context

The first version followed the spec's layout literally: 14 shared packages (`domain`,
`api-client`, `data`, `state`, `auth`, `ui`, `i18n`, `analytics`, `config`, `utils`, `testing`,
`contracts`, `native-push`, `web-pwa`) plus a `mock-api` tooling package. Together they held about
3,300 lines of source but needed 71 config files (`package.json`, two `tsconfig`s, ESLint and Jest
config each), their own dependency lists and TypeScript project references. A typical feature —
a new API field used by `auth` and `data` — touched several manifests, and a dependency upgrade
had to be repeated in each package that declared it. The overhead was in the package plumbing,
not in sharing the code.

Moving the code into each app instead would trade that plumbing for duplicated logic in two
places that drift apart; making the product web-only would drop the mobile target. Neither
matches the goal (one codebase, two apps, cheap updates).

## Decision

Shared code lives in **three packages**:

| Package         | Contents                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `@repo/core`    | every shared concern as a folder: `domain`, `api-client`, `data`, `state`, `auth`, `i18n`, `analytics`, `config`, `utils` |
| `@repo/ui`      | the design system (kept separate: it has its own Storybook, visual and a11y pipeline)                                     |
| `@repo/testing` | dev-only test utilities, the fake backend + mock API server, and the API contract tests                                   |

Platform-exclusive code moved into the app that uses it: push registration →
`apps/mobile/src/push.ts`; service worker, install prompt and web push → `apps/web/src/pwa.ts`
and `apps/web/public/sw.js`.

What the separate packages used to guarantee is kept, without the manifests:

- **Import paths per concern** — subpath exports: `@repo/core/auth`, `@repo/core/data`, … Apps
  never import a barrel of everything, so bundles stay tree-shakeable (7.2).
- **Boundaries** — `packages/core/eslint.config.mjs` declares each folder as an _area_:
  `pure` areas (domain, utils, config, api-client) may not import React or platform modules, and
  each area lists what it may import (`data` → `api-client`, `domain`, `utils`; `domain` → nothing).
  A disallowed import fails lint just like an undeclared package dependency used to.
- **Platform splits** — `*.native.ts` / `*.web.ts` work exactly as before inside `core`.
- **Tests** — `packages/core/jest.config.js` runs the pure areas in Node and the areas with
  platform splits as ios / android / web projects (13.4, 13.5).
- **Coverage bars** — path-level `coverageThreshold` for domain / data / auth, and per-folder
  changed-file bars in `packages/core/package.json` (13.23).
- **Ownership** — CODEOWNERS entries per folder (1.7).
- **New concerns** — `pnpm gen area <name>` adds a folder and its export instead of a package.

## Consequences

- 71 → 15 package config files; one dependency list for all shared logic; the TypeScript
  reference graph is `core` + `ui`.
- The test-only dependency cycle ([ADR 0006](0006-testing-architecture.md)) shrinks to
  `core`/`ui` ↔ `testing`.
- Turborepo caches `core` as one unit: a change to any shared folder re-runs `core`'s tests
  (≈ 20 s) instead of one small package's. `--affected` still skips an app that didn't change.
- If a folder ever needs to be published or versioned on its own, extract it back into a package;
  its area rules already describe its dependencies.
