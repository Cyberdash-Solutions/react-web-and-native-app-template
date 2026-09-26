import { createLogger, REDACTED, scrub, type LogRecord } from './logger';

describe('scrub', () => {
  it('redacts sensitive keys and inline PII', () => {
    expect(
      scrub({
        password: 'hunter2',
        nested: { accessToken: 'abc', note: 'mail ada@example.com' },
        header: 'Bearer abc.def',
      }),
    ).toEqual({
      password: REDACTED,
      nested: { accessToken: REDACTED, note: `mail ${REDACTED}` },
      header: `Bearer ${REDACTED}`,
    });
  });
});

describe('createLogger', () => {
  it('respects minLevel, merges child context and scrubs before transports see data', () => {
    const records: LogRecord[] = [];
    const logger = createLogger({
      transports: [(r) => records.push(r)],
      minLevel: 'info',
      context: { app: 'web' },
    });
    logger.debug('hidden');
    logger.child({ userEmail: 'ada@example.com' }).info('signed in', { screen: 'home' });
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      level: 'info',
      context: { app: 'web', userEmail: REDACTED, screen: 'home' },
    });
  });
});
