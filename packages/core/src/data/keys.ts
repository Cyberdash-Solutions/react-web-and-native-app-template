/** 2.2 — Query keys live in one place so invalidation rules (3.2) can't drift. */
export const queryKeys = {
  all: ['app'] as const,
  greeting: () => [...queryKeys.all, 'greeting'] as const,
  appConfig: () => [...queryKeys.all, 'config'] as const,
  me: () => [...queryKeys.all, 'me'] as const,
  messages: () => [...queryKeys.all, 'messages'] as const,
  message: (id: string) => [...queryKeys.messages(), id] as const,
};

/** 3.2 — Which queries a mutation invalidates. */
export const invalidates = {
  updateProfile: [queryKeys.me(), queryKeys.greeting()],
  signIn: [queryKeys.all],
  signOut: [queryKeys.all],
} as const;
