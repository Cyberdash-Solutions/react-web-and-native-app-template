const path = require('node:path');

// 13.13 — contract tests run against a live backend: CONTRACT_API_URL in CI (staging / a
// per-PR backend), or the seeded mock API started by global-setup when it's unset.
module.exports = require('@repo/jest-config').node({
  globalSetup: path.join(__dirname, 'src/global-setup.mjs'),
  globalTeardown: path.join(__dirname, 'src/global-teardown.mjs'),
});
