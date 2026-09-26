import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { env } from './env';

/** 1.17 / 6.3 — release identity used for Sentry, analytics context and min-version checks. */
export const APP_NAME = 'mobile';
export const APP_VERSION: string =
  (Constants.expoConfig?.extra?.appVersion as string | undefined) ?? '0.0.0';
export const RELEASE = `${APP_NAME}@${APP_VERSION}`;
export const PLATFORM = Platform.OS as 'ios' | 'android';
export const ENVIRONMENT = env.EXPO_PUBLIC_APP_ENV;
export const EAS_PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
