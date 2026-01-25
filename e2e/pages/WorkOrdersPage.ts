/**
 * Work Orders Page Object
 *
 * Encapsulates all interactions with the Work Orders planning module.
 * Covers list view, CRUD operations, availability, and reservations.
 *
 * Story 03.10: Work Order CRUD (PLAN-013 to PLAN-019)
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class WorkOrdersPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to Work Orders page
   */
  async goto() {
    await super.goto('/planning/work-orders');
  }

  // ==================== Page Navigation ====================

  /**
   * Get page header element
   */
  async expectPageHeader() {
    const header = this.page.getByRole('heading', { level: 1, name: /work orders/i });
    await expect(header).toBeVisible();
  }

  /**
   * Click "Create Work Order" button
   */
  async clickCreateButton() {
    await this.clickButton(/create work order|new work order|\+ add|add work order/i);
  }

  /**
   * Click on a WO row in the table
   */
  async clickWORow(woNumber: string) {
    const row = this.page.getByRole('row').filter({ has: this.page.getByText(woNumber) });
    await row.click();
  }

  /**
   * Click edit action for a WO
   */
  async clickEditWO(woNumber: string) {
    const row = this.page.getByRole('row').filter({ has: this.page.getByText(woNumber) });
    const editButton = row.getByRole('button', { name: /edit|pencil/i }).first();
    await editButton.click();
  }

  /**
   * Click delete action for a WO
   */
  async clickDeleteWO(woNumber: string) {
    const row = this.page.getByRole('row').filter({ has: this.page.getByText(woNumber) });
    const deleteButton = row.getByRole('button', { name: /delete|trash/i }).first();
    await deleteButton.click();
  }

  /**
   * Confirm delete in dialog
   */
  async confirmDelete() {
    await this.clickButton(/confirm|delete|yes/i);
  }

  // ==================== Table Operations ====================

  /**
   * Get row count from WO table
   */
  async getRowCount(): Promise<number> {
    return await this.page.locator('tbody tr').count();
  }

  /**
   * Check if table has specific columns
   */
  async expectTableWithColumns(columns: string[]) {
    for (const col of columns) {
      const header = this.page.getByRole('columnheader', { name: new RegExp(col, 'i') });
      await expect(header).toBeVisible();
    }
  }

  /**
   * Get all WO numbers from the table
   */
  async getWONumbers(): Promise<string[]> {
    const cells = await this.page.locator('tbody tr td:first-child').allTextContents();
    return cells;
  }

  /**
   * Search for a WO by number or product name
   */
  async search(query: string) {
    const searchInput = this.page.getByPlaceholder(/search|find/i);
    await searchInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for search debounce
  }

  /**
   * Clear search
   */
  async clearSearch() {
    const searchInput = this.page.getByPlaceholder(/search|find/i);
    await searchInput.clear();
    await this.page.waitForTimeout(500);
  }

  /**
   * Get column value for a specific WO row and column
   */
  async getCellValue(woNumber: string, columnName: string): Promise<string> {
    const row = this.page.getByRole('row').filter({ has: this.page.getByText(woNumber) });
    const headers = await this.page.locator('thead th').allTextContents();
    const colIndex = headers.findIndex(h => h.toLowerCase().includes(columnName.toLowerCase()));

    if (colIndex === -1) {
      throw new Error(`Column "${columnName}" not found`);
    }

    const cellSelector = `td:nth-child(${colIndex + 1})`;
    const cell = row.locator(cellSelector);
    return await cell.textContent() || '';
  }

  // ==================== Filters ====================

  /**
   * Filter by status
   */
  async filterByStatus(status: string) {
    const filterButton = this.page.getByRole('button', { name: /filter|status/i }).first();
    await filterButton.click();

    const statusOption = this.page.getByRole('option', { name: new RegExp(status, 'i') });
    await statusOption.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Filter by priority
   */
  async filterByPriority(priority: string) {
    const filterButton = this.page.getByRole('button', { name: /priority|filter/i }).first();
    await filterButton.click();

    const priorityOption = this.page.getByRole('option', { name: new RegExp(priority, 'i') });
    await priorityOption.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Filter by date range
   */
  async filterByDateRange(startDate: string, endDate: string) {
    const dateFromInput = this.page.getByPlaceholder(/from|start/i);
    const dateToInput = this.page.getByPlaceholder(/to|end/i);

    await dateFromInput.fill(startDate);
    await dateToInput.fill(endDate);
    await this.page.waitForTimeout(500);
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    const clearButton = this.page.getByRole('button', { name: /clear|reset|x/i }).first();
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  // ==================== Form Interactions ====================

  /**
   * Fill WO form field by label
   */
  async fillFormField(label: string, value: string) {
    await this.fillByLabel(label, value);
  }

  /**
   * Select product in form
   */
  async selectProduct(productName: string) {
    const productField = this.page.getByLabel(/product|select product/i);
    await productField.click();

    const option = this.page.getByRole('option', { name: new RegExp(productName, 'i') });
    await option.click();
  }

  /**
   * Select production line in form
   */
  async selectProductionLine(lineName: string) {
    const lineField = this.page.getByLabel(/production line|line/i);
    await lineField.click();

    const option = this.page.getByRole('option', { name: new RegExp(lineName, 'i') });
    await option.click();
  }

  /**
   * Select priority in form
   */
  async selectPriority(priority: 'low' | 'normal' | 'high' | 'critical') {
    const priorityField = this.page.getByLabel(/priority/i);
    await priorityField.click();

    const option = this.page.getByRole('option', { name: new RegExp(priority, 'i') });
    await option.click();
  }

  /**
   * Select BOM
   */
  async selectBOM(bomName: string) {
    const bomField = this.page.getByLabel(/bom|recipe/i);
    await bomField.click();

    const option = this.page.getByRole('option', { name: new RegExp(bomName, 'i') });
    await option.click();
  }

  /**
   * Fill planned quantity
   */
  async fillPlannedQuantity(qty: string | number) {
    await this.fillByLabel(/quantity|planned qty/i, String(qty));
  }

  /**
   * Fill planned start date
   */
  async fillPlannedStartDate(date: string) {
    await this.fillByLabel(/start date|scheduled date/i, date);
  }

  /**
   * Submit form
   */
  async submitForm() {
    await this.clickButton(/save|create|submit/i);
    await this.page.waitForTimeout(1000); // Wait for form submission
  }

  /**
   * Close form dialog
   */
  async closeForm() {
    await this.clickButton(/close|cancel|x/i);
  }

  // ==================== Availability Panel ====================

  /**
   * Open availability panel for a WO
   */
  async openAvailabilityPanel() {
    const availButton = this.page.getByRole('tab', { name: /availability|materials/i });
    if (await availButton.isVisible()) {
      await availButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Check if material availability shows warning
   */
  async expectAvailabilityWarning(materialName: string) {
    const warningIcon = this.page.locator('text=' + materialName).locator('..').locator('[data-testid*="warning"], [title*="Warning"]');
    await expect(warningIcon).toBeVisible();
  }

  /**
   * Get availability status for material
   */
  async getMaterialAvailabilityStatus(materialName: string): Promise<string> {
    const row = this.page.getByRole('row').filter({ has: this.page.getByText(materialName) });
    const statusCell = row.locator('[data-testid*="status"], [title*="status"]');
    return await statusCell.textContent() || '';
  }

  // ==================== Reservations ====================

  /**
   * Open reservation modal for a material
   */
  async openReservationModal(materialName: string) {
    const row = this.page.getByRole('row').filter({ has: this.page.getByText(materialName) });
    const reserveButton = row.getByRole('button', { name: /reserve|allocate|select/i });
    await reserveButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Select license plates in reservation modal
   */
  async selectLicensePlates(lpNumbers: string[]) {
    for (const lpNumber of lpNumbers) {
      const checkbox = this.page.locator(`input[value="${lpNumber}"]`);
      if (await checkbox.isVisible()) {
        await checkbox.click();
      } else {
        const row = this.page.getByRole('row').filter({ has: this.page.getByText(lpNumber) });
        const rowCheckbox = row.locator('input[type="checkbox"]');
        await rowCheckbox.click();
      }
    }
    await this.page.waitForTimeout(300);
  }

  /**
   * Confirm reservations
   */
  async confirmReservations() {
    await this.clickButton(/confirm|reserve|ok/i);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get reserved license plates for material
   */
  async getReservedLicensePlates(materialName: string): Promise<string[]> {
    const row = this.page.getByRole('row').filter({ has: this.page.getByText(materialName) });
    const lpList = row.locator('[data-testid*="reserved"], [data-testid*="lps"]');
    const text = await lpList.textContent() || '';
    return text.split(',').map(s => s.trim()).filter(s => s);
  }

  /**
   * Cancel reservations for material
   */
  async cancelReservation(materialName: string) {
    const row = this.page.getByRole('row').filter({ has: this.page.getByText(materialName) });
    const cancelButton = row.getByRole('button', { name: /cancel|remove|clear/i });
    await cancelButton.click();
    await this.page.waitForTimeout(500);
  }

  // ==================== Materials Table ====================

  /**
   * Check materials table visibility
   */
  async expectMaterialsTable() {
    const table = this.page.locator('[data-testid*="materials"], table').first();
    await expect(table).toBeVisible();
  }

  /**
   * Get material rows from table
   */
  async getMaterialRows(): Promise<number> {
    return await this.page.locator('tbody tr').count();
  }

  /**
   * Get material codes
   */
  async getMaterialCodes(): Promise<string[]> {
    const cells = await this.page.locator('tbody tr [data-testid*="code"], tbody tr td:nth-child(2)').allTextContents();
    return cells;
  }

  /**
   * Get required quantity for material
   */
  async getMaterialRequiredQty(materialName: string): Promise<string> {
    const row = this.page.getByRole('row').filter({ has: this.page.getByText(materialName) });
    const qtyCell = row.locator('[data-testid*="required"], td:nth-child(3)');
    return await qtyCell.textContent() || '';
  }

  /**
   * Get on-hand quantity for material
   */
  async getMaterialOnHandQty(materialName: string): Promise<string> {
    const row = this.page.getByRole('row').filter({ has: this.page.getByText(materialName) });
    const qtyCell = row.locator('[data-testid*="onhand"], td:nth-child(4)');
    return await qtyCell.textContent() || '';
  }

  // ==================== Operations Timeline ====================

  /**
   * Check operations timeline visibility
   */
  async expectOperationsTimeline() {
    const timeline = this.page.locator('[data-testid*="operations"], [data-testid*="timeline"]').first();
    await expect(timeline).toBeVisible();
  }

  /**
   * Get operations count
   */
  async getOperationsCount(): Promise<number> {
    const cards = this.page.locator('[data-testid*="operation"], .operation-card');
    return await cards.count();
  }

  /**
   * Get operation details
   */
  async getOperationDetails(operationName: string): Promise<{ sequence: string; duration: string }> {
    const card = this.page.locator(`text="${operationName}"`).locator('..').first();

    const sequence = await card.locator('[data-testid*="sequence"], .sequence').textContent() || '';
    const duration = await card.locator('[data-testid*="duration"], .duration').textContent() || '';

    return { sequence, duration };
  }

  // ==================== Empty/Error States ====================

  /**
   * Check for empty state
   */
  async expectEmptyState() {
    const emptyMessage = this.page.getByText(/no work orders|empty|create your first/i);
    await expect(emptyMessage).toBeVisible();
  }

  /**
   * Check for error state
   */
  async expectErrorState() {
    const errorMessage = this.page.getByText(/error|failed|unable to load/i);
    await expect(errorMessage).toBeVisible();
  }

  /**
   * Check for loading state
   */
  async expectLoadingState() {
    const spinner = this.page.locator('[role="status"], .loader, .spinner');
    await expect(spinner).toBeVisible();
  }

  // ==================== KPI Cards ====================

  /**
   * Get KPI card value
   */
  async getKPIValue(cardLabel: string): Promise<string> {
    const card = this.page.getByText(cardLabel).locator('..').first();
    const value = card.locator('[data-testid*="value"], .text-lg, .text-2xl').first();
    return await value.textContent() || '';
  }

  // ==================== Status Transitions ====================

  /**
   * Click Plan button for WO
   */
  async clickPlanButton(woNumber: string) {
    const row = this.page.getByRole('row').filter({ has: this.page.getByText(woNumber) });
    const planButton = row.getByRole('button', { name: /plan|draft/i });
    await planButton.click();
  }

  /**
   * Click Release button for WO
   */
  async clickReleaseButton(woNumber: string) {
    const row = this.page.getByRole('row').filter({ has: this.page.getByText(woNumber) });
    const releaseButton = row.getByRole('button', { name: /release|start/i });
    await releaseButton.click();
  }

  /**
   * Click Cancel button for WO
   */
  async clickCancelButton(woNumber: string) {
    const row = this.page.getByRole('row').filter({ has: this.page.getByText(woNumber) });
    const cancelButton = row.getByRole('button', { name: /cancel/i });
    await cancelButton.click();
  }

  /**
   * Confirm cancel in dialog
   */
  async confirmCancel() {
    await this.clickButton(/confirm|cancel|yes/i);
  }

  // ==================== Sorting ====================

  /**
   * Click column header to sort
   */
  async sortByColumn(columnName: string) {
    const header = this.page.getByRole('columnheader', { name: new RegExp(columnName, 'i') });
    await header.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Get sort direction for column
   */
  async getSortDirection(columnName: string): Promise<'asc' | 'desc' | null> {
    const header = this.page.getByRole('columnheader', { name: new RegExp(columnName, 'i') });
    const ariaSort = await header.getAttribute('aria-sort');

    if (ariaSort === 'ascending') return 'asc';
    if (ariaSort === 'descending') return 'desc';
    return null;
  }

  // ==================== Modal/Dialog Helpers ====================

  /**
   * Check if a dialog is open
   */
  async expectDialogOpen(title?: string) {
    const dialog = this.page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();

    if (title) {
      const titleElement = this.page.getByText(title);
      await expect(titleElement).toBeVisible();
    }
  }

  /**
   * Get dialog message
   */
  async getDialogMessage(): Promise<string> {
    const dialog = this.page.locator('[role="dialog"]').first();
    const message = dialog.locator('p, [data-testid*="message"]').first();
    return await message.textContent() || '';
  }
}
