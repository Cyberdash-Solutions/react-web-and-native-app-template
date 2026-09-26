import { AppError, greetingSchema } from '@repo/domain';
import { fixtures } from '@repo/testing/fixtures';
import { server, http, HttpResponse, API_URL } from '@repo/testing/msw-node';

import { createApiClient } from './client';

// 13.10 — exercised against MSW, not a mocked fetch.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const noSleep = () => Promise.resolve();

describe('api-client', () => {
  it('parses responses with the schema', async () => {
    const client = createApiClient({ baseUrl: API_URL, sleep: noSleep });
    await expect(client.get('/greeting', { schema: greetingSchema })).resolves.toEqual({
      ...fixtures.greetingAnonymous,
      servedAt: expect.any(String),
    });
  });

  it('retries idempotent requests on 5xx, then succeeds', async () => {
    let calls = 0;
    server.use(
      http.get(`${API_URL}/flaky`, () =>
        ++calls < 3 ? new HttpResponse(null, { status: 503 }) : HttpResponse.json({ ok: true }),
      ),
    );
    const client = createApiClient({ baseUrl: API_URL, retries: 2, sleep: noSleep });
    await expect(client.get('/flaky')).resolves.toEqual({ ok: true });
    expect(calls).toBe(3);
  });

  it('never retries non-idempotent requests', async () => {
    let calls = 0;
    server.use(
      http.post(`${API_URL}/once`, () => (calls++, new HttpResponse(null, { status: 503 }))),
    );
    const client = createApiClient({ baseUrl: API_URL, sleep: noSleep });
    await expect(client.post('/once', {})).rejects.toMatchObject({ code: 'server', status: 503 });
    expect(calls).toBe(1);
  });

  it('normalizes 4xx errors with the server message', async () => {
    server.use(
      http.get(`${API_URL}/missing`, () => HttpResponse.json({ message: 'Nope' }, { status: 404 })),
    );
    const client = createApiClient({ baseUrl: API_URL, sleep: noSleep });
    const error = await client.get('/missing').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: 'not_found', message: 'Nope', retryable: false });
  });

  it('rejects responses that violate the contract', async () => {
    server.use(http.get(`${API_URL}/greeting`, () => HttpResponse.json({ nope: true })));
    const client = createApiClient({ baseUrl: API_URL, sleep: noSleep });
    await expect(client.get('/greeting', { schema: greetingSchema })).rejects.toMatchObject({
      code: 'server',
    });
  });

  it('times out slow requests', async () => {
    server.use(http.get(`${API_URL}/slow`, () => new Promise(() => {})));
    const client = createApiClient({ baseUrl: API_URL, timeoutMs: 20, retries: 0 });
    await expect(client.get('/slow')).rejects.toMatchObject({ code: 'timeout' });
  });

  it('supports caller cancellation', async () => {
    server.use(http.get(`${API_URL}/slow`, () => new Promise(() => {})));
    const client = createApiClient({ baseUrl: API_URL });
    const controller = new AbortController();
    const pending = client.get('/slow', { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: 'cancelled' });
  });

  it('refreshes once on 401 (shared across concurrent requests) and retries', async () => {
    let token = 'expired';
    const refreshAuth = jest.fn(async () => {
      token = 'fresh';
      return true;
    });
    server.use(
      http.get(`${API_URL}/secure`, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer fresh'
          ? HttpResponse.json({ ok: true })
          : new HttpResponse(null, { status: 401 }),
      ),
    );
    const client = createApiClient({
      baseUrl: API_URL,
      getAccessToken: () => token,
      refreshAuth,
      sleep: noSleep,
    });
    await expect(Promise.all([client.get('/secure'), client.get('/secure')])).resolves.toEqual([
      { ok: true },
      { ok: true },
    ]);
    expect(refreshAuth).toHaveBeenCalledTimes(1);
  });

  it('runs request and response interceptors', async () => {
    server.use(
      http.get(`${API_URL}/echo`, ({ request }) =>
        HttpResponse.json({ client: request.headers.get('X-Client') }),
      ),
    );
    const seen: number[] = [];
    const client = createApiClient({
      baseUrl: API_URL,
      interceptors: {
        request: [(ctx) => (ctx.init.headers.set('X-Client', 'test'), ctx)],
        response: [(res) => (seen.push(res.status), res)],
      },
    });
    await expect(client.get('/echo')).resolves.toEqual({ client: 'test' });
    expect(seen).toEqual([200]);
  });
});
