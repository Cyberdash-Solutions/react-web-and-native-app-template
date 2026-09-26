import { useWindowDimensions } from 'react-native';

import { breakpoints } from './tokens';

export type Breakpoint = keyof typeof breakpoints;

/** 8.4 — responsive breakpoint, driven by window width on web and device width on mobile. */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  return 'sm';
}
