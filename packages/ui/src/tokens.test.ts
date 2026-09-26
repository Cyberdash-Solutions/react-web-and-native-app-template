import { contrastRatio } from './contrast';
import { colors } from './tokens';

// 9.2 — contrast-checked tokens (WCAG AA: 4.5:1 for body text, 3:1 for large text / UI).
describe.each(['light', 'dark'] as const)('%s scheme contrast', (scheme) => {
  const c = colors[scheme];
  it.each([
    ['text on background', c.text, c.background, 4.5],
    ['text on surface', c.text, c.surface, 4.5],
    ['muted text on surface', c.textMuted, c.surface, 4.5],
    ['onPrimary on primary', c.onPrimary, c.primary, 4.5],
    ['danger on surface', c.danger, c.surface, 4.5],
    ['primary on surface', c.primary, c.surface, 3],
  ])('%s ≥ %s', (_name, fg, bg, min) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});
