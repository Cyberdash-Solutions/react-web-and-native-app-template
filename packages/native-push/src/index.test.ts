import { registerForPushNotifications } from './index';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  getPermissionsAsync: jest.fn(async () => ({ granted: false, status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  getExpoPushTokenAsync: jest.fn(),
}));

test('returns null when the user denies permission', async () => {
  await expect(registerForPushNotifications()).resolves.toBeNull();
});
