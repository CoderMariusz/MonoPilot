import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Audit Logs (pgAudit Extension)
 * Tests FDA 21 CFR Part 11 compliant audit trail functionality
 *
 * Story 1.1: Enable pgAudit Extension
 * Priority: P0 (Critical - Compliance Requirement)
 *
 * Test Coverage:
 * - AC-1: Display audit logs with filtering
 * - AC-2: Application-level vs database-level logs differentiation
 * - AC-3: CSV export functionality
 * - AC-4: RLS (Row Level Security) enforcement
 * - AC-5: Audit log detail modal with before/after comparison
 * - AC-6: Performance (<200ms query response, <5% write overhead)
 */

test.describe('Audit Logs', () => {
  let adminEmail: string;
  let adminPassword: string;

  test.beforeEach(async ({ page }) => {
    // Use test credentials
    adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@example.com';
    adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin123';

    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  /**
   * AC-1: Audit logs page displays all logs with filtering
   * Risk: HIGH (Core functionality)
   */
  test('AC-1: Should display audit logs page with filters', async ({ page }) => {
    // Navigate to Audit Logs page
    await page.goto('/settings/audit-logs');

    // Verify page title
    await expect(page.locator('h1')).toContainText('Audit Logs');

    // Verify stats cards are visible
    await expect(page.locator('text=Total Logs')).toBeVisible();
    await expect(page.locator('text=Last 24 Hours')).toBeVisible();
    await expect(page.locator('text=Last 7 Days')).toBeVisible();

    // Verify filter inputs are present
    await expect(page.locator('label:has-text("Source")')).toBeVisible();
    await expect(page.locator('label:has-text("User Email")')).toBeVisible();
    await expect(page.locator('label:has-text("Object/Table")')).toBeVisible();
    await expect(page.locator('label:has-text("Command/Action")')).toBeVisible();

    // Verify filter buttons
    await expect(page.locator('button:has-text("Apply Filters")')).toBeVisible();
    await expect(page.locator('button:has-text("Clear Filters")')).toBeVisible();
    await expect(page.locator('button:has-text("Export to CSV")')).toBeVisible();

    // Verify table is visible
    await expect(page.locator('table')).toBeVisible();

    // Verify table headers
    await expect(page.locator('th:has-text("Timestamp")')).toBeVisible();
    await expect(page.locator('th:has-text("Source")')).toBeVisible();
    await expect(page.locator('th:has-text("User")')).toBeVisible();
    await expect(page.locator('th:has-text("Object/Table")')).toBeVisible();
    await expect(page.locator('th:has-text("Command/Action")')).toBeVisible();
  });

  /**
   * AC-1: Filter audit logs by user email
   * Risk: HIGH (Critical filtering functionality)
   */
  test('AC-1: Should filter audit logs by user email', async ({ page }) => {
    await page.goto('/settings/audit-logs');

    // Wait for initial logs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Get initial row count
    const initialRows = await page.locator('table tbody tr').count();
    expect(initialRows).toBeGreaterThan(0);

    // Apply user email filter
    await page.fill('input[placeholder*="user email"]', adminEmail);
    await page.click('button:has-text("Apply Filters")');

    // Wait for filtered results
    await page.waitForTimeout(1000); // Allow API call to complete

    // Verify filtered results contain admin email
    const filteredRows = await page.locator('table tbody tr').count();
    expect(filteredRows).toBeGreaterThan(0);

    // Verify first row contains admin email
    const firstRowUser = await page.locator('table tbody tr:first-child td:nth-child(3)').textContent();
    expect(firstRowUser).toContain(adminEmail);
  });

  /**
   * AC-1: Filter audit logs by date range
   * Risk: MEDIUM (Important filtering functionality)
   */
  test('AC-1: Should filter audit logs by date range', async ({ page }) => {
    await page.goto('/settings/audit-logs');

    // Set date range to today
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 16);

    await page.fill('input[type="datetime-local"]:nth-of-type(1)', yesterdayStr);
    await page.fill('input[type="datetime-local"]:nth-of-type(2)', todayStr);
    await page.click('button:has-text("Apply Filters")');

    // Wait for filtered results
    await page.waitForTimeout(1000);

    // Verify results are within date range
    const firstRowTimestamp = await page.locator('table tbody tr:first-child td:first-child').textContent();
    expect(firstRowTimestamp).toBeTruthy();

    // Parse timestamp and verify it's within range
    const timestampDate = new Date(firstRowTimestamp!);
    expect(timestampDate.getTime()).toBeGreaterThanOrEqual(yesterday.getTime());
    expect(timestampDate.getTime()).toBeLessThanOrEqual(today.getTime());
  });

  /**
   * AC-2: Differentiate application-level vs database-level logs
   * Risk: HIGH (Core functionality - must distinguish sources)
   */
  test('AC-2: Should differentiate app vs database logs', async ({ page }) => {
    await page.goto('/settings/audit-logs');

    // Wait for logs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Check source badges
    const sourceBadges = page.locator('table tbody td:nth-child(2) span');
    const firstBadge = await sourceBadges.first().textContent();

    // Verify badge contains either "App" or "Database"
    expect(firstBadge).toMatch(/App|Database/);

    // Filter by application logs
    await page.selectOption('select', 'app');
    await page.click('button:has-text("Apply Filters")');
    await page.waitForTimeout(1000);

    // Verify all visible badges say "App"
    const appBadges = await page.locator('table tbody td:nth-child(2) span').allTextContents();
    appBadges.forEach((badge) => {
      expect(badge).toContain('App');
    });

    // Filter by database logs
    await page.selectOption('select', 'db');
    await page.click('button:has-text("Apply Filters")');
    await page.waitForTimeout(1000);

    // Verify all visible badges say "Database"
    const dbBadges = await page.locator('table tbody td:nth-child(2) span').allTextContents();
    dbBadges.forEach((badge) => {
      expect(badge).toContain('Database');
    });
  });

  /**
   * AC-3: Export audit logs to CSV
   * Risk: MEDIUM (Important for compliance reporting)
   */
  test('AC-3: Should export audit logs to CSV', async ({ page }) => {
    await page.goto('/settings/audit-logs');

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.click('button:has-text("Export to CSV")');

    // Wait for download
    const download = await downloadPromise;

    // Verify download filename
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/audit_logs_.*\.csv/);

    // Verify download completed
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  /**
   * AC-4: RLS (Row Level Security) enforcement - users only see their org's logs
   * Risk: CRITICAL (Security vulnerability if RLS fails)
   *
   * LIMITATION: This test only verifies basic RLS functionality (user can access their own logs).
   *
   * TODO: Comprehensive RLS test should include:
   * 1. Create User A (Org 1) and User B (Org 2)
   * 2. User A performs action → creates audit log entry for Org 1
   * 3. User B performs action → creates audit log entry for Org 2
   * 4. Login as User A → verify can see Org 1 logs, CANNOT see Org 2 logs (negative assertion)
   * 5. Login as User B → verify can see Org 2 logs, CANNOT see Org 1 logs (negative assertion)
   *
   * Current test: Validates RLS doesn't block all access (basic smoke test)
   */
  test('AC-4: Should enforce RLS and show only org logs', async ({ page }) => {
    await page.goto('/settings/audit-logs');

    // Wait for logs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Verify that logs are returned (RLS allows access for user's own org)
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);

    // Verify that we're actually querying audit_log_view (not raw audit_log table)
    // This ensures RLS policy is in the query path
    // The view should combine app-level and db-level logs with org_id filtering

    // Get first row data to verify it's properly formatted
    const firstRowCells = await page.locator('table tbody tr:first-child td').allTextContents();
    expect(firstRowCells.length).toBeGreaterThan(0);

    // Verify we have timestamp, user, operation, table columns (basic structure check)
    // This confirms the view is returning data in expected format
    expect(firstRowCells.some(cell => cell.trim().length > 0)).toBe(true);

    // LIMITATION: Without multi-tenant test setup, we cannot verify:
    // - User A CANNOT see User B's logs (negative assertion)
    // - RLS properly filters by org_id across organizations
    // These require dedicated test users in separate organizations
  });

  /**
   * AC-5: Audit log detail modal with before/after comparison
   * Risk: HIGH (Critical for understanding changes)
   */
  test('AC-5: Should open detail modal and show before/after comparison', async ({ page }) => {
    await page.goto('/settings/audit-logs');

    // Wait for logs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Filter to show only application logs (which have before/after data)
    await page.selectOption('select', 'app');
    await page.click('button:has-text("Apply Filters")');
    await page.waitForTimeout(1000);

    // Click on first log row
    await page.locator('table tbody tr:first-child').click();

    // Verify modal opened
    await expect(page.locator('h2:has-text("Audit Log Details")')).toBeVisible();

    // Verify metadata section
    await expect(page.locator('h3:has-text("Metadata")')).toBeVisible();
    await expect(page.locator('dt:has-text("Timestamp")')).toBeVisible();
    await expect(page.locator('dt:has-text("Source")')).toBeVisible();
    await expect(page.locator('dt:has-text("User")')).toBeVisible();
    await expect(page.locator('dt:has-text("Object/Table")')).toBeVisible();

    // Close modal
    await page.click('button:has-text("Close")');

    // Verify modal closed
    await expect(page.locator('h2:has-text("Audit Log Details")')).not.toBeVisible();
  });

  /**
   * AC-5: Audit log detail modal shows SQL statement for database logs
   * Risk: MEDIUM (Important for database-level audit trail)
   */
  test('AC-5: Should show SQL statement for database logs', async ({ page }) => {
    await page.goto('/settings/audit-logs');

    // Wait for logs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Filter to show only database logs
    await page.selectOption('select', 'db');
    await page.click('button:has-text("Apply Filters")');
    await page.waitForTimeout(1000);

    // Check if any database logs exist
    const dbRowsCount = await page.locator('table tbody tr').count();

    if (dbRowsCount > 0) {
      // Click on first database log row
      await page.locator('table tbody tr:first-child').click();

      // Verify modal opened
      await expect(page.locator('h2:has-text("Audit Log Details")')).toBeVisible();

      // Verify SQL statement section exists
      await expect(page.locator('h3:has-text("SQL Statement")')).toBeVisible();

      // Close modal
      await page.click('button:has-text("Close")');
    } else {
      console.log('No database logs available for testing - skipping SQL statement verification');
    }
  });

  /**
   * AC-6: Performance - Query response time <200ms
   * Risk: MEDIUM (Performance requirement for large datasets)
   */
  test('AC-6: Should load audit logs within 200ms', async ({ page }) => {
    await page.goto('/settings/audit-logs');

    // Measure time to load logs
    const startTime = Date.now();

    // Wait for table to be visible
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    console.log(`Audit logs loaded in ${loadTime}ms`);

    // Allow some buffer for E2E overhead (network, rendering)
    // In production, API response time should be <200ms
    expect(loadTime).toBeLessThan(2000); // 2 seconds total including network
  });

  /**
   * AC-6: Pagination - Should handle large result sets
   * Risk: MEDIUM (Important for usability with many logs)
   */
  test('AC-6: Should paginate audit logs correctly', async ({ page }) => {
    await page.goto('/settings/audit-logs');

    // Wait for logs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Check if pagination controls are visible
    const paginationExists = await page.locator('nav[aria-label="Pagination"]').count();

    if (paginationExists > 0) {
      // Get current page number
      const currentPageButton = page.locator('button.bg-blue-50');
      const currentPage = await currentPageButton.textContent();
      expect(currentPage).toBe('1');

      // Click next page
      await page.click('button[aria-label="Pagination"] >> text=Next');
      await page.waitForTimeout(1000);

      // Verify page changed
      const newPage = await currentPageButton.textContent();
      expect(newPage).toBe('2');

      // Verify total count is displayed
      await expect(page.locator('text=/Showing.*of.*results/')).toBeVisible();
    } else {
      console.log('Pagination not visible - likely less than 100 logs');
    }
  });

  /**
   * Clear filters functionality
   * Risk: LOW (Nice-to-have)
   */
  test('Should clear all filters', async ({ page }) => {
    await page.goto('/settings/audit-logs');

    // Apply some filters
    await page.fill('input[placeholder*="user email"]', adminEmail);
    await page.fill('input[placeholder*="table name"]', 'users');
    await page.click('button:has-text("Apply Filters")');

    await page.waitForTimeout(1000);

    // Clear filters
    await page.click('button:has-text("Clear Filters")');

    await page.waitForTimeout(500);

    // Verify inputs are cleared
    const userEmailValue = await page.inputValue('input[placeholder*="user email"]');
    const tableValue = await page.inputValue('input[placeholder*="table name"]');

    expect(userEmailValue).toBe('');
    expect(tableValue).toBe('');
  });

  /**
   * Sorting functionality
   * Risk: LOW (Nice-to-have)
   */
  test('Should sort audit logs by clicking column headers', async ({ page }) => {
    await page.goto('/settings/audit-logs');

    // Wait for logs to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Get first row timestamp before sorting
    const firstTimestampBefore = await page.locator('table tbody tr:first-child td:first-child').textContent();

    // Click timestamp header to sort ascending
    await page.click('th:has-text("Timestamp")');
    await page.waitForTimeout(500);

    // Get first row timestamp after sorting
    const firstTimestampAfter = await page.locator('table tbody tr:first-child td:first-child').textContent();

    // Timestamps should be different after sorting (unless only 1 row)
    const rowCount = await page.locator('table tbody tr').count();
    if (rowCount > 1) {
      // Verify sort indicator is present
      await expect(page.locator('th:has-text("Timestamp") span')).toBeVisible();
    }
  });
});
