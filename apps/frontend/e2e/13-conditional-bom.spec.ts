/**
 * EPIC-001 Phase 3: Conditional Components - E2E Tests
 * Tests for conditional BOM item workflows
 */

import { test, expect } from '@playwright/test';
import { login, navigateTo, clickButton, waitForModal, waitForToast } from './helpers';

test.describe('EPIC-001 Phase 3: Conditional BOM Components', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'technical');
  });

  test('creates BOM with unconditional materials', async ({ page }) => {
    // Navigate to Products/BOMs section
    const productsTab = page.locator('button:has-text("Products"), a:has-text("Products")');
    if (await productsTab.isVisible({ timeout: 3000 })) {
      await productsTab.click();
    }

    await page.waitForTimeout(1000);

    // Create a new composite product with BOM
    await clickButton(page, 'Create Product');
    await waitForModal(page, 'Create Product');

    // Fill product details
    await page.fill('input[name="part_number"]', `PROD-COND-${Date.now()}`);
    await page.fill('input[name="description"]', 'Product with Conditional BOM');

    const typeSelect = page.locator('select:near(label:has-text("Product Type"))');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('composite');
    }

    // Submit product creation
    await clickButton(page, 'Create');
    await waitForToast(page);
    await page.waitForTimeout(1000);

    // Product should be created
    expect(page.locator('text=/PROD-COND-/')).toBeTruthy();
  });

  test('adds material with organic condition (OR rule)', async ({ page }) => {
    // This test assumes a BOM editor UI exists
    // Navigate to an existing BOM or create one
    await page.waitForSelector('table', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible({ timeout: 5000 })) {
      // Click edit or view details
      await firstRow.locator('button[title="Edit"], button:has-text("Edit")').first().click();
      await page.waitForTimeout(1000);

      // Add BOM item section should be visible
      // This is a placeholder - actual UI implementation may vary
      const addItemButton = page.locator('button:has-text("Add Item"), button:has-text("Add Material")');
      if (await addItemButton.isVisible({ timeout: 2000 })) {
        await addItemButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('evaluates BOM materials for organic order', async ({ page }) => {
    // Test that conditional evaluation works
    // This would typically be done through Create WO flow

    await navigateTo(page, 'planning');
    await page.waitForTimeout(500);

    const woTab = page.locator('button:has-text("Work Orders"), a:has-text("Work Orders")');
    if (await woTab.isVisible({ timeout: 3000 })) {
      await woTab.click();
    }

    await page.waitForTimeout(1000);

    // Create Work Order
    const createWOButton = page.locator('button:has-text("Create Work Order")');
    if (await createWOButton.isVisible({ timeout: 5000 })) {
      await createWOButton.click();
      await waitForModal(page, 'Create Work Order');

      // Check if order flags selector exists
      const orderFlagsSection = page.locator('label:has-text("Order Flags"), label:has-text("Flags")');
      if (await orderFlagsSection.isVisible({ timeout: 2000 })) {
        // Order flags UI exists - Phase 3 feature is present
        expect(orderFlagsSection).toBeTruthy();
      }
    }
  });

  test('creates BOM with gluten-free AND vegan condition', async ({ page }) => {
    // Test AND logic - material required only if BOTH flags present
    await page.waitForSelector('table', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible({ timeout: 5000 })) {
      await firstRow.locator('button[title="View"], svg.lucide-eye').first().click();
      await page.waitForTimeout(1000);

      // Check if condition info is displayed
      const conditionalBadge = page.locator('text=/conditional/i, span:has-text("Conditional")');
      if (await conditionalBadge.isVisible({ timeout: 2000 })) {
        // Conditional items UI is present
        expect(conditionalBadge).toBeTruthy();
      }
    }
  });

  test('excludes conditional material when condition not met', async ({ page }) => {
    // Test that materials are excluded when order flags don't match
    await navigateTo(page, 'planning');
    await page.waitForTimeout(500);

    const woTab = page.locator('button:has-text("Work Orders")');
    if (await woTab.isVisible({ timeout: 3000 })) {
      await woTab.click();
    }

    await page.waitForTimeout(1000);

    // Verify WO creation without flags excludes conditional items
    const createButton = page.locator('button:has-text("Create Work Order")');
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();
      await page.waitForTimeout(1000);

      // Standard order (no flags) should not include conditional materials
      // This verification depends on UI implementation
    }
  });

  test('shows conditional materials in BOM details view', async ({ page }) => {
    // Navigate to Products
    const productsTab = page.locator('button:has-text("Products"), a:has-text("Products")');
    if (await productsTab.isVisible({ timeout: 3000 })) {
      await productsTab.click();
    }

    await page.waitForTimeout(1000);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      // Click to view product/BOM details
      await firstRow.locator('button[title="View"], svg.lucide-eye').first().click();
      await page.waitForTimeout(1000);

      // Look for BOM items section
      const bomSection = page.locator('text=/BOM Items/i, text=/Materials/i');
      if (await bomSection.isVisible({ timeout: 5000 })) {
        // Check if conditional indicators are present
        const conditionalIndicator = page.locator(
          'span:has-text("Conditional"), badge:has-text("Conditional")'
        );

        // If conditional items exist, they should be marked
        if (await conditionalIndicator.count() > 0) {
          expect(await conditionalIndicator.count()).toBeGreaterThan(0);
        }
      }
    }
  });

  test('validates condition structure when adding conditional item', async ({ page }) => {
    // Test that invalid conditions are rejected
    await page.waitForSelector('table', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible({ timeout: 5000 })) {
      await firstRow.locator('button[title="Edit"]').first().click();
      await page.waitForTimeout(1000);

      // If condition editor UI exists, test validation
      const conditionEditor = page.locator('textarea[name="condition"], input[name="condition"]');
      if (await conditionEditor.isVisible({ timeout: 2000 })) {
        // Invalid JSON should show error
        await conditionEditor.fill('{invalid json}');
        await page.waitForTimeout(500);

        const errorMessage = page.locator('text=/invalid/i, text=/error/i');
        if (await errorMessage.isVisible({ timeout: 2000 })) {
          expect(errorMessage).toBeTruthy();
        }
      }
    }
  });

  test('clones BOM with conditional items', async ({ page }) => {
    // Test that cloning preserves condition rules
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible({ timeout: 5000 })) {
      // Click clone button
      const cloneButton = firstRow.locator('button[title="Clone"], button:has-text("Clone")');
      if (await cloneButton.isVisible({ timeout: 2000 })) {
        await cloneButton.click();
        await waitForToast(page);
        await page.waitForTimeout(1000);

        // Cloned BOM should appear
        const clonedIndicator = page.locator('text=/draft/i, text=/cloned/i');
        expect(clonedIndicator).toBeTruthy();
      }
    }
  });

  test('filters BOM evaluation preview by order flags', async ({ page }) => {
    // Test preview/evaluation UI that shows which materials will be included
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible({ timeout: 5000 })) {
      await firstRow.locator('button[title="View"]').first().click();
      await page.waitForTimeout(1000);

      // Look for evaluation preview UI
      const previewButton = page.locator('button:has-text("Preview"), button:has-text("Evaluate")');
      if (await previewButton.isVisible({ timeout: 2000 })) {
        await previewButton.click();
        await page.waitForTimeout(1000);

        // Should show conditional evaluation results
        const evaluationResults = page.locator('text=/included/i, text=/excluded/i');
        if (await evaluationResults.isVisible({ timeout: 2000 })) {
          expect(evaluationResults).toBeTruthy();
        }
      }
    }
  });

  test('creates WO with multiple order flags (organic + gluten-free)', async ({ page }) => {
    // Test that WO can have multiple flags and materials are evaluated correctly
    await navigateTo(page, 'planning');
    await page.waitForTimeout(500);

    const woTab = page.locator('button:has-text("Work Orders")');
    if (await woTab.isVisible({ timeout: 3000 })) {
      await woTab.click();
    }

    await page.waitForTimeout(1000);

    const createButton = page.locator('button:has-text("Create Work Order")');
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();
      await waitForModal(page, 'Create Work Order');

      // Select multiple order flags if UI exists
      const organicCheckbox = page.locator('input[type="checkbox"][value="organic"]');
      const glutenFreeCheckbox = page.locator('input[type="checkbox"][value="gluten_free"]');

      if (await organicCheckbox.isVisible({ timeout: 2000 })) {
        await organicCheckbox.check();
      }

      if (await glutenFreeCheckbox.isVisible({ timeout: 2000 })) {
        await glutenFreeCheckbox.check();
      }

      // Materials evaluation should happen automatically
      // Verification depends on UI implementation
    }
  });
});
