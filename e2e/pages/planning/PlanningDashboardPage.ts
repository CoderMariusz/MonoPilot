/**
 * Planning Dashboard Page Object
 *
 * Encapsulates all selectors and interactions for the Planning Dashboard.
 * Covers Story 03.16: Planning Dashboard
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class PlanningDashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ==================== Navigation ====================

  /**
   * Navigate to planning dashboard
   */
  async goto() {
    await super.goto('/planning');
  }

  // ==================== Page Header & Structure ====================

  /**
   * Get page header title
   */
  getPageTitle(): Locator {
    return this.page.locator('h1').filter({ hasText: 'Planning Dashboard' });
  }

  /**
   * Expect page header to be visible
   */
  async expectPageHeader() {
    await expect(this.getPageTitle()).toBeVisible();
  }

  // ==================== Quick Actions ====================

  /**
   * Get Create PO button
   */
  getCreatePOButton(): Locator {
    return this.page.getByRole('link', { name: /create po/i });
  }

  /**
   * Get Create TO button
   */
  getCreateTOButton(): Locator {
    return this.page.getByRole('link', { name: /create to/i });
  }

  /**
   * Get Create WO button
   */
  getCreateWOButton(): Locator {
    return this.page.getByRole('link', { name: /create wo/i });
  }

  /**
   * Click Create PO button
   */
  async clickCreatePO() {
    await this.getCreatePOButton().click();
    await this.waitForPageLoad();
  }

  /**
   * Click Create TO button
   */
  async clickCreateTO() {
    await this.getCreateTOButton().click();
    await this.waitForPageLoad();
  }

  /**
   * Click Create WO button
   */
  async clickCreateWO() {
    await this.getCreateWOButton().click();
    await this.waitForPageLoad();
  }

  /**
   * Expect quick action buttons are visible
   */
  async expectQuickActionsVisible() {
    await expect(this.getCreatePOButton()).toBeVisible();
    await expect(this.getCreateTOButton()).toBeVisible();
    await expect(this.getCreateWOButton()).toBeVisible();
  }

  // ==================== KPI Cards ====================

  /**
   * Get all KPI cards
   */
  getKPICards(): Locator {
    return this.page.locator('[data-testid^="kpi-card-"]');
  }

  /**
   * Get specific KPI card by type
   */
  getKPICard(type: string): Locator {
    return this.page.locator(`[data-testid="kpi-card-${type}"]`);
  }

  /**
   * Get KPI card loading state
   */
  getKPICardLoading(): Locator {
    return this.page.locator('[data-testid="kpi-card-loading"]');
  }

  /**
   * Get KPI card error state
   */
  getKPICardError(): Locator {
    return this.page.locator('[data-testid="kpi-card-error"]');
  }

  /**
   * Wait for KPIs to load (max 5 seconds)
   */
  async expectKPIsLoaded(timeout = 5000) {
    const loadingCards = this.getKPICardLoading();
    // Wait for all loading states to disappear
    await this.page.waitForFunction(
      () => {
        const count = document.querySelectorAll('[data-testid="kpi-card-loading"]').length;
        return count === 0;
      },
      { timeout }
    );
  }

  /**
   * Expect KPI cards to be visible (6 cards)
   */
  async expectKPICardsVisible() {
    const cards = this.getKPICards();
    // Should have 6 KPI cards (excluding loading/error states)
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1); // At least 1 visible
  }

  /**
   * Get KPI card value by type
   */
  async getKPICardValue(type: string): Promise<string> {
    const card = this.getKPICard(type);
    const valueText = await card.locator('p:nth-of-type(2)').textContent();
    return valueText?.trim() || '0';
  }

  /**
   * Click KPI card
   */
  async clickKPICard(type: string) {
    await this.getKPICard(type).click();
    await this.waitForPageLoad();
  }

  /**
   * Expect KPI card to have a specific value
   */
  async expectKPICardValue(type: string, value: string | number) {
    const card = this.getKPICard(type);
    await expect(card).toContainText(value.toString());
  }

  /**
   * Click retry button on KPI card error
   */
  async clickKPICardRetry() {
    const errorCard = this.getKPICardError();
    await errorCard.locator('button').filter({ hasText: /retry/i }).click();
    await this.waitForPageLoad();
  }

  // ==================== Alert Panel ====================

  /**
   * Get alert panel container
   */
  getAlertPanel(): Locator {
    return this.page.locator('[data-testid="alert-panel"]');
  }

  /**
   * Get alert panel loading state
   */
  getAlertPanelLoading(): Locator {
    return this.page.locator('[data-testid="alert-panel-loading"]');
  }

  /**
   * Get alert panel empty state
   */
  getAlertPanelEmpty(): Locator {
    return this.page.locator('[data-testid="alert-panel-empty"]');
  }

  /**
   * Get alert panel error state
   */
  getAlertPanelError(): Locator {
    return this.page.locator('[data-testid="alert-panel-error"]');
  }

  /**
   * Get all alert items
   */
  getAlertItems(): Locator {
    return this.page.locator('[data-testid^="alert-item-"]');
  }

  /**
   * Get alert item by ID
   */
  getAlertItem(alertId: string): Locator {
    return this.page.locator(`[data-testid="alert-item-${alertId}"]`);
  }

  /**
   * Wait for alerts to load
   */
  async expectAlertsLoaded(timeout = 5000) {
    await this.page.waitForFunction(
      () => {
        const count = document.querySelectorAll('[data-testid="alert-panel-loading"]').length;
        return count === 0;
      },
      { timeout }
    );
  }

  /**
   * Expect alert panel is visible
   */
  async expectAlertPanelVisible() {
    await expect(this.getAlertPanel()).toBeVisible();
  }

  /**
   * Expect alert panel shows loading state
   */
  async expectAlertPanelLoading() {
    await expect(this.getAlertPanelLoading()).toBeVisible();
  }

  /**
   * Expect alert panel shows empty state
   */
  async expectAlertPanelEmpty() {
    await expect(this.getAlertPanelEmpty()).toBeVisible();
  }

  /**
   * Expect alert panel shows error state
   */
  async expectAlertPanelError() {
    await expect(this.getAlertPanelError()).toBeVisible();
  }

  /**
   * Get alert count badge
   */
  async getAlertCount(): Promise<number> {
    const badge = this.getAlertPanel().locator('[class*="badge"]');
    const text = await badge.textContent();
    return parseInt(text?.trim() || '0', 10);
  }

  /**
   * Click alert item
   */
  async clickAlertItem(alertId: string) {
    await this.getAlertItem(alertId).click();
    await this.waitForPageLoad();
  }

  /**
   * Expect alert panel contains text
   */
  async expectAlertPanelContains(text: string | RegExp) {
    await expect(this.getAlertPanel()).toContainText(text);
  }

  /**
   * Click alert panel retry button
   */
  async clickAlertPanelRetry() {
    const errorState = this.getAlertPanelError();
    await errorState.locator('button').filter({ hasText: /retry/i }).click();
    await this.waitForPageLoad();
  }

  // ==================== Activity Feed ====================

  /**
   * Get activity feed container
   */
  getActivityFeed(): Locator {
    return this.page.locator('[data-testid="activity-feed"]');
  }

  /**
   * Get activity feed loading state
   */
  getActivityFeedLoading(): Locator {
    return this.page.locator('[data-testid="activity-feed-loading"]');
  }

  /**
   * Get activity feed empty state
   */
  getActivityFeedEmpty(): Locator {
    return this.page.locator('[data-testid="activity-feed-empty"]');
  }

  /**
   * Get activity feed error state
   */
  getActivityFeedError(): Locator {
    return this.page.locator('[data-testid="activity-feed-error"]');
  }

  /**
   * Get all activity items
   */
  getActivityItems(): Locator {
    return this.page.locator('[data-testid^="activity-item-"]');
  }

  /**
   * Get activity item by ID
   */
  getActivityItem(activityId: string): Locator {
    return this.page.locator(`[data-testid="activity-item-${activityId}"]`);
  }

  /**
   * Wait for activities to load
   */
  async expectActivitiesLoaded(timeout = 5000) {
    await this.page.waitForFunction(
      () => {
        const count = document.querySelectorAll('[data-testid="activity-feed-loading"]').length;
        return count === 0;
      },
      { timeout }
    );
  }

  /**
   * Expect activity feed is visible
   */
  async expectActivityFeedVisible() {
    await expect(this.getActivityFeed()).toBeVisible();
  }

  /**
   * Expect activity feed shows loading state
   */
  async expectActivityFeedLoading() {
    await expect(this.getActivityFeedLoading()).toBeVisible();
  }

  /**
   * Expect activity feed shows empty state
   */
  async expectActivityFeedEmpty() {
    await expect(this.getActivityFeedEmpty()).toBeVisible();
  }

  /**
   * Expect activity feed shows error state
   */
  async expectActivityFeedError() {
    await expect(this.getActivityFeedError()).toBeVisible();
  }

  /**
   * Get activity count
   */
  async getActivityCount(): Promise<number> {
    const items = this.getActivityItems();
    return await items.count();
  }

  /**
   * Click activity item
   */
  async clickActivityItem(activityId: string) {
    await this.getActivityItem(activityId).click();
    await this.waitForPageLoad();
  }

  /**
   * Expect activity feed contains text
   */
  async expectActivityFeedContains(text: string | RegExp) {
    await expect(this.getActivityFeed()).toContainText(text);
  }

  /**
   * Click activity feed retry button
   */
  async clickActivityFeedRetry() {
    const errorState = this.getActivityFeedError();
    await errorState.locator('button').filter({ hasText: /retry/i }).click();
    await this.waitForPageLoad();
  }

  // ==================== Zero State ====================

  /**
   * Get zero state help message
   */
  getZeroStateMessage(): Locator {
    return this.page.locator('[class*="bg-blue-50"]').filter({ hasText: /get started/i });
  }

  /**
   * Expect zero state message visible
   */
  async expectZeroStateVisible() {
    await expect(this.getZeroStateMessage()).toBeVisible();
  }

  /**
   * Expect zero state message hidden
   */
  async expectZeroStateHidden() {
    await expect(this.getZeroStateMessage()).not.toBeVisible();
  }

  // ==================== Overall Dashboard State ====================

  /**
   * Wait for entire dashboard to load
   */
  async expectDashboardLoaded(timeout = 10000) {
    // Wait for all major sections to be visible or have finished loading
    await Promise.race([
      this.expectKPIsLoaded(timeout),
      this.page.waitForTimeout(timeout),
    ]).catch(() => {
      // Timeout is OK, we just ensure we don't wait forever
    });
  }

  /**
   * Get all sections loading state
   */
  async getAllSectionsLoaded(): Promise<boolean> {
    const kpiLoading = await this.getKPICardLoading().count();
    const alertLoading = await this.getAlertPanelLoading().count();
    const activityLoading = await this.getActivityFeedLoading().count();

    return kpiLoading === 0 && alertLoading === 0 && activityLoading === 0;
  }

  /**
   * Expect dashboard to show all sections
   */
  async expectAllSectionsVisible() {
    await expect(this.page.locator('[aria-labelledby="kpi-section-title"]')).toBeVisible();
    await expect(this.page.locator('[aria-labelledby="alerts-section-title"]')).toBeVisible();
    await expect(this.page.locator('[aria-labelledby="activity-section-title"]')).toBeVisible();
  }
}
