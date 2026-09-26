// 13.4 — ios / android / web so token-storage / biometrics / oauth splits are each exercised.
// 13.23 — auth is one of the high-bar packages (with domain and data).
module.exports = require('@repo/jest-config').universal({
  coverageThreshold: { global: { lines: 90, statements: 85, branches: 70, functions: 75 } },
});
