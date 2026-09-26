import { createWebE2EConfig } from '@repo/playwright-config';

// 13.16 — runs against the static export (pnpm build) served locally, plus the seeded mock API.
// In CI on PRs, E2E_BASE_URL points at the preview deployment instead.
export default createWebE2EConfig({
  baseURL: 'http://localhost:8081',
  apiURL: 'http://localhost:4000',
  webServer: [
    {
      command: 'pnpm --dir ../.. mock-api',
      url: 'http://localhost:4000/health',
      reuseExistingServer: !process.env.CI,
    },
    { command: 'pnpm serve', url: 'http://localhost:8081', reuseExistingServer: !process.env.CI },
  ],
});
