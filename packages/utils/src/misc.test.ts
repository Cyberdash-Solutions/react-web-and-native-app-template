import { backoffDelay } from './async';
import { compareVersions } from './misc';

test('compareVersions', () => {
  expect(compareVersions('1.2.0', '1.10.0')).toBe(-1);
  expect(compareVersions('2.0', '2.0.0')).toBe(0);
  expect(compareVersions('3.0.1', '3.0.0')).toBe(1);
});

test('backoffDelay is capped', () => {
  expect(backoffDelay(10, 300, 5000, () => 1)).toBe(5000);
  expect(backoffDelay(1, 300, 5000, () => 0.5)).toBe(300);
});
