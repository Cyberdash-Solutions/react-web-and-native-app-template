import { type AppError, normalizeError, type SignInInput } from '../domain';

import {
  authReducer,
  initialAuthState,
  type AuthEvent,
  type AuthState,
  type SignedOutReason,
} from './machine';
import type { AuthApi, TokenStorage } from './types';

export interface AuthSessionOptions {
  storage: TokenStorage;
  /** Lazily resolved so the API client and the session can reference each other. */
  api: () => AuthApi;
  now?: () => number;
  /** Refresh this many ms before the access token expires. */
  refreshSkewMs?: number;
  onError?: (error: AppError) => void;
  /** Start from a known state instead of `unknown` (e.g. signed out in tests or SSR). */
  initialState?: AuthState;
}

export type AuthSession = ReturnType<typeof createAuthSession>;

/** 4.1 — Token refresh, session expiry, sign-in / sign-out. Platform-agnostic. */
export function createAuthSession({
  storage,
  api,
  now = Date.now,
  refreshSkewMs = 30_000,
  onError,
  initialState = initialAuthState,
}: AuthSessionOptions) {
  let state: AuthState = initialState;
  const listeners = new Set<() => void>();
  let inflightRefresh: Promise<boolean> | null = null;
  /** While restoring, the fresh access token is used to load the user before we become signedIn. */
  let restoringToken: string | null = null;

  const dispatch = (event: AuthEvent) => {
    const next = authReducer(state, event);
    if (next !== state) {
      state = next;
      listeners.forEach((l) => l());
    }
  };

  const expiresAt = (expiresIn: number) => now() + expiresIn * 1000;

  async function doRefresh(): Promise<boolean> {
    const refreshToken = await storage.getRefreshToken();
    const noSession =
      storage.kind === 'token' ? !refreshToken : storage.sessionHint?.get() === false;
    if (noSession) {
      dispatch(state.status === 'unknown' ? { type: 'RESTORE_FAILED' } : { type: 'EXPIRED' });
      return false;
    }
    const wasUnknown = state.status === 'unknown';
    dispatch({ type: 'REFRESH_START' });
    try {
      const tokens = await api().refresh(refreshToken ?? undefined);
      if (tokens.refreshToken) await storage.setRefreshToken(tokens.refreshToken);
      storage.sessionHint?.set(true);
      // Restoring: fetch the user with the new access token before becoming signedIn.
      if (wasUnknown) {
        restoringToken = tokens.accessToken;
        const user = await api()
          .getMe()
          .finally(() => (restoringToken = null));
        dispatch({
          type: 'REFRESHED',
          accessToken: tokens.accessToken,
          expiresAt: expiresAt(tokens.expiresIn),
          user,
        });
      } else {
        dispatch({
          type: 'REFRESHED',
          accessToken: tokens.accessToken,
          expiresAt: expiresAt(tokens.expiresIn),
        });
      }
      return true;
    } catch (e) {
      const error = normalizeError(e);
      const rejected = error.code === 'unauthorized' || error.code === 'forbidden';
      if (rejected) {
        await storage.setRefreshToken(null);
        storage.sessionHint?.set(false);
      }
      if (wasUnknown) {
        // Offline at startup keeps the stored token so the next launch can restore it.
        dispatch({ type: 'RESTORE_FAILED' });
        if (!rejected) onError?.(error);
      } else if (rejected) {
        dispatch({ type: 'EXPIRED' });
      } else {
        // Transient failure (offline): keep the session, let the caller retry later.
        if (state.status === 'refreshing') state = { ...state, status: 'signedIn' };
        listeners.forEach((l) => l());
        onError?.(error);
      }
      return false;
    }
  }

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },

    /** Call once at startup: resumes a stored session or settles on signedOut. */
    restore: () =>
      state.status === 'unknown'
        ? (inflightRefresh ??= doRefresh().finally(() => (inflightRefresh = null)))
        : Promise.resolve(state.status === 'signedIn'),

    async signIn(input: SignInInput) {
      const res = await api().signIn(input);
      await storage.setRefreshToken(res.refreshToken ?? null);
      storage.sessionHint?.set(true);
      dispatch({
        type: 'SIGNED_IN',
        user: res.user,
        accessToken: res.accessToken,
        expiresAt: expiresAt(res.expiresIn),
      });
      return res.user;
    },

    /** Deduplicated: concurrent callers share one refresh. Wired into the api-client's refreshAuth. */
    refresh(): Promise<boolean> {
      // A 401 while restoring must not wait on the restore that is itself waiting on it.
      if (state.status === 'signedOut' || restoringToken) return Promise.resolve(false);
      inflightRefresh ??= doRefresh().finally(() => (inflightRefresh = null));
      return inflightRefresh;
    },

    /** Returns a valid access token, refreshing first when it is about to expire. */
    async getAccessToken(): Promise<string | null> {
      if (state.status === 'unknown' && restoringToken) return restoringToken;
      if (state.status !== 'signedIn' && state.status !== 'refreshing') return null;
      if (state.expiresAt - refreshSkewMs <= now()) {
        const ok = await this.refresh();
        if (!ok) return null;
      }
      const s = state as AuthState;
      return s.status === 'signedIn' || s.status === 'refreshing' ? s.accessToken : null;
    },

    async signOut(reason: SignedOutReason = 'user') {
      try {
        await api().signOut();
      } catch {
        // Signing out locally must always succeed.
      }
      await storage.setRefreshToken(null);
      storage.sessionHint?.set(false);
      dispatch({ type: 'SIGNED_OUT', reason });
    },

    /** Used when the server reports the session is gone (e.g. account deleted). */
    async expire() {
      await storage.setRefreshToken(null);
      storage.sessionHint?.set(false);
      dispatch({ type: 'EXPIRED' });
    },
  };
}
