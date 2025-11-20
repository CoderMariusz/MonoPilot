import type { Page } from '@playwright/test';

/**
 * Authentication Helper - provides utilities for login, logout, and session management.
 *
 * @example
 * const authHelper = new AuthHelper();
 * await authHelper.login(page, 'user@example.com', 'password');
 * await authHelper.logout(page);
 */
export class AuthHelper {
  /**
   * Login to the application
   */
  async login(page: Page, email: string, password: string): Promise<void> {
    await page.goto('/login');

    // Fill login form
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-button"]');

    // Wait for successful login (redirect or element appears)
    await page.waitForURL(/\/(dashboard|home)/);
  }

  /**
   * Logout from the application
   */
  async logout(page: Page): Promise<void> {
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('/login');
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(page: Page): Promise<boolean> {
    const userMenu = page.locator('[data-testid="user-menu"]');
    return await userMenu.isVisible();
  }

  /**
   * Get session storage authentication token
   */
  async getAuthToken(page: Page): Promise<string | null> {
    return await page.evaluate(() => {
      return sessionStorage.getItem('supabase.auth.token');
    });
  }

  /**
   * Set authentication token directly (bypass login form)
   */
  async setAuthToken(page: Page, token: string): Promise<void> {
    await page.evaluate((authToken) => {
      sessionStorage.setItem('supabase.auth.token', authToken);
    }, token);
  }

  /**
   * Clear all authentication data
   */
  async clearAuth(page: Page): Promise<void> {
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  }
}
