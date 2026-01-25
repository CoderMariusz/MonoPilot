/**
 * Transfer Orders Page Object
 *
 * Encapsulates all interactions with /planning/transfer-orders page
 * including list, create, edit, ship, receive, release, and cancel workflows.
 *
 * Created: 2026-01-25
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { DataTablePage } from './DataTablePage';

export interface TransferOrderData {
  from_warehouse_id: string;
  to_warehouse_id: string;
  planned_ship_date: string;
  planned_receive_date: string;
  notes?: string;
}

export interface TransferOrderLineData {
  product_id: string;
  quantity: number;
  uom: string;
}

export class TransferOrdersPage extends BasePage {
  // Page sections
  private dataTable: DataTablePage;

  // Selectors - Form Modal
  private readonly formModalSelector = '[role="dialog"]';
  private readonly formFields = {
    fromWarehouse: 'select[name="from_warehouse_id"]',
    toWarehouse: 'select[name="to_warehouse_id"]',
    plannedShipDate: 'input[type="date"][name="planned_ship_date"]',
    plannedReceiveDate: 'input[type="date"][name="planned_receive_date"]',
    notes: 'textarea[name="notes"]',
  };

  // Test IDs for components
  private readonly testIds = {
    page: 'transfer-orders-page',
    addButton: 'add-transfer-order-button',
    table: 'transfer-orders-table',
    formModal: 'transfer-order-form-modal',
    shipModal: 'ship-transfer-order-modal',
    receiveModal: 'receive-transfer-order-modal',
    releaseDialog: 'release-transfer-order-dialog',
    cancelDialog: 'cancel-transfer-order-dialog',
    statusFilter: 'status-filter',
    searchInput: 'search-transfer-orders',
  };

  constructor(page: Page) {
    super(page);
    this.dataTable = new DataTablePage(page);
  }

  /**
   * Get the underlying page object (for direct access when needed)
   */
  getPage(): Page {
    return (this as any).page;
  }

  // ==================== Navigation ====================

  /**
   * Navigate to transfer orders page
   */
  async goto() {
    await super.goto('/planning/transfer-orders');
  }

  /**
   * Navigate to transfer order detail page
   */
  async gotoTransferOrderDetail(toId: string) {
    await super.goto(`/planning/transfer-orders/${toId}`);
  }

  // ==================== Page Layout ====================

  /**
   * Assert page header is visible
   */
  async expectPageHeader() {
    const heading = this.page.getByRole('heading', { name: /transfer orders/i });
    await expect(heading).toBeVisible();
  }

  /**
   * Assert KPI cards are visible
   */
  async expectKPICards() {
    // Look for KPI card titles
    const draftCard = this.page.getByText(/draft/i);
    const releasedCard = this.page.getByText(/released/i);
    await expect(draftCard).toBeVisible();
    await expect(releasedCard).toBeVisible();
  }

  /**
   * Assert table is displayed with correct columns
   */
  async expectTableWithColumns(columns: string[]) {
    const table = this.getByTestId(this.testIds.table);
    await expect(table).toBeVisible();

    for (const column of columns) {
      const header = this.page.locator(`thead >> text=${column}`);
      await expect(header).toBeVisible();
    }
  }

  /**
   * Assert "Add Transfer Order" button is visible
   */
  async expectAddButton() {
    const button = this.getByTestId(this.testIds.addButton);
    await expect(button).toBeVisible();
  }

  // ==================== Create Transfer Order ====================

  /**
   * Click "Add Transfer Order" button to open form modal
   */
  async clickAddButton() {
    const button = this.getByTestId(this.testIds.addButton);
    if (!(await button.isVisible())) {
      // Fallback for older components using role-based selector
      await this.clickButton(/add transfer order|create transfer order|new transfer order/i);
    } else {
      await button.click();
    }
    await this.waitForModal();
  }

  /**
   * Fill and submit transfer order form
   */
  async createTransferOrder(data: TransferOrderData) {
    await this.fillTransferOrderForm(data);
    await this.submitForm();
  }

  /**
   * Fill transfer order form fields
   */
  async fillTransferOrderForm(data: TransferOrderData) {
    // Select from warehouse
    await this.selectByLabel(/from warehouse|origin warehouse/i, data.from_warehouse_id);

    // Select to warehouse
    await this.selectByLabel(/to warehouse|destination warehouse/i, data.to_warehouse_id);

    // Fill planned ship date
    const shipDateInput = this.page.locator('input[type="date"]').first();
    await shipDateInput.fill(data.planned_ship_date);

    // Fill planned receive date
    const receiveDateInput = this.page.locator('input[type="date"]').nth(1);
    await receiveDateInput.fill(data.planned_receive_date);

    // Fill notes if provided
    if (data.notes) {
      const notesInput = this.page.locator('textarea').first();
      await notesInput.fill(data.notes);
    }
  }

  /**
   * Submit form
   */
  async submitForm() {
    await this.clickButton(/create|save|submit/i);
    await this.page.waitForTimeout(500); // Wait for form submission
  }

  /**
   * Close form modal
   */
  async closeFormModal() {
    await this.closeModal();
  }

  // ==================== Transfer Order Lines ====================

  /**
   * Add a line to transfer order
   */
  async addLineToTransferOrder(lineData: TransferOrderLineData) {
    const addLineButton = this.page.getByRole('button', { name: /add line|add row/i });
    await addLineButton.click();

    // Wait for line form to appear
    await this.waitForModal();

    // Fill line form
    await this.selectByLabel(/product|item/i, lineData.product_id);
    await this.fillByLabel(/quantity/i, lineData.quantity.toString());

    // Submit line form
    await this.clickButton(/add|save|submit/i);
    await this.page.waitForTimeout(300);
  }

  /**
   * Get table row count
   */
  async getRowCount(): Promise<number> {
    return await this.getTableRowCount();
  }

  /**
   * Get transfer order number from first row
   */
  async getFirstTONumber(): Promise<string | null> {
    const firstRow = this.page.locator('tbody tr').first();
    const toNumberCell = firstRow.locator('td').first();
    return await toNumberCell.textContent();
  }

  // ==================== Search & Filter ====================

  /**
   * Search transfer orders by TO number or notes
   */
  async search(query: string) {
    await this.dataTable.search(query);
  }

  /**
   * Clear search
   */
  async clearSearch() {
    await this.dataTable.clearSearch();
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: 'draft' | 'released' | 'shipped' | 'received' | 'cancelled') {
    const statusMap: Record<string, string> = {
      draft: 'Draft',
      released: 'Released',
      shipped: 'Shipped',
      received: 'Received',
      cancelled: 'Cancelled',
    };

    const filterSelect = this.getByTestId(this.testIds.statusFilter);
    await this.selectShadcnOption(filterSelect, statusMap[status]);
  }

  /**
   * Select a ShadCN Select option (for Radix UI)
   */
  private async selectShadcnOption(triggerLocator: Locator, optionText: string): Promise<void> {
    await triggerLocator.waitFor({ state: 'visible', timeout: 10000 });
    await triggerLocator.click();

    await this.page.waitForSelector('[role="listbox"]', {
      state: 'visible',
      timeout: 10000,
    });

    await this.page.waitForTimeout(300);

    const option = this.page
      .locator('[role="listbox"] [role="option"]')
      .filter({ hasText: new RegExp(optionText, 'i') })
      .first();

    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    await this.page.waitForTimeout(150);
  }

  // ==================== Actions - Release TO ====================

  /**
   * Click Release button on a TO row
   */
  async clickReleaseAction(toNumber: string) {
    const row = this.page.locator('tbody tr').filter({ hasText: toNumber });
    const releaseButton = row.getByRole('button', { name: /release/i });
    await releaseButton.click();
  }

  /**
   * Confirm release in dialog
   */
  async confirmRelease() {
    const dialog = this.getByTestId(this.testIds.releaseDialog);
    await expect(dialog).toBeVisible();

    const confirmButton = dialog.getByRole('button', { name: /confirm|release/i });
    await confirmButton.click();
  }

  /**
   * Expect release confirmation dialog
   */
  async expectReleaseDialog() {
    const dialog = this.getByTestId(this.testIds.releaseDialog);
    await expect(dialog).toBeVisible();
  }

  /**
   * Cancel release in dialog
   */
  async cancelReleaseDialog() {
    const dialog = this.getByTestId(this.testIds.releaseDialog);
    const cancelButton = dialog.getByRole('button', { name: /cancel|close/i });
    await cancelButton.click();
  }

  // ==================== Actions - Ship TO ====================

  /**
   * Click Ship button on a TO row
   */
  async clickShipAction(toNumber: string) {
    const row = this.page.locator('tbody tr').filter({ hasText: toNumber });
    const moreButton = row.getByRole('button', { name: /more|actions|menu/i });
    await moreButton.click();

    const shipMenuItem = this.page.getByText(/ship/i);
    await shipMenuItem.click();
  }

  /**
   * Open ship modal
   */
  async openShipModal() {
    const shipModal = this.getByTestId(this.testIds.shipModal);
    await expect(shipModal).toBeVisible();
  }

  /**
   * Enter ship quantity for line in modal
   */
  async enterShipQuantity(lineIndex: number, quantity: number) {
    const inputs = this.page.locator(`${this.formModalSelector} input[type="number"]`);
    await inputs.nth(lineIndex).fill(quantity.toString());
  }

  /**
   * Click ship button in modal
   */
  async submitShip() {
    const shipButton = this.page.getByRole('button', { name: /ship|ship all/i });
    await shipButton.click();
  }

  /**
   * Ship TO with quantity
   */
  async shipTransferOrder(toNumber: string, quantities: number[]) {
    await this.clickShipAction(toNumber);
    await this.openShipModal();

    for (let i = 0; i < quantities.length; i++) {
      await this.enterShipQuantity(i, quantities[i]);
    }

    await this.submitShip();
  }

  // ==================== Actions - Receive TO ====================

  /**
   * Click Receive button on a TO row
   */
  async clickReceiveAction(toNumber: string) {
    const row = this.page.locator('tbody tr').filter({ hasText: toNumber });
    const moreButton = row.getByRole('button', { name: /more|actions|menu/i });
    await moreButton.click();

    const receiveMenuItem = this.page.getByText(/receive/i);
    await receiveMenuItem.click();
  }

  /**
   * Open receive modal
   */
  async openReceiveModal() {
    const receiveModal = this.getByTestId(this.testIds.receiveModal);
    await expect(receiveModal).toBeVisible();
  }

  /**
   * Enter receive quantity for line in modal
   */
  async enterReceiveQuantity(lineIndex: number, quantity: number) {
    const inputs = this.page.locator(`${this.formModalSelector} input[type="number"]`);
    await inputs.nth(lineIndex).fill(quantity.toString());
  }

  /**
   * Click receive button in modal
   */
  async submitReceive() {
    const receiveButton = this.page.getByRole('button', { name: /receive|receive all/i });
    await receiveButton.click();
  }

  /**
   * Receive TO with quantity
   */
  async receiveTransferOrder(toNumber: string, quantities: number[]) {
    await this.clickReceiveAction(toNumber);
    await this.openReceiveModal();

    for (let i = 0; i < quantities.length; i++) {
      await this.enterReceiveQuantity(i, quantities[i]);
    }

    await this.submitReceive();
  }

  // ==================== Actions - Cancel TO ====================

  /**
   * Click Cancel button on a TO row
   */
  async clickCancelAction(toNumber: string) {
    const row = this.page.locator('tbody tr').filter({ hasText: toNumber });
    const moreButton = row.getByRole('button', { name: /more|actions|menu/i });
    await moreButton.click();

    const cancelMenuItem = this.page.getByText(/cancel/i);
    await cancelMenuItem.click();
  }

  /**
   * Confirm cancel in dialog
   */
  async confirmCancel() {
    const dialog = this.getByTestId(this.testIds.cancelDialog);
    await expect(dialog).toBeVisible();

    const confirmButton = dialog.getByRole('button', { name: /confirm|cancel/i });
    await confirmButton.click();
  }

  /**
   * Expect cancel confirmation dialog
   */
  async expectCancelDialog() {
    const dialog = this.getByTestId(this.testIds.cancelDialog);
    await expect(dialog).toBeVisible();
  }

  /**
   * Cancel the cancel dialog
   */
  async closeCancelDialog() {
    const dialog = this.getByTestId(this.testIds.cancelDialog);
    const closeButton = dialog.getByRole('button', { name: /close|cancel/i });
    await closeButton.click();
  }

  // ==================== Edit Transfer Order ====================

  /**
   * Click Edit button on a TO row
   */
  async clickEditAction(toNumber: string) {
    const row = this.page.locator('tbody tr').filter({ hasText: toNumber });
    const editButton = row.getByRole('button', { name: /edit/i });
    await editButton.click();
  }

  /**
   * Edit transfer order
   */
  async editTransferOrder(toNumber: string, data: Partial<TransferOrderData>) {
    await this.clickEditAction(toNumber);
    await this.waitForModal();

    if (data.from_warehouse_id) {
      await this.selectByLabel(/from warehouse/i, data.from_warehouse_id);
    }

    if (data.to_warehouse_id) {
      await this.selectByLabel(/to warehouse/i, data.to_warehouse_id);
    }

    if (data.planned_ship_date) {
      const shipDateInput = this.page.locator('input[type="date"]').first();
      await shipDateInput.fill(data.planned_ship_date);
    }

    if (data.planned_receive_date) {
      const receiveDateInput = this.page.locator('input[type="date"]').nth(1);
      await receiveDateInput.fill(data.planned_receive_date);
    }

    if (data.notes) {
      const notesInput = this.page.locator('textarea').first();
      await notesInput.fill(data.notes);
    }

    await this.submitForm();
  }

  // ==================== Status Assertions ====================

  /**
   * Assert TO has specific status in table
   */
  async expectTOStatus(toNumber: string, status: string) {
    const row = this.page.locator('tbody tr').filter({ hasText: toNumber });
    const statusBadge = row.locator('[class*="badge"]');
    await expect(statusBadge).toContainText(new RegExp(status, 'i'));
  }

  /**
   * Assert TO row exists
   */
  async expectTOExists(toNumber: string) {
    const row = this.page.locator('tbody tr').filter({ hasText: toNumber });
    await expect(row).toBeVisible();
  }

  /**
   * Assert TO row does not exist
   */
  async expectTONotExists(toNumber: string) {
    const row = this.page.locator('tbody tr').filter({ hasText: toNumber });
    await expect(row).not.toBeVisible();
  }

  /**
   * Assert table has specific number of rows
   */
  async expectTableRowCount(count: number) {
    const rows = this.page.locator('tbody tr');
    await expect(rows).toHaveCount(count);
  }

  /**
   * Wait for success message
   */
  async expectSuccessMessage(message?: RegExp | string) {
    const pattern = message || /created|released|shipped|received|cancelled|success/i;
    await this.expectSuccessToast(pattern);
  }

  /**
   * Wait for error message
   */
  async expectErrorMessage(message?: RegExp | string) {
    const pattern = message || /error|failed|invalid/i;
    await this.expectErrorToast(pattern);
  }
}
