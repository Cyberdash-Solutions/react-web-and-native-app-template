const { universal } = require('@repo/jest-config');

// Mobile app: iOS and Android projects; screens are tested with RNTL (13.7).
module.exports = universal({
  platforms: ['ios', 'android'],
  setupFiles: [require.resolve('./jest.setup.js')],
});
