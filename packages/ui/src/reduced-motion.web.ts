import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';
const media = () =>
  typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY) : null;

function subscribe(onChange: () => void) {
  const mql = media();
  mql?.addEventListener('change', onChange);
  return () => mql?.removeEventListener('change', onChange);
}

/** 9.2 — Web: the prefers-reduced-motion media query. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => media()?.matches ?? false,
    () => false,
  );
}
