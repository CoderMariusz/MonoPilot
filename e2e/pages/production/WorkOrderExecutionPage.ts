/**
 * Work Order Execution Page Object
 *
 * Encapsulates all interactions with WO execution including:
 * - WO Start (FR-PROD-002)
 * - WO Pause/Resume (FR-PROD-003)
 * - WO Complete (FR-PROD-005)
 * - Operation Start/Complete (FR-PROD-004)
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface WOData {
  woNumber: string;
  productId: string;
  plannedQty: number;
  lineId?: string;
  machineId?: string;
}

export interface OperationData {
  sequence: number;
  name: string;
  actualYield?: number;
  notes?: string;
}

export class WorkOrderExecutionPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ==================== Navigation ====================

  /**
   * Navigate to WO execution page
   * TODO: Verify if /production/work-orders list page exists
   */
  async goto() {
    await super.goto('/planning/work-orders');
  }

  /**
   * Navigate to specific WO detail
   */
  async gotoWODetail(woId: string) {
    await super.goto(`/planning/work-orders/${woId}`);
  }

  // ==================== WO Start (FR-PROD-002) ====================

  /**
   * Click Start Production button
   */
  async clickStartProduction() {
    const startButton = this.page.getByRole('button', { name: /start production|start wo/i });
    await startButton.click();
    await this.waitForModal();
  }

  /**
   * Assert Start WO modal open
   */
  async expectStartModalOpen() {
    const modal = this.getModal();
    await expect(modal).toBeVisible();
    const title = modal.getByText(/start.*production|start.*wo/i);
    await expect(title).toBeVisible();
  }

  /**
   * Select production line in start modal
   */
  async selectLine(lineName: string) {
    const lineSelect = this.page.locator('[role="dialog"] button[role="combobox"]').filter({ hasText: /line|select.*line/i });
    await lineSelect.click();
    await this.page.waitForTimeout(200);
    const option = this.page.getByRole('option', { name: lineName });
    await option.click();
  }

  /**
   * Select machine in start modal
   */
  async selectMachine(machineName: string) {
    const machineSelect = this.page.locator('[role="dialog"] button[role="combobox"]').filter({ hasText: /machine|select.*machine/i });
    await machineSelect.click();
    await this.page.waitForTimeout(200);
    const option = this.page.getByRole('option', { name: machineName });
    await option.click();
  }

  /**
   * Confirm start production
   */
  async confirmStartProduction() {
    const modal = this.getModal();
    const confirmButton = modal.locator('button[type="submit"], button:has-text("Start")');
    await confirmButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Start WO (full workflow)
   */
  async startWO(lineName?: string, machineName?: string) {
    await this.clickStartProduction();

    if (lineName) {
      await this.selectLine(lineName);
    }

    if (machineName) {
      await this.selectMachine(machineName);
    }

    await this.confirmStartProduction();
    await this.waitForPageLoad();
  }

  /**
   * Assert WO status is "In Progress"
   */
  async expectWOInProgress() {
    const statusBadge = this.page.locator('[data-testid="wo-status"], .status-badge').filter({ hasText: /in progress/i });
    await expect(statusBadge).toBeVisible();
  }

  /**
   * Assert started_at timestamp is set
   */
  async expectStartedAtSet() {
    const startedAt = this.page.locator('[data-testid="started-at"], :has-text("Started")');
    await expect(startedAt).toBeVisible();
    const text = await startedAt.textContent();
    expect(text).toMatch(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/); // Time or date format
  }

  /**
   * Assert material availability warning
   */
  async expectMaterialWarning(percentage: number) {
    const warning = this.page.getByText(new RegExp(`material.*availability.*${percentage}%`, 'i'));
    await expect(warning).toBeVisible();
  }

  /**
   * Assert line already in use error
   */
  async expectLineInUseError(woNumber: string) {
    const error = this.page.getByText(new RegExp(`line.*already.*use.*${woNumber}`, 'i'));
    await expect(error).toBeVisible();
  }

  /**
   * Assert WO must be Released error
   */
  async expectWOMustBeReleasedError() {
    await this.expectErrorToast(/must be released/i);
  }

  /**
   * Assert Start button disabled
   */
  async expectStartButtonDisabled() {
    const startButton = this.page.getByRole('button', { name: /start production|start wo/i });
    await expect(startButton).toBeDisabled();
  }

  // ==================== WO Pause/Resume (FR-PROD-003) ====================

  /**
   * Click Pause button
   */
  async clickPause() {
    const pauseButton = this.page.getByRole('button', { name: /pause/i });
    await pauseButton.click();
    await this.waitForModal();
  }

  /**
   * Assert Pause modal open
   */
  async expectPauseModalOpen() {
    const modal = this.getModal();
    await expect(modal).toBeVisible();
    const title = modal.getByText(/pause.*wo|pause.*production/i);
    await expect(title).toBeVisible();
  }

  /**
   * Select pause reason
   */
  async selectPauseReason(reason: 'Machine Breakdown' | 'Material Shortage' | 'Break/Lunch' | 'Quality Issue' | 'Other') {
    const reasonSelect = this.page.locator('[role="dialog"] button[role="combobox"], [role="dialog"] select[name="pause_reason"]');

    if (await reasonSelect.getAttribute('role') === 'combobox') {
      await reasonSelect.click();
      await this.page.waitForTimeout(200);
      const option = this.page.getByRole('option', { name: reason });
      await option.click();
    } else {
      await reasonSelect.selectOption(reason);
    }
  }

  /**
   * Enter pause notes
   */
  async enterPauseNotes(notes: string) {
    const notesField = this.page.locator('[role="dialog"] textarea[name="notes"], [role="dialog"] textarea[placeholder*="note" i]');
    await notesField.fill(notes);
  }

  /**
   * Confirm pause
   */
  async confirmPause() {
    const modal = this.getModal();
    const confirmButton = modal.locator('button[type="submit"], button:has-text("Pause")');
    await confirmButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Pause WO (full workflow)
   */
  async pauseWO(reason: string, notes?: string) {
    await this.clickPause();
    await this.selectPauseReason(reason as any);

    if (notes) {
      await this.enterPauseNotes(notes);
    }

    await this.confirmPause();
    await this.waitForPageLoad();
  }

  /**
   * Assert WO status is "Paused"
   */
  async expectWOPaused() {
    const statusBadge = this.page.locator('[data-testid="wo-status"], .status-badge').filter({ hasText: /paused/i });
    await expect(statusBadge).toBeVisible();
  }

  /**
   * Assert paused_at timestamp is set
   */
  async expectPausedAtSet() {
    const pausedAt = this.page.locator('[data-testid="paused-at"], :has-text("Paused")');
    await expect(pausedAt).toBeVisible();
  }

  /**
   * Assert pause reason required error
   */
  async expectPauseReasonRequiredError() {
    await this.expectErrorToast(/pause reason.*required/i);
  }

  /**
   * Assert Pause button not visible
   */
  async expectPauseButtonNotVisible() {
    const pauseButton = this.page.getByRole('button', { name: /pause/i });
    await expect(pauseButton).not.toBeVisible();
  }

  /**
   * Click Resume button
   */
  async clickResume() {
    const resumeButton = this.page.getByRole('button', { name: /resume/i });
    await resumeButton.click();
  }

  /**
   * Confirm resume
   */
  async confirmResume() {
    // May have confirmation modal
    const confirmButton = this.page.locator('button:has-text("Resume"), button:has-text("Confirm")');
    if (await confirmButton.count() > 0) {
      await confirmButton.click();
    }
    await this.waitForPageLoad();
  }

  /**
   * Resume WO (full workflow)
   */
  async resumeWO() {
    await this.clickResume();
    await this.confirmResume();
  }

  /**
   * Assert resumed_at timestamp is set
   */
  async expectResumedAtSet() {
    const resumedAt = this.page.locator('[data-testid="resumed-at"], :has-text("Resumed")');
    await expect(resumedAt).toBeVisible();
  }

  /**
   * Assert pause duration calculated
   */
  async expectPauseDuration(expectedMinutes: number, tolerance: number = 1) {
    const duration = this.page.locator('[data-testid="pause-duration"], :has-text("Duration")');
    const text = await duration.textContent();
    const match = text?.match(/(\d+)\s*min/);
    expect(match).toBeTruthy();
    const actual = parseInt(match![1]);
    expect(Math.abs(actual - expectedMinutes)).toBeLessThanOrEqual(tolerance);
  }

  // ==================== WO Complete (FR-PROD-005) ====================

  /**
   * Click Complete WO button
   */
  async clickCompleteWO() {
    const completeButton = this.page.getByRole('button', { name: /complete.*wo|complete.*production/i });
    await completeButton.click();
    await this.waitForModal();
  }

  /**
   * Assert Complete WO modal open
   */
  async expectCompleteModalOpen() {
    const modal = this.getModal();
    await expect(modal).toBeVisible();
    const title = modal.getByText(/complete.*wo|complete.*production/i);
    await expect(title).toBeVisible();
  }

  /**
   * Confirm complete WO
   */
  async confirmCompleteWO() {
    const modal = this.getModal();
    const confirmButton = modal.locator('button[type="submit"], button:has-text("Complete")');
    await confirmButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Complete WO (full workflow)
   */
  async completeWO() {
    await this.clickCompleteWO();
    await this.confirmCompleteWO();
    await this.waitForPageLoad();
  }

  /**
   * Assert WO status is "Completed"
   */
  async expectWOCompleted() {
    const statusBadge = this.page.locator('[data-testid="wo-status"], .status-badge').filter({ hasText: /completed/i });
    await expect(statusBadge).toBeVisible();
  }

  /**
   * Assert completed_at timestamp is set
   */
  async expectCompletedAtSet() {
    const completedAt = this.page.locator('[data-testid="completed-at"], :has-text("Completed")');
    await expect(completedAt).toBeVisible();
  }

  /**
   * Assert no outputs registered error
   */
  async expectNoOutputsError() {
    await this.expectErrorToast(/at least one output.*required|output must be registered/i);
  }

  /**
   * Assert all operations must be completed error
   */
  async expectAllOperationsMustBeCompletedError() {
    await this.expectErrorToast(/all operations.*completed/i);
  }

  /**
   * Assert by-product warning
   */
  async expectByProductWarning() {
    const warning = this.page.getByText(/by-product.*not registered.*continue/i);
    await expect(warning).toBeVisible();
  }

  /**
   * Assert Complete button disabled
   */
  async expectCompleteButtonDisabled() {
    const completeButton = this.page.getByRole('button', { name: /complete.*wo/i });
    await expect(completeButton).toBeDisabled();
  }

  // ==================== Operations (FR-PROD-004) ====================

  /**
   * Get operations timeline
   */
  getOperationsTimeline(): Locator {
    return this.page.locator('[data-testid="operations-timeline"], .operations-list');
  }

  /**
   * Get operation by name
   */
  getOperation(operationName: string): Locator {
    return this.getOperationsTimeline().locator('.operation-item, [data-testid*="operation-"]').filter({ hasText: operationName });
  }

  /**
   * Click Start Operation
   */
  async clickStartOperation(operationName: string) {
    const operation = this.getOperation(operationName);
    const startButton = operation.locator('button:has-text("Start")');
    await startButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Assert operation status is "In Progress"
   */
  async expectOperationInProgress(operationName: string) {
    const operation = this.getOperation(operationName);
    const status = operation.locator(':has-text("In Progress")');
    await expect(status).toBeVisible();
  }

  /**
   * Click Complete Operation
   */
  async clickCompleteOperation(operationName: string) {
    const operation = this.getOperation(operationName);
    const completeButton = operation.locator('button:has-text("Complete")');
    await completeButton.click();
    await this.waitForModal();
  }

  /**
   * Enter operation yield
   */
  async enterOperationYield(yieldPercent: number) {
    const yieldInput = this.page.locator('[role="dialog"] input[name="actual_yield_percent"], input[type="number"]');
    await yieldInput.fill(yieldPercent.toString());
  }

  /**
   * Enter operation notes
   */
  async enterOperationNotes(notes: string) {
    const notesField = this.page.locator('[role="dialog"] textarea[name="notes"]');
    await notesField.fill(notes);
  }

  /**
   * Confirm complete operation
   */
  async confirmCompleteOperation() {
    const modal = this.getModal();
    const confirmButton = modal.locator('button[type="submit"], button:has-text("Complete")');
    await confirmButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Complete operation (full workflow)
   */
  async completeOperation(operationName: string, yieldPercent: number = 100, notes?: string) {
    await this.clickCompleteOperation(operationName);
    await this.enterOperationYield(yieldPercent);

    if (notes) {
      await this.enterOperationNotes(notes);
    }

    await this.confirmCompleteOperation();
  }

  /**
   * Assert operation status is "Completed"
   */
  async expectOperationCompleted(operationName: string) {
    const operation = this.getOperation(operationName);
    const status = operation.locator(':has-text("Completed")');
    await expect(status).toBeVisible();
  }

  /**
   * Assert operation actual yield
   */
  async expectOperationYield(operationName: string, yieldPercent: number) {
    const operation = this.getOperation(operationName);
    const yieldText = operation.locator(`:has-text("${yieldPercent}%")`);
    await expect(yieldText).toBeVisible();
  }

  /**
   * Assert operation duration
   */
  async expectOperationDuration(operationName: string, expectedMinutes: number, tolerance: number = 1) {
    const operation = this.getOperation(operationName);
    const durationText = await operation.textContent();
    const match = durationText?.match(/(\d+)\s*min/);
    expect(match).toBeTruthy();
    const actual = parseInt(match![1]);
    expect(Math.abs(actual - expectedMinutes)).toBeLessThanOrEqual(tolerance);
  }

  /**
   * Assert previous operation must be completed error
   */
  async expectPreviousOperationError() {
    await this.expectErrorToast(/previous operation.*completed/i);
  }

  /**
   * Assert yield validation error (> 100%)
   */
  async expectYieldExceedsMaxError() {
    await this.expectErrorToast(/yield.*cannot exceed.*100/i);
  }

  /**
   * Assert yield validation error (negative)
   */
  async expectYieldPositiveError() {
    await this.expectErrorToast(/yield.*positive/i);
  }

  /**
   * Assert operation buttons disabled
   */
  async expectOperationButtonsDisabled(operationName: string) {
    const operation = this.getOperation(operationName);
    const startButton = operation.locator('button:has-text("Start")');
    const completeButton = operation.locator('button:has-text("Complete")');

    if (await startButton.count() > 0) {
      await expect(startButton).toBeDisabled();
    }
    if (await completeButton.count() > 0) {
      await expect(completeButton).toBeDisabled();
    }
  }

  // ==================== WO Timeline ====================

  /**
   * Get WO timeline
   */
  getWOTimeline(): Locator {
    return this.page.locator('[data-testid="wo-timeline"], .timeline');
  }

  /**
   * Assert timeline event appears
   */
  async expectTimelineEvent(eventText: string | RegExp) {
    const timeline = this.getWOTimeline();
    const event = timeline.locator(':has-text("' + eventText + '")');
    await expect(event).toBeVisible();
  }
}
