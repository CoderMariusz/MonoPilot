/**
 * Base Page Object
 *
 * All page objects extend this class for common functionality.
 */

import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Navigation ====================

  /**
   * Navigate to a specific URL
   */
  async goto(path: string) {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  // ==================== Common Elements ====================

  /**
   * Get element by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get element by role
   */
  getByRole(role: Parameters<Page['getByRole']>[0], options?: Parameters<Page['getByRole']>[1]): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Get element by label
   */
  getByLabel(label: string | RegExp): Locator {
    return this.page.getByLabel(label);
  }

  /**
   * Get element by placeholder
   */
  getByPlaceholder(placeholder: string | RegExp): Locator {
    return this.page.getByPlaceholder(placeholder);
  }

  /**
   * Get element by text
   */
  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  // ==================== Common Actions ====================

  /**
   * Click a button by name
   */
  async clickButton(name: string | RegExp) {
    await this.page.getByRole('button', { name }).click();
  }

  /**
   * Click a link by name
   */
  async clickLink(name: string | RegExp) {
    await this.page.getByRole('link', { name }).click();
  }

  /**
   * Fill an input field by label
   */
  async fillByLabel(label: string | RegExp, value: string) {
    await this.page.getByLabel(label).fill(value);
  }

  /**
   * Select an option from a dropdown by label
   */
  async selectByLabel(label: string | RegExp, value: string) {
    await this.page.getByLabel(label).selectOption(value);
  }

  /**
   * Check a checkbox by label
   */
  async checkByLabel(label: string | RegExp) {
    await this.page.getByLabel(label).check();
  }

  /**
   * Uncheck a checkbox by label
   */
  async uncheckByLabel(label: string | RegExp) {
    await this.page.getByLabel(label).uncheck();
  }

  // ==================== Assertions ====================

  /**
   * Assert page title
   */
  async expectTitle(title: string | RegExp) {
    await expect(this.page).toHaveTitle(title);
  }

  /**
   * Assert URL contains path
   */
  async expectUrlContains(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path));
  }

  /**
   * Assert element is visible
   */
  async expectVisible(locator: Locator) {
    await expect(locator).toBeVisible();
  }

  /**
   * Assert element contains text
   */
  async expectText(locator: Locator, text: string | RegExp) {
    await expect(locator).toContainText(text);
  }

  // ==================== Toasts & Notifications ====================

  /**
   * Wait for success toast (using Radix UI Toast)
   */
  async expectSuccessToast(message?: string | RegExp) {
    // ToastViewport contains the toasts
    // Look for text containing success message in a visible div
    const successRegex = message || /created|success|saved/i;
    const toast = this.page.locator('body').locator(':visible:has-text("Success")');

    // If no success text, just wait for any visible toast element
    if (await toast.count() === 0) {
      await this.page.waitForTimeout(500); // Brief wait for toast to appear
    }

    // Verify the toast is there with the message
    const toastWithMessage = this.page.locator(':visible', { hasText: successRegex });
    await expect(toastWithMessage.first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Wait for error toast (using Radix UI Toast)
   */
  async expectErrorToast(message?: string | RegExp) {
    // Look for error message in the page
    const errorRegex = message || /error|failed/i;
    const toast = this.page.locator(':visible', { hasText: errorRegex });
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
  }

  // ==================== Tables ====================

  /**
   * Get table rows
   */
  getTableRows(): Locator {
    return this.page.locator('table tbody tr');
  }

  /**
   * Get table row count
   */
  async getTableRowCount(): Promise<number> {
    return await this.getTableRows().count();
  }

  /**
   * Click on a table row containing text
   */
  async clickTableRowWithText(text: string) {
    await this.page.locator('table tbody tr').filter({ hasText: text }).first().click();
  }

  // ==================== Modals ====================

  /**
   * Wait for modal to open
   */
  async waitForModal() {
    await this.page.waitForSelector('[role="dialog"]', { state: 'visible' });
  }

  /**
   * Close modal
   */
  async closeModal() {
    await this.page.locator('[role="dialog"] button[aria-label="Close"]').click();
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden' });
  }

  /**
   * Get modal
   */
  getModal(): Locator {
    return this.page.locator('[role="dialog"]');
  }

  // ==================== Screenshots ====================

  /**
   * Take a screenshot for visual regression
   */
  async screenshot(name: string) {
    await expect(this.page).toHaveScreenshot(`${name}.png`);
  }

  // ==================== Utilities ====================

  /**
   * Wait for API response
   */
  async waitForResponse(urlPattern: string | RegExp) {
    return this.page.waitForResponse(urlPattern);
  }

  /**
   * Press keyboard key
   */
  async pressKey(key: string) {
    await this.page.keyboard.press(key);
  }

  /**
   * Reload page
   */
  async reload() {
    await this.page.reload();
    await this.waitForPageLoad();
  }
}
