/**
 * Products Page Object
 *
 * Encapsulates all interactions with /technical/products page
 * including list, create, edit, search, filter, and detail views.
 *
 * Updated: 2026-01-24 - Fixed ShadCN Select handling for Radix UI portals
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { DataTablePage } from './DataTablePage';

export interface ProductData {
  code: string;
  name: string;
  description?: string;
  type: 'RAW' | 'WIP' | 'FIN' | 'PKG';
  base_uom: string;
  cost_per_unit?: number;
  shelf_life_days?: number;
  is_perishable?: boolean;
  expiry_policy?: 'fifo' | 'fefo' | 'rolling' | 'none';
}

export class ProductsPage extends BasePage {
  // Page sections
  private readonly dataTable = new DataTablePage(this.page);

  // Selectors for create/edit form
  private readonly formFields = {
    code: 'input#code',
    name: 'input#name',
    description: 'textarea#description',
    costPerUnit: 'input#cost_per_unit',
    isPerishable: 'input#is_perishable',
    shelfLifeDays: 'input#shelf_life_days',
  };

  // Modal selector - ProductFormModal uses custom fixed div
  private readonly modalSelector = 'div.fixed.inset-0.bg-black\\/50';

  constructor(page: Page) {
    super(page);
  }

  // ==================== ShadCN Select Helper ====================

  /**
   * Click a ShadCN Select trigger and select an option
   * ShadCN/Radix Select renders options in a portal at body level
   *
   * @param triggerLocator - Locator for the SelectTrigger button
   * @param optionText - Text to match in the option (partial match)
   */
  private async selectShadcnOption(triggerLocator: Locator, optionText: string): Promise<void> {
    // Click the trigger to open dropdown
    await triggerLocator.waitFor({ state: 'visible', timeout: 10000 });
    await triggerLocator.click();

    // Wait for listbox to appear (portal renders at body level)
    await this.page.waitForSelector('[role="listbox"]', {
      state: 'visible',
      timeout: 10000
    });

    // Wait a moment for options to render (they may load asynchronously)
    await this.page.waitForTimeout(300);

    // Find the option by text content - Radix uses role="option"
    const option = this.page.locator('[role="listbox"] [role="option"]')
      .filter({ hasText: new RegExp(optionText, 'i') })
      .first();

    // If option not found immediately, wait and retry
    try {
      await option.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // Options might not have loaded - dump what's available for debugging
      const listbox = this.page.locator('[role="listbox"]');
      const optionCount = await listbox.locator('[role="option"]').count();
      console.error(`selectShadcnOption: Looking for "${optionText}", found ${optionCount} options`);
      throw new Error(`Option "${optionText}" not found in select dropdown. Found ${optionCount} options.`);
    }

    await option.click();

    // Wait for dropdown to close
    await this.page.waitForTimeout(150);
  }

  /**
   * Find a Select trigger by its label text (for the Type field labeled "Type")
   */
  private getSelectTriggerByLabel(labelText: string): Locator {
    // Find the label, then get the parent container, then find the select trigger
    return this.page.locator(`div:has(> label:has-text("${labelText}")) button[role="combobox"]`).first();
  }

  // ==================== Navigation ====================

  /**
   * Navigate to products page
   */
  async goto() {
    await super.goto('/technical/products');
  }

  /**
   * Navigate to product detail page
   */
  async gotoProductDetail(productId: string) {
    await super.goto(`/technical/products/${productId}`);
  }

  // ==================== Page Layout ====================

  /**
   * Assert page header is visible
   */
  async expectPageHeader() {
    const heading = this.page.getByRole('heading', { name: /products/i });
    await expect(heading).toBeVisible();
  }

  /**
   * Assert page description is visible
   */
  async expectPageDescription() {
    const description = this.page.getByText(/manage your product catalog|raw materials|finished goods/i);
    await expect(description).toBeVisible();
  }

  /**
   * Assert table is displayed with correct columns
   */
  async expectTableWithColumns(columns: string[]) {
    await this.dataTable.expectTableVisible();
    for (const column of columns) {
      const header = this.page.locator(`thead >> text=${column}`);
      await expect(header).toBeVisible();
    }
  }

  /**
   * Assert "Add Product" button is visible
   */
  async expectAddProductButton() {
    const button = this.page.getByRole('button', { name: /add product|create product/i });
    await expect(button).toBeVisible();
  }

  /**
   * Assert "Add Product" button is disabled
   */
  async expectAddProductButtonDisabled() {
    const button = this.page.getByRole('button', { name: /add product|create product/i });
    await expect(button).toBeDisabled();
  }

  // ==================== Search & Filter ====================

  /**
   * Search products by code
   */
  async searchByCode(code: string) {
    await this.dataTable.search(code);
  }

  /**
   * Search products by name
   */
  async searchByName(name: string) {
    await this.dataTable.search(name);
  }

  /**
   * Clear search
   */
  async clearSearch() {
    await this.dataTable.clearSearch();
  }

  /**
   * Filter by product type
   */
  async filterByProductType(type: 'RAW' | 'WIP' | 'FIN' | 'PKG') {
    // Map the test values to UI values
    const typeMap: Record<string, string> = {
      'RAW': 'Raw Material',
      'WIP': 'Work in Progress',
      'FIN': 'Finished Goods',
      'PKG': 'Packaging'
    };

    // Click the Type filter Select trigger (uses aria-label from ProductFilters)
    const typeTrigger = this.page.locator('[aria-label="Filter by product type"]');
    await this.selectShadcnOption(typeTrigger, typeMap[type]);
    await this.waitForPageLoad();
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: 'Active' | 'Inactive') {
    // Click the Status filter Select trigger
    const statusTrigger = this.page.locator('[aria-label="Filter by status"]');
    await this.selectShadcnOption(statusTrigger, status);
    await this.waitForPageLoad();
  }

  // ==================== Table Interactions ====================

  /**
   * Get row count
   */
  async getRowCount(): Promise<number> {
    return this.dataTable.getRowCount();
  }

  /**
   * Get rows by product type
   */
  async expectRowWithProduct(productCode: string) {
    await this.dataTable.expectRowWithText(productCode);
  }

  /**
   * Click row by text (product code or name)
   */
  async clickProduct(text: string) {
    await this.dataTable.clickRowByText(text);
    await this.waitForPageLoad();
  }

  /**
   * Get pagination info
   */
  async hasNextPage(): Promise<boolean> {
    return this.dataTable.hasNextPage();
  }

  /**
   * Go to next page
   */
  async nextPage() {
    await this.dataTable.nextPage();
  }

  // ==================== Create Product ====================

  /**
   * Click "Add Product" button to open create modal
   */
  async clickAddProduct() {
    // The main page button says "+ Create Product"
    const button = this.page.getByRole('button', { name: /create product/i }).first();
    await button.click();
    await this.page.waitForTimeout(500); // Wait for state update
    await this.waitForModal();
    // Modal should now be open - content loads asynchronously
  }

  /**
   * Assert create modal is open
   */
  async expectCreateModalOpen() {
    // Check for modal container - either role="dialog" or the custom fixed div
    const modal = this.page.locator('div.fixed.inset-0.bg-black\\/50, [role="dialog"]').first();
    await expect(modal).toBeVisible();
    // Check for modal title - "Create New Product" is the heading
    const title = this.page.getByText(/create new product/i);
    await expect(title).toBeVisible();
  }

  /**
   * Fill product form
   */
  async fillProductForm(data: ProductData) {
    // Wait for form to be ready - ProductFormModal loads data via useEffect
    // First, wait for the modal content header to appear
    try {
      await this.page.getByText(/Create New Product|Edit Product/i).waitFor({ state: 'visible', timeout: 30000 });
    } catch (e) {
      console.error('Modal title not found');
      throw e;
    }

    // Now wait for the form header
    await this.page.getByText(/Basic Information/i).waitFor({ state: 'visible', timeout: 30000 });

    // Wait for product types to load (they load via API) - check for "Loading types..." text to disappear
    try {
      // Wait for loading to finish - ProductFormModal shows "Loading types..." while fetching
      await this.page.waitForFunction(() => {
        const loadingText = document.body.textContent;
        return !loadingText?.includes('Loading types...');
      }, { timeout: 15000 });
    } catch {
      // If it times out, proceed anyway
    }

    // Finally wait for the code input
    await this.page.locator('input#code').waitFor({ state: 'visible', timeout: 10000 });

    // Fill required fields
    const codeInput = this.page.locator('input#code');
    await codeInput.fill(data.code);

    const nameInput = this.page.locator('input#name');
    await nameInput.fill(data.name);

    if (data.description) {
      const descInput = this.page.locator('textarea#description');
      await descInput.fill(data.description);
    }

    // Select product type - use ShadCN Select component
    // The form shows product_type_id as a Select with options like "Raw Material (RM)"
    const typeMap: Record<string, string> = {
      'RAW': 'Raw Material',
      'WIP': 'Work in Progress',
      'FIN': 'Finished Goods',
      'PKG': 'Packaging',
      'RM': 'Raw Material',
      'FG': 'Finished Goods',
    };
    const typeDisplayName = typeMap[data.type] || data.type;

    // Find the Type select - it's the first VISIBLE combobox button in the modal
    // ShadCN Select creates TWO elements: a visible button and a hidden combobox
    // We need the visible button (SelectTrigger) which has text content
    const modal = this.page.locator('div.fixed.inset-0');

    // Get visible comboboxes only (the SelectTrigger buttons have visible text)
    const typeSection = modal.locator('div.space-y-2:has-text("Type"):has(button[role="combobox"])').first();
    const typeSelectTrigger = typeSection.locator('button[role="combobox"]').first();

    // Wait for the type select to be ready
    await typeSelectTrigger.waitFor({ state: 'visible', timeout: 15000 });

    // Select product type - use the helper which handles Radix portal
    await this.selectShadcnOption(typeSelectTrigger, typeDisplayName);

    // Find UOM select in the same way
    const uomSection = modal.locator('div.space-y-2:has-text("Unit of Measure"):has(button[role="combobox"])').first();
    const uomSelectTrigger = uomSection.locator('button[role="combobox"]').first();

    // Select base UOM
    await this.selectShadcnOption(uomSelectTrigger, data.base_uom);

    // Fill optional fields
    if (data.cost_per_unit !== undefined) {
      const costInput = this.page.locator('input#cost_per_unit');
      await costInput.fill(data.cost_per_unit.toString());
    }

    // Shelf life is optional - only fill if provided
    if (data.shelf_life_days !== undefined) {
      const shelfLifeInput = this.page.locator('input#shelf_life_days');
      await shelfLifeInput.fill(data.shelf_life_days.toString());
    }
  }

  /**
   * Submit create product form
   */
  async submitCreateProduct() {
    // Click the "Create Product" button in the modal footer
    // The modal is a div.fixed.inset-0 with a white bg-white modal inside
    const modal = this.page.locator('div.fixed.inset-0.bg-black\\/50').first();
    const submitButton = modal.locator('button:has-text("Create Product")').last();
    await submitButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Create product with data
   */
  async createProduct(data: ProductData) {
    await this.clickAddProduct();
    await this.fillProductForm(data);
    await this.submitCreateProduct();
    await this.expectSuccessToast(/created|success/i);
  }

  /**
   * Assert success message after create
   */
  async expectCreateSuccess() {
    await this.expectSuccessToast(/created|success/i);
  }

  /**
   * Assert product appears in list after creation
   */
  async expectProductInList(productCode: string) {
    await this.expectRowWithProduct(productCode);
  }

  /**
   * Assert validation error for field
   */
  async expectValidationError(fieldName: string, message?: string | RegExp) {
    const error = this.page.locator(
      `[data-field="${fieldName}"] .error-message, #${fieldName}-error`,
    );
    await expect(error).toBeVisible();
    if (message) {
      await expect(error).toContainText(message);
    }
  }

  /**
   * Assert duplicate code error
   */
  async expectDuplicateCodeError() {
    const error = this.page.locator('[role="alert"], .error-message');
    await expect(error).toContainText(/must be unique|already exists|duplicate/i);
  }

  // ==================== Edit Product ====================

  /**
   * Click edit button for first product
   * Products table doesn't have inline edit - need to go to detail page first
   */
  async clickEditFirstProduct() {
    // Click first row to go to detail page
    await this.dataTable.clickRow(0);
    await this.waitForPageLoad();

    // Wait for detail page to load, then click Edit button
    await this.page.waitForSelector('button:has-text("Edit")', {
      state: 'visible',
      timeout: 15000
    });
    await this.page.click('button:has-text("Edit")');

    // Wait for edit modal to open
    await this.waitForModal();
  }

  /**
   * Open edit modal for product by row index
   */
  async clickEditProduct(rowIndex: number) {
    // Click row to go to detail page
    await this.dataTable.clickRow(rowIndex);
    await this.waitForPageLoad();

    // Click Edit button on detail page
    await this.page.click('button:has-text("Edit")');
    await this.waitForModal();
  }

  /**
   * Assert edit modal is open (not drawer - ProductFormModal is used)
   */
  async expectEditDrawerOpen() {
    // ProductFormModal is a fixed div, so check for it
    const modal = this.page.locator('div.fixed.inset-0.bg-black\\/50, [role="dialog"]').first();
    await expect(modal).toBeVisible();
    // Check for "Edit Product:" title
    const title = this.page.getByText(/edit product:/i);
    await expect(title).toBeVisible();
  }

  /**
   * Update product field in edit modal
   */
  async updateProductField(fieldName: keyof ProductData, value: string) {
    // Use id selectors which are reliable
    const field = this.page.locator(`input#${fieldName}, textarea#${fieldName}`);
    await field.clear();
    await field.fill(value);
  }

  /**
   * Update product name
   */
  async updateProductName(newName: string) {
    await this.updateProductField('name', newName);
  }

  /**
   * Update product status to inactive via ShadCN Select
   */
  async setProductStatusInactive() {
    // Status is a ShadCN Select, not a checkbox
    // Find the Status select in the modal
    const modal = this.page.locator('div.fixed.inset-0');
    const statusSection = modal.locator('div.space-y-2:has-text("Status"):has(button[role="combobox"])').first();
    const statusTrigger = statusSection.locator('button[role="combobox"]').first();

    await this.selectShadcnOption(statusTrigger, 'Inactive');
  }

  /**
   * Submit edit product form
   */
  async submitEditProduct() {
    // Click the "Update Product" button in the modal footer
    const modal = this.page.locator('div.fixed.inset-0.bg-black\\/50').first();
    const submitButton = modal.locator('button:has-text("Update Product")').last();
    await submitButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Assert product field is read-only (disabled)
   */
  async expectFieldReadOnly(fieldName: string) {
    const field = this.page.locator(`input#${fieldName}`);
    const isDisabled = await field.isDisabled();
    expect(isDisabled).toBe(true);
  }

  /**
   * Assert code field is read-only in edit mode
   */
  async expectCodeFieldReadOnly() {
    // In edit mode, the code field should be disabled
    await this.expectFieldReadOnly('code');
  }

  // ==================== Product Detail ====================

  /**
   * Assert product detail page header
   */
  async expectProductDetailHeader(productName: string) {
    const heading = this.page.getByRole('heading', { name: productName });
    await expect(heading).toBeVisible();
  }

  /**
   * Get product version from detail
   */
  async getProductVersion(): Promise<string> {
    const version = this.page.getByText(/version:?\s+[\d.]+/i);
    const text = await version.textContent();
    return text?.match(/[\d.]+$/)?.[0] || '';
  }

  /**
   * Assert product version is 1.0
   */
  async expectProductVersion(version: string) {
    const versionText = this.page.getByText(new RegExp(`version.*${version}`, 'i'));
    await expect(versionText).toBeVisible();
  }

  /**
   * Click version history tab
   */
  async clickVersionHistoryTab() {
    await this.page.getByRole('tab', { name: /version|history/i }).click();
    await this.waitForPageLoad();
  }

  /**
   * Assert version history table visible
   */
  async expectVersionHistoryTable() {
    const table = this.page.locator('table');
    await expect(table).toBeVisible();
    const header = this.page.getByText(/version|changed|history/i);
    await expect(header).toBeVisible();
  }

  /**
   * Ensure allergens section is visible (it's a Card in the Details tab)
   * No separate allergens tab - it's in the Details content area
   */
  async clickAllergensTab() {
    // Click Details tab if not already active to ensure allergens section is visible
    const detailsTab = this.page.getByRole('tab', { name: /details/i });
    await detailsTab.click();
    await this.waitForPageLoad();
  }

  /**
   * Click shelf life tab
   */
  async clickShelfLifeTab() {
    await this.page.getByRole('tab', { name: /shelf|expiry|life/i }).click();
    await this.waitForPageLoad();
  }

  /**
   * Assert shelf life configuration visible
   */
  async expectShelfLifeConfiguration() {
    const calculated = this.page.getByText(/calculated|final|override/i);
    await expect(calculated).toBeVisible();
  }

  // ==================== Allergen Management ====================

  /**
   * Click "Add Allergen" button
   */
  async clickAddAllergen() {
    await this.clickButton(/add allergen|assign allergen/i);
  }

  /**
   * Assert allergen assignment modal open
   */
  async expectAllergenModalOpen() {
    // Check for modal container
    const modal = this.page.locator('div.fixed.inset-0.bg-black\\/50, [role="dialog"]').first();
    await expect(modal).toBeVisible();
    // Check for title related to allergens
    const title = this.page.getByText(/allergen|add allergen/i);
    await expect(title).toBeVisible();
  }

  /**
   * Select allergen from dropdown
   */
  async selectAllergen(allergenName: string) {
    await this.selectCombobox('[name="allergen_id"]', allergenName);
  }

  /**
   * Select allergen relation
   */
  async selectAllergenRelation(relation: 'contains' | 'may_contain') {
    const value = relation === 'may_contain' ? 'may_contain' : 'contains';
    await this.page.check(`input[value="${value}"]`);
  }

  /**
   * Submit allergen addition
   */
  async submitAddAllergen() {
    await this.clickButton(/add|submit/i);
    await this.waitForPageLoad();
  }

  /**
   * Assert allergen appears in list
   */
  async expectAllergenInList(allergenName: string) {
    const allergen = this.page.getByText(allergenName);
    await expect(allergen).toBeVisible();
  }

  /**
   * Delete allergen from product
   */
  async deleteAllergen(allergenName: string) {
    const row = this.page.locator('table tbody tr').filter({ hasText: allergenName });
    const deleteButton = row.locator('button[aria-label="Delete"], button:has-text("Delete")');
    await deleteButton.click();
    // Confirm deletion if needed
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Delete")');
    if ((await confirmButton.count()) > 0) {
      await confirmButton.click();
    }
  }

  /**
   * Assert inherited allergen visible
   */
  async expectInheritedAllergen(allergenName: string) {
    const badge = this.page.locator('table tbody').getByText(allergenName);
    await expect(badge).toBeVisible();
    const fromBOMBadge = this.page.locator('table tbody').getByText(/from BOM|inherited/i);
    await expect(fromBOMBadge).toBeVisible();
  }

  // ==================== Helper Methods ====================

  /**
   * Select from ShadCN combobox / Select component
   */
  private async selectCombobox(selector: string, value: string) {
    // Click the trigger to open the dropdown
    const trigger = this.page.locator(selector).first();
    await trigger.click();
    await this.page.waitForTimeout(200); // Wait for dropdown to open

    // Look for the option by text
    const option = this.page.getByRole('option', { name: new RegExp(value, 'i') });
    await option.click();
    await this.page.waitForTimeout(100); // Wait for selection to register
  }

  /**
   * Wait for modal to be visible
   */
  private async waitForModal() {
    // Wait for the custom div modal or role="dialog"
    await this.page.waitForSelector('[role="dialog"], div.fixed.inset-0', { state: 'visible' });
  }
}
