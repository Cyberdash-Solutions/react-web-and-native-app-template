/** 4.3 — Biometrics are a mobile-only capability; web always passes. */
export async function authenticateWithBiometrics(_prompt: string): Promise<boolean> {
  return true;
}

export const biometricsSupported = false;
