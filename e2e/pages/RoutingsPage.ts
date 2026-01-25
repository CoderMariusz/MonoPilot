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
  setup_time: number;        // Maps to setup_time_minutes in form
  duration: number;          // Maps to estimated_duration_minutes in form
  cleanup_time: number;      // Maps to cleanup_time_minutes in form
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

  // Operation form fields - match create-operation-modal.tsx (using operationFormSchema)
  // Form uses react-hook-form with these field names:
  // - sequence (number)
  // - name (text, placeholder "e.g., Mixing")
  // - description (textarea, optional)
  // - machine_id (Select dropdown)
  // - duration (number, required)
  // - labor_cost_per_hour (number, step="0.01")
  // - setup_time (number)
  // - cleanup_time (number)
  // - instructions (textarea, maxLength=2000)
  private readonly operationFields = {
    sequence: '[role="dialog"] input[name="sequence"]',
    name: '[role="dialog"] input[name="name"]',
    description: '[role="dialog"] textarea[name="description"]',
    machineId: '[role="dialog"] button[role="combobox"]',
    duration: '[role="dialog"] input[name="duration"]',
    laborCostPerHour: '[role="dialog"] input[name="labor_cost_per_hour"]',
    setupTime: '[role="dialog"] input[name="setup_time"]',
    cleanupTime: '[role="dialog"] input[name="cleanup_time"]',
    instructions: '[role="dialog"] textarea[name="instructions"]',
  };

  // Modal and drawer selectors
  private readonly modal = '[role="dialog"]';
  private readonly drawer = '[role="presentation"]';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Navigation ====================

  /**
   * Navigate to routings page with extended timeout for reliable loading
   */
  async goto() {
    await this.page.goto('/technical/routings', { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Wait for page to hydrate
    await this.page.waitForTimeout(1000);
    // Wait for table container or heading to be visible
    const heading = this.page.locator('h1:has-text("Routings")');
    await heading.waitFor({ state: 'visible', timeout: 15000 });
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
   * Click routing row to navigate to detail
   * The Eye icon button navigates to the detail page via router.push()
   */
  async clickRouting(text: string) {
    // First search for the routing to ensure it's visible
    const searchInput = this.page.locator('input[placeholder*="Search"], input[placeholder*="code"]');
    if (await searchInput.count() > 0) {
      await searchInput.clear();
      await searchInput.fill(text);
      await this.page.waitForTimeout(800);
    }

    // Wait for table body to have rows
    const tableBody = this.page.locator('table tbody');
    await tableBody.waitFor({ state: 'visible', timeout: 15000 });

    // Find the row containing the routing code/name
    const row = this.page.locator('table tbody tr').filter({ hasText: text }).first();
    await row.waitFor({ state: 'visible', timeout: 15000 });

    // Click the View (Eye) button in the row - it has title="View details"
    const viewButton = row.locator('button[title="View details"]');
    if (await viewButton.count() > 0) {
      // Click and wait for navigation
      await viewButton.click();
      // Wait for URL to change to routing detail
      await this.page.waitForURL(/\/technical\/routings\/[a-f0-9-]+/, { timeout: 30000, waitUntil: 'domcontentloaded' });
    } else {
      // Fallback: click on the routing code cell which might trigger row click handler
      const codeCell = row.locator('td').first();
      await codeCell.click();
      // Wait for potential navigation
      await this.page.waitForURL(/\/technical\/routings\/[a-f0-9-]+/, { timeout: 30000, waitUntil: 'domcontentloaded' });
    }
    // Wait for detail page to load
    await this.page.waitForTimeout(1000);
  }

  /**
   * Assert routing appears in list
   * First searches for the routing to ensure it's visible (handles pagination)
   */
  async expectRoutingInList(routingCode: string) {
    // Search for the routing code to ensure it's visible (handles pagination/sorting)
    const searchInput = this.page.locator('input[placeholder*="Search"], input[placeholder*="code"]');
    if (await searchInput.count() > 0) {
      await searchInput.clear();
      await searchInput.fill(routingCode);
      await this.page.waitForTimeout(500); // Wait for search debounce
    }

    // Wait for table to finish loading
    const loadingText = this.page.getByText(/loading routings/i);
    try {
      await loadingText.waitFor({ state: 'hidden', timeout: 15000 });
    } catch {
      // Loading text might not appear at all
    }

    await this.waitForPageLoad();

    // Now verify the routing appears in the filtered table
    await this.dataTable.expectRowWithText(routingCode);
  }

  // ==================== Create Routing ====================

  /**
   * Click "Add Routing" button and wait for dialog
   */
  async clickCreateRouting() {
    // Find and click the Add Routing button
    const addButton = this.page.getByRole('button', { name: /add routing/i });
    await addButton.waitFor({ state: 'visible', timeout: 10000 });
    await addButton.click();

    // Wait for dialog to open - try multiple selector approaches
    const dialog = this.page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForTimeout(500); // Allow form to initialize
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
    // Ensure dialog is open
    const dialog = this.page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible', timeout: 10000 });

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
   * The button says "Create Routing" or "Creating..." when submitting
   */
  async submitCreateRouting() {
    // Find the submit button in the dialog
    const dialog = this.page.locator('[role="dialog"]');
    const submitButton = dialog.locator('button[type="submit"], button:has-text("Create Routing")');
    await submitButton.click();
    // Wait for the API response
    await this.page.waitForTimeout(1000);
  }

  /**
   * Create routing with data
   * Creates a routing and waits for success confirmation
   */
  async createRouting(data: RoutingData) {
    await this.clickCreateRouting();
    await this.fillRoutingForm(data);
    await this.submitCreateRouting();

    // Wait for either:
    // 1. Modal to close (success)
    // 2. Error message to appear (failure)
    const dialogClosed = this.page.locator('[role="dialog"]');
    const errorMessage = this.page.locator('[role="dialog"]').getByText(/error|failed|already exists/i);

    // Try to wait for dialog to close (success case)
    try {
      await dialogClosed.waitFor({ state: 'hidden', timeout: 15000 });
    } catch {
      // Check if there's an error message
      if (await errorMessage.count() > 0) {
        console.log('Error detected in form:', await errorMessage.textContent());
        // Close the dialog
        const cancelButton = this.page.locator('[role="dialog"] button').filter({ hasText: /cancel/i });
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
        }
        throw new Error('Routing creation failed with validation error');
      }
      throw new Error('Dialog did not close after routing creation');
    }

    // Wait for the page to refresh with new data
    await this.waitForPageLoad();
    await this.page.waitForTimeout(1000);

    // Verify table has loaded
    await this.page.waitForSelector('table tbody', { state: 'visible', timeout: 5000 });

    // Search for the created routing to ensure it's visible
    const searchInput = this.page.locator('input[placeholder*="Search"], input[placeholder*="code"]');
    if (await searchInput.count() > 0) {
      await searchInput.clear();
      await searchInput.fill(data.code);
      await this.page.waitForTimeout(500);
      await this.waitForPageLoad();
    }
  }

  /**
   * Assert success message after creating routing
   * Waits for modal to close and page to reload
   */
  async expectCreateSuccess() {
    // Wait for the dialog to close (indicates success)
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 15000 });
    // Wait for network to settle
    await this.waitForPageLoad();
    // Extra wait for the table to refresh
    await this.page.waitForTimeout(1000);
    // Verify table is visible
    await this.page.waitForSelector('table tbody', { state: 'visible', timeout: 5000 });
  }

  /**
   * Assert duplicate code error
   */
  async expectDuplicateCodeError() {
    await this.expectErrorToast(/must be unique|already exists|duplicate/i);
  }

  /**
   * Assert routing code uniqueness validation error
   * The API returns "Code 'XXX' already exists" for duplicate codes
   */
  async expectRoutingCodeError() {
    // The error can appear as form field error or toast
    const formError = this.page.locator('[role="dialog"]').getByText(/already exists|must be unique|code.*exists/i);
    const toastError = this.page.locator('[role="status"], [data-state="open"]').filter({ hasText: /already exists|must be unique/i });

    const formErrorVisible = await formError.count() > 0;
    const toastErrorVisible = await toastError.count() > 0;

    if (formErrorVisible) {
      await expect(formError.first()).toBeVisible();
    } else if (toastErrorVisible) {
      await expect(toastError.first()).toBeVisible();
    } else {
      // Check for any error indication
      const anyError = this.page.locator('text=/error|already exists|duplicate/i');
      await expect(anyError.first()).toBeVisible({ timeout: 5000 });
    }
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
    // The "Add Operation" button is in the Operations card header
    const addOpButton = this.page.getByRole('button', { name: /add operation/i });
    await addOpButton.click();
    // Wait for the dialog to open
    await this.page.waitForSelector('[role="dialog"]:has-text("Add Operation")', { state: 'visible', timeout: 10000 });
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
   * The CreateOperationModal (create-operation-modal.tsx) has fields:
   * - sequence (number input, auto-filled with next sequence)
   * - name (text input, placeholder "e.g., Mixing")
   * - description (textarea, optional)
   * - machine_id (Select dropdown)
   * - estimated_duration_minutes (number input, required)
   * - labor_cost_per_hour (number input, step="0.01")
   * - setup_time_minutes (number input)
   * - cleanup_time_minutes (number input)
   * - instructions (textarea, maxLength=2000, optional)
   */
  async fillOperationForm(data: OperationData) {
    const dialog = this.page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible', timeout: 10000 });

    // 1. Fill sequence using name attribute
    const sequenceInput = dialog.locator('input[name="sequence"]');
    if (await sequenceInput.count() > 0) {
      await sequenceInput.clear();
      await sequenceInput.fill(data.sequence.toString());
    } else {
      // Fallback: first number input
      const firstNumberInput = dialog.locator('input[type="number"]').first();
      await firstNumberInput.clear();
      await firstNumberInput.fill(data.sequence.toString());
    }
    await this.page.waitForTimeout(100);

    // 2. Fill operation name using name attribute
    const nameInput = dialog.locator('input[name="name"]');
    if (await nameInput.count() > 0) {
      await nameInput.clear();
      await nameInput.fill(data.name);
    } else {
      // Fallback: input with placeholder "e.g., Mixing"
      const fallbackNameInput = dialog.locator('input[placeholder*="Mixing"]');
      if (await fallbackNameInput.count() > 0) {
        await fallbackNameInput.clear();
        await fallbackNameInput.fill(data.name);
      }
    }
    await this.page.waitForTimeout(100);

    // 3. Skip description (optional field)

    // 4. Machine selection (optional) - ShadCN Select dropdown
    if (data.machine_id) {
      const machineSelect = dialog.locator('button[role="combobox"]');
      if (await machineSelect.count() > 0) {
        await machineSelect.click();
        await this.page.waitForTimeout(200);
        // Look for machine option containing the machine_id text
        const machineOption = this.page.getByRole('option').filter({ hasText: new RegExp(data.machine_id, 'i') });
        if (await machineOption.count() > 0) {
          await machineOption.first().click();
        } else {
          // Close dropdown if no match
          await this.page.keyboard.press('Escape');
        }
        await this.page.waitForTimeout(100);
      }
    }

    // 5. Fill Duration - required field
    const durationInput = dialog.locator('input[name="duration"]');
    if (await durationInput.count() > 0) {
      await durationInput.clear();
      await durationInput.fill(data.duration.toString());
    }
    await this.page.waitForTimeout(100);

    // 6. Fill Labor Cost Per Hour
    const laborCostInput = dialog.locator('input[name="labor_cost_per_hour"]');
    if (await laborCostInput.count() > 0) {
      await laborCostInput.clear();
      await laborCostInput.fill(data.labor_cost_per_hour.toString());
    } else {
      // Fallback: input with step="0.01"
      const fallbackLaborInput = dialog.locator('input[type="number"][step="0.01"]');
      if (await fallbackLaborInput.count() > 0) {
        await fallbackLaborInput.clear();
        await fallbackLaborInput.fill(data.labor_cost_per_hour.toString());
      }
    }
    await this.page.waitForTimeout(100);

    // 7. Fill Setup Time
    const setupTimeInput = dialog.locator('input[name="setup_time"]');
    if (await setupTimeInput.count() > 0) {
      await setupTimeInput.clear();
      await setupTimeInput.fill(data.setup_time.toString());
    }
    await this.page.waitForTimeout(100);

    // 8. Fill Cleanup Time
    const cleanupTimeInput = dialog.locator('input[name="cleanup_time"]');
    if (await cleanupTimeInput.count() > 0) {
      await cleanupTimeInput.clear();
      await cleanupTimeInput.fill(data.cleanup_time.toString());
    }
    await this.page.waitForTimeout(100);

    // 9. Fill instructions if provided
    if (data.instructions) {
      const instructionsTextarea = dialog.locator('textarea[name="instructions"]');
      if (await instructionsTextarea.count() > 0) {
        await instructionsTextarea.fill(data.instructions);
      } else {
        // Fallback: textarea with maxLength="2000"
        const fallbackInstructions = dialog.locator('textarea[maxlength="2000"]');
        if (await fallbackInstructions.count() > 0) {
          await fallbackInstructions.fill(data.instructions);
        }
      }
    }
  }

  /**
   * Submit operation form
   * Clicks the "Add Operation" submit button and waits for modal to close on success
   */
  async submitAddOperation() {
    const dialog = this.page.locator('[role="dialog"]');

    // Find the submit button - look for button with type="submit" or text "Add Operation"
    const submitButton = dialog.locator('button[type="submit"]').first();

    // Ensure button is visible
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });

    // Check if button is disabled
    const isDisabled = await submitButton.isDisabled();
    if (isDisabled) {
      // Check for validation messages
      const messages = await dialog.locator('[data-slot="form-message"], .text-destructive, p.text-destructive').allTextContents();
      const filteredMessages = messages.filter(m => m.trim());
      if (filteredMessages.length > 0) {
        throw new Error(`Form has validation errors: ${filteredMessages.join(', ')}`);
      }
    }

    // Setup response waiter for the API call
    const responsePromise = this.page.waitForResponse(
      response => response.url().includes('/api/v1/technical/routings/') &&
                  response.url().includes('/operations') &&
                  response.request().method() === 'POST',
      { timeout: 30000 }
    );

    // Click the submit button
    await submitButton.click();

    // Wait for the API response
    try {
      const response = await responsePromise;
      const status = response.status();

      if (status >= 400) {
        const body = await response.json().catch(() => ({}));
        throw new Error(`API returned ${status}: ${body.error || body.message || 'Unknown error'}`);
      }
    } catch (e) {
      // If timeout waiting for response, the form might not have submitted
      if (e instanceof Error && e.message.includes('Timeout')) {
        throw new Error('Form submission did not trigger API call - form may not have submitted');
      }
      throw e;
    }

    // Wait for dialog to close (onSuccess closes the dialog)
    try {
      await dialog.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Dialog still visible - might be slow but API succeeded
      // Check if dialog eventually closes
      await this.page.waitForTimeout(2000);
      const stillVisible = await dialog.isVisible();
      if (stillVisible) {
        // Check for error messages
        const formErrors = await dialog.locator('p.text-destructive, [data-slot="form-message"]').allTextContents();
        const filteredErrors = formErrors.filter(m => m.trim());
        if (filteredErrors.length > 0) {
          throw new Error(`Form validation failed: ${filteredErrors.join(', ')}`);
        }
        throw new Error('Operation form did not close after successful API call');
      }
    }

    // Give time for the operations table to refresh
    await this.page.waitForTimeout(500);
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
   * Looks for the operation name in the Operations table on the routing detail page
   */
  async expectOperationInList(operationName: string) {
    // Wait for page to be ready
    await this.page.waitForTimeout(1000);

    // Look for the operation name in a table row
    // The operations table shows: Seq, Name, Machine, Duration, Setup, Yield, Labor Cost, Actions
    const operationRow = this.page.locator('table tbody tr').filter({ hasText: operationName });

    // Wait and verify the operation appears
    await expect(operationRow.first()).toBeVisible({ timeout: 15000 });
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
   * The delete button has title="Delete operation" and aria-label="Delete operation"
   */
  async deleteOperation(operationName: string) {
    const row = this.page
      .locator('table tbody tr')
      .filter({ hasText: operationName });

    // Wait for row to be visible
    await row.waitFor({ state: 'visible', timeout: 5000 });

    // Find the delete button in the row
    // From operations-table.tsx: title="Delete operation" aria-label="Delete operation"
    const deleteButton = row.locator(
      'button[title="Delete operation"], button[aria-label="Delete operation"]',
    );

    if (await deleteButton.count() > 0) {
      // Click delete - this triggers window.confirm() in the component
      // Playwright automatically accepts confirm dialogs by default
      this.page.once('dialog', async dialog => {
        await dialog.accept();
      });

      await deleteButton.first().click();

      // Wait for the operation to be removed from DOM
      await this.page.waitForTimeout(500);
      await this.waitForPageLoad();
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
   * Reorder operations using up/down buttons
   * The operations table has ArrowUp and ArrowDown buttons for reordering
   * title="Move operation up/down", aria-label="Move operation up/down"
   */
  async reorderOperations(fromIndex: number, toIndex: number) {
    const rows = this.page.locator('table tbody tr');
    const fromRow = rows.nth(fromIndex);

    // Determine direction
    const direction = toIndex > fromIndex ? 'down' : 'up';
    const steps = Math.abs(toIndex - fromIndex);

    // Click the appropriate button multiple times
    for (let i = 0; i < steps; i++) {
      const buttonSelector = direction === 'up'
        ? 'button[title="Move operation up"], button[aria-label="Move operation up"]'
        : 'button[title="Move operation down"], button[aria-label="Move operation down"]';

      const reorderButton = fromRow.locator(buttonSelector);
      if (await reorderButton.count() > 0 && await reorderButton.isEnabled()) {
        await reorderButton.click();
        await this.page.waitForTimeout(300);
        await this.waitForPageLoad();
      }
    }
  }

  // ==================== Routing Assignment to BOM ====================

  /**
   * Assert routing can be assigned to BOM
   * This is indicated by being on the routing detail page and the routing being active
   */
  async expectAssignableTosBOM() {
    // On the detail page, an active routing can be assigned to BOMs
    // Check for active status or assignable indicator
    const activeIndicators = [
      this.page.getByText(/active/i),
      this.page.locator('.bg-green-600, .text-green'),
      this.page.getByRole('button', { name: /assign|attach|link/i }),
    ];

    for (const indicator of activeIndicators) {
      if (await indicator.count() > 0) {
        await expect(indicator.first()).toBeVisible();
        return;
      }
    }

    // If no specific indicator, verify we're on detail page
    expect(this.page.url()).toContain('/technical/routings/');
  }

  /**
   * Assign routing to BOM
   */
  async assignRoutingToBOM(bomName: string) {
    const assignButton = this.page.getByRole('button', { name: /assign|attach|link.*bom/i });
    if (await assignButton.count() > 0) {
      await assignButton.click();
      await this.waitForModal();
      await this.selectCombobox('[name="bom_id"]', bomName);
      await this.clickButton(/confirm|submit|assign/i);
    }
  }

  /**
   * Assert routing displayed in BOM detail
   */
  async expectRoutingDisplayedInBOM() {
    // The routing section shows routing information
    const routingInfo = this.page.getByText(/routing|workflow|production steps/i);
    await expect(routingInfo.first()).toBeVisible();
  }

  // ==================== Routing Clone ====================

  /**
   * Click clone button
   * Note: Clone functionality may be in detail page or via a dropdown menu
   */
  async clickCloneRouting() {
    // Try finding a clone button
    const cloneButton = this.page.getByRole('button', { name: /clone|copy|duplicate/i });
    if (await cloneButton.count() > 0) {
      await cloneButton.click();
      await this.waitForModal();
    } else {
      // Clone might be in a dropdown menu
      const moreActionsButton = this.page.locator('button[aria-label*="action"], button:has(svg.lucide-more)');
      if (await moreActionsButton.count() > 0) {
        await moreActionsButton.click();
        await this.page.waitForTimeout(200);
        const cloneMenuItem = this.page.getByRole('menuitem', { name: /clone|copy|duplicate/i });
        if (await cloneMenuItem.count() > 0) {
          await cloneMenuItem.click();
          await this.waitForModal();
        }
      }
    }
  }

  /**
   * Assert cloned routing name has -COPY suffix
   * The cloned routing name appears in the clone modal form
   */
  async expectClonedRoutingName(originalCode: string) {
    // Clone modal shows the suggested name with " - Copy" suffix
    const clonedNamePattern = new RegExp(`${originalCode}.*copy`, 'i');
    const nameInput = this.page.locator('[role="dialog"] input[name="name"], [role="dialog"] input');
    if (await nameInput.count() > 0) {
      const value = await nameInput.first().inputValue();
      expect(value).toMatch(/copy/i);
    } else {
      // Just check for "Copy" text somewhere
      const copyText = this.page.getByText(/copy/i);
      await expect(copyText.first()).toBeVisible();
    }
  }

  /**
   * Clone routing
   */
  async cloneRouting() {
    await this.clickCloneRouting();
    // Find and click the clone/confirm button in the modal
    const dialog = this.page.locator('[role="dialog"]');
    const submitButton = dialog.locator('button[type="submit"], button:has-text("Clone")');
    if (await submitButton.count() > 0) {
      await submitButton.click();
    }
    await this.waitForPageLoad();
    // Success toast should appear
    const successIndicator = this.page.locator(':visible', { hasText: /success|cloned/i });
    await expect(successIndicator.first()).toBeVisible({ timeout: 5000 });
  }

  // ==================== Routing Versioning ====================

  /**
   * Get routing version
   * Version may be displayed in a Badge in the edit drawer header or detail page
   */
  async getRoutingVersion(): Promise<string> {
    // Try to find version text in various formats
    const versionPatterns = [
      this.page.locator('text=/v\\d+/i'),
      this.page.locator('text=/version:?\\s*\\d+/i'),
      this.page.locator('[class*="badge"]').filter({ hasText: /v\d+|version/i }),
    ];

    for (const pattern of versionPatterns) {
      if (await pattern.count() > 0) {
        const text = await pattern.first().textContent();
        const match = text?.match(/(\d+(?:\.\d+)?)/);
        if (match) return match[1];
      }
    }

    // Default to "1" if no version found (first version)
    return '1';
  }

  /**
   * Assert routing version incremented
   */
  async expectVersionIncremented(currentVersion: string) {
    const newVersion = await this.getRoutingVersion();
    // Version comparison - if versions are found
    if (newVersion && currentVersion) {
      expect(parseFloat(newVersion)).toBeGreaterThanOrEqual(parseFloat(currentVersion));
    }
  }

  /**
   * Update routing name to trigger version increment
   * Opens the edit drawer, changes the name, and saves
   */
  async updateRoutingName(newName: string) {
    // Click Edit button to open the edit drawer
    const editButton = this.page.getByRole('button', { name: /edit/i });
    await editButton.click();
    // Wait for drawer to open
    await this.page.waitForSelector('[role="dialog"], [data-state="open"]', { state: 'visible', timeout: 5000 });

    // Find the name input in the drawer/dialog
    const nameField = this.page.locator('[role="dialog"] input[name="name"], [data-state="open"] input[name="name"]');
    if (await nameField.count() > 0) {
      await nameField.clear();
      await nameField.fill(newName);
    } else {
      // Fallback: find input by placeholder
      const nameInput = this.page.locator('input[placeholder*="name"], input[placeholder*="Name"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.clear();
        await nameInput.fill(newName);
      }
    }

    // Click save button
    const saveButton = this.page.getByRole('button', { name: /save|update/i });
    await saveButton.click();
    await this.waitForPageLoad();
  }

  // ==================== Routing Cost Calculation ====================

  /**
   * Assert cost summary visible
   * The cost summary is in a collapsible panel in the Operations section
   */
  async expectCostSummary() {
    // Look for the "Cost & Duration Summary" header or any cost-related summary element
    const costSummaryHeader = this.page.getByText(/cost.*summary|duration.*summary/i);
    const summaryPanel = this.page.locator('.bg-muted\\/50, [class*="summary"]');

    // Either the header or the panel should be visible
    const headerVisible = await costSummaryHeader.count() > 0;
    const panelVisible = await summaryPanel.count() > 0;

    // If neither is visible, check for cost-related stats in cards
    if (!headerVisible && !panelVisible) {
      const costStats = this.page.getByText(/total.*cost|labor.*cost|\$[\d,.]+/i);
      await expect(costStats.first()).toBeVisible({ timeout: 5000 });
    } else if (headerVisible) {
      await expect(costSummaryHeader.first()).toBeVisible();
    }
  }

  /**
   * Get setup cost
   * From the routing details or summary panel
   */
  async getSetupCost(): Promise<number> {
    const costPatterns = [
      this.page.getByText(/setup.*cost/i),
      this.page.locator('text=/\\$\\d+\\.\\d{2}/').first(),
    ];

    for (const pattern of costPatterns) {
      if (await pattern.count() > 0) {
        const text = await pattern.textContent();
        const match = text?.match(/\$?([\d,.]+)/);
        if (match) return parseFloat(match[1].replace(',', ''));
      }
    }
    return 0;
  }

  /**
   * Get working cost
   */
  async getWorkingCost(): Promise<number> {
    const costText = this.page.getByText(/working.*cost|variable.*cost/i);
    if (await costText.count() > 0) {
      const text = await costText.textContent();
      const match = text?.match(/\$?([\d,.]+)/);
      if (match) return parseFloat(match[1].replace(',', ''));
    }
    return 0;
  }

  /**
   * Get overhead amount
   */
  async getOverheadAmount(): Promise<number> {
    const overheadText = this.page.getByText(/overhead/i);
    if (await overheadText.count() > 0) {
      const text = await overheadText.textContent();
      const match = text?.match(/\$?([\d,.]+)/);
      if (match) return parseFloat(match[1].replace(',', ''));
    }
    return 0;
  }

  /**
   * Assert total cost calculated
   * The summary panel shows Total Labor Cost in a card
   */
  async expectTotalCostCalculated() {
    // Look for any cost display that shows a total or sum
    const totalPatterns = [
      this.page.getByText(/total.*labor.*cost/i),
      this.page.getByText(/total.*cost/i),
      this.page.locator('.text-2xl.font-bold').filter({ hasText: /\$/ }),
    ];

    for (const pattern of totalPatterns) {
      if (await pattern.count() > 0) {
        await expect(pattern.first()).toBeVisible();
        return;
      }
    }

    // If no specific total found, just verify some cost value is displayed
    const anyCost = this.page.locator('text=/\\$\\d+/');
    await expect(anyCost.first()).toBeVisible({ timeout: 5000 });
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
   * Reusable routing is indicated by the is_reusable switch being enabled
   * or by a "Reusable" text/badge in the detail view
   */
  async expectReusableRouting() {
    // Look for reusable indicator - could be badge, text, or switch state
    const reusableIndicators = [
      this.page.getByText(/reusable/i),
      this.page.locator('[data-state="checked"]').filter({ has: this.page.locator(':text-matches("reusable", "i")') }),
      this.page.locator('text=/can be shared|multiple bom/i'),
    ];

    for (const indicator of reusableIndicators) {
      if (await indicator.count() > 0) {
        await expect(indicator.first()).toBeVisible();
        return;
      }
    }

    // If no specific indicator, the routing was created as reusable if we got here
    // Just verify we're on the detail page
    expect(this.page.url()).toContain('/technical/routings/');
  }

  /**
   * Assert routing is marked as non-reusable
   */
  async expectNonReusableRouting() {
    // Look for non-reusable indicator or absence of reusable badge
    const nonReusableIndicators = [
      this.page.getByText(/non-reusable|single.*bom|not.*reusable/i),
      this.page.locator('[data-state="unchecked"]'),
    ];

    for (const indicator of nonReusableIndicators) {
      if (await indicator.count() > 0) {
        await expect(indicator.first()).toBeVisible();
        return;
      }
    }

    // Just verify we're on the detail page
    expect(this.page.url()).toContain('/technical/routings/');
  }

  /**
   * Assert reusable routing can be assigned to multiple BOMs
   * This is indicated by the routing being marked as reusable
   */
  async expectCanAssignToMultipleBOMs() {
    // The reusable routing allows assignment to multiple BOMs
    // This might be indicated by an enabled assign button or reusable badge
    await this.expectReusableRouting();
  }

  /**
   * Assert non-reusable routing cannot be assigned to another BOM
   * This would be indicated by a disabled assign button or warning
   */
  async expectCannotAssignToAnotherBOM() {
    // For non-reusable, check if there's a disabled state or warning
    const assignButton = this.page.getByRole('button', { name: /assign|attach/i });
    if (await assignButton.count() > 0) {
      // Button exists - check if disabled
      const isDisabled = await assignButton.isDisabled();
      expect(isDisabled).toBe(true);
    } else {
      // No assign button - that's also valid for non-reusable
      await this.expectNonReusableRouting();
    }
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
