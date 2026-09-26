import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, type Page } from '@playwright/test';

import credentials from '@repo/testing/fixtures/credentials.json' with { type: 'json' };
import user from '@repo/testing/fixtures/user.json' with { type: 'json' };

/** 13.18 — the same static fixtures that seed unit tests and the mock API. */
export const fixtures = { credentials, user };

type Fixtures = {
  /** Resets the seeded test backend before each test. */
  resetBackend: void;
  /** 13.20 — axe scan of the current page; fails on any WCAG A/AA violation. */
  expectNoA11yViolations: () => Promise<void>;
  signIn: (page?: Page) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  resetBackend: [
    async ({ request }, use, testInfo) => {
      const api = testInfo.config.metadata.apiURL as string;
      await request.post(`${api}/__reset`).catch(() => undefined);
      await use();
    },
    { auto: true },
  ],
  expectNoA11yViolations: async ({ page }, use) => {
    await use(async () => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        results.violations,
        results.violations.map((v) => `${v.id}: ${v.help}`).join('\n'),
      ).toEqual([]);
    });
  },
  // Shared sign-in flow (mirrors tooling/maestro/subflows/login.yaml on mobile).
  signIn: async ({ page }, use) => {
    await use(async (p = page) => {
      await p.goto('/sign-in');
      await p.getByLabel('Email').fill(fixtures.credentials.email);
      await p.getByLabel('Password').fill(fixtures.credentials.password);
      await p.getByRole('button', { name: 'Sign in' }).click();
      await expect(
        p.getByRole('heading', { level: 1, name: `Hello, ${fixtures.user.name}!` }),
      ).toBeVisible();
    });
  },
});

export { expect };
