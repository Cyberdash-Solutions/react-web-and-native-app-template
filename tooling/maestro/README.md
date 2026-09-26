# Shared Maestro subflows (13.15)

Reusable steps for the mobile E2E suites in `apps/*/e2e`. Flows call them with `runFlow`:

```yaml
- runFlow: ../../../tooling/maestro/subflows/login.yaml
```

| Subflow        | What it does                                                   |
| -------------- | -------------------------------------------------------------- |
| `launch.yaml`  | Resets the seeded test backend (13.18) and cold-starts the app |
| `consent.yaml` | Answers the analytics consent card (14.1)                      |
| `login.yaml`   | Signs in with the fixture user                                 |

Environment (set in `apps/mobile/e2e/config.yaml` or with `-e`):

- `APP_ID` — bundle id / package of the build under test
- `API_URL` — the test backend (`pnpm mock-api`; `http://10.0.2.2:4000` from the Android emulator)
- `EMAIL`, `PASSWORD`, `USER_NAME` — from `packages/testing/fixtures`
