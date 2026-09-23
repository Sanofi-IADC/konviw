const { defineConfig } = require('cypress');
const getCompareSnapshotsPlugin = require('cypress-image-diff-js/plugin');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4000/cpv',
    env: {
      cypressImageDiff: {
        FAILURE_THRESHOLD: 1,        // tolerate up to 1% pixel drift from live Confluence content
        FAIL_ON_MISSING_BASELINE: false,  // auto-create baseline on first run rather than failing
      },
    },
    chromeWebSecurity: false,
    viewportWidth: 1920,
    viewportHeight: 1080,
    specPattern: 'tests/e2e/cypress/integration/**/*.ts',
    supportFile: 'tests/e2e/cypress/support/index.ts',
    screenshotsFolder: 'tests/e2e/cypress/cypress-image-diff-screenshots/comparison',
    videosFolder: 'tests/e2e/cypress/videos',
    fixturesFolder: 'tests/e2e/cypress/fixtures',
    ignoreTestFiles: ['**/__snapshots__/*', '**/__image_snapshots__/*'],
    screenshotOnRunFailure: true,
    video: true,
    videoCompression: false,
    pageLoadTimeout: 120000,
    defaultCommandTimeout: 120000,
    requestTimeout: 120000,
    responseTimeout: 120000,
    setupNodeEvents(on, config) {
      on('before:browser:launch', (launchOptions, browser = {}) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage', '--window-size=1920,1080');
        }
        return launchOptions;
      });
      return getCompareSnapshotsPlugin(on, config);
    },
  },
});
