import { usePreventScreenCapture } from 'expo-screen-capture';

/**
 * 4.4 — Mobile-only security hardening.
 *
 * Screenshot protection is live (sensitive screens call `useScreenshotProtection`).
 *
 * Certificate pinning and jailbreak/root detection need native libraries that must match your
 * threat model and backend certificates, so the template ships them as explicit hooks:
 *   - pinning: add `react-native-ssl-public-key-pinning` and call `initializeSslPinning`
 *     with your API host's SPKI hashes inside `initSecurity()`.
 *   - integrity: add `jail-monkey` (or Play Integrity / App Attest via your backend) and
 *     implement `checkDeviceIntegrity()`.
 */
export const useScreenshotProtection = usePreventScreenCapture;

export interface DeviceIntegrity {
  compromised: boolean;
  reason?: string;
}

export async function checkDeviceIntegrity(): Promise<DeviceIntegrity> {
  return { compromised: false };
}

export async function initSecurity(): Promise<void> {
  // await initializeSslPinning({ 'api.example.com': { includeSubdomains: false, publicKeyHashes: ['…', '…'] } });
}
