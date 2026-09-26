import { expect, fixtures, test } from '@repo/playwright-config/fixtures';

test.describe('sign-in', () => {
  test('signs in, greets by name and survives a reload via the httpOnly cookie (4.2)', async ({
    page,
    signIn,
    context,
  }) => {
    await signIn();
    const cookies = await context.cookies('http://localhost:4000/auth');
    expect(cookies.find((c) => c.name === 'refresh_token')?.httpOnly).toBe(true);
    // No token ever lands in JS-readable storage.
    expect(await page.evaluate(() => JSON.stringify(window.localStorage))).not.toContain('token');

    await page.reload();
    await expect(
      page.getByRole('heading', { level: 1, name: `Hello, ${fixtures.user.name}!` }),
    ).toBeVisible();
  });

  test('validates input with the shared schema', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Password').fill('short');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
    await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();
  });

  test('rejects bad credentials', async ({ page, expectNoA11yViolations }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(fixtures.credentials.email);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect.');
    await expectNoA11yViolations();
  });

  test('updates the profile name (core update flow)', async ({ page, signIn }) => {
    await signIn();
    await page.getByRole('link', { name: 'Profile' }).click();
    const name = page.getByLabel('Name');
    await expect(name).toHaveValue(fixtures.user.name);
    await name.fill('Grace Hopper');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('link', { name: 'Hello World' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Hello, Grace Hopper!' }),
    ).toBeVisible();
  });
});
