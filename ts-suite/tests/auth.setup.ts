import { test as setup } from '@playwright/test';

// Runs once (as the 'setup' project) before any project that lists it as a
// dependency. Logs in through the real UI once and saves the resulting
// session so 'ui-chromium' and 'charts-chromium' tests can skip the login
// screen entirely. This file is what src/.auth/user.json (referenced in
// playwright.config.ts) actually comes from — it did not exist before this
// fix, which meant every authenticated UI/chart test failed on a missing file.

const authFile = 'src/.auth/user.json';

setup('authenticate as standard user', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.QA_STANDARD_USER_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.QA_STANDARD_USER_PASSWORD!);
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await page.waitForURL(/\/dashboard/);
  await page.context().storageState({ path: authFile });
});
