/**
 * 6.1 — The analytics event taxonomy. Adding an event means adding it here; `track()` is typed
 * against this map, so both apps emit identical names and property shapes.
 */
export interface AnalyticsEvents {
  app_opened: { coldStart: boolean };
  screen_viewed: { screen: string };
  signed_in: { method: 'password' | 'oauth' };
  signed_out: { reason: 'user' | 'expired' | 'deleted' };
  greeting_viewed: { variant: 'classic' | 'enthusiastic'; authenticated: boolean };
  profile_updated: Record<string, never>;
  data_exported: Record<string, never>;
  consent_updated: { analytics: boolean };
}

export type AnalyticsEventName = keyof AnalyticsEvents;

export interface AnalyticsEnvelope<N extends AnalyticsEventName = AnalyticsEventName> {
  name: N;
  properties: AnalyticsEvents[N];
  /** Added by the client: app, platform, version (6.3 tagging applies here too). */
  context: Record<string, string>;
  timestamp: string;
}
