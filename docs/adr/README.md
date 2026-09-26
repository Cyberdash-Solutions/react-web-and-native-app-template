# Architecture Decision Records (15.4)

Short records of decisions that shape the codebase — especially **what is shared and what stays
per platform**. Add one per significant decision: copy `0000-template.md`, take the next number,
and link it here. Superseded ADRs stay, marked as such.

| #                                    | Decision                                                            | Status   |
| ------------------------------------ | ------------------------------------------------------------------- | -------- |
| [0001](0001-monorepo-tooling.md)     | pnpm workspaces + catalogs, Turborepo, source-compiled packages     | Accepted |
| [0002](0002-shared-vs-platform.md)   | What is shared and what stays per platform                          | Accepted |
| [0003](0003-ui-strategy.md)          | Shared react-native primitives rendered on web by react-native-web  | Accepted |
| [0004](0004-auth-token-storage.md)   | Token storage: Keychain/Keystore on mobile, BFF httpOnly cookie web | Accepted |
| [0005](0005-navigation.md)           | Expo Router per app + a shared route map (no Solito)                | Accepted |
| [0006](0006-testing-architecture.md) | Testing architecture, and the intentional `@repo/testing` dev cycle | Accepted |
| [0007](0007-api-contracts.md)        | Zod consumer contracts instead of Pact                              | Accepted |
