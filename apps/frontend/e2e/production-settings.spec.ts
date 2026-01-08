import { test, expect } from '@playwright/test';

/**
 * RED PHASE TESTS
 * E2E tests for Production Settings flow.
 * These tests will fail because the page and logic do not exist.
 */

test.describe('Production Settings E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/settings/production');
  });

  test('should load settings page and display sections', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Production Settings');
    await expect(page.getByText('WO Execution')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('OEE')).toBeVisible();
  });

  test('should toggle allow_pause_wo and save', async ({ page }) => {
    const pauseToggle = page.getByRole('switch', { name: /allow pause wo/i });

    const initialState = await pauseToggle.isChecked();

    await pauseToggle.click();

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Settings saved successfully')).toBeVisible();

    await page.reload();

    const newState = await pauseToggle.isChecked();
    expect(newState).toBe(!initialState);
  });

  test('should show validation error for invalid refresh interval', async ({ page }) => {
    const refreshInput = page.getByRole('spinbutton', { name: /dashboard refresh seconds/i });

    await refreshInput.fill('0');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(/Refresh interval must be at least 5 seconds/)).toBeVisible();

    await expect(page.getByText('Settings saved successfully')).not.toBeVisible();
  });

  test('should show info tooltip for Phase 1 settings', async ({ page }) => {
    const infoIcon = page.getByLabel(/info.*allow over consumption/i).or(
      page.locator('text=Allow Over Consumption').locator('..').getByTitle(/Available in Phase 1/i)
    );

    await infoIcon.hover();

    await expect(page.getByText('Available in Phase 1 after Epic 05')).toBeVisible();
  });

  test('should reset changes when clicking Reset', async ({ page }) => {
    const pauseToggle = page.getByRole('switch', { name: /allow pause wo/i });
    const initialState = await pauseToggle.isChecked();

    await pauseToggle.click();
    await page.getByRole('button', { name: 'Reset' }).click();

    const revertedState = await pauseToggle.isChecked();
    expect(revertedState).toBe(initialState);
  });

  test('should warn on unsaved changes navigation', async ({ page }) => {
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('unsaved changes');
      dialog.accept();
    });

    const pauseToggle = page.getByRole('switch', { name: /allow pause wo/i });
    await pauseToggle.click();

    await page.getByRole('link', { name: 'Dashboard' }).click();
  });
});
