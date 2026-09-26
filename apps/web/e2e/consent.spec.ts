import { expect, test } from '@repo/playwright-config/fixtures';

// 13.17 / 14.1 / 14.3 — consent gating.
test('asks for consent and remembers the decision', async ({ page, expectNoA11yViolations }) => {
  await page.goto('/');
  const banner = page.getByRole('dialog', { name: 'We value your privacy' });
  await expect(banner).toBeVisible();
  await expectNoA11yViolations();
  await banner.getByRole('button', { name: 'Decline' }).click();
  await expect(banner).toBeHidden();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Hello, world!' })).toBeVisible();
  await expect(banner).toBeHidden();
});

test('no analytics events are sent before consent', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (msg) => logs.push(msg.text()));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(logs.filter((l) => l.includes('analytics: screen_viewed'))).toEqual([]);
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect.poll(() => logs.some((l) => l.includes('analytics: screen_viewed'))).toBe(true);
});
