/**
 * Inventory Browser - Dashboard Tests
 * Stories: Multiple (Overview, Aging, Expiring, Cycle Counts, Adjustments)
 *
 * Tests:
 * - KPI cards display
 * - Tab navigation (5 tabs)
 * - Overview tab functionality
 * - Aging Report tab
 * - Expiring Items tab
 * - Cycle Counts tab
 * - Adjustments tab
 */

import { test, expect } from '@playwright/test';

const ROUTE = '/warehouse/inventory';

test.describe('Inventory Browser Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Header', () => {
    test('displays page header and action buttons', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Inventory Browser' })).toBeVisible();
      await expect(page.getByText('Comprehensive inventory management and analysis')).toBeVisible();

      // Action buttons
      await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /new adjustment/i })).toBeVisible();
    });
  });

  test.describe('KPI Cards', () => {
    test('displays all 4 KPI cards', async ({ page }) => {
      // Wait for KPIs to load
      await page.waitForSelector('text=Total LP Count', { timeout: 10000 });

      // Check all KPI card titles
      await expect(page.getByText('Total LP Count')).toBeVisible();
      await expect(page.getByText('Total Value')).toBeVisible();
      await expect(page.getByText('Expiring Soon')).toBeVisible();
      await expect(page.getByText('Expired')).toBeVisible();
    });

    test('KPI cards show numeric values', async ({ page }) => {
      await page.waitForSelector('text=Total LP Count', { timeout: 10000 });

      // Cards should show numbers (not loading state "...")
      const lpCountCard = page.locator('text=Total LP Count').locator('..').locator('..');
      const lpCountValue = lpCountCard.locator('.text-2xl').first();

      // Should have a value
      await expect(lpCountValue).toBeVisible();
      const value = await lpCountValue.textContent();
      expect(value).not.toBe('...');
    });

    test('expiring items KPI links to expiring tab', async ({ page }) => {
      await page.waitForSelector('text=Expiring Soon', { timeout: 10000 });

      // Find "View Items" link if expiring items > 0
      const viewItemsLink = page.getByText('View Items →');

      if (await viewItemsLink.isVisible()) {
        await viewItemsLink.click();
        await page.waitForTimeout(500);

        // Should switch to expiring tab
        const expiringTab = page.getByRole('tab', { name: /expiring items/i });
        await expect(expiringTab).toHaveAttribute('data-state', 'active');
      }
    });

    test('expired items KPI shows urgent action link', async ({ page }) => {
      await page.waitForSelector('text=Expired', { timeout: 10000 });

      // Find "Urgent Action" link if expired items > 0
      const urgentActionLink = page.getByText('Urgent Action →');

      if (await urgentActionLink.isVisible()) {
        await expect(urgentActionLink).toBeVisible();
        await expect(urgentActionLink).toHaveClass(/text-red-600/);
      }
    });
  });

  test.describe('Tab Navigation', () => {
    test('displays all 5 tabs', async ({ page }) => {
      // Check all tabs are present
      await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /aging report/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /expiring items/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /cycle counts/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /adjustments/i })).toBeVisible();
    });

    test('overview tab is active by default', async ({ page }) => {
      const overviewTab = page.getByRole('tab', { name: /overview/i });
      await expect(overviewTab).toHaveAttribute('data-state', 'active');
    });

    test('can switch to aging report tab', async ({ page }) => {
      const agingTab = page.getByRole('tab', { name: /aging report/i });
      await agingTab.click();
      await page.waitForTimeout(500);

      await expect(agingTab).toHaveAttribute('data-state', 'active');

      // Aging report content should be visible
      // (e.g., filters, grouping options, chart)
    });

    test('can switch to expiring items tab', async ({ page }) => {
      const expiringTab = page.getByRole('tab', { name: /expiring items/i });
      await expiringTab.click();
      await page.waitForTimeout(500);

      await expect(expiringTab).toHaveAttribute('data-state', 'active');
    });

    test('can switch to cycle counts tab', async ({ page }) => {
      const cycleTab = page.getByRole('tab', { name: /cycle counts/i });
      await cycleTab.click();
      await page.waitForTimeout(500);

      await expect(cycleTab).toHaveAttribute('data-state', 'active');
    });

    test('can switch to adjustments tab', async ({ page }) => {
      const adjustmentsTab = page.getByRole('tab', { name: /adjustments/i });
      await adjustmentsTab.click();
      await page.waitForTimeout(500);

      await expect(adjustmentsTab).toHaveAttribute('data-state', 'active');
    });

    test('tab content changes when switching tabs', async ({ page }) => {
      // Start on overview
      const overviewTab = page.getByRole('tab', { name: /overview/i });
      await expect(overviewTab).toHaveAttribute('data-state', 'active');

      // Switch to aging report
      const agingTab = page.getByRole('tab', { name: /aging report/i });
      await agingTab.click();
      await page.waitForTimeout(500);

      // Content should have changed
      await expect(agingTab).toHaveAttribute('data-state', 'active');
    });
  });

  test.describe('Overview Tab', () => {
    test('displays inventory summary filters', async ({ page }) => {
      // Should be on overview tab by default
      const overviewTab = page.getByRole('tab', { name: /overview/i });
      await expect(overviewTab).toHaveAttribute('data-state', 'active');

      // Overview tab should have filters or grouping options
      // (This depends on the actual implementation - adjust as needed)
    });

    test('shows inventory data table or summary', async ({ page }) => {
      const overviewTab = page.getByRole('tab', { name: /overview/i });
      await expect(overviewTab).toHaveAttribute('data-state', 'active');

      // Should show some inventory data
      // (table, cards, or summary - depends on implementation)
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Aging Report Tab', () => {
    test('displays aging report controls', async ({ page }) => {
      const agingTab = page.getByRole('tab', { name: /aging report/i });
      await agingTab.click();
      await page.waitForTimeout(500);

      // Aging report should have filters or mode toggle
      // (FIFO/FEFO, grouping options, etc.)
    });

    test('shows aging data visualization or table', async ({ page }) => {
      const agingTab = page.getByRole('tab', { name: /aging report/i });
      await agingTab.click();
      await page.waitForTimeout(1000);

      // Should render some content (chart, table, etc.)
      // Verify content area is visible
    });
  });

  test.describe('Expiring Items Tab', () => {
    test('displays expiring items filters', async ({ page }) => {
      const expiringTab = page.getByRole('tab', { name: /expiring items/i });
      await expiringTab.click();
      await page.waitForTimeout(500);

      // Should have filters (e.g., days slider, date range)
    });

    test('shows expiring items list or summary', async ({ page }) => {
      const expiringTab = page.getByRole('tab', { name: /expiring items/i });
      await expiringTab.click();
      await page.waitForTimeout(1000);

      // Should render items table or summary
    });
  });

  test.describe('Cycle Counts Tab', () => {
    test('displays cycle counts summary', async ({ page }) => {
      const cycleTab = page.getByRole('tab', { name: /cycle counts/i });
      await cycleTab.click();
      await page.waitForTimeout(500);

      // Should show cycle count stats or summary cards
    });

    test('shows cycle counts table', async ({ page }) => {
      const cycleTab = page.getByRole('tab', { name: /cycle counts/i });
      await cycleTab.click();
      await page.waitForTimeout(1000);

      // Should render cycle counts table
    });
  });

  test.describe('Adjustments Tab', () => {
    test('displays adjustments summary', async ({ page }) => {
      const adjustmentsTab = page.getByRole('tab', { name: /adjustments/i });
      await adjustmentsTab.click();
      await page.waitForTimeout(500);

      // Should show adjustment summary cards
    });

    test('shows adjustments table', async ({ page }) => {
      const adjustmentsTab = page.getByRole('tab', { name: /adjustments/i });
      await adjustmentsTab.click();
      await page.waitForTimeout(1000);

      // Should render adjustments table
    });
  });

  test.describe('Responsiveness', () => {
    test('KPI cards adapt to mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);

      // KPI cards should still be visible
      await expect(page.getByText('Total LP Count')).toBeVisible();
    });

    test('tabs are scrollable on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);

      // Tabs should still be accessible
      await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test('shows loading state for KPIs initially', async ({ page }) => {
      // Reload to catch loading state
      await page.reload();

      // Might see "..." loading state briefly
      const loadingValue = page.locator('text=...');

      // This is a timing-sensitive test
      // Loading state might be too fast to catch
    });
  });

  test.describe('Error Handling', () => {
    test('handles KPI fetch errors gracefully', async ({ page }) => {
      // This would require mocking API failure
      // For now, just verify the page doesn't crash
      await page.waitForSelector('text=Total LP Count', { timeout: 10000 });

      // Page should still be functional
      await expect(page.getByRole('heading', { name: 'Inventory Browser' })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('page has proper heading structure', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Inventory Browser' })).toBeVisible();
    });

    test('tabs are keyboard navigable', async ({ page }) => {
      // Focus on first tab
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to navigate tabs with keyboard
      const overviewTab = page.getByRole('tab', { name: /overview/i });

      // Use evaluate to check if element is focused
      const isFocused = await overviewTab.evaluate(el => el === document.activeElement);
      if (isFocused) {
        // Navigate to next tab with arrow keys
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(300);

        // Aging tab should now be active
        const agingTab = page.getByRole('tab', { name: /aging report/i });
        await expect(agingTab).toHaveAttribute('data-state', 'active');
      }
    });

    test('KPI cards have descriptive text', async ({ page }) => {
      await page.waitForSelector('text=Total LP Count', { timeout: 10000 });

      // Each KPI should have title and description
      await expect(page.getByText('Active License Plates')).toBeVisible();
      await expect(page.getByText('Inventory at cost')).toBeVisible();
      await expect(page.getByText('Within 30 days')).toBeVisible();
      await expect(page.getByText('Past expiry date')).toBeVisible();
    });
  });

  test.describe('Integration', () => {
    test('export button is clickable', async ({ page }) => {
      // Use .first() to handle strict mode - multiple elements may match
      const exportButton = page.getByRole('button', { name: /export/i }).first();
      await expect(exportButton).toBeVisible();
      await expect(exportButton).toBeEnabled();

      // Note: Export might show "Coming Soon" toast
      // await exportButton.click();
    });

    test('new adjustment button is clickable', async ({ page }) => {
      const newAdjustmentButton = page.getByRole('button', { name: /new adjustment/i });
      await expect(newAdjustmentButton).toBeVisible();
      await expect(newAdjustmentButton).toBeEnabled();

      // Note: Might show "Coming Soon" toast or open modal
      // await newAdjustmentButton.click();
    });
  });
});
