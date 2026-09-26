const { universal } = require('@repo/jest-config');

// Web app: one jsdom project; screens are tested with React Testing Library (13.7).
const { projects, ...globalOptions } = universal({ platforms: ['web'] });
module.exports = {
  ...globalOptions, // coverage reporters incl. json-summary for the changed-file gate (13.23)
  ...projects[0],
  testMatch: ['<rootDir>/**/?(*.)test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/dist/'],
};
