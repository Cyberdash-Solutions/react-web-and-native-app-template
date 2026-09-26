import { useCallback, useEffect, useState } from 'react';

/**
 * 11.2 — Web-only platform integration: service worker (offline shell + web push), PWA
 * installability, browser permissions. Only apps/web depends on this package (1.11).
 */
export async function registerServiceWorker(
  path = '/sw.js',
): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(path, { scope: '/' });
  } catch (error) {
    console.warn('Service worker registration failed', error);
    return null;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Exposes the browser's deferred install prompt, if the app is installable. */
export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);
  const install = useCallback(async () => {
    if (!event) return false;
    await event.prompt();
    const { outcome } = await event.userChoice;
    setEvent(null);
    return outcome === 'accepted';
  }, [event]);
  return { canInstall: !!event, install };
}

/** Web push subscription (requires a VAPID public key from the backend). */
export async function subscribeToWebPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  const registration = await registerServiceWorker();
  if (!registration || !('PushManager' in window)) return null;
  if ((await Notification.requestPermission()) !== 'granted') return null;
  const key = Uint8Array.from(atob(vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
    c.charCodeAt(0),
  );
  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
}

export const webManifest = (opts: {
  name: string;
  shortName: string;
  themeColor: string;
  backgroundColor: string;
}) => ({
  name: opts.name,
  short_name: opts.shortName,
  start_url: '/',
  display: 'standalone',
  theme_color: opts.themeColor,
  background_color: opts.backgroundColor,
  icons: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
});
