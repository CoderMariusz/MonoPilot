import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  async login(email: string = 'test@forza.com', password: string = 'password') {
    await this.page.goto('/login');
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(/^(?!.*\/login)/);
  }

  async logout() {
    // Look for logout button in topbar or user menu
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL(/.*\/login/);
  }

  async waitForToast(message: string) {
    await expect(this.page.locator('.toast')).toContainText(message);
  }

  async clearToasts() {
    // Dismiss all visible toasts
    const toasts = this.page.locator('.toast');
    const count = await toasts.count();
    for (let i = 0; i < count; i++) {
      await toasts.nth(i).locator('button[aria-label="Close"]').click();
    }
  }

  async waitForLoadingComplete() {
    // Wait for all loading spinners to disappear
    await this.page.waitForSelector('[data-testid="loading"]', { state: 'hidden' });
    await this.page.waitForLoadState('networkidle');
  }

  async waitForModal(title: string) {
    await this.page.waitForSelector(`[data-testid="modal-${title}"]`);
  }

  async closeModal() {
    await this.page.click('[data-testid="modal-close"]');
  }

  async fillFormField(label: string, value: string) {
    const field = this.page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea, label:has-text("${label}") + select`);
    await field.fill(value);
  }

  async selectDropdownOption(dropdownLabel: string, optionText: string) {
    await this.page.click(`label:has-text("${dropdownLabel}") + select`);
    await this.page.selectOption(`label:has-text("${dropdownLabel}") + select`, { label: optionText });
  }

  async clickButton(buttonText: string) {
    await this.page.click(`button:has-text("${buttonText}")`);
  }

  async verifyTableContainsRow(data: Record<string, string>) {
    const table = this.page.locator('table');
    for (const [key, value] of Object.entries(data)) {
      await expect(table.locator(`td:has-text("${value}")`)).toBeVisible();
    }
  }

  async verifyTableRowCount(expectedCount: number) {
    const rows = this.page.locator('table tbody tr');
    await expect(rows).toHaveCount(expectedCount);
  }

  async searchInTable(searchTerm: string) {
    const searchInput = this.page.locator('input[placeholder*="Search"], input[type="search"]');
    await searchInput.fill(searchTerm);
    await this.page.keyboard.press('Enter');
  }

  async clearSearch() {
    const searchInput = this.page.locator('input[placeholder*="Search"], input[type="search"]');
    await searchInput.clear();
    await this.page.keyboard.press('Enter');
  }

  async verifyErrorMessage(message: string) {
    await expect(this.page.locator('.error, .text-red-600')).toContainText(message);
  }

  async verifySuccessMessage(message: string) {
    await expect(this.page.locator('.success, .text-green-600')).toContainText(message);
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }

  async waitForElement(selector: string, timeout: number = 5000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  async waitForElementToBeHidden(selector: string, timeout: number = 5000) {
    await this.page.waitForSelector(selector, { state: 'hidden', timeout });
  }

  async verifyElementVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async verifyElementHidden(selector: string) {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  async verifyElementText(selector: string, text: string) {
    await expect(this.page.locator(selector)).toContainText(text);
  }

  async verifyElementValue(selector: string, value: string) {
    await expect(this.page.locator(selector)).toHaveValue(value);
  }

  async verifyElementChecked(selector: string) {
    await expect(this.page.locator(selector)).toBeChecked();
  }

  async verifyElementUnchecked(selector: string) {
    await expect(this.page.locator(selector)).not.toBeChecked();
  }

  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle');
  }

  async refreshPage() {
    await this.page.reload();
    await this.waitForNavigation();
  }

  async goBack() {
    await this.page.goBack();
    await this.waitForNavigation();
  }

  async verifyURL(url: string) {
    await expect(this.page).toHaveURL(url);
  }

  async verifyTitle(title: string) {
    await expect(this.page).toHaveTitle(title);
  }

  async verifyPageHeading(heading: string) {
    await expect(this.page.locator('h1')).toContainText(heading);
  }

  async verifyBreadcrumb(items: string[]) {
    const breadcrumb = this.page.locator('[data-testid="breadcrumb"]');
    for (const item of items) {
      await expect(breadcrumb.locator(`text="${item}"`)).toBeVisible();
    }
  }

  async verifyTabActive(tabName: string) {
    await expect(this.page.locator(`[data-testid="tab-${tabName}"].active, button:has-text("${tabName}").active`)).toBeVisible();
  }

  async clickTab(tabName: string) {
    await this.page.click(`[data-testid="tab-${tabName}"], button:has-text("${tabName}")`);
  }

  async verifyPagination(currentPage: number, totalPages: number) {
    await expect(this.page.locator('[data-testid="pagination"]')).toContainText(`${currentPage} of ${totalPages}`);
  }

  async clickPaginationNext() {
    await this.page.click('[data-testid="pagination-next"]');
  }

  async clickPaginationPrevious() {
    await this.page.click('[data-testid="pagination-previous"]');
  }

  async verifySorting(column: string, direction: 'asc' | 'desc') {
    const header = this.page.locator(`th:has-text("${column}")`);
    await expect(header).toHaveAttribute('data-sort', direction);
  }

  async clickSort(column: string) {
    await this.page.click(`th:has-text("${column}")`);
  }

  async verifyFilterApplied(filterName: string, value: string) {
    await expect(this.page.locator(`[data-testid="filter-${filterName}"]`)).toContainText(value);
  }

  async clearFilter(filterName: string) {
    await this.page.click(`[data-testid="filter-${filterName}"] button[aria-label="Clear"]`);
  }

  async verifyExportStarted() {
    await expect(this.page.locator('text="Export started"')).toBeVisible();
  }

  async verifyDownloadStarted(filename: string) {
    // This is a basic check - actual download verification would need more complex setup
    await expect(this.page.locator(`text="${filename}"`)).toBeVisible();
  }

  // Navigation methods
  async navigateToProduction() {
    await this.page.goto('/production');
    await this.waitForNavigation();
  }

  async navigateToBOM() {
    await this.page.goto('/technical/bom');
    await this.waitForNavigation();
  }

  async navigateToPlanning() {
    await this.page.goto('/planning');
    await this.waitForNavigation();
  }

  async navigateToWarehouse() {
    await this.page.goto('/warehouse');
    await this.waitForNavigation();
  }

  async navigateToSettings() {
    await this.page.goto('/settings');
    await this.waitForNavigation();
  }

  async navigateToAdmin() {
    await this.page.goto('/admin');
    await this.waitForNavigation();
  }

  // Loading state methods
  async expectLoadingVisible() {
    await expect(this.page.locator('[data-testid="loading"], .loading, .spinner')).toBeVisible();
  }

  async expectLoadingHidden() {
    await expect(this.page.locator('[data-testid="loading"], .loading, .spinner')).toBeHidden();
  }

  // Error handling methods
  async verifyErrorMessage(message: string) {
    await expect(this.page.locator('.error, .text-red-600, .toast-error')).toContainText(message);
  }

  // Cleanup methods
  async cleanupTestStockMove(id: string) {
    try {
      // Navigate to stock moves if not already there
      if (!this.page.url().includes('/warehouse')) {
        await this.navigateToWarehouse();
      }
      
      // Find and delete the stock move
      const row = this.page.locator(`tr:has-text("${id}")`);
      if (await row.count() > 0) {
        await row.locator('button:has-text("Delete")').click();
        await this.page.click('button:has-text("Confirm"), button:has-text("Delete")');
        await this.waitForToast('Stock move deleted successfully');
      }
    } catch (error) {
      console.warn(`Failed to cleanup stock move ${id}:`, error);
    }
  }

  async cleanupTestGRN(id: string) {
    try {
      // Navigate to GRN if not already there
      if (!this.page.url().includes('/warehouse')) {
        await this.navigateToWarehouse();
      }
      
      // Find and delete the GRN
      const row = this.page.locator(`tr:has-text("${id}")`);
      if (await row.count() > 0) {
        await row.locator('button:has-text("Delete")').click();
        await this.page.click('button:has-text("Confirm"), button:has-text("Delete")');
        await this.waitForToast('GRN deleted successfully');
      }
    } catch (error) {
      console.warn(`Failed to cleanup GRN ${id}:`, error);
    }
  }

  async cleanupTestLP(id: string) {
    try {
      // Navigate to LP operations if not already there
      if (!this.page.url().includes('/warehouse')) {
        await this.navigateToWarehouse();
      }
      
      // Find and delete the LP
      const row = this.page.locator(`tr:has-text("${id}")`);
      if (await row.count() > 0) {
        await row.locator('button:has-text("Delete")').click();
        await this.page.click('button:has-text("Confirm"), button:has-text("Delete")');
        await this.waitForToast('License plate deleted successfully');
      }
    } catch (error) {
      console.warn(`Failed to cleanup LP ${id}:`, error);
    }
  }

  async cleanupTestWorkOrder(id: string) {
    try {
      // Navigate to work orders if not already there
      if (!this.page.url().includes('/planning')) {
        await this.navigateToPlanning();
      }
      
      // Find and delete the work order
      const row = this.page.locator(`tr:has-text("${id}")`);
      if (await row.count() > 0) {
        await row.locator('button:has-text("Delete")').click();
        await this.page.click('button:has-text("Confirm"), button:has-text("Delete")');
        await this.waitForToast('Work order deleted successfully');
      }
    } catch (error) {
      console.warn(`Failed to cleanup work order ${id}:`, error);
    }
  }

  async cleanupTestPO(id: string) {
    try {
      // Navigate to purchase orders if not already there
      if (!this.page.url().includes('/planning')) {
        await this.navigateToPlanning();
      }
      
      // Find and delete the purchase order
      const row = this.page.locator(`tr:has-text("${id}")`);
      if (await row.count() > 0) {
        await row.locator('button:has-text("Delete")').click();
        await this.page.click('button:has-text("Confirm"), button:has-text("Delete")');
        await this.waitForToast('Purchase order deleted successfully');
      }
    } catch (error) {
      console.warn(`Failed to cleanup purchase order ${id}:`, error);
    }
  }

  async cleanupTestTO(id: string) {
    try {
      // Navigate to transfer orders if not already there
      if (!this.page.url().includes('/planning')) {
        await this.navigateToPlanning();
      }
      
      // Find and delete the transfer order
      const row = this.page.locator(`tr:has-text("${id}")`);
      if (await row.count() > 0) {
        await row.locator('button:has-text("Delete")').click();
        await this.page.click('button:has-text("Confirm"), button:has-text("Delete")');
        await this.waitForToast('Transfer order deleted successfully');
      }
    } catch (error) {
      console.warn(`Failed to cleanup transfer order ${id}:`, error);
    }
  }
}
