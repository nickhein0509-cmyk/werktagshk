import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Focused Safari-engine checks for the assistant's phone-facing workflows.
// Data endpoints use the same isolated synthetic fixtures as the Chromium run.
export default defineConfig({
  ...base,
  // The second engine must not delete Chromium's explicitly synthetic UI shots.
  // Keep failure traces in an already ignored child directory instead.
  outputDir: 'test-results/webkit',
  testMatch: /(?:assistant-workspace|assistant-timeline|assistance-entry|account|route-loading|cockpit)\.spec\.ts/,
  use: {
    ...base.use,
    browserName: 'webkit',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    launchOptions: {},
  },
});
