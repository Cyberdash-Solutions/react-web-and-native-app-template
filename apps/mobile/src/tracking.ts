import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { Platform } from 'react-native';

/**
 * 14.2 — On iOS, analytics consent also requires App Tracking Transparency permission when the
 * analytics vendor tracks across apps. Called only after the user opts in (14.1).
 */
export async function requestTrackingIfNeeded(): Promise<boolean> {
  if (Platform.OS !== 'ios') return true;
  const { granted } = await requestTrackingPermissionsAsync();
  return granted;
}
