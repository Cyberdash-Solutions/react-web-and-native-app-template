import { createMemoryStorage, type KeyValueStorage } from '../state';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore, type StoreApi } from 'zustand/vanilla';

/**
 * 14.1 — Consent state. `null` means "not asked yet", which is treated exactly like "declined":
 * no events leave the device before an explicit opt-in.
 */
export interface ConsentState {
  analytics: boolean | null;
  decidedAt: string | null;
  setAnalyticsConsent(granted: boolean): void;
}

export type ConsentStore = StoreApi<ConsentState>;

export function createConsentStore(storage: KeyValueStorage = createMemoryStorage()): ConsentStore {
  return createStore<ConsentState>()(
    persist(
      (set) => ({
        analytics: null,
        decidedAt: null,
        setAnalyticsConsent: (granted) =>
          set({ analytics: granted, decidedAt: new Date().toISOString() }),
      }),
      {
        name: 'consent',
        version: 1,
        storage: createJSONStorage(() => storage),
        partialize: ({ analytics, decidedAt }) => ({ analytics, decidedAt }),
      },
    ),
  );
}
