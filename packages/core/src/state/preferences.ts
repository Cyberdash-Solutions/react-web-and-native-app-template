import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore, type StoreApi } from 'zustand/vanilla';

import { createMemoryStorage } from './memory';
import type { KeyValueStorage } from './types';

/** 2.3 — Client (non-server) state shared by both apps. */
export type ColorSchemePreference = 'system' | 'light' | 'dark';

export interface PreferencesState {
  colorScheme: ColorSchemePreference;
  /** null = follow the device / browser locale. */
  locale: string | null;
  /** Mobile only: require biometrics to unlock a restored session (4.3). */
  biometricLock: boolean;
  setColorScheme(value: ColorSchemePreference): void;
  setLocale(value: string | null): void;
  setBiometricLock(value: boolean): void;
  reset(): void;
}

const defaults = { colorScheme: 'system', locale: null, biometricLock: false } as const;

export const PREFERENCES_KEY = 'preferences';

export function createPreferencesStore(
  storage: KeyValueStorage = createMemoryStorage(),
): StoreApi<PreferencesState> {
  return createStore<PreferencesState>()(
    persist(
      (set) => ({
        ...defaults,
        setColorScheme: (colorScheme) => set({ colorScheme }),
        setLocale: (locale) => set({ locale }),
        setBiometricLock: (biometricLock) => set({ biometricLock }),
        reset: () => set({ ...defaults }),
      }),
      {
        name: PREFERENCES_KEY,
        version: 1,
        storage: createJSONStorage(() => storage),
        partialize: ({ colorScheme, locale, biometricLock }) => ({
          colorScheme,
          locale,
          biometricLock,
        }),
      },
    ),
  );
}
