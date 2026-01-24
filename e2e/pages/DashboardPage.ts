/**
 * Dashboard Page Object
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ROUTES } from '../fixtures/test-data';

export class DashboardPage extends BasePage {
  // Selectors
  private readonly sidebar = 'aside.w-48, [data-testid="sidebar"]';
  private readonly userMenu = '[data-testid="user-menu"], button:has-text("Logout")';
  private readonly pageTitle = 'h1';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await super.goto(ROUTES.dashboard);
  }

  /**
   * Assert we're logged in (sidebar visible)
   */
  async expectLoggedIn() {
    await expect(this.page.locator(this.sidebar)).toBeVisible();
  }

  /**
   * Open user menu
   */
  async openUserMenu() {
    await this.page.click(this.userMenu);
  }

  /**
   * Logout via user menu
   */
  async logout() {
    await this.openUserMenu();
    await this.page.click('text=Logout');
    await this.page.waitForURL(new RegExp(ROUTES.login));
  }

  /**
   * Navigate to a module via sidebar
   */
  async navigateToModule(moduleName: string) {
    await this.page.click(`${this.sidebar} >> text=${moduleName}`);
    await this.waitForPageLoad();
  }

  /**
   * Get page title text
   */
  async getPageTitle(): Promise<string> {
    return await this.page.locator(this.pageTitle).first().textContent() || '';
  }

  /**
   * Assert page title
   */
  async expectPageTitle(title: string | RegExp) {
    await expect(this.page.locator(this.pageTitle).first()).toContainText(title);
  }

  // Quick navigation methods
  async goToSettings() {
    await super.goto(ROUTES.settings);
  }

  async goToTechnical() {
    await super.goto(ROUTES.technical);
  }

  async goToPlanning() {
    await super.goto(ROUTES.planning);
  }

  async goToProduction() {
    await super.goto(ROUTES.production);
  }

  async goToWarehouse() {
    await super.goto(ROUTES.warehouse);
  }

  async goToQuality() {
    await super.goto(ROUTES.quality);
  }

  async goToShipping() {
    await super.goto(ROUTES.shipping);
  }
}
