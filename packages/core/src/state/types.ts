/** Synchronous key-value storage. MMKV (native) and localStorage (web) both fit this shape. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
