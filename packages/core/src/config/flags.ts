/**
 * 6.4 — Feature flag keys are declared once, with their types and safe defaults.
 * One flag provider (LaunchDarkly, Statsig, PostHog, …) serves both apps; the React binding
 * lives in `@repo/core/config/react`.
 */
export interface FeatureFlagValues {
  /** Shows the "what's new" card on the home screen. */
  'home.whats-new': boolean;
  /** Greeting style variant for an A/B test. */
  'home.greeting-variant': 'classic' | 'enthusiastic';
}

/** Safe defaults, used whenever the provider is unavailable. */
export const featureFlags: FeatureFlagValues = {
  'home.whats-new': false,
  'home.greeting-variant': 'classic',
};

export type FeatureFlagKey = keyof FeatureFlagValues;
export type FeatureFlagValue<K extends FeatureFlagKey> = FeatureFlagValues[K];

export interface FeatureFlagClient {
  get<K extends FeatureFlagKey>(key: K): FeatureFlagValue<K>;
  subscribe(listener: () => void): () => void;
}

/** A static client — used for tests, local dev, and as the fallback when the provider is down. */
export function createStaticFlagClient(
  overrides: Partial<FeatureFlagValues> = {},
): FeatureFlagClient {
  const values: FeatureFlagValues = { ...featureFlags, ...overrides };
  return {
    get: (key) => values[key],
    subscribe: () => () => {},
  };
}
