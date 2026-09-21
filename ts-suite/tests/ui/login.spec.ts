import { test } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';

// Maps to shared-test-plan.md: AUTH-004, AUTH-005
// Runs under the 'ui-unauthenticated-chromium' project (see
// playwright.config.ts), which deliberately has no storageState — this file
// IS the login flow under test, so it must start from a logged-out browser.
// Other UI specs run under 'ui-chromium' and reuse storageState (generated
// by tests/auth.setup.ts) to skip logging in via the UI every test.

test.describe('Login UI', () => {
  test('AUTH-004: valid credentials redirect to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.QA_STANDARD_USER_EMAIL!,
      process.env.QA_STANDARD_USER_PASSWORD!
    );
    await loginPage.expectRedirectedToDashboard();
  });

  test('AUTH-005: invalid credentials show inline error, no redirect', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.QA_STANDARD_USER_EMAIL!, 'wrong-password');
    await loginPage.expectLoginError();
  });
});
