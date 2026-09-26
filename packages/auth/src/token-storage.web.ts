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
    sessionHint: createSessionHint(),
  };
}

const HINT_KEY = 'auth.hasSession';

/** Not a credential: only records that this browser signed in, so restore knows to try. */
function createSessionHint(): NonNullable<TokenStorage['sessionHint']> {
  const storage = () => {
    try {
      return typeof window !== 'undefined' ? window.localStorage : null;
    } catch {
      return null; // storage disabled: fall back to always probing
    }
  };
  return {
    get: () => {
      const s = storage();
      return s ? s.getItem(HINT_KEY) === '1' : true;
    },
    set: (active) => {
      const s = storage();
      if (!s) return;
      if (active) s.setItem(HINT_KEY, '1');
      else s.removeItem(HINT_KEY);
    },
  };
}
