import { createMMKV } from 'react-native-mmkv';

import type { KeyValueStorage } from './types';

/** 2.3 — Mobile persistence: MMKV (synchronous, fast, encrypted-at-rest capable). */
export function createDefaultStorage(id = 'app-state'): KeyValueStorage {
  const mmkv = createMMKV({ id });
  return {
    getItem: (k) => mmkv.getString(k) ?? null,
    setItem: (k, v) => mmkv.set(k, v),
    removeItem: (k) => void mmkv.remove(k),
  };
}
