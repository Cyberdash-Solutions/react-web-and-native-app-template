/**
 * 8.1 — Design tokens: the single source of truth for both platforms. Plain values only, so they
 * can also be exported to CSS variables, Figma, or a native theme file.
 */
export const palette = {
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',
  gray950: '#020617',
  indigo300: '#A5B4FC',
  indigo600: '#4F46E5',
  indigo700: '#4338CA',
  red300: '#FCA5A5',
  red700: '#B91C1C',
  green300: '#86EFAC',
  green700: '#15803D',
} as const;

export interface ColorTokens {
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  danger: string;
  success: string;
  focusRing: string;
}

/** 8.3 / 9.2 — both schemes are contrast-checked in tokens.test.ts (WCAG AA). */
export const colors: Record<'light' | 'dark', ColorTokens> = {
  light: {
    background: palette.gray50,
    surface: palette.white,
    border: palette.gray200,
    text: palette.gray900,
    textMuted: palette.gray600,
    primary: palette.indigo600,
    primaryPressed: palette.indigo700,
    onPrimary: palette.white,
    danger: palette.red700,
    success: palette.green700,
    focusRing: palette.indigo600,
  },
  dark: {
    background: palette.gray950,
    surface: palette.gray900,
    border: palette.gray700,
    text: palette.gray50,
    textMuted: palette.gray400,
    primary: palette.indigo300,
    primaryPressed: palette.indigo600,
    onPrimary: palette.gray950,
    danger: palette.red300,
    success: palette.green300,
    focusRing: palette.indigo300,
  },
};

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;
export const radii = { sm: 4, md: 8, lg: 12, pill: 999 } as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const;

export const motion = {
  duration: { fast: 120, normal: 200, slow: 320 },
  easing: { standard: [0.2, 0, 0, 1] as const },
} as const;

/** 8.4 — web breakpoints (min-width, px). */
export const breakpoints = { sm: 0, md: 768, lg: 1024, xl: 1280 } as const;

export const layout = { maxContentWidth: 720, minTouchTarget: 44 } as const;

export type Spacing = keyof typeof spacing;
export type TypographyVariant = keyof typeof typography;
