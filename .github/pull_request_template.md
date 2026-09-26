## What & why

<!-- One or two sentences. Link the issue. -->

## Affected targets

- [ ] mobile
- [ ] web
- [ ] shared packages only

## Checklist

- [ ] Tests added/updated next to the code they cover (unit/component), or in `__tests__/` for cross-screen flows
- [ ] New user-facing strings added to `packages/i18n/src/locales/en.json` (other locales via the translation workflow)
- [ ] API contract changes are backward compatible for the oldest supported mobile version (12.6)
- [ ] New analytics events added to the taxonomy in `packages/analytics/src/events.ts`
- [ ] Mobile: native changes? The runtime fingerprint changes, so this needs a store build, not just an OTA update
