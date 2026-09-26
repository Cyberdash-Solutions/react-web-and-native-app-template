import { normalizeError } from '../domain';
import { QueryClient } from '@tanstack/react-query';

/**
 * Query defaults shared by both apps. The api-client already retries transport failures, so
 * Query retries once more only for retryable errors — never for 4xx.
 */
export function createQueryClient(overrides: { retry?: boolean } = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry:
          overrides.retry === false
            ? false
            : (failureCount, error) => failureCount < 1 && normalizeError(error).retryable,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
}
