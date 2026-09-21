import { Page, Locator, expect } from '@playwright/test';

/**
 * Locator strategy (no data-testid available yet — see root README):
 * priority order is getByRole > getByLabel > getByPlaceholder > getByText.
 * If you have to fall back to a CSS selector, it lives HERE and only here —
 * never inline in a test file — so a markup change means one edit.
 */
export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(private page: Page) {
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole('button', { name: /log in|sign in/i });
    // Fallback example: if the error banner has no accessible role/label,
    // target it by its rendered text region instead of a generic div.
    this.errorMessage = page.getByText(/invalid (email|credentials|password)/i);
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectLoginError() {
    await expect(this.errorMessage).toBeVisible();
  }

  async expectRedirectedToDashboard() {
    await this.page.waitForURL(/\/dashboard/);
  }
}
