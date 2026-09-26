import * as LocalAuthentication from 'expo-local-authentication';

import { authenticateWithBiometrics, biometricsSupported } from './biometrics.native';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

const mocked = jest.mocked(LocalAuthentication);

// 4.3 — biometric unlock of a restored session.
describe('authenticateWithBiometrics', () => {
  beforeEach(() => jest.resetAllMocks());

  it('is supported on native', () => expect(biometricsSupported).toBe(true));

  it('never locks users out of a device without biometrics', async () => {
    mocked.hasHardwareAsync.mockResolvedValue(false);
    mocked.isEnrolledAsync.mockResolvedValue(false);
    await expect(authenticateWithBiometrics('Unlock')).resolves.toBe(true);
    expect(mocked.authenticateAsync).not.toHaveBeenCalled();
  });

  it('passes the prompt and returns the OS result', async () => {
    mocked.hasHardwareAsync.mockResolvedValue(true);
    mocked.isEnrolledAsync.mockResolvedValue(true);
    mocked.authenticateAsync.mockResolvedValueOnce({ success: true });
    await expect(authenticateWithBiometrics('Unlock')).resolves.toBe(true);
    expect(mocked.authenticateAsync).toHaveBeenCalledWith({ promptMessage: 'Unlock' });

    mocked.authenticateAsync.mockResolvedValueOnce({ success: false, error: 'user_cancel' });
    await expect(authenticateWithBiometrics('Unlock')).resolves.toBe(false);
  });
});
