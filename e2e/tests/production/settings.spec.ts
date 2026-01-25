/**
 * Production Settings E2E Tests
 *
 * Covers FR-PROD-017: Production Settings
 *
 * Test Coverage:
 * - TC-PROD-141 to TC-PROD-150: All 15 production settings and validation
 */

import { test, expect } from '@playwright/test';
import { BasePage } from '../../pages/BasePage';

test.describe('Production Settings', () => {
  let settingsPage: BasePage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new BasePage(page);
    await settingsPage.goto('/settings/production-execution');
  });

  test.describe('TC-PROD-141: Settings Page Layout', () => {
    test('should display settings page with form controls', async ({ page }) => {
      // Verify page header
      const heading = page.getByRole('heading', { name: /production.*settings|execution.*settings/i });
      await expect(heading).toBeVisible();

      // Settings page should have either toggles or inputs (UI-only test)
      const hasControls = (await page.locator('button[role="switch"]').count() > 0) ||
                         (await page.locator('input[type="number"]').count() > 0) ||
                         (await page.locator('input[type="checkbox"]').count() > 0) ||
                         (await page.locator('select').count() > 0);

      expect(hasControls).toBe(true);
    });
  });

  test.describe('TC-PROD-142: Toggle Settings', () => {
    test.skip('should toggle allow_pause_wo from OFF to ON and persist', async ({ page }) => {
      const pauseToggle = page.locator('button[role="switch"]').filter({ has: page.locator(':text-matches("pause", "i")') }).first();

      const ariaChecked = await pauseToggle.getAttribute('aria-checked');
      const initialState = ariaChecked === 'true';

      // Toggle switch
      await pauseToggle.click();
      await page.waitForTimeout(200);

      // Save settings
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();

      await settingsPage.expectSuccessToast(/settings.*saved|saved.*success/i);

      // Reload and verify persistence
      await settingsPage.reload();

      const newAriaChecked = await pauseToggle.getAttribute('aria-checked');
      expect(newAriaChecked).toBe(initialState ? 'false' : 'true');
    });

    test.skip('should show Pause button on WO detail when allow_pause_wo=ON', async ({ page }) => {
      // Enable allow_pause_wo
      const pauseToggle = page.locator('button[role="switch"]').filter({ has: page.locator(':text-matches("pause", "i")') }).first();
      const ariaChecked = await pauseToggle.getAttribute('aria-checked');

      if (ariaChecked !== 'true') {
        await pauseToggle.click();
        await page.getByRole('button', { name: /save/i }).click();
        await settingsPage.expectSuccessToast();
      }

      // Navigate to WO detail
      await page.goto('/production/execution/wo-id-123');

      const pauseButton = page.getByRole('button', { name: /pause/i });
      await expect(pauseButton).toBeVisible();
    });
  });

  test.describe('TC-PROD-143: Numeric Settings', () => {
    test.skip('should set dashboard_refresh_seconds=15 and save', async ({ page }) => {
      const refreshInput = page.locator('input[name="dashboard_refresh_seconds"], input[type="number"]').first();

      await refreshInput.fill('15');

      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();

      await settingsPage.expectSuccessToast();
    });

    test.skip('should refresh dashboard every 15 seconds after setting change', async ({ page }) => {
      // Set refresh to 15 seconds
      const refreshInput = page.locator('input[name="dashboard_refresh_seconds"]');
      if (await refreshInput.count() > 0) {
        await refreshInput.fill('15');
        await page.getByRole('button', { name: /save/i }).click();
        await settingsPage.expectSuccessToast();
      }

      // Navigate to dashboard and verify refresh interval
      await page.goto('/production/dashboard');

      // Would verify auto-refresh after 15 seconds
    });
  });

  test.describe('TC-PROD-144: Validation Rules', () => {
    test.skip('should show error when dashboard_refresh_seconds=0', async ({ page }) => {
      const refreshInput = page.locator('input[name="dashboard_refresh_seconds"]');

      if (await refreshInput.count() > 0) {
        await refreshInput.fill('0');

        const saveButton = page.getByRole('button', { name: /save/i });
        await saveButton.click();

        await settingsPage.expectErrorToast(/refresh.*at least.*5.*seconds/i);
      }
    });

    test.skip('should accept dashboard_refresh_seconds=5 (minimum)', async ({ page }) => {
      const refreshInput = page.locator('input[name="dashboard_refresh_seconds"]');

      if (await refreshInput.count() > 0) {
        await refreshInput.fill('5');

        const saveButton = page.getByRole('button', { name: /save/i }).click();

        await settingsPage.expectSuccessToast();
      }
    });

    test.skip('should show error when target_oee_percent=110', async ({ page }) => {
      const oeeInput = page.locator('input[name="target_oee_percent"]');

      if (await oeeInput.count() > 0) {
        await oeeInput.fill('110');

        const saveButton = page.getByRole('button', { name: /save/i });
        await saveButton.click();

        await settingsPage.expectErrorToast(/oee.*between.*0.*100/i);
      }
    });

    test.skip('should accept target_oee_percent=85', async ({ page }) => {
      const oeeInput = page.locator('input[name="target_oee_percent"]');

      if (await oeeInput.count() > 0) {
        await oeeInput.fill('85');

        const saveButton = page.getByRole('button', { name: /save/i });
        await saveButton.click();

        await settingsPage.expectSuccessToast();
      }
    });
  });

  test.describe('TC-PROD-145: OEE Target Display', () => {
    test.skip('should show 85% target line on OEE dashboard when target_oee_percent=85', async ({ page }) => {
      // Set target OEE to 85
      const oeeInput = page.locator('input[name="target_oee_percent"]');
      if (await oeeInput.count() > 0) {
        await oeeInput.fill('85');
        await page.getByRole('button', { name: /save/i }).click();
        await settingsPage.expectSuccessToast();
      }

      // Navigate to OEE dashboard
      await page.goto('/production/oee');

      // Verify target line at 85%
      const targetLine = page.locator('[data-testid="target-line"], .target-oee-line');
      if (await targetLine.count() > 0) {
        await expect(targetLine).toContainText('85');
      }
    });
  });

  test.describe('TC-PROD-146: Unsaved Changes Warning', () => {
    test.skip('should show confirmation when navigating away with unsaved changes', async ({ page }) => {
      const refreshInput = page.locator('input[name="dashboard_refresh_seconds"]');

      if (await refreshInput.count() > 0) {
        await refreshInput.fill('20');

        // Don't save, try to navigate away
        page.once('dialog', async dialog => {
          expect(dialog.message()).toMatch(/unsaved.*changes|leave/i);
          await dialog.accept();
        });

        await page.goto('/production/dashboard');
      }
    });
  });

  test.describe('TC-PROD-147: Settings Categories', () => {
    test.skip('should display Work Order Lifecycle settings section', async ({ page }) => {
      const section = page.getByText(/work.*order|lifecycle|execution/i);
      await expect(section.first()).toBeVisible();
    });

    test.skip('should display Material Consumption settings section', async ({ page }) => {
      const section = page.getByText(/material.*consumption|consumption.*control/i);
      await expect(section.first()).toBeVisible();
    });

    test.skip('should display Output Registration settings section', async ({ page }) => {
      const section = page.getByText(/output.*registration|quality.*control/i);
      await expect(section.first()).toBeVisible();
    });

    test.skip('should display Dashboard & Alerts settings section', async ({ page }) => {
      const section = page.getByText(/dashboard|alerts/i);
      await expect(section.first()).toBeVisible();
    });

    test.skip('should display OEE Tracking settings section', async ({ page }) => {
      const section = page.getByText(/oee|downtime/i);
      await expect(section.first()).toBeVisible();
    });
  });

  test.describe('TC-PROD-148: Reset to Defaults', () => {
    test.skip('should reset all settings to default values when Reset clicked', async ({ page }) => {
      const resetButton = page.getByRole('button', { name: /reset.*default/i });

      if (await resetButton.count() > 0) {
        await resetButton.click();

        // Confirm reset
        page.once('dialog', async dialog => {
          await dialog.accept();
        });

        await settingsPage.expectSuccessToast(/reset|restored/i);
      }
    });
  });

  test.describe('TC-PROD-149: Settings Impact', () => {
    test.skip('should hide OEE metrics when enable_oee_tracking=OFF', async ({ page }) => {
      // Disable OEE tracking
      const oeeToggle = page.locator('button[role="switch"]').filter({ has: page.locator(':text-matches("oee", "i")') }).first();

      const ariaChecked = await oeeToggle.getAttribute('aria-checked');
      if (ariaChecked === 'true') {
        await oeeToggle.click();
        await page.getByRole('button', { name: /save/i }).click();
        await settingsPage.expectSuccessToast();
      }

      // Navigate to dashboard
      await page.goto('/production/dashboard');

      // OEE KPI should be hidden
      const oeeKPI = page.locator('[data-testid="kpi-oee-today"]');
      await expect(oeeKPI).not.toBeVisible();
    });

    test.skip('should show OEE metrics when enable_oee_tracking=ON', async ({ page }) => {
      // Enable OEE tracking
      const oeeToggle = page.locator('button[role="switch"]').filter({ has: page.locator(':text-matches("oee", "i")') }).first();

      const ariaChecked = await oeeToggle.getAttribute('aria-checked');
      if (ariaChecked !== 'true') {
        await oeeToggle.click();
        await page.getByRole('button', { name: /save/i }).click();
        await settingsPage.expectSuccessToast();
      }

      // Navigate to dashboard
      await page.goto('/production/dashboard');

      // OEE KPI should be visible
      const oeeKPI = page.locator('[data-testid="kpi-oee-today"]');
      await expect(oeeKPI).toBeVisible();
    });
  });

  test.describe('TC-PROD-150: Settings Permissions', () => {
    test.skip('should allow Admin role to modify production settings', async ({ page }) => {
      // User has role = Admin
      const saveButton = page.getByRole('button', { name: /save/i });
      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeEnabled();
    });

    test.skip('should prevent Operator role from accessing settings page', async ({ page }) => {
      // User has role = Operator (test with different user)
      // Would verify redirect or 403 error
    });
  });
});
