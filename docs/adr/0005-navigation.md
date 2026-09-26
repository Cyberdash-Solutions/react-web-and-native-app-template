# 0005. Expo Router per app + a shared route map (no Solito)

- Status: Accepted
- Date: 2026-09-26
- Spec items: 2.4, 2.5, 11.3

## Decision

Each app has its own Expo Router tree (mobile: native Stack with modal sign-in; web: header +
`<Slot/>`). Route names and paths live in `packages/domain/src/routes.ts`; apps build links with
`href('message', { id })`, and `matchPath()` resolves any inbound URL. A test in each app asserts
every shared route has a screen file, so a push notification or email link never lands on
"not found".

Solito / fully shared navigation (2.5) is **not** used: the two apps' UX differ (modal vs page,
header vs nav bar) and Expo Router already gives both apps file-based URLs.
