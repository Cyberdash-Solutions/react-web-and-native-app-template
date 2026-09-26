import { expect, test } from '@repo/playwright-config/fixtures';

// 13.17 — critical journeys only.
test.describe('home', () => {
  test('greets the world, anonymously', async ({ page, expectNoA11yViolations }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Hello, world!' })).toBeVisible();
    await expectNoA11yViolations();
  });

  test('is pre-rendered (7.4): content is in the HTML before JS runs', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toContain('Hello World');
  });

  test('switches language from the URL (10.3)', async ({ page }) => {
    await page.goto('/?lang=es');
    await expect(page.getByRole('heading', { level: 1, name: '¡Hola, mundo!' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });
});
