import { createApiClient, createEndpoints } from '../api-client';
import { fixtures } from '@repo/testing/fixtures';
import { API_URL, server, http, HttpResponse } from '@repo/testing/msw-node';

import { createMemoryTokenStorage } from './memory-storage';
import { createAuthSession } from './session';

// 13.11 — the auth machine through refresh, expiry and logout, with injected in-memory storage,
// wired to the real api-client against MSW handlers.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function setup(initialToken: string | null = null, now = () => Date.now()) {
  const storage = createMemoryTokenStorage(initialToken);
  // eslint-disable-next-line prefer-const
  let session: ReturnType<typeof createAuthSession>;
  const client = createApiClient({
    baseUrl: API_URL,
    retries: 0,
    getAccessToken: () => session.getAccessToken(),
    refreshAuth: () => session.refresh(),
  });
  const api = createEndpoints(client);
  session = createAuthSession({ storage, api: () => api, now });
  return { session, storage, api };
}

describe('auth session', () => {
  it('restores to signedOut without a stored token', async () => {
    const { session } = setup();
    await session.restore();
    expect(session.getState()).toEqual({ status: 'signedOut', reason: 'initial' });
  });

  it('restores a stored session via refresh + /me', async () => {
    const { session } = setup(fixtures.tokens.refreshToken);
    await expect(session.restore()).resolves.toBe(true);
    expect(session.getState()).toMatchObject({ status: 'signedIn', user: fixtures.user });
  });

  it('signs in, persists the refresh token and authorizes requests', async () => {
    const { session, storage, api } = setup();
    await session.signIn(fixtures.credentials);
    expect(storage.peek()).toBe(fixtures.tokens.refreshToken);
    await expect(api.getGreeting()).resolves.toMatchObject({
      message: `Hello, ${fixtures.user.name}!`,
    });
  });

  it('refreshes an expired access token transparently', async () => {
    let t = 0;
    const { session, api } = setup(null, () => t);
    await session.signIn(fixtures.credentials);
    t += fixtures.tokens.expiresIn * 1000; // access token now expired
    await expect(api.getMe()).resolves.toEqual(fixtures.user);
    expect(session.getState()).toMatchObject({
      status: 'signedIn',
      expiresAt: t + fixtures.tokens.expiresIn * 1000,
    });
  });

  it('expires the session when refresh is rejected', async () => {
    let t = 0;
    const { session, storage } = setup(null, () => t);
    await session.signIn(fixtures.credentials);
    server.use(http.post(`${API_URL}/auth/refresh`, () => new HttpResponse(null, { status: 401 })));
    t += fixtures.tokens.expiresIn * 1000;
    await expect(session.getAccessToken()).resolves.toBeNull();
    expect(session.getState()).toEqual({ status: 'signedOut', reason: 'expired' });
    expect(storage.peek()).toBeNull();
  });

  it('keeps the session on a transient refresh failure', async () => {
    const { session } = setup();
    await session.signIn(fixtures.credentials);
    server.use(http.post(`${API_URL}/auth/refresh`, () => HttpResponse.error()));
    await expect(session.refresh()).resolves.toBe(false);
    expect(session.getState().status).toBe('signedIn');
  });

  it('cookie sessions: skips the refresh probe when no session was ever established', async () => {
    let refreshCalls = 0;
    server.use(
      http.post(
        `${API_URL}/auth/refresh`,
        () => (refreshCalls++, new HttpResponse(null, { status: 401 })),
      ),
    );
    let active = false;
    const storage = {
      ...createMemoryTokenStorage(null, 'cookie'),
      sessionHint: { get: () => active, set: (v: boolean) => void (active = v) },
    };
    const client = createApiClient({ baseUrl: API_URL, retries: 0 });
    const api = createEndpoints(client);
    const session = createAuthSession({ storage, api: () => api });
    await session.restore();
    expect(session.getState()).toEqual({ status: 'signedOut', reason: 'initial' });
    expect(refreshCalls).toBe(0);

    await session.signIn(fixtures.credentials);
    expect(active).toBe(true);
    await session.signOut();
    expect(active).toBe(false);
  });

  it('signs out locally even if the server call fails', async () => {
    const { session, storage } = setup();
    await session.signIn(fixtures.credentials);
    server.use(http.post(`${API_URL}/auth/logout`, () => HttpResponse.error()));
    await session.signOut();
    expect(session.getState()).toEqual({ status: 'signedOut', reason: 'user' });
    expect(storage.peek()).toBeNull();
  });
});
