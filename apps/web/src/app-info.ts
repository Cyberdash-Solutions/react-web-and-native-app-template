import Constants from 'expo-constants';

import { env } from './env';

/** 1.17 / 6.3 — release identity used for Sentry, analytics context and min-version checks. */
export const APP_NAME = 'web';
export const APP_VERSION: string =
  (Constants.expoConfig?.extra?.appVersion as string | undefined) ?? '0.0.0';
export const RELEASE = `${APP_NAME}@${APP_VERSION}`;
export const PLATFORM = 'web' as const;
export const ENVIRONMENT = env.EXPO_PUBLIC_APP_ENV;
