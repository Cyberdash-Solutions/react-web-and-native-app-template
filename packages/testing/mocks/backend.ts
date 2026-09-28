/**
 * An in-memory fake of the backend API. It is the single implementation behind:
 *   - MSW handlers for unit / integration tests (13.10)
 *   - packages/testing/mock-api, the seeded test backend for local dev and E2E (13.18)
 * It is written in erasable-syntax TypeScript with type-only imports so Node can run it
 * directly (packages/testing/mock-api) without a build step.
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

interface Account {
  user: Fixtures['user'];
  password: string;
  accessToken: string;
  /** The account's refresh token; `live` is false once it is revoked (sign-out). */
  refreshToken: string;
  live: boolean;
  messages: Fixtures['messages'];
}

export function createMockBackend(fixtures: Fixtures) {
  let db = seed();

  function seed() {
    return {
      /** Fixtures seed one account (Ada); POST /auth/register adds more. */
      accounts: [
        {
          user: structuredClone(fixtures.user),
          password: fixtures.credentials.password,
          accessToken: fixtures.tokens.accessToken,
          refreshToken: fixtures.tokens.refreshToken,
          live: true,
          messages: structuredClone(fixtures.messages),
        },
      ] as Account[],
      nextId: 1,
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
  const byEmail = (email: unknown) =>
    typeof email === 'string'
      ? db.accounts.find((a) => a.user.email.toLowerCase() === email.trim().toLowerCase())
      : undefined;
  /** The signed-in account, from the bearer access token. */
  const authed = (req: MockRequest) =>
    db.accounts.find((a) => req.header('authorization') === `Bearer ${a.accessToken}`);
  const presentedRefresh = (req: MockRequest, body: Record<string, unknown>) =>
    (body.refreshToken as string | undefined) ?? cookie(req, REFRESH_COOKIE);
  const tokenBody = (account: Account, web: boolean) => ({
    accessToken: account.accessToken,
    expiresIn: fixtures.tokens.expiresIn,
    ...(web ? {} : { refreshToken: account.refreshToken }),
  });
  /** A signed-in response: tokens + user; web gets the refresh token as an httpOnly cookie. */
  const startSession = (status: number, account: Account, req: MockRequest) => {
    account.live = true;
    const web = isWeb(req);
    return json(
      status,
      { ...tokenBody(account, web), user: account.user },
      web ? setRefreshCookie(account.refreshToken) : undefined,
    );
  };

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
        const name = authed(req)?.user.name ?? 'world';
        return json(200, { message: `Hello, ${name}!`, name, servedAt: new Date().toISOString() });
      }
      case 'POST /auth/register': {
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        if (!name) return json(422, { message: 'validation:nameRequired' });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          return json(422, { message: 'validation:emailInvalid' });
        if (password.length < 8) return json(422, { message: 'validation:passwordTooShort' });
        if (byEmail(email)) return json(409, { message: 'errors:emailTaken' });
        const id = `u_${db.nextId++}`;
        const account: Account = {
          user: { id, name, email, createdAt: new Date().toISOString() },
          password,
          accessToken: `access-${id}`,
          refreshToken: `refresh-${id}`,
          live: true,
          messages: [],
        };
        db.accounts.push(account);
        return startSession(201, account, req);
      }
      case 'POST /auth/login': {
        const account = byEmail(body.email);
        if (!account || body.password !== account.password)
          return json(401, { message: 'errors:invalidCredentials' });
        return startSession(200, account, req);
      }
      case 'POST /auth/refresh': {
        const presented = presentedRefresh(req, body);
        const account = db.accounts.find((a) => a.live && a.refreshToken === presented);
        if (!presented || !account) return json(401, { message: 'Session expired' });
        return json(200, tokenBody(account, isWeb(req)));
      }
      case 'POST /auth/logout': {
        const presented = presentedRefresh(req, body);
        const account =
          db.accounts.find((a) => a.refreshToken === presented) ?? authed(req) ?? null;
        if (account) account.live = false;
        return json(204, undefined, setRefreshCookie(null));
      }
      case 'GET /me': {
        const account = authed(req);
        return account ? json(200, account.user) : json(401, { message: 'Unauthorized' });
      }
      case 'PATCH /me': {
        const account = authed(req);
        if (!account) return json(401, { message: 'Unauthorized' });
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        if (!name) return json(422, { message: 'validation:nameRequired' });
        account.user = { ...account.user, name };
        return json(200, account.user);
      }
      case 'DELETE /me': {
        const account = authed(req);
        if (!account) return json(401, { message: 'Unauthorized' });
        db.accounts = db.accounts.filter((a) => a !== account);
        return json(204);
      }
      case 'GET /me/export': {
        const account = authed(req);
        if (!account) return json(401, { message: 'Unauthorized' });
        return json(200, {
          user: account.user,
          messages: account.messages,
          exportedAt: new Date().toISOString(),
        });
      }
      case 'GET /messages': {
        const account = authed(req);
        if (!account) return json(401, { message: 'Unauthorized' });
        const limit = Math.min(Number(req.query.get('limit') ?? 10), 50);
        const start = Number(req.query.get('cursor') ?? 0);
        const items = account.messages.slice(start, start + limit);
        const end = start + items.length;
        return json(200, {
          items,
          nextCursor: end < account.messages.length ? String(end) : null,
        });
      }
    }
    const message = req.path.match(/^\/messages\/([^/]+)$/);
    if (req.method === 'GET' && message) {
      const account = authed(req);
      if (!account) return json(401, { message: 'Unauthorized' });
      const found = account.messages.find((m) => m.id === message[1]);
      return found ? json(200, found) : json(404, { message: 'Not found' });
    }
    return json(404, { message: `No mock for ${route}` });
  }

  return { handle, reset: () => void (db = seed()) };
}

export type MockBackend = ReturnType<typeof createMockBackend>;
