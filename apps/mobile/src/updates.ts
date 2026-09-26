import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { AppState } from 'react-native';

/**
 * 12.3 — EAS Update: when the app returns to the foreground, fetch any OTA update for this
 * runtime version (fingerprint-pinned in app.config.ts) and apply it on the next launch.
 * Rollback (1.17) is `eas update:rollback` on the channel.
 */
export function useOtaUpdates(onError: (error: unknown) => void) {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    const check = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) await Updates.fetchUpdateAsync();
      } catch (error) {
        onError(error);
      }
    };
    const sub = AppState.addEventListener('change', (s) => s === 'active' && void check());
    return () => sub.remove();
  }, [onError]);
}
