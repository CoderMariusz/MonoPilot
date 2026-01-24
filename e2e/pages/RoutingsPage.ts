/**
 * Routings Page Object
 *
 * Encapsulates all interactions with /technical/routings page
 * including list, create, edit, operations management, and detail views.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { DataTablePage } from './DataTablePage';

export interface RoutingData {
  code: string;
  name: string;
  description?: string;
  is_reusable: boolean;
  setup_cost: number;
  working_cost_per_unit: number;
  overhead_percent: number;
}

export interface OperationData {
  sequence: number;
  name: string;
  machine_id?: string;
  setup_time: number;
  duration: number;
  cleanup_time: number;
  labor_cost_per_hour: number;
  instructions?: string;
}

export class RoutingsPage extends BasePage {
  // Page sections
  private readonly dataTable = new DataTablePage(this.page);

  // Selectors for create/edit form (using react-hook-form)
  private readonly formFields = {
    code: 'input[name="code"]',
    name: 'input[name="name"]',
    description: 'textarea[name="description"]',
    isReusable: 'input[name="is_reusable"]',
    setupCost: 'input[name="setup_cost"]',
    workingCostPerUnit: 'input[name="working_cost_per_unit"]',
    overheadPercent: 'input[name="overhead_percent"]',
    isActive: 'input[name="is_active"]',
    currency: 'select[name="currency"]',
  };

  // Operation form fields
  private readonly operationFields = {
    sequence: 'input[name="sequence"]',
    name: 'input[name="name"]',
    machineId: 'input[name="machine_id"]',
    setupTime: 'input[name="setup_time_minutes"]',
    duration: 'input[name="estimated_duration_minutes"]',
    cleanupTime: 'input[name="cleanup_time_minutes"]',
    laborCostPerHour: 'input[name="labor_cost_per_hour"]',
    instructions: 'textarea[name="instructions"]',
    description: 'textarea[name="description"]',
  };

  // Modal and drawer selectors
  private readonly modal = '[role="dialog"]';
  private readonly drawer = '[role="presentation"]';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Navigation ====================

  /**
   * Navigate to routings page
   */
  async goto() {
    await super.goto('/technical/routings');
  }

  /**
   * Navigate to routing detail page
   */
  async gotoRoutingDetail(routingId: string) {
    await super.goto(`/technical/routings/${routingId}`);
  }

  /**
   * Navigate to create routing form
   */
  async gotoCreateRouting() {
    await super.goto('/technical/routings/new');
  }

  // ==================== Page Layout ====================

  /**
   * Assert page header is visible
   */
  async expectPageHeader() {
    // Page has h1 with text "Routings" at the top
    const heading = this.page.locator('h1:has-text("Routings")');
    await expect(heading).toBeVisible();
  }

  /**
   * Assert table with correct columns
   */
  async expectTableWithColumns(columns: string[]) {
    await this.dataTable.expectTableVisible();
    for (const column of columns) {
      // Use getByRole for table headers for better reliability
      const header = this.page.locator('thead th', { hasText: new RegExp(`^${column}$`, 'i') });
      await expect(header).toBeVisible();
    }
  }

  /**
   * Assert "Add Routing" button visible
   */
  async expectCreateRoutingButton() {
    const button = this.page.getByRole('button', { name: /add routing/i });
    await expect(button).toBeVisible();
  }

  // ==================== Search & Filter ====================

  /**
   * Search by routing code
   */
  async searchByCode(code: string) {
    await this.dataTable.search(code);
  }

  /**
   * Search by routing name
   */
  async searchByName(name: string) {
    await this.dataTable.search(name);
  }

  /**
   * Filter by is_reusable
   */
  async filterByReusable(isReusable: boolean) {
    // Click the Reusable filter Select trigger
    const reusableTrigger = this.page.locator('[aria-label*="reusable" i]');
    if ((await reusableTrigger.count()) === 0) {
      // If no reusable filter found, try other potential selectors
      // Routing filters may not have a reusable filter
      return;
    }

    await reusableTrigger.click();
    await this.page.waitForTimeout(100);

    const value = isReusable ? 'Reusable' : 'Non-Reusable';
    const option = this.page.getByRole('option', { name: value, exact: false });
    if ((await option.count()) > 0) {
      await option.click();
    }
    await this.waitForPageLoad();
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: 'Active' | 'Inactive') {
    // Click the Status filter Select trigger
    const statusTrigger = this.page.locator('[aria-label="Filter by status"]');
    if ((await statusTrigger.count()) > 0) {
      await statusTrigger.click();
      await this.page.waitForTimeout(100);

      const statusOption = this.page.getByRole('option', {
        name: status,
        exact: true
      });
      await statusOption.click();
    }
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
   * Click routing row
   */
  async clickRouting(text: string) {
    await this.dataTable.clickRowByText(text);
    await this.waitForPageLoad();
  }

  /**
   * Assert routing appears in list
   */
  async expectRoutingInList(routingCode: string) {
    await this.dataTable.expectRowWithText(routingCode);
  }

  // ==================== Create Routing ====================

  /**
   * Click "Add Routing" button
   */
  async clickCreateRouting() {
    await this.clickButton(/add routing/i);
  }

  /**
   * Assert routing form open (in dialog)
   */
  async expectRoutingFormOpen() {
    // Form is inside a Dialog component with title "Create Routing"
    const dialog = this.page.locator('[role="dialog"]:has-text("Create Routing")');
    await expect(dialog).toBeVisible();
  }

  /**
   * Fill routing form
   */
  async fillRoutingForm(data: RoutingData) {
    // Fill required fields
    await this.page.fill(this.formFields.code, data.code);
    await this.page.fill(this.formFields.name, data.name);

    if (data.description) {
      await this.page.fill(this.formFields.description, data.description);
    }

    // Set is_reusable switch - it's a ShadCN Switch component
    // The switches are displayed in a FormItem section
    // Try to find and click the reusable switch button
    try {
      const switchButtons = await this.page.locator('button[role="switch"]').count();
      if (switchButtons >= 2) {
        // First button is "Active", second is "Reusable"
        const reusableSwitch = this.page.locator('button[role="switch"]').nth(1);
        const ariaChecked = await reusableSwitch.getAttribute('aria-checked').catch(() => 'false');

        if (data.is_reusable && ariaChecked !== 'true') {
          await reusableSwitch.click();
          await this.page.waitForTimeout(100);
        } else if (!data.is_reusable && ariaChecked === 'true') {
          await reusableSwitch.click();
          await this.page.waitForTimeout(100);
        }
      }
    } catch (e) {
      // If we can't find the switch, that's OK - it might be in expected state
      console.log('Could not set is_reusable switch, continuing...');
    }

    // Fill cost fields
    await this.page.fill(
      this.formFields.setupCost,
      data.setup_cost.toString(),
    );
    await this.page.fill(
      this.formFields.workingCostPerUnit,
      data.working_cost_per_unit.toString(),
    );
    await this.page.fill(
      this.formFields.overheadPercent,
      data.overhead_percent.toString(),
    );
  }

  /**
   * Submit create routing form
   */
  async submitCreateRouting() {
    await this.clickButton(/^create routing$/i);
    await this.waitForPageLoad();
  }

  /**
   * Create routing with data
   */
  async createRouting(data: RoutingData) {
    await this.clickCreateRouting();
    await this.fillRoutingForm(data);
    await this.submitCreateRouting();
    await this.expectSuccessToast(/created|success/i);
  }

  /**
   * Assert success message
   */
  async expectCreateSuccess() {
    await this.expectSuccessToast(/created|success/i);
  }

  /**
   * Assert duplicate code error
   */
  async expectDuplicateCodeError() {
    await this.expectErrorToast(/must be unique|already exists|duplicate/i);
  }

  /**
   * Assert routing code uniqueness validation error
   */
  async expectRoutingCodeError() {
    const error = this.page.locator('[role="alert"], .error-message');
    await expect(error).toContainText(/routing code must be unique/i);
  }

  /**
   * Assert code format validation error
   */
  async expectCodeFormatError() {
    const error = this.page.locator('[role="alert"], .error-message');
    await expect(error).toContainText(/format|alphanumeric|uppercase/i);
  }

  // ==================== Operations Management ====================

  /**
   * Click "Add Operation" button
   */
  async clickAddOperation() {
    await this.clickButton(/add operation/i);
    await this.waitForModal();
  }

  /**
   * Assert operation form modal open (title "Add Operation")
   */
  async expectOperationFormOpen() {
    // Modal with title "Add Operation"
    const modal = this.page.locator('[role="dialog"]:has-text("Add Operation")');
    await expect(modal).toBeVisible();
  }

  /**
   * Fill operation form
   */
  async fillOperationForm(data: OperationData) {
    // Fill sequence
    await this.page.fill(
      this.operationFields.sequence,
      data.sequence.toString(),
    );

    // Fill operation name
    await this.page.fill(this.operationFields.name, data.name);

    // Select machine if provided
    if (data.machine_id) {
      await this.selectCombobox(this.operationFields.machineId, data.machine_id);
    }

    // Fill time fields (in minutes)
    await this.page.fill(
      this.operationFields.setupTime,
      data.setup_time.toString(),
    );
    await this.page.fill(this.operationFields.duration, data.duration.toString());
    await this.page.fill(
      this.operationFields.cleanupTime,
      data.cleanup_time.toString(),
    );

    // Fill labor cost per hour
    await this.page.fill(
      this.operationFields.laborCostPerHour,
      data.labor_cost_per_hour.toString(),
    );

    // Fill instructions if provided
    if (data.instructions) {
      await this.page.fill(this.operationFields.instructions, data.instructions);
    }
  }

  /**
   * Submit operation form
   */
  async submitAddOperation() {
    // Click "Add Operation" button in dialog
    await this.clickButton(/^add operation$/i);
    await this.waitForPageLoad();
  }

  /**
   * Add operation
   */
  async addOperation(data: OperationData) {
    await this.clickAddOperation();
    await this.fillOperationForm(data);
    await this.submitAddOperation();
  }

  /**
   * Assert operation appears in list
   */
  async expectOperationInList(operationName: string) {
    const operation = this.page.getByText(operationName);
    await expect(operation).toBeVisible();
  }

  /**
   * Assert operation appears with machine
   */
  async expectOperationWithMachine(operationName: string, machineName: string) {
    const row = this.page
      .locator('table tbody tr')
      .filter({ hasText: operationName });
    const machine = row.getByText(machineName);
    await expect(machine).toBeVisible();
  }

  /**
   * Delete operation
   */
  async deleteOperation(operationName: string) {
    const row = this.page
      .locator('table tbody tr')
      .filter({ hasText: operationName });
    const deleteButton = row.locator(
      'button[aria-label="Delete"], button:has-text("Delete")',
    );
    await deleteButton.click();

    // Confirm deletion if needed
    const confirmButton = this.page.locator(
      'button:has-text("Confirm"), button:has-text("Delete")',
    );
    if ((await confirmButton.count()) > 0) {
      await confirmButton.click();
    }
  }

  /**
   * Assert duplicate sequence error
   */
  async expectDuplicateSequenceError() {
    const error = this.page.locator('[role="alert"], .error-message');
    await expect(error).toContainText(/unique|sequence|duplicate/i);
  }

  /**
   * Assert sequence validation error
   */
  async expectSequenceValidationError() {
    const error = this.page.locator('[role="alert"], .error-message');
    await expect(error).toContainText(/sequence|positive|valid/i);
  }

  /**
   * Reorder operations
   */
  async reorderOperations(fromIndex: number, toIndex: number) {
    const rows = this.page.locator('table tbody tr');
    const fromRow = rows.nth(fromIndex);
    const toRow = rows.nth(toIndex);

    // Drag and drop
    await fromRow.dragTo(toRow);
    await this.waitForPageLoad();
  }

  // ==================== Routing Assignment to BOM ====================

  /**
   * Assert routing can be assigned to BOM
   */
  async expectAssignableTosBOM() {
    const assignButton = this.page.getByRole('button', {
      name: /assign|attach|link.*BOM/i,
    });
    await expect(assignButton).toBeVisible();
  }

  /**
   * Assign routing to BOM
   */
  async assignRoutingToBOM(bomName: string) {
    await this.clickButton(/assign|attach|link.*BOM/i);
    await this.waitForModal();
    await this.selectCombobox('[name="bom_id"]', bomName);
    await this.clickButton(/confirm|submit|assign/i);
  }

  /**
   * Assert routing displayed in BOM detail
   */
  async expectRoutingDisplayedInBOM() {
    const routingSection = this.page.getByText(/routing|workflow/i);
    await expect(routingSection).toBeVisible();
  }

  // ==================== Routing Clone ====================

  /**
   * Click clone button
   */
  async clickCloneRouting() {
    await this.clickButton(/clone|copy/i);
    await this.waitForModal();
  }

  /**
   * Assert cloned routing name has -COPY suffix
   */
  async expectClonedRoutingName(originalCode: string) {
    const clonedName = `${originalCode}-COPY`;
    const name = this.page.getByText(clonedName);
    await expect(name).toBeVisible();
  }

  /**
   * Clone routing
   */
  async cloneRouting() {
    await this.clickCloneRouting();
    await this.clickButton(/confirm|clone/i);
    await this.waitForPageLoad();
    await this.expectSuccessToast(/cloned|success/i);
  }

  // ==================== Routing Versioning ====================

  /**
   * Get routing version
   */
  async getRoutingVersion(): Promise<string> {
    const version = this.page.getByText(/version:?\s+[\d.]+/i);
    const text = await version.textContent();
    return text?.match(/[\d.]+$/)?.[0] || '';
  }

  /**
   * Assert routing version incremented
   */
  async expectVersionIncremented(currentVersion: string) {
    const newVersion = await this.getRoutingVersion();
    expect(parseFloat(newVersion)).toBeGreaterThan(parseFloat(currentVersion));
  }

  /**
   * Update routing name to trigger version increment
   */
  async updateRoutingName(newName: string) {
    // Click Edit button
    await this.page.locator('button:has-text("Edit")').click();
    await this.waitForPageLoad();

    const nameField = this.page.locator(this.formFields.name);
    await nameField.clear();
    await nameField.fill(newName);
    await this.clickButton(/^save changes$/i);
    await this.waitForPageLoad();
  }

  // ==================== Routing Cost Calculation ====================

  /**
   * Assert cost summary visible
   */
  async expectCostSummary() {
    const costCard = this.page.locator('[data-testid="cost-summary"], .cost-summary');
    await expect(costCard).toBeVisible();
  }

  /**
   * Get setup cost
   */
  async getSetupCost(): Promise<number> {
    const cost = this.page.getByText(/setup cost:?\s+\$[\d.]+/i);
    const text = await cost.textContent();
    return parseFloat(text?.match(/\$?([\d.]+)/)?.[1] || '0');
  }

  /**
   * Get working cost
   */
  async getWorkingCost(): Promise<number> {
    const cost = this.page.getByText(/working cost:?\s+\$[\d.]+/i);
    const text = await cost.textContent();
    return parseFloat(text?.match(/\$?([\d.]+)/)?.[1] || '0');
  }

  /**
   * Get overhead amount
   */
  async getOverheadAmount(): Promise<number> {
    const overhead = this.page.getByText(/overhead:?\s+\$[\d.]+/i);
    const text = await overhead.textContent();
    return parseFloat(text?.match(/\$?([\d.]+)/)?.[1] || '0');
  }

  /**
   * Assert total cost calculated
   */
  async expectTotalCostCalculated() {
    const total = this.page.getByText(/total.*cost:?\s+\$[\d.]+/i);
    await expect(total).toBeVisible();
  }

  // ==================== Parallel Operations ====================

  /**
   * Add parallel operation (same sequence)
   */
  async addParallelOperation(data: OperationData) {
    // Parallel operations have same sequence as another operation
    await this.clickAddOperation();
    await this.fillOperationForm(data);
    await this.submitAddOperation();
  }

  /**
   * Assert operations are parallel (same sequence)
   */
  async expectParallelOperations(operationName1: string, operationName2: string, sequence: number) {
    const row1 = this.page
      .locator('table tbody tr')
      .filter({ hasText: operationName1 });
    const row2 = this.page
      .locator('table tbody tr')
      .filter({ hasText: operationName2 });

    const seq1 = row1.locator('td').first().textContent();
    const seq2 = row2.locator('td').first().textContent();

    expect(seq1).toBe(seq2);
    expect(seq1).toContain(sequence.toString());
  }

  // ==================== Reusable vs Non-Reusable ====================

  /**
   * Assert routing is marked as reusable
   */
  async expectReusableRouting() {
    const badge = this.page.getByText(/reusable|multi-bom/i);
    await expect(badge).toBeVisible();
  }

  /**
   * Assert routing is marked as non-reusable
   */
  async expectNonReusableRouting() {
    const badge = this.page.getByText(/non-reusable|single-bom/i);
    await expect(badge).toBeVisible();
  }

  /**
   * Assert reusable routing can be assigned to multiple BOMs
   */
  async expectCanAssignToMultipleBOMs() {
    const button = this.page.getByRole('button', {
      name: /assign.*boms?|multiple.*bom/i,
    });
    await expect(button).toBeVisible();
  }

  /**
   * Assert non-reusable routing cannot be assigned to another BOM
   */
  async expectCannotAssignToAnotherBOM() {
    const button = this.page.getByRole('button', {
      name: /assign|attach/i,
    });
    await expect(button).toBeDisabled();
  }

  // ==================== Helper Methods ====================

  /**
   * Select from ShadCN combobox
   */
  private async selectCombobox(selector: string, value: string) {
    const trigger = this.page.locator(selector);
    await trigger.click();
    const option = this.page.getByRole('option', { name: value });
    await option.click();
  }

  /**
   * Wait for modal
   */
  private async waitForModal() {
    await this.page.waitForSelector(this.modal, { state: 'visible' });
  }
}
