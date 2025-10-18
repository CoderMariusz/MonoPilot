import { Page, expect } from '@playwright/test';

export class AssertionHelpers {
  constructor(private page: Page) {}

  async expectToastMessage(message: string) {
    await expect(this.page.locator('.toast')).toContainText(message);
  }

  async expectTableContainsRow(data: Record<string, string>) {
    const table = this.page.locator('table');
    for (const [key, value] of Object.entries(data)) {
      await expect(table.locator(`td:has-text("${value}")`)).toBeVisible();
    }
  }

  async expectModalOpen(title: string) {
    await expect(this.page.locator(`[data-testid="modal-${title}"], .modal:has-text("${title}")`)).toBeVisible();
  }

  async expectModalClosed() {
    await expect(this.page.locator('.modal')).toBeHidden();
  }

  async expectFieldVisible(label: string) {
    const field = this.page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea, label:has-text("${label}") + select`);
    await expect(field).toBeVisible();
  }

  async expectFieldHidden(label: string) {
    const field = this.page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea, label:has-text("${label}") + select`);
    await expect(field).toBeHidden();
  }

  async expectFieldValue(label: string, value: string) {
    const field = this.page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea, label:has-text("${label}") + select`);
    await expect(field).toHaveValue(value);
  }

  async expectFieldEmpty(label: string) {
    const field = this.page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea, label:has-text("${label}") + select`);
    await expect(field).toHaveValue('');
  }

  async expectFieldRequired(label: string) {
    const field = this.page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea, label:has-text("${label}") + select`);
    await expect(field).toHaveAttribute('required');
  }

  async expectFieldOptional(label: string) {
    const field = this.page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea, label:has-text("${label}") + select`);
    await expect(field).not.toHaveAttribute('required');
  }

  async expectFieldDisabled(label: string) {
    const field = this.page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea, label:has-text("${label}") + select`);
    await expect(field).toBeDisabled();
  }

  async expectFieldEnabled(label: string) {
    const field = this.page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea, label:has-text("${label}") + select`);
    await expect(field).toBeEnabled();
  }

  async expectFieldError(label: string, errorMessage: string) {
    const field = this.page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea, label:has-text("${label}") + select`);
    const errorElement = field.locator('..').locator('.error, .text-red-600');
    await expect(errorElement).toContainText(errorMessage);
  }

  async expectFieldNoError(label: string) {
    const field = this.page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea, label:has-text("${label}") + select`);
    const errorElement = field.locator('..').locator('.error, .text-red-600');
    await expect(errorElement).toBeHidden();
  }

  async expectButtonVisible(buttonText: string) {
    await expect(this.page.locator(`button:has-text("${buttonText}")`)).toBeVisible();
  }

  async expectButtonHidden(buttonText: string) {
    await expect(this.page.locator(`button:has-text("${buttonText}")`)).toBeHidden();
  }

  async expectButtonDisabled(buttonText: string) {
    await expect(this.page.locator(`button:has-text("${buttonText}")`)).toBeDisabled();
  }

  async expectButtonEnabled(buttonText: string) {
    await expect(this.page.locator(`button:has-text("${buttonText}")`)).toBeEnabled();
  }

  async expectButtonLoading(buttonText: string) {
    const button = this.page.locator(`button:has-text("${buttonText}")`);
    await expect(button.locator('[data-testid="loading-spinner"]')).toBeVisible();
  }

  async expectButtonNotLoading(buttonText: string) {
    const button = this.page.locator(`button:has-text("${buttonText}")`);
    await expect(button.locator('[data-testid="loading-spinner"]')).toBeHidden();
  }

  async expectTableVisible() {
    await expect(this.page.locator('table')).toBeVisible();
  }

  async expectTableHidden() {
    await expect(this.page.locator('table')).toBeHidden();
  }

  async expectTableRowCount(expectedCount: number) {
    const rows = this.page.locator('table tbody tr');
    await expect(rows).toHaveCount(expectedCount);
  }

  async expectTableRowVisible(rowData: Record<string, string>) {
    const table = this.page.locator('table');
    for (const [key, value] of Object.entries(rowData)) {
      await expect(table.locator(`td:has-text("${value}")`)).toBeVisible();
    }
  }

  async expectTableRowHidden(rowData: Record<string, string>) {
    const table = this.page.locator('table');
    for (const [key, value] of Object.entries(rowData)) {
      await expect(table.locator(`td:has-text("${value}")`)).toBeHidden();
    }
  }

  async expectTableColumnVisible(columnName: string) {
    await expect(this.page.locator(`th:has-text("${columnName}")`)).toBeVisible();
  }

  async expectTableColumnHidden(columnName: string) {
    await expect(this.page.locator(`th:has-text("${columnName}")`)).toBeHidden();
  }

  async expectTableSorted(columnName: string, direction: 'asc' | 'desc') {
    const header = this.page.locator(`th:has-text("${columnName}")`);
    await expect(header).toHaveAttribute('data-sort', direction);
  }

  async expectTableNotSorted(columnName: string) {
    const header = this.page.locator(`th:has-text("${columnName}")`);
    await expect(header).not.toHaveAttribute('data-sort');
  }

  async expectPaginationVisible() {
    await expect(this.page.locator('[data-testid="pagination"]')).toBeVisible();
  }

  async expectPaginationHidden() {
    await expect(this.page.locator('[data-testid="pagination"]')).toBeHidden();
  }

  async expectPaginationPage(currentPage: number) {
    await expect(this.page.locator('[data-testid="pagination-current"]')).toContainText(currentPage.toString());
  }

  async expectPaginationTotal(totalPages: number) {
    await expect(this.page.locator('[data-testid="pagination-total"]')).toContainText(totalPages.toString());
  }

  async expectPaginationNextEnabled() {
    await expect(this.page.locator('[data-testid="pagination-next"]')).toBeEnabled();
  }

  async expectPaginationNextDisabled() {
    await expect(this.page.locator('[data-testid="pagination-next"]')).toBeDisabled();
  }

  async expectPaginationPreviousEnabled() {
    await expect(this.page.locator('[data-testid="pagination-previous"]')).toBeEnabled();
  }

  async expectPaginationPreviousDisabled() {
    await expect(this.page.locator('[data-testid="pagination-previous"]')).toBeDisabled();
  }

  async expectSearchVisible() {
    await expect(this.page.locator('[data-testid="search-input"]')).toBeVisible();
  }

  async expectSearchHidden() {
    await expect(this.page.locator('[data-testid="search-input"]')).toBeHidden();
  }

  async expectSearchValue(value: string) {
    await expect(this.page.locator('[data-testid="search-input"]')).toHaveValue(value);
  }

  async expectSearchEmpty() {
    await expect(this.page.locator('[data-testid="search-input"]')).toHaveValue('');
  }

  async expectFilterVisible(filterName: string) {
    await expect(this.page.locator(`[data-testid="filter-${filterName}"]`)).toBeVisible();
  }

  async expectFilterHidden(filterName: string) {
    await expect(this.page.locator(`[data-testid="filter-${filterName}"]`)).toBeHidden();
  }

  async expectFilterValue(filterName: string, value: string) {
    await expect(this.page.locator(`[data-testid="filter-${filterName}"]`)).toContainText(value);
  }

  async expectFilterEmpty(filterName: string) {
    await expect(this.page.locator(`[data-testid="filter-${filterName}"]`)).toContainText('');
  }

  async expectTabVisible(tabName: string) {
    await expect(this.page.locator(`[data-testid="tab-${tabName}"], button:has-text("${tabName}")`)).toBeVisible();
  }

  async expectTabHidden(tabName: string) {
    await expect(this.page.locator(`[data-testid="tab-${tabName}"], button:has-text("${tabName}")`)).toBeHidden();
  }

  async expectTabActive(tabName: string) {
    await expect(this.page.locator(`[data-testid="tab-${tabName}"].active, button:has-text("${tabName}").active`)).toBeVisible();
  }

  async expectTabInactive(tabName: string) {
    await expect(this.page.locator(`[data-testid="tab-${tabName}"].active, button:has-text("${tabName}").active`)).toBeHidden();
  }

  async expectLoadingVisible() {
    await expect(this.page.locator('[data-testid="loading"]')).toBeVisible();
  }

  async expectLoadingHidden() {
    await expect(this.page.locator('[data-testid="loading"]')).toBeHidden();
  }

  async expectErrorMessage(message: string) {
    await expect(this.page.locator('.error, .text-red-600')).toContainText(message);
  }

  async expectSuccessMessage(message: string) {
    await expect(this.page.locator('.success, .text-green-600')).toContainText(message);
  }

  async expectWarningMessage(message: string) {
    await expect(this.page.locator('.warning, .text-yellow-600')).toContainText(message);
  }

  async expectInfoMessage(message: string) {
    await expect(this.page.locator('.info, .text-blue-600')).toContainText(message);
  }

  async expectNoMessages() {
    await expect(this.page.locator('.error, .success, .warning, .info')).toBeHidden();
  }

  async expectPageTitle(title: string) {
    await expect(this.page).toHaveTitle(title);
  }

  async expectPageHeading(heading: string) {
    await expect(this.page.locator('h1')).toContainText(heading);
  }

  async expectPageURL(url: string) {
    await expect(this.page).toHaveURL(url);
  }

  async expectPageURLContains(urlPart: string) {
    await expect(this.page).toHaveURL(new RegExp(urlPart));
  }

  async expectElementVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectElementHidden(selector: string) {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  async expectElementText(selector: string, text: string) {
    await expect(this.page.locator(selector)).toContainText(text);
  }

  async expectElementValue(selector: string, value: string) {
    await expect(this.page.locator(selector)).toHaveValue(value);
  }

  async expectElementChecked(selector: string) {
    await expect(this.page.locator(selector)).toBeChecked();
  }

  async expectElementUnchecked(selector: string) {
    await expect(this.page.locator(selector)).not.toBeChecked();
  }

  async expectElementSelected(selector: string) {
    await expect(this.page.locator(selector)).toBeChecked();
  }

  async expectElementNotSelected(selector: string) {
    await expect(this.page.locator(selector)).not.toBeChecked();
  }

  async expectElementAttribute(selector: string, attribute: string, value: string) {
    await expect(this.page.locator(selector)).toHaveAttribute(attribute, value);
  }

  async expectElementNotAttribute(selector: string, attribute: string, value: string) {
    await expect(this.page.locator(selector)).not.toHaveAttribute(attribute, value);
  }

  async expectElementClass(selector: string, className: string) {
    await expect(this.page.locator(selector)).toHaveClass(new RegExp(className));
  }

  async expectElementNotClass(selector: string, className: string) {
    await expect(this.page.locator(selector)).not.toHaveClass(new RegExp(className));
  }

  async expectElementCount(selector: string, count: number) {
    await expect(this.page.locator(selector)).toHaveCount(count);
  }

  async expectElementGreaterThan(selector: string, count: number) {
    const elements = this.page.locator(selector);
    const actualCount = await elements.count();
    if (actualCount <= count) {
      throw new Error(`Expected more than ${count} elements, but found ${actualCount}`);
    }
  }

  async expectElementLessThan(selector: string, count: number) {
    const elements = this.page.locator(selector);
    const actualCount = await elements.count();
    if (actualCount >= count) {
      throw new Error(`Expected less than ${count} elements, but found ${actualCount}`);
    }
  }

  async expectElementAtLeast(selector: string, count: number) {
    const elements = this.page.locator(selector);
    const actualCount = await elements.count();
    if (actualCount < count) {
      throw new Error(`Expected at least ${count} elements, but found ${actualCount}`);
    }
  }

  async expectElementAtMost(selector: string, count: number) {
    const elements = this.page.locator(selector);
    const actualCount = await elements.count();
    if (actualCount > count) {
      throw new Error(`Expected at most ${count} elements, but found ${actualCount}`);
    }
  }
}
