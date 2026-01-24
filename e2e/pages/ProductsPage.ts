/**
 * Products Page Object
 *
 * Encapsulates all interactions with /technical/products page
 * including list, create, edit, search, filter, and detail views.
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
    code: 'input[name="code"]',
    name: 'input[name="name"]',
    description: 'textarea[name="description"]',
    productType: 'select[name="product_type_id"], [name="product_type_id"]',
    baseUom: 'select[name="base_uom"], [name="base_uom"]',
    costPerUnit: 'input[name="cost_per_unit"]',
    isPerishable: 'input[name="is_perishable"]',
    shelfLifeDays: 'input[name="shelf_life_days"]',
    expiryPolicy: 'select[name="expiry_policy"], [name="expiry_policy"]',
  };

  // Modal and drawer selectors
  // ProductFormModal uses a custom div with fixed inset-0, not role="dialog"
  private readonly modal = 'div.fixed.inset-0.bg-black\/50, [role="dialog"]';
  private readonly drawer = '[role="presentation"], div.fixed';

  constructor(page: Page) {
    super(page);
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
    // Note: The ProductFilters component uses RM/WIP/FG/PKG values, but tests may use RAW/WIP/FIN/PKG
    // Map the test values to UI values
    const typeMap: Record<string, string> = {
      'RAW': 'Raw Material',
      'WIP': 'Work in Progress',
      'FIN': 'Finished Goods',
      'PKG': 'Packaging'
    };

    // Click the Type filter Select trigger
    const typeTrigger = this.page.locator('[aria-label="Filter by product type"]');
    await typeTrigger.click();

    // Wait for dropdown to open
    await this.page.waitForTimeout(100);

    // Select the option by its display label
    const typeOption = this.page.getByRole('option', {
      name: typeMap[type],
      exact: false
    });
    await typeOption.click();
    await this.waitForPageLoad();
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: 'Active' | 'Inactive') {
    // Click the Status filter Select trigger
    const statusTrigger = this.page.locator('[aria-label="Filter by status"]');
    await statusTrigger.click();

    // Wait for dropdown to open
    await this.page.waitForTimeout(100);

    // Select the option - status displays as "Active" or "Inactive"
    const statusOption = this.page.getByRole('option', {
      name: status,
      exact: true
    });
    await statusOption.click();
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
    // Wait for form inputs to be available
    await this.page.waitForSelector('input[name="code"]', { state: 'visible', timeout: 30000 });

    // Fill required fields
    await this.page.fill(this.formFields.code, data.code);
    await this.page.fill(this.formFields.name, data.name);

    if (data.description) {
      await this.page.fill(this.formFields.description, data.description);
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

    // Click the product type Select trigger
    const typeSelect = this.page.locator('[name="product_type_id"]').first();
    await typeSelect.click();
    await this.page.waitForTimeout(200);

    // Find and click the option
    const typeOption = this.page.getByRole('option', { name: new RegExp(typeDisplayName, 'i') }).first();
    await typeOption.click();
    await this.page.waitForTimeout(100);

    // Select base UOM - similar approach
    const baseUomSelect = this.page.locator('[name="base_uom"]').first();
    await baseUomSelect.click();
    await this.page.waitForTimeout(200);

    const uomOption = this.page.getByRole('option', { name: new RegExp(data.base_uom, 'i') }).first();
    await uomOption.click();
    await this.page.waitForTimeout(100);

    // Fill optional fields
    if (data.cost_per_unit !== undefined) {
      await this.page.fill(
        this.formFields.costPerUnit,
        data.cost_per_unit.toString(),
      );
    }

    if (data.is_perishable !== undefined) {
      if (data.is_perishable) {
        await this.page.check(this.formFields.isPerishable);
        if (data.shelf_life_days !== undefined) {
          await this.page.fill(
            this.formFields.shelfLifeDays,
            data.shelf_life_days.toString(),
          );
        }
        if (data.expiry_policy !== undefined) {
          const policySelect = this.page.locator('[name="expiry_policy"]').first();
          await policySelect.click();
          await this.page.waitForTimeout(200);

          const policyOption = this.page.getByRole('option', { name: new RegExp(data.expiry_policy, 'i') }).first();
          await policyOption.click();
          await this.page.waitForTimeout(100);
        }
      }
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
   */
  async clickEditFirstProduct() {
    await this.dataTable.editRow(0);
    await this.waitForModal();
  }

  /**
   * Open edit drawer for product
   */
  async clickEditProduct(rowIndex: number) {
    await this.dataTable.editRow(rowIndex);
    await this.waitForPageLoad();
  }

  /**
   * Assert edit drawer is open
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
   * Update product field
   */
  async updateProductField(fieldName: keyof ProductData, value: string) {
    const field = this.page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
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
   * Update product status to inactive
   */
  async setProductStatusInactive() {
    const statusToggle = this.page.locator('input[name="status"]');
    await statusToggle.uncheck();
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
   * Assert product field is read-only
   */
  async expectFieldReadOnly(fieldName: string) {
    const field = this.page.locator(`input[name="${fieldName}"]`);
    const isDisabled = await field.isDisabled();
    expect(isDisabled).toBe(true);
  }

  /**
   * Assert code field is read-only
   */
  async expectCodeFieldReadOnly() {
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
   * Click allergens tab
   */
  async clickAllergensTab() {
    await this.page.getByRole('tab', { name: /allergen/i }).click();
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
