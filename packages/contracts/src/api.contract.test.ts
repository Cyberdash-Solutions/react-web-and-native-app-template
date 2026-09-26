import {
  appConfigSchema,
  dataExportSchema,
  greetingSchema,
  messagesPageSchema,
  signInResponseSchema,
  userSchema,
  authTokensSchema,
} from '@repo/domain';
import { fixtures } from '@repo/testing/fixtures';
import type { z } from 'zod';

import { supportedClients } from './clients';

/**
 * 13.13 — Consumer-side contract tests: the backend's real responses must satisfy the schemas
 * this repo's apps parse. (Pact is the drop-in alternative when the backend team runs provider
 * verification; the Zod schemas here are the consumer contract either way.)
 */
const API = () => process.env.CONTRACT_API_URL!;

async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API()}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : undefined, headers: res.headers };
}

function expectShape(schema: z.ZodType, body: unknown) {
  const result = schema.safeParse(body);
  if (!result.success)
    throw new Error(`Contract violation:\n${JSON.stringify(result.error.issues, null, 2)}`);
}

let accessToken: string;

beforeAll(async () => {
  await call('/__reset', { method: 'POST' }).catch(() => undefined);
  const res = await call('/auth/login', {
    method: 'POST',
    body: JSON.stringify(fixtures.credentials),
  });
  expect(res.status).toBe(200);
  expectShape(signInResponseSchema, res.body);
  accessToken = res.body.accessToken;
});

const authed = () => ({ headers: { Authorization: `Bearer ${accessToken}` } });

describe('current client contract', () => {
  it('GET /config', async () => expectShape(appConfigSchema, (await call('/config')).body));
  it('GET /greeting (anonymous)', async () =>
    expectShape(greetingSchema, (await call('/greeting')).body));
  it('GET /greeting (signed in)', async () =>
    expectShape(greetingSchema, (await call('/greeting', authed())).body));
  it('GET /me', async () => expectShape(userSchema, (await call('/me', authed())).body));
  it('GET /messages', async () =>
    expectShape(messagesPageSchema, (await call('/messages?limit=5', authed())).body));
  it('GET /me/export', async () =>
    expectShape(dataExportSchema, (await call('/me/export', authed())).body));
  it('POST /auth/refresh', async () => {
    const res = await call('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: fixtures.tokens.refreshToken }),
    });
    expectShape(authTokensSchema, res.body);
  });
  it('web clients never receive the refresh token in the body (4.2)', async () => {
    const res = await call('/auth/login', {
      method: 'POST',
      body: JSON.stringify(fixtures.credentials),
      headers: { 'X-Client-Platform': 'web' },
    });
    expect(res.body.refreshToken).toBeUndefined();
    expect(res.headers.get('set-cookie')).toMatch(/HttpOnly/);
  });
  it('rejects unauthenticated access with 401', async () =>
    expect((await call('/me')).status).toBe(401));
});

// 13.14 — old-client compatibility.
describe.each(supportedClients)('mobile client $version contract', (client) => {
  it('GET /greeting', async () =>
    expectShape(client.greeting, (await call('/greeting', authed())).body));
  it('GET /me', async () => expectShape(client.user, (await call('/me', authed())).body));
  it('GET /config', async () => expectShape(client.config, (await call('/config')).body));
  it('POST /auth/login', async () =>
    expectShape(
      client.signIn,
      (await call('/auth/login', { method: 'POST', body: JSON.stringify(fixtures.credentials) }))
        .body,
    ));
});
