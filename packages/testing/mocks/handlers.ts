import { http, HttpResponse, type HttpHandler } from 'msw';

import { fixtures } from '../fixtures';
import { createMockBackend, type MockBackend } from './backend';

/** Default base URL — matches EXPO_PUBLIC_API_URL's default in @repo/core/config. */
export const API_URL = 'http://localhost:4000';

/** 13.10 — MSW handlers, backed by the shared mock backend. Usable in Node, the browser and Storybook. */
export function createHandlers(backend: MockBackend, baseUrl = API_URL): HttpHandler[] {
  return [
    http.all(`${baseUrl}/*`, async ({ request }) => {
      const url = new URL(request.url);
      const text =
        request.method === 'GET' || request.method === 'HEAD' ? '' : await request.text();
      const res = backend.handle({
        method: request.method,
        path: url.pathname,
        query: url.searchParams,
        header: (n) => request.headers.get(n),
        body: text ? JSON.parse(text) : undefined,
      });
      return res.body === undefined
        ? new HttpResponse(null, { status: res.status, headers: res.headers })
        : HttpResponse.json(res.body, { status: res.status, headers: res.headers });
    }),
  ];
}

export const backend = createMockBackend(fixtures);
export const handlers = createHandlers(backend);
export { http, HttpResponse };
