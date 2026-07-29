import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/migration',
  testMatch: '**/*.spec.mjs',
  globalSetup: './tests/migration/global-setup.mjs',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: 'line',
  outputDir: '.tmp/playwright-results',
  snapshotPathTemplate: '{testDir}/visual-baselines/{arg}{ext}',
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.001,
      scale: 'css',
    },
  },
  use: {
    browserName: 'chromium',
    locale: 'en-US',
    timezoneId: 'America/Chicago',
    colorScheme: 'light',
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
});
