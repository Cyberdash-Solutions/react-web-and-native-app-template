export interface OAuthConfig {
  clientId: string;
  authorizationEndpoint: string;
  scopes: string[];
  /** Mobile deep-link scheme used for the redirect URI. */
  scheme: string;
  /** Web: BFF route that starts the redirect flow. */
  bffLoginPath?: string;
}

export type OAuthResult =
  | { type: 'code'; code: string; codeVerifier?: string; redirectUri: string }
  | { type: 'redirected' }
  | { type: 'cancelled' };
