/**
 * Production Dashboard Page Object
 *
 * Encapsulates all interactions with /production/dashboard page
 * including KPIs, active WOs, alerts, and filters.
 *
 * Covers FR-PROD-001: Production Dashboard
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface DashboardKPIs {
  ordersToday: number;
  unitsProduced: number;
  avgYield: number;
  activeWOs: number;
  materialShortages: number;
  oeeToday: number;
}

export interface Alert {
  type: 'Material Shortage' | 'WO Delayed' | 'Quality Hold' | 'Machine Down' | 'Low Yield' | 'OEE Below Target';
  priority: 'High' | 'Medium' | 'Low';
  message: string;
}

export class ProductionDashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ==================== Navigation ====================

  /**
   * Navigate to production dashboard
   */
  async goto() {
    await super.goto('/production/dashboard');
  }

  // ==================== Page Layout ====================

  /**
   * Assert page header is visible
   */
  async expectPageHeader() {
    const heading = this.page.getByRole('heading', { name: /production dashboard/i });
    await expect(heading).toBeVisible();
  }

  /**
   * Assert KPI cards are visible
   */
  async expectKPICards() {
    const kpiCards = this.page.locator('[data-testid*="kpi-"], .kpi-card');
    const count = await kpiCards.count();
    expect(count).toBeGreaterThanOrEqual(4); // At least 4 KPI cards
  }

  // ==================== KPI Cards ====================

  /**
   * Get Orders Today KPI value
   */
  async getOrdersToday(): Promise<number> {
    const kpi = this.page.locator('[data-testid="kpi-orders-today"], :has-text("Orders Today")');
    const text = await kpi.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get Units Produced KPI value
   */
  async getUnitsProduced(): Promise<number> {
    const kpi = this.page.locator('[data-testid="kpi-units-produced"], :has-text("Units Produced")');
    const text = await kpi.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get Average Yield KPI value
   */
  async getAvgYield(): Promise<number> {
    const kpi = this.page.locator('[data-testid="kpi-avg-yield"], :has-text("Avg Yield")');
    const text = await kpi.textContent();
    const match = text?.match(/([\d.]+)%/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Get Active WOs KPI value
   */
  async getActiveWOs(): Promise<number> {
    const kpi = this.page.locator('[data-testid="kpi-active-wos"], :has-text("Active WO")');
    const text = await kpi.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get Material Shortages KPI value
   */
  async getMaterialShortages(): Promise<number> {
    const kpi = this.page.locator('[data-testid="kpi-material-shortages"], :has-text("Material Shortage")');
    const text = await kpi.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get OEE Today KPI value
   */
  async getOEEToday(): Promise<number> {
    const kpi = this.page.locator('[data-testid="kpi-oee-today"], :has-text("OEE")');
    const text = await kpi.textContent();
    const match = text?.match(/([\d.]+)%/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Get all KPIs at once
   */
  async getAllKPIs(): Promise<DashboardKPIs> {
    return {
      ordersToday: await this.getOrdersToday(),
      unitsProduced: await this.getUnitsProduced(),
      avgYield: await this.getAvgYield(),
      activeWOs: await this.getActiveWOs(),
      materialShortages: await this.getMaterialShortages(),
      oeeToday: await this.getOEEToday(),
    };
  }

  /**
   * Assert KPIs load within timeout
   */
  async expectKPIsLoaded(timeout: number = 2000) {
    const kpiCard = this.page.locator('[data-testid*="kpi-"]').first();
    await expect(kpiCard).toBeVisible({ timeout });
  }

  // ==================== Active WOs Table ====================

  /**
   * Get active WOs table
   */
  getActiveWOsTable(): Locator {
    return this.page.locator('[data-testid="active-wos-table"], table').first();
  }

  /**
   * Get row count from active WOs table
   */
  async getActiveWOsCount(): Promise<number> {
    const table = this.getActiveWOsTable();
    const rows = table.locator('tbody tr');
    return await rows.count();
  }

  /**
   * Assert active WO appears in table
   */
  async expectWOInTable(woNumber: string) {
    const table = this.getActiveWOsTable();
    const row = table.locator('tbody tr').filter({ hasText: woNumber });
    await expect(row).toBeVisible();
  }

  /**
   * Get WO row data
   */
  async getWORowData(woNumber: string): Promise<any> {
    const table = this.getActiveWOsTable();
    const row = table.locator('tbody tr').filter({ hasText: woNumber });
    const cells = row.locator('td');

    return {
      woNumber: await cells.nth(0).textContent(),
      product: await cells.nth(1).textContent(),
      qty: await cells.nth(2).textContent(),
      progress: await cells.nth(3).textContent(),
      status: await cells.nth(4).textContent(),
      line: await cells.nth(5).textContent(),
      startedAt: await cells.nth(6).textContent(),
    };
  }

  /**
   * Click WO row to view detail
   */
  async clickWO(woNumber: string) {
    const table = this.getActiveWOsTable();
    const row = table.locator('tbody tr').filter({ hasText: woNumber });
    await row.click();
    await this.waitForPageLoad();
  }

  /**
   * Click View action on WO
   */
  async clickViewWO(woNumber: string) {
    const table = this.getActiveWOsTable();
    const row = table.locator('tbody tr').filter({ hasText: woNumber });
    const viewButton = row.locator('button[title="View"], button:has-text("View")');
    await viewButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Click Pause action on WO
   */
  async clickPauseWO(woNumber: string) {
    const table = this.getActiveWOsTable();
    const row = table.locator('tbody tr').filter({ hasText: woNumber });
    const pauseButton = row.locator('button[title="Pause"], button:has-text("Pause")');
    await pauseButton.click();
  }

  /**
   * Click Complete action on WO
   */
  async clickCompleteWO(woNumber: string) {
    const table = this.getActiveWOsTable();
    const row = table.locator('tbody tr').filter({ hasText: woNumber });
    const completeButton = row.locator('button[title="Complete"], button:has-text("Complete")');
    await completeButton.click();
  }

  // ==================== Filters ====================

  /**
   * Filter by production line
   */
  async filterByLine(lineName: string) {
    const lineFilter = this.page.locator('button[aria-label*="Filter by line" i], select[name="line"]');

    if (await lineFilter.getAttribute('role') === 'combobox') {
      // ShadCN Select
      await lineFilter.click();
      await this.page.waitForTimeout(200);
      const option = this.page.getByRole('option', { name: lineName });
      await option.click();
    } else {
      // Native select
      await lineFilter.selectOption(lineName);
    }

    await this.waitForPageLoad();
  }

  /**
   * Filter by product
   */
  async filterByProduct(productName: string) {
    const productFilter = this.page.locator('button[aria-label*="Filter by product" i], select[name="product"]');

    if (await productFilter.getAttribute('role') === 'combobox') {
      await productFilter.click();
      await this.page.waitForTimeout(200);
      const option = this.page.getByRole('option', { name: productName });
      await option.click();
    } else {
      await productFilter.selectOption(productName);
    }

    await this.waitForPageLoad();
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: 'In Progress' | 'Paused' | 'Released') {
    const statusFilter = this.page.locator('button[aria-label*="Filter by status" i], select[name="status"]');

    if (await statusFilter.getAttribute('role') === 'combobox') {
      await statusFilter.click();
      await this.page.waitForTimeout(200);
      const option = this.page.getByRole('option', { name: status });
      await option.click();
    } else {
      await statusFilter.selectOption(status);
    }

    await this.waitForPageLoad();
  }

  // ==================== Alerts Panel ====================

  /**
   * Get alerts panel
   */
  getAlertsPanel(): Locator {
    return this.page.locator('[data-testid="alerts-panel"], .alerts-panel');
  }

  /**
   * Get alert count
   */
  async getAlertCount(): Promise<number> {
    const panel = this.getAlertsPanel();
    const alerts = panel.locator('.alert-item, [data-testid*="alert-"]');
    return await alerts.count();
  }

  /**
   * Assert alert appears
   */
  async expectAlert(message: string | RegExp) {
    const alert = this.page.getByText(message);
    await expect(alert).toBeVisible();
  }

  /**
   * Assert high priority alert
   */
  async expectHighPriorityAlert(message: string | RegExp) {
    const alert = this.page.locator('.alert-high, [data-priority="high"]').filter({ hasText: message });
    await expect(alert).toBeVisible();
  }

  /**
   * Assert material shortage alert
   */
  async expectMaterialShortageAlert(woNumber?: string) {
    const alertText = woNumber
      ? new RegExp(`material.*shortage.*${woNumber}`, 'i')
      : /material.*shortage/i;
    await this.expectHighPriorityAlert(alertText);
  }

  /**
   * Assert WO delayed alert
   */
  async expectWODelayedAlert(woNumber?: string) {
    const alertText = woNumber
      ? new RegExp(`delayed.*${woNumber}`, 'i')
      : /delayed|overdue/i;
    await this.expectAlert(alertText);
  }

  /**
   * Assert quality hold alert
   */
  async expectQualityHoldAlert() {
    await this.expectAlert(/quality.*hold|qa.*hold/i);
  }

  /**
   * Assert machine down alert
   */
  async expectMachineDownAlert(machineName?: string) {
    const alertText = machineName
      ? new RegExp(`machine.*down.*${machineName}`, 'i')
      : /machine.*down/i;
    await this.expectHighPriorityAlert(alertText);
  }

  /**
   * Assert low yield alert
   */
  async expectLowYieldAlert(woNumber?: string) {
    const alertText = woNumber
      ? new RegExp(`low.*yield.*${woNumber}`, 'i')
      : /low.*yield/i;
    await this.expectAlert(alertText);
  }

  // ==================== Actions ====================

  /**
   * Click manual refresh button
   */
  async clickRefresh() {
    const refreshButton = this.page.getByRole('button', { name: /refresh|reload/i });
    await refreshButton.click();
    await this.page.waitForTimeout(500); // Wait for refresh to complete
  }

  /**
   * Click export CSV button
   */
  async clickExportCSV() {
    const exportButton = this.page.getByRole('button', { name: /export|csv/i });
    const downloadPromise = this.page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;
    return download;
  }

  /**
   * Click Start WO quick action
   */
  async clickStartWO() {
    const startButton = this.page.getByRole('button', { name: /start.*wo|start.*work.*order/i });
    await startButton.click();
  }

  /**
   * Click View Queue quick action
   */
  async clickViewQueue() {
    const queueButton = this.page.getByRole('button', { name: /view.*queue|queue/i });
    await queueButton.click();
    await this.waitForPageLoad();
  }

  // ==================== Empty States ====================

  /**
   * Assert no active WOs message
   */
  async expectNoActiveWOs() {
    const emptyMessage = this.page.getByText(/no active work orders|no wos/i);
    await expect(emptyMessage).toBeVisible();
  }

  /**
   * Assert no alerts message
   */
  async expectNoAlerts() {
    const emptyMessage = this.page.getByText(/no alerts|all clear/i);
    await expect(emptyMessage).toBeVisible();
  }

  // ==================== Auto-Refresh ====================

  /**
   * Wait for auto-refresh interval (default 30 seconds)
   */
  async waitForAutoRefresh(seconds: number = 30) {
    await this.page.waitForTimeout(seconds * 1000);
  }

  /**
   * Assert KPIs updated after refresh
   */
  async expectKPIsUpdated(oldKPIs: DashboardKPIs) {
    await this.page.waitForTimeout(500);
    const newKPIs = await this.getAllKPIs();

    // At least one KPI should have changed
    const changed =
      newKPIs.ordersToday !== oldKPIs.ordersToday ||
      newKPIs.unitsProduced !== oldKPIs.unitsProduced ||
      newKPIs.avgYield !== oldKPIs.avgYield ||
      newKPIs.activeWOs !== oldKPIs.activeWOs ||
      newKPIs.materialShortages !== oldKPIs.materialShortages ||
      newKPIs.oeeToday !== oldKPIs.oeeToday;

    expect(changed).toBe(true);
  }
}
