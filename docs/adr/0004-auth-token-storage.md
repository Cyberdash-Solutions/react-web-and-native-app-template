# 0004. Token storage: Keychain/Keystore on mobile, BFF httpOnly cookie on web

- Status: Accepted
- Date: 2026-09-26
- Spec items: 4.1, 4.2, 4.3, 13.11

## Decision

`packages/auth` owns one state machine (`unknown → signedOut | signedIn ⇄ refreshing`) and a
session object (sign-in, deduplicated refresh, expiry, sign-out). It never touches storage
directly; it receives a `TokenStorage`:

- **Mobile** (`token-storage.native.ts`): the refresh token in the Keychain / Keystore via
  `expo-secure-store`, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`.
- **Web** (`token-storage.web.ts`, `kind: 'cookie'`): nothing in JS-readable storage. The backend
  (acting as a BFF) sets the refresh token as an **httpOnly, Secure, SameSite** cookie; the
  api-client uses `credentials: 'include'`. The access token only lives in memory.
- **Tests**: `createMemoryTokenStorage()`.

The api-client calls `session.refresh()` on a 401 (one shared refresh for concurrent requests)
and `session.getAccessToken()` refreshes proactively before expiry.

## Consequences

- The web backend must be same-site with the web app (or use a BFF route on the web origin) for
  the cookie to flow. `tooling/mock-api` implements the contract: `X-Client-Platform: web` →
  cookie instead of a body token. A Playwright test asserts the cookie is httpOnly and no token
  reaches localStorage.
