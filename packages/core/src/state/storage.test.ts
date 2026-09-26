import { Platform } from 'react-native';

import { createMemoryStorage } from './memory';
import { createPreferencesStore, PREFERENCES_KEY } from './preferences';
import { createDefaultStorage } from './storage';

// Runs under ios, android and web projects: each resolves its own storage split (13.4).
describe(`default storage (${Platform.OS})`, () => {
  it('round-trips values', () => {
    const storage = createDefaultStorage('test');
    storage.setItem('k', 'v');
    expect(storage.getItem('k')).toBe('v');
    storage.removeItem('k');
    expect(storage.getItem('k')).toBeNull();
  });
});

// 13.12 — persistence behavior tested with an in-memory stand-in for MMKV / localStorage.
describe('preferences store', () => {
  it('persists changes through the injected adapter', () => {
    const storage = createMemoryStorage();
    const store = createPreferencesStore(storage);
    store.getState().setColorScheme('dark');
    expect(JSON.parse(storage.getItem(PREFERENCES_KEY)!).state).toEqual({
      colorScheme: 'dark',
      locale: null,
      biometricLock: false,
    });
  });

  it('rehydrates from storage', () => {
    const storage = createMemoryStorage({
      [PREFERENCES_KEY]: JSON.stringify({
        state: { colorScheme: 'light', locale: 'es', biometricLock: true },
        version: 1,
      }),
    });
    const store = createPreferencesStore(storage);
    expect(store.getState()).toMatchObject({
      colorScheme: 'light',
      locale: 'es',
      biometricLock: true,
    });
  });

  it('resets to defaults', () => {
    const store = createPreferencesStore();
    store.getState().setLocale('es');
    store.getState().reset();
    expect(store.getState().locale).toBeNull();
  });
});
