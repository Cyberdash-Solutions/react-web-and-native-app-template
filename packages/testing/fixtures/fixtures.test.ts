import {
  appConfigSchema,
  authTokensSchema,
  greetingSchema,
  messageSchema,
  signInInputSchema,
  userSchema,
} from '@repo/domain';

import { buildGreeting, buildMessage, buildUser } from '../factories';
import { fixtures } from './index';

// 13.6 — fixtures and factories must satisfy the same schemas as real responses.
describe('fixtures match domain schemas', () => {
  it.each([
    ['user', userSchema, fixtures.user],
    ['credentials', signInInputSchema, fixtures.credentials],
    ['tokens', authTokensSchema, fixtures.tokens],
    ['greeting', greetingSchema, fixtures.greetingAnonymous],
    ['appConfig', appConfigSchema, fixtures.appConfig],
    ['factory user', userSchema, buildUser()],
    ['factory message', messageSchema, buildMessage()],
    ['factory greeting', greetingSchema, buildGreeting({ name: 'Ada' })],
  ] as const)('%s', (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(true);
  });

  it('messages', () =>
    fixtures.messages.forEach((m) => expect(messageSchema.safeParse(m).success).toBe(true)));
});
