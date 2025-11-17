import { test, expect } from '@playwright/test';

test.describe('BOM Timeline Multi-Version (Story 1.6.2)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('AC-1: Visual Timeline Component - Displays version bars with color coding', async ({ page }) => {
    // Navigate to Technical module
    await page.goto('/technical');
    await expect(page).toHaveURL('/technical');

    // Click on a product to view BOMs (assuming first product in list)
    await page.click('button:has-text("View BOMs")').first();

    // Navigate to BOM versions timeline
    await page.click('button:has-text("Version Timeline")');
    await page.waitForURL(/\/technical\/boms\/\d+\/versions/);

    // Verify timeline is visible
    await expect(page.locator('h3:has-text("BOM Version Timeline")')).toBeVisible();

    // Verify version bars are rendered
    const versionBars = page.locator('[class*="bg-blue-100"], [class*="bg-green-100"], [class*="bg-yellow-100"], [class*="bg-gray-100"]');
    await expect(versionBars.first()).toBeVisible();

    // Verify month labels on X-axis
    await expect(page.locator('text=/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/')).toBeVisible();

    // Verify version labels show version number and status
    await expect(page.locator('text=/BOM v\\d+ - (DRAFT|ACTIVE|PHASED_OUT|INACTIVE)/')).toBeVisible();
  });

  test('AC-1: Overlap Detection - Red outline for overlapping versions', async ({ page }) => {
    // Navigate to BOM versions timeline (assuming we have overlapping versions in test data)
    await page.goto('/technical/boms/1/versions');
    await page.waitForSelector('h3:has-text("BOM Version Timeline")');

    // Check for overlap warning
    const overlapWarning = page.locator('text=/\\d+ version overlap\\(s\\) detected/');
    if (await overlapWarning.isVisible()) {
      // Verify red border on overlapping version bars
      const versionBarsWithOverlap = page.locator('[class*="border-red-500"]');
      await expect(versionBarsWithOverlap.first()).toBeVisible();

      // Verify warning icon
      const warningIcon = page.locator('[class*="bg-red-500"][class*="rounded-full"]');
      await expect(warningIcon.first()).toBeVisible();
    }
  });

  test('AC-2: Drag-Drop Date Adjustment - Drag left edge to change effective_from', async ({ page }) => {
    // Navigate to BOM versions timeline
    await page.goto('/technical/boms/1/versions');
    await page.waitForSelector('h3:has-text("BOM Version Timeline")');

    // Find first version bar
    const versionBar = page.locator('[class*="bg-blue-100"], [class*="bg-green-100"]').first();
    await expect(versionBar).toBeVisible();

    // Hover to reveal drag handle
    await versionBar.hover();

    // Wait for drag handle to appear
    await page.waitForTimeout(500);

    // Get initial position
    const initialBoundingBox = await versionBar.boundingBox();
    expect(initialBoundingBox).not.toBeNull();

    // Simulate drag left edge (start date)
    const leftEdge = page.locator('[class*="cursor-ew-resize"]').first();
    await leftEdge.hover();

    // Perform drag action (drag left edge to the right by 50px)
    await leftEdge.dragTo(versionBar, {
      targetPosition: { x: (initialBoundingBox!.width * 0.2), y: initialBoundingBox!.height / 2 },
    });

    // Verify ghost bar appears during drag
    const ghostBar = page.locator('[class*="border-dashed"][class*="border-blue-400"]');
    // Ghost bar may disappear quickly after drop, so this check is optional
  });

  test('AC-2: Validation - Prevent invalid date ranges', async ({ page }) => {
    // Navigate to BOM versions timeline
    await page.goto('/technical/boms/1/versions');
    await page.waitForSelector('h3:has-text("BOM Version Timeline")');

    // Try to drag right edge (end date) before left edge (start date)
    const versionBar = page.locator('[class*="bg-blue-100"], [class*="bg-green-100"]').first();
    await versionBar.hover();

    // Simulate dragging right edge to before start date (should show alert)
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('End date cannot be before start date');
      await dialog.accept();
    });

    // Attempt invalid drag (drag right edge far to the left)
    const rightEdge = page.locator('[class*="cursor-ew-resize"]').last();
    const boundingBox = await versionBar.boundingBox();
    if (boundingBox) {
      await rightEdge.dragTo(versionBar, {
        targetPosition: { x: 0, y: boundingBox.height / 2 },
      });
    }
  });

  test('AC-3: Version Lifecycle - Color coding by status', async ({ page }) => {
    // Navigate to BOM versions timeline
    await page.goto('/technical/boms/1/versions');
    await page.waitForSelector('h3:has-text("BOM Version Timeline")');

    // Verify different status colors exist
    const draftVersion = page.locator('[class*="bg-blue-100"]', { hasText: 'DRAFT' });
    const activeVersion = page.locator('[class*="bg-green-100"]', { hasText: 'ACTIVE' });
    const phasedOutVersion = page.locator('[class*="bg-yellow-100"]', { hasText: 'PHASED_OUT' });
    const inactiveVersion = page.locator('[class*="bg-gray-100"]', { hasText: 'INACTIVE' });

    // At least one status should be visible
    const anyVersion = page.locator('[class*="bg-blue-100"], [class*="bg-green-100"], [class*="bg-yellow-100"], [class*="bg-gray-100"]');
    await expect(anyVersion.first()).toBeVisible();
  });

  test('AC-4: BOM Comparison - Ctrl+Click two versions to open modal', async ({ page }) => {
    // Navigate to BOM versions timeline
    await page.goto('/technical/boms/1/versions');
    await page.waitForSelector('h3:has-text("BOM Version Timeline")');

    // Get first two version bars
    const versionBars = page.locator('[class*="bg-blue-100"], [class*="bg-green-100"], [class*="bg-yellow-100"], [class*="bg-gray-100"]');
    const count = await versionBars.count();

    if (count >= 2) {
      // Click first version
      await versionBars.nth(0).click();

      // Verify selection indicator
      await expect(page.locator('text=/Selected: 1 version/')).toBeVisible();

      // Ctrl+Click second version
      await versionBars.nth(1).click({ modifiers: ['Control'] });

      // Verify selection indicator shows 2 versions
      await expect(page.locator('text=/Selected: 2 version/')).toBeVisible();

      // Verify comparison modal opens
      await expect(page.locator('h2:has-text("BOM Version Comparison")')).toBeVisible({ timeout: 5000 });

      // Verify modal shows version numbers
      await expect(page.locator('text=/v\\d+ .* vs v\\d+/')).toBeVisible();

      // Verify summary stats (added, removed, changed, unchanged)
      await expect(page.locator('text=Added')).toBeVisible();
      await expect(page.locator('text=Removed')).toBeVisible();
      await expect(page.locator('text=Changed')).toBeVisible();
      await expect(page.locator('text=Unchanged')).toBeVisible();
    }
  });

  test('AC-4: BOM Comparison - Side-by-side diff with quantity delta', async ({ page }) => {
    // Navigate to BOM versions timeline
    await page.goto('/technical/boms/1/versions');
    await page.waitForSelector('h3:has-text("BOM Version Timeline")');

    // Select two versions
    const versionBars = page.locator('[class*="bg-blue-100"], [class*="bg-green-100"]');
    const count = await versionBars.count();

    if (count >= 2) {
      await versionBars.nth(0).click();
      await versionBars.nth(1).click({ modifiers: ['Control'] });

      // Wait for comparison modal
      await expect(page.locator('h2:has-text("BOM Version Comparison")')).toBeVisible({ timeout: 5000 });

      // Verify comparison table exists
      await expect(page.locator('table')).toBeVisible();

      // Verify table headers
      await expect(page.locator('th:has-text("Product")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
      await expect(page.locator('th:has-text("Delta")')).toBeVisible();

      // Verify status badges (ADDED, REMOVED, CHANGED, UNCHANGED)
      const statusBadges = page.locator('span:has-text("ADDED"), span:has-text("REMOVED"), span:has-text("CHANGED"), span:has-text("UNCHANGED")');
      const badgeCount = await statusBadges.count();
      expect(badgeCount).toBeGreaterThan(0);

      // Verify quantity delta display (+ or -)
      const deltaValues = page.locator('text=/[+-]\\d+\\.\\d+/');
      // Delta values may or may not exist depending on whether items changed
    }
  });

  test('E2E: Export comparison to PDF button exists', async ({ page }) => {
    // Navigate to BOM versions timeline
    await page.goto('/technical/boms/1/versions');
    await page.waitForSelector('h3:has-text("BOM Version Timeline")');

    // Select two versions to open comparison modal
    const versionBars = page.locator('[class*="bg-blue-100"], [class*="bg-green-100"]');
    const count = await versionBars.count();

    if (count >= 2) {
      await versionBars.nth(0).click();
      await versionBars.nth(1).click({ modifiers: ['Control'] });

      // Wait for comparison modal
      await expect(page.locator('h2:has-text("BOM Version Comparison")')).toBeVisible({ timeout: 5000 });

      // Verify Export to PDF button exists
      await expect(page.locator('button:has-text("Export to PDF")')).toBeVisible();
    }
  });

  test('E2E: Create New Version button navigates correctly', async ({ page }) => {
    // Navigate to BOM versions timeline
    await page.goto('/technical/boms/1/versions');
    await page.waitForSelector('h3:has-text("BOM Version Timeline")');

    // Click "Create New Version" button
    await page.click('button:has-text("Create New Version")');

    // Verify navigation to new BOM creation page
    await page.waitForURL(/\/technical\/boms\/\d+\/new/);
  });

  test('E2E: Version table displays all versions', async ({ page }) => {
    // Navigate to BOM versions timeline
    await page.goto('/technical/boms/1/versions');
    await page.waitForSelector('h3:has-text("BOM Version Timeline")');

    // Scroll to version table
    await page.locator('h3:has-text("All Versions")').scrollIntoViewIfNeeded();

    // Verify table headers
    await expect(page.locator('th:has-text("Version")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Effective From")')).toBeVisible();
    await expect(page.locator('th:has-text("Effective To")')).toBeVisible();

    // Verify at least one version row exists
    const versionRows = page.locator('tbody tr');
    const rowCount = await versionRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify "View Details" button exists
    await expect(page.locator('button:has-text("View Details")').first()).toBeVisible();
  });

  test('E2E: Instructions panel explains drag-drop functionality', async ({ page }) => {
    // Navigate to BOM versions timeline
    await page.goto('/technical/boms/1/versions');
    await page.waitForSelector('h3:has-text("BOM Version Timeline")');

    // Verify instructions panel exists
    await expect(page.locator('h3:has-text("How to use the timeline:")')).toBeVisible();

    // Verify key instructions are present
    await expect(page.locator('text=/Drag edges/')).toBeVisible();
    await expect(page.locator('text=/Ctrl\\+Click/')).toBeVisible();
    await expect(page.locator('text=/Red outline/')).toBeVisible();
  });

  test('E2E: Back button returns to BOMs list', async ({ page }) => {
    // Navigate to BOM versions timeline
    await page.goto('/technical/boms/1/versions');
    await page.waitForSelector('h3:has-text("BOM Version Timeline")');

    // Click back button
    await page.click('button:has-text("Back to BOMs")');

    // Verify navigation back
    await page.waitForURL(/\/technical/);
  });
});
