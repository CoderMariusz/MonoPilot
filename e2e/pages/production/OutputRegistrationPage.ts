/**
 * Output Registration Page Object
 *
 * Encapsulates all interactions with output registration including:
 * - Desktop Output Registration (FR-PROD-011)
 * - Scanner Output Registration (FR-PROD-012)
 * - By-Product Registration (FR-PROD-013)
 * - Multiple Outputs per WO (FR-PROD-015)
 * - Yield Tracking (FR-PROD-014)
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface OutputData {
  quantity: number;
  qaStatus?: 'Approved' | 'Pending' | 'Rejected';
  locationId?: string;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
}

export interface ByProductData {
  productId: string;
  quantity: number;
  qaStatus?: 'Approved' | 'Pending' | 'Rejected';
}

export class OutputRegistrationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ==================== Navigation ====================

  /**
   * Navigate to outputs page (desktop)
   */
  async goto() {
    await super.goto('/production/outputs');
  }

  /**
   * Navigate to scanner output page
   */
  async gotoScanner() {
    await super.goto('/scanner/output');
  }

  /**
   * Navigate to WO outputs detail
   */
  async gotoWOOutputs(woId: string) {
    await super.goto(`/production/outputs/${woId}`);
  }

  // ==================== Desktop Output Registration (FR-PROD-011) ====================

  /**
   * Click Register Output button
   */
  async clickRegisterOutput() {
    const registerButton = this.page.getByRole('button', { name: /register.*output|add.*output/i });
    await registerButton.click();
    await this.waitForModal();
  }

  /**
   * Assert output modal open
   */
  async expectOutputModalOpen() {
    const modal = this.getModal();
    await expect(modal).toBeVisible();
    const title = modal.getByText(/register.*output|create.*output/i);
    await expect(title).toBeVisible();
  }

  /**
   * Enter output quantity
   */
  async enterQuantity(quantity: number) {
    const qtyInput = this.page.locator('[role="dialog"] input[name="quantity"], input[type="number"]').first();
    await qtyInput.fill(quantity.toString());
  }

  /**
   * Select QA status
   */
  async selectQAStatus(status: 'Approved' | 'Pending' | 'Rejected') {
    const qaSelect = this.page.locator('[role="dialog"] button[role="combobox"]').filter({ hasText: /qa.*status|quality/i });

    if (await qaSelect.count() > 0) {
      await qaSelect.click();
      await this.page.waitForTimeout(200);
      const option = this.page.getByRole('option', { name: status });
      await option.click();
    } else {
      // Native select fallback
      const select = this.page.locator('[role="dialog"] select[name="qa_status"]');
      await select.selectOption(status);
    }
  }

  /**
   * Select location
   */
  async selectLocation(locationName: string) {
    const locationSelect = this.page.locator('[role="dialog"] button[role="combobox"]').filter({ hasText: /location/i });

    if (await locationSelect.count() > 0) {
      await locationSelect.click();
      await this.page.waitForTimeout(200);
      const option = this.page.getByRole('option', { name: locationName });
      await option.click();
    } else {
      const select = this.page.locator('[role="dialog"] select[name="location_id"]');
      await select.selectOption(locationName);
    }
  }

  /**
   * Enter batch number (optional override)
   */
  async enterBatchNumber(batchNumber: string) {
    const batchInput = this.page.locator('[role="dialog"] input[name="batch_number"]');
    await batchInput.fill(batchNumber);
  }

  /**
   * Enter expiry date (optional override)
   */
  async enterExpiryDate(expiryDate: string) {
    const expiryInput = this.page.locator('[role="dialog"] input[name="expiry_date"], input[type="date"]');
    await expiryInput.fill(expiryDate);
  }

  /**
   * Enter output notes
   */
  async enterNotes(notes: string) {
    const notesField = this.page.locator('[role="dialog"] textarea[name="notes"]');
    await notesField.fill(notes);
  }

  /**
   * Confirm output registration
   */
  async confirmRegistration() {
    const modal = this.getModal();
    const confirmButton = modal.locator('button[type="submit"], button:has-text("Register")');
    await confirmButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Register output (full workflow)
   */
  async registerOutput(data: OutputData) {
    await this.clickRegisterOutput();
    await this.enterQuantity(data.quantity);

    if (data.qaStatus) {
      await this.selectQAStatus(data.qaStatus);
    }

    if (data.locationId) {
      await this.selectLocation(data.locationId);
    }

    if (data.batchNumber) {
      await this.enterBatchNumber(data.batchNumber);
    }

    if (data.expiryDate) {
      await this.enterExpiryDate(data.expiryDate);
    }

    if (data.notes) {
      await this.enterNotes(data.notes);
    }

    await this.confirmRegistration();
  }

  /**
   * Assert LP created with correct data
   */
  async expectLPCreated(lpNumber: string, quantity: number, qaStatus: string) {
    const lpCard = this.page.locator('[data-testid="lp-created"], .lp-info').filter({ hasText: lpNumber });
    await expect(lpCard).toBeVisible();
    await expect(lpCard).toContainText(quantity.toString());
    await expect(lpCard).toContainText(qaStatus);
  }

  /**
   * Assert expiry date auto-calculated
   */
  async expectExpiryDateAutoCalculated(expectedDate: string) {
    const expiryInput = this.page.locator('[role="dialog"] input[name="expiry_date"]');
    const value = await expiryInput.inputValue();
    expect(value).toBe(expectedDate);
  }

  /**
   * Assert batch number auto-filled
   */
  async expectBatchNumberAutoFilled(woNumber: string) {
    const batchInput = this.page.locator('[role="dialog"] input[name="batch_number"]');
    const value = await batchInput.inputValue();
    expect(value).toBe(woNumber);
  }

  /**
   * Assert QA status required error
   */
  async expectQAStatusRequiredError() {
    await this.expectErrorToast(/qa.*status.*required/i);
  }

  /**
   * Assert quantity validation error
   */
  async expectQuantityValidationError() {
    await this.expectErrorToast(/quantity.*greater.*0/i);
  }

  /**
   * Assert LP source is "production"
   */
  async expectLPSourceProduction(lpNumber: string) {
    const lpCard = this.page.locator('[data-testid="lp-info"]').filter({ hasText: lpNumber });
    await expect(lpCard).toContainText(/source.*production/i);
  }

  /**
   * Assert location pre-selected
   */
  async expectLocationPreSelected(locationName: string) {
    const locationSelect = this.page.locator('[role="dialog"] button[role="combobox"]').filter({ hasText: /location/i });
    await expect(locationSelect).toContainText(locationName);
  }

  // ==================== Output History ====================

  /**
   * Get output history table
   */
  getOutputHistoryTable(): Locator {
    return this.page.locator('[data-testid="output-history"], table.output-history');
  }

  /**
   * Assert output appears in history
   */
  async expectOutputInHistory(lpNumber: string) {
    const table = this.getOutputHistoryTable();
    const row = table.locator('tbody tr').filter({ hasText: lpNumber });
    await expect(row).toBeVisible();
  }

  /**
   * Get total output quantity
   */
  async getTotalOutputQty(): Promise<number> {
    const totalQty = this.page.locator('[data-testid="total-output-qty"], :has-text("Total Output")');
    const text = await totalQty.textContent();
    const match = text?.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Get WO progress percentage
   */
  async getWOProgress(): Promise<number> {
    const progress = this.page.locator('[data-testid="wo-progress"], [role="progressbar"]');
    const percent = await progress.getAttribute('aria-valuenow');
    return parseFloat(percent || '0');
  }

  /**
   * Assert progress bar shows percentage
   */
  async expectProgressBar(expectedPercent: number) {
    const progress = await this.getWOProgress();
    expect(progress).toBeCloseTo(expectedPercent, 1);
  }

  // ==================== Scanner Output Registration (FR-PROD-012) ====================

  /**
   * Scan WO barcode (scanner mode)
   */
  async scanWOBarcode(woNumber: string) {
    const woInput = this.page.locator('input[placeholder*="scan.*wo" i], input[placeholder*="work order" i]');
    await woInput.fill(woNumber);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  /**
   * Assert WO info displayed (scanner)
   */
  async expectWOInfoDisplayed(woNumber: string, productName: string) {
    const woInfo = this.page.locator('[data-testid="wo-info"], .wo-summary');
    await expect(woInfo).toContainText(woNumber);
    await expect(woInfo).toContainText(productName);
  }

  /**
   * Assert QA status buttons (scanner)
   */
  async expectQAStatusButtons() {
    const approvedButton = this.page.getByRole('button', { name: /approved/i });
    const pendingButton = this.page.getByRole('button', { name: /pending/i });
    const rejectedButton = this.page.getByRole('button', { name: /rejected/i });

    await expect(approvedButton).toBeVisible();
    await expect(pendingButton).toBeVisible();
    await expect(rejectedButton).toBeVisible();

    // Check button height (touch target)
    const approvedBox = await approvedButton.boundingBox();
    expect(approvedBox?.height).toBeGreaterThanOrEqual(64);
  }

  /**
   * Click QA status button (scanner)
   */
  async clickQAStatusButton(status: 'Approved' | 'Pending' | 'Rejected') {
    const button = this.page.getByRole('button', { name: new RegExp(status, 'i') });
    await button.click();
  }

  /**
   * Assert print button visible
   */
  async expectPrintButtonVisible() {
    const printButton = this.page.getByRole('button', { name: /print/i });
    await expect(printButton).toBeVisible();
  }

  /**
   * Assert print button disabled
   */
  async expectPrintButtonDisabled() {
    const printButton = this.page.getByRole('button', { name: /print/i });
    await expect(printButton).toBeDisabled();
  }

  /**
   * Click Print button
   */
  async clickPrint() {
    const printButton = this.page.getByRole('button', { name: /print/i });
    await printButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Assert print confirmation
   */
  async expectPrintConfirmation() {
    const confirmation = this.page.getByText(/print.*sent|label.*printed/i);
    await expect(confirmation).toBeVisible({ timeout: 3000 });
  }

  // ==================== By-Product Registration (FR-PROD-013) ====================

  /**
   * Assert by-product prompt
   */
  async expectByProductPrompt() {
    const prompt = this.page.getByText(/register.*by-product/i);
    await expect(prompt).toBeVisible();
  }

  /**
   * Click Yes on by-product prompt
   */
  async clickYesOnByProductPrompt() {
    const yesButton = this.page.getByRole('button', { name: /yes/i });
    await yesButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Click No on by-product prompt
   */
  async clickNoOnByProductPrompt() {
    const noButton = this.page.getByRole('button', { name: /no/i });
    await noButton.click();
  }

  /**
   * Assert expected by-product quantity
   */
  async expectByProductQuantity(expectedQty: number) {
    const qtyField = this.page.locator('[data-testid="expected-qty"], :has-text("Expected")');
    await expect(qtyField).toContainText(expectedQty.toString());
  }

  /**
   * Enter actual by-product quantity
   */
  async enterByProductQuantity(actualQty: number) {
    const qtyInput = this.page.locator('input[name="quantity"], input[type="number"]').first();
    await qtyInput.fill(actualQty.toString());
  }

  /**
   * Register by-product
   */
  async registerByProduct(quantity: number, qaStatus: 'Approved' | 'Pending' | 'Rejected' = 'Approved') {
    await this.enterByProductQuantity(quantity);
    await this.selectQAStatus(qaStatus);
    await this.confirmRegistration();
  }

  /**
   * Assert by-product LP created
   */
  async expectByProductLPCreated(productName: string, quantity: number) {
    const lpCard = this.page.locator('[data-testid="lp-info"]').filter({ hasText: productName });
    await expect(lpCard).toBeVisible();
    await expect(lpCard).toContainText(quantity.toString());
  }

  /**
   * Assert by-product quantity warning
   */
  async expectByProductQuantityWarning() {
    const warning = this.page.getByText(/by-product.*quantity.*0.*continue/i);
    await expect(warning).toBeVisible();
  }

  /**
   * Assert by-product registration complete
   */
  async expectByProductRegistrationComplete() {
    const confirmation = this.page.getByText(/by-product.*complete/i);
    await expect(confirmation).toBeVisible();
  }

  /**
   * Assert all by-products displayed
   */
  async expectByProductsDisplayed(count: number) {
    const byProducts = this.page.locator('[data-testid="by-product-item"], .by-product');
    const actualCount = await byProducts.count();
    expect(actualCount).toBe(count);
  }

  // ==================== Multiple Outputs per WO (FR-PROD-015) ====================

  /**
   * Assert multiple LPs in history
   */
  async expectMultipleLPsInHistory(lpNumbers: string[]) {
    const table = this.getOutputHistoryTable();

    for (const lpNumber of lpNumbers) {
      const row = table.locator('tbody tr').filter({ hasText: lpNumber });
      await expect(row).toBeVisible();
    }
  }

  /**
   * Assert total output quantity sum
   */
  async expectTotalOutputSum(expectedTotal: number) {
    const totalQty = await this.getTotalOutputQty();
    expect(totalQty).toBeCloseTo(expectedTotal, 2);
  }

  /**
   * Assert unique LP IDs generated
   */
  async expectUniqueLPIDs(lpNumbers: string[]) {
    const uniqueLPs = new Set(lpNumbers);
    expect(uniqueLPs.size).toBe(lpNumbers.length);
  }

  /**
   * Assert WO auto-completed
   */
  async expectWOAutoCompleted() {
    const statusBadge = this.page.locator('[data-testid="wo-status"], .status-badge').filter({ hasText: /completed/i });
    await expect(statusBadge).toBeVisible();
  }

  /**
   * Assert WO remains In Progress
   */
  async expectWOInProgress() {
    const statusBadge = this.page.locator('[data-testid="wo-status"], .status-badge').filter({ hasText: /in progress/i });
    await expect(statusBadge).toBeVisible();
  }

  // ==================== Yield Tracking (FR-PROD-014) ====================

  /**
   * Get yield summary card
   */
  getYieldSummary(): Locator {
    return this.page.locator('[data-testid="yield-summary"], .yield-card');
  }

  /**
   * Get output yield percentage
   */
  async getOutputYield(): Promise<number> {
    const yieldCard = this.getYieldSummary();
    const text = await yieldCard.textContent();
    const match = text?.match(/([\d.]+)%/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Assert output yield calculated
   */
  async expectOutputYield(expectedYield: number) {
    const actualYield = await this.getOutputYield();
    expect(actualYield).toBeCloseTo(expectedYield, 1);
  }

  /**
   * Assert yield indicator color
   */
  async expectYieldIndicatorGreen() {
    const indicator = this.page.locator('[data-testid="yield-indicator"], .yield-indicator');
    const className = await indicator.getAttribute('class');
    expect(className).toMatch(/green|success/i);
  }

  /**
   * Assert yield indicator color
   */
  async expectYieldIndicatorRed() {
    const indicator = this.page.locator('[data-testid="yield-indicator"], .yield-indicator');
    const className = await indicator.getAttribute('class');
    expect(className).toMatch(/red|error|danger/i);
  }

  /**
   * Assert yield N/A
   */
  async expectYieldNA() {
    const yieldCard = this.getYieldSummary();
    await expect(yieldCard).toContainText(/n\/a/i);
  }

  /**
   * Assert low yield alert
   */
  async expectLowYieldAlert(woNumber: string) {
    const alert = this.page.getByText(new RegExp(`low yield.*${woNumber}`, 'i'));
    await expect(alert).toBeVisible();
  }

  // ==================== Genealogy ====================

  /**
   * Assert genealogy updated with child LP
   */
  async expectGenealogyUpdated(parentLPs: string[], childLP: string) {
    const genealogy = this.page.locator('[data-testid="genealogy"], .genealogy-view');

    for (const parentLP of parentLPs) {
      const parentRow = genealogy.locator(':has-text("' + parentLP + '")');
      await expect(parentRow).toBeVisible();
    }

    const childRow = genealogy.locator(':has-text("' + childLP + '")');
    await expect(childRow).toBeVisible();
  }
}
