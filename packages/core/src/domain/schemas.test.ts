import {
  appConfigSchema,
  greetingSchema,
  signInInputSchema,
  signUpInputSchema,
  updateProfileInputSchema,
  userSchema,
} from './schemas';

// 13.6 — every schema is tested with valid and invalid payloads.
describe('userSchema', () => {
  const valid = {
    id: 'u_1',
    name: 'Ada',
    email: 'ada@example.com',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  it('accepts a valid user', () => expect(userSchema.parse(valid)).toEqual(valid));
  it('rejects a bad email', () =>
    expect(userSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false));
  it('rejects a missing id', () =>
    expect(userSchema.safeParse({ ...valid, id: undefined }).success).toBe(false));
  it('tolerates unknown fields from newer servers (12.6)', () =>
    expect(userSchema.safeParse({ ...valid, avatarUrl: 'x' }).success).toBe(true));
});

describe('greetingSchema', () => {
  it('accepts a greeting', () =>
    expect(
      greetingSchema.safeParse({
        message: 'Hello, world!',
        name: 'world',
        servedAt: new Date().toISOString(),
      }).success,
    ).toBe(true));
  it('rejects a non-ISO timestamp', () =>
    expect(
      greetingSchema.safeParse({ message: 'hi', name: 'x', servedAt: 'yesterday' }).success,
    ).toBe(false));
});

describe('signInInputSchema', () => {
  it('accepts valid credentials', () =>
    expect(
      signInInputSchema.safeParse({ email: 'ada@example.com', password: 'correct-horse' }).success,
    ).toBe(true));
  it('returns i18n keys as messages', () => {
    const r = signInInputSchema.safeParse({ email: 'x', password: 'short' });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.message)).toEqual([
      'validation:emailInvalid',
      'validation:passwordTooShort',
    ]);
  });
});

describe('updateProfileInputSchema', () => {
  it('trims names', () =>
    expect(updateProfileInputSchema.parse({ name: '  Ada ' })).toEqual({ name: 'Ada' }));
  it('rejects blank names', () =>
    expect(updateProfileInputSchema.safeParse({ name: '   ' }).success).toBe(false));
});

describe('appConfigSchema', () => {
  it('defaults maintenance to false', () =>
    expect(
      appConfigSchema.parse({ minSupportedVersion: { mobile: '1.0.0', web: '1.0.0' } }).maintenance,
    ).toBe(false));
  it('rejects a missing min version', () =>
    expect(appConfigSchema.safeParse({}).success).toBe(false));
});

describe('signUpInputSchema', () => {
  const valid = { name: 'Grace Hopper', email: 'grace@example.com', password: 'cobol-1959' };
  it('accepts a name, email and password', () =>
    expect(signUpInputSchema.safeParse(valid).success).toBe(true));
  it('trims the name and requires it', () => {
    expect(signUpInputSchema.parse({ ...valid, name: '  Grace  ' }).name).toBe('Grace');
    const r = signUpInputSchema.safeParse({ ...valid, name: '   ' });
    expect(r.error?.issues.map((i) => i.message)).toEqual(['validation:nameRequired']);
  });
  it('applies the sign-in rules to email and password', () => {
    const r = signUpInputSchema.safeParse({ ...valid, email: 'x', password: 'short' });
    expect(r.error?.issues.map((i) => i.message)).toEqual([
      'validation:emailInvalid',
      'validation:passwordTooShort',
    ]);
  });
});
