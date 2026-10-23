import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const configuredChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const executablePath =
  configuredChromium || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 2,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath,
      args: executablePath ? ['--no-sandbox'] : [],
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: 'https://test-werktag.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_browser_fixture',
    },
    timeout: 30_000,
  },
});
