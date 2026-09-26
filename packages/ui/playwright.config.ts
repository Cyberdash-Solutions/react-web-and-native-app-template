import { defineConfig, devices } from '@playwright/test';

// 13.20 — axe over every Storybook story (build first: pnpm build-storybook).
export default defineConfig({
  testDir: './e2e',
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:6007' },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
          : {},
      },
    },
  ],
  webServer: {
    command: 'serve storybook-static --config ../serve.json --listen 6007',
    url: 'http://localhost:6007',
    reuseExistingServer: !process.env.CI,
  },
});
