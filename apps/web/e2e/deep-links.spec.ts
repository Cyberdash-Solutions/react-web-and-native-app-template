import { expect, test } from '@repo/playwright-config/fixtures';

// 13.17 / 11.3 — a link from a notification or email opens the right screen.
test('deep link to a message', async ({ page, signIn }) => {
  await signIn();
  await page.goto('/messages/m_3');
  await expect(page.getByRole('heading', { level: 1, name: 'Message #3' })).toBeVisible();
});

test('unknown routes render the not-found screen', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(
    page.getByRole('heading', { level: 1, name: "This screen doesn't exist." }),
  ).toBeVisible();
});
