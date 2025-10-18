import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Production - Work Orders Tab', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.operator.email, testUsers.operator.password);
  });

  test('should display work orders list', async ({ page }) => {
    await helpers.navigateToProduction();

    // Verify work orders tab is active by default
    await helpers.verifyTabActive('work-orders');

    // Verify work orders table is visible
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Work Order")')).toBeVisible();
    await expect(page.locator('th:has-text("Product")')).toBeVisible();
    await expect(page.locator('th:has-text("Quantity")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('should view work order details', async ({ page }) => {
    await helpers.navigateToProduction();

    // Click on first work order row
    const firstWorkOrder = page.locator('table tbody tr').first();
    await firstWorkOrder.locator('button[aria-label="View Details"]').click();

    // Verify details modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Work Order Details');
  });

  test('should close work order', async ({ page }) => {
    await helpers.navigateToProduction();

    // Find a work order with "In Progress" status
    const inProgressRow = page.locator('tr:has-text("In Progress")').first();
    if (await inProgressRow.count() > 0) {
      await inProgressRow.locator('button[aria-label="Close Work Order"]').click();

      // Confirm closure
      await page.click('button:has-text("Confirm")');

      // Verify success message
      await helpers.verifyToast('Work order closed successfully');
    }
  });

  test('should filter by production line', async ({ page }) => {
    await helpers.navigateToProduction();

    // Filter by production line
    await page.selectOption('select[name="production_line_filter"]', 'Line 1');

    // Verify filter is applied
    await expect(page.locator('select[name="production_line_filter"]')).toHaveValue('Line 1');
  });

  test('should filter by status', async ({ page }) => {
    await helpers.navigateToProduction();

    // Filter by status
    await page.selectOption('select[name="status_filter"]', 'In Progress');

    // Verify filter is applied
    await expect(page.locator('select[name="status_filter"]')).toHaveValue('In Progress');
  });

  test('should search work orders', async ({ page }) => {
    await helpers.navigateToProduction();

    // Search for specific work order
    await helpers.searchInTable('WO-');

    // Verify search results
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('should sort work orders by date', async ({ page }) => {
    await helpers.navigateToProduction();

    // Sort by date column
    await helpers.clickSort('Created Date');

    // Verify sorting
    await helpers.verifySorting('Created Date', 'asc');
  });

  test('should sort work orders by quantity', async ({ page }) => {
    await helpers.navigateToProduction();

    // Sort by quantity column
    await helpers.clickSort('Quantity');

    // Verify sorting
    await helpers.verifySorting('Quantity', 'asc');
  });

  test('should paginate work orders', async ({ page }) => {
    await helpers.navigateToProduction();

    // Check if pagination is visible
    const pagination = page.locator('[data-testid="pagination"]');
    if (await pagination.isVisible()) {
      // Click next page
      await helpers.clickPaginationNext();

      // Verify pagination updated
      await helpers.verifyPaginationPage(2);
    }
  });

  test('should export work orders', async ({ page }) => {
    await helpers.navigateToProduction();

    // Click export button
    await page.click('button:has-text("Export")');

    // Verify export started
    await helpers.verifyExportStarted();
  });

  test('should refresh work orders list', async ({ page }) => {
    await helpers.navigateToProduction();

    // Click refresh button
    await page.click('button[aria-label="Refresh"]');

    // Verify loading state appears briefly
    await helpers.expectLoadingVisible();
    await helpers.expectLoadingHidden();
  });

  test('should display work order status badges', async ({ page }) => {
    await helpers.navigateToProduction();

    // Verify status badges are displayed
    await expect(page.locator('.status-badge')).toBeVisible();
  });

  test('should show work order progress indicators', async ({ page }) => {
    await helpers.navigateToProduction();

    // Verify progress indicators are displayed for in-progress work orders
    const inProgressRow = page.locator('tr:has-text("In Progress")').first();
    if (await inProgressRow.count() > 0) {
      await expect(inProgressRow.locator('.progress-indicator')).toBeVisible();
    }
  });

  test('should display work order priority indicators', async ({ page }) => {
    await helpers.navigateToProduction();

    // Verify priority indicators are displayed
    const urgentRow = page.locator('tr:has-text("Urgent")').first();
    if (await urgentRow.count() > 0) {
      await expect(urgentRow.locator('.priority-indicator')).toBeVisible();
    }
  });

  test('should show work order completion percentage', async ({ page }) => {
    await helpers.navigateToProduction();

    // Verify completion percentage is displayed for in-progress work orders
    const inProgressRow = page.locator('tr:has-text("In Progress")').first();
    if (await inProgressRow.count() > 0) {
      await expect(inProgressRow.locator('.completion-percentage')).toBeVisible();
    }
  });

  test('should display work order timeline', async ({ page }) => {
    await helpers.navigateToProduction();

    // Click on work order to view timeline
    const firstWorkOrder = page.locator('table tbody tr').first();
    await firstWorkOrder.locator('button[aria-label="View Timeline"]').click();

    // Verify timeline modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Work Order Timeline');
  });

  test('should show work order materials list', async ({ page }) => {
    await helpers.navigateToProduction();

    // Click on work order to view materials
    const firstWorkOrder = page.locator('table tbody tr').first();
    await firstWorkOrder.locator('button[aria-label="View Materials"]').click();

    // Verify materials modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Required Materials');
  });

  test('should display work order operations list', async ({ page }) => {
    await helpers.navigateToProduction();

    // Click on work order to view operations
    const firstWorkOrder = page.locator('table tbody tr').first();
    await firstWorkOrder.locator('button[aria-label="View Operations"]').click();

    // Verify operations modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Work Order Operations');
  });

  test('should show work order quality requirements', async ({ page }) => {
    await helpers.navigateToProduction();

    // Click on work order to view quality requirements
    const firstWorkOrder = page.locator('table tbody tr').first();
    await firstWorkOrder.locator('button[aria-label="View Quality Requirements"]').click();

    // Verify quality requirements modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Quality Requirements');
  });

  test('should display work order notes', async ({ page }) => {
    await helpers.navigateToProduction();

    // Click on work order to view notes
    const firstWorkOrder = page.locator('table tbody tr').first();
    await firstWorkOrder.locator('button[aria-label="View Notes"]').click();

    // Verify notes modal opens
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Work Order Notes');
  });

  test('should handle empty work orders list', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/production/work-orders/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 })
      });
    });

    await helpers.navigateToProduction();

    // Verify empty state message
    await expect(page.locator('text="No work orders found"')).toBeVisible();
  });

  test('should handle loading state', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/production/work-orders/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], total: 0 })
        });
      }, 1000);
    });

    await helpers.navigateToProduction();

    // Verify loading state appears
    await helpers.expectLoadingVisible();
    await helpers.expectLoadingHidden();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/production/work-orders/**', route => route.abort());

    await helpers.navigateToProduction();

    // Verify error message
    await helpers.verifyErrorMessage('Failed to load work orders');
  });

  test('should maintain filter state on refresh', async ({ page }) => {
    await helpers.navigateToProduction();

    // Apply filter
    await page.selectOption('select[name="status_filter"]', 'In Progress');

    // Refresh page
    await page.reload();

    // Verify filter is maintained
    await expect(page.locator('select[name="status_filter"]')).toHaveValue('In Progress');
  });

  test('should maintain search state on refresh', async ({ page }) => {
    await helpers.navigateToProduction();

    // Apply search
    await helpers.searchInTable('WO-001');

    // Refresh page
    await page.reload();

    // Verify search is maintained
    await expect(page.locator('input[type="search"]')).toHaveValue('WO-001');
  });
});
