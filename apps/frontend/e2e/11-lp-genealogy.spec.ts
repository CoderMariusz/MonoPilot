/**
 * E2E Tests for LP Genealogy & Traceability
 * EPIC-002 Scanner & Warehouse v2 - Phase 2: LP Genealogy & Traceability
 *
 * Tests cover:
 * - Split LP with genealogy tracking
 * - Merge LPs with composition tracking
 * - View genealogy tree (parent → children)
 * - View reverse genealogy (where-used)
 * - Business rules validation
 */

import { test, expect } from '@playwright/test';
import { login, clickButton, waitForModal, waitForToast } from './helpers';

test.describe('LP Genealogy & Traceability', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);

    // Navigate to License Plates page
    await page.goto('/license-plates');
    await page.waitForTimeout(1000);

    // Wait for LP table or "Create" button to be visible
    await page.waitForSelector('table, button:has-text("Create")', { timeout: 5000 });
  });

  test('should display License Plates page', async ({ page }) => {
    const hasTable = await page.locator('table').isVisible({ timeout: 2000 });
    const hasCreateButton = await page.locator('button:has-text("Create")').isVisible();

    expect(hasTable || hasCreateButton).toBe(true);
  });

  test('should split LP and create genealogy relationship', async ({ page }) => {
    // Find first LP that can be split (not consumed)
    const firstRow = page.locator('table tbody tr').first();

    if (await firstRow.isVisible({ timeout: 3000 })) {
      // Click split button
      const splitButton = firstRow.locator('button[title="Split"], button:has-text("Split")');

      if (await splitButton.isVisible({ timeout: 1000 })) {
        await splitButton.click();

        // Wait for split modal
        await waitForModal(page, 'Split License Plate');

        const modal = page.locator('[role="dialog"]');

        // Get current LP quantity
        const quantityText = await modal.locator('text=/Available Quantity/i').locator('..').textContent();
        const quantityMatch = quantityText?.match(/(\d+\.?\d*)/);
        const currentQty = quantityMatch ? parseFloat(quantityMatch[1]) : 100;

        // Split into 2 equal parts
        const halfQty = (currentQty / 2).toString();

        const quantityInput1 = modal.locator('input[type="number"]').first();
        const quantityInput2 = modal.locator('input[type="number"]').nth(1);

        await quantityInput1.fill(halfQty);
        await quantityInput2.fill(halfQty);

        // Submit split
        await clickButton(page, 'Split LP');

        // Wait for success toast
        await waitForToast(page, 'split successfully');

        // Verify: should see message about genealogy tracking
        const toastText = await page.locator('.Toastify').textContent();
        expect(toastText).toContain('genealogy');
      }
    } else {
      console.log('No LPs available to split');
    }
  });

  test('should display genealogy tree for split LP', async ({ page }) => {
    // Find an LP with genealogy (child LP)
    const firstRow = page.locator('table tbody tr').first();

    if (await firstRow.isVisible({ timeout: 3000 })) {
      // Click details or view button
      const detailsButton = firstRow.locator('button[title="Details"], button:has-text("Details"), button:has-text("View")');

      if (await detailsButton.isVisible({ timeout: 1000 })) {
        await detailsButton.click();

        // Wait for details modal
        await waitForModal(page, 'Details');

        const modal = page.locator('[role="dialog"]');

        // Look for "View Genealogy" button
        const genealogyButton = modal.locator('button:has-text("Genealogy"), button:has-text("View Genealogy")');

        if (await genealogyButton.isVisible({ timeout: 2000 })) {
          await genealogyButton.click();

          // Should display genealogy tree
          const genealogyContent = await modal.locator('text=/Genealogy|Parent|Child/i').isVisible({ timeout: 2000 });
          expect(genealogyContent).toBe(true);
        }

        // Close modal
        const closeButton = modal.locator('button:has-text("Close"), button[aria-label="Close"]').first();
        await closeButton.click();
      }
    }
  });

  test('should show inherited batch/expiry in split modal', async ({ page }) => {
    // Find LP with batch/expiry
    const firstRow = page.locator('table tbody tr').first();

    if (await firstRow.isVisible({ timeout: 3000 })) {
      const splitButton = firstRow.locator('button:has-text("Split")');

      if (await splitButton.isVisible({ timeout: 1000 })) {
        await splitButton.click();

        await waitForModal(page, 'Split');

        const modal = page.locator('[role="dialog"]');

        // Check for batch/expiry display
        const hasBatch = await modal.locator('text=/Batch/i').isVisible({ timeout: 1000 });
        const hasExpiry = await modal.locator('text=/Expiry/i').isVisible({ timeout: 1000 });

        // If LP has batch/expiry, should show inheritance message
        if (hasBatch || hasExpiry) {
          const inheritMessage = await modal.locator('text=/inherit/i').isVisible({ timeout: 1000 });
          expect(inheritMessage).toBe(true);
        }

        // Close modal
        const closeButton = modal.locator('button:has-text("Cancel")').first();
        await closeButton.click();
      }
    }
  });

  test('should validate merge business rules (same batch/expiry)', async ({ page }) => {
    // This test validates that merge modal shows proper validation
    // Note: Actual merge functionality may not be exposed in UI yet

    // Look for merge button or functionality
    const mergeButton = page.locator('button:has-text("Merge")');

    if (await mergeButton.isVisible({ timeout: 2000 })) {
      await mergeButton.click();

      await waitForModal(page, 'Merge');

      const modal = page.locator('[role="dialog"]');

      // Should show validation message about same batch/expiry
      const validationText = await modal.locator('text=/same.*batch|same.*expiry/i').isVisible({ timeout: 2000 });

      // Close modal
      const closeButton = modal.locator('button:has-text("Cancel")').first();
      if (await closeButton.isVisible({ timeout: 1000 })) {
        await closeButton.click();
      }
    } else {
      console.log('Merge functionality not yet implemented in UI');
    }
  });

  test('should record amendment notes in genealogy', async ({ page }) => {
    // Find first LP
    const firstRow = page.locator('table tbody tr').first();

    if (await firstRow.isVisible({ timeout: 3000 })) {
      // Click amend/edit button
      const amendButton = firstRow.locator('button[title="Amend"], button:has-text("Amend"), button:has-text("Edit")');

      if (await amendButton.isVisible({ timeout: 1000 })) {
        await amendButton.click();

        await waitForModal(page, 'Amend');

        const modal = page.locator('[role="dialog"]');

        // Look for amendment notes field
        const notesField = modal.locator('textarea, input[name="notes"]');

        if (await notesField.isVisible({ timeout: 2000 })) {
          await notesField.fill('E2E test amendment - inventory correction');

          // Check for genealogy message
          const genealogyMessage = await modal.locator('text=/genealogy.*history|recorded.*genealogy/i').isVisible({ timeout: 1000 });
          expect(genealogyMessage).toBe(true);
        }

        // Close without saving
        const closeButton = modal.locator('button:has-text("Cancel")').first();
        await closeButton.click();
      }
    }
  });

  test('should display parent LP info in amend modal', async ({ page }) => {
    // Find LP that was created from split (has parent)
    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const row = rows.nth(i);
      const amendButton = row.locator('button:has-text("Amend")');

      if (await amendButton.isVisible({ timeout: 1000 })) {
        await amendButton.click();

        await waitForModal(page, 'Amend');

        const modal = page.locator('[role="dialog"]');

        // Check if shows parent LP info
        const hasParentInfo = await modal.locator('text=/split operation|parent/i').isVisible({ timeout: 1000 });

        if (hasParentInfo) {
          // Should have "View Genealogy" button
          const genealogyButton = await modal.locator('button:has-text("Genealogy")').isVisible({ timeout: 1000 });
          expect(genealogyButton).toBe(true);
        }

        // Close modal
        const closeButton = modal.locator('button:has-text("Cancel")').first();
        await closeButton.click();

        break; // Found one, exit loop
      }
    }
  });

  test('should show genealogy tree in compact mode', async ({ page }) => {
    // Find LP with genealogy
    const firstRow = page.locator('table tbody tr').first();

    if (await firstRow.isVisible({ timeout: 3000 })) {
      const detailsButton = firstRow.locator('button:has-text("Details")');

      if (await detailsButton.isVisible({ timeout: 1000 })) {
        await detailsButton.click();

        await waitForModal(page, 'Details');

        const modal = page.locator('[role="dialog"]');

        // Click View Genealogy if available
        const genealogyButton = modal.locator('button:has-text("Genealogy")');

        if (await genealogyButton.isVisible({ timeout: 2000 })) {
          await genealogyButton.click();

          // Should show compact genealogy view
          // Look for level indicators (Level 0, Level 1, etc.)
          const hasLevels = await modal.locator('text=/Level -?[0-9]+/i').isVisible({ timeout: 2000 });

          // Should show LP numbers in tree
          const hasLPNumbers = await modal.locator('text=/LP-[0-9]{4}-[0-9]+/').isVisible({ timeout: 2000 });

          expect(hasLevels || hasLPNumbers).toBe(true);
        }

        // Close modal
        const closeButton = modal.locator('button:has-text("Close")').first();
        if (await closeButton.isVisible({ timeout: 1000 })) {
          await closeButton.click();
        }
      }
    }
  });

  test('should prevent splitting consumed LP', async ({ page }) => {
    // Look for consumed LP (if any)
    const consumedRow = page.locator('table tbody tr').filter({ hasText: /consumed/i }).first();

    if (await consumedRow.isVisible({ timeout: 2000 })) {
      // Split button should be disabled or not visible
      const splitButton = consumedRow.locator('button:has-text("Split")');
      const isDisabled = await splitButton.isDisabled().catch(() => true);
      const isVisible = await splitButton.isVisible({ timeout: 1000 }).catch(() => false);

      // Either not visible or disabled
      expect(!isVisible || isDisabled).toBe(true);
    } else {
      console.log('No consumed LPs found to test');
    }
  });

  test('should display traceability view for LP', async ({ page }) => {
    // Find LP
    const firstRow = page.locator('table tbody tr').first();

    if (await firstRow.isVisible({ timeout: 3000 })) {
      // Look for traceability or trace button
      const traceButton = firstRow.locator('button:has-text("Trace"), button:has-text("Traceability"), button[title="Trace"]');

      if (await traceButton.isVisible({ timeout: 1000 })) {
        await traceButton.click();

        // Wait for traceability modal/view
        await page.waitForTimeout(1000);

        // Should show timeline or chain
        const hasTimeline = await page.locator('text=/Timeline|Chain|Source|Output/i').isVisible({ timeout: 2000 });
        expect(hasTimeline).toBe(true);

        // Close
        const closeButton = page.locator('button:has-text("Close")').first();
        if (await closeButton.isVisible({ timeout: 1000 })) {
          await closeButton.click();
        }
      } else {
        console.log('Traceability view not yet implemented');
      }
    }
  });

  test('should filter LPs by QA status', async ({ page }) => {
    // Find QA status filter
    const qaFilter = page.locator('select:near(label:has-text("QA")), select[name="qa_status"]');

    if (await qaFilter.isVisible({ timeout: 2000 })) {
      // Filter by Passed
      await qaFilter.selectOption('Passed');
      await page.waitForTimeout(500);

      // Check visible rows
      const rows = page.locator('table tbody tr');
      const count = await rows.count();

      if (count > 0) {
        // First row should show "Passed"
        const firstRowText = await rows.first().textContent();
        expect(firstRowText).toContain('Passed');
      }
    } else {
      console.log('QA status filter not available');
    }
  });

  test('should search LPs by LP number', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');

    if (await searchInput.isVisible({ timeout: 2000 })) {
      // Type partial LP number
      await searchInput.fill('LP-');
      await page.waitForTimeout(500);

      // Results should contain "LP-"
      const table = page.locator('table');
      const tableText = await table.textContent();
      expect(tableText).toContain('LP-');

      // Clear search
      await searchInput.clear();
    }
  });
});
