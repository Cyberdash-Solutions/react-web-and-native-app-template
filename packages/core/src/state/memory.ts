import type { KeyValueStorage } from './types';

/** In-memory adapter: SSR, tests (13.12) and a last-resort fallback. */
export function createMemoryStorage(
  initial: Record<string, string> = {},
): KeyValueStorage & { dump(): Record<string, string> } {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    dump: () => Object.fromEntries(map),
  };
}
