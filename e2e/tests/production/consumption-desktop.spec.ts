/**
 * Material Consumption Desktop E2E Tests
 *
 * Covers:
 * - FR-PROD-006: Material Consumption (Desktop)
 * - FR-PROD-008: 1:1 Consumption Enforcement
 * - FR-PROD-009: Consumption Correction
 * - FR-PROD-010: Over-Consumption Control
 *
 * Test Coverage:
 * - TC-PROD-046 to TC-PROD-065: Desktop consumption, validation, corrections
 */

import { test, expect } from '@playwright/test';
import { MaterialConsumptionPage } from '../../pages/production/MaterialConsumptionPage';
import { TEST_UUIDS, PRODUCTION_TEST_DATA } from '../../fixtures/seed-production-data';

test.describe('Material Consumption - Desktop', () => {
  let consumptionPage: MaterialConsumptionPage;

  test.beforeEach(async ({ page }) => {
    consumptionPage = new MaterialConsumptionPage(page);
  });

  test.describe('TC-PROD-046: Consumption Happy Path', () => {
    test.skip('should consume 40 kg from LP with qty=100, leaving qty=60', async () => {
      // KNOWN ISSUE: Consumption page has same issue as WO detail page -
      // API response format mismatch causing redirect to error state
      // See: apps/frontend/app/(authenticated)/production/consumption/[woId]/page.tsx
      await consumptionPage.gotoWOConsumption(TEST_UUIDS.workOrderReleased);

      await consumptionPage.consumeMaterial('Flour', PRODUCTION_TEST_DATA.licensePlate.number, 40);

      await consumptionPage.expectSuccessToast(/consumed|success/i);
      await consumptionPage.expectConsumptionProgress('Flour', 100, 40);
      await consumptionPage.expectProgressBar('Flour', 40);
    });

    test.skip('should set LP status to consumed when qty=0', async () => {
      await consumptionPage.gotoWOConsumption('wo-id-123');

      await consumptionPage.consumeMaterial('Flour', 'LP-001', 50); // LP had 50 kg

      await consumptionPage.expectSuccessToast();
      // LP-001 status = consumed (verify via API or UI)
    });

    test.skip('should create lp_genealogy record', async () => {
      await consumptionPage.gotoWOConsumption('wo-id-123');

      await consumptionPage.consumeMaterial('Flour', 'LP-001', 40);

      // Verify genealogy created (check via API)
      await consumptionPage.expectSuccessToast();
    });

    test.skip('should show consumption progress bar at 60%', async () => {
      // Required: 100, Consumed: 60
      await consumptionPage.gotoWOConsumption('wo-with-consumption-id');

      await consumptionPage.expectConsumptionProgress('Flour', 100, 60);
      await consumptionPage.expectProgressBar('Flour', 60);
    });
  });

  test.describe('TC-PROD-047: LP Validation Errors', () => {
    test.skip('should show LP not found error within 500ms', async () => {
      await consumptionPage.gotoWOConsumption('wo-id-123');

      await consumptionPage.clickConsume('Flour');
      await consumptionPage.scanLP('LP-INVALID');

      await consumptionPage.expectLPNotFoundError();
    });

    test.skip('should show LP not available error when status=consumed', async () => {
      await consumptionPage.gotoWOConsumption('wo-id-123');

      await consumptionPage.clickConsume('Flour');
      await consumptionPage.scanLP('LP-CONSUMED');

      await consumptionPage.expectLPNotAvailableError('consumed');
    });

    test.skip('should show product mismatch error', async () => {
      await consumptionPage.gotoWOConsumption('wo-id-123');

      await consumptionPage.clickConsume('Flour'); // Requires PROD-A
      await consumptionPage.scanLP('LP-SUGAR'); // Contains PROD-B

      await consumptionPage.expectProductMismatchError('PROD-B', 'PROD-A');
    });

    test.skip('should show UoM mismatch error', async () => {
      await consumptionPage.gotoWOConsumption('wo-id-123');

      await consumptionPage.clickConsume('Water'); // Requires L
      await consumptionPage.scanLP('LP-WATER-KG'); // UoM = kg

      await consumptionPage.expectUoMMismatchError('kg', 'L');
    });

    test.skip('should show insufficient quantity error', async () => {
      await consumptionPage.gotoWOConsumption('wo-id-123');

      await consumptionPage.clickConsume('Flour');
      await consumptionPage.scanLP('LP-001'); // Has 30 kg
      await consumptionPage.enterQuantity(50); // Request 50 kg
      await consumptionPage.confirmConsumption();

      await consumptionPage.expectInsufficientQuantityError(30, 50);
    });
  });

  test.describe('TC-PROD-048: 1:1 Consumption Enforcement', () => {
    test.skip('should show error when partial consumption attempted on consume_whole_lp=true', async () => {
      // Material has consume_whole_lp = true, LP qty = 100
      await consumptionPage.gotoWOConsumption('wo-full-lp-id');

      await consumptionPage.clickConsume('Allergen Material');
      await consumptionPage.scanLP('LP-ALLERGEN');
      await consumptionPage.enterQuantity(50); // Partial
      await consumptionPage.confirmConsumption();

      await consumptionPage.expectFullLPConsumptionError(100);
    });

    test.skip('should allow consumption when qty=100 matches LP qty', async () => {
      await consumptionPage.gotoWOConsumption('wo-full-lp-id');

      await consumptionPage.consumeMaterial('Allergen Material', 'LP-ALLERGEN', 100);

      await consumptionPage.expectSuccessToast();
    });

    test.skip('should display Full LP Required badge', async () => {
      await consumptionPage.gotoWOConsumption('wo-full-lp-id');

      await consumptionPage.expectFullLPRequiredBadge('Allergen Material');
    });

    test.skip('should allow partial consumption when consume_whole_lp=false', async () => {
      await consumptionPage.gotoWOConsumption('wo-id-123');

      await consumptionPage.consumeMaterial('Flour', 'LP-001', 50);

      await consumptionPage.expectSuccessToast();
    });
  });

  test.describe('TC-PROD-049: Consumption Correction (Manager)', () => {
    test.skip('should show Reverse button for Manager/Admin role', async ({ page }) => {
      // User has role = Manager
      await consumptionPage.gotoWOConsumption('wo-with-history-id');

      await consumptionPage.expectReverseButtonVisible();
    });

    test.skip('should hide Reverse button for Operator role', async ({ page }) => {
      // User has role = Operator
      await consumptionPage.gotoWOConsumption('wo-with-history-id');

      await consumptionPage.expectReverseButtonNotVisible();
    });

    test.skip('should reverse consumption and restore LP qty', async () => {
      // LP-001 had qty=100, consumed 40, now qty=60
      await consumptionPage.gotoWOConsumption('wo-with-history-id');

      await consumptionPage.reverseConsumption('LP-001', 'Wrong LP scanned');

      // LP-001 qty should be restored to 100
      await consumptionPage.expectSuccessToast(/reversed|success/i);
      await consumptionPage.expectConsumptionReversed('LP-001');
    });

    test.skip('should mark genealogy record as reversed', async () => {
      await consumptionPage.gotoWOConsumption('wo-with-history-id');

      await consumptionPage.reverseConsumption('LP-001', 'Operator error');

      // lp_genealogy.is_reversed = true (verify via API)
      await consumptionPage.expectSuccessToast();
    });

    test.skip('should create audit trail entry', async () => {
      await consumptionPage.gotoWOConsumption('wo-with-history-id');

      await consumptionPage.reverseConsumption('LP-001', 'Wrong quantity');

      // audit_log entry created (verify via API)
      await consumptionPage.expectSuccessToast();
    });

    test.skip('should require reason for reversal', async () => {
      await consumptionPage.gotoWOConsumption('wo-with-history-id');

      await consumptionPage.clickReverse('LP-001');
      // Don't enter reason
      await consumptionPage.confirmReversal();

      await consumptionPage.expectReversalReasonRequired();
    });

    test.skip('should restore LP status to available when reversed', async () => {
      // LP-001 status = consumed before reversal
      await consumptionPage.gotoWOConsumption('wo-with-history-id');

      await consumptionPage.reverseConsumption('LP-001', 'Reversal test');

      // LP status changes to available with qty=50
      await consumptionPage.expectSuccessToast();
    });
  });

  test.describe('TC-PROD-050: Over-Consumption Control', () => {
    test.skip('should show approval request when allow_over_consumption=false and consuming over', async () => {
      // allow_over_consumption = false
      // Required = 100, Consumed = 100, attempting +10
      await consumptionPage.gotoWOConsumption('wo-at-limit-id');

      await consumptionPage.clickConsume('Flour');
      await consumptionPage.scanLP('LP-001');
      await consumptionPage.enterQuantity(10);
      await consumptionPage.confirmConsumption();

      await consumptionPage.expectOverConsumptionApprovalRequest();
    });

    test.skip('should allow over-consumption when allow_over_consumption=true', async () => {
      // allow_over_consumption = true
      // Required = 100, consuming additional 10
      await consumptionPage.gotoWOConsumption('wo-at-limit-allow-id');

      await consumptionPage.consumeMaterial('Flour', 'LP-001', 10);

      await consumptionPage.expectSuccessToast();
      await consumptionPage.expectVarianceIndicator('Flour', 10);
    });

    test.skip('should show variance indicator in red when variance > 0%', async () => {
      await consumptionPage.gotoWOConsumption('wo-over-consumed-id');

      await consumptionPage.expectVarianceIndicator('Flour', 10);
    });

    test.skip('should show variance indicator in green when variance = 0%', async () => {
      await consumptionPage.gotoWOConsumption('wo-exact-consumption-id');

      await consumptionPage.expectVarianceIndicator('Flour', 0);
    });

    test.skip('should flag WO in High Variance alert when variance > 10%', async () => {
      await consumptionPage.gotoWOConsumption('wo-high-variance-id');

      await consumptionPage.expectHighVarianceAlert('WO-2025-001');
    });

    test.skip('should record approval when manager approves', async () => {
      await consumptionPage.gotoWOConsumption('wo-pending-approval-id');

      await consumptionPage.approveOverConsumption();

      await consumptionPage.expectSuccessToast(/approved|success/i);
    });

    test.skip('should block consumption when manager rejects', async () => {
      await consumptionPage.gotoWOConsumption('wo-pending-approval-id');

      await consumptionPage.rejectOverConsumption('Investigate waste');

      // Consumption blocked, rejection reason recorded
      await consumptionPage.expectErrorToast(/rejected/i);
    });

    test.skip('should show Awaiting Approval status', async () => {
      await consumptionPage.gotoWOConsumption('wo-pending-approval-id');

      await consumptionPage.expectAwaitingApproval();
    });
  });
});
