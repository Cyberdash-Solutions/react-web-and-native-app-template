import * as SecureStore from 'expo-secure-store';

import { createPlatformTokenStorage } from './token-storage.native';

// 4.2 — mobile keeps the refresh token in the Keychain / Keystore (SecureStore; in-memory in Jest).
describe('native token storage', () => {
  it('stores, reads and clears the refresh token in SecureStore', async () => {
    const storage = createPlatformTokenStorage();
    expect(storage.kind).toBe('token');
    await storage.setRefreshToken('refresh-1');
    await expect(storage.getRefreshToken()).resolves.toBe('refresh-1');
    await expect(SecureStore.getItemAsync('auth.refreshToken')).resolves.toBe('refresh-1');
    await storage.setRefreshToken(null);
    await expect(storage.getRefreshToken()).resolves.toBeNull();
  });
});
