// Runs after the test framework is installed, in every project.
// 13.24: in CI each failing test gets exactly one retry; the retry is logged so it
// is visible in the job output (flaky-test quarantine happens via a tracking issue).
if (process.env.CI) {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
}

// RNTL 13 renders through react-test-renderer, which React 19 flags as deprecated. The warning
// is noise until RNTL moves off it; everything else logged to console.error stays visible.
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('react-test-renderer is deprecated')) return;
  originalError(...args);
};
