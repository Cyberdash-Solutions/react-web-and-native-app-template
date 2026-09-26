import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';

import {
  createStaticFlagClient,
  type FeatureFlagClient,
  type FeatureFlagKey,
  type FeatureFlagValue,
} from './flags';

const FlagContext = createContext<FeatureFlagClient>(createStaticFlagClient());

export function FeatureFlagProvider({
  client,
  children,
}: {
  client: FeatureFlagClient;
  children: ReactNode;
}) {
  return <FlagContext.Provider value={client}>{children}</FlagContext.Provider>;
}

/** 6.4 — typed flag hook: `useFeatureFlag('home.whats-new')` is a boolean. */
export function useFeatureFlag<K extends FeatureFlagKey>(key: K): FeatureFlagValue<K> {
  const client = useContext(FlagContext);
  return useSyncExternalStore(
    client.subscribe,
    () => client.get(key),
    () => client.get(key),
  );
}
