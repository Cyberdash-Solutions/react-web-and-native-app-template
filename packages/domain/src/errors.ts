/**
 * 5.1 — Error types, normalization and user-facing messages. Every error that crosses a
 * package boundary is an `AppError`; UIs render `userMessageKey` through i18n
 * (keys use the i18next `namespace:key` form, e.g. `errors:network`).
 */
export type AppErrorCode =
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'rate_limited'
  | 'server'
  | 'upgrade_required'
  | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status?: number;
  readonly retryable: boolean;
  readonly details?: unknown;

  constructor(
    code: AppErrorCode,
    message?: string,
    options: { status?: number; details?: unknown; cause?: unknown } = {},
  ) {
    super(message ?? code, { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.status = options.status;
    this.details = options.details;
    this.retryable = RETRYABLE.has(code);
  }

  get userMessageKey(): `errors:${AppErrorCode}` {
    return `errors:${this.code}`;
  }
}

const RETRYABLE = new Set<AppErrorCode>(['network', 'timeout', 'rate_limited', 'server']);

export function codeFromStatus(status: number): AppErrorCode {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 422 || status === 400) return 'validation';
  if (status === 426) return 'upgrade_required';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'unknown';
}

/** Turns anything thrown into an AppError. */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (isAbortError(error)) return new AppError('cancelled', 'Request cancelled', { cause: error });
  if (error instanceof TypeError) return new AppError('network', error.message, { cause: error });
  if (error instanceof Error) return new AppError('unknown', error.message, { cause: error });
  return new AppError('unknown', typeof error === 'string' ? error : 'Unknown error', {
    details: error,
  });
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name === 'AbortError'
  );
}
