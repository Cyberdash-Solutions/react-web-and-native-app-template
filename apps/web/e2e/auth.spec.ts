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

test.describe('sign-up', () => {
  const grace = { name: 'Grace Hopper', email: 'grace@example.com', password: 'cobol-1959' };

  test('creates an account, signs straight in and can sign back in later', async ({
    page,
    expectNoA11yViolations,
  }) => {
    await page.goto('/sign-in');
    await page.getByRole('link', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/sign-up$/);
    await expectNoA11yViolations();

    await page.getByLabel('Name').fill(grace.name);
    await page.getByLabel('Email').fill(grace.email);
    await page.getByLabel('Password').fill(grace.password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Hello, Grace Hopper!' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: '0 messages' })).toBeVisible();

    // The new session survives a reload like any other (4.2).
    await page.reload();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Hello, Grace Hopper!' }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(grace.email);
    await page.getByLabel('Password').fill(grace.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Hello, Grace Hopper!' }),
    ).toBeVisible();
  });

  test('explains when the email already has an account', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByLabel('Name').fill('Another Ada');
    await page.getByLabel('Email').fill(fixtures.credentials.email);
    await page.getByLabel('Password').fill(grace.password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('alert')).toHaveText(
      'An account with this email already exists. Sign in instead.',
    );
  });
});
