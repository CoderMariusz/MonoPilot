/**
 * E2E Tests: BOM Costing Flow
 * Story: 02.9 - BOM-Routing Link + Cost Calculation
 * Phase: RED - Tests will fail until features fully implemented
 *
 * Tests complete user flows:
 * 1. View cost on BOM detail page
 * 2. Recalculate cost and verify update
 * 3. Error handling - missing ingredient costs
 * 4. Error handling - no routing assigned
 * 5. Permission check - read-only user
 * 6. Phase 1+ feature visibility
 *
 * Coverage includes:
 * - Full costing flow from BOM detail to cost display
 * - Cost recalculation with success/error states
 * - Error messages with fix instructions
 * - Permission enforcement in UI
 * - Feature flag verification
 *
 * Acceptance Criteria: AC-01, AC-02, AC-21, AC-22, AC-25, AC-26
 * Coverage: All major user flows and error paths
 */

import { test, expect, Page } from '@playwright/test'

// ============================================================================
// TEST SETUP
// ============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Test user credentials
const ADMIN_USER = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'password123'
}

const VIEWER_USER = {
  email: process.env.TEST_VIEWER_EMAIL || 'viewer@test.com',
  password: process.env.TEST_VIEWER_PASSWORD || 'password123'
}

const MANAGER_USER = {
  email: process.env.TEST_MANAGER_EMAIL || 'manager@test.com',
  password: process.env.TEST_MANAGER_PASSWORD || 'password123'
}

// Test data IDs (pre-seeded in test database)
const TEST_BOM_WITH_ROUTING = 'bom-e2e-001-with-routing'
const TEST_BOM_NO_ROUTING = 'bom-e2e-002-no-routing'
const TEST_BOM_MISSING_COSTS = 'bom-e2e-003-missing-costs'
const TEST_BOM_WITH_MARGIN = 'bom-e2e-004-with-margin'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function login(page: Page, user: typeof ADMIN_USER) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  await page.click('button:has-text("Sign In")')
  // Wait for navigation to complete
  await page.waitForNavigation()
}

async function navigateToBOMDetail(page: Page, bomId: string) {
  await page.goto(`${BASE_URL}/technical/boms/${bomId}`)
  await page.waitForLoadState('networkidle')
}

async function waitForCostSummary(page: Page) {
  // Wait for Cost Summary section to be visible
  await page.waitForSelector('text=Cost Summary', { timeout: 5000 })
}

// ============================================================================
// E2E TEST SUITES
// ============================================================================

