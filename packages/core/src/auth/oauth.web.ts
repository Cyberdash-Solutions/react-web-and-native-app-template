import type { OAuthConfig, OAuthResult } from './oauth-types';

/**
 * 4.3 — Web OAuth: a full-page redirect to the BFF, which runs the code exchange server-side
 * and sets the session cookie. Nothing sensitive touches client JS.
 */
export async function startOAuthSignIn(config: OAuthConfig): Promise<OAuthResult> {
  const url = new URL(config.bffLoginPath ?? '/auth/oauth/start', window.location.origin);
  url.searchParams.set('returnTo', window.location.pathname);
  window.location.assign(url.toString());
  return { type: 'redirected' };
}
