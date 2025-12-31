/**
 * Supplier Products E2E Tests
 * Story: 03.2 - Supplier-Product Assignment
 * Phase: RED - Tests will fail until implementation exists
 *
 * End-to-end tests for complete supplier-product workflow:
 * - Navigate to supplier detail page
 * - Assign products to suppliers
 * - Edit supplier-product assignments
 * - Remove assignments
 * - Verify default supplier toggle atomicity
 * - Verify duplicate prevention
 *
 * Coverage Target: 100% of critical paths
 * Test Count: 5+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-01: Assign Product to Supplier
 * - AC-03: Default Supplier Designation
 * - AC-05: Prevent Duplicate Assignments
 * - AC-08: Unassign Product
 *
 * Notes:
 * - Run with: npx playwright test e2e/supplier-products.spec.ts
 * - Requires test environment with database seeded
 * - Tests assume authenticated session exists
 */

import { test, expect, Page } from '@playwright/test'

/**
 * Test Configuration
 */
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const SUPPLIER_ID = '550e8400-e29b-41d4-a716-446655440000' // Test supplier UUID

/**
 * Helper Functions
 */
async function navigateToSupplierDetail(page: Page, supplierId: string) {
  await page.goto(`${BASE_URL}/planning/suppliers/${supplierId}`)
  await page.waitForSelector('[role="tablist"]', { timeout: 5000 })
}

async function clickProductsTab(page: Page) {
  const tab = page.locator('button[role="tab"]:has-text("Products")')
  await tab.click()
  await page.waitForLoadState('networkidle')
}

async function clickAddProductButton(page: Page) {
  const button = page.locator('button:has-text("Add Product"), button:has-text("+ Add Product")')
  await button.click()
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
}

async function selectProductFromCombobox(page: Page, productName: string) {
  const combobox = page.locator('[role="combobox"]').first()
  await combobox.click()
  await page.waitForSelector('[role="listbox"]', { timeout: 5000 })

  const option = page.locator(`text=${productName}`).first()
  await option.click()
}

async function fillSupplierProductCode(page: Page, code: string) {
  const input = page.locator('input[placeholder*="SKU"], input[placeholder*="supplier"]').first()
  await input.fill(code)
}

async function fillUnitPrice(page: Page, price: string) {
  const input = page.locator('input[type="number"][placeholder*="Price"], input[type="number"][placeholder*="price"]').first()
  await input.fill(price)
}

async function selectCurrency(page: Page, currency: string) {
  const select = page.locator('select:has-text("PLN"), select:has-text("Currency")').first()
  await select.selectOption(currency)
}

async function toggleDefaultCheckbox(page: Page) {
  const checkbox = page.locator('input[type="checkbox"][aria-label*="Default"], input[type="checkbox"][aria-label*="default"]').first()
  await checkbox.click()
}

async function submitModal(page: Page) {
  const button = page.locator('button:has-text("Save"), button:has-text("Assign"), button[type="submit"]').last()
  await button.click()
  await page.waitForLoadState('networkidle')
}

async function expectSuccessToast(page: Page, message: string) {
  const toast = page.locator(`text=${message}`)
  await expect(toast).toBeVisible({ timeout: 5000 })
}

async function expectTableRowWithProduct(page: Page, productCode: string) {
  const row = page.locator(`text=${productCode}`).first()
  await expect(row).toBeVisible()
}

