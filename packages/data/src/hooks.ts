import { type AppError, type Message, type UpdateProfileInput, type User } from '@repo/domain';
import { compareVersions } from '@repo/utils';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useEndpoints } from './context';
import { invalidates, queryKeys } from './keys';

export function useGreeting() {
  const api = useEndpoints();
  return useQuery({
    queryKey: queryKeys.greeting(),
    queryFn: ({ signal }) => api.getGreeting(signal),
  });
}

export function useMe(enabled = true) {
  const api = useEndpoints();
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: ({ signal }) => api.getMe(signal),
    enabled,
  });
}

export function useAppConfig() {
  const api = useEndpoints();
  return useQuery({
    queryKey: queryKeys.appConfig(),
    queryFn: ({ signal }) => api.getAppConfig(signal),
    staleTime: 60 * 60_000,
  });
}

/** 12.6 — true when this build is older than the server's minimum supported version. */
export function useUpgradeRequired(platform: 'mobile' | 'web', currentVersion: string): boolean {
  const { data } = useAppConfig();
  return !!data && compareVersions(currentVersion, data.minSupportedVersion[platform]) < 0;
}

/** 3.2 — cursor pagination. */
export function useMessages(enabled = true) {
  const api = useEndpoints();
  return useInfiniteQuery({
    queryKey: queryKeys.messages(),
    queryFn: ({ pageParam, signal }) => api.listMessages(pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    select: (data) => data.pages.flatMap((p) => p.items) satisfies Message[],
    enabled,
  });
}

export function useMessage(id: string) {
  const api = useEndpoints();
  return useQuery({
    queryKey: queryKeys.message(id),
    queryFn: ({ signal }) => api.getMessage(id, signal),
  });
}

/** 3.2 — optimistic update with rollback, then invalidation of dependent queries. */
export function useUpdateProfile() {
  const api = useEndpoints();
  const qc = useQueryClient();
  return useMutation<User, AppError, UpdateProfileInput, { previous?: User }>({
    mutationFn: (input) => api.updateMe(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.me() });
      const previous = qc.getQueryData<User>(queryKeys.me());
      if (previous) qc.setQueryData<User>(queryKeys.me(), { ...previous, ...input });
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) qc.setQueryData(queryKeys.me(), context.previous);
    },
    onSettled: () =>
      Promise.all(invalidates.updateProfile.map((queryKey) => qc.invalidateQueries({ queryKey }))),
  });
}

/** 14.4 — data export, backed by the same API on both platforms. */
export function useExportData() {
  const api = useEndpoints();
  return useMutation({ mutationFn: () => api.exportMyData() });
}

/** 14.4 — account deletion. The caller signs out afterwards. */
export function useDeleteAccount() {
  const api = useEndpoints();
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.deleteMe(), onSuccess: () => qc.clear() });
}

/** Call after sign-in / sign-out so no user-scoped data leaks across sessions. */
export function useResetUserData() {
  const qc = useQueryClient();
  return () => Promise.all(invalidates.signOut.map((queryKey) => qc.resetQueries({ queryKey })));
}
