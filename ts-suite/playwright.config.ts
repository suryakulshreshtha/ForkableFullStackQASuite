import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: process.env.API_BASE_URL || process.env.BASE_URL },
    },
    // Generates src/.auth/user.json by actually logging in once, before any
    // project that depends on it runs. Without this, 'ui-chromium' and
    // 'charts-chromium' below would point at a storageState file that is
    // never created and every test in them would fail immediately.
    {
      name: 'setup',
      testDir: './tests',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Login/logout flows must run UNAUTHENTICATED — deliberately excluded
    // here (testIgnore) rather than given the storageState below, otherwise
    // the browser would already hold a valid session before the login test
    // even starts, making it impossible to actually exercise the login form.
    {
      name: 'ui-chromium',
      testDir: './tests/ui',
      testIgnore: /login\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: 'src/.auth/user.json' },
    },
    {
      name: 'ui-unauthenticated-chromium',
      testDir: './tests/ui',
      testMatch: /login\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] }, // no storageState — intentional
    },
    {
      name: 'charts-chromium',
      testDir: './tests/charts',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: 'src/.auth/user.json' },
    },
  ],
});
