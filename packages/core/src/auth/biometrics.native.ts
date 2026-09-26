import * as LocalAuthentication from 'expo-local-authentication';

/** 4.3 — Mobile only: gate a restored session behind Face ID / Touch ID / fingerprint. */
export async function authenticateWithBiometrics(prompt: string): Promise<boolean> {
  const [hasHardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  if (!hasHardware || !enrolled) return true; // nothing to check against — don't lock users out
  const result = await LocalAuthentication.authenticateAsync({ promptMessage: prompt });
  return result.success;
}

export const biometricsSupported = true;
