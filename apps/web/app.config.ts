import type { ConfigContext, ExpoConfig } from 'expo/config';

import { version } from './package.json';

/**
 * 1.12 — The web app's own Expo config. It shares nothing with apps/mobile's config; the two
 * apps are versioned, configured and deployed independently.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Hello World',
  slug: 'hello-world-web',
  version,
  scheme: 'helloworld',
  userInterfaceStyle: 'automatic',
  platforms: ['web'],
  web: {
    bundler: 'metro',
    // 7.4 — static rendering (SSG): every route is pre-rendered to HTML at build time.
    output: 'static',
    favicon: './public/favicon.png',
    name: 'Hello World',
    shortName: 'Hello',
    themeColor: '#4F46E5',
    backgroundColor: '#F8FAFC',
  },
  // 7.4 — lazy routes: each route is its own bundle, loaded on navigation.
  plugins: [['expo-router', { asyncRoutes: { web: true, default: 'development' } }]],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appVersion: version,
  },
});
