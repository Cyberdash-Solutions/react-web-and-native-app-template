const { universal } = require('@repo/jest-config');

// Web app: one jsdom project; screens are tested with React Testing Library (13.7).
const [web] = universal({ platforms: ['web'] }).projects;
module.exports = {
  ...web,
  testMatch: ['<rootDir>/**/?(*.)test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/dist/'],
};
