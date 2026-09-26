/**
 * 6.2 — Logger interface with PII scrubbing. Apps plug in transports (console, Sentry
 * breadcrumbs, a log drain); every transport receives already-scrubbed data.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = Record<string, unknown>;

export interface LogRecord {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: string;
}

export type LogTransport = (record: LogRecord) => void;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(context: LogContext): Logger;
}

const SENSITIVE_KEYS =
  /pass(word)?|secret|token|authorization|cookie|api[-_]?key|ssn|card|cvv|email|phone/i;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BEARER = /bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const LONG_DIGITS = /\b\d{12,19}\b/g;

export const REDACTED = '[REDACTED]';

export function scrubString(value: string): string {
  return value
    .replace(EMAIL, REDACTED)
    .replace(BEARER, `Bearer ${REDACTED}`)
    .replace(LONG_DIGITS, REDACTED);
}

export function scrub(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[Truncated]';
  if (typeof value === 'string') return scrubString(value);
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  if (value instanceof Error) return { name: value.name, message: scrubString(value.message) };
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        SENSITIVE_KEYS.test(k) ? REDACTED : scrub(v, depth + 1),
      ]),
    );
  }
  return value;
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export function createLogger(options: {
  transports: LogTransport[];
  minLevel?: LogLevel;
  context?: LogContext;
  now?: () => Date;
}): Logger {
  const { transports, minLevel = 'debug', context: base = {}, now = () => new Date() } = options;
  const emit = (level: LogLevel, message: string, context: LogContext = {}) => {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
    const record: LogRecord = {
      level,
      message: scrubString(message),
      context: scrub({ ...base, ...context }) as LogContext,
      timestamp: now().toISOString(),
    };
    for (const t of transports) t(record);
  };
  return {
    debug: (m, c) => emit('debug', m, c),
    info: (m, c) => emit('info', m, c),
    warn: (m, c) => emit('warn', m, c),
    error: (m, c) => emit('error', m, c),
    child: (context) =>
      createLogger({ transports, minLevel, context: { ...base, ...context }, now }),
  };
}

export const consoleTransport: LogTransport = ({ level, message, context }) => {
  const fn = level === 'debug' ? console.info : console[level];
  fn(`[${level}] ${message}`, context);
};
