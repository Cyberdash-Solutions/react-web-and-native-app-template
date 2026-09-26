import type { Endpoints } from '@repo/api-client';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';

import { connectNetworkStatus } from './network';

const EndpointsContext = createContext<Endpoints | null>(null);

export interface DataProviderProps {
  endpoints: Endpoints;
  queryClient: QueryClient;
  /** Identifies whose data is cached (e.g. the user id). Changing it resets every query (3.2). */
  sessionKey?: string;
  children: ReactNode;
}

export function DataProvider({ endpoints, queryClient, sessionKey, children }: DataProviderProps) {
  // 3.3 — wire the platform's network / focus signals into TanStack Query.
  useEffect(() => connectNetworkStatus(), []);

  // No user-scoped data survives a sign-in, sign-out or account switch.
  const previousKey = useRef(sessionKey);
  useEffect(() => {
    if (previousKey.current !== sessionKey) {
      previousKey.current = sessionKey;
      void queryClient.resetQueries();
    }
  }, [queryClient, sessionKey]);

  return (
    <EndpointsContext.Provider value={endpoints}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </EndpointsContext.Provider>
  );
}

export function useEndpoints(): Endpoints {
  const endpoints = useContext(EndpointsContext);
  if (!endpoints) throw new Error('useEndpoints must be used inside <DataProvider>');
  return endpoints;
}
