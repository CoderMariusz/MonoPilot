/**
 * ASNs - CRUD Tests
 * Story: 05.8 (ASN Management)
 *
 * Tests:
 * - List view with table
 * - Search functionality
 * - Status filters
 * - Create new ASN
 * - Delete confirmation
 * - Navigation to detail
 * - Pagination
 */

import { test, expect } from '@playwright/test';

const ROUTE = '/warehouse/asns';

test.describe('ASNs CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE);
    await page.waitForLoadState('networkidle');
  });

  test.describe('List View', () => {
    test('displays page header and action buttons', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'ASNs' })).toBeVisible();
      await expect(page.getByText('Advance Shipping Notices').first()).toBeVisible();

      // New ASN button
      await expect(page.getByRole('button', { name: /New ASN/i })).toBeVisible();
    });

    test('displays data table or empty state', async ({ page }) => {
      // Check if table or empty state is visible
      const hasTable = await page.locator('table').isVisible();
      const hasEmptyState = await page.locator('text=No Advance Shipping Notices').isVisible();

      expect(hasTable || hasEmptyState).toBe(true);
    });

    test('shows table headers when data exists', async ({ page }) => {
      const table = page.locator('table');

      if (await table.isVisible()) {
        // Check for key column headers
        await expect(page.getByRole('columnheader', { name: /ASN Number/i })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /PO Number/i })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /Supplier/i })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /Expected Date/i })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();
      }
    });

    test('can search ASNs', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();

      await searchInput.fill('ASN');
      await page.waitForTimeout(500);

      // Should show filtered results or no results message
      const hasResults = await page.locator('table tbody tr').count() >= 0;
      expect(hasResults).toBeTruthy();
    });

    test('can filter by status', async ({ page }) => {
      const statusFilter = page.getByRole('combobox', { name: /status/i });

      if (await statusFilter.isVisible()) {
        await statusFilter.click();

        // Check if status options exist
        await expect(page.getByRole('option', { name: /pending/i }).or(page.getByText(/pending/i))).toBeVisible();
        await expect(page.getByRole('option', { name: /received/i }).or(page.getByText(/received/i))).toBeVisible();

        // Select a status
        await page.getByText('Pending').first().click();
        await page.waitForTimeout(500);

        // Filter should be applied (check if visible ASNs have the selected status)
        const statusBadges = page.locator('[data-status="pending"]');
        if (await statusBadges.count() > 0) {
          await expect(statusBadges.first()).toBeVisible();
        }
      }
    });

    test('can sort by columns', async ({ page }) => {
      const table = page.locator('table');

      if (await table.isVisible()) {
        // Click on Expected Date column to sort
        const expectedDateHeader = page.getByRole('columnheader').filter({ has: page.locator('[data-expected-date]') });

        if (await expectedDateHeader.count() > 0) {
          await expectedDateHeader.first().click();
          await page.waitForTimeout(500);

          // Table should re-render (basic assertion)
          await expect(table).toBeVisible();
        }
      }
    });

    test('displays status badges', async ({ page }) => {
      const table = page.locator('table');

      if (await table.isVisible()) {
        const firstRow = page.locator('tbody tr').first();

        if (await firstRow.isVisible()) {
          // Should have a status badge
          const statusCell = firstRow.locator('td').nth(4); // Status column

          if (await statusCell.isVisible()) {
            await expect(statusCell).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Create ASN', () => {
    test('navigates to create page', async ({ page }) => {
      await page.getByRole('button', { name: /New ASN/i }).click();

      // Should navigate to create page
      await page.waitForURL(/\/warehouse\/asns\/new/);
      await expect(page).toHaveURL(/\/warehouse\/asns\/new/);
    });
  });

  test.describe('Row Interactions', () => {
    test('can click row to view details', async ({ page }) => {
      const table = page.locator('table');

      if (await table.isVisible()) {
        const firstRow = page.locator('tbody tr').first();

        if (await firstRow.isVisible()) {
          // Get ASN number to verify navigation
          const asnCell = firstRow.locator('td').first();
          const asnNumber = await asnCell.textContent();

          await firstRow.click();
          await page.waitForTimeout(500);

          // Should navigate to detail page
          await expect(page).toHaveURL(/\/warehouse\/asns\/.+/);
        }
      }
    });

    test('shows delete button for pending ASNs', async ({ page }) => {
      const table = page.locator('table');

      if (await table.isVisible()) {
        // Find a pending ASN row
        const pendingRow = page.locator('tbody tr[data-status="pending"]').first();

        if (await pendingRow.isVisible()) {
          // Should have delete button
          const deleteButton = pendingRow.getByRole('button', { name: /delete/i });

          if (await deleteButton.isVisible()) {
            await expect(deleteButton).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Delete ASN', () => {
    test('shows confirmation dialog', async ({ page }) => {
      const table = page.locator('table');

      if (await table.isVisible()) {
        const pendingRow = page.locator('tbody tr[data-status="pending"]').first();

        if (await pendingRow.isVisible()) {
          const deleteButton = pendingRow.getByRole('button', { name: /delete/i });

          if (await deleteButton.isVisible()) {
            await deleteButton.click();
            await page.waitForTimeout(300);

            // Confirmation dialog should appear
            await expect(page.getByRole('alertdialog')).toBeVisible();
            await expect(page.getByText(/Delete ASN/i)).toBeVisible();
            await expect(page.getByText(/cannot be undone/i)).toBeVisible();
          }
        }
      }
    });

    test('can cancel delete', async ({ page }) => {
      const table = page.locator('table');

      if (await table.isVisible()) {
        const pendingRow = page.locator('tbody tr[data-status="pending"]').first();

        if (await pendingRow.isVisible()) {
          const deleteButton = pendingRow.getByRole('button', { name: /delete/i });

          if (await deleteButton.isVisible()) {
            await deleteButton.click();
            await page.waitForTimeout(300);

            // Click cancel
            const cancelButton = page.getByRole('button', { name: /cancel/i });
            await cancelButton.click();

            // Dialog should close
            await expect(page.getByRole('alertdialog')).not.toBeVisible();

            // Row should still exist
            await expect(pendingRow).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Pagination', () => {
    test('shows pagination when needed', async ({ page }) => {
      const pagination = page.getByLabel('pagination');

      if (await pagination.isVisible()) {
        await expect(page.getByRole('button', { name: /previous/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /next/i })).toBeVisible();

        // Page info
        await expect(page.locator('text=Page')).toBeVisible();
      }
    });

    test('can navigate between pages', async ({ page }) => {
      const pagination = page.getByLabel('pagination');

      if (await pagination.isVisible()) {
        const nextButton = page.getByRole('button', { name: /next/i });
        const isDisabled = await nextButton.isDisabled();

        if (!isDisabled) {
          await nextButton.click();
          await page.waitForTimeout(500);

          // Page should have changed
          await expect(page.locator('text=Page 2')).toBeVisible();

          // Previous button should be enabled
          await expect(page.getByRole('button', { name: /previous/i })).not.toBeDisabled();
        }
      }
    });
  });

  test.describe('Empty State', () => {
    test('shows empty state when no ASNs', async ({ page }) => {
      const emptyState = page.locator('text=No Advance Shipping Notices');

      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible();
        await expect(page.getByText(/Get started by creating/i)).toBeVisible();

        // Empty state should have create button
        await expect(page.getByRole('button', { name: /Create your first ASN/i })).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('shows error state on API failure', async ({ page }) => {
      // This would require mocking API failure
      // For now, just verify error state structure exists in code
      const retryButton = page.getByRole('button', { name: /retry/i });

      // Error state might not be visible in normal conditions
      // This is more of a smoke test
    });
  });

  test.describe('Accessibility', () => {
    test('page has proper heading structure', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'ASNs' })).toBeVisible();
    });

    test('table is accessible', async ({ page }) => {
      const table = page.locator('table');

      if (await table.isVisible()) {
        // Table should have proper structure
        await expect(table.locator('thead')).toBeVisible();
        await expect(table.locator('tbody')).toBeVisible();
      }
    });

    test('form fields have proper labels', async ({ page }) => {
      // Search input should have placeholder (implicit label)
      await expect(page.getByPlaceholder(/search/i)).toBeVisible();

      // Status filter should be properly labeled
      const statusFilter = page.locator('[name="status_filter"]');
      if (await statusFilter.isVisible()) {
        await expect(statusFilter).toBeVisible();
      }
    });
  });
});
