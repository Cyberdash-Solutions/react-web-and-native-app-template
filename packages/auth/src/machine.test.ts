import { buildUser } from '@repo/testing/factories';

import { authReducer, initialAuthState, type AuthState } from './machine';

const user = buildUser();
const signedIn: AuthState = { status: 'signedIn', user, accessToken: 'a', expiresAt: 1 };

describe('authReducer', () => {
  it('settles unknown → signedOut when nothing can be restored', () => {
    expect(authReducer(initialAuthState, { type: 'RESTORE_FAILED' })).toEqual({
      status: 'signedOut',
      reason: 'initial',
    });
  });
  it('ignores RESTORE_FAILED once settled', () => {
    expect(authReducer(signedIn, { type: 'RESTORE_FAILED' })).toBe(signedIn);
  });
  it('signedIn → refreshing → signedIn keeps the user', () => {
    const refreshing = authReducer(signedIn, { type: 'REFRESH_START' });
    expect(refreshing.status).toBe('refreshing');
    expect(authReducer(refreshing, { type: 'REFRESHED', accessToken: 'b', expiresAt: 2 })).toEqual({
      ...signedIn,
      accessToken: 'b',
      expiresAt: 2,
    });
  });
  it('expires to signedOut(expired)', () => {
    expect(authReducer(signedIn, { type: 'EXPIRED' })).toEqual({
      status: 'signedOut',
      reason: 'expired',
    });
  });
});
