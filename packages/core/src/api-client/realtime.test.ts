import { createRealtimeClient } from './realtime';

class FakeSocket {
  static instances: FakeSocket[] = [];
  onopen?: () => void;
  onmessage?: (e: { data: string }) => void;
  onclose?: () => void;
  sent: string[] = [];
  constructor(public url: string) {
    FakeSocket.instances.push(this);
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.onclose?.();
  }
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('realtime client', () => {
  beforeEach(() => (FakeSocket.instances = []));

  it('connects with the access token and delivers parsed messages', async () => {
    const client = createRealtimeClient<{ type: string }>({
      url: 'ws://localhost:4000/ws',
      getAccessToken: () => 'abc',
      WebSocketImpl: FakeSocket as unknown as typeof WebSocket,
    });
    const received: unknown[] = [];
    client.subscribe((m) => received.push(m));
    client.connect();
    await flush();
    const ws = FakeSocket.instances[0]!;
    expect(ws.url).toBe('ws://localhost:4000/ws?token=abc');
    ws.onopen?.();
    ws.onmessage?.({ data: '{"type":"greeting.updated"}' });
    ws.onmessage?.({ data: 'not json' });
    expect(received).toEqual([{ type: 'greeting.updated' }]);
    client.send({ type: 'ping' });
    expect(ws.sent).toEqual(['{"type":"ping"}']);
  });

  it('reconnects after an unexpected close, but not after disconnect()', async () => {
    const scheduled: (() => void)[] = [];
    const client = createRealtimeClient({
      url: 'ws://localhost:4000/ws',
      WebSocketImpl: FakeSocket as unknown as typeof WebSocket,
      schedule: (fn) => scheduled.push(fn),
    });
    client.connect();
    await flush();
    FakeSocket.instances[0]!.onclose?.();
    expect(scheduled).toHaveLength(1);
    scheduled[0]!();
    await flush();
    expect(FakeSocket.instances).toHaveLength(2);
    client.disconnect();
    expect(scheduled).toHaveLength(1);
  });
});
