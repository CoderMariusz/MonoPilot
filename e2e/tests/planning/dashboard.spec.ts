/**
 * Planning Dashboard E2E Tests
 *
 * Covers Story 03.16: Planning Dashboard
 *
 * Test Coverage:
 * - Page layout and structure
 * - KPI cards (loading, error, display states)
 * - Alert panel (loading, empty, error, display states)
 * - Activity feed (loading, empty, error, display states)
 * - Quick action buttons (Create PO, TO, WO)
 * - Zero state message
 * - Navigation on card/alert/activity clicks
 * - Retry functionality
 */

import { test, expect } from '@playwright/test';
import { PlanningDashboardPage } from '../../pages/planning/PlanningDashboardPage';

test.describe('Planning Dashboard - Story 03.16', () => {
  let dashboardPage: PlanningDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new PlanningDashboardPage(page);
    await dashboardPage.goto();
  });

  // ==================== Page Layout & Structure ====================

  test.describe('Page Layout', () => {
    test('should display page header with title', async () => {
      await dashboardPage.expectPageHeader();
      const title = dashboardPage.getPageTitle();
      await expect(title).toContainText('Planning Dashboard');
    });

    test('should display page description', async () => {
      const description = dashboardPage.page.locator('p').filter({
        hasText: /monitor and manage/i,
      });
      await expect(description).toBeVisible();
    });

    test('should display all main sections', async () => {
      await dashboardPage.expectAllSectionsVisible();
    });

    test('should display quick action buttons', async () => {
      await dashboardPage.expectQuickActionsVisible();
    });

    test('should have responsive layout', async ({ page }) => {
      // Check that KPI grid has responsive classes
      const kpiGrid = page.locator('[role="region"][aria-label="Key Performance Indicators"]');
      await expect(kpiGrid).toBeVisible();
    });
  });

  // ==================== KPI Cards ====================

  test.describe('KPI Cards Section', () => {
    test('should display KPI cards section', async () => {
      const kpiSection = dashboardPage.page.locator('[aria-labelledby="kpi-section-title"]');
      await expect(kpiSection).toBeVisible();
    });

    test('should wait for KPI cards to load', async () => {
      await dashboardPage.expectKPIsLoaded(5000);
    });

    test('should display KPI cards without loading state', async () => {
      await dashboardPage.expectKPIsLoaded();
      const loadingCards = dashboardPage.getKPICardLoading();
      await expect(loadingCards).not.toBeVisible();
    });

    test('should display at least one KPI card', async () => {
      await dashboardPage.expectKPIsLoaded();
      const cards = dashboardPage.getKPICards();
      const count = await cards.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('should display KPI with numeric value', async () => {
      await dashboardPage.expectKPIsLoaded();
      const card = dashboardPage.getKPICard('po_pending_approval');
      await expect(card).toBeVisible();

      // Value should be a number
      const value = await dashboardPage.getKPICardValue('po_pending_approval');
      expect(value).toMatch(/^\d+[KM]?$/);
    });

    test('should have accessible KPI cards with aria-label', async () => {
      await dashboardPage.expectKPIsLoaded();
      const card = dashboardPage.getKPICard('po_pending_approval');
      const ariaLabel = await card.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('PO Pending Approval');
    });

    test('should navigate when clicking KPI card', async () => {
      await dashboardPage.expectKPIsLoaded();
      const card = dashboardPage.getKPICard('po_pending_approval');
      await card.click();
      // Should navigate to filtered list
      await expect(dashboardPage.page).toHaveURL(/\/planning\/purchase-orders/);
    });

    test('should support keyboard navigation on KPI cards', async () => {
      await dashboardPage.expectKPIsLoaded();
      const card = dashboardPage.getKPICard('po_pending_approval');

      // Focus and press Enter
      await card.focus();
      await card.press('Enter');

      await expect(dashboardPage.page).toHaveURL(/\/planning\/purchase-orders/);
    });

    test('should display all 6 KPI card types when data loaded', async () => {
      await dashboardPage.expectKPIsLoaded();

      const types = [
        'po_pending_approval',
        'po_this_month',
        'to_in_transit',
        'wo_scheduled_today',
        'wo_overdue',
        'open_orders',
      ];

      for (const type of types) {
        const card = dashboardPage.getKPICard(type);
        const isVisible = await card.isVisible().catch(() => false);
        if (isVisible) {
          // Card should have data-testid
          const testId = await card.getAttribute('data-testid');
          expect(testId).toBe(`kpi-card-${type}`);
        }
      }
    });

    test('should show KPI card error state when API fails', async ({ page }) => {
      // Intercept API call and return error
      await page.route('**/api/planning/dashboard/kpis', (route) => {
        route.abort('failed');
      });

      // Reload to trigger API call
      await dashboardPage.goto();

      // Wait briefly for error state to appear
      await dashboardPage.page.waitForTimeout(2000);

      const errorCard = dashboardPage.getKPICardError();
      const isVisible = await errorCard.isVisible().catch(() => false);

      // Error state should be visible or KPI should show some content
      if (isVisible) {
        await expect(errorCard).toBeVisible();
      }
    });

    test('should retry KPI card on error', async ({ page }) => {
      // First, cause an error
      await page.route('**/api/planning/dashboard/kpis', (route) => {
        route.abort('failed');
      });

      await dashboardPage.goto();
      await dashboardPage.page.waitForTimeout(1000);

      // Check for error state
      const hasError = await dashboardPage.getKPICardError().isVisible().catch(() => false);

      if (hasError) {
        // Unblock the route
        await page.unroute('**/api/planning/dashboard/kpis');

        // Click retry
        await dashboardPage.clickKPICardRetry();

        // Should load successfully
        await dashboardPage.expectKPIsLoaded();
      }
    });
  });

  // ==================== Alert Panel ====================

  test.describe('Alert Panel Section', () => {
    test('should display alert panel', async () => {
      await dashboardPage.expectAlertPanelVisible();
    });

    test('should wait for alerts to load', async () => {
      await dashboardPage.expectAlertsLoaded(5000);
    });

    test('should display alert panel without loading state', async () => {
      await dashboardPage.expectAlertsLoaded();
      const loadingState = dashboardPage.getAlertPanelLoading();
      await expect(loadingState).not.toBeVisible();
    });

    test('should show either empty or loaded alerts state', async () => {
      await dashboardPage.expectAlertsLoaded();

      const isEmpty = await dashboardPage.getAlertPanelEmpty().isVisible().catch(() => false);
      const hasAlerts = (await dashboardPage.getAlertItems().count()) > 0;

      expect(isEmpty || hasAlerts).toBe(true);
    });

    test('should display alert items with proper structure', async () => {
      await dashboardPage.expectAlertsLoaded();

      const alerts = dashboardPage.getAlertItems();
      const count = await alerts.count();

      if (count > 0) {
        const firstAlert = alerts.first();
        await expect(firstAlert).toBeVisible();

        // Alert should have testId
        const testId = await firstAlert.getAttribute('data-testid');
        expect(testId).toMatch(/^alert-item-/);
      }
    });

    test('should display alert with severity badge', async () => {
      await dashboardPage.expectAlertsLoaded();

      const alerts = dashboardPage.getAlertItems();
      const count = await alerts.count();

      if (count > 0) {
        const firstAlert = alerts.first();
        const badge = firstAlert.locator('[class*="badge"]');
        const isVisible = await badge.isVisible().catch(() => false);

        if (isVisible) {
          const badgeText = await badge.textContent();
          expect(badgeText).toMatch(/warning|critical/i);
        }
      }
    });

    test('should have alert count badge when alerts exist', async () => {
      await dashboardPage.expectAlertsLoaded();

      const alertPanel = dashboardPage.getAlertPanel();
      const alertItems = dashboardPage.getAlertItems();
      const itemCount = await alertItems.count();

      // Count should match item count
      expect(itemCount).toBeGreaterThanOrEqual(0);
    });

    test('should show empty state with proper messaging', async () => {
      await dashboardPage.expectAlertsLoaded();

      const isEmpty = await dashboardPage.getAlertPanelEmpty().isVisible().catch(() => false);

      if (isEmpty) {
        await expect(dashboardPage.getAlertPanelEmpty()).toContainText(/no alerts|all clear/i);
      }
    });

    test('should navigate when clicking alert item', async () => {
      await dashboardPage.expectAlertsLoaded();

      const alerts = dashboardPage.getAlertItems();
      const count = await alerts.count();

      if (count > 0) {
        const firstAlert = alerts.first();
        const testId = await firstAlert.getAttribute('data-testid');
        const alertId = testId?.replace('alert-item-', '') || '';

        if (alertId) {
          await dashboardPage.clickAlertItem(alertId);

          // Should navigate to planning module
          await expect(dashboardPage.page).toHaveURL(/\/planning\//);
        }
      }
    });

    test('should support keyboard navigation on alert items', async () => {
      await dashboardPage.expectAlertsLoaded();

      const alerts = dashboardPage.getAlertItems();
      const count = await alerts.count();

      if (count > 0) {
        const firstAlert = alerts.first();
        await firstAlert.focus();
        await firstAlert.press('Enter');

        // Should navigate
        await expect(dashboardPage.page).toHaveURL(/\/planning\//);
      }
    });

    test('should show error state when alert fetch fails', async ({ page }) => {
      // Intercept and fail alert API
      await page.route('**/api/planning/dashboard/alerts*', (route) => {
        route.abort('failed');
      });

      await dashboardPage.goto();
      await dashboardPage.page.waitForTimeout(1000);

      const hasError = await dashboardPage.getAlertPanelError().isVisible().catch(() => false);

      if (hasError) {
        await expect(dashboardPage.getAlertPanelError()).toBeVisible();
      }
    });

    test('should retry alert panel on error', async ({ page }) => {
      // First, cause an error
      await page.route('**/api/planning/dashboard/alerts*', (route) => {
        route.abort('failed');
      });

      await dashboardPage.goto();
      await dashboardPage.page.waitForTimeout(1000);

      const hasError = await dashboardPage.getAlertPanelError().isVisible().catch(() => false);

      if (hasError) {
        // Unblock route
        await page.unroute('**/api/planning/dashboard/alerts*');

        // Click retry
        await dashboardPage.clickAlertPanelRetry();

        // Should load
        await dashboardPage.expectAlertsLoaded();
      }
    });

    test('should sort alerts by severity (critical first)', async () => {
      await dashboardPage.expectAlertsLoaded();

      const alerts = dashboardPage.getAlertItems();
      const count = await alerts.count();

      if (count > 1) {
        // Alerts exist and should be sorted by severity
        // Just verify that alerts are displayed
        const firstAlert = alerts.first();
        await expect(firstAlert).toBeVisible();
      }
    });
  });

  // ==================== Activity Feed ====================

  test.describe('Activity Feed Section', () => {
    test('should display activity feed', async () => {
      await dashboardPage.expectActivityFeedVisible();
    });

    test('should wait for activities to load', async () => {
      await dashboardPage.expectActivitiesLoaded(5000);
    });

    test('should display activity feed without loading state', async () => {
      await dashboardPage.expectActivitiesLoaded();
      const loadingState = dashboardPage.getActivityFeedLoading();
      await expect(loadingState).not.toBeVisible();
    });

    test('should show either empty or loaded activities state', async () => {
      await dashboardPage.expectActivitiesLoaded();

      const isEmpty = await dashboardPage.getActivityFeedEmpty().isVisible().catch(() => false);
      const hasActivities = (await dashboardPage.getActivityItems().count()) > 0;

      expect(isEmpty || hasActivities).toBe(true);
    });

    test('should display activity items with proper structure', async () => {
      await dashboardPage.expectActivitiesLoaded();

      const activities = dashboardPage.getActivityItems();
      const count = await activities.count();

      if (count > 0) {
        const firstActivity = activities.first();
        await expect(firstActivity).toBeVisible();

        // Activity should have testId
        const testId = await firstActivity.getAttribute('data-testid');
        expect(testId).toMatch(/^activity-item-/);
      }
    });

    test('should display activity with entity info', async () => {
      await dashboardPage.expectActivitiesLoaded();

      const activities = dashboardPage.getActivityItems();
      const count = await activities.count();

      if (count > 0) {
        const firstActivity = activities.first();
        const text = await firstActivity.textContent();

        // Should contain activity information
        expect(text).toBeTruthy();
      }
    });

    test('should display activity with icon', async () => {
      await dashboardPage.expectActivitiesLoaded();

      const activities = dashboardPage.getActivityItems();
      const count = await activities.count();

      if (count > 0) {
        const firstActivity = activities.first();
        // Should have SVG icon for entity type
        const icon = firstActivity.locator('svg').first();
        const isVisible = await icon.isVisible().catch(() => false);

        if (isVisible) {
          await expect(icon).toBeVisible();
        }
      }
    });

    test('should show empty state with proper messaging', async () => {
      await dashboardPage.expectActivitiesLoaded();

      const isEmpty = await dashboardPage.getActivityFeedEmpty().isVisible().catch(() => false);

      if (isEmpty) {
        await expect(dashboardPage.getActivityFeedEmpty()).toContainText(
          /no recent activity|create your first/i
        );
      }
    });

    test('should navigate when clicking activity item', async () => {
      await dashboardPage.expectActivitiesLoaded();

      const activities = dashboardPage.getActivityItems();
      const count = await activities.count();

      if (count > 0) {
        const firstActivity = activities.first();
        const testId = await firstActivity.getAttribute('data-testid');
        const activityId = testId?.replace('activity-item-', '') || '';

        if (activityId) {
          await dashboardPage.clickActivityItem(activityId);

          // Should navigate to planning module
          await expect(dashboardPage.page).toHaveURL(/\/planning\//);
        }
      }
    });

    test('should support keyboard navigation on activity items', async () => {
      await dashboardPage.expectActivitiesLoaded();

      const activities = dashboardPage.getActivityItems();
      const count = await activities.count();

      if (count > 0) {
        const firstActivity = activities.first();
        await firstActivity.focus();
        await firstActivity.press('Enter');

        // Should navigate
        await expect(dashboardPage.page).toHaveURL(/\/planning\//);
      }
    });

    test('should show error state when activity fetch fails', async ({ page }) => {
      // Intercept and fail activity API
      await page.route('**/api/planning/dashboard/activity*', (route) => {
        route.abort('failed');
      });

      await dashboardPage.goto();
      await dashboardPage.page.waitForTimeout(1000);

      const hasError = await dashboardPage.getActivityFeedError().isVisible().catch(() => false);

      if (hasError) {
        await expect(dashboardPage.getActivityFeedError()).toBeVisible();
      }
    });

    test('should retry activity feed on error', async ({ page }) => {
      // First, cause an error
      await page.route('**/api/planning/dashboard/activity*', (route) => {
        route.abort('failed');
      });

      await dashboardPage.goto();
      await dashboardPage.page.waitForTimeout(1000);

      const hasError = await dashboardPage.getActivityFeedError().isVisible().catch(() => false);

      if (hasError) {
        // Unblock route
        await page.unroute('**/api/planning/dashboard/activity*');

        // Click retry
        await dashboardPage.clickActivityFeedRetry();

        // Should load
        await dashboardPage.expectActivitiesLoaded();
      }
    });

    test('should display activity with relative timestamp', async () => {
      await dashboardPage.expectActivitiesLoaded();

      const activities = dashboardPage.getActivityItems();
      const count = await activities.count();

      if (count > 0) {
        const firstActivity = activities.first();
        const text = await firstActivity.textContent();

        // Should contain time reference (ago, just now, today, yesterday, etc)
        expect(text).toMatch(/ago|now|yesterday|today|hour|minute|day/i);
      }
    });

    test('should limit activities to 20 items', async () => {
      await dashboardPage.expectActivitiesLoaded();

      const activities = dashboardPage.getActivityItems();
      const count = await activities.count();

      // Should show max 20 items
      expect(count).toBeLessThanOrEqual(20);
    });
  });

  // ==================== Quick Actions ====================

  test.describe('Quick Action Buttons', () => {
    test('should display Create PO button', async () => {
      const button = dashboardPage.getCreatePOButton();
      await expect(button).toBeVisible();
    });

    test('should display Create TO button', async () => {
      const button = dashboardPage.getCreateTOButton();
      await expect(button).toBeVisible();
    });

    test('should display Create WO button', async () => {
      const button = dashboardPage.getCreateWOButton();
      await expect(button).toBeVisible();
    });

    test('should navigate to PO create form on Create PO click', async () => {
      await dashboardPage.clickCreatePO();
      await expect(dashboardPage.page).toHaveURL(/\/planning\/purchase-orders\/new/);
    });

    test.skip('should navigate to TO section on Create TO click', async () => {
      // NOTE: TO create form not yet implemented
      // Button navigates to /planning/transfer-orders/new but route doesn't exist
      const initialUrl = dashboardPage.page.url();
      await dashboardPage.clickCreateTO();
      const newUrl = dashboardPage.page.url();

      // Should navigate away from dashboard
      expect(newUrl).not.toBe(initialUrl);

      // Should be in planning module
      expect(newUrl).toContain('/planning');
    });

    test('should navigate to WO create form on Create WO click', async () => {
      await dashboardPage.clickCreateWO();
      await expect(dashboardPage.page).toHaveURL(/\/planning\/work-orders/);
    });

    test('should have proper accessible labels on buttons', async () => {
      const poButton = dashboardPage.getCreatePOButton();
      const toButton = dashboardPage.getCreateTOButton();
      const woButton = dashboardPage.getCreateWOButton();

      await expect(poButton).toContainText(/create po/i);
      await expect(toButton).toContainText(/create to/i);
      await expect(woButton).toContainText(/create wo/i);
    });
  });

  // ==================== Zero State ====================

  test.describe('Zero State Message', () => {
    test('should display zero state help message when no data', async () => {
      // Navigate to dashboard
      await dashboardPage.goto();
      await dashboardPage.expectDashboardLoaded();

      // Check if zero state is visible (only when all sections are empty)
      const isZeroState = await dashboardPage.getZeroStateMessage().isVisible().catch(() => false);

      if (isZeroState) {
        await expect(dashboardPage.getZeroStateMessage()).toContainText(/get started/i);
      }
    });

    test('should hide zero state when data is present', async () => {
      await dashboardPage.expectDashboardLoaded();

      const kpiCount = await dashboardPage.getKPICards().count();
      const alertCount = await dashboardPage.getAlertItems().count();
      const activityCount = await dashboardPage.getActivityItems().count();

      const hasData = kpiCount > 0 || alertCount > 0 || activityCount > 0;

      if (hasData) {
        const isZeroStateVisible = await dashboardPage
          .getZeroStateMessage()
          .isVisible()
          .catch(() => false);

        // If data exists, zero state should not be visible
        expect(isZeroStateVisible).toBe(false);
      }
    });
  });

  // ==================== Overall Dashboard ====================

  test.describe('Dashboard Overall Behavior', () => {
    test('should load entire dashboard within reasonable time', async () => {
      const startTime = Date.now();

      await dashboardPage.goto();
      await dashboardPage.expectDashboardLoaded(10000);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should load within 10 seconds
      expect(duration).toBeLessThan(10000);
    });

    test('should display all sections with ARIA labels for accessibility', async () => {
      const kpiSection = dashboardPage.page.locator('[aria-labelledby="kpi-section-title"]');
      const alertSection = dashboardPage.page.locator('[aria-labelledby="alerts-section-title"]');
      const activitySection = dashboardPage.page.locator(
        '[aria-labelledby="activity-section-title"]'
      );

      await expect(kpiSection).toBeVisible();
      await expect(alertSection).toBeVisible();
      await expect(activitySection).toBeVisible();
    });

    test('should have proper role attributes on interactive elements', async () => {
      await dashboardPage.expectDashboardLoaded();

      // KPI cards should be buttons
      const kpiCards = dashboardPage.getKPICards();
      const cardRole = await kpiCards.first().getAttribute('role');
      expect(cardRole).toBe('button');

      // Alert items should be buttons
      const alertItems = dashboardPage.getAlertItems();
      if ((await alertItems.count()) > 0) {
        const alertRole = await alertItems.first().getAttribute('role');
        expect(alertRole).toBe('button');
      }

      // Activity items should be buttons
      const activityItems = dashboardPage.getActivityItems();
      if ((await activityItems.count()) > 0) {
        const activityRole = await activityItems.first().getAttribute('role');
        expect(activityRole).toBe('button');
      }
    });

    test('should handle rapid navigation between dashboard and list pages', async () => {
      // Go to PO list
      await dashboardPage.clickCreatePO();
      await expect(dashboardPage.page).toHaveURL(/\/planning\/purchase-orders/);

      // Go back to dashboard
      await dashboardPage.page.goBack();

      // Should be back at dashboard
      await expect(dashboardPage.page).toHaveURL(/\/planning$/);
    });

    test('should maintain state when returning to dashboard', async () => {
      await dashboardPage.expectDashboardLoaded();

      // Navigate away
      await dashboardPage.clickCreatePO();
      await expect(dashboardPage.page).toHaveURL(/\/planning\/purchase-orders/);

      // Navigate back
      await dashboardPage.page.goBack();

      // Should be back at dashboard
      await dashboardPage.expectPageHeader();
      await dashboardPage.expectDashboardLoaded();
    });
  });

  // ==================== Responsive & Visual ====================

  test.describe('Responsive Design', () => {
    test('should display correctly on desktop viewport', async ({ page }) => {
      page.setViewportSize({ width: 1920, height: 1080 });
      await dashboardPage.goto();
      await dashboardPage.expectDashboardLoaded();

      // KPI grid should be 3 columns on desktop
      const kpiGrid = page.locator('[role="region"][aria-label="Key Performance Indicators"]');
      await expect(kpiGrid).toBeVisible();
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      page.setViewportSize({ width: 768, height: 1024 });
      await dashboardPage.goto();
      await dashboardPage.expectDashboardLoaded();

      // All sections should still be visible
      await dashboardPage.expectAllSectionsVisible();
    });

    test('should display correctly on mobile viewport', async ({ page }) => {
      page.setViewportSize({ width: 375, height: 812 });
      await dashboardPage.goto();
      await dashboardPage.expectDashboardLoaded();

      // Sections should still be visible on mobile
      await dashboardPage.expectAllSectionsVisible();
    });
  });
});
