# Accessibility checklist (9.3, 13.20)

Automated coverage runs on every PR:

- **Web:** axe (WCAG 2.1 A/AA) in Playwright on the key screens (`apps/web/e2e`), plus keyboard-only
  journeys (`keyboard.spec.ts`); axe on every Storybook story in light and dark (`packages/ui/e2e`);
  Lighthouse accessibility ≥ 0.95 (`apps/web/lighthouserc.json`).
- **Mobile / shared components:** RNTL queries by role and accessible name (13.9), which fail if a
  control has no role or label. Tokens are contrast-checked in `packages/ui/src/tokens.test.ts`.

Manual pass **before every store release** (copy into the release issue):

### iOS — VoiceOver

- [ ] Every screen: swipe through all elements; each has a sensible label and role, in reading order
- [ ] Headings rotor jumps between screen titles and section headings
- [ ] Sign-in: fields announce their label and errors are read when they appear
- [ ] Buttons announce "busy"/dimmed while loading and disabled states
- [ ] Settings toggles announce on/off; theme/language options announce "selected"
- [ ] Dynamic Type at the largest size: nothing truncates or overlaps
- [ ] Reduce Motion on: the greeting appears without animation
- [ ] Smart Invert / Increase Contrast: content remains legible

### Android — TalkBack

- [ ] Same traversal checks as VoiceOver
- [ ] Font size + display size at maximum
- [ ] Remove animations on: no entrance animations
- [ ] Touch targets ≥ 44×44 dp (Accessibility Scanner reports no issues)

### Web — screen reader spot check (NVDA or VoiceOver for macOS)

- [ ] Landmarks: banner, navigation, main are announced
- [ ] Consent dialog is announced and reachable before other content
- [ ] RTL: with `?lang=ar` (once an RTL locale exists), layout mirrors and reading order holds
