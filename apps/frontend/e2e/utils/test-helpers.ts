import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  async login(email: string = 'przyslony@gmail.com', password: string = 'Test1234') {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
    
    // Fill form
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    
    // Submit and wait for navigation
    await this.page.click('button[type="submit"]');
    
    // Give Supabase time to issue the session cookie
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const start = Date.now();
    while (Date.now() - start < 15000) {
      const currentUrl = this.page.url();

      if (!currentUrl.includes('/login')) {
        break;
      }

      let returnTo: string | null = null;
      try {
        returnTo = new URL(currentUrl).searchParams.get('returnTo');
      } catch (error) {
        console.warn('Failed to parse returnTo from URL:', currentUrl, error);
      }

      if (returnTo) {
        await this.page.goto(returnTo);
      } else {
        await this.page.goto('/');
      }

      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      await this.page.waitForTimeout(250);
    }

    // Final check - make sure we're not still on the login page
    const finalUrl = this.page.url();
    if (finalUrl.includes('/login')) {
      const errorToast = this.page.locator('.toast');
      if (await errorToast.count() > 0) {
        const errorText = await errorToast.textContent();
        throw new Error(`Login failed: ${errorText}`);
      }

      throw new Error(`Login failed: still on login page (${finalUrl})`);
    }

    // Allow UI to settle
    await this.page.waitForTimeout(1000);
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
    // Use the more specific search input for BOM table
    const searchInput = this.page.locator('input[placeholder*="Search by item # or name"]');
    await searchInput.fill(searchTerm);
    await this.page.keyboard.press('Enter');
  }

  async clearSearch() {
    const searchInput = this.page.locator('input[placeholder*="Search by item # or name"]');
    await searchInput.clear();
    await this.page.keyboard.press('Enter');
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

  // BOM-specific methods
  async openAddItemModal() {
    await this.page.click('button:has-text("Add Item")');
    // Wait for modal to appear
    await this.waitForModal('Add Item');
  }

  async selectCategory(category: string) {
    // In the modal, categories are buttons, not a select dropdown
    // Map category codes to display names
    const categoryMap: Record<string, string> = {
      'MEAT': 'Meat',
      'DRYGOODS': 'Dry Goods', 
      'FINISHED_GOODS': 'Finished Goods',
      'PROCESS': 'Process'
    };
    
    const displayName = categoryMap[category] || category;
    await this.page.click(`button:has-text("${displayName}")`);
  }

  async cleanupTestProduct(partNumber: string) {
    try {
      // Navigate to BOM if not already there
      if (!this.page.url().includes('/technical/bom')) {
        await this.navigateToBOM();
      }
      
      // Search for the product
      await this.searchInTable(partNumber);
      
      // Find and delete the product
      const row = this.page.locator(`tr:has-text("${partNumber}")`);
      if (await row.count() > 0) {
        await row.locator('button:has-text("Delete")').click();
        await this.page.click('button:has-text("Confirm"), button:has-text("Delete")');
        await this.waitForToast('Product deleted successfully');
      }
      
      // Clear search
      await this.clearSearch();
    } catch (error) {
      console.warn(`Failed to cleanup product ${partNumber}:`, error);
    }
  }

  // Product form methods
  async fillProductForm(data: {
    partNumber: string;
    description: string;
    uom: string;
    std_price: string;
    rate?: string;
    shelfLifeDays?: string;
    leadTimeDays?: string;
    moq?: string;
    notes?: string;
  }) {
    // Use placeholder-based selectors since inputs don't have name attributes
    await this.page.fill('input[placeholder="e.g., MT-001"]', data.partNumber);
    await this.page.fill('input[placeholder="Product name"]', data.description);
    await this.page.fill('input[placeholder="e.g., KG, LB, EA"]', data.uom);
    await this.page.fill('input[placeholder="0.00"]', data.std_price);
    
    // Fill rate if provided (required for FINISHED_GOODS)
    if (data.rate) {
      await this.page.fill('input[placeholder="e.g., 100"]', data.rate);
    }
    
    // Fill shelf life days if provided (only for MEAT and PROCESS)
    if (data.shelfLifeDays) {
      // Try to find shelf life input more specifically
      const shelfLifeInput = this.page.locator('input[placeholder="e.g., 30"]').first();
      if (await shelfLifeInput.count() > 0) {
        await shelfLifeInput.fill(data.shelfLifeDays);
      }
    }
    
    // Fill lead time days if provided
    if (data.leadTimeDays) {
      const leadTimeInput = this.page.locator('input[placeholder="e.g., 7"]');
      if (await leadTimeInput.count() > 0) {
        await leadTimeInput.fill(data.leadTimeDays);
      }
    }
    
    // Fill MOQ if provided
    if (data.moq) {
      const moqInput = this.page.locator('input[placeholder="e.g., 50.0"]');
      if (await moqInput.count() > 0) {
        await moqInput.fill(data.moq);
      }
    }
    
    // Fill notes if provided
    if (data.notes) {
      const notesInput = this.page.locator('textarea[placeholder="Additional notes..."]');
      if (await notesInput.count() > 0) {
        await notesInput.fill(data.notes);
      }
    }
  }

  async addBomComponent() {
    await this.page.click('button:has-text("Add Component")');
  }

  async fillBomComponent(index: number, data: {
    materialId?: number;
    quantity: string;
    unitCost?: string;
  }) {
    // Select material from dropdown - use specific selector for BOM components section
    if (data.materialId) {
      // Find ALL selects on the page
      const allSelects = await this.page.locator('select').count();
      console.log(`Total selects on page: ${allSelects}`);
      
      // Find the select within the BOM components section (after "BOM Components" label)
      // The BOM components section starts after production lines, so we need to find selects AFTER the label "BOM Components"
      const bomSection = this.page.locator('label:has-text("BOM Components")').locator('xpath=following::select').nth(index);
      await bomSection.waitFor({ state: 'visible' });
      
      // Debug: Check if select has options
      const options = await bomSection.locator('option').count();
      console.log(`BOM component select has ${options} options`);
      
      // Try to select by value (ID 1 = RM-BEEF-001) and trigger change event
      await bomSection.click();
      await bomSection.selectOption({ value: '1' });
      console.log('Successfully selected BOM component material');
      
      // Force React to update by triggering multiple events
      await bomSection.dispatchEvent('change');
      await bomSection.dispatchEvent('input');
      await bomSection.dispatchEvent('blur');
      
      // Also try to trigger focus and change again
      await bomSection.focus();
      await bomSection.dispatchEvent('change');
      
      // Wait for React to process the change and auto-populate UoM
      await this.page.waitForTimeout(1000);
    }
    
    // Fill quantity - use more specific selector within BOM section
    const quantityInput = this.page.locator('label:has-text("BOM Components")').locator('xpath=following::input[contains(@placeholder, "Quantity")]').nth(index);
    await quantityInput.fill(data.quantity);
    
    // Fill unit cost if provided
    if (data.unitCost) {
      const unitCostInput = this.page.locator('label:has-text("BOM Components")').locator('xpath=following::input[contains(@placeholder, "0.00")]').nth(index);
      await unitCostInput.fill(data.unitCost);
    }
  }

  async selectProductionLines(lines: string[] = ['ALL']) {
    // Click on production lines dropdown
    await this.page.click('button:has-text("Select lines..."), button:has-text("All lines")');
    
    // Wait for dropdown to open
    await this.page.waitForSelector('input[type="checkbox"]', { timeout: 5000 });
    
    // Select lines
    for (const line of lines) {
      if (line === 'ALL') {
        // Find the checkbox for "All lines" option
        const allLinesCheckbox = this.page.locator('input[type="checkbox"]').first();
        await allLinesCheckbox.check();
      } else {
        // Find checkbox for specific line
        const lineCheckbox = this.page.locator(`input[type="checkbox"]:near(label:has-text("${line}"))`);
        await lineCheckbox.check();
      }
    }
    
    // Click outside to close dropdown
    await this.page.click('body');
  }

  async saveProduct() {
    await this.page.click('button:has-text("Create Item")');
  }

  async verifyToast(message: string) {
    await this.waitForToast(message);
  }

  async debugFormErrors() {
    // Check for any visible error messages in the form
    const errorElements = this.page.locator('.text-red-600, .text-red-500, .border-red-300');
    const errorCount = await errorElements.count();
    
    console.log(`Found ${errorCount} error elements`);
    
    for (let i = 0; i < errorCount; i++) {
      const element = errorElements.nth(i);
      const text = await element.textContent();
      const className = await element.getAttribute('class');
      console.log(`Error ${i}: "${text}" (class: ${className})`);
    }
    
    // Check for any validation errors in the form
    const validationErrors = this.page.locator('[class*="error"], [class*="invalid"]');
    const validationCount = await validationErrors.count();
    
    console.log(`Found ${validationCount} validation error elements`);
    
    for (let i = 0; i < validationCount; i++) {
      const element = validationErrors.nth(i);
      const text = await element.textContent();
      const className = await element.getAttribute('class');
      console.log(`Validation Error ${i}: "${text}" (class: ${className})`);
    }
    
    // Debug form data values
    console.log('=== FORM DATA DEBUG ===');
    
    // Check part_number
    const partNumber = await this.page.inputValue('input[placeholder="e.g., MT-001"]');
    console.log(`part_number: "${partNumber}"`);
    
    // Check description
    const description = await this.page.inputValue('input[placeholder="Product name"]');
    console.log(`description: "${description}"`);
    
    // Check uom
    const uom = await this.page.inputValue('input[placeholder="e.g., KG, LB, EA"]');
    console.log(`uom: "${uom}"`);
    
    // Check price (std_price field)
    const price = await this.page.inputValue('input[placeholder="0.00"]').first();
    console.log(`price: "${price}"`);
    
    // Check rate
    const rate = await this.page.inputValue('input[placeholder="e.g., 100"]');
    console.log(`rate: "${rate}"`);
    
    // Check production lines
    const productionLinesButton = this.page.locator('button:has-text("All lines")').first();
    const productionLinesText = await productionLinesButton.textContent();
    console.log(`production_lines: "${productionLinesText}"`);
    
    // Check BOM component select
    const bomSelect = this.page.locator('label:has-text("BOM Components")').locator('xpath=following::select').first();
    const bomSelectValue = await bomSelect.inputValue();
    console.log(`bom_component_select: "${bomSelectValue}"`);
    
    // Check BOM component quantity
    const bomQuantity = this.page.locator('label:has-text("BOM Components")').locator('xpath=following::input[contains(@placeholder, "Quantity")]').first();
    const bomQuantityValue = await bomQuantity.inputValue();
    console.log(`bom_component_quantity: "${bomQuantityValue}"`);
  }
}