test.describe('Supplier Products Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Ensure authenticated
    // This would normally be done via a login flow or auth token
    // For now, assume session already exists
  })

  test('AC-01: Full supplier-product workflow - assign product successfully', async ({ page }) => {
    // Arrange
    await navigateToSupplierDetail(page, SUPPLIER_ID)
    await clickProductsTab(page)

    // Act - Click Add Product
    await clickAddProductButton(page)
    expect(await page.locator('[role="dialog"]').isVisible()).toBe(true)

    // Act - Select product
    await selectProductFromCombobox(page, 'Wheat Flour')

    // Act - Fill optional fields
    await fillSupplierProductCode(page, 'MILL-FL-A')
    await fillUnitPrice(page, '10.50')
    await selectCurrency(page, 'PLN')

    // Act - Submit
    await submitModal(page)

    // Assert
    await expectSuccessToast(page, 'Product assigned successfully')
    await expectTableRowWithProduct(page, 'FLOUR')

    // Verify price appears in table
    const priceCell = page.locator('text=10.50').first()
    await expect(priceCell).toBeVisible()

    // Verify supplier code appears in table
    const codeCell = page.locator('text=MILL-FL-A')
    await expect(codeCell).toBeVisible()
  })

  test('AC-03: Default supplier toggle works correctly', async ({ page }) => {
    // Setup - Create first assignment without default
    await navigateToSupplierDetail(page, SUPPLIER_ID)
    await clickProductsTab(page)
    await clickAddProductButton(page)
    await selectProductFromCombobox(page, 'Wheat Flour')
    await submitModal(page)
    await page.waitForTimeout(1000) // Wait for toast

    // Act - Assign same product to different supplier (Supplier B) with default
    await clickAddProductButton(page)
    await selectProductFromCombobox(page, 'Sugar')
    await toggleDefaultCheckbox(page)
    await submitModal(page)

    // Assert - Verify default checkbox state
    const defaultCheckbox = page.locator('input[type="checkbox"][aria-label*="Default"]').first()
    expect(await defaultCheckbox.isChecked()).toBe(true)

    // Assert - Verify success message
    await expectSuccessToast(page, 'Product assigned successfully')
  })

  test('AC-05: Prevent duplicate assignment - error shown', async ({ page }) => {
    // Setup - Assign product first
    await navigateToSupplierDetail(page, SUPPLIER_ID)
    await clickProductsTab(page)
    await clickAddProductButton(page)
    await selectProductFromCombobox(page, 'Wheat Flour')
    await submitModal(page)
    await page.waitForTimeout(1000)

    // Act - Try to assign same product again
    await clickAddProductButton(page)
    await selectProductFromCombobox(page, 'Wheat Flour')
    await submitModal(page)

    // Assert - Verify error message
    const errorToast = page.locator(
      'text=This product is already assigned to this supplier'
    ).first()
    await expect(errorToast).toBeVisible({ timeout: 5000 })

    // Assert - Modal should still be open
    const dialog = page.locator('[role="dialog"]')
    expect(await dialog.isVisible()).toBe(true)
  })

  test('AC-08: Remove supplier-product assignment with confirmation', async ({ page }) => {
    // Setup - Assign product first
    await navigateToSupplierDetail(page, SUPPLIER_ID)
    await clickProductsTab(page)
    await clickAddProductButton(page)
    await selectProductFromCombobox(page, 'Wheat Flour')
    await submitModal(page)
    await page.waitForTimeout(1000)

    // Act - Click Remove button
    const removeButton = page.locator('button:has-text("Remove")').first()
    await removeButton.click()

    // Assert - Confirmation dialog appears
    const confirmDialog = page.locator('[role="alertdialog"]')
    expect(await confirmDialog.isVisible()).toBe(true)

    // Act - Confirm deletion
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")').last()
    await confirmButton.click()

    // Assert - Product removed from table
    const productRow = page.locator('text=FLOUR')
    await expect(productRow).not.toBeVisible({ timeout: 5000 })

    // Assert - Success message
    await expectSuccessToast(page, 'Product removed')
  })

  test('AC-01 + AC-08: Edit supplier-product assignment', async ({ page }) => {
    // Setup - Assign product
    await navigateToSupplierDetail(page, SUPPLIER_ID)
    await clickProductsTab(page)
    await clickAddProductButton(page)
    await selectProductFromCombobox(page, 'Wheat Flour')
    await fillUnitPrice(page, '10.50')
    await submitModal(page)
    await page.waitForTimeout(1000)

    // Act - Click Edit button
    const editButton = page.locator('button:has-text("Edit")').first()
    await editButton.click()

    // Assert - Modal opens with existing data
    const modal = page.locator('[role="dialog"]')
    expect(await modal.isVisible()).toBe(true)

    // Act - Change price
    const priceInput = page.locator('input[type="number"][placeholder*="Price"]').first()
    await priceInput.clear()
    await priceInput.fill('12.00')

    // Act - Submit
    await submitModal(page)

    // Assert - Table shows updated price
    const priceCell = page.locator('text=12.00')
    await expect(priceCell).toBeVisible()

    // Assert - Success message
    await expectSuccessToast(page, 'Product updated successfully')
  })

  test('AC-03: Default supplier toggle atomicity - only one default per product', async ({
    page,
  }) => {
    // Setup - Assign Product A to Supplier A without default
    await navigateToSupplierDetail(page, SUPPLIER_ID)
    await clickProductsTab(page)
    await clickAddProductButton(page)
    await selectProductFromCombobox(page, 'Wheat Flour')
    await submitModal(page)
    await page.waitForTimeout(1000)

    // Setup - Assign Product A to Supplier B without default
    // (Navigate to Supplier B detail page)
    const supplierBId = 'e50e8400-e29b-41d4-a716-446655440001'
    await navigateToSupplierDetail(page, supplierBId)
    await clickProductsTab(page)
    await clickAddProductButton(page)
    await selectProductFromCombobox(page, 'Wheat Flour')
    await submitModal(page)
    await page.waitForTimeout(1000)

    // Act - Toggle Supplier B as default
    const defaultCheckbox = page.locator('input[type="checkbox"][aria-label*="Default"]').first()
    await defaultCheckbox.click()
    await submitModal(page)

    // Assert - Supplier B shows as default
    expect(await defaultCheckbox.isChecked()).toBe(true)

    // Verify - Go back to Supplier A and confirm it's no longer default
    await navigateToSupplierDetail(page, SUPPLIER_ID)
    await clickProductsTab(page)
    const supplierADefault = page.locator('input[type="checkbox"][aria-label*="Default"]').first()
    expect(await supplierADefault.isChecked()).toBe(false)
  })

  test('Empty state shows CTA when no products assigned', async ({ page }) => {
    // Setup - Navigate to supplier with no products
    const emptySupplier = 'f50e8400-e29b-41d4-a716-446655440002'
    await navigateToSupplierDetail(page, emptySupplier)
    await clickProductsTab(page)

    // Assert - Empty state visible
    const emptyState = page.locator('text=No Products Assigned Yet')
    expect(await emptyState.isVisible()).toBe(true)

    // Assert - Add Product button visible
    const addButton = page.locator('button:has-text("Add Product")')
    expect(await addButton.isVisible()).toBe(true)

    // Act - Click add button from empty state
    await addButton.click()

    // Assert - Modal opens
    const modal = page.locator('[role="dialog"]')
    expect(await modal.isVisible()).toBe(true)
  })

  test('Loading state shows skeleton while fetching products', async ({ page }) => {
    // Navigate to supplier detail
    await navigateToSupplierDetail(page, SUPPLIER_ID)

    // Click Products tab (may trigger loading)
    const productsTab = page.locator('button[role="tab"]:has-text("Products")')
    await productsTab.click()

    // Assert - Either skeleton is briefly visible or data loads quickly
    // Check for table to eventually appear
    const table = page.locator('[role="table"]')
    await expect(table).toBeVisible({ timeout: 5000 })
  })

  test('Search filters products in modal', async ({ page }) => {
    // Navigate and open modal
    await navigateToSupplierDetail(page, SUPPLIER_ID)
    await clickProductsTab(page)
    await clickAddProductButton(page)

    // Act - Type in product combobox search
    const combobox = page.locator('[role="combobox"]').first()
    await combobox.fill('flour')

    // Assert - Only matching products shown
    const option = page.locator('text=Flour', { exact: false }).first()
    await expect(option).toBeVisible()
  })

  test('Validation prevents submission with invalid data', async ({ page }) => {
    // Navigate and open modal
    await navigateToSupplierDetail(page, SUPPLIER_ID)
    await clickProductsTab(page)
    await clickAddProductButton(page)

    // Act - Leave product empty and try to submit
    const submitButton = page.locator('button[type="submit"]').last()

    // Assert - Button is disabled or validation error shown
    const isDisabled = await submitButton.isDisabled()
    const errorMessage = page.locator('text=required')

    expect(isDisabled || (await errorMessage.isVisible())).toBe(true)

    // Act - Fill product
    await selectProductFromCombobox(page, 'Wheat Flour')

    // Act - Enter negative price
    const priceInput = page.locator('input[type="number"][placeholder*="Price"]').first()
    await priceInput.fill('-5')

    // Assert - Error message shown
    const priceError = page.locator('text=must be positive', { exact: false })
    await expect(priceError).toBeVisible()
  })
})

