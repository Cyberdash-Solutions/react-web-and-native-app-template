import { z } from 'zod';

import { basePublicEnvSchema, createEnv, EnvValidationError } from './env';

describe('createEnv', () => {
  it('applies defaults for a valid source', () => {
    const env = createEnv(basePublicEnvSchema, {});
    expect(env.EXPO_PUBLIC_APP_ENV).toBe('development');
    expect(env.EXPO_PUBLIC_API_URL).toBe('http://localhost:4000');
  });

  it('rejects invalid values', () => {
    expect(() => createEnv(basePublicEnvSchema, { EXPO_PUBLIC_API_URL: 'not a url' })).toThrow(
      EnvValidationError,
    );
  });

  it('refuses schemas that expose non-public keys to the client', () => {
    const leaky = basePublicEnvSchema.extend({ DATABASE_PASSWORD: z.string() });
    expect(() => createEnv(leaky, { DATABASE_PASSWORD: 'x' })).toThrow(/non-public keys/);
  });
});
