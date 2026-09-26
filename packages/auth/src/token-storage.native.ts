import * as SecureStore from 'expo-secure-store';

import type { TokenStorage } from './types';

const KEY = 'auth.refreshToken';

/** 4.2 — Mobile: refresh token lives in the iOS Keychain / Android Keystore. */
export function createPlatformTokenStorage(): TokenStorage {
  return {
    kind: 'token',
    getRefreshToken: () => SecureStore.getItemAsync(KEY),
    setRefreshToken: async (token) => {
      if (token)
        await SecureStore.setItemAsync(KEY, token, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        });
      else await SecureStore.deleteItemAsync(KEY);
    },
  };
}
