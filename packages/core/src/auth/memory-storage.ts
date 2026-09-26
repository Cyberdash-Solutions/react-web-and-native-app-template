import type { TokenStorage } from './types';

/** In-memory token storage for tests (13.11) and SSR. */
export function createMemoryTokenStorage(
  initial: string | null = null,
  kind: TokenStorage['kind'] = 'token',
): TokenStorage & {
  peek(): string | null;
} {
  let token = initial;
  return {
    kind,
    getRefreshToken: async () => token,
    setRefreshToken: async (t) => void (token = t),
    peek: () => token,
  };
}
