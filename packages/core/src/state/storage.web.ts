import { createMemoryStorage } from './memory';
import type { KeyValueStorage } from './types';

/** 2.3 — Web persistence: localStorage (never used for auth tokens, see 4.2). */
export function createDefaultStorage(namespace = 'app-state'): KeyValueStorage {
  // Static rendering (7.4) runs in Node where there is no window.
  if (typeof window === 'undefined' || !window.localStorage) return createMemoryStorage();
  const prefix = `${namespace}:`;
  return {
    getItem: (k) => window.localStorage.getItem(prefix + k),
    setItem: (k, v) => {
      try {
        window.localStorage.setItem(prefix + k, v);
      } catch {
        // Quota exceeded / private mode — persistence is best-effort.
      }
    },
    removeItem: (k) => window.localStorage.removeItem(prefix + k),
  };
}
