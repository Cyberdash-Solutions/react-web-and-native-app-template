import type { User } from '@repo/domain';

/**
 * 4.1 — The auth state machine, as a pure reducer. Side effects (network, storage) live in
 * session.ts; this file only decides which transitions are legal.
 *
 *   unknown ──RESTORE_FAILED──▶ signedOut ◀──SIGNED_OUT/EXPIRED── signedIn ◀─┐
 *      │                          │                                  │ ▲      │
 *      └────────RESTORED──────────┴──────────SIGNED_IN───────────────┘ │      │
 *                                                        REFRESH_START ▼      │
 *                                                              refreshing ─REFRESHED
 */
export type SignedOutReason = 'initial' | 'user' | 'expired' | 'deleted';

export type AuthState =
  | { status: 'unknown' }
  | { status: 'signedOut'; reason: SignedOutReason }
  | { status: 'signedIn'; user: User; accessToken: string; expiresAt: number }
  | { status: 'refreshing'; user: User; accessToken: string; expiresAt: number };

export type AuthEvent =
  | { type: 'RESTORE_FAILED' }
  | { type: 'SIGNED_IN'; user: User; accessToken: string; expiresAt: number }
  | { type: 'REFRESH_START' }
  | { type: 'REFRESHED'; accessToken: string; expiresAt: number; user?: User }
  | { type: 'EXPIRED' }
  | { type: 'SIGNED_OUT'; reason?: SignedOutReason };

export const initialAuthState: AuthState = { status: 'unknown' };

export function authReducer(state: AuthState, event: AuthEvent): AuthState {
  switch (event.type) {
    case 'RESTORE_FAILED':
      return state.status === 'unknown' ? { status: 'signedOut', reason: 'initial' } : state;
    case 'SIGNED_IN':
      return {
        status: 'signedIn',
        user: event.user,
        accessToken: event.accessToken,
        expiresAt: event.expiresAt,
      };
    case 'REFRESH_START':
      return state.status === 'signedIn' ? { ...state, status: 'refreshing' } : state;
    case 'REFRESHED':
      if (state.status === 'refreshing' || state.status === 'signedIn') {
        return {
          status: 'signedIn',
          user: event.user ?? state.user,
          accessToken: event.accessToken,
          expiresAt: event.expiresAt,
        };
      }
      // Restoring a session: we need the user to become signed in.
      return event.user
        ? {
            status: 'signedIn',
            user: event.user,
            accessToken: event.accessToken,
            expiresAt: event.expiresAt,
          }
        : state;
    case 'EXPIRED':
      return state.status === 'signedOut' ? state : { status: 'signedOut', reason: 'expired' };
    case 'SIGNED_OUT':
      return { status: 'signedOut', reason: event.reason ?? 'user' };
  }
}
