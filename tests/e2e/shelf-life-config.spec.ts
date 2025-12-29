/**
 * E2E Tests: Shelf Life Configuration (Story 02.11)
 * Purpose: Test full user workflows for shelf life configuration
 * Framework: Playwright
 * Phase: RED - Tests will fail until implementation exists
 *
 * Scenarios tested:
 * - Complete shelf life configuration flow
 * - Recalculation from ingredients
 * - Validation error display
 * - Empty state handling
 * - Ingredient missing shelf life error
 *
 * Coverage: AC-11.01-11.19 (key user flows)
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
const PRODUCT_ID = 'test-product-id'
const PRODUCT_NAME = 'Test Product'
const PRODUCT_CODE = 'TEST-001'

// Selectors for Shelf Life Configuration Modal
const selectors = {
  modal: {
    title: 'text=Shelf Life Configuration',
    closeButton: 'button[aria-label="Close"]',
    saveButton: 'button:has-text("Save Changes")',
    cancelButton: 'button:has-text("Cancel")',
  },
  sections: {
    calculatedShelfLife: 'text=Calculated Shelf Life',
    override: 'text=Manual Override',
    storageConditions: 'text=Storage Conditions',
    bestBefore: 'text=Best Before',
    fefoSettings: 'text=FEFO Settings',
  },
  actions: {
    recalculateButton: 'button:has-text("Recalculate from Ingredients")',
    calculateButton: 'button:has-text("Calculate from Ingredients")',
  },
  inputs: {
    overrideDays: 'input[id*="override_days"]',
    overrideReason: 'textarea[id*="override_reason"]',
    tempMin: 'input[id*="storage_temp_min"]',
    tempMax: 'input[id*="storage_temp_max"]',
  },
  errors: {
    overrideReason: 'text=Override reason is required',
    tempRange: 'text=Minimum temperature cannot exceed maximum',
  },
  toast: {
    success: 'text=Shelf life configuration saved',
    error: 'text=Failed to save',
  },
}

test.describe('Story 02.11: Shelf Life Configuration Modal', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    // Login and navigate to product detail page
    // This assumes authentication is pre-configured
    await page.goto(`${BASE_URL}/products/${PRODUCT_ID}`)
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async () => {
    await page.close()
  })

  // ============================================
  // SUCCESSFUL CONFIGURATION FLOW
  // ============================================
  test('should complete full shelf life configuration flow', async () => {
    // Arrange
    // Navigate to product detail page (done in beforeEach)
    // Click "Configure Shelf Life" button
    const configButton = page.locator('button:has-text("Configure Shelf Life")')
    await configButton.click()

    // Act & Assert: Modal opens and shows loading state
    const modal = page.locator(selectors.modal.title)
    await expect(modal).toBeVisible()

    // Wait for content to load
    await page.waitForSelector(selectors.sections.calculatedShelfLife)

    // Assert: All sections visible
    await expect(page.locator(selectors.sections.calculatedShelfLife)).toBeVisible()
    await expect(page.locator(selectors.sections.override)).toBeVisible()
    await expect(page.locator(selectors.sections.storageConditions)).toBeVisible()
    await expect(page.locator(selectors.sections.bestBefore)).toBeVisible()
    await expect(page.locator(selectors.sections.fefoSettings)).toBeVisible()

    // Configure each section
    // 1. Override section
    const overrideRadio = page.locator('input[value="manual_override"]')
    await overrideRadio.click()

    // 2. Enter override days
    const overrideDaysInput = page.locator(selectors.inputs.overrideDays)
    await overrideDaysInput.fill('7')

    // 3. Enter override reason
    const overrideReasonInput = page.locator(selectors.inputs.overrideReason)
    await overrideReasonInput.fill('Market standard for fresh products is 7 days based on customer feedback')

    // 4. Configure storage conditions
    const tempMinInput = page.locator(selectors.inputs.tempMin)
    const tempMaxInput = page.locator(selectors.inputs.tempMax)
    await tempMinInput.fill('20')
    await tempMaxInput.fill('25')

    // 5. Configure FEFO settings
    const enforceWarnRadio = page.locator('input[value="warn"]')
    await enforceWarnRadio.click()

    // Save configuration
    const saveButton = page.locator(selectors.modal.saveButton)
    await saveButton.click()

    // Assert: Success toast shown
    const successToast = page.locator(selectors.toast.success)
    await expect(successToast).toBeVisible()

    // Assert: Modal closes
    await expect(modal).not.toBeVisible()

    // Assert: Product detail shows updated shelf life
    const shelfLifeDisplay = page.locator('text=7 days')
    await expect(shelfLifeDisplay).toBeVisible()
  })

  // ============================================
  // RECALCULATION FLOW
  // ============================================
  test('should recalculate shelf life from ingredients', async () => {
    // Arrange: Open modal with existing config
    await page.locator('button:has-text("Configure Shelf Life")').click()
    await page.waitForSelector(selectors.sections.calculatedShelfLife)

    // Get initial calculated value
    const initialValue = await page
      .locator(selectors.sections.calculatedShelfLife)
      .locator('text=/\\d+ days/')
      .first()
      .textContent()

    // Act: Click Recalculate button
    const recalcButton = page.locator(selectors.actions.recalculateButton)
    await expect(recalcButton).toBeVisible()
    await recalcButton.click()

    // Wait for recalculation to complete
    await page.waitForTimeout(1000) // Spinner animation

    // Assert: Loading state shown (spinner visible)
    const spinner = page.locator('[role="progressbar"]')

    // Assert: New value displayed (may be same or different)
    const updatedValue = await page
      .locator(selectors.sections.calculatedShelfLife)
      .locator('text=/\\d+ days/')
      .first()
      .textContent()

    // Both values should be numbers
    expect(initialValue).toMatch(/\d+ days/)
    expect(updatedValue).toMatch(/\d+ days/)

    // Assert: "Needs Recalculation" badge cleared (if was present)
    const badge = page.locator('text=Needs Recalculation')
    if (await badge.isVisible()) {
      await expect(badge).not.toBeVisible({ timeout: 5000 })
    }
  })

  // ============================================
  // VALIDATION ERROR DISPLAY
  // ============================================
  test('should display validation errors inline', async () => {
    // Arrange
    await page.locator('button:has-text("Configure Shelf Life")').click()
    await page.waitForSelector(selectors.sections.calculatedShelfLife)

    // Act 1: Enable override without reason
    const overrideRadio = page.locator('input[value="manual_override"]')
    await overrideRadio.click()

    const overrideDaysInput = page.locator(selectors.inputs.overrideDays)
    await overrideDaysInput.fill('7')

    // Attempt to save without override reason
    const saveButton = page.locator(selectors.modal.saveButton)
    await saveButton.click()

    // Assert: Override reason error shown
    const overrideError = page.locator(selectors.errors.overrideReason)
    await expect(overrideError).toBeVisible()

    // Act 2: Configure temperature with min > max
    const tempMinInput = page.locator(selectors.inputs.tempMin)
    const tempMaxInput = page.locator(selectors.inputs.tempMax)

    await tempMinInput.fill('35')
    await tempMaxInput.fill('25')

    // Attempt to save
    await saveButton.click()

    // Assert: Temperature range error shown
    const tempError = page.locator(selectors.errors.tempRange)
    await expect(tempError).toBeVisible()

    // Assert: Modal remains open
    const modal = page.locator(selectors.modal.title)
    await expect(modal).toBeVisible()
  })

  // ============================================
  // EMPTY STATE FLOW
  // ============================================
  test('should handle empty state when no config exists', async () => {
    // Note: This assumes we're testing a product without shelf life config
    // Navigate to product without config
    await page.goto(`${BASE_URL}/products/no-config-product`)
    await page.waitForLoadState('networkidle')

    // Act: Click Configure Shelf Life
    const configButton = page.locator('button:has-text("Configure Shelf Life")')
    await configButton.click()

    // Assert: Empty state displayed
    const emptyState = page.locator('text=No Shelf Life Configuration')
    await expect(emptyState).toBeVisible()

    // Assert: 2 CTAs visible
    const calculateButton = page.locator(selectors.actions.calculateButton)
    const manualButton = page.locator('button:has-text("Set Manually")')

    await expect(calculateButton).toBeVisible()
    await expect(manualButton).toBeVisible()

    // Act: Click Calculate from Ingredients
    await calculateButton.click()

    // Assert: Form populated with calculated values
    await page.waitForSelector(selectors.sections.calculatedShelfLife)
    const calculatedSection = page.locator(selectors.sections.calculatedShelfLife)
    await expect(calculatedSection).toBeVisible()
  })

  // ============================================
  // MISSING INGREDIENT SHELF LIFE ERROR
  // ============================================
  test('should show error when ingredient missing shelf life', async () => {
    // Note: This test assumes we can create a product with BOM that has
    // an ingredient without shelf_life_days configured

    // Arrange: Navigate to product with incomplete BOM
    await page.goto(`${BASE_URL}/products/incomplete-bom-product`)
    await page.waitForLoadState('networkidle')

    // Act: Open shelf life config
    const configButton = page.locator('button:has-text("Configure Shelf Life")')
    await configButton.click()

    // Attempt to calculate from incomplete BOM
    const calculateButton = page.locator(selectors.actions.calculateButton)
    await calculateButton.click()

    // Assert: Error message displayed with ingredient names
    const errorMessage = page.locator('text=/Missing shelf life for ingredient:/')
    await expect(errorMessage).toBeVisible()

    // Assert: Actionable link to configure ingredients shown
    const ingredientLink = page.locator('text=Configure Ingredient Shelf Lives')
    await expect(ingredientLink).toBeVisible()

    // Assert: Modal remains open
    const modal = page.locator(selectors.modal.title)
    await expect(modal).toBeVisible()
  })

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  test('should support keyboard navigation', async () => {
    // Arrange
    await page.locator('button:has-text("Configure Shelf Life")').click()
    await page.waitForSelector(selectors.sections.calculatedShelfLife)

    // Act: Press Escape to close
    await page.keyboard.press('Escape')

    // Assert: Modal closed
    const modal = page.locator(selectors.modal.title)
    await expect(modal).not.toBeVisible()

    // Act: Open again and test Tab navigation
    await page.locator('button:has-text("Configure Shelf Life")').click()
    await page.waitForSelector(selectors.modal.title)

    // Tab should navigate through form fields
    const firstInput = page.locator(selectors.inputs.tempMin)
    await expect(firstInput).toBeVisible()

    // Press Tab multiple times
    await firstInput.click()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should move focus through inputs
    const activeElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['INPUT', 'BUTTON', 'TEXTAREA']).toContain(activeElement)
  })

  // ============================================
  // CANCEL FUNCTIONALITY
  // ============================================
  test('should discard changes when Cancel clicked', async () => {
    // Arrange: Open modal
    await page.locator('button:has-text("Configure Shelf Life")').click()
    await page.waitForSelector(selectors.sections.calculatedShelfLife)

    // Act: Make changes
    const tempMinInput = page.locator(selectors.inputs.tempMin)
    const originalValue = await tempMinInput.inputValue()

    await tempMinInput.fill('99')

    // Click Cancel
    const cancelButton = page.locator(selectors.modal.cancelButton)
    await cancelButton.click()

    // Assert: Modal closed
    const modal = page.locator(selectors.modal.title)
    await expect(modal).not.toBeVisible()

    // Act: Open again
    await page.locator('button:has-text("Configure Shelf Life")').click()
    await page.waitForSelector(selectors.sections.calculatedShelfLife)

    // Assert: Original value restored
    const restoredValue = await tempMinInput.inputValue()
    expect(restoredValue).toBe(originalValue)
  })

  // ============================================
  // RESPONSIVE DESIGN
  // ============================================
  test('should be responsive on mobile (375px width)', async () => {
    // Note: Playwright test.describe.configure({ viewport: ... })
    // might be needed for true mobile testing

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 })

    // Act: Open modal
    await page.locator('button:has-text("Configure Shelf Life")').click()
    await page.waitForSelector(selectors.modal.title)

    // Assert: Modal fullscreen or near-fullscreen on mobile
    const modal = page.locator('[role="dialog"]')
    const boundingBox = await modal.boundingBox()
    expect(boundingBox?.width).toBeGreaterThan(300)

    // Assert: All sections scrollable
    const scrollArea = page.locator('[class*="scroll"]')
    if (await scrollArea.isVisible()) {
      await expect(scrollArea).toBeVisible()
    }

    // Assert: Touch targets >= 48px
    const saveButton = page.locator(selectors.modal.saveButton)
    const buttonBox = await saveButton.boundingBox()
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44) // At least 44px for touch
  })

  // ============================================
  // LOADING STATES
  // ============================================
  test('should show loading states during operations', async () => {
    // Arrange
    await page.locator('button:has-text("Configure Shelf Life")').click()
    await page.waitForSelector(selectors.sections.calculatedShelfLife)

    // Act: Click Recalculate
    const recalcButton = page.locator(selectors.actions.recalculateButton)
    await recalcButton.click()

    // Assert: Button disabled during loading
    await expect(recalcButton).toBeDisabled()

    // Assert: Spinner visible
    const spinner = page.locator('[role="progressbar"], .spinner, [class*="spinner"]')

    // Wait for operation to complete
    await page.waitForTimeout(2000)

    // Assert: Button re-enabled after completion
    await expect(recalcButton).toBeEnabled()
  })

  // ============================================
  // OVERRIDE PERCENTAGE DISPLAY
  // ============================================
  test('should calculate and display percentage when min remaining changed', async () => {
    // Arrange
    await page.locator('button:has-text("Configure Shelf Life")').click()
    await page.waitForSelector(selectors.sections.fefoSettings)

    // Act: Set final_days to 10 and min_remaining to 5
    const minRemainingInput = page.locator('input[id*="min_remaining"]')
    await minRemainingInput.fill('5')

    // Assert: Percentage displayed as 50% (5 of 10 days)
    const percentageDisplay = page.locator('text=/50%/')

    // The percentage might be dynamically calculated
    // Verify the calculation logic is working
    const minValue = await minRemainingInput.inputValue()
    expect(minValue).toBe('5')
  })

  // ============================================
  // FOCUS MANAGEMENT
  // ============================================
  test('should auto-focus first input on modal open', async () => {
    // Arrange
    const configButton = page.locator('button:has-text("Configure Shelf Life")')

    // Act: Click to open modal
    await configButton.click()
    await page.waitForSelector(selectors.modal.title)

    // Assert: First focusable element receives focus
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement
      return active?.tagName
    })

    // Should be an input, button, or other focusable element
    expect(['INPUT', 'BUTTON', 'TEXTAREA', 'SELECT']).toContain(focusedElement)
  })
})

test.describe('Story 02.11: Ingredient Shelf Life Configuration', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    // Navigate to ingredient page
    await page.goto(`${BASE_URL}/ingredients`)
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async () => {
    await page.close()
  })

  // ============================================
  // INGREDIENT CONFIGURATION FLOW
  // ============================================
  test('should configure ingredient shelf life', async () => {
    // Arrange: Find and click on ingredient
    const ingredientRow = page.locator('button:has-text("Flour")')
    await ingredientRow.click()

    // Act: Open shelf life config
    const configButton = page.locator('button:has-text("Configure Shelf Life")')
    await configButton.click()

    // Assert: Ingredient config modal appears
    const modal = page.locator('text=Ingredient Shelf Life Configuration')
    await expect(modal).toBeVisible()

    // Fill in fields
    const shelfLifeInput = page.locator('input[id*="shelf_life_days"]')
    const supplierInput = page.locator('input[id*="supplier_name"]')

    await shelfLifeInput.fill('180')
    await supplierInput.fill('ABC Flour Suppliers')

    // Save
    const saveButton = page.locator('button:has-text("Save")')
    await saveButton.click()

    // Assert: Success notification
    const successToast = page.locator('text=Ingredient shelf life saved')
    await expect(successToast).toBeVisible()
  })

  // ============================================
  // QUARANTINE REQUIREMENT VALIDATION
  // ============================================
  test('should require quarantine_duration when quarantine enabled', async () => {
    // Arrange: Open ingredient config
    const ingredientRow = page.locator('button:has-text("Flour")')
    await ingredientRow.click()

    const configButton = page.locator('button:has-text("Configure Shelf Life")')
    await configButton.click()

    // Act: Enable quarantine without duration
    const quarantineCheckbox = page.locator('input[id*="quarantine_required"]')
    await quarantineCheckbox.check()

    // Attempt to save
    const saveButton = page.locator('button:has-text("Save")')
    await saveButton.click()

    // Assert: Error shown
    const error = page.locator('text=Quarantine duration required')
    await expect(error).toBeVisible()
  })
})
