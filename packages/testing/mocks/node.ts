import { setupServer } from 'msw/node';

import { backend, handlers } from './handlers';

export { API_URL, backend, http, HttpResponse } from './handlers';

/** A Node MSW server with the default handlers. Tests call listen/resetHandlers/close. */
export const server = setupServer(...handlers);

// Reset the fake backend's data between tests (handlers are reset by the test itself).
const originalReset = server.resetHandlers.bind(server);
server.resetHandlers = (...args: Parameters<typeof server.resetHandlers>) => {
  backend.reset();
  originalReset(...args);
};
