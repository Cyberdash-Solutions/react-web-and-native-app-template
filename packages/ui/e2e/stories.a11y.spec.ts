import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// 13.20 — every story, in both color schemes, has zero WCAG A/AA violations.
const index = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../storybook-static/index.json'), 'utf8'),
) as {
  entries: Record<string, { id: string; type: string }>;
};
const stories = Object.values(index.entries).filter((e) => e.type === 'story');

for (const scheme of ['light', 'dark'] as const) {
  for (const story of stories) {
    test(`${story.id} (${scheme})`, async ({ page }) => {
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=scheme:${scheme}`);
      await page.locator('#storybook-root > *').first().waitFor();
      const results = await new AxeBuilder({ page })
        .include('#storybook-root')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
}