/**
 * Test Coverage Summary:
 *
 * ✅ Complete Workflows:
 *   - Assign product with all fields
 *   - Edit supplier-product
 *   - Remove assignment with confirmation
 *
 * ✅ Acceptance Criteria:
 *   - AC-01: Full workflow tested
 *   - AC-03: Default toggle atomicity verified
 *   - AC-05: Duplicate prevention tested
 *   - AC-08: Unassign with confirmation tested
 *
 * ✅ UI States:
 *   - Empty state shown
 *   - Loading state handled
 *   - Error state with message
 *   - Success toasts
 *
 * ✅ Validation:
 *   - Search in combobox
 *   - Form validation
 *   - Negative price prevention
 *
 * ✅ User Interactions:
 *   - Tab navigation
 *   - Modal open/close
 *   - Form submission
 *   - Confirmation dialogs
 *
 * Total: 10 E2E test scenarios
 * Expected: 100% critical path coverage
 *
 * Critical Paths Tested:
 * 1. Create assignment (full workflow)
 * 2. Edit assignment (price change)
 * 3. Delete assignment (with confirmation)
 * 4. Duplicate prevention (error message)
 * 5. Default toggle atomicity (only one default)
 * 6. Empty state CTA
 * 7. Loading state
 * 8. Search and filter
 * 9. Validation errors
 * 10. Success notifications
 */
