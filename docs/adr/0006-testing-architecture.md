# 0006. Testing architecture

- Status: Accepted
- Date: 2026-09-26
- Spec items: 13.1–13.27

## Decision

- **Jest + jest-expo** (`tooling/jest-config`): pure code runs in plain Node (`node()`);
  code with platform splits runs as `ios` / `android` / `web` projects (`universal()`), so
  `.native.ts` and `.web.ts` splits are each exercised on their own platform. In `@repo/core`
  the split is per folder (`packages/core/jest.config.js`).
- **Component tests**: `*.test.tsx` use React Native Testing Library and run on the native
  projects; web-only components and the web app's screens use React Testing Library
  (`@repo/testing/render-web`, `*.web.test.tsx` in packages).
- **Contracts**: `packages/testing/contracts` validate a live backend against the Zod schemas
  ([ADR 0007](0007-api-contracts.md)).
- **Integration**: `@repo/testing/mocks/backend.ts` is one in-memory fake backend behind both the
  MSW handlers (unit/integration tests) and `packages/testing/mock-api` (local dev, contract tests, E2E).
  Fixtures are JSON in `packages/testing/fixtures`, validated against the Zod schemas.
- **E2E**: Playwright on the static web export (Chromium, WebKit, Firefox, mobile viewport, axe);
  Maestro flows on EAS builds with shared subflows in `tooling/maestro`.

### The intentional `@repo/testing` dev-dependency cycle

`renderWithProviders` wraps components in the _real_ providers (13.8), so `@repo/testing`
dev-depends on `@repo/core` and `@repo/ui`, while those packages' tests use `@repo/testing`. This is a
**test-time-only** cycle: composite TypeScript projects exclude tests, `@repo/testing` is not in
the `tsc -b` graph, and ESLint forbids importing it from source (13.3). pnpm and Turborepo print a
cycle warning for it; any _other_ cycle is a bug.
