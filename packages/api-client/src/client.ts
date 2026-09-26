import { AppError, codeFromStatus, normalizeError } from '@repo/domain';
import { backoffDelay, sleep } from '@repo/utils';
import type { z } from 'zod';

/**
 * 3.1 — One API client for both apps: retries, timeouts, cancellation, interceptors, error
 * normalization, response validation and auth refresh. Platform differences are injected
 * (token source, credentials mode) rather than branched on.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestContext {
  url: string;
  init: RequestInit & { headers: Headers };
}

export type RequestInterceptor = (ctx: RequestContext) => RequestContext | Promise<RequestContext>;
export type ResponseInterceptor = (
  response: Response,
  ctx: RequestContext,
) => Response | Promise<Response>;

export interface ApiClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  /** Per-attempt timeout. */
  timeoutMs?: number;
  /** Retries for idempotent requests on retryable errors (network, timeout, 429, 5xx). */
  retries?: number;
  /** Returns the current access token, if any. */
  getAccessToken?: () => string | null | undefined | Promise<string | null | undefined>;
  /** Called once on a 401; resolve true if the session was refreshed and the request may be retried. */
  refreshAuth?: () => Promise<boolean>;
  /** "include" on web so the BFF's httpOnly cookies travel with requests (4.2). */
  credentials?: 'include' | 'omit' | 'same-origin';
  /** Sent on every request, e.g. client name/version for server-side min-version checks (12.6). */
  defaultHeaders?: Record<string, string>;
  interceptors?: { request?: RequestInterceptor[]; response?: ResponseInterceptor[] };
  /** Injectable for tests. */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

export interface RequestOptions<S extends z.ZodType | undefined = undefined> {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
  /** Response schema. The parsed value is returned; a mismatch throws AppError('server'). */
  schema?: S;
  /** Skip the Authorization header (e.g. sign-in). */
  anonymous?: boolean;
  retries?: number;
  timeoutMs?: number;
}

type Result<S> = S extends z.ZodType ? z.infer<S> : unknown;

const IDEMPOTENT = new Set<HttpMethod>(['GET', 'PUT', 'DELETE']);

export function createApiClient(options: ApiClientOptions) {
  const {
    baseUrl,
    fetch: fetchImpl = (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
    timeoutMs = 15_000,
    retries = 2,
    getAccessToken,
    refreshAuth,
    credentials,
    defaultHeaders = {},
    interceptors = {},
    sleep: wait = sleep,
  } = options;

  let refreshing: Promise<boolean> | null = null;
  /** Concurrent 401s share one refresh. */
  const refreshOnce = () => {
    if (!refreshAuth) return Promise.resolve(false);
    refreshing ??= refreshAuth().finally(() => {
      refreshing = null;
    });
    return refreshing;
  };

  async function attempt(
    method: HttpMethod,
    path: string,
    opts: RequestOptions<z.ZodType | undefined>,
  ): Promise<Response> {
    const headers = new Headers({ Accept: 'application/json', ...defaultHeaders });
    if (opts.body !== undefined) headers.set('Content-Type', 'application/json');
    if (!opts.anonymous && getAccessToken) {
      const token = await getAccessToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }

    const url = new URL(path.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
    for (const [k, v] of Object.entries(opts.query ?? {}))
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));

    // Timeout + caller cancellation, without relying on AbortSignal.any (not on every RN runtime).
    const controller = new AbortController();
    const onAbort = () => controller.abort(opts.signal?.reason);
    if (opts.signal?.aborted) onAbort();
    opts.signal?.addEventListener('abort', onAbort, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, opts.timeoutMs ?? timeoutMs);

    let ctx: RequestContext = {
      url: url.toString(),
      init: {
        method,
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
        credentials,
      },
    };
    try {
      for (const i of interceptors.request ?? []) ctx = await i(ctx);
      let response = await fetchImpl(ctx.url, ctx.init);
      for (const i of interceptors.response ?? []) response = await i(response, ctx);
      return response;
    } catch (error) {
      if (timedOut)
        throw new AppError('timeout', `Request timed out: ${method} ${path}`, { cause: error });
      if (opts.signal?.aborted)
        throw new AppError('cancelled', 'Request cancelled', { cause: error });
      throw normalizeError(error);
    } finally {
      clearTimeout(timer);
      opts.signal?.removeEventListener('abort', onAbort);
    }
  }

  async function toAppError(response: Response): Promise<AppError> {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = undefined;
    }
    const message =
      details && typeof details === 'object' && 'message' in details
        ? String((details as { message: unknown }).message)
        : response.statusText;
    return new AppError(codeFromStatus(response.status), message || `HTTP ${response.status}`, {
      status: response.status,
      details,
    });
  }

  async function request<S extends z.ZodType | undefined = undefined>(
    path: string,
    opts: RequestOptions<S> = {},
  ): Promise<Result<S>> {
    const method = opts.method ?? 'GET';
    const maxRetries = IDEMPOTENT.has(method) ? (opts.retries ?? retries) : 0;
    let refreshed = false;

    for (let i = 0; ; i++) {
      try {
        const response = await attempt(method, path, opts);
        if (response.status === 401 && !opts.anonymous && !refreshed) {
          refreshed = true;
          if (await refreshOnce()) {
            i--; // a refresh-retry doesn't consume a retry attempt
            continue;
          }
        }
        if (!response.ok) throw await toAppError(response);
        if (response.status === 204) return undefined as Result<S>;
        const json: unknown = await response.json();
        if (!opts.schema) return json as Result<S>;
        const parsed = opts.schema.safeParse(json);
        if (!parsed.success) {
          throw new AppError('server', `Response for ${method} ${path} failed validation`, {
            details: parsed.error.issues,
          });
        }
        return parsed.data as Result<S>;
      } catch (error) {
        const appError = normalizeError(error);
        if (i >= maxRetries || !appError.retryable || opts.signal?.aborted) throw appError;
        await wait(backoffDelay(i), opts.signal);
      }
    }
  }

  return {
    request,
    get: <S extends z.ZodType | undefined = undefined>(
      path: string,
      opts?: Omit<RequestOptions<S>, 'method' | 'body'>,
    ) => request(path, { ...opts, method: 'GET' }),
    post: <S extends z.ZodType | undefined = undefined>(
      path: string,
      body?: unknown,
      opts?: Omit<RequestOptions<S>, 'method' | 'body'>,
    ) => request(path, { ...opts, method: 'POST', body }),
    patch: <S extends z.ZodType | undefined = undefined>(
      path: string,
      body?: unknown,
      opts?: Omit<RequestOptions<S>, 'method' | 'body'>,
    ) => request(path, { ...opts, method: 'PATCH', body }),
    delete: <S extends z.ZodType | undefined = undefined>(
      path: string,
      opts?: Omit<RequestOptions<S>, 'method' | 'body'>,
    ) => request(path, { ...opts, method: 'DELETE' }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
