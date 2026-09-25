// Custom config for cypress-image-diff-js
// See: https://cypress.visual-image-diff.dev/getting-started/custom-config-file
module.exports = {
  ROOT_DIR: 'tests/e2e/cypress',
  SCREENSHOTS_DIR: 'cypress-image-diff-screenshots',
  FAILURE_THRESHOLD: 0.1,
  CYPRESS_SCREENSHOT_OPTIONS: {
    timeout: 120000,
  },
};
