import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Focused Safari-engine checks for the assistant's phone-facing workflows.
// Data endpoints use the same isolated synthetic fixtures as the Chromium run.
export default defineConfig({
  ...base,
  testMatch: /(?:assistant-workspace|assistance-entry|account)\.spec\.ts/,
  use: {
    ...base.use,
    browserName: 'webkit',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    launchOptions: {},
  },
});
