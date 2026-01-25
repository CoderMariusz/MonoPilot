/**
 * Material Consumption Page Object
 *
 * Encapsulates all interactions with material consumption including:
 * - Desktop Consumption (FR-PROD-006)
 * - Scanner Consumption (FR-PROD-007)
 * - 1:1 Consumption (FR-PROD-008)
 * - Consumption Correction (FR-PROD-009)
 * - Over-Consumption Control (FR-PROD-010)
 * - Material Reservations (FR-PROD-016)
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface ConsumptionData {
  lpNumber: string;
  quantity: number;
  notes?: string;
}

export interface ReservationData {
  lpNumber: string;
  reservedQty: number;
  consumedQty?: number;
}

export class MaterialConsumptionPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ==================== Navigation ====================

  /**
   * Navigate to consumption page (desktop)
   */
  async goto() {
    await super.goto('/production/consumption');
  }

  /**
   * Navigate to scanner consumption page
   */
  async gotoScanner() {
    await super.goto('/scanner/consume');
  }

  /**
   * Navigate to WO consumption detail
   */
  async gotoWOConsumption(woId: string) {
    await super.goto(`/production/consumption/${woId}`);
  }

  // ==================== Desktop Consumption (FR-PROD-006) ====================

  /**
   * Get required materials table
   */
  getRequiredMaterialsTable(): Locator {
    return this.page.locator('[data-testid="required-materials-table"], table').first();
  }

  /**
   * Get material row
   */
  getMaterialRow(materialName: string): Locator {
    return this.getRequiredMaterialsTable().locator('tbody tr').filter({ hasText: materialName });
  }

  /**
   * Click Consume button for material
   */
  async clickConsume(materialName: string) {
    const row = this.getMaterialRow(materialName);
    const consumeButton = row.locator('button:has-text("Consume")');
    await consumeButton.click();
    await this.waitForModal();
  }

  /**
   * Assert consumption modal open
   */
  async expectConsumptionModalOpen() {
    const modal = this.getModal();
    await expect(modal).toBeVisible();
    const title = modal.getByText(/consume.*material|add.*consumption/i);
    await expect(title).toBeVisible();
  }

  /**
   * Search for LP by barcode
   */
  async searchLP(lpNumber: string) {
    const searchInput = this.page.locator('[role="dialog"] input[placeholder*="LP" i], input[placeholder*="barcode" i]');
    await searchInput.fill(lpNumber);
    await this.page.waitForTimeout(500); // Debounce search
  }

  /**
   * Scan LP barcode
   */
  async scanLP(lpNumber: string) {
    await this.searchLP(lpNumber);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(300);
  }

  /**
   * Enter consumption quantity
   */
  async enterQuantity(quantity: number) {
    const qtyInput = this.page.locator('[role="dialog"] input[name="quantity"], input[type="number"]').first();
    await qtyInput.fill(quantity.toString());
  }

  /**
   * Enter consumption notes
   */
  async enterNotes(notes: string) {
    const notesField = this.page.locator('[role="dialog"] textarea[name="notes"]');
    await notesField.fill(notes);
  }

  /**
   * Confirm consumption
   */
  async confirmConsumption() {
    const modal = this.getModal();
    const confirmButton = modal.locator('button[type="submit"], button:has-text("Confirm")');
    await confirmButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Consume material (full workflow)
   */
  async consumeMaterial(materialName: string, lpNumber: string, quantity: number, notes?: string) {
    await this.clickConsume(materialName);
    await this.scanLP(lpNumber);
    await this.enterQuantity(quantity);

    if (notes) {
      await this.enterNotes(notes);
    }

    await this.confirmConsumption();
  }

  /**
   * Assert material consumption progress
   */
  async expectConsumptionProgress(materialName: string, required: number, consumed: number) {
    const row = this.getMaterialRow(materialName);
    const progressText = row.locator(':has-text("Required"), :has-text("Consumed")');
    await expect(progressText).toContainText(`${consumed}`);
    await expect(progressText).toContainText(`${required}`);
  }

  /**
   * Assert progress bar percentage
   */
  async expectProgressBar(materialName: string, expectedPercent: number) {
    const row = this.getMaterialRow(materialName);
    const progressBar = row.locator('[role="progressbar"], .progress-bar');
    const percent = await progressBar.getAttribute('aria-valuenow');
    expect(parseFloat(percent || '0')).toBeCloseTo(expectedPercent, 1);
  }

  // ==================== Validation Errors ====================

  /**
   * Assert LP not found error
   */
  async expectLPNotFoundError() {
    await this.expectErrorToast(/lp.*not found/i);
  }

  /**
   * Assert LP not available error
   */
  async expectLPNotAvailableError(status: string) {
    await this.expectErrorToast(new RegExp(`lp.*not available.*${status}`, 'i'));
  }

  /**
   * Assert product mismatch error
   */
  async expectProductMismatchError(lpProduct: string, requiredProduct: string) {
    await this.expectErrorToast(new RegExp(`product mismatch.*${lpProduct}.*${requiredProduct}`, 'i'));
  }

  /**
   * Assert UoM mismatch error
   */
  async expectUoMMismatchError(lpUoM: string, requiredUoM: string) {
    await this.expectErrorToast(new RegExp(`unit.*measure.*mismatch.*${lpUoM}.*${requiredUoM}`, 'i'));
  }

  /**
   * Assert insufficient quantity error
   */
  async expectInsufficientQuantityError(available: number, requested: number) {
    await this.expectErrorToast(new RegExp(`insufficient.*${available}.*${requested}`, 'i'));
  }

  // ==================== Scanner Consumption (FR-PROD-007) ====================

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
  async expectWOInfoDisplayed(woNumber: string) {
    const woInfo = this.page.locator('[data-testid="wo-info"], .wo-summary');
    await expect(woInfo).toContainText(woNumber);
  }

  /**
   * Assert required materials list (scanner)
   */
  async expectRequiredMaterialsList() {
    const materialsList = this.page.locator('[data-testid="required-materials"], .materials-list');
    await expect(materialsList).toBeVisible();
  }

  /**
   * Assert scanner success feedback
   */
  async expectScanSuccess() {
    const successIcon = this.page.locator('.scan-success, [data-testid="scan-success"]');
    await expect(successIcon).toBeVisible({ timeout: 1000 });
  }

  /**
   * Assert scanner error feedback
   */
  async expectScanError() {
    const errorIcon = this.page.locator('.scan-error, [data-testid="scan-error"]');
    await expect(errorIcon).toBeVisible({ timeout: 1000 });
  }

  /**
   * Click Full LP button (scanner)
   */
  async clickFullLP() {
    const fullLPButton = this.page.getByRole('button', { name: /full lp/i });
    await fullLPButton.click();
  }

  /**
   * Assert quantity auto-filled with LP qty
   */
  async expectQuantityAutoFilled(expectedQty: number) {
    const qtyInput = this.page.locator('input[name="quantity"], input[type="number"]').first();
    const value = await qtyInput.inputValue();
    expect(parseFloat(value)).toBe(expectedQty);
  }

  /**
   * Assert touch target size (accessibility)
   */
  async expectTouchTargetSize(buttonText: string, minSize: number = 48) {
    const button = this.page.getByRole('button', { name: new RegExp(buttonText, 'i') });
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(minSize);
  }

  /**
   * Click Next Material button
   */
  async clickNextMaterial() {
    const nextButton = this.page.getByRole('button', { name: /next material/i });
    await nextButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Click Done button
   */
  async clickDone() {
    const doneButton = this.page.getByRole('button', { name: /done|finish/i });
    await doneButton.click();
    await this.waitForPageLoad();
  }

  // ==================== 1:1 Consumption (FR-PROD-008) ====================

  /**
   * Assert Full LP Required badge
   */
  async expectFullLPRequiredBadge(materialName: string) {
    const row = this.getMaterialRow(materialName);
    const badge = row.locator(':has-text("Full LP Required")');
    await expect(badge).toBeVisible();
  }

  /**
   * Assert full LP consumption required error
   */
  async expectFullLPConsumptionError(lpQty: number) {
    await this.expectErrorToast(new RegExp(`full lp.*required.*${lpQty}`, 'i'));
  }

  /**
   * Assert quantity input read-only
   */
  async expectQuantityReadOnly() {
    const qtyInput = this.page.locator('input[name="quantity"], input[type="number"]').first();
    const isReadOnly = await qtyInput.getAttribute('readonly');
    expect(isReadOnly).not.toBeNull();
  }

  /**
   * Assert full LP consumption warning
   */
  async expectFullLPWarning() {
    const warning = this.page.getByText(/full lp consumption/i);
    await expect(warning).toBeVisible();
  }

  // ==================== Consumption Correction (FR-PROD-009) ====================

  /**
   * Get consumption history table
   */
  getConsumptionHistoryTable(): Locator {
    return this.page.locator('[data-testid="consumption-history"], table.consumption-history');
  }

  /**
   * Click Reverse button on consumption
   */
  async clickReverse(lpNumber: string) {
    const table = this.getConsumptionHistoryTable();
    const row = table.locator('tbody tr').filter({ hasText: lpNumber });
    const reverseButton = row.locator('button:has-text("Reverse")');
    await reverseButton.click();
    await this.waitForModal();
  }

  /**
   * Assert Reverse button visible (Manager/Admin only)
   */
  async expectReverseButtonVisible() {
    const reverseButton = this.page.locator('button:has-text("Reverse")').first();
    await expect(reverseButton).toBeVisible();
  }

  /**
   * Assert Reverse button not visible (Operator)
   */
  async expectReverseButtonNotVisible() {
    const reverseButton = this.page.locator('button:has-text("Reverse")');
    await expect(reverseButton).not.toBeVisible();
  }

  /**
   * Enter reversal reason
   */
  async enterReversalReason(reason: string) {
    const reasonField = this.page.locator('[role="dialog"] textarea[name="reason"], textarea[placeholder*="reason" i]');
    await reasonField.fill(reason);
  }

  /**
   * Confirm reversal
   */
  async confirmReversal() {
    const modal = this.getModal();
    const confirmButton = modal.locator('button[type="submit"], button:has-text("Reverse")');
    await confirmButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Reverse consumption (full workflow)
   */
  async reverseConsumption(lpNumber: string, reason: string) {
    await this.clickReverse(lpNumber);
    await this.enterReversalReason(reason);
    await this.confirmReversal();
  }

  /**
   * Assert consumption marked as reversed
   */
  async expectConsumptionReversed(lpNumber: string) {
    const table = this.getConsumptionHistoryTable();
    const row = table.locator('tbody tr').filter({ hasText: lpNumber });
    const reversedBadge = row.locator(':has-text("Reversed")');
    await expect(reversedBadge).toBeVisible();
  }

  /**
   * Assert reason required for reversal
   */
  async expectReversalReasonRequired() {
    await this.expectErrorToast(/reason.*required/i);
  }

  // ==================== Over-Consumption Control (FR-PROD-010) ====================

  /**
   * Assert variance indicator
   */
  async expectVarianceIndicator(materialName: string, variancePercent: number) {
    const row = this.getMaterialRow(materialName);
    const variance = row.locator('[data-testid="variance"], .variance');
    await expect(variance).toContainText(`${Math.abs(variancePercent)}%`);
  }

  /**
   * Assert over-consumption approval request
   */
  async expectOverConsumptionApprovalRequest() {
    const approvalModal = this.page.getByText(/over-consumption.*approval|manager.*approval/i);
    await expect(approvalModal).toBeVisible();
  }

  /**
   * Assert high variance alert
   */
  async expectHighVarianceAlert(woNumber: string) {
    const alert = this.page.getByText(new RegExp(`high variance.*${woNumber}`, 'i'));
    await expect(alert).toBeVisible();
  }

  /**
   * Approve over-consumption (Manager)
   */
  async approveOverConsumption() {
    const approveButton = this.page.getByRole('button', { name: /approve/i });
    await approveButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Reject over-consumption (Manager)
   */
  async rejectOverConsumption(reason: string) {
    const rejectButton = this.page.getByRole('button', { name: /reject/i });
    await rejectButton.click();
    await this.waitForModal();

    const reasonField = this.page.locator('[role="dialog"] textarea[name="reason"]');
    await reasonField.fill(reason);

    const confirmButton = this.page.locator('[role="dialog"] button:has-text("Confirm")');
    await confirmButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Assert awaiting approval status
   */
  async expectAwaitingApproval() {
    const status = this.page.getByText(/awaiting.*approval/i);
    await expect(status).toBeVisible();
  }

  // ==================== Material Reservations (FR-PROD-016) ====================

  /**
   * Get reservations table
   */
  getReservationsTable(): Locator {
    return this.page.locator('[data-testid="reservations-table"], table.reservations');
  }

  /**
   * Assert reservation created
   */
  async expectReservationCreated(lpNumber: string, reservedQty: number) {
    const table = this.getReservationsTable();
    const row = table.locator('tbody tr').filter({ hasText: lpNumber });
    await expect(row).toBeVisible();
    await expect(row).toContainText(reservedQty.toString());
  }

  /**
   * Assert LP reserved error
   */
  async expectLPReservedError(woNumber: string) {
    await this.expectErrorToast(new RegExp(`reserved.*${woNumber}`, 'i'));
  }

  /**
   * Assert remaining reserved quantity
   */
  async expectRemainingReserved(lpNumber: string, remaining: number) {
    const table = this.getReservationsTable();
    const row = table.locator('tbody tr').filter({ hasText: lpNumber });
    await expect(row).toContainText(`${remaining}`);
  }

  /**
   * Assert reservation released
   */
  async expectReservationReleased(lpNumber: string) {
    const table = this.getReservationsTable();
    const row = table.locator('tbody tr').filter({ hasText: lpNumber });
    const releasedBadge = row.locator(':has-text("Released")');
    await expect(releasedBadge).toBeVisible();
  }

  /**
   * Click Release reservation (Manager)
   */
  async clickReleaseReservation(lpNumber: string) {
    const table = this.getReservationsTable();
    const row = table.locator('tbody tr').filter({ hasText: lpNumber });
    const releaseButton = row.locator('button:has-text("Release")');
    await releaseButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Assert no reservations created
   */
  async expectNoReservations() {
    const table = this.getReservationsTable();
    const emptyMessage = table.locator(':has-text("No reservations")');
    await expect(emptyMessage).toBeVisible();
  }
}