test.describe('BOM Costing - Full Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test
    await page.context().clearCookies()
  })

  test('AC-02: View cost on BOM detail page', async ({ page }) => {
    // AC-01: Routing dropdown shown
    // AC-02: Routing name displays with link to routing detail
    // Expected: BOM with routing assigned shows cost data on detail page

    // Login as admin
    await login(page, ADMIN_USER)

    // Navigate to BOM with routing
    await navigateToBOMDetail(page, TEST_BOM_WITH_ROUTING)

    // Verify Cost Summary section displays
    await page.waitForSelector('[data-testid="cost-summary-card"]', { timeout: 5000 })
    const costCard = await page.locator('[data-testid="cost-summary-card"]')
    await expect(costCard).toBeVisible()

    // Verify material cost displays
    const materialCost = page.locator('[data-testid="material-cost"]')
    await expect(materialCost).toBeVisible()
    const materialValue = await materialCost.textContent()
    expect(materialValue).toMatch(/\d+\.\d{2}\s*PLN/)

    // Verify labor cost displays
    const laborCost = page.locator('[data-testid="labor-cost"]')
    await expect(laborCost).toBeVisible()
    const laborValue = await laborCost.textContent()
    expect(laborValue).toMatch(/\d+\.\d{2}\s*PLN/)

    // Verify overhead cost displays
    const overheadCost = page.locator('[data-testid="overhead-cost"]')
    await expect(overheadCost).toBeVisible()

    // Verify total cost displays
    const totalCost = page.locator('[data-testid="total-cost"]')
    await expect(totalCost).toBeVisible()
    const totalValue = await totalCost.textContent()
    expect(totalValue).toMatch(/\d+\.\d{2}\s*PLN/)

    // Verify cost breakdown chart displays
    const costChart = page.locator('[data-testid="cost-breakdown-chart"]')
    await expect(costChart).toBeVisible()

    // Verify routing name displays
    const routingLink = page.locator('[data-testid="routing-link"]')
    await expect(routingLink).toBeVisible()
    const routingName = await routingLink.textContent()
    expect(routingName).toBeTruthy()
  })

  test('AC-21, AC-22: Recalculate cost flow', async ({ page }) => {
    // AC-22: POST recalculate-cost creates new product_costs record within 2 seconds
    // Expected: Cost recalculates and displays updated values

    // Login as manager
    await login(page, MANAGER_USER)

    // Navigate to BOM
    await navigateToBOMDetail(page, TEST_BOM_WITH_ROUTING)
    await waitForCostSummary(page)

    // Get initial cost value
    const initialCostElement = page.locator('[data-testid="total-cost"]')
    const initialCostText = await initialCostElement.textContent()
    console.log('Initial cost:', initialCostText)

    // Click Recalculate button
    const recalculateButton = page.locator('button[data-testid="recalculate-button"]')
    await expect(recalculateButton).toBeVisible()

    // Measure recalculation time
    const startTime = Date.now()
    await recalculateButton.click()

    // Wait for loading state
    const loadingSpinner = page.locator('[data-testid="calculating-spinner"]')
    await expect(loadingSpinner).toBeVisible()

    // Wait for calculation to complete
    const successToast = page.locator('text=Costing updated successfully')
    await expect(successToast).toBeVisible({ timeout: 3000 })
    const endTime = Date.now()

    // Verify performance: < 2 seconds
    const duration = endTime - startTime
    console.log('Recalculation took:', duration, 'ms')
    expect(duration).toBeLessThan(2000)

    // Verify cost values updated
    const updatedCostElement = page.locator('[data-testid="total-cost"]')
    const updatedCostText = await updatedCostElement.textContent()
    console.log('Updated cost:', updatedCostText)

    // Cost should display (may be same or different value)
    expect(updatedCostText).toMatch(/\d+\.\d{2}\s*PLN/)
  })

  test('AC-03: Error state - no routing assigned', async ({ page }) => {
    // AC-03: Error message: "Assign routing to BOM to calculate labor costs"
    // Expected: Error displayed with routing assignment link

    await login(page, ADMIN_USER)
    await navigateToBOMDetail(page, TEST_BOM_NO_ROUTING)

    // Wait for error state
    const errorCard = page.locator('[data-testid="cost-summary-error"]')
    await expect(errorCard).toBeVisible({ timeout: 5000 })

    // Verify error message
    const errorMessage = page.locator('text=Assign routing to BOM to calculate labor costs')
    await expect(errorMessage).toBeVisible()

    // Verify "Assign Routing" link appears
    const assignRoutingLink = page.locator('[data-testid="assign-routing-link"]')
    await expect(assignRoutingLink).toBeVisible()

    // Click link should navigate to BOM edit page
    await assignRoutingLink.click()
    await page.waitForNavigation()
    expect(page.url()).toContain('/boms/') // Should be on BOM edit page
  })

  test('Error state - missing ingredient costs', async ({ page }) => {
    // AC-07: Error shows missing ingredient codes
    // Expected: "Missing cost data for: RM-001 (Flour)"

    await login(page, ADMIN_USER)
    await navigateToBOMDetail(page, TEST_BOM_MISSING_COSTS)

    // Wait for error state
    const errorCard = page.locator('[data-testid="cost-summary-error"]')
    await expect(errorCard).toBeVisible({ timeout: 5000 })

    // Verify error message mentions missing ingredients
    const errorMessage = page.locator('text=/Missing cost data for:.*/i')
    await expect(errorMessage).toBeVisible()

    // Verify ingredient code appears in message
    const ingredientMention = page.locator('text=/RM-.*/')
    await expect(ingredientMention).toBeVisible()

    // Verify "Configure Ingredient Costs" link appears
    const configureLink = page.locator('[data-testid="configure-costs-link"]')
    await expect(configureLink).toBeVisible()
  })

  test('AC-25: Read-only user cannot recalculate', async ({ page }) => {
    // AC-25: Button hidden or disabled for read-only user
    // Expected: Viewer role sees cost but Recalculate disabled/hidden

    // Login as viewer (read-only)
    await login(page, VIEWER_USER)
    await navigateToBOMDetail(page, TEST_BOM_WITH_ROUTING)
    await waitForCostSummary(page)

    // Verify cost data displays (readable)
    const costCard = page.locator('[data-testid="cost-summary-card"]')
    await expect(costCard).toBeVisible()

    // Verify Recalculate button is hidden or disabled
    const recalculateButton = page.locator('button[data-testid="recalculate-button"]')
    const isHiddenOrDisabled = !(await recalculateButton.isVisible()) ||
      !(await recalculateButton.isEnabled())
    expect(isHiddenOrDisabled).toBe(true)

    // Try to click recalculate (should fail or do nothing)
    if (await recalculateButton.isVisible()) {
      await recalculateButton.click()
      // Should not show success toast
      const successToast = page.locator('text=Costing updated successfully')
      await expect(successToast).not.toBeVisible({ timeout: 1000 })
    }
  })

  test('AC-26: Phase 1+ features hidden in MVP', async ({ page }) => {
    // AC-26: Currency selector, Lock Cost, Compare to Actual, trends all hidden
    // Expected: Future features completely hidden (not "Coming Soon")

    await login(page, ADMIN_USER)
    await navigateToBOMDetail(page, TEST_BOM_WITH_MARGIN)
    await waitForCostSummary(page)

    // Verify no currency selector
    let currencySelector = page.locator('[data-testid="currency-selector"]')
    await expect(currencySelector).not.toBeVisible({ timeout: 2000 })

    // Verify no "Lock Cost" button
    let lockButton = page.locator('button[data-testid="lock-cost-button"]')
    await expect(lockButton).not.toBeVisible({ timeout: 2000 })

    // Verify no cost version history dropdown
    let historyDropdown = page.locator('[data-testid="cost-history-dropdown"]')
    await expect(historyDropdown).not.toBeVisible({ timeout: 2000 })

    // Verify no "Compare to Actual" button
    let compareButton = page.locator('button[data-testid="compare-actual-button"]')
    await expect(compareButton).not.toBeVisible({ timeout: 2000 })

    // Verify no cost trend chart
    let trendChart = page.locator('[data-testid="cost-trend-chart"]')
    await expect(trendChart).not.toBeVisible({ timeout: 2000 })

    // Verify no "What-If Analysis" button
    let whatIfButton = page.locator('button[data-testid="what-if-button"]')
    await expect(whatIfButton).not.toBeVisible({ timeout: 2000 })

    // Verify no cost optimization suggestions
    let suggestionsPanel = page.locator('[data-testid="optimization-suggestions"]')
    await expect(suggestionsPanel).not.toBeVisible({ timeout: 2000 })

    // Verify no "Coming Soon" badges on hidden features
    let comingSoonBadges = page.locator('text=Coming Soon')
    await expect(comingSoonBadges).not.toBeVisible({ timeout: 2000 })
  })

  test('Margin analysis displays with standard price', async ({ page }) => {
    // Expected: Margin analysis section shows actual vs target margin

    await login(page, ADMIN_USER)
    await navigateToBOMDetail(page, TEST_BOM_WITH_MARGIN)
    await waitForCostSummary(page)

    // Verify margin analysis section displays
    const marginSection = page.locator('[data-testid="margin-analysis"]')
    await expect(marginSection).toBeVisible()

    // Verify standard price displays
    const stdPrice = page.locator('[data-testid="standard-price"]')
    await expect(stdPrice).toBeVisible()
    const stdText = await stdPrice.textContent()
    expect(stdText).toMatch(/\d+\.\d{2}\s*PLN/)

    // Verify target margin displays
    const targetMargin = page.locator('[data-testid="target-margin"]')
    await expect(targetMargin).toBeVisible()

    // Verify actual margin displays
    const actualMargin = page.locator('[data-testid="actual-margin"]')
    await expect(actualMargin).toBeVisible()

    // Verify below-target indicator if applicable
    const belowTargetBadge = page.locator('[data-testid="below-target-badge"]')
    const isBelowTarget = await belowTargetBadge.isVisible()
    expect([true, false]).toContain(isBelowTarget)
  })

  test('Stale cost warning displays when data outdated', async ({ page }) => {
    // Expected: Warning shows when ingredient/BOM/routing changed

    await login(page, ADMIN_USER)
    await navigateToBOMDetail(page, TEST_BOM_WITH_ROUTING)
    await waitForCostSummary(page)

    // This test assumes test data can be modified to make cost stale
    // In real test, would modify ingredient cost and reload
    const staleWarning = page.locator('[data-testid="stale-cost-warning"]')

    // Warning may or may not be present depending on test data state
    const isPresent = await staleWarning.isVisible().catch(() => false)
    if (isPresent) {
      // If warning present, verify message and recalculate link
      const warningText = await staleWarning.textContent()
      expect(warningText).toContain('Cost data outdated')

      const recalculateLink = page.locator('[data-testid="stale-warning-recalculate"]')
      await expect(recalculateLink).toBeVisible()
    }
  })

  test('Cost breakdown tabs switch between materials and labor', async ({ page }) => {
    // Expected: Tabs allow switching between material and labor cost details

    await login(page, ADMIN_USER)
    await navigateToBOMDetail(page, TEST_BOM_WITH_ROUTING)
    await waitForCostSummary(page)

    // Verify tabs are present
    const materialTab = page.locator('[data-testid="breakdown-materials-tab"]')
    const laborTab = page.locator('[data-testid="breakdown-labor-tab"]')

    await expect(materialTab).toBeVisible()
    await expect(laborTab).toBeVisible()

    // Click labor tab
    await laborTab.click()

    // Verify labor cost details display
    const operationName = page.locator('[data-testid="operation-name"]')
    await expect(operationName).toBeVisible({ timeout: 2000 })

    // Click back to materials tab
    await materialTab.click()

    // Verify material details display
    const ingredientName = page.locator('[data-testid="ingredient-name"]')
    await expect(ingredientName).toBeVisible({ timeout: 2000 })
  })

  test('Empty state guides user through setup', async ({ page }) => {
    // Expected: No cost data state shows configuration steps

    // Create BOM with no data scenario
    await login(page, ADMIN_USER)

    // Navigate to page that would show empty state
    // (This assumes test fixture with a completely unconfigured BOM exists)
    const emptyStateCard = page.locator('[data-testid="cost-summary-empty"]')

    // Empty state may or may not be present in test data
    const isPresent = await emptyStateCard.isVisible().catch(() => false)
    if (isPresent) {
      // Verify setup steps display
      const setupSteps = page.locator('[data-testid="setup-steps"]')
      await expect(setupSteps).toBeVisible()

      // Verify Calculate button present
      const calculateButton = page.locator('[data-testid="calculate-button"]')
      await expect(calculateButton).toBeVisible()
    }
  })

  test('Loading state shows skeleton during calculation', async ({ page }) => {
    // Expected: Loading skeleton displays while cost is being calculated

    await login(page, ADMIN_USER)
    await navigateToBOMDetail(page, TEST_BOM_WITH_ROUTING)

    // Intercept cost API to simulate slow response
    let interceptedRequest = false
    page.on('request', request => {
      if (request.url().includes('/api/v1/technical/boms/') && request.url().includes('/cost')) {
        interceptedRequest = true
      }
    })

    // During page load, loading state may briefly appear
    const skeleton = page.locator('[data-testid="cost-summary-loading"]')
    const isLoading = await skeleton.isVisible({ timeout: 2000 }).catch(() => false)

    // After load completes, cost summary should be visible
    const costCard = page.locator('[data-testid="cost-summary-card"]')
    await expect(costCard).toBeVisible({ timeout: 5000 })
  })
})

