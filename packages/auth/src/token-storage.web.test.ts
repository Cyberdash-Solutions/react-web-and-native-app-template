import { createPlatformTokenStorage } from './token-storage.web';

// Web only (4.2): no credential ever reaches JS-readable storage; only a boolean session hint.
describe('web token storage', () => {
  beforeEach(() => window.localStorage.clear());

  it('never stores tokens', async () => {
    const storage = createPlatformTokenStorage();
    await storage.setRefreshToken('secret');
    await expect(storage.getRefreshToken()).resolves.toBeNull();
    expect(JSON.stringify(window.localStorage)).not.toContain('secret');
  });

  it('keeps a session hint across instances', () => {
    expect(createPlatformTokenStorage().sessionHint?.get()).toBe(false);
    createPlatformTokenStorage().sessionHint?.set(true);
    expect(createPlatformTokenStorage().sessionHint?.get()).toBe(true);
    createPlatformTokenStorage().sessionHint?.set(false);
    expect(createPlatformTokenStorage().sessionHint?.get()).toBe(false);
  });
});
