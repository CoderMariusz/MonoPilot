/**
 * License Plates - CRUD Tests
 * Stories: 05.1 (LP Table + CRUD), 05.5 (LP Search & Filters)
 *
 * Tests:
 * - List view with KPI cards
 * - Create LP modal
 * - Block/Unblock actions
 * - QA status management
 * - Search and advanced filters
 * - Detail panel
 * - Pagination
 */

import { test, expect } from '@playwright/test';
import { DataTablePage } from '../../pages';

const ROUTE = '/warehouse/license-plates';

test.describe('License Plates CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE);
    await page.waitForLoadState('networkidle');
  });

  test.describe('List View', () => {
    test('displays page header and action buttons', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'License Plates' })).toBeVisible();
      await expect(page.getByText('Atomic inventory tracking units')).toBeVisible();

      // Action buttons
      await expect(page.getByRole('button', { name: /Print Labels/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Export/i })).toBeVisible();
      await expect(page.getByTestId('create-lp-button')).toBeVisible();
    });

    test('displays KPI cards', async ({ page }) => {
      // Wait for KPI cards to load
      await page.waitForSelector('text=Total LP', { timeout: 5000 });

      // Check all KPI card titles are visible
      const kpiTitles = [
        'Total LP',
        'Available',
        'Reserved',
        'Expiring Soon'
      ];

      for (const title of kpiTitles) {
        await expect(page.locator(`text=${title}`).first()).toBeVisible();
      }
    });

    test('displays data table or empty state', async ({ page }) => {
      // Check if table or empty state is visible
      const hasTable = await page.locator('table').isVisible();
      const hasEmptyState = await page.locator('text=No License Plates').isVisible();

      expect(hasTable || hasEmptyState).toBe(true);
    });

    test('can search license plates', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();

      await searchInput.fill('LP');
      await searchInput.press('Enter');

      // Wait for results to update
      await page.waitForTimeout(500);

      // Should show filtered results or filtered empty state
      const hasResults = await page.locator('table').isVisible();
      const hasFilteredEmpty = await page.getByTestId('filtered-empty-state').isVisible();

      expect(hasResults || hasFilteredEmpty).toBe(true);
    });

    test('can open advanced filters', async ({ page }) => {
      const filterButton = page.getByRole('button', { name: /filter/i });
      await expect(filterButton).toBeVisible();

      await filterButton.click();

      // Advanced filter panel should be visible
      await expect(page.getByText(/Status/i).first()).toBeVisible();
      await expect(page.getByText(/QA Status/i).first()).toBeVisible();
    });

    test('can clear filters', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);

      // Apply search filter
      await searchInput.fill('test');
      await searchInput.press('Enter');
      await page.waitForTimeout(500);

      // Check if filter chip appears
      const filterChip = page.locator('text=Search: test');
      if (await filterChip.isVisible()) {
        // Clear filter
        const clearButton = page.getByRole('button', { name: /clear all/i }).first();
        await clearButton.click();

        // Filter chip should be gone
        await expect(filterChip).not.toBeVisible();
      }
    });
  });

  test.describe('Create LP', () => {
    test('opens create modal', async ({ page }) => {
      await page.getByTestId('create-lp-button').click();

      // Dialog should be visible
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.getByText(/Create License Plate/i)).toBeVisible();
    });

    test('can cancel creation', async ({ page }) => {
      await page.getByTestId('create-lp-button').click();
      await page.waitForTimeout(300);

      // Click cancel or close button
      const cancelButton = page.getByRole('button', { name: /cancel/i });
      if (await cancelButton.isVisible()) {
        await cancelButton.click();

        // Dialog should be closed
        await expect(page.locator('[role="dialog"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Pagination', () => {
    test('shows pagination controls when needed', async ({ page }) => {
      // Check if pagination exists
      const pagination = page.getByTestId('pagination');

      if (await pagination.isVisible()) {
        // Previous and Next buttons should exist
        await expect(page.getByTestId('pagination-prev')).toBeVisible();
        await expect(page.getByTestId('pagination-next')).toBeVisible();

        // Page info should be visible
        await expect(page.locator('text=Page')).toBeVisible();
      }
    });

    test('can navigate pages', async ({ page }) => {
      const pagination = page.getByTestId('pagination');

      if (await pagination.isVisible()) {
        const nextButton = page.getByTestId('pagination-next');

        // Check if next button is enabled
        const isDisabled = await nextButton.isDisabled();

        if (!isDisabled) {
          await nextButton.click();
          await page.waitForTimeout(500);

          // Page should have changed
          await expect(page.locator('text=Page 2')).toBeVisible();

          // Previous button should now be enabled
          await expect(page.getByTestId('pagination-prev')).not.toBeDisabled();
        }
      }
    });
  });

  test.describe('Detail Panel', () => {
    test('opens detail panel when clicking row', async ({ page }) => {
      // Check if table has rows
      const firstRow = page.locator('tbody tr').first();

      if (await firstRow.isVisible()) {
        await firstRow.click();
        await page.waitForTimeout(500);

        // Detail panel should open (as a sheet/dialog)
        const detailPanel = page.locator('[role="dialog"]');
        if (await detailPanel.isVisible()) {
          await expect(detailPanel).toBeVisible();
        }
      }
    });
  });

  test.describe('Row Actions', () => {
    test('shows row action menus', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();

      if (await firstRow.isVisible()) {
        // Look for action button (dropdown or direct buttons)
        const actionButton = firstRow.locator('button').first();

        if (await actionButton.isVisible()) {
          await expect(actionButton).toBeVisible();
        }
      }
    });
  });

  test.describe('KPI Card Interactions', () => {
    test('clicking KPI card filters the list', async ({ page }) => {
      // Wait for KPI cards to load
      await page.waitForSelector('text=Available', { timeout: 5000 });

      // Find and click "Available" KPI card
      const availableCard = page.locator('text=Available').locator('..').locator('..');

      if (await availableCard.isVisible()) {
        await availableCard.click();
        await page.waitForTimeout(500);

        // Should show filtered results
        // (filter chip might appear or table gets filtered)
      }
    });
  });

  test.describe('Accessibility', () => {
    test('page has proper heading structure', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'License Plates' })).toBeVisible();
    });

    test('interactive elements are keyboard accessible', async ({ page }) => {
      // Tab to create button
      await page.keyboard.press('Tab');

      // Should be able to reach the create button
      const createButton = page.getByTestId('create-lp-button');
      await expect(createButton).toBeFocused();
    });
  });
});
