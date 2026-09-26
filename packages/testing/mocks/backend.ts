/**
 * An in-memory fake of the backend API. It is the single implementation behind:
 *   - MSW handlers for unit / integration tests (13.10)
 *   - tooling/mock-api, the seeded test backend for local dev and E2E (13.18)
 * It is written in erasable-syntax TypeScript with type-only imports so Node can run it
 * directly (tooling/mock-api) without a build step.
 */
import type { Fixtures } from '../fixtures/index.ts';

export interface MockRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  header(name: string): string | null;
  body: unknown;
}

export interface MockResponse {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

const REFRESH_COOKIE = 'refresh_token';

export function createMockBackend(fixtures: Fixtures) {
  let db = seed();

  function seed() {
    return {
      user: structuredClone(fixtures.user) as Fixtures['user'] | null,
      messages: structuredClone(fixtures.messages),
      refreshToken: fixtures.tokens.refreshToken as string | null,
    };
  }

  const json = (
    status: number,
    body?: unknown,
    headers?: Record<string, string>,
  ): MockResponse => ({ status, body, headers });
  const isWeb = (req: MockRequest) => req.header('x-client-platform') === 'web';
  const cookie = (req: MockRequest, name: string) =>
    req
      .header('cookie')
      ?.split(/;\s*/)
      .find((c) => c.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null;
  const setRefreshCookie = (value: string | null) => ({
    'Set-Cookie': `${REFRESH_COOKIE}=${value ?? ''}; HttpOnly; Path=/auth; SameSite=Lax${value ? '' : '; Max-Age=0'}`,
  });
  const authed = (req: MockRequest) =>
    !!db.user && req.header('authorization') === `Bearer ${fixtures.tokens.accessToken}`;
  const tokenBody = (web: boolean) =>
    web
      ? { accessToken: fixtures.tokens.accessToken, expiresIn: fixtures.tokens.expiresIn }
      : { ...fixtures.tokens };

  function handle(req: MockRequest): MockResponse {
    const route = `${req.method.toUpperCase()} ${req.path.replace(/\/$/, '') || '/'}`;
    const body = (req.body ?? {}) as Record<string, unknown>;

    switch (route) {
      case 'POST /__reset':
        db = seed();
        return json(204);
      case 'GET /health':
        return json(200, { ok: true });
      case 'GET /config':
        return json(200, fixtures.appConfig);
      case 'GET /greeting': {
        const name = authed(req) && db.user ? db.user.name : 'world';
        return json(200, { message: `Hello, ${name}!`, name, servedAt: new Date().toISOString() });
      }
      case 'POST /auth/login': {
        if (
          !db.user ||
          body.email !== fixtures.credentials.email ||
          body.password !== fixtures.credentials.password
        ) {
          return json(401, { message: 'errors:invalidCredentials' });
        }
        db.refreshToken = fixtures.tokens.refreshToken;
        const web = isWeb(req);
        return json(
          200,
          { ...tokenBody(web), user: db.user },
          web ? setRefreshCookie(db.refreshToken) : undefined,
        );
      }
      case 'POST /auth/refresh': {
        const presented = (body.refreshToken as string | undefined) ?? cookie(req, REFRESH_COOKIE);
        if (!db.user || !presented || presented !== db.refreshToken)
          return json(401, { message: 'Session expired' });
        return json(200, tokenBody(isWeb(req)));
      }
      case 'POST /auth/logout':
        db.refreshToken = null;
        return json(204, undefined, setRefreshCookie(null));
      case 'GET /me':
        return authed(req) ? json(200, db.user) : json(401, { message: 'Unauthorized' });
      case 'PATCH /me': {
        if (!authed(req) || !db.user) return json(401, { message: 'Unauthorized' });
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        if (!name) return json(422, { message: 'validation:nameRequired' });
        db.user = { ...db.user, name };
        return json(200, db.user);
      }
      case 'DELETE /me':
        if (!authed(req)) return json(401, { message: 'Unauthorized' });
        db.user = null;
        db.refreshToken = null;
        return json(204);
      case 'GET /me/export':
        if (!authed(req) || !db.user) return json(401, { message: 'Unauthorized' });
        return json(200, {
          user: db.user,
          messages: db.messages,
          exportedAt: new Date().toISOString(),
        });
      case 'GET /messages': {
        if (!authed(req)) return json(401, { message: 'Unauthorized' });
        const limit = Math.min(Number(req.query.get('limit') ?? 10), 50);
        const start = Number(req.query.get('cursor') ?? 0);
        const items = db.messages.slice(start, start + limit);
        const end = start + items.length;
        return json(200, { items, nextCursor: end < db.messages.length ? String(end) : null });
      }
    }
    const message = req.path.match(/^\/messages\/([^/]+)$/);
    if (req.method === 'GET' && message) {
      if (!authed(req)) return json(401, { message: 'Unauthorized' });
      const found = db.messages.find((m) => m.id === message[1]);
      return found ? json(200, found) : json(404, { message: 'Not found' });
    }
    return json(404, { message: `No mock for ${route}` });
  }

  return { handle, reset: () => void (db = seed()) };
}

export type MockBackend = ReturnType<typeof createMockBackend>;
