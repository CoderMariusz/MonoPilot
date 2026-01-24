/**
 * Login Page Object
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ROUTES, TEST_CREDENTIALS, UserRole } from '../fixtures/test-data';

export class LoginPage extends BasePage {
  // Selectors
  private readonly emailInput = 'input[name="email"], input[type="email"]';
  private readonly passwordInput = 'input[name="password"], input[type="password"]';
  private readonly submitButton = 'button[type="submit"]';
  private readonly errorMessage = '[role="alert"], .error-message';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await super.goto(ROUTES.login);
  }

  /**
   * Fill email field
   */
  async fillEmail(email: string) {
    await this.page.fill(this.emailInput, email);
  }

  /**
   * Fill password field
   */
  async fillPassword(password: string) {
    await this.page.fill(this.passwordInput, password);
  }

  /**
   * Click submit button
   */
  async submit() {
    await this.page.click(this.submitButton);
  }

  /**
   * Perform full login flow
   */
  async login(email: string, password: string) {
    await this.goto();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();

    // Wait for redirect to authenticated page
    await this.page.waitForURL(/\/(dashboard|settings|planning|production|warehouse|quality|shipping|technical)/, {
      timeout: 15000,
    });
  }

  /**
   * Login as a specific role
   */
  async loginAs(role: UserRole) {
    const { email, password } = TEST_CREDENTIALS[role];
    await this.login(email, password);
  }

  /**
   * Assert login error is displayed
   */
  async expectLoginError(message?: string | RegExp) {
    const error = this.page.locator(this.errorMessage);
    await expect(error).toBeVisible();
    if (message) {
      await expect(error).toContainText(message);
    }
  }

  /**
   * Assert we're on the login page
   */
  async expectOnLoginPage() {
    await expect(this.page).toHaveURL(new RegExp(ROUTES.login));
    await expect(this.page.locator(this.emailInput)).toBeVisible();
  }
}
