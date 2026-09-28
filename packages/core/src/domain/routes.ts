/**
 * 2.4, 11.3 — Route names and the deep-link / URL map are shared, so a notification, email
 * link or universal link resolves to the same screen on both platforms. Each app maps these
 * to its own navigator (Expo Router file routes in this template).
 */
export const routes = {
  home: { path: '/' },
  signIn: { path: '/sign-in' },
  signUp: { path: '/sign-up' },
  settings: { path: '/settings' },
  profile: { path: '/profile' },
  message: { path: '/messages/:id' },
  privacy: { path: '/privacy' },
} as const;

export type RouteName = keyof typeof routes;

type ParamNames<P extends string> = P extends `${string}:${infer Param}/${infer Rest}`
  ? Param | ParamNames<`/${Rest}`>
  : P extends `${string}:${infer Param}`
    ? Param
    : never;

export type RouteParams<R extends RouteName> = {
  [K in ParamNames<(typeof routes)[R]['path']>]: string;
};

export function buildPath<R extends RouteName>(
  route: R,
  ...[params]: keyof RouteParams<R> extends never ? [] : [RouteParams<R>]
): string {
  let path: string = routes[route].path;
  for (const [key, value] of Object.entries((params ?? {}) as Record<string, string>)) {
    path = path.replace(`:${key}`, encodeURIComponent(value));
  }
  return path;
}

/** Resolves an inbound URL / path to a route name and params (or null if unknown). */
export function matchPath(
  input: string,
): { route: RouteName; params: Record<string, string> } | null {
  // https://host/path → /path, but for custom schemes (myapp://messages/42) the "host" is
  // really the first path segment.
  const pathname =
    (/^https?:\/\//i.test(input)
      ? input.replace(/^https?:\/\/[^/]*/i, '')
      : input.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '/')
    )
      .replace(/^\/+/, '/')
      .split(/[?#]/)[0] || '/';
  const normalized = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  for (const [route, { path }] of Object.entries(routes) as [RouteName, { path: string }][]) {
    const names: string[] = [];
    const pattern = new RegExp(
      '^' + path.replace(/:([a-zA-Z]+)/g, (_, n: string) => (names.push(n), '([^/]+)')) + '$',
    );
    const m = normalized.match(pattern);
    if (m) {
      return {
        route,
        params: Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(m[i + 1] ?? '')])),
      };
    }
  }
  return null;
}
