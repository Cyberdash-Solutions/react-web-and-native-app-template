import {
  appConfigSchema,
  dataExportSchema,
  greetingSchema,
  messageSchema,
  messagesPageSchema,
  signInResponseSchema,
  authTokensSchema,
  userSchema,
  type SignInInput,
  type UpdateProfileInput,
} from '../domain';

import type { ApiClient } from './client';

/** Typed endpoint functions. `data` wraps these in TanStack Query hooks. */
export function createEndpoints(client: ApiClient) {
  return {
    getGreeting: (signal?: AbortSignal) =>
      client.get('/greeting', { schema: greetingSchema, signal }),
    getAppConfig: (signal?: AbortSignal) =>
      client.get('/config', { schema: appConfigSchema, signal, anonymous: true }),
    getMe: (signal?: AbortSignal) => client.get('/me', { schema: userSchema, signal }),
    updateMe: (input: UpdateProfileInput) => client.patch('/me', input, { schema: userSchema }),
    listMessages: (cursor: string | null, signal?: AbortSignal) =>
      client.get('/messages', { schema: messagesPageSchema, query: { cursor, limit: 10 }, signal }),
    getMessage: (id: string, signal?: AbortSignal) =>
      client.get(`/messages/${encodeURIComponent(id)}`, { schema: messageSchema, signal }),
    exportMyData: () => client.get('/me/export', { schema: dataExportSchema }),
    deleteMe: () => client.delete('/me'),
    signIn: (input: SignInInput) =>
      client.post('/auth/login', input, { schema: signInResponseSchema, anonymous: true }),
    refresh: (refreshToken?: string) =>
      client.post('/auth/refresh', refreshToken ? { refreshToken } : {}, {
        schema: authTokensSchema,
        anonymous: true,
      }),
    signOut: () => client.post('/auth/logout', {}, { anonymous: true }),
  };
}

export type Endpoints = ReturnType<typeof createEndpoints>;
