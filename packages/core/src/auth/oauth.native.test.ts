import { startOAuthSignIn } from './oauth.native';

const mockPromptAsync = jest.fn();
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: ({ scheme, path }: { scheme: string; path: string }) => `${scheme}://${path}`,
  AuthRequest: jest.fn().mockImplementation((config: { usePKCE: boolean }) => ({
    config,
    codeVerifier: 'verifier-123',
    promptAsync: mockPromptAsync,
  })),
}));

const config = {
  clientId: 'client',
  authorizationEndpoint: 'https://id.example.com/authorize',
  scopes: ['openid'],
  scheme: 'helloworld',
};

// 4.3 — Authorization Code + PKCE through the system browser.
describe('startOAuthSignIn (native)', () => {
  beforeEach(() => mockPromptAsync.mockReset());

  it('returns the code, PKCE verifier and redirect URI on success', async () => {
    mockPromptAsync.mockResolvedValue({ type: 'success', params: { code: 'abc' } });
    await expect(startOAuthSignIn(config)).resolves.toEqual({
      type: 'code',
      code: 'abc',
      codeVerifier: 'verifier-123',
      redirectUri: 'helloworld://oauth',
    });
    expect(mockPromptAsync).toHaveBeenCalledWith({
      authorizationEndpoint: config.authorizationEndpoint,
    });
  });

  it('reports a cancelled or failed prompt as cancelled', async () => {
    mockPromptAsync.mockResolvedValue({ type: 'dismiss' });
    await expect(startOAuthSignIn(config)).resolves.toEqual({ type: 'cancelled' });
  });
});
