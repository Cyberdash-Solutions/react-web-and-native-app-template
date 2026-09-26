import type { Logger } from '@repo/utils';

import type { ConsentStore } from './consent';
import type { AnalyticsEnvelope, AnalyticsEventName, AnalyticsEvents } from './events';

/** A destination (Segment, Amplitude, PostHog…). Platform SDKs differ, so sinks are per platform. */
export interface AnalyticsSink {
  name: string;
  send(event: AnalyticsEnvelope): void;
  identify?(userId: string | null): void;
}

export interface Analytics {
  track<N extends AnalyticsEventName>(
    name: N,
    ...props: AnalyticsEvents[N] extends Record<string, never> ? [] : [AnalyticsEvents[N]]
  ): void;
  identify(userId: string | null): void;
}

export function createAnalytics(options: {
  sinks: AnalyticsSink[];
  consent: ConsentStore;
  context: Record<string, string>;
  logger?: Logger;
  now?: () => Date;
}): Analytics {
  const { sinks, consent, context, logger, now = () => new Date() } = options;
  // 14.1 — the single gate. Nothing is queued: events before consent are dropped.
  const allowed = () => consent.getState().analytics === true;

  return {
    track(name, ...rest) {
      const properties = (rest[0] ?? {}) as AnalyticsEvents[typeof name];
      if (!allowed()) {
        logger?.debug('analytics: dropped (no consent)', { event: name });
        return;
      }
      const envelope: AnalyticsEnvelope = {
        name,
        properties,
        context,
        timestamp: now().toISOString(),
      };
      for (const sink of sinks) {
        try {
          sink.send(envelope);
        } catch (error) {
          logger?.warn('analytics sink failed', { sink: sink.name, error });
        }
      }
    },
    identify(userId) {
      if (!allowed()) return;
      for (const sink of sinks) sink.identify?.(userId);
    },
  };
}

/** Logs events; the default sink in development and tests. */
export function createConsoleSink(logger: Logger): AnalyticsSink {
  return {
    name: 'console',
    send: (e) => logger.debug(`analytics: ${e.name}`, { ...e.properties }),
  };
}
