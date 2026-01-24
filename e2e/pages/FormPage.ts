/**
 * Form Page Object
 *
 * Reusable page object for pages with forms.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class FormPage extends BasePage {
  // Form selectors
  private readonly form = 'form';
  private readonly submitButton = 'button[type="submit"]';
  private readonly cancelButton = 'button:has-text("Cancel")';
  private readonly resetButton = 'button[type="reset"]';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Form Controls ====================

  /**
   * Get form element
   */
  getForm(): Locator {
    return this.page.locator(this.form);
  }

  /**
   * Fill text input by name
   */
  async fillInput(name: string, value: string) {
    await this.page.fill(`input[name="${name}"]`, value);
  }

  /**
   * Fill textarea by name
   */
  async fillTextarea(name: string, value: string) {
    await this.page.fill(`textarea[name="${name}"]`, value);
  }

  /**
   * Select option from native select
   */
  async selectOption(name: string, value: string) {
    await this.page.selectOption(`select[name="${name}"]`, value);
  }

  /**
   * Click a ShadCN Select component and choose option
   */
  async selectShadcn(label: string, optionText: string) {
    // Click the select trigger
    await this.page.getByLabel(label).click();
    // Wait for dropdown and select option
    await this.page.getByRole('option', { name: optionText }).click();
  }

  /**
   * Check checkbox by name
   */
  async checkCheckbox(name: string) {
    await this.page.check(`input[name="${name}"]`);
  }

  /**
   * Uncheck checkbox by name
   */
  async uncheckCheckbox(name: string) {
    await this.page.uncheck(`input[name="${name}"]`);
  }

  /**
   * Select radio option by name and value
   */
  async selectRadio(name: string, value: string) {
    await this.page.check(`input[name="${name}"][value="${value}"]`);
  }

  /**
   * Toggle switch by label
   */
  async toggleSwitch(label: string) {
    await this.page.getByLabel(label).click();
  }

  /**
   * Fill date picker
   */
  async fillDate(label: string, date: string) {
    // Click to open date picker
    await this.page.getByLabel(label).click();
    // Type the date
    await this.page.keyboard.type(date);
    // Press escape to close picker
    await this.page.keyboard.press('Escape');
  }

  // ==================== Form Actions ====================

  /**
   * Submit form
   */
  async submit() {
    await this.page.click(this.submitButton);
  }

  /**
   * Cancel form
   */
  async cancel() {
    await this.page.click(this.cancelButton);
  }

  /**
   * Reset form
   */
  async reset() {
    await this.page.click(this.resetButton);
  }

  /**
   * Submit and wait for navigation
   */
  async submitAndWait() {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
      this.submit(),
    ]);
  }

  /**
   * Submit and wait for API response
   */
  async submitAndWaitForApi(urlPattern: string | RegExp) {
    await Promise.all([
      this.waitForResponse(urlPattern),
      this.submit(),
    ]);
  }

  // ==================== Validation ====================

  /**
   * Get field error message
   */
  getFieldError(name: string): Locator {
    return this.page.locator(`[id="${name}-error"], [data-field="${name}"] .error-message`);
  }

  /**
   * Assert field has error
   */
  async expectFieldError(name: string, message?: string | RegExp) {
    const error = this.getFieldError(name);
    await expect(error).toBeVisible();
    if (message) {
      await expect(error).toContainText(message);
    }
  }

  /**
   * Assert field has no error
   */
  async expectNoFieldError(name: string) {
    const error = this.getFieldError(name);
    await expect(error).not.toBeVisible();
  }

  /**
   * Assert form has validation errors
   */
  async expectValidationErrors() {
    await expect(this.page.locator('.error-message, [role="alert"]')).toBeVisible();
  }

  /**
   * Get all visible validation errors
   */
  async getValidationErrors(): Promise<string[]> {
    const errors = this.page.locator('.error-message, [role="alert"]');
    const count = await errors.count();
    const messages: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await errors.nth(i).textContent();
      if (text) messages.push(text);
    }
    return messages;
  }

  // ==================== Field State ====================

  /**
   * Check if field is disabled
   */
  async isFieldDisabled(name: string): Promise<boolean> {
    return await this.page.locator(`[name="${name}"]`).isDisabled();
  }

  /**
   * Check if field is required
   */
  async isFieldRequired(name: string): Promise<boolean> {
    const field = this.page.locator(`[name="${name}"]`);
    const required = await field.getAttribute('required');
    const ariaRequired = await field.getAttribute('aria-required');
    return required !== null || ariaRequired === 'true';
  }

  /**
   * Get field value
   */
  async getFieldValue(name: string): Promise<string> {
    return await this.page.locator(`[name="${name}"]`).inputValue();
  }

  /**
   * Clear field
   */
  async clearField(name: string) {
    await this.page.locator(`[name="${name}"]`).clear();
  }

  // ==================== Complex Form Patterns ====================

  /**
   * Fill multiple fields at once
   */
  async fillFields(data: Record<string, string>) {
    for (const [name, value] of Object.entries(data)) {
      await this.fillInput(name, value);
    }
  }

  /**
   * Wait for form to be ready (all fields loaded)
   */
  async waitForFormReady() {
    await this.page.waitForSelector(this.submitButton, { state: 'visible' });
  }
}
