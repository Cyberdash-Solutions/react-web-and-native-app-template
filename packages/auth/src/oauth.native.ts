import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import type { OAuthConfig, OAuthResult } from './oauth-types';

WebBrowser.maybeCompleteAuthSession();

/** 4.3 — Mobile OAuth: Authorization Code + PKCE through the system browser. */
export async function startOAuthSignIn(config: OAuthConfig): Promise<OAuthResult> {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: config.scheme, path: 'oauth' });
  const request = new AuthSession.AuthRequest({
    clientId: config.clientId,
    scopes: config.scopes,
    redirectUri,
    usePKCE: true,
  });
  const result = await request.promptAsync({ authorizationEndpoint: config.authorizationEndpoint });
  if (result.type !== 'success') return { type: 'cancelled' };
  return {
    type: 'code',
    code: result.params.code ?? '',
    codeVerifier: request.codeVerifier,
    redirectUri,
  };
}
