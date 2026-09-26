import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

export interface WebE2EOptions {
  /** Where the app under test is served. Defaults to the static export on :8081. */
  baseURL?: string;
  /** Mock API (seeded test backend, 13.18) URL. Set E2E_API_URL to use a real test backend. */
  apiURL?: string;
  /** Commands that start the app and the backend. Omitted when baseURL points at a preview deploy. */
  webServer?: PlaywrightTestConfig['webServer'];
}

/**
 * 13.16 — Shared Playwright config: Chromium, WebKit and Firefox plus a mobile viewport, run
 * against the static export (`expo export --platform web`) or a PR preview deployment
 * (E2E_BASE_URL). 13.24 — one retry in CI, and the retry is reported, never hidden.
 */
export function createWebE2EConfig({ baseURL, apiURL, webServer }: WebE2EOptions = {}) {
  const url = process.env.E2E_BASE_URL ?? baseURL ?? 'http://localhost:8081';
  const onlyChromium = process.env.E2E_BROWSERS === 'chromium';
  return defineConfig({
    testDir: './e2e',
    fullyParallel: false, // the seeded backend is shared state; reset per test (13.18)
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI
      ? [
          ['github'],
          ['html', { open: 'never' }],
          ['json', { outputFile: 'test-results/results.json' }],
        ]
      : 'list',
    use: {
      baseURL: url,
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
      extraHTTPHeaders: {},
    },
    metadata: { apiURL: process.env.E2E_API_URL ?? apiURL ?? 'http://localhost:4000' },
    projects: [
      {
        name: 'chromium',
        use: {
          ...devices['Desktop Chrome'],
          // Lets sandboxes with a preinstalled Chromium run the suite without `playwright install`.
          launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
            ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
            : {},
        },
      },
      ...(onlyChromium
        ? []
        : [
            { name: 'webkit', use: { ...devices['Desktop Safari'] } },
            { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
            { name: 'mobile', use: { ...devices['Pixel 7'] } },
          ]),
    ],
    webServer: process.env.E2E_BASE_URL ? undefined : webServer,
  });
}
