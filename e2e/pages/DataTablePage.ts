/**
 * Data Table Page Object
 *
 * Reusable page object for pages with ShadCN DataTable component.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DataTablePage extends BasePage {
  // Table selectors
  private readonly table = 'table';
  private readonly tableHead = 'table thead';
  private readonly tableBody = 'table tbody';
  private readonly tableRow = 'table tbody tr';
  private readonly emptyState = '[data-testid="table-empty"], .empty-state';

  // Toolbar selectors
  private readonly searchInput = 'input[placeholder*="Search"], input[placeholder*="Filter"]';
  private readonly createButton = 'button:has-text("Create"), button:has-text("Add"), button:has-text("New")';
  private readonly exportButton = 'button:has-text("Export")';
  private readonly filterButton = 'button:has-text("Filter")';

  // Pagination selectors
  private readonly pagination = '[data-testid="pagination"], nav[aria-label="Pagination navigation"], div[aria-label="Pagination navigation"]';
  private readonly nextPage = 'button[aria-label="Next page"], button:has-text("Next")';
  private readonly prevPage = 'button[aria-label="Previous page"], button:has-text("Previous")';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Search & Filter ====================

  /**
   * Search in the table
   */
  async search(query: string) {
    await this.page.fill(this.searchInput, query);
    await this.page.waitForTimeout(300); // Debounce
    await this.waitForPageLoad();
  }

  /**
   * Clear search
   */
  async clearSearch() {
    await this.page.fill(this.searchInput, '');
    await this.waitForPageLoad();
  }

  /**
   * Click filter button (if it exists)
   * Some tables have always-visible filters, so this is optional
   */
  async openFilters() {
    const filterButton = this.page.locator(this.filterButton);
    // Only click if the button exists and is visible
    if ((await filterButton.count()) > 0) {
      await filterButton.click();
    }
    // If no filter button exists, filters are already visible (like ShadCN Select dropdowns)
  }

  // ==================== Table Data ====================

  /**
   * Get all table rows
   */
  getRows(): Locator {
    return this.page.locator(this.tableRow);
  }

  /**
   * Get row count
   */
  async getRowCount(): Promise<number> {
    const rows = this.getRows();
    const count = await rows.count();
    // Check if it's the empty state row
    if (count === 1) {
      const isEmpty = await this.page.locator(this.emptyState).isVisible();
      return isEmpty ? 0 : 1;
    }
    return count;
  }

  /**
   * Get row by index (0-based)
   */
  getRowByIndex(index: number): Locator {
    return this.getRows().nth(index);
  }

  /**
   * Get row containing specific text
   */
  getRowByText(text: string): Locator {
    return this.getRows().filter({ hasText: text }).first();
  }

  /**
   * Get cell value from a specific row and column
   */
  async getCellValue(rowIndex: number, columnIndex: number): Promise<string> {
    const cell = this.getRowByIndex(rowIndex).locator('td').nth(columnIndex);
    return await cell.textContent() || '';
  }

  /**
   * Click on a row
   */
  async clickRow(rowIndex: number) {
    await this.getRowByIndex(rowIndex).click();
  }

  /**
   * Click on a row containing text
   */
  async clickRowByText(text: string) {
    await this.getRowByText(text).click();
  }

  // ==================== Row Actions ====================

  /**
   * Get actions menu for a row
   */
  getRowActions(rowIndex: number): Locator {
    return this.getRowByIndex(rowIndex).locator('button[aria-label="Actions"], button:has-text("...")');
  }

  /**
   * Open row actions menu
   */
  async openRowActions(rowIndex: number) {
    await this.getRowActions(rowIndex).click();
  }

  /**
   * Click action in row menu
   */
  async clickRowAction(rowIndex: number, actionName: string) {
    await this.openRowActions(rowIndex);
    await this.page.click(`[role="menuitem"]:has-text("${actionName}")`);
  }

  /**
   * Edit row (via actions menu)
   */
  async editRow(rowIndex: number) {
    await this.clickRowAction(rowIndex, 'Edit');
  }

  /**
   * Delete row (via actions menu)
   */
  async deleteRow(rowIndex: number) {
    await this.clickRowAction(rowIndex, 'Delete');
  }

  // ==================== Create ====================

  /**
   * Click create/add button
   */
  async clickCreate() {
    await this.page.click(this.createButton);
  }

  // ==================== Pagination ====================

  /**
   * Go to next page
   */
  async nextPage() {
    await this.page.click(this.nextPage);
    await this.waitForPageLoad();
  }

  /**
   * Go to previous page
   */
  async prevPage() {
    await this.page.click(this.prevPage);
    await this.waitForPageLoad();
  }

  /**
   * Check if has next page
   */
  async hasNextPage(): Promise<boolean> {
    const button = this.page.locator(this.nextPage);
    // Check if button exists first
    if ((await button.count()) === 0) {
      return false;
    }
    return !(await button.isDisabled());
  }

  /**
   * Check if has previous page
   */
  async hasPrevPage(): Promise<boolean> {
    const button = this.page.locator(this.prevPage);
    return !(await button.isDisabled());
  }

  // ==================== Assertions ====================

  /**
   * Assert table is visible
   */
  async expectTableVisible() {
    await expect(this.page.locator(this.table)).toBeVisible();
  }

  /**
   * Assert empty state is visible
   */
  async expectEmptyState() {
    await expect(this.page.locator(this.emptyState)).toBeVisible();
  }

  /**
   * Assert row count
   */
  async expectRowCount(count: number) {
    const actual = await this.getRowCount();
    expect(actual).toBe(count);
  }

  /**
   * Assert row count greater than
   */
  async expectRowCountGreaterThan(count: number) {
    const actual = await this.getRowCount();
    expect(actual).toBeGreaterThan(count);
  }

  /**
   * Assert row contains text (with extended timeout for page updates)
   */
  async expectRowWithText(text: string) {
    await expect(this.getRowByText(text)).toBeVisible({ timeout: 15000 });
  }

  /**
   * Assert no row contains text
   */
  async expectNoRowWithText(text: string) {
    await expect(this.getRowByText(text)).not.toBeVisible();
  }

  // ==================== Sorting ====================

  /**
   * Click column header to sort
   */
  async sortByColumn(columnName: string) {
    await this.page.click(`${this.tableHead} th:has-text("${columnName}")`);
    await this.waitForPageLoad();
  }

  // ==================== Selection ====================

  /**
   * Select all rows
   */
  async selectAll() {
    await this.page.click(`${this.tableHead} input[type="checkbox"]`);
  }

  /**
   * Select row by index
   */
  async selectRow(rowIndex: number) {
    await this.getRowByIndex(rowIndex).locator('input[type="checkbox"]').check();
  }

  /**
   * Get selected row count
   */
  async getSelectedCount(): Promise<number> {
    return await this.page.locator(`${this.tableRow} input[type="checkbox"]:checked`).count();
  }
}
