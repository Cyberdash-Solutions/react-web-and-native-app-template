import type { AuthTokens, SignInInput, SignInResponse, User } from '@repo/domain';

/**
 * 4.1 / 4.2 — Injected storage interface. Mobile keeps the refresh token in Keychain/Keystore;
 * web keeps nothing (the BFF holds it in an httpOnly cookie), so `kind: 'cookie'`.
 */
export interface TokenStorage {
  readonly kind: 'token' | 'cookie';
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string | null): Promise<void>;
  /**
   * Cookie storage only: a non-secret "a session may exist" flag, so an anonymous visitor's
   * startup doesn't probe /auth/refresh (and log a 401) when there is certainly no cookie.
   */
  readonly sessionHint?: { get(): boolean; set(active: boolean): void };
}

/** The subset of endpoints the session needs; satisfied by `createEndpoints(client)`. */
export interface AuthApi {
  signIn(input: SignInInput): Promise<SignInResponse>;
  refresh(refreshToken?: string): Promise<AuthTokens>;
  signOut(): Promise<unknown>;
  getMe(): Promise<User>;
}
