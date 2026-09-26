import { createAnalytics, type AnalyticsSink } from './client';
import { createConsentStore } from './consent';
import type { AnalyticsEnvelope } from './events';

function setup() {
  const sent: AnalyticsEnvelope[] = [];
  const sink: AnalyticsSink = { name: 'test', send: (e) => sent.push(e), identify: jest.fn() };
  const consent = createConsentStore();
  const analytics = createAnalytics({
    sinks: [sink],
    consent,
    context: { app: 'test' },
    now: () => new Date(0),
  });
  return { sent, sink, consent, analytics };
}

// 14.1 — no tracking before consent.
describe('analytics consent gating', () => {
  it('drops events before a consent decision', () => {
    const { analytics, sent, sink } = setup();
    analytics.track('screen_viewed', { screen: 'home' });
    analytics.identify('u_1');
    expect(sent).toEqual([]);
    expect(sink.identify).not.toHaveBeenCalled();
  });

  it('drops events after consent is declined', () => {
    const { analytics, sent, consent } = setup();
    consent.getState().setAnalyticsConsent(false);
    analytics.track('screen_viewed', { screen: 'home' });
    expect(sent).toEqual([]);
  });

  it('sends typed events with context after opt-in', () => {
    const { analytics, sent, consent } = setup();
    consent.getState().setAnalyticsConsent(true);
    analytics.track('signed_in', { method: 'password' });
    analytics.track('profile_updated');
    expect(sent).toEqual([
      {
        name: 'signed_in',
        properties: { method: 'password' },
        context: { app: 'test' },
        timestamp: '1970-01-01T00:00:00.000Z',
      },
      {
        name: 'profile_updated',
        properties: {},
        context: { app: 'test' },
        timestamp: '1970-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('isolates a failing sink', () => {
    const { consent } = setup();
    consent.getState().setAnalyticsConsent(true);
    const ok: AnalyticsEnvelope[] = [];
    const analytics = createAnalytics({
      sinks: [
        {
          name: 'broken',
          send: () => {
            throw new Error('x');
          },
        },
        { name: 'ok', send: (e) => ok.push(e) },
      ],
      consent,
      context: {},
    });
    analytics.track('screen_viewed', { screen: 'x' });
    expect(ok).toHaveLength(1);
  });
});
