# 0003. Shared react-native primitives rendered on web by react-native-web

- Status: Accepted
- Date: 2026-09-26
- Spec items: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2

## Context

8.2 offers two strategies: shared primitives via react-native-web, or shared tokens/logic with
separate component implementations (RN + shadcn/Radix).

## Decision

**Shared primitives via react-native-web**, with plain `StyleSheet` + tokens (no styling library)
to keep the template dependency-light. Tamagui / NativeWind / Unistyles can be layered on later
without changing the token source of truth (`packages/ui/src/tokens.ts`).

Web-specific care that this choice requires is handled explicitly:

- **SSR/SSG (7.4):** the web app is statically rendered. Components avoid JS breakpoints for
  layout, and `ThemeProvider` renders the server's scheme during hydration (`useHydrated`),
  switching to the device scheme right after, so hydration never keeps stale styles.
- **Hover / focus (8.4):** `Button` reads react-native-web's `hovered` / `focused` Pressable state
  and draws a focus ring.
- **A11y (9.1):** components use `role` / `aria-*` props, which React Native ≥0.71 and
  react-native-web both understand. Tokens are contrast-checked in unit tests (9.2), and axe runs
  in Playwright (13.20).

## Consequences

- Most reuse; the web UI looks consistent with mobile rather than "native web". If the web app
  needs a very different UX, swap in web-only components as `*.web.tsx` files in the app.