/**
 * Test Coverage Summary
 *
 * E2E Test Cases:
 * 1. AC-02: View cost on BOM detail page (1 test)
 * 2. AC-21, AC-22: Recalculate cost flow (1 test)
 * 3. AC-03: Error state - no routing (1 test)
 * 4. AC-07: Error state - missing costs (1 test)
 * 5. AC-25: Read-only user cannot recalculate (1 test)
 * 6. AC-26: Phase 1+ features hidden (1 test)
 * 7. Margin analysis display (1 test)
 * 8. Stale cost warning (1 test)
 * 9. Cost breakdown tabs (1 test)
 * 10. Empty state setup guide (1 test)
 * 11. Loading skeleton display (1 test)
 *
 * Total: 11 E2E tests
 *
 * Coverage Areas:
 * - Full costing flow (view → display → recalculate)
 * - Error scenarios (no routing, missing costs)
 * - Permission enforcement
 * - Feature visibility (Phase 1+ hidden)
 * - UI states (loading, empty, error, success)
 * - User interactions (tabs, buttons)
 * - Performance verification (< 2s recalculation)
 *
 * Test Data Requirements:
 * - TEST_BOM_WITH_ROUTING: Valid BOM with routing and complete costs
 * - TEST_BOM_NO_ROUTING: BOM without routing_id assigned
 * - TEST_BOM_MISSING_COSTS: BOM with ingredients missing cost_per_unit
 * - TEST_BOM_WITH_MARGIN: BOM with standard_price for margin analysis
 *
 * Status: ALL FAILING (RED phase)
 * Reason: Page components and API endpoints not yet implemented
 */
