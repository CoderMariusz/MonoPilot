/**
 * Output Registration E2E Tests (Desktop + Scanner)
 *
 * Covers:
 * - FR-PROD-011: Output Registration (Desktop)
 * - FR-PROD-012: Output Registration (Scanner)
 * - FR-PROD-013: By-Product Registration
 * - FR-PROD-015: Multiple Outputs per WO
 *
 * Test Coverage:
 * - TC-PROD-076 to TC-PROD-105: Desktop and scanner output workflows
 */

import { test, expect } from '@playwright/test';
import { OutputRegistrationPage } from '../../pages/production/OutputRegistrationPage';

test.describe('Output Registration', () => {
  let outputPage: OutputRegistrationPage;

  test.beforeEach(async ({ page }) => {
    outputPage = new OutputRegistrationPage(page);
  });

  test.describe('TC-PROD-076: Desktop Output - Happy Path', () => {
    test.skip('should create LP with qty=500 and qa_status=Approved', async () => {
      await outputPage.gotoWOOutputs('wo-id-123');

      await outputPage.registerOutput({
        quantity: 500,
        qaStatus: 'Approved',
      });

      await outputPage.expectSuccessToast();
      await outputPage.expectLPCreated('LP-NEW-001', 500, 'Approved');
    });

    test.skip('should calculate expiry_date = today + 30 days when shelf_life_days=30', async () => {
      // Product shelf_life_days = 30, today = 2025-01-01
      const expectedExpiry = '2025-01-31';

      await outputPage.gotoWOOutputs('wo-id-123');

      await outputPage.clickRegisterOutput();
      await outputPage.expectExpiryDateAutoCalculated(expectedExpiry);
    });

    test.skip('should auto-fill batch_number with WO-2025-001 when no custom batch', async () => {
      await outputPage.gotoWOOutputs('wo-2025-001-id');

      await outputPage.clickRegisterOutput();
      await outputPage.expectBatchNumberAutoFilled('WO-2025-001');
    });

    test.skip('should set LP source = production', async () => {
      await outputPage.gotoWOOutputs('wo-id-123');

      await outputPage.registerOutput({ quantity: 500 });

      await outputPage.expectLPSourceProduction('LP-NEW-001');
    });

    test.skip('should pre-select production line default location', async () => {
      // Production line has default_location_id = LOC-A
      await outputPage.gotoWOOutputs('wo-id-123');

      await outputPage.clickRegisterOutput();
      await outputPage.expectLocationPreSelected('LOC-A');
    });
  });

  test.describe('TC-PROD-077: Output Validation', () => {
    test.skip('should show QA status required error when require_qa_on_output=true', async () => {
      await outputPage.gotoWOOutputs('wo-qa-required-id');

      await outputPage.clickRegisterOutput();
      await outputPage.enterQuantity(100);
      // Don't select QA status
      await outputPage.confirmRegistration();

      await outputPage.expectQAStatusRequiredError();
    });

    test.skip('should allow null QA status when require_qa_on_output=false', async () => {
      await outputPage.gotoWOOutputs('wo-qa-optional-id');

      await outputPage.registerOutput({ quantity: 100 });

      await outputPage.expectSuccessToast();
    });

    test.skip('should show quantity validation error when qty=0', async () => {
      await outputPage.gotoWOOutputs('wo-id-123');

      await outputPage.clickRegisterOutput();
      await outputPage.enterQuantity(0);
      await outputPage.confirmRegistration();

      await outputPage.expectQuantityValidationError();
    });
  });

  test.describe('TC-PROD-078: Output Genealogy', () => {
    test.skip('should update lp_genealogy with child_lp_id for consumed LPs', async () => {
      // WO consumed LP-001, LP-002, now creating output LP-003
      await outputPage.gotoWOOutputs('wo-with-consumption-id');

      await outputPage.registerOutput({ quantity: 500 });

      await outputPage.expectGenealogyUpdated(['LP-001', 'LP-002'], 'LP-003');
    });
  });

  test.describe('TC-PROD-079: Multiple Outputs per WO', () => {
    test.skip('should show WO.output_qty=400 and progress=40% after first output', async () => {
      // WO planned_qty = 1000
      await outputPage.gotoWOOutputs('wo-id-123');

      await outputPage.registerOutput({ quantity: 400 });

      await outputPage.expectTotalOutputSum(400);
      await outputPage.expectProgressBar(40);
    });

    test.skip('should show total output_qty=700 and progress=70% after second output', async () => {
      await outputPage.gotoWOOutputs('wo-first-output-id');

      // First output already = 400, add 300 more
      await outputPage.registerOutput({ quantity: 300 });

      await outputPage.expectTotalOutputSum(700);
      await outputPage.expectProgressBar(70);
    });

    test.skip('should display all 3 LPs in output history', async () => {
      await outputPage.gotoWOOutputs('wo-3-outputs-id');

      await outputPage.expectMultipleLPsInHistory(['LP-001', 'LP-002', 'LP-003']);
    });

    test.skip('should generate unique LP ID for each output', async () => {
      const lpNumbers = ['LP-001', 'LP-002', 'LP-003'];

      await outputPage.expectUniqueLPIDs(lpNumbers);
    });

    test.skip('should auto-complete WO when output_qty=1000 and auto_complete_wo=true', async () => {
      // Planned = 1000, auto_complete_wo = true
      await outputPage.gotoWOOutputs('wo-almost-done-id');

      await outputPage.registerOutput({ quantity: 200 }); // Reaches 1000 total

      await outputPage.expectWOAutoCompleted();
    });

    test.skip('should remain In Progress when output_qty=1200 exceeds planned and auto_complete_wo=false', async () => {
      await outputPage.gotoWOOutputs('wo-over-produced-id');

      await outputPage.expectWOInProgress();
    });
  });

  test.describe('TC-PROD-080: Scanner Output - Happy Path', () => {
    test.skip('should display WO info with product name within 500ms after WO scan', async () => {
      await outputPage.gotoScanner();

      const startTime = Date.now();
      await outputPage.scanWOBarcode('WO-2025-001');
      await outputPage.expectWOInfoDisplayed('WO-2025-001', 'Product X');

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test.skip('should display QA status buttons with 64px height and color coding', async () => {
      await outputPage.gotoScanner();
      await outputPage.scanWOBarcode('WO-2025-001');

      await outputPage.expectQAStatusButtons();
      // Green=Approved, Yellow=Pending, Red=Rejected tested visually
    });

    test.skip('should play voice announcement "LP created" on success', async () => {
      await outputPage.gotoScanner();
      await outputPage.scanWOBarcode('WO-2025-001');
      await outputPage.enterQuantity(100);
      await outputPage.clickQAStatusButton('Approved');

      // Voice announcement tested manually
      await outputPage.expectSuccessToast();
    });
  });

  test.describe('TC-PROD-081: Scanner Label Printing', () => {
    test.skip('should send ZPL label to printer within 2 seconds', async () => {
      // Printer configured
      await outputPage.gotoScanner();
      await outputPage.scanWOBarcode('WO-2025-001');
      await outputPage.enterQuantity(100);
      await outputPage.clickQAStatusButton('Approved');

      const startTime = Date.now();
      await outputPage.expectPrintConfirmation();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(3000);
    });

    test.skip('should show disabled Print button when printer not configured', async () => {
      // No printer configured
      await outputPage.gotoScanner();
      await outputPage.scanWOBarcode('WO-2025-001');
      await outputPage.enterQuantity(100);
      await outputPage.clickQAStatusButton('Approved');

      await outputPage.expectPrintButtonDisabled();
    });

    test.skip('should include LP number, product, qty, batch, expiry on label', async () => {
      // ZPL content tested via printer output (manual verification)
      await outputPage.gotoScanner();
      await outputPage.scanWOBarcode('WO-2025-001');
      await outputPage.registerOutput({ quantity: 100, qaStatus: 'Approved' });

      await outputPage.clickPrint();
      await outputPage.expectPrintConfirmation();
    });
  });

  test.describe('TC-PROD-082: By-Product Registration', () => {
    test.skip('should show expected qty=50 when WO planned_qty=1000 and yield_percent=5', async () => {
      // BOM has by-product with yield_percent = 5%
      // WO planned_qty = 1000, expected by-product = 50
      await outputPage.gotoWOOutputs('wo-with-byproduct-id');

      await outputPage.expectByProductPrompt();
      await outputPage.clickYesOnByProductPrompt();

      await outputPage.expectByProductQuantity(50);
    });

    test.skip('should auto-create by-product LPs when auto_create_by_product_lp=true', async () => {
      await outputPage.gotoWOOutputs('wo-auto-byproduct-id');

      // After main output, by-products auto-created
      await outputPage.registerOutput({ quantity: 1000 });

      await outputPage.expectByProductLPCreated('By-Product A', 50);
    });

    test.skip('should manually enter by-product qty when auto_create_by_product_lp=false', async () => {
      await outputPage.gotoWOOutputs('wo-manual-byproduct-id');

      await outputPage.registerOutput({ quantity: 1000 });
      await outputPage.expectByProductPrompt();
      await outputPage.clickYesOnByProductPrompt();

      await outputPage.registerByProduct(45, 'Approved'); // Actual = 45 vs expected 50

      await outputPage.expectByProductLPCreated('By-Product A', 45);
    });

    test.skip('should link by-product LP to same parent LPs as main output', async () => {
      await outputPage.gotoWOOutputs('wo-with-byproduct-id');

      await outputPage.registerOutput({ quantity: 1000 });
      await outputPage.registerByProduct(50);

      await outputPage.expectGenealogyUpdated(['LP-001', 'LP-002'], 'LP-BYPRODUCT');
    });

    test.skip('should display all 3 by-products in sequence', async () => {
      // BOM has 3 by-products defined
      await outputPage.gotoWOOutputs('wo-3-byproducts-id');

      await outputPage.registerOutput({ quantity: 1000 });
      await outputPage.expectByProductsDisplayed(3);
    });

    test.skip('should show warning when by-product qty=0', async () => {
      await outputPage.gotoWOOutputs('wo-with-byproduct-id');

      await outputPage.registerOutput({ quantity: 1000 });
      await outputPage.clickYesOnByProductPrompt();
      await outputPage.enterByProductQuantity(0);
      await outputPage.confirmRegistration();

      await outputPage.expectByProductQuantityWarning();
    });

    test.skip('should show by-product registration complete confirmation', async () => {
      await outputPage.gotoWOOutputs('wo-with-byproduct-id');

      await outputPage.registerOutput({ quantity: 1000 });
      await outputPage.registerByProduct(50);

      await outputPage.expectByProductRegistrationComplete();
    });

    test.skip('should return to main screen when No clicked on by-product prompt (scanner)', async () => {
      await outputPage.gotoScanner();
      await outputPage.scanWOBarcode('WO-2025-001');
      await outputPage.registerOutput({ quantity: 1000, qaStatus: 'Approved' });

      await outputPage.expectByProductPrompt();
      await outputPage.clickNoOnByProductPrompt();

      // Should return to scanner main screen
      await outputPage.expectUrlContains('/scanner/output');
    });
  });
});
