import {
  formatCurrency,
  formatDate,
  formatList,
  formatNumber,
  formatRelativeTime,
} from './formatters';

describe('formatters', () => {
  it('formats numbers per locale', () => {
    expect(formatNumber(1234.5, 'en')).toBe('1,234.5');
    expect(formatNumber(1234.5, 'es', { useGrouping: true })).toMatch(/1\.?234,5/);
  });
  it('formats currency', () => expect(formatCurrency(9.99, 'en', 'USD')).toBe('$9.99'));
  it('formats dates', () =>
    expect(formatDate('2026-01-15T12:00:00Z', 'en', { dateStyle: 'medium', timeZone: 'UTC' })).toBe(
      'Jan 15, 2026',
    ));
  it('formats relative time', () => {
    const now = new Date('2026-01-15T12:00:00Z');
    expect(formatRelativeTime('2026-01-15T11:58:00Z', 'en', now)).toBe('2 minutes ago');
    expect(formatRelativeTime('2026-01-16T12:00:00Z', 'en', now)).toBe('tomorrow');
  });
  it('formats lists', () => expect(formatList(['a', 'b', 'c'], 'en')).toBe('a, b, and c'));
});
