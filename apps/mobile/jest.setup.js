// Native modules the mobile app uses that have no JS fallback in Jest.
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: (c) => c,
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  reactNativeTracingIntegration: jest.fn(),
}));
jest.mock('expo-screen-capture', () => ({ usePreventScreenCapture: jest.fn() }));
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(async () => false),
}));
jest.mock('expo-background-task', () => ({
  BackgroundTaskResult: { Success: 1, Failed: 2 },
  BackgroundTaskStatus: { Restricted: 1, Available: 2 },
  getStatusAsync: jest.fn(async () => 2),
  registerTaskAsync: jest.fn(),
}));
