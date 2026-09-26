# React Web & Native App Template

A production-shaped **Expo monorepo skeleton** for shipping a React Native mobile app and a web app
from shared code. It implements the
[Application Skeleton: Cross-Platform Expo Monorepo Design](https://cyberdash.atlassian.net/wiki/spaces/CYBERDASH/pages/753665)
spec end to end, with a deliberately tiny product on top — **Hello World** — so every layer
(auth, data, i18n, analytics, consent, deep links, tests, CI) is wired up and working before you
write your first feature.

- 📱 `apps/mobile` — Expo (iOS + Android), Expo Router, EAS Build / Submit / Update
- 🌐 `apps/web` — Expo for web, statically rendered, deployable anywhere static files go
- 📦 `packages/*` — shared domain, data, state, auth, UI, i18n, analytics, config and test utilities

➡️ **[Spec traceability](docs/spec-traceability.md)** maps every numbered spec item to the code that
implements it. **[ADRs](docs/adr)** record what is shared and what stays per platform.

## The hello world

|            | Web                                         | Mobile                                    |
| ---------- | ------------------------------------------- | ----------------------------------------- |
| Signed out | "Hello, world!" from the API                | same, plus an analytics consent card      |
| Sign in    | `ada@example.com` / `correct-horse-battery` | same (modal, screenshot-protected)        |
| Signed in  | "Hello, Ada Lovelace!" + paginated messages | same, in a FlashList with pull-to-refresh |
| Profile    | rename yourself (optimistic update)         | same                                      |
| Settings   | theme, language, analytics consent          | + biometric lock                          |
| Privacy    | cookie policy, data export, delete account  | data export (share sheet), delete account |
| Deep link  | `/messages/m_3`                             | `helloworld://messages/m_3`               |

## Quick start

Requirements: Node 22 (`.nvmrc`), pnpm 10 (`corepack enable`). For native builds: Xcode / Android
Studio, or an [EAS](https://expo.dev/eas) account.

```sh
pnpm install
pnpm mock-api                # seeded fake backend on http://localhost:4000 (keep running)

pnpm --filter web dev        # http://localhost:8081
pnpm --filter mobile dev     # Expo dev server → press i / a (needs a dev build: `pnpm --filter mobile ios`)
```

Copy `apps/<app>/.env.example` to `apps/<app>/.env.local` to point at a real API.

## Start a new product from this template

```sh
pnpm create-app --targets both --name my-product   # or: --targets web | mobile
```

Only the chosen apps stay under `apps/`; all shared packages remain. Change your mind later
without touching shared code:

```sh
pnpm gen add-target web       # restores apps/web, its workflow and web-only packages
pnpm gen remove-target mobile
pnpm gen package payments     # scaffold a new shared package (add --react for a React one)
```

Nothing hardcodes app names: root scripts and the CI matrix are derived from `apps/*`.

Then, the first things to replace:

1. **Domain** — `packages/domain/src/schemas.ts` (or generate from your OpenAPI / tRPC schema) and
   `packages/api-client/src/endpoints.ts`
2. **Screens** — `apps/*/app/**`
3. **Brand** — `packages/ui/src/tokens.ts`, app icons in `apps/mobile/assets` and `apps/web/public`
4. **Identity** — bundle id, scheme and domains in `apps/mobile/app.config.ts`; CSP `connect-src`
   in `apps/web/vercel.json`
5. **Vendors** — analytics SDK in `packages/analytics/src/sink.*.ts`, feature-flag provider in
   `packages/config`, Sentry DSNs in env
6. **Owners** — `.github/CODEOWNERS`

## Repository layout

```text
apps/
  mobile/            Expo app: app/ (routes), src/ (composition root, platform integrations),
                     __tests__/ (screen integration tests), e2e/ (Maestro flows), eas.json
  web/               Expo web app: app/, src/, __tests__/, e2e/ (Playwright), vercel.json
packages/
  domain/            Zod schemas & types, AppError, shared route map, notification payloads
  api-client/        fetch client: retries, timeouts, cancellation, interceptors, auth refresh; WebSocket client
  data/              TanStack Query hooks, keys, invalidation, network status
  state/             Zustand stores + persistence (MMKV / localStorage)
  auth/              auth state machine, session, token storage adapters, biometrics, OAuth
  ui/                tokens, theme, accessible primitives, ErrorBoundary, Storybook
  i18n/              i18next resources (en, es), Intl formatters, locale detection, RTL
  analytics/         event taxonomy, typed track(), consent gate, platform sinks
  config/            env schema, feature-flag keys + hook
  utils/             pure helpers, logger with PII scrubbing
  testing/           renderWithProviders, MSW mocks, fake backend, factories, fixtures (dev-only)
  contracts/         consumer contract tests against a live backend
  native-push/       mobile-only: push registration and routing
  web-pwa/           web-only: service worker, install prompt, web push
tooling/
  eslint-config/     shared flat config + dependency-boundary rules
  tsconfig/          strict base configs (project references)
  jest-config/       jest-expo presets: node / ios / android / web
  playwright-config/ shared Playwright config + fixtures (axe, sign-in, backend reset)
  maestro/           shared Maestro subflows
  mock-api/          seeded fake backend (local dev, contracts, E2E)
  generators/        create-app / gen
  scripts/           CI helpers, release, TS reference sync
```

## Commands

| Command                                    | What it does                                                         |
| ------------------------------------------ | -------------------------------------------------------------------- |
| `pnpm dev` / `build` / `test` / `lint`     | Turborepo across every workspace                                     |
| `pnpm check`                               | typecheck + lint + test, everything                                  |
| `pnpm test:affected`                       | only what changed vs. the base branch                                |
| `pnpm typecheck`                           | `tsc -b` over project references + each workspace's tests            |
| `pnpm --filter web e2e`                    | Playwright against the static export (run `pnpm --filter web build`) |
| `pnpm --filter mobile e2e`                 | Maestro flows against a running dev/e2e build                        |
| `pnpm --filter @repo/ui storybook`         | Storybook (react-native-web)                                         |
| `pnpm contracts`                           | contract tests (`CONTRACT_API_URL`, or the mock API)                 |
| `pnpm deps:check` / `deps:fix`             | one version of every dependency (syncpack)                           |
| `pnpm i18n:check`                          | missing / stale translation keys                                     |
| `pnpm graph`                               | package dependency graph → `dependency-graph.html`                   |
| `pnpm release <app> <patch\|minor\|major>` | bump, changelog, tag `<app>@x.y.z`                                   |

## How it fits together

- **Shared vs platform** ([ADR 0002](docs/adr/0002-shared-vs-platform.md)): packages expose one API;
  platform differences live in `*.native.ts` / `*.web.ts` files that Metro and Jest pick per platform.
  ESLint blocks `react-native` / DOM usage anywhere else in shared code, apps importing each
  other, and source importing `@repo/testing`.
- **Composition roots**: each app's `src/services.ts` wires shared packages to its platform
  adapters (SecureStore vs httpOnly cookie, MMKV vs localStorage, native vs browser analytics sink).
- **Auth** ([ADR 0004](docs/adr/0004-auth-token-storage.md)): one state machine; mobile keeps the
  refresh token in the Keychain/Keystore, web never exposes it to JavaScript.
- **Testing** ([ADR 0006](docs/adr/0006-testing-architecture.md)): unit tests in Node or per
  platform, component tests with the real providers, integration against MSW, contracts against a
  live backend, E2E with Playwright (web) and Maestro (mobile) — all seeded from the same fixtures.

## CI/CD

| Workflow      | Runs                                                                                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`      | every PR: version drift, format, i18n keys, `tsc -b`, typecheck + lint + tests (affected), changed-file coverage, isolated per-app install/test, Storybook a11y + Chromatic, Reassure, dependency review |
| `web.yml`     | when web's graph changed: static export → Playwright (4 browsers/viewports) → Lighthouse → PR preview; `main` → production deploy (held behind the `web-production` environment)                         |
| `mobile.yml`  | when mobile's graph changed: bundle check; `main` → OTA to preview + Maestro device matrix; `mobile@*` tag → store build + submit                                                                        |
| `nightly.yml` | full suite, `pnpm audit`, dependency graph                                                                                                                                                               |

External services are opt-in: jobs that need Vercel, EAS, Sentry, Chromatic, Maestro Cloud or
Flashlight skip until their secrets / variables are set (see each workflow's `env`).

## License

Internal template — add a license before distributing.
