import { expect, fixtures, test } from '@repo/playwright-config/fixtures';

// 9.3 — the core journey works with the keyboard alone, with a visible focus order.
test('sign in using only the keyboard', async ({ page }) => {
  await page.goto('/sign-in');
  const email = page.getByLabel('Email');
  await email.focus();
  await page.keyboard.type(fixtures.credentials.email);
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Password')).toBeFocused();
  await page.keyboard.type(fixtures.credentials.password);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { level: 1, name: `Hello, ${fixtures.user.name}!` }),
  ).toBeVisible();
});

test('settings controls are reachable and operable by keyboard', async ({ page }) => {
  await page.goto('/settings');
  const dark = page.getByRole('radio', { name: 'Dark' });
  await dark.focus();
  await page.keyboard.press('Enter');
  await expect(dark).toHaveAttribute('aria-checked', 'true');
});
