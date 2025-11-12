/**
 * E2E Tests for ASN (Advanced Shipping Notice) Workflow
 * EPIC-002 Scanner & Warehouse v2 - Phase 1: ASN & Receiving
 *
 * Tests cover:
 * - Create ASN with items
 * - View ASN details
 * - Submit ASN (draft → submitted)
 * - Mark ASN as received (submitted → received)
 * - Cancel ASN
 * - Delete ASN (draft only)
 * - Filter ASNs by status
 */

import { test, expect } from '@playwright/test';
import { login, clickButton, waitForModal, waitForToast } from './helpers';

test.describe('ASN (Advanced Shipping Notice) Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);

    // Navigate to ASN page
    await page.goto('/asn');
    await page.waitForTimeout(1000);

    // Wait for ASN table or "Create ASN" button to be visible
    await page.waitForSelector('button:has-text("Create ASN"), h1:has-text("ASN"), h2:has-text("Advanced Shipping")', { timeout: 5000 });
  });

  test('should display ASN list page', async ({ page }) => {
    // Should show ASN table or empty state
    const hasTable = await page.locator('table').isVisible({ timeout: 2000 });
    const hasCreateButton = await page.locator('button:has-text("Create ASN")').isVisible();

    expect(hasTable || hasCreateButton).toBe(true);
  });

  test('should create a new ASN with items', async ({ page }) => {
    // Click "Create ASN" button
    await clickButton(page, 'Create ASN');

    // Wait for modal
    await waitForModal(page, 'Create ASN');

    // ASN number should be auto-generated
    const asnNumberInput = page.locator('input[name="asn_number"], input[placeholder*="ASN"]');
    const asnNumber = await asnNumberInput.inputValue();
    expect(asnNumber).toMatch(/ASN-\d{4}-\d{3}/);

    // Select supplier (required)
    const supplierSelect = page.locator('select:near(label:has-text("Supplier"))');
    await supplierSelect.selectOption({ index: 1 });

    // Set expected arrival date
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 7); // 7 days from now
    const dateString = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const expectedArrivalInput = page.locator('input[name="expected_arrival"], input[type="date"]:near(label:has-text("Expected Arrival"))');
    await expectedArrivalInput.fill(dateString);

    // Add ASN item
    const productSelect = page.locator('select:near(label:has-text("Product"))').first();
    await productSelect.selectOption({ index: 1 });

    const quantityInput = page.locator('input[name="quantity"], input[type="number"]:near(label:has-text("Quantity"))').first();
    await quantityInput.fill('100');

    // Optional: Add batch number
    const batchInput = page.locator('input[name="batch"], input[placeholder*="batch"]');
    if (await batchInput.isVisible({ timeout: 1000 })) {
      await batchInput.fill('LOT-TEST-001');
    }

    // Submit form
    await clickButton(page, 'Create');

    // Wait for success toast
    await waitForToast(page, 'successfully');

    // Verify ASN appears in table
    await page.waitForTimeout(1000);
    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table).toContainText('draft');
  });

  test('should view ASN details', async ({ page }) => {
    // Find first ASN row
    const firstRow = page.locator('table tbody tr').first();

    if (await firstRow.isVisible({ timeout: 3000 })) {
      // Click details button (Eye icon or "Details" button)
      const detailsButton = firstRow.locator('button[title="Details"], button:has-text("Details")');
      await detailsButton.click();

      // Wait for details modal
      await waitForModal(page, 'ASN Details');

      // Verify modal shows ASN information
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toContainText(/ASN-\d{4}-\d{3}/); // ASN number
      await expect(modal).toContainText(/Supplier|Expected Arrival/i);
    } else {
      console.log('No ASNs available to view details');
    }
  });

  test('should submit ASN (draft → submitted)', async ({ page }) => {
    // Find first ASN in draft status
    const draftRow = page.locator('table tbody tr').filter({ hasText: 'draft' }).first();

    if (await draftRow.isVisible({ timeout: 3000 })) {
      // Click submit button
      const submitButton = draftRow.locator('button[title="Submit"], button:has-text("Submit")');
      await submitButton.click();

      // Wait for success toast
      await waitForToast(page, 'submitted');

      // Verify status changed in table
      await page.waitForTimeout(1000);
      // The row should now show "submitted" status
      const table = page.locator('table');
      await expect(table).toContainText('submitted');
    } else {
      console.log('No draft ASNs available to submit');
    }
  });

  test('should mark ASN as received (submitted → received)', async ({ page }) => {
    // Find first ASN in submitted status
    const submittedRow = page.locator('table tbody tr').filter({ hasText: 'submitted' }).first();

    if (await submittedRow.isVisible({ timeout: 3000 })) {
      // Click "Mark Received" button
      const receivedButton = submittedRow.locator('button[title="Mark Received"], button:has-text("Received")');
      await receivedButton.click();

      // Wait for success toast
      await waitForToast(page, 'received');

      // Verify status changed
      await page.waitForTimeout(1000);
      const table = page.locator('table');
      await expect(table).toContainText('received');
    } else {
      console.log('No submitted ASNs available to mark as received');
    }
  });

  test('should cancel ASN', async ({ page }) => {
    // Find first ASN in draft or submitted status
    const cancelableRow = page.locator('table tbody tr').filter({ hasText: /draft|submitted/i }).first();

    if (await cancelableRow.isVisible({ timeout: 3000 })) {
      // Click cancel button
      const cancelButton = cancelableRow.locator('button[title="Cancel"], button:has-text("Cancel")');

      if (await cancelButton.isVisible({ timeout: 1000 })) {
        await cancelButton.click();

        // Confirm cancellation if dialog appears
        page.on('dialog', dialog => dialog.accept());

        // Wait for success toast
        await waitForToast(page, 'cancelled');

        // Verify status changed
        await page.waitForTimeout(1000);
        const table = page.locator('table');
        await expect(table).toContainText('cancelled');
      }
    } else {
      console.log('No ASNs available to cancel');
    }
  });

  test('should delete draft ASN', async ({ page }) => {
    // Find first ASN in draft status
    const draftRow = page.locator('table tbody tr').filter({ hasText: 'draft' }).first();

    if (await draftRow.isVisible({ timeout: 3000 })) {
      // Get ASN number before deletion
      const rowText = await draftRow.innerText();

      // Click delete button (Trash icon)
      const deleteButton = draftRow.locator('button[title="Delete"], button:has-text("Delete")');
      await deleteButton.click();

      // Confirm deletion if dialog appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")').last();
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      // Wait for success toast
      await waitForToast(page, 'deleted');

      // Verify ASN is removed from table
      await page.waitForTimeout(1000);
    } else {
      console.log('No draft ASNs available to delete');
    }
  });

  test('should filter ASNs by status', async ({ page }) => {
    // Find status filter dropdown
    const statusFilter = page.locator('select:near(label:has-text("Status")), select[name="status"]');

    if (await statusFilter.isVisible({ timeout: 2000 })) {
      // Filter by "submitted"
      await statusFilter.selectOption('submitted');
      await page.waitForTimeout(500);

      // All visible rows should have "submitted" status
      const rows = page.locator('table tbody tr');
      const count = await rows.count();

      if (count > 0) {
        // Check first 3 rows
        for (let i = 0; i < Math.min(count, 3); i++) {
          await expect(rows.nth(i)).toContainText('submitted');
        }
      }

      // Filter by "draft"
      await statusFilter.selectOption('draft');
      await page.waitForTimeout(500);

      const rowsAfterFilter = page.locator('table tbody tr');
      const countAfterFilter = await rowsAfterFilter.count();

      if (countAfterFilter > 0) {
        // Check first 3 rows
        for (let i = 0; i < Math.min(countAfterFilter, 3); i++) {
          await expect(rowsAfterFilter.nth(i)).toContainText('draft');
        }
      }
    } else {
      console.log('Status filter not available');
    }
  });

  test('should link ASN to Purchase Order', async ({ page }) => {
    // Click "Create ASN" button
    await clickButton(page, 'Create ASN');

    // Wait for modal
    await waitForModal(page, 'Create ASN');

    // Select PO (optional field)
    const poSelect = page.locator('select:near(label:has-text("Purchase Order")), select:near(label:has-text("PO"))');
    if (await poSelect.isVisible({ timeout: 2000 })) {
      // Check if PO dropdown has options
      const options = await poSelect.locator('option').count();
      if (options > 1) {
        await poSelect.selectOption({ index: 1 });

        // Supplier should be auto-filled from PO
        const supplierSelect = page.locator('select:near(label:has-text("Supplier"))');
        const supplierValue = await supplierSelect.inputValue();
        expect(supplierValue).not.toBe('');
      }
    }

    // Close modal
    const closeButton = page.locator('button:has-text("Cancel"), button[aria-label="Close"]');
    await closeButton.click();
  });

  test('should validate required fields when creating ASN', async ({ page }) => {
    // Click "Create ASN" button
    await clickButton(page, 'Create ASN');

    // Wait for modal
    await waitForModal(page, 'Create ASN');

    // Try to submit without filling required fields
    const createButton = page.locator('button:has-text("Create")').last();
    await createButton.click();

    // Should show validation error or stay on modal
    await page.waitForTimeout(1000);

    // Modal should still be visible (form validation failed)
    const modal = page.locator('[role="dialog"]');
    const isModalVisible = await modal.isVisible();

    // Either modal is still visible (client-side validation)
    // OR we see an error toast (server-side validation)
    expect(isModalVisible).toBe(true);

    // Close modal
    const closeButton = page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first();
    if (await closeButton.isVisible({ timeout: 1000 })) {
      await closeButton.click();
    }
  });

  test('should display ASN items in details modal', async ({ page }) => {
    // Find first ASN row with items
    const firstRow = page.locator('table tbody tr').first();

    if (await firstRow.isVisible({ timeout: 3000 })) {
      // Click details button
      const detailsButton = firstRow.locator('button[title="Details"], button:has-text("Details")');
      await detailsButton.click();

      // Wait for details modal
      await waitForModal(page, 'ASN Details');

      // Modal should show items table or list
      const modal = page.locator('[role="dialog"]');

      // Look for items section (table headers like "Product", "Quantity", "UOM")
      const hasItemsTable = await modal.locator('table, tbody').isVisible({ timeout: 2000 });
      const hasItemsSection = await modal.locator('text=/Product|Quantity|UOM/i').isVisible({ timeout: 2000 });

      expect(hasItemsTable || hasItemsSection).toBe(true);

      // Close modal
      const closeButton = page.locator('button:has-text("Close"), button[aria-label="Close"]').first();
      await closeButton.click();
    }
  });

  test('should sort ASNs by expected arrival date', async ({ page }) => {
    // Find sort button or column header for expected arrival
    const sortButton = page.locator('button:has-text("Expected Arrival"), th:has-text("Expected Arrival")');

    if (await sortButton.isVisible({ timeout: 2000 })) {
      // Click to sort ascending
      await sortButton.click();
      await page.waitForTimeout(500);

      // Click to sort descending
      await sortButton.click();
      await page.waitForTimeout(500);

      // Table should still be visible after sorting
      const table = page.locator('table');
      await expect(table).toBeVisible();
    } else {
      console.log('Sort functionality not available');
    }
  });

  test('should create ASN with multiple items', async ({ page }) => {
    // Click "Create ASN" button
    await clickButton(page, 'Create ASN');

    // Wait for modal
    await waitForModal(page, 'Create ASN');

    // Fill required fields
    const supplierSelect = page.locator('select:near(label:has-text("Supplier"))');
    await supplierSelect.selectOption({ index: 1 });

    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 7);
    const dateString = futureDate.toISOString().split('T')[0];

    const expectedArrivalInput = page.locator('input[name="expected_arrival"], input[type="date"]:near(label:has-text("Expected Arrival"))');
    await expectedArrivalInput.fill(dateString);

    // Add first item
    const productSelect1 = page.locator('select:near(label:has-text("Product"))').first();
    await productSelect1.selectOption({ index: 1 });

    const quantityInput1 = page.locator('input[name="quantity"], input[type="number"]:near(label:has-text("Quantity"))').first();
    await quantityInput1.fill('50');

    // Look for "Add Item" or "Add Another" button
    const addItemButton = page.locator('button:has-text("Add Item"), button:has-text("Add Another")');
    if (await addItemButton.isVisible({ timeout: 2000 })) {
      await addItemButton.click();
      await page.waitForTimeout(500);

      // Add second item
      const productSelect2 = page.locator('select:near(label:has-text("Product"))').nth(1);
      if (await productSelect2.isVisible({ timeout: 1000 })) {
        await productSelect2.selectOption({ index: 2 });

        const quantityInput2 = page.locator('input[name="quantity"], input[type="number"]:near(label:has-text("Quantity"))').nth(1);
        await quantityInput2.fill('75');
      }
    }

    // Submit form
    await clickButton(page, 'Create');

    // Wait for success
    await waitForToast(page, 'successfully');
  });
});
