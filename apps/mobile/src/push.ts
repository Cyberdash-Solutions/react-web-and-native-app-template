import { resolveNotificationLink } from '@repo/core/domain';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * 11.1 — Mobile push: permission, token registration and routing. The tapped notification's
 * payload is parsed with the shared schema and mapped to a route from the shared map (11.3).
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(projectId?: string): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  const status = existing.granted
    ? existing.status
    : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return token.data;
}

/** Opens the deep link of a tapped notification (including the one that cold-started the app). */
export function useNotificationRouting(navigate: (path: string) => void) {
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      if (response) navigate(resolveNotificationLink(response.notification.request.content.data));
    };
    open(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [navigate]);
}
