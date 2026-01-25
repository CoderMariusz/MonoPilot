/**
 * Suppliers Page Object
 *
 * Encapsulates all supplier-related page interactions for E2E tests.
 * Follows the Page Object Model pattern for maintainability.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SuppliersPage extends BasePage {
  // ==================== Public Properties ====================

  /**
   * Public accessor for page object (needed for tests)
   */
  get getPage(): Page {
    return this.page;
  }

  // ==================== Page URLs ====================

  async goto() {
    await super.goto('/planning/suppliers');
  }

  // ==================== Selectors ====================

  // Headers & Navigation
  private getPageHeader(): Locator {
    return this.page.getByRole('heading', { name: /suppliers/i });
  }

  private getCreateSupplierButton(): Locator {
    return this.getByTestId('add-supplier-button') || this.getByTestId('button-create-supplier');
  }

  private getImportButton(): Locator {
    return this.page.getByRole('button', { name: /import/i });
  }

  // KPI Cards
  private getKPICard(label: string): Locator {
    return this.page.locator('[data-testid*="kpi"]').filter({ hasText: new RegExp(label, 'i') });
  }

  // Table Elements
  private getSupplierTable(): Locator {
    return this.page.locator('table');
  }

  getTableRows(): Locator {
    return this.getSupplierTable().locator('tbody tr');
  }

  private getTableHeaderCells(): Locator {
    return this.getSupplierTable().locator('thead th');
  }

  // Search & Filters
  private getSearchInput(): Locator {
    // Try testIds in order, fall back to placeholder
    return (
      this.getByTestId('search-suppliers') ||
      this.getByTestId('input-supplier-search') ||
      this.page.getByPlaceholder(/search|supplier/i).first()
    );
  }

  private getStatusFilter(): Locator {
    return this.getByTestId('filter-status') || this.page.locator('select[name="status"]');
  }

  private getCurrencyFilter(): Locator {
    return this.getByTestId('filter-currency') || this.page.locator('select[name="currency"]');
  }

  private getPaymentTermsFilter(): Locator {
    return this.getByTestId('filter-payment-terms') || this.page.locator('select[name="payment_terms"]');
  }

  private getClearFiltersButton(): Locator {
    return this.page.getByRole('button', { name: /clear.*filters|reset/i });
  }

  // Modal Elements
  private getCreateModal(): Locator {
    return this.getByTestId('modal-create-supplier') || this.page.locator('[role="dialog"]').first();
  }

  private getSupplierCodeInput(): Locator {
    return this.getByTestId('input-supplier-code');
  }

  private getSupplierNameInput(): Locator {
    return this.getByTestId('input-supplier-name');
  }

  private getContactNameInput(): Locator {
    return this.getByTestId('input-contact-name');
  }

  private getEmailInput(): Locator {
    return this.getByTestId('input-supplier-email');
  }

  private getPhoneInput(): Locator {
    return this.getByTestId('input-supplier-phone');
  }

  private getAddressInput(): Locator {
    return this.getByTestId('input-supplier-address');
  }

  private getCityInput(): Locator {
    return this.getByTestId('input-supplier-city');
  }

  private getPostalCodeInput(): Locator {
    return this.getByTestId('input-supplier-postal-code');
  }

  private getCountryInput(): Locator {
    return this.getByTestId('input-supplier-country');
  }

  private getCurrencySelect(): Locator {
    return this.getByTestId('select-supplier-currency');
  }

  private getTaxCodeSelect(): Locator {
    return this.getByTestId('select-supplier-tax-code');
  }

  private getPaymentTermsSelect(): Locator {
    return this.getByTestId('select-supplier-payment-terms');
  }

  private getSubmitButton(): Locator {
    return this.getCreateModal().locator('button:has-text("Create|Save")').first();
  }

  private getCancelButton(): Locator {
    return this.getCreateModal().locator('button:has-text("Cancel")').first();
  }

  // Bulk Actions
  private getSelectAllCheckbox(): Locator {
    return this.getByTestId('checkbox-select-all');
  }

  private getBulkActionsContainer(): Locator {
    return this.getByTestId('bulk-actions-container');
  }

  private getDeactivateSelectedButton(): Locator {
    return this.getByTestId('button-deactivate-selected');
  }

  private getActivateSelectedButton(): Locator {
    return this.getByTestId('button-activate-selected');
  }

  private getExportButton(): Locator {
    return this.getByTestId('button-export-suppliers');
  }

  // Row Actions
  private getSupplierRow(code: string): Locator {
    return this.getTableRows().filter({ hasText: code });
  }

  private getEditButton(code: string): Locator {
    return this.getSupplierRow(code).locator('[data-testid="button-edit-supplier"]');
  }

  private getDeleteButton(code: string): Locator {
    return this.getSupplierRow(code).locator('[data-testid="button-delete-supplier"]');
  }

  private getDeactivateButton(code: string): Locator {
    return this.getSupplierRow(code).locator('[data-testid="button-deactivate-supplier"]');
  }

  private getActivateButton(code: string): Locator {
    return this.getSupplierRow(code).locator('[data-testid="button-activate-supplier"]');
  }

  private getSupplierCheckbox(code: string): Locator {
    return this.getSupplierRow(code).locator('input[type="checkbox"]');
  }

  // Delete Confirmation Modal
  private getDeleteModal(): Locator {
    return this.page.locator('[role="dialog"]').filter({ hasText: /delete|confirm/i });
  }

  private getConfirmDeleteButton(): Locator {
    return this.getByTestId('button-confirm-delete') || this.getDeleteModal().locator('button:has-text("Delete")');
  }

  private getCancelDeleteButton(): Locator {
    return this.getDeleteModal().locator('button:has-text("Cancel")');
  }

  // Empty States
  private getEmptyState(): Locator {
    return this.getByTestId('empty-state-suppliers');
  }

  private getFilteredEmptyState(): Locator {
    return this.page.locator('text=No Suppliers Match Filters');
  }

  // Notifications
  private getErrorMessage(): Locator {
    return this.page.locator('[role="alert"], .error-message');
  }

  private getSuccessToast(): Locator {
    return this.page.locator('text=/created|updated|deleted|activated|deactivated|success/i');
  }

  // ==================== Navigation & Setup ====================

  async expectPageHeader() {
    await expect(this.getPageHeader()).toBeVisible();
  }

  async expectCreateButtonVisible() {
    await expect(this.getCreateSupplierButton()).toBeVisible();
  }

  // ==================== Table Operations ====================

  async expectTableWithColumns(expectedColumns: string[]) {
    const headers = await this.getTableHeaderCells().allTextContents();
    for (const column of expectedColumns) {
      expect(headers.some(h => h.includes(column))).toBeTruthy();
    }
  }

  async getRowCount(): Promise<number> {
    return await this.getTableRows().count();
  }

  async expectSupplierInList(code: string) {
    await expect(this.getSupplierRow(code)).toBeVisible();
  }

  async expectSupplierNotInList(code: string) {
    await expect(this.getSupplierRow(code)).not.toBeVisible();
  }

  // ==================== Search & Filtering ====================

  async searchByCode(code: string) {
    await this.getSearchInput().fill(code);
    await this.page.waitForTimeout(400); // Wait for debounce
  }

  async searchByName(name: string) {
    await this.getSearchInput().fill(name);
    await this.page.waitForTimeout(400);
  }

  async clearSearch() {
    await this.getSearchInput().clear();
    await this.page.waitForTimeout(400);
  }

  async filterByStatus(status: 'all' | 'active' | 'inactive') {
    await this.getStatusFilter().selectOption(status);
    await this.page.waitForTimeout(500);
  }

  async filterByCurrency(currency: string) {
    await this.getCurrencyFilter().selectOption(currency);
    await this.page.waitForTimeout(500);
  }

  async filterByPaymentTerms(terms: string) {
    await this.getPaymentTermsFilter().selectOption(terms);
    await this.page.waitForTimeout(500);
  }

  async clearAllFilters() {
    await this.getClearFiltersButton().click();
    await this.page.waitForTimeout(500);
  }

  // ==================== Create Supplier ====================

  async clickCreateSupplier() {
    await this.getCreateSupplierButton().click();
    await this.waitForModal();
  }

  async expectCreateFormOpen() {
    await expect(this.getCreateModal()).toBeVisible();
  }

  async fillSupplierForm(data: {
    code?: string;
    name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    currency: string;
    tax_code: string;
    payment_terms: string;
  }) {
    if (data.code) {
      await this.getSupplierCodeInput().fill(data.code);
    }

    await this.getSupplierNameInput().fill(data.name);

    if (data.contact_name) {
      await this.getContactNameInput().fill(data.contact_name);
    }

    if (data.email) {
      await this.getEmailInput().fill(data.email);
    }

    if (data.phone) {
      await this.getPhoneInput().fill(data.phone);
    }

    if (data.address) {
      await this.getAddressInput().fill(data.address);
    }

    if (data.city) {
      await this.getCityInput().fill(data.city);
    }

    if (data.postal_code) {
      await this.getPostalCodeInput().fill(data.postal_code);
    }

    if (data.country) {
      await this.getCountryInput().fill(data.country);
    }

    await this.getCurrencySelect().selectOption(data.currency);
    await this.getTaxCodeSelect().selectOption(data.tax_code);
    await this.getPaymentTermsSelect().selectOption(data.payment_terms);
  }

  async submitCreateSupplier() {
    await this.getSubmitButton().click();
    await this.page.waitForTimeout(500);
  }

  async createSupplier(supplierData: any) {
    await this.clickCreateSupplier();
    await this.fillSupplierForm(supplierData);
    await this.submitCreateSupplier();
  }

  async expectCreateSuccess() {
    await expect(this.getSuccessToast()).toBeVisible({ timeout: 5000 });
  }

  // ==================== Edit Supplier ====================

  async clickEditSupplier(code: string) {
    await this.getEditButton(code).click();
    await this.waitForModal();
  }

  async updateSupplierName(code: string, newName: string) {
    await this.clickEditSupplier(code);
    await this.getSupplierNameInput().fill(newName);
    await this.submitCreateSupplier();
  }

  async expectSupplierCodeLocked(code: string) {
    await this.clickEditSupplier(code);
    const codeInput = this.getSupplierCodeInput();
    const isDisabled = await codeInput.isDisabled();
    await this.getCancelButton().click();
    expect(isDisabled).toBeTruthy();
  }

  // ==================== Delete Supplier ====================

  async clickDeleteSupplier(code: string) {
    await this.getDeleteButton(code).click();
    await this.page.waitForTimeout(300);
  }

  async confirmDelete() {
    await this.getConfirmDeleteButton().click();
    await this.page.waitForTimeout(500);
  }

  async deleteSupplier(code: string) {
    await this.clickDeleteSupplier(code);
    await this.confirmDelete();
  }

  async expectDeleteSuccess() {
    await expect(this.getSuccessToast()).toBeVisible({ timeout: 5000 });
  }

  // ==================== Activate/Deactivate ====================

  async clickDeactivateSupplier(code: string) {
    await this.getDeactivateButton(code).click();
    await this.page.waitForTimeout(300);
  }

  async clickActivateSupplier(code: string) {
    await this.getActivateButton(code).click();
    await this.page.waitForTimeout(300);
  }

  async deactivateSupplier(code: string) {
    await this.clickDeactivateSupplier(code);
    // Wait for toast
    await this.expectSuccessToast();
  }

  async activateSupplier(code: string) {
    await this.clickActivateSupplier(code);
    // Wait for toast
    await this.expectSuccessToast();
  }

  // ==================== Bulk Operations ====================

  async selectSupplier(code: string) {
    await this.getSupplierCheckbox(code).check();
  }

  async deselectSupplier(code: string) {
    await this.getSupplierCheckbox(code).uncheck();
  }

  async selectAll() {
    await this.getSelectAllCheckbox().check();
  }

  async deselectAll() {
    await this.getSelectAllCheckbox().uncheck();
  }

  async clickBulkDeactivate() {
    await this.getDeactivateSelectedButton().click();
  }

  async clickBulkActivate() {
    await this.getActivateSelectedButton().click();
  }

  async clickExport() {
    await this.getExportButton().click();
  }

  async bulkDeactivateSuppliers(codes: string[]) {
    for (const code of codes) {
      await this.selectSupplier(code);
    }
    await this.clickBulkDeactivate();
    await this.page.waitForTimeout(500);
  }

  async bulkActivateSuppliers(codes: string[]) {
    for (const code of codes) {
      await this.selectSupplier(code);
    }
    await this.clickBulkActivate();
    await this.page.waitForTimeout(500);
  }

  // ==================== Assertions ====================

  async expectEmptyState() {
    await expect(this.getEmptyState()).toBeVisible();
  }

  async expectFilteredEmptyState() {
    await expect(this.getFilteredEmptyState()).toBeVisible();
  }

  async expectSuccessToast() {
    await expect(this.getSuccessToast()).toBeVisible({ timeout: 5000 });
  }

  async expectErrorMessage() {
    await expect(this.getErrorMessage()).toBeVisible();
  }

  async expectCodeError() {
    const errorText = await this.getErrorMessage().textContent();
    expect(
      errorText?.toLowerCase().includes('code') || errorText?.toLowerCase().includes('already exists')
    ).toBeTruthy();
  }

  async expectKPICard(label: string) {
    await expect(this.getKPICard(label)).toBeVisible();
  }

  async expectBulkActionsVisible() {
    await expect(this.getBulkActionsContainer()).toBeVisible();
  }
}
