import { fixtures } from '@repo/testing/fixtures';
import { API_URL, http, HttpResponse, server } from '@repo/testing/msw-node';
import { createTestDataWrapper } from '@repo/testing/render';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useGreeting, useMe, useMessages, useUpdateProfile, useUpgradeRequired } from './hooks';
import { queryKeys } from './keys';

// 13.10 — data hooks against MSW, through the real api-client.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('data hooks', () => {
  it('useGreeting loads the anonymous greeting', async () => {
    const { wrapper } = createTestDataWrapper();
    const { result } = renderHook(() => useGreeting(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      ...fixtures.greetingAnonymous,
      servedAt: expect.any(String),
    });
  });

  it('surfaces normalized errors', async () => {
    server.use(
      http.get(`${API_URL}/greeting`, () =>
        HttpResponse.json({ message: 'down' }, { status: 503 }),
      ),
    );
    const { wrapper } = createTestDataWrapper();
    const { result } = renderHook(() => useGreeting(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ code: 'server' });
  });

  it('useMessages pages through cursors', async () => {
    const { wrapper } = createTestDataWrapper({ signedIn: true });
    const { result } = renderHook(() => useMessages(), { wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(10));
    await act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.data).toHaveLength(fixtures.messages.length));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('useUpdateProfile applies optimistically and rolls back on failure', async () => {
    let fail!: () => void;
    const gate = new Promise<void>((resolve) => (fail = resolve));
    server.use(
      http.patch(
        `${API_URL}/me`,
        async () => (await gate, HttpResponse.json({ message: 'nope' }, { status: 422 })),
      ),
    );
    const { wrapper, queryClient } = createTestDataWrapper({ signedIn: true });
    const { result } = renderHook(() => ({ me: useMe(), update: useUpdateProfile() }), { wrapper });
    await waitFor(() => expect(result.current.me.data?.name).toBe(fixtures.user.name));

    act(() => result.current.update.mutate({ name: 'Grace' }));
    await waitFor(() =>
      expect(queryClient.getQueryData<{ name: string }>(queryKeys.me())?.name).toBe('Grace'),
    );
    fail();
    await waitFor(() => expect(result.current.update.isError).toBe(true));
    expect(queryClient.getQueryData<{ name: string }>(queryKeys.me())?.name).toBe(
      fixtures.user.name,
    );
  });

  it('useUpdateProfile invalidates the greeting on success', async () => {
    const { wrapper } = createTestDataWrapper({ signedIn: true });
    const { result } = renderHook(() => ({ greeting: useGreeting(), update: useUpdateProfile() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.greeting.data?.name).toBe(fixtures.user.name));
    await act(() => result.current.update.mutateAsync({ name: 'Grace' }));
    await waitFor(() => expect(result.current.greeting.data?.message).toBe('Hello, Grace!'));
  });

  it('useUpgradeRequired compares against the server minimum (12.6)', async () => {
    const { wrapper } = createTestDataWrapper();
    const old = renderHook(() => useUpgradeRequired('mobile', '0.9.0'), { wrapper });
    await waitFor(() => expect(old.result.current).toBe(true));
    const current = renderHook(
      () => useUpgradeRequired('mobile', fixtures.appConfig.minSupportedVersion.mobile),
      { wrapper },
    );
    await waitFor(() => expect(current.result.current).toBe(false));
  });
});
