import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import {
  breakpoints,
  colors,
  layout,
  motion,
  radii,
  spacing,
  typography,
  type ColorTokens,
} from './tokens';

export type ColorScheme = 'light' | 'dark';
export type ColorSchemePreference = ColorScheme | 'system';

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  motion: typeof motion;
  breakpoints: typeof breakpoints;
  layout: typeof layout;
}

/** 8.3 — the shared theming / dark-mode decision. */
export function resolveScheme(
  preference: ColorSchemePreference,
  system: ColorScheme | null | undefined,
): ColorScheme {
  return preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
}

export function createTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: colors[scheme],
    spacing,
    radii,
    typography,
    motion,
    breakpoints,
    layout,
  };
}

const ThemeContext = createContext<Theme>(createTheme('light'));

const noopSubscribe = () => () => {};

/**
 * False while hydrating statically rendered HTML (7.4), true afterwards. The first client render
 * must match the server's, or React keeps the server's (light) styles; the device scheme is
 * applied on the render right after hydration.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function ThemeProvider({
  preference = 'system',
  children,
}: {
  preference?: ColorSchemePreference;
  children: ReactNode;
}) {
  const system = useColorScheme();
  const hydrated = useHydrated();
  const scheme = resolveScheme(preference, hydrated && system !== 'unspecified' ? system : null);
  const theme = useMemo(() => createTheme(scheme), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
