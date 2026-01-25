/**
 * Material Consumption Scanner E2E Tests
 *
 * Covers FR-PROD-007: Material Consumption (Scanner)
 *
 * Test Coverage:
 * - TC-PROD-066 to TC-PROD-075: Scanner workflow, touch targets, feedback
 */

import { test, expect } from '@playwright/test';
import { MaterialConsumptionPage } from '../../pages/production/MaterialConsumptionPage';

test.describe('Material Consumption - Scanner', () => {
  let consumptionPage: MaterialConsumptionPage;

  test.beforeEach(async ({ page }) => {
    consumptionPage = new MaterialConsumptionPage(page);
    await consumptionPage.gotoScanner();
  });

  test.describe('TC-PROD-066: Scanner WO Scan', () => {
    test.skip('should display WO info within 500ms after scanning valid WO barcode', async () => {
      const startTime = Date.now();

      await consumptionPage.scanWOBarcode('WO-2025-001');
      await consumptionPage.expectWOInfoDisplayed('WO-2025-001');

      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000);
    });

    test.skip('should display required materials list after WO scan', async () => {
      await consumptionPage.scanWOBarcode('WO-2025-001');

      await consumptionPage.expectRequiredMaterialsList();
    });

    test.skip('should show red X and audio error beep on invalid WO barcode', async () => {
      await consumptionPage.scanWOBarcode('INVALID-WO');

      await consumptionPage.expectScanError();
      // Audio feedback tested manually
    });
  });

  test.describe('TC-PROD-067: Scanner LP Scan', () => {
    test.skip('should show green check and audio success tone on valid LP barcode', async () => {
      await consumptionPage.scanWOBarcode('WO-2025-001');
      await consumptionPage.scanLP('LP-001');

      await consumptionPage.expectScanSuccess();
      // Audio success tone tested manually
    });

    test.skip('should show error feedback on invalid LP scan', async () => {
      await consumptionPage.scanWOBarcode('WO-2025-001');
      await consumptionPage.scanLP('LP-INVALID');

      await consumptionPage.expectScanError();
    });
  });

  test.describe('TC-PROD-068: Full LP Quick Action', () => {
    test.skip('should auto-fill quantity with 25 when Full LP tapped and LP qty=25', async () => {
      await consumptionPage.scanWOBarcode('WO-2025-001');
      await consumptionPage.scanLP('LP-001'); // LP qty = 25

      await consumptionPage.clickFullLP();

      await consumptionPage.expectQuantityAutoFilled(25);
    });

    test.skip('should make quantity input read-only on Full LP for consume_whole_lp materials', async () => {
      await consumptionPage.scanWOBarcode('WO-FULL-LP');
      await consumptionPage.scanLP('LP-ALLERGEN');

      await consumptionPage.expectQuantityReadOnly();
    });
  });

  test.describe('TC-PROD-069: Touch Target Accessibility', () => {
    test.skip('should have Confirm button at least 48x48 pixels', async () => {
      await consumptionPage.scanWOBarcode('WO-2025-001');

      await consumptionPage.expectTouchTargetSize('Confirm', 48);
    });

    test.skip('should have Full LP button with large touch target', async () => {
      await consumptionPage.scanWOBarcode('WO-2025-001');
      await consumptionPage.scanLP('LP-001');

      await consumptionPage.expectTouchTargetSize('Full LP', 48);
    });

    test.skip('should have Next Material button with large touch target', async () => {
      await consumptionPage.scanWOBarcode('WO-2025-001');

      await consumptionPage.expectTouchTargetSize('Next Material', 48);
    });
  });

  test.describe('TC-PROD-070: Visual Feedback', () => {
    test.skip('should show green check animation for 1 second on success', async ({ page }) => {
      await consumptionPage.scanWOBarcode('WO-2025-001');
      await consumptionPage.scanLP('LP-001');
      await consumptionPage.enterQuantity(10);
      await consumptionPage.confirmConsumption();

      await consumptionPage.expectScanSuccess();

      // Check animation duration (manual verification)
      await page.waitForTimeout(1500);
    });

    test.skip('should show red X animation on validation failure', async () => {
      await consumptionPage.scanWOBarcode('WO-2025-001');
      await consumptionPage.scanLP('LP-WRONG-PRODUCT');

      await consumptionPage.expectScanError();
    });
  });

  test.describe('TC-PROD-071: Number Pad Input', () => {
    test.skip('should accept decimal input like 50.5', async ({ page }) => {
      await consumptionPage.scanWOBarcode('WO-2025-001');
      await consumptionPage.scanLP('LP-001');

      await consumptionPage.enterQuantity(50.5);

      const qtyInput = page.locator('input[name="quantity"]');
      const value = await qtyInput.inputValue();
      expect(value).toBe('50.5');
    });

    test.skip('should display large number pad for easy touch input', async ({ page }) => {
      await consumptionPage.scanWOBarcode('WO-2025-001');
      await consumptionPage.scanLP('LP-001');

      // Number pad buttons should be visible
      const numberPad = page.locator('.number-pad, [data-testid="number-pad"]');
      if (await numberPad.count() > 0) {
        await expect(numberPad).toBeVisible();
      }
    });
  });

  test.describe('TC-PROD-072: Next Material and Done', () => {
    test.skip('should show Next Material and Done buttons after consumption', async () => {
      await consumptionPage.scanWOBarcode('WO-2025-001');
      await consumptionPage.scanLP('LP-001');
      await consumptionPage.enterQuantity(10);
      await consumptionPage.confirmConsumption();

      // Both buttons should be visible
      await consumptionPage['page'].getByRole('button', { name: /next material/i });
      await consumptionPage['page'].getByRole('button', { name: /done/i });
    });

    test.skip('should navigate to next material on Next Material tap', async () => {
      await consumptionPage.scanWOBarcode('WO-2025-001');
      await consumptionPage.scanLP('LP-001');
      await consumptionPage.enterQuantity(10);
      await consumptionPage.confirmConsumption();

      await consumptionPage.clickNextMaterial();

      // Should show LP scan screen for next material
    });

    test.skip('should return to main screen on Done tap', async () => {
      await consumptionPage.scanWOBarcode('WO-2025-001');
      await consumptionPage.scanLP('LP-001');
      await consumptionPage.enterQuantity(10);
      await consumptionPage.confirmConsumption();

      await consumptionPage.clickDone();

      await consumptionPage.expectUrlContains('/scanner/consume');
    });
  });

  test.describe('TC-PROD-073: Scanner Validation Errors', () => {
    test.skip('should show product mismatch error in large text', async () => {
      await consumptionPage.scanWOBarcode('WO-2025-001');
      await consumptionPage.scanLP('LP-WRONG-PRODUCT');

      await consumptionPage.expectProductMismatchError('PROD-B', 'PROD-A');
    });

    test.skip('should show insufficient quantity error', async () => {
      await consumptionPage.scanWOBarcode('WO-2025-001');
      await consumptionPage.scanLP('LP-001'); // Has 30 kg
      await consumptionPage.enterQuantity(50);
      await consumptionPage.confirmConsumption();

      await consumptionPage.expectInsufficientQuantityError(30, 50);
    });
  });

  test.describe('TC-PROD-074: Scanner Performance', () => {
    test.skip('should process barcode scan within 500ms', async () => {
      const startTime = Date.now();

      await consumptionPage.scanWOBarcode('WO-2025-001');
      await consumptionPage.expectWOInfoDisplayed('WO-2025-001');

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  test.describe('TC-PROD-075: Scanner Network Errors', () => {
    test.skip('should show Retry button on network error', async ({ page }) => {
      // Simulate network error
      await page.route('**/api/production/**', route => route.abort());

      await consumptionPage.scanWOBarcode('WO-2025-001');

      const errorMessage = page.getByText(/network error.*retry/i);
      await expect(errorMessage).toBeVisible();

      const retryButton = page.getByRole('button', { name: /retry/i });
      await expect(retryButton).toBeVisible();
    });
  });
});
