# 0002. What is shared and what stays per platform

- Status: Accepted
- Date: 2026-09-26
- Spec items: rule of thumb, 1.4, 1.5, 1.11, 2.x, 3.x, 4.x

## Decision

> Share types, logic, data, tokens and i18n aggressively. Share UI components selectively. Keep
> navigation, storage, auth transport and native integrations platform-specific behind shared
> interfaces.

| Concern                  | Shared (`@repo/core` folder unless noted)                | Per platform                                                                         |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Types, schemas, errors   | `domain`                                                 | —                                                                                    |
| Route names / deep links | `domain/routes`                                          | Expo Router file routes in each app                                                  |
| HTTP                     | `api-client` (retries, timeouts, refresh, normalization) | credentials mode + client headers injected by each app                               |
| Server state             | `data` (TanStack Query hooks, keys, invalidation)        | `network.native.ts` (NetInfo/AppState) vs `network.web.ts`                           |
| Client state             | `state` (Zustand stores)                                 | `storage.native.ts` (MMKV) vs `storage.web.ts` (localStorage)                        |
| Auth                     | `auth` state machine + session                           | `token-storage.native.ts` (SecureStore) vs `.web.ts` (BFF cookie); biometrics; OAuth |
| UI                       | `ui` tokens, theme, primitives, ErrorBoundary            | `Screen.native/web`, `ErrorFallback.native/web`, `reduced-motion.native/web`         |
| i18n                     | `i18n` resources, formatters                             | `locale.native.ts` (device, I18nManager) vs `.web.ts` (URL/browser, `dir`)           |
| Analytics / consent      | `analytics` taxonomy, `track()`, consent gate            | `sink.native.ts` vs `sink.web.ts`                                                    |
| Push / PWA               | notification payload schema (`domain`)                   | `apps/mobile/src/push.ts`, `apps/web/src/pwa.ts` + `public/sw.js`                    |
| Monitoring               | logger with PII scrubbing (`utils`)                      | Sentry RN vs Sentry browser, separate projects (`apps/*/src/monitoring.ts`)          |
| Security hardening       | —                                                        | screenshot protection / pinning / integrity (mobile), CSP & headers (web)            |

Platform splits use `*.native.ts` / `*.web.ts` next to a `*.ts` entry that re-exports the web
variant for type-checking; Metro and Jest pick the right file per platform (1.5). ESLint forbids
platform imports and DOM globals anywhere else in shared packages (1.4).

> Since [ADR 0008](0008-consolidate-shared-packages.md) the shared column is folders of
> `@repo/core` (plus `@repo/ui`), with the same boundaries enforced by ESLint per folder.
