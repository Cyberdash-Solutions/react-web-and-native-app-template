import type { TokenStorage } from './types';

/**
 * 4.2 — Web: nothing is stored in JS-readable storage. The BFF sets the refresh token as an
 * httpOnly, Secure, SameSite cookie; the api-client sends it with `credentials: 'include'`.
 * The access token only ever lives in memory (inside the auth session).
 */
export function createPlatformTokenStorage(): TokenStorage {
  return {
    kind: 'cookie',
    getRefreshToken: async () => null,
    setRefreshToken: async () => {},
  };
}
