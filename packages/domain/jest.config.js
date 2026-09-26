// 13.23 — domain carries the highest coverage bar in the repo.
module.exports = require('@repo/jest-config').node({
  coverageThreshold: { global: { lines: 95, statements: 85, branches: 75, functions: 95 } },
});
