import { authenticateWithBiometrics, useAuth } from '@repo/auth';
import { useTranslation } from '@repo/i18n';
import { usePreferences } from '@repo/state';
import { Button, Screen, Text } from '@repo/ui';
import { useEffect, useState, type ReactNode } from 'react';

/** 4.3 — Mobile only: a restored session stays locked until Face ID / fingerprint succeeds. */
export function BiometricGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const enabled = usePreferences((s) => s.biometricLock);
  const auth = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const locked = enabled && auth.status === 'signedIn' && !unlocked;

  const prompt = t('biometricPrompt');
  const unlock = () => authenticateWithBiometrics(prompt).then(setUnlocked);

  // Prompt automatically as soon as a locked session appears.
  useEffect(() => {
    if (!locked) return;
    let cancelled = false;
    void authenticateWithBiometrics(prompt).then((ok) => !cancelled && setUnlocked(ok));
    return () => {
      cancelled = true;
    };
  }, [locked, prompt]);

  if (!locked) return children;
  return (
    <Screen>
      <Text variant="title" headingLevel={1}>
        {t('appName')}
      </Text>
      <Button title={prompt} onPress={() => void unlock()} />
    </Screen>
  );
}
