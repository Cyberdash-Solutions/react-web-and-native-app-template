import type { ConfigContext, ExpoConfig } from 'expo/config';

import { version } from './package.json';

/**
 * 1.12 — The mobile app's own Expo config, version and release identity (1.17). Nothing here
 * is shared with apps/web.
 */
const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
const IS_PROD = APP_ENV === 'production';
// Set after `eas init`; EAS Update and push tokens need it.
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? '00000000-0000-0000-0000-000000000000';
const BUNDLE_ID = IS_PROD ? 'com.example.helloworld' : `com.example.helloworld.${APP_ENV}`;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_PROD ? 'Hello World' : `Hello World (${APP_ENV})`,
  slug: 'hello-world',
  version,
  scheme: 'helloworld',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  platforms: ['ios', 'android'],
  // 12.3 — OTA updates only reach binaries with a matching native fingerprint.
  runtimeVersion: { policy: 'fingerprint' },
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
    associatedDomains: ['applinks:app.example.com'],
    infoPlist: {
      NSFaceIDUsageDescription: 'Unlock Hello World with Face ID.',
      ITSAppUsesNonExemptEncryption: false,
    },
    // 14.2 — Apple privacy manifest: required-reason APIs and collected data types.
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
          NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
          NSPrivacyAccessedAPITypeReasons: ['E174.1'],
        },
      ],
      NSPrivacyCollectedDataTypes: [
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeEmailAddress',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCrashData',
          NSPrivacyCollectedDataTypeLinked: false,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
      ],
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#4F46E5' },
    // 11.3 — verified app links resolve the same URLs as the web app.
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: 'app.example.com', pathPrefix: '/messages' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-localization',
    'expo-web-browser',
    'expo-background-task',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 160,
        backgroundColor: '#F8FAFC',
        dark: { backgroundColor: '#020617' },
      },
    ],
    ['expo-notifications', { color: '#4F46E5' }],
    ['expo-local-authentication', { faceIDPermission: 'Unlock Hello World with Face ID.' }],
    // 14.2 — App Tracking Transparency prompt text.
    [
      'expo-tracking-transparency',
      {
        userTrackingPermission:
          'This lets us measure which features you use. We never sell your data.',
      },
    ],
    // 6.3 — uploads source maps + dSYMs to this app's own Sentry project during EAS Build.
    [
      '@sentry/react-native/expo',
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT ?? 'hello-world-mobile',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appVersion: version,
    eas: { projectId: EAS_PROJECT_ID },
  },
});
