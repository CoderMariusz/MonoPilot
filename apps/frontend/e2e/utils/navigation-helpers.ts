import { Page } from '@playwright/test';

export class NavigationHelpers {
  constructor(private page: Page) {}

  async navigateToBOM() {
    await this.page.click('a[href="/technical/bom"]');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToPlanning() {
    await this.page.click('a[href="/planning"]');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToProduction() {
    await this.page.click('a[href="/production"]');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToWarehouse() {
    await this.page.click('a[href="/warehouse"]');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToScanner() {
    await this.page.click('a[href="/scanner"]');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToSettings() {
    await this.page.click('a[href="/settings"]');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToAdmin() {
    await this.page.click('a[href="/admin"]');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToHome() {
    await this.page.click('a[href="/"]');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToLogin() {
    await this.page.goto('/login');
  }

  async navigateToSignup() {
    await this.page.goto('/signup');
  }

  async navigateToPackTerminal() {
    await this.page.click('a[href="/scanner/pack"]');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToProcessTerminal() {
    await this.page.click('a[href="/scanner/process"]');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToWorkOrdersTab() {
    await this.page.click('[data-testid="tab-work-orders"]');
  }

  async navigateToPurchaseOrdersTab() {
    await this.page.click('[data-testid="tab-purchase-orders"]');
  }

  async navigateToTransferOrdersTab() {
    await this.page.click('[data-testid="tab-transfer-orders"]');
  }

  async navigateToGRNTab() {
    await this.page.click('[data-testid="tab-grn"]');
  }

  async navigateToStockMoveTab() {
    await this.page.click('[data-testid="tab-stock-move"]');
  }

  async navigateToLPOperationsTab() {
    await this.page.click('[data-testid="tab-lp-operations"]');
  }

  async navigateToYieldReportTab() {
    await this.page.click('[data-testid="tab-yield-report"]');
  }

  async navigateToConsumeReportTab() {
    await this.page.click('[data-testid="tab-consume-report"]');
  }

  async navigateToOperationsTab() {
    await this.page.click('[data-testid="tab-operations"]');
  }

  async navigateToTraceTab() {
    await this.page.click('[data-testid="tab-trace"]');
  }

  async navigateToLocationsTab() {
    await this.page.click('[data-testid="tab-locations"]');
  }

  async navigateToMachinesTab() {
    await this.page.click('[data-testid="tab-machines"]');
  }

  async navigateToAllergensTab() {
    await this.page.click('[data-testid="tab-allergens"]');
  }

  async navigateToSuppliersTab() {
    await this.page.click('[data-testid="tab-suppliers"]');
  }

  async navigateToWarehousesTab() {
    await this.page.click('[data-testid="tab-warehouses"]');
  }

  async navigateToTaxCodesTab() {
    await this.page.click('[data-testid="tab-tax-codes"]');
  }

  async navigateToRoutingsTab() {
    await this.page.click('[data-testid="tab-routings"]');
  }

  async navigateToUserManagementTab() {
    await this.page.click('[data-testid="tab-users"]');
  }

  async navigateToSessionsTab() {
    await this.page.click('[data-testid="tab-sessions"]');
  }

  async navigateToSystemSettingsTab() {
    await this.page.click('[data-testid="tab-settings"]');
  }

  async openSidebar() {
    await this.page.click('[data-testid="sidebar-toggle"]');
  }

  async closeSidebar() {
    await this.page.click('[data-testid="sidebar-close"]');
  }

  async verifyActiveRoute(route: string) {
    await this.page.waitForURL(`**${route}**`);
  }

  async verifyBreadcrumb(items: string[]) {
    const breadcrumb = this.page.locator('[data-testid="breadcrumb"]');
    for (const item of items) {
      await breadcrumb.locator(`text="${item}"`).waitFor();
    }
  }

  async goBack() {
    await this.page.goBack();
    await this.page.waitForLoadState('networkidle');
  }

  async refreshPage() {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyPageTitle(title: string) {
    await this.page.waitForFunction((expectedTitle) => {
      return document.title.includes(expectedTitle);
    }, title);
  }

  async verifyPageHeading(heading: string) {
    await this.page.locator('h1').waitFor();
    const headingText = await this.page.locator('h1').textContent();
    if (!headingText?.includes(heading)) {
      throw new Error(`Expected heading to contain "${heading}", but got "${headingText}"`);
    }
  }

  async verifyNavigationVisible() {
    await this.page.locator('[data-testid="sidebar"]').waitFor();
  }

  async verifyNavigationHidden() {
    await this.page.locator('[data-testid="sidebar"]').waitFor({ state: 'hidden' });
  }

  async clickMenuItem(menuText: string) {
    await this.page.click(`[data-testid="menu-item"]:has-text("${menuText}")`);
  }

  async verifyMenuItemActive(menuText: string) {
    await this.page.locator(`[data-testid="menu-item"]:has-text("${menuText}")`).waitFor();
    const isActive = await this.page.locator(`[data-testid="menu-item"]:has-text("${menuText}")`).getAttribute('data-active');
    if (isActive !== 'true') {
      throw new Error(`Expected menu item "${menuText}" to be active`);
    }
  }

  async verifyMenuItemInactive(menuText: string) {
    await this.page.locator(`[data-testid="menu-item"]:has-text("${menuText}")`).waitFor();
    const isActive = await this.page.locator(`[data-testid="menu-item"]:has-text("${menuText}")`).getAttribute('data-active');
    if (isActive === 'true') {
      throw new Error(`Expected menu item "${menuText}" to be inactive`);
    }
  }

  async verifyUserMenuVisible() {
    await this.page.locator('[data-testid="user-menu"]').waitFor();
  }

  async clickUserMenu() {
    await this.page.click('[data-testid="user-menu"]');
  }

  async verifyUserInfo(username: string, role: string) {
    await this.page.locator(`text="${username}"`).waitFor();
    await this.page.locator(`text="${role}"`).waitFor();
  }

  async verifyNotificationCount(count: number) {
    const notificationBadge = this.page.locator('[data-testid="notification-badge"]');
    await notificationBadge.waitFor();
    const badgeText = await notificationBadge.textContent();
    if (badgeText !== count.toString()) {
      throw new Error(`Expected notification count to be ${count}, but got ${badgeText}`);
    }
  }

  async clickNotification() {
    await this.page.click('[data-testid="notification-button"]');
  }

  async verifyNotificationVisible() {
    await this.page.locator('[data-testid="notification-panel"]').waitFor();
  }

  async closeNotification() {
    await this.page.click('[data-testid="notification-close"]');
  }

  async verifySearchVisible() {
    await this.page.locator('[data-testid="search-input"]').waitFor();
  }

  async performSearch(query: string) {
    await this.page.fill('[data-testid="search-input"]', query);
    await this.page.keyboard.press('Enter');
  }

  async clearSearch() {
    await this.page.fill('[data-testid="search-input"]', '');
    await this.page.keyboard.press('Enter');
  }

  async verifySearchResultsVisible() {
    await this.page.locator('[data-testid="search-results"]').waitFor();
  }

  async clickSearchResult(index: number) {
    await this.page.click(`[data-testid="search-result"]:nth-child(${index + 1})`);
  }

  async verifyHelpVisible() {
    await this.page.locator('[data-testid="help-button"]').waitFor();
  }

  async clickHelp() {
    await this.page.click('[data-testid="help-button"]');
  }

  async verifyHelpPanelVisible() {
    await this.page.locator('[data-testid="help-panel"]').waitFor();
  }

  async closeHelp() {
    await this.page.click('[data-testid="help-close"]');
  }
}
