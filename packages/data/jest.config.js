// 13.4 — ios / android / web so network.native.ts and network.web.ts are each exercised.
// 13.23 — data is one of the high-bar packages (with domain and auth).
module.exports = require('@repo/jest-config').universal({
  coverageThreshold: { global: { lines: 75, statements: 70, branches: 60, functions: 65 } },
});
