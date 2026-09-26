import { AppError, codeFromStatus, normalizeError } from './errors';

describe('normalizeError', () => {
  it('passes AppErrors through', () => {
    const e = new AppError('server');
    expect(normalizeError(e)).toBe(e);
  });
  it('maps TypeError (fetch failure) to network', () =>
    expect(normalizeError(new TypeError('Failed to fetch')).code).toBe('network'));
  it('maps AbortError to cancelled', () =>
    expect(normalizeError(Object.assign(new Error('aborted'), { name: 'AbortError' })).code).toBe(
      'cancelled',
    ));
  it('handles non-errors', () => expect(normalizeError('boom').message).toBe('boom'));
});

test('codeFromStatus / retryable', () => {
  expect(codeFromStatus(401)).toBe('unauthorized');
  expect(codeFromStatus(503)).toBe('server');
  expect(new AppError(codeFromStatus(503)).retryable).toBe(true);
  expect(new AppError(codeFromStatus(422)).retryable).toBe(false);
  expect(new AppError('network').userMessageKey).toBe('errors:network');
});
