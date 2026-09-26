# 0007. Zod consumer contracts instead of Pact

- Status: Accepted
- Date: 2026-09-26
- Spec items: 2.1, 12.6, 13.13, 13.14

## Decision

The Zod schemas in `packages/core/src/domain` are the consumer contract. `packages/testing/contracts` calls a real
backend (`CONTRACT_API_URL`; the seeded mock API when unset) and validates every response against
them. Frozen schema snapshots per still-supported mobile release (`clients/v1.0.0.ts`) keep
running until that version is retired (13.14), which is also when `minSupportedVersion.mobile`
is raised on the server (12.6).

Pact is the drop-in upgrade when the backend team runs provider verification: generate pacts
from the same Zod schemas.
