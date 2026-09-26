/** 10.1 — Intl formatters. Pure functions: identical output on Hermes (with Intl) and browsers. */
export const formatNumber = (value: number, locale: string, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(locale, options).format(value);

export const formatCurrency = (value: number, locale: string, currency: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);

export const formatDate = (
  value: Date | string | number,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
) => new Intl.DateTimeFormat(locale, options).format(new Date(value));

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
];

export function formatRelativeTime(
  value: Date | string | number,
  locale: string,
  now: Date = new Date(),
): string {
  const diffSeconds = Math.round((new Date(value).getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, seconds] of UNITS) {
    if (Math.abs(diffSeconds) >= seconds || unit === 'second')
      return rtf.format(Math.round(diffSeconds / seconds), unit);
  }
  return rtf.format(0, 'second');
}

export const formatList = (
  items: string[],
  locale: string,
  type: 'conjunction' | 'disjunction' = 'conjunction',
) => new Intl.ListFormat(locale, { style: 'long', type }).format(items);
