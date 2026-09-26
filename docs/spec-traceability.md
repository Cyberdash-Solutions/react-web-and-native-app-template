# Spec traceability

Where each numbered item of the design spec
([Application Skeleton: Cross-Platform Expo Monorepo Design](https://cyberdash.atlassian.net/wiki/spaces/CYBERDASH/pages/753665))
lives in this template.

**Status legend**

- ✅ Implemented and exercised by tests or a local build in this repo
- 🔌 Implemented and wired into CI/config, but needs an external account or secret to run
  (EAS, Vercel, Sentry, Chromatic, Maestro Cloud, …); the job skips cleanly until configured
- 🧩 An explicit, documented extension point: the interface and call site exist, the vendor
  implementation is deliberately left to the product (e.g. which analytics SDK)

## 1. Monorepo foundation

| #    | Item                                          | Where                                                                                                         | Status  |
| ---- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------- |
| 1.1  | pnpm workspaces + Turborepo                   | `pnpm-workspace.yaml`, `turbo.json`, [ADR 0001](adr/0001-monorepo-tooling.md)                                 | ✅      |
| 1.2  | Metro config for symlinked packages           | `apps/*/metro.config.js` (Expo monorepo defaults)                                                             | ✅      |
| 1.3  | One React / RN / RNW version                  | pnpm `catalog:` + `overrides` in `pnpm-workspace.yaml`; `pnpm deps:check` (syncpack) in CI                    | ✅      |
| 1.4  | No RN / DOM in shared packages unless split   | `tooling/eslint-config` (`no-restricted-imports`, `no-restricted-globals`)                                    | ✅      |
| 1.5  | `.native.ts` / `.web.ts` splits               | e.g. `packages/state/src/storage.*.ts`, `packages/auth/src/token-storage.*.ts`                                | ✅      |
| 1.6  | Packages compiled from source                 | `"exports": { ".": "./src/index.ts" }` in every package                                                       | ✅      |
| 1.7  | CODEOWNERS                                    | `.github/CODEOWNERS`                                                                                          | ✅      |
| 1.8  | `pnpm create-app --targets mobile\|web\|both` | `tooling/generators/create-app.mjs`                                                                           | ✅      |
| 1.9  | `pnpm gen add-target` / `remove-target`       | `tooling/generators/gen.mjs` (restores from git history or the template repo)                                 | ✅      |
| 1.10 | Nothing hardcodes app names                   | root scripts are `turbo run …`; CI matrix from `tooling/scripts/list-apps.mjs`                                | ✅      |
| 1.11 | Platform-scoped packages                      | `packages/native-push` (mobile), `packages/web-pwa` (web); lint forbids cross use; `auto-install-peers=false` | ✅      |
| 1.12 | Self-contained apps                           | each app: `package.json`, `app.config.ts`, version, `.env.example`, `src/env.ts`, `eas.json` / `vercel.json`  | ✅      |
| 1.13 | Apps never import each other                  | ESLint rule in `tooling/eslint-config`                                                                        | ✅      |
| 1.14 | Each app installs/builds/tests in isolation   | `isolation` job in `.github/workflows/ci.yml` (`--filter <app>...`)                                           | ✅      |
| 1.15 | Independent pipelines                         | `.github/workflows/web.yml`, `mobile.yml` (turbo-ignore gating, separate deploy environments)                 | 🔌      |
| 1.16 | EAS Build/Submit/Update; static web export    | `apps/mobile/eas.json`, `mobile.yml`; `expo export --platform web` in `apps/web`                              | ✅ / 🔌 |
| 1.17 | Per-app release identity                      | `pnpm release <app> <bump>` → tag `<app>@x.y.z`, `CHANGELOG.md`, Sentry release `<app>@x.y.z`                 | ✅      |
| 1.18 | Per-app environments and secrets              | GitHub environments `web-*` / `mobile-*` in workflows; per-app `.env.example`                                 | 🔌      |

**1.11 caveat:** an app's own dependency tree carries no modules for the other platform, and
`create-app` / `remove-target` delete the other platform's scoped package. Shared packages keep
their platform adapters as _optional peers_, dev-installed only so their `.native.ts` / `.web.ts`
splits can be tested — e.g. a web-only repo still dev-installs `react-native-mmkv` for
`packages/state`. None of it reaches the web bundle.

## 2. Architecture and code organization

| #   | Item                                    | Where                                                                             | Status |
| --- | --------------------------------------- | --------------------------------------------------------------------------------- | ------ |
| 2.1 | Domain logic, Zod schemas, API contract | `packages/domain` (swap for OpenAPI/tRPC codegen)                                 | ✅     |
| 2.2 | TanStack Query hooks and keys           | `packages/data`                                                                   | ✅     |
| 2.3 | Client state with platform persistence  | `packages/state` (Zustand; MMKV / localStorage)                                   | ✅     |
| 2.4 | Per-app navigation, shared route map    | Expo Router in each app; `packages/domain/src/routes.ts`; route-map tests per app | ✅     |
| 2.5 | Solito / unified navigation (option)    | Not adopted — [ADR 0005](adr/0005-navigation.md)                                  | —      |

## 3. Networking and data

| #   | Item                                         | Where                                                                                         | Status |
| --- | -------------------------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| 3.1 | One api-client                               | `packages/api-client/src/client.ts`                                                           | ✅     |
| 3.2 | Pagination, optimistic updates, invalidation | `packages/data/src/hooks.ts`, `keys.ts`                                                       | ✅     |
| 3.3 | Offline/persistence adapters; network status | `packages/state` adapters; `packages/data/src/network.native.ts` / `.web.ts`                  | ✅     |
| 3.4 | Real-time transport; background sync         | `packages/api-client/src/realtime.ts`; `apps/mobile/src/background.ts`; `packages/web-pwa` SW | ✅     |

## 4. Security

| #   | Item                                   | Where                                                                                                                             | Status                         |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 4.1 | Auth state machine + injected storage  | `packages/auth/src/machine.ts`, `session.ts`, `types.ts`                                                                          | ✅                             |
| 4.2 | Keychain/Keystore; httpOnly BFF cookie | `token-storage.native.ts` / `.web.ts`; E2E asserts the cookie is httpOnly — [ADR 0004](adr/0004-auth-token-storage.md)            | ✅                             |
| 4.3 | OAuth PKCE / redirect, biometrics, CSP | `packages/auth/src/oauth.*.ts`, `biometrics.*.ts`; `apps/mobile/src/components/BiometricGate.tsx`; `apps/web/vercel.json` headers | ✅ (OAuth: 🧩 provider config) |
| 4.4 | Pinning, root detection, screenshots   | `apps/mobile/src/security.ts` — screenshot protection live on sign-in; pinning + integrity hooks                                  | ✅ / 🧩                        |
| 4.5 | No secrets in packages; env schema     | `packages/config/src/env.ts` (rejects non-`EXPO_PUBLIC_*` keys), `apps/*/src/env.ts`                                              | ✅                             |

The spec mentions `NEXT_PUBLIC_*`; both apps here are Expo, so both use `EXPO_PUBLIC_*`.

## 5. Error handling and resilience

| #   | Item                                   | Where                                                                                      | Status |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------ | ------ |
| 5.1 | Error types, normalization, messages   | `packages/domain/src/errors.ts`; messages in `packages/i18n` `errors:*`                    | ✅     |
| 5.2 | Error boundary with platform fallbacks | `packages/ui/src/components/ErrorBoundary.tsx`, `ErrorFallback.native/web.tsx`             | ✅     |
| 5.3 | Native crashes; `window.onerror`       | `apps/mobile/src/monitoring.ts` (Sentry native + ErrorUtils); `apps/web/src/monitoring.ts` | ✅     |

## 6. Observability

| #   | Item                                   | Where                                                                                  | Status              |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------- | ------------------- |
| 6.1 | Event taxonomy, typed `track()`, sinks | `packages/analytics/src/events.ts`, `client.ts`, `sink.native.ts` / `.web.ts`          | ✅ (vendor SDK: 🧩) |
| 6.2 | Logger with PII scrubbing              | `packages/utils/src/logger.ts`                                                         | ✅                  |
| 6.3 | Sentry, separate projects, source maps | `apps/*/src/monitoring.ts`; Sentry Expo plugin + Metro config; web upload in `web.yml` | 🔌                  |
| 6.4 | Feature-flag keys + typed hook         | `packages/config/src/flags.ts`, `packages/config/src/react.tsx`                        | ✅ (provider: 🧩)   |
| 6.5 | Startup / frames; Core Web Vitals      | Sentry RN tracing + Flashlight job; `web-vitals` in `apps/web/src/monitoring.ts`       | ✅ / 🔌             |

## 7. Performance

| #   | Item                                    | Where                                                                                       | Status |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------- | ------ |
| 7.1 | Memoization; no store-driven re-renders | selector-only `usePreferences(selector)`; `useSyncExternalStore` hooks                      | ✅     |
| 7.2 | Tree-shakeable packages                 | `sideEffects: false` everywhere; explicit named exports in `packages/ui/src/index.ts`       | ✅     |
| 7.3 | Hermes, FlashList, Reanimated, images   | Hermes (Expo default, `.hbc` bundles); FlashList + Reanimated + `expo-image` on mobile home | ✅     |
| 7.4 | Code splitting, SSG, lazy routes        | `web.output: 'static'` + `asyncRoutes` in `apps/web/app.config.ts` (one bundle per route)   | ✅     |

## 8. UI and design system

| #   | Item                             | Where                                                                          | Status |
| --- | -------------------------------- | ------------------------------------------------------------------------------ | ------ |
| 8.1 | Design tokens                    | `packages/ui/src/tokens.ts`                                                    | ✅     |
| 8.2 | Cross-platform UI strategy       | Shared primitives via react-native-web — [ADR 0003](adr/0003-ui-strategy.md)   | ✅     |
| 8.3 | Theming and dark mode            | `packages/ui/src/theme.tsx` (hydration-safe) + `state` color-scheme preference | ✅     |
| 8.4 | Safe areas/keyboard; hover/focus | `Screen.native.tsx`, `Screen.web.tsx`, `Button.tsx`                            | ✅     |
| 8.5 | Storybook                        | one react-native-web Storybook in `packages/ui/.storybook`                     | ✅     |

## 9. Accessibility

| #   | Item                                    | Where                                                                                             | Status |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------- | ------ |
| 9.1 | Shared a11y props                       | `packages/ui/src/a11y.ts` (`role` / `aria-*` on both platforms)                                   | ✅     |
| 9.2 | Contrast-checked tokens; reduced motion | `packages/ui/src/tokens.test.ts`; `reduced-motion.native/web.ts`                                  | ✅     |
| 9.3 | VoiceOver/TalkBack; axe; keyboard       | [accessibility checklist](accessibility-checklist.md); axe + `keyboard.spec.ts` in `apps/web/e2e` | ✅     |

## 10. Internationalization

| #    | Item                                    | Where                                            | Status  |
| ---- | --------------------------------------- | ------------------------------------------------ | ------- |
| 10.1 | Translations, namespaces, plurals, Intl | `packages/i18n` (i18next; `formatters.ts`)       | ✅      |
| 10.2 | Translation workflow; missing-key CI    | `crowdin.yml`; `pnpm i18n:check` in CI           | ✅ / 🔌 |
| 10.3 | Device vs URL locale; RTL               | `packages/i18n/src/locale.native.ts` / `.web.ts` | ✅      |

## 11. Device and platform integration

| #    | Item                                    | Where                                                                                         | Status |
| ---- | --------------------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| 11.1 | Permissions, push, background, AppState | `packages/native-push`; `apps/mobile/src/background.ts`; AppState in `data/network.native.ts` | ✅     |
| 11.2 | Service worker, PWA install, web push   | `packages/web-pwa` (SW, `useInstallPrompt`, `subscribeToWebPush`); install button in settings | ✅     |
| 11.3 | Notification schema + deep-link map     | `packages/domain/src/notifications.ts`, `routes.ts`; deep-link E2E + Maestro flow             | ✅     |

## 12. Build, release and delivery

| #    | Item                                    | Where                                                                                               | Status |
| ---- | --------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| 12.1 | Affected detection                      | `turbo run … --affected` in `ci.yml`; `turbo-ignore <app>` gating in `web.yml` / `mobile.yml`       | ✅     |
| 12.2 | Remote build cache                      | `TURBO_TOKEN` / `TURBO_TEAM` in workflows                                                           | 🔌     |
| 12.3 | EAS Build, signing, submit, OTA pinning | `apps/mobile/eas.json`; `runtimeVersion: { policy: 'fingerprint' }`; `src/updates.ts`; `mobile.yml` | 🔌     |
| 12.4 | Preview deploys per PR; CDN             | `preview` job in `web.yml`; cache headers in `vercel.json`                                          | 🔌     |
| 12.5 | Independent app releases, no Changesets | `pnpm release`; [ADR 0001](adr/0001-monorepo-tooling.md)                                            | ✅     |
| 12.6 | Backward-compatible API, min version    | `appConfigSchema.minSupportedVersion`, `useUpgradeRequired`, `UpgradeGate` in both apps             | ✅     |

## 13. Testing and quality

| #     | Item                                       | Where                                                                                                                      | Status  |
| ----- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------- |
| 13.1  | Bottom-heavy pyramid                       | ~225 Jest runs (unit, component, integration, contract; counted per platform) vs. 13 Playwright journeys + 4 Maestro flows | ✅      |
| 13.2  | Packages own their tests                   | tests next to code in every package                                                                                        | ✅      |
| 13.3  | `@repo/testing` dev-only, lint-enforced    | `tooling/eslint-config` rule; [ADR 0006](adr/0006-testing-architecture.md)                                                 | ✅      |
| 13.4  | jest-expo multi-project (ios/android/web)  | `tooling/jest-config` `universal()`                                                                                        | ✅      |
| 13.5  | Pure packages in Node                      | `tooling/jest-config` `node()` (domain, utils, config, api-client, i18n formatters)                                        | ✅      |
| 13.6  | Zod valid/invalid tests; typed factories   | `packages/domain/src/schemas.test.ts`; `packages/testing/factories`, `fixtures/fixtures.test.ts`                           | ✅      |
| 13.7  | RNTL for shared/mobile; RTL for web        | `packages/testing/render` (RNTL) and `render/web.tsx` (RTL)                                                                | ✅      |
| 13.8  | `renderWithProviders`                      | `packages/testing/render/context.tsx`                                                                                      | ✅      |
| 13.9  | Queries by role/label/text                 | all component and screen tests                                                                                             | ✅      |
| 13.10 | Data hooks against MSW                     | `packages/data/src/hooks.test.tsx`, `packages/testing/mocks`                                                               | ✅      |
| 13.11 | Auth machine through refresh/expiry/logout | `packages/auth/src/session.test.ts`                                                                                        | ✅      |
| 13.12 | Swappable persistence adapters             | `packages/state/src/storage.test.ts`                                                                                       | ✅      |
| 13.13 | Consumer contracts in CI                   | `packages/contracts` — [ADR 0007](adr/0007-api-contracts.md)                                                               | ✅      |
| 13.14 | Old-client contract suites                 | `packages/contracts/src/clients/v1.0.0.ts`                                                                                 | ✅      |
| 13.15 | Maestro + shared subflows                  | `apps/mobile/e2e`, `tooling/maestro/subflows`                                                                              | 🔌      |
| 13.16 | Playwright on static export / preview      | `apps/web/e2e`, `tooling/playwright-config` (Chromium, WebKit, Firefox, mobile)                                            | ✅      |
| 13.17 | Critical journeys only                     | sign-in, profile update, deep links, consent (web + mobile)                                                                | ✅      |
| 13.18 | Seeded, resettable test backend            | `tooling/mock-api` (`POST /__reset`) fed by `packages/testing/fixtures`                                                    | ✅      |
| 13.19 | Visual regression via Chromatic            | `visual` job in `ci.yml`                                                                                                   | 🔌      |
| 13.20 | axe in Playwright + on stories; RNTL a11y  | `apps/web/e2e`, `packages/ui/e2e/stories.a11y.spec.ts`, [checklist](accessibility-checklist.md)                            | ✅      |
| 13.21 | Lighthouse CI, Reassure, Flashlight        | `apps/web/lighthouserc.json`; `packages/ui/src/components/Button.perf-test.tsx`; `flashlight` job                          | ✅ / 🔌 |
| 13.22 | Affected on PRs, full on main + nightly    | `ci.yml`, `nightly.yml`                                                                                                    | ✅      |
| 13.23 | Per-package coverage; changed-file gate    | `coverageThreshold` in domain/data/auth; `tooling/scripts/check-changed-coverage.mjs`                                      | ✅      |
| 13.24 | One retry, then quarantine with an issue   | `jest.retryTimes(1)` in CI; Playwright `retries: 1`; `tooling/scripts/report-flaky.mjs`                                    | ✅      |
| 13.25 | Required checks                            | `ci.yml` (typecheck, lint, unit, component, contract) + `web.yml` E2E; mobile E2E on main                                  | ✅      |
| 13.26 | Mobile device matrix                       | `e2e` matrix in `mobile.yml` (min/latest iOS + Android, small screen)                                                      | 🔌      |
| 13.27 | Strict TS, project references, shared lint | `tooling/tsconfig`, root `tsconfig.json` (`tsc -b`), `sync-ts-references.mjs`, `tooling/eslint-config`                     | ✅      |

## 14. Compliance and privacy

| #    | Item                                    | Where                                                                                        | Status |
| ---- | --------------------------------------- | -------------------------------------------------------------------------------------------- | ------ |
| 14.1 | Consent gating in analytics             | `packages/analytics/src/consent.ts`, `client.ts` (drops events before opt-in); E2E + Maestro | ✅     |
| 14.2 | ATT, privacy manifest, data-safety      | `apps/mobile/src/tracking.ts`; `ios.privacyManifests` in `app.config.ts`; store labels 🧩    | ✅     |
| 14.3 | Cookie banner, GDPR/CCPA, cookie policy | `apps/web/src/components/ConsentBanner.tsx`, `/privacy`                                      | ✅     |
| 14.4 | Data export / delete                    | `useExportData` / `useDeleteAccount` in `packages/data`; privacy screens in both apps        | ✅     |

## 15. Maintenance

| #    | Item                                   | Where                                                                   | Status  |
| ---- | -------------------------------------- | ----------------------------------------------------------------------- | ------- |
| 15.1 | Coordinated Expo / RN / React upgrades | one catalog; Renovate "Expo SDK + React Native" group never auto-merges | ✅      |
| 15.2 | Renovate + vulnerability scanning      | `renovate.json`; dependency-review on PRs; `pnpm audit` nightly         | ✅ / 🔌 |
| 15.3 | Dependency graph visualization         | `pnpm graph` (Turborepo `--graph`); nightly artifact                    | ✅      |
| 15.4 | ADRs                                   | `docs/adr`                                                              | ✅      |
