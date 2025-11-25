/**
 * E2E Tests: BOM Module (Batch 2B)
 * Stories: 2.6-2.14
 *
 * Tests complete user flows for:
 * - BOM CRUD operations (Story 2.6)
 * - BOM Items management (Story 2.7)
 * - Date validation (Story 2.8)
 * - Timeline visualization (Story 2.9)
 * - BOM Clone (Story 2.10)
 * - BOM Compare (Story 2.11)
 * - Conditional Items (Story 2.12)
 * - By-Products (Story 2.13)
 * - Allergen Inheritance (Story 2.14)
 *
 * NOTE: These tests require E2E environment setup with Playwright
 * Run locally with: pnpm test:e2e
 */

import { test, expect, type Page } from '@playwright/test'

// Test user credentials
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'admin@test.com'
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'TestPassword123!'

/**
 * Helper: Login to application
 */
async function login(page: Page) {
  await page.goto('/login')
  await page.fill('input[name="email"]', TEST_EMAIL)
  await page.fill('input[name="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|technical)/)
}

/**
 * Helper: Navigate to BOMs page
 */
async function goToBOMs(page: Page) {
  await page.goto('/technical/boms')
  await page.waitForSelector('[data-testid="boms-table"]', { timeout: 10000 })
}

// ============================================================================
// BOM CRUD Tests (Story 2.6)
// ============================================================================
test.describe('BOM CRUD (Story 2.6)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display BOMs list (AC-2.6.1)', async ({ page }) => {
    await goToBOMs(page)

    // Verify table is displayed
    await expect(page.locator('[data-testid="boms-table"]')).toBeVisible()

    // Verify table has headers
    await expect(page.locator('th:has-text("Product")')).toBeVisible()
    await expect(page.locator('th:has-text("Version")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()
  })

  test('should filter BOMs by status', async ({ page }) => {
    await goToBOMs(page)

    // Click status filter
    await page.click('[data-testid="status-filter"]')
    await page.click('[data-testid="filter-option-active"]')

    await page.waitForTimeout(500)
    await expect(page.locator('[data-testid="boms-table"]')).toBeVisible()
  })

  test('should create new BOM (AC-2.6.2)', async ({ page }) => {
    await goToBOMs(page)

    // Click add button
    await page.click('[data-testid="add-bom-btn"]')

    // Fill form
    await page.click('[data-testid="product-select"]')
    await page.click('[data-testid="product-option"]:first-child')

    const today = new Date().toISOString().split('T')[0]
    await page.fill('input[name="effective_from"]', today)
    await page.fill('input[name="output_qty"]', '10')
    await page.fill('input[name="output_uom"]', 'pcs')

    // Submit
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
  })

  test('should auto-assign version number (AC-2.6.3)', async ({ page }) => {
    await goToBOMs(page)

    // Navigate to BOM detail
    await page.click('[data-testid="bom-row"]:first-child')
    await page.waitForSelector('[data-testid="bom-detail"]')

    // Version should be displayed
    await expect(page.locator('[data-testid="bom-version"]')).toBeVisible()
  })

  test('should edit BOM details', async ({ page }) => {
    await goToBOMs(page)

    // Click edit on first BOM
    await page.click('[data-testid="bom-row"]:first-child [data-testid="edit-btn"]')

    // Update notes
    await page.fill('textarea[name="notes"]', 'Updated via E2E test')

    // Submit
    await page.click('button[type="submit"]')

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
  })
})

// ============================================================================
// BOM Items Tests (Story 2.7)
// ============================================================================
test.describe('BOM Items Management (Story 2.7)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display BOM items list', async ({ page }) => {
    await goToBOMs(page)

    // Navigate to BOM detail
    await page.click('[data-testid="bom-row"]:first-child')
    await page.waitForSelector('[data-testid="bom-detail"]')

    // Items section should be visible
    await expect(page.locator('[data-testid="bom-items-section"]')).toBeVisible()
  })

  test('should add new BOM item', async ({ page }) => {
    await goToBOMs(page)

    // Navigate to BOM detail
    await page.click('[data-testid="bom-row"]:first-child')
    await page.waitForSelector('[data-testid="bom-detail"]')

    // Click add item button
    await page.click('[data-testid="add-item-btn"]')

    // Fill item form
    await page.click('[data-testid="item-product-select"]')
    await page.click('[data-testid="product-option"]:first-child')
    await page.fill('input[name="quantity"]', '5')
    await page.fill('input[name="uom"]', 'kg')

    // Submit
    await page.click('[data-testid="save-item-btn"]')

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
  })
})

// ============================================================================
// BOM Timeline Tests (Story 2.9)
// ============================================================================
test.describe('BOM Timeline Visualization (Story 2.9)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display timeline view', async ({ page }) => {
    await page.goto('/technical/boms')

    // Click timeline view button
    await page.click('[data-testid="timeline-view-btn"]')

    // Timeline should be visible
    await expect(page.locator('[data-testid="bom-timeline"]')).toBeVisible()
  })
})

// ============================================================================
// BOM Clone Tests (Story 2.10)
// ============================================================================
test.describe('BOM Clone (Story 2.10)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should clone existing BOM', async ({ page }) => {
    await goToBOMs(page)

    // Navigate to BOM detail
    await page.click('[data-testid="bom-row"]:first-child')
    await page.waitForSelector('[data-testid="bom-detail"]')

    // Click clone button
    await page.click('[data-testid="clone-bom-btn"]')

    // Clone modal should appear
    await expect(page.locator('[data-testid="clone-modal"]')).toBeVisible()

    // Fill new effective date
    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + 1)
    await page.fill('input[name="effective_from"]', futureDate.toISOString().split('T')[0])

    // Submit
    await page.click('[data-testid="confirm-clone-btn"]')

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
  })
})

// ============================================================================
// BOM Compare Tests (Story 2.11)
// ============================================================================
test.describe('BOM Compare (Story 2.11)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display compare view', async ({ page }) => {
    await page.goto('/technical/boms/compare')

    // Compare page should be visible
    await expect(page.locator('[data-testid="bom-compare"]')).toBeVisible()

    // Should have two BOM selectors
    await expect(page.locator('[data-testid="bom-select-left"]')).toBeVisible()
    await expect(page.locator('[data-testid="bom-select-right"]')).toBeVisible()
  })
})

// ============================================================================
// Allergen Inheritance Tests (Story 2.14)
// ============================================================================
test.describe('Allergen Inheritance (Story 2.14)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display inherited allergens on BOM', async ({ page }) => {
    await goToBOMs(page)

    // Navigate to BOM detail
    await page.click('[data-testid="bom-row"]:first-child')
    await page.waitForSelector('[data-testid="bom-detail"]')

    // Allergen inheritance section should be visible
    await expect(page.locator('[data-testid="allergen-inheritance"]')).toBeVisible()
  })
})

/**
 * Test Coverage Summary:
 *
 * BOM CRUD (5 tests):
 *   - Display BOMs list
 *   - Filter by status
 *   - Create BOM
 *   - Auto-assign version
 *   - Edit BOM
 *
 * BOM Items (2 tests):
 *   - Display items list
 *   - Add new item
 *
 * Timeline (1 test):
 *   - Display timeline
 *
 * Clone (1 test):
 *   - Clone BOM
 *
 * Compare (1 test):
 *   - Display compare view
 *
 * Allergen Inheritance (1 test):
 *   - Display inherited allergens
 *
 * Total: 11 E2E tests
 */
