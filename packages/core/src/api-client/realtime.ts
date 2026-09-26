import { backoffDelay } from '../utils';

/**
 * 3.4 — Real-time transport shared by both apps: WebSocket is available in React Native and
 * browsers alike. Reconnects with jittered backoff, re-authenticates on every connect, and
 * delivers typed messages to subscribers. (Background sync differs per platform: see
 * apps/mobile/src/background.ts and apps/web/public/sw.js.)
 */
export type RealtimeStatus = 'connecting' | 'open' | 'closed';

export interface RealtimeOptions<M> {
  url: string;
  /** Appended as ?token=… on connect (browsers can't set WebSocket headers). */
  getAccessToken?: () => string | null | Promise<string | null>;
  parse?: (data: string) => M;
  WebSocketImpl?: typeof WebSocket;
  maxRetries?: number;
  schedule?: (fn: () => void, ms: number) => unknown;
}

export function createRealtimeClient<M = unknown>(options: RealtimeOptions<M>) {
  const {
    url,
    getAccessToken,
    parse = (d) => JSON.parse(d) as M,
    WebSocketImpl = globalThis.WebSocket,
    maxRetries = Infinity,
    schedule = (fn, ms) => setTimeout(fn, ms),
  } = options;
  const listeners = new Set<(message: M) => void>();
  const statusListeners = new Set<(status: RealtimeStatus) => void>();
  let socket: WebSocket | null = null;
  let attempt = 0;
  let stopped = true;

  const setStatus = (s: RealtimeStatus) => statusListeners.forEach((l) => l(s));

  async function open() {
    if (stopped) return;
    setStatus('connecting');
    const token = await getAccessToken?.();
    const target = new URL(url);
    if (token) target.searchParams.set('token', token);
    const ws = new WebSocketImpl(target.toString());
    socket = ws;
    ws.onopen = () => {
      attempt = 0;
      setStatus('open');
    };
    ws.onmessage = (event) => {
      try {
        const message = parse(String(event.data));
        listeners.forEach((l) => l(message));
      } catch {
        // Ignore malformed frames rather than tearing down the connection.
      }
    };
    ws.onclose = () => {
      socket = null;
      setStatus('closed');
      if (stopped || attempt >= maxRetries) return;
      schedule(() => void open(), backoffDelay(attempt++));
    };
  }

  return {
    connect() {
      if (!stopped) return;
      stopped = false;
      void open();
    },
    disconnect() {
      stopped = true;
      socket?.close();
    },
    send(message: unknown) {
      socket?.send(JSON.stringify(message));
    },
    subscribe(listener: (message: M) => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    onStatus(listener: (status: RealtimeStatus) => void) {
      statusListeners.add(listener);
      return () => void statusListeners.delete(listener);
    },
  };
}
