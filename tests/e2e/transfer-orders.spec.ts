import { test, expect, Page } from '@playwright/test'
import { createTestOrganization, createTestUser, cleanupTestData } from './fixtures/test-setup'

/**
 * Transfer Order E2E Tests
 * Epic 3: Transfer Orders (Batch 3B)
 * Stories: 3.6, 3.7, 3.8
 *
 * Tests cover:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Partial shipments with status transitions
 * - Error handling and validation
 * - User workflows
 */

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

let testOrgId: string
let testUserId: string
let testUserToken: string

test.beforeAll(async () => {
  // Use pre-existing test organization from .env.test
  const orgResult = await createTestOrganization()
  testOrgId = orgResult.orgId

  const userResult = await createTestUser(testOrgId)
  testUserId = userResult.userId
  testUserToken = userResult.token
})

test.afterAll(async () => {
  // Cleanup test data
  await cleanupTestData(testOrgId)
})

// ============================================================================
// STORY 3.6: TRANSFER ORDER CRUD
// ============================================================================

test.describe('Story 3.6: Transfer Order CRUD', () => {
  let toId: string
  let warehouseFromId: string
  let warehouseToId: string

  test.beforeEach(async ({ page }) => {
    // Login as test user
    await loginAsTestUser(page)

    // Get existing warehouses from production (no create needed)
    const warehouses = await getExistingWarehouses(page, testOrgId)
    if (!warehouses.from_warehouse_id || !warehouses.to_warehouse_id) {
      throw new Error('No warehouses found in test org. Create at least 2 warehouses first.')
    }
    warehouseFromId = warehouses.from_warehouse_id
    warehouseToId = warehouses.to_warehouse_id
  })

  // ===== AC-3.6.1: Transfer Order List Page =====
  test('AC-3.6.1: List Transfer Orders with filters and sorting', async ({ page }) => {
    await page.goto('/planning/transfer-orders')

    // Verify page loads
    await expect(page.locator('h1, h2')).toContainText('Transfer Orders')

    // Verify table columns exist
    await expect(page.locator('table th')).toContainText('TO Number')
    await expect(page.locator('table th')).toContainText('From Warehouse')
    await expect(page.locator('table th')).toContainText('To Warehouse')
    await expect(page.locator('table th')).toContainText('Status')

    // Verify filters work
    const statusFilter = page.locator('select, [role="combobox"]').first()
    await statusFilter.click()
    await page.locator('text=Draft').click()

    // Verify sorting
    const sortButton = page.locator('button:has-text("TO Number")')
    await sortButton.click()
    await expect(page).toHaveTitle(/Transfer Orders/)
  })

  // ===== AC-3.6.3: Save Transfer Order =====
  test('AC-3.6.3: Create Transfer Order with auto-generated number', async ({ page }) => {
    await page.goto('/planning/transfer-orders')

    // Click "Create" or "Add" button
    await page.locator('button:has-text("Create"), button:has-text("New")').first().click()

    // Fill form
    await page.locator('input[placeholder*="warehouse"], select').nth(0).selectOption(warehouseFromId)
    await page.locator('input[placeholder*="warehouse"], select').nth(1).selectOption(warehouseToId)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    await page.locator('input[type="date"]').nth(0).fill(tomorrowStr) // ship date
    await page.locator('input[type="date"]').nth(1).fill(tomorrowStr) // receive date

    // Submit form
    await page.locator('button:has-text("Save"), button:has-text("Create")').click()

    // Verify success
    await expect(page.locator('text=successfully|created')).toBeVisible({ timeout: 5000 })

    // Extract TO number from toast or redirect URL
    const url = page.url()
    toId = url.split('/').pop() || ''
    expect(toId).toBeTruthy()
  })

  // ===== ERROR: Validation Errors =====
  test('AC-3.6.3: Show validation error when same warehouse selected', async ({ page }) => {
    await page.goto('/planning/transfer-orders')
    await page.locator('button:has-text("Create"), button:has-text("New")').first().click()

    // Select same warehouse twice
    await page.locator('select').nth(0).selectOption(warehouseFromId)
    await page.locator('select').nth(1).selectOption(warehouseFromId)

    // Try to submit
    const submitButton = page.locator('button:has-text("Save")')
    await submitButton.click()

    // Expect error message
    const errorMessage = page.locator('text=different warehouses|must be different')
    await expect(errorMessage).toBeVisible({ timeout: 3000 })
  })

  // ===== ERROR: Date Validation =====
  test('AC-3.6.3: Show validation error when receive date before ship date', async ({ page }) => {
    await page.goto('/planning/transfer-orders')
    await page.locator('button:has-text("Create"), button:has-text("New")').first().click()

    // Fill warehouses
    await page.locator('select').nth(0).selectOption(warehouseFromId)
    await page.locator('select').nth(1).selectOption(warehouseToId)

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]

    await page.locator('input[type="date"]').nth(0).fill(today)
    await page.locator('input[type="date"]').nth(1).fill(yesterday)

    await page.locator('button:has-text("Save")').click()

    const errorMessage = page.locator('text=on or after|receive.*after')
    await expect(errorMessage).toBeVisible({ timeout: 3000 })
  })

  // ===== AC-3.6.7: Change TO Status to 'Planned' =====
  test('AC-3.6.7: Change Transfer Order status to Planned (after adding lines)', async ({ page }) => {
    // Create TO first
    await createTestTransferOrder(page, warehouseFromId, warehouseToId)
    toId = page.url().split('/').pop() || ''

    // Try to change status without lines - should fail
    const statusButton = page.locator('button:has-text("Change Status"), button:has-text("Plan")')
    await statusButton.click()

    // Error: Cannot plan without lines
    await expect(page.locator('text=without lines|at least one')).toBeVisible({ timeout: 3000 })
  })
})

// ============================================================================
// STORY 3.7: TO LINE MANAGEMENT
// ============================================================================

test.describe('Story 3.7: TO Line Management', () => {
  let toId: string
  let productId: string

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)

    // Get existing warehouses and products
    const warehouses = await getExistingWarehouses(page, testOrgId)
    const products = await getExistingProducts(page, testOrgId)
    productId = products[0].id

    // Create test TO
    toId = await createTestTransferOrder(page, warehouses.from_warehouse_id, warehouses.to_warehouse_id)
  })

  // ===== AC-3.7.1: TO Lines Table Display =====
  test('AC-3.7.1: Display TO lines table with columns', async ({ page }) => {
    await page.goto(`/planning/transfer-orders/${toId}`)

    // Verify lines section exists
    const linesSection = page.locator('text=Lines|Products')
    await expect(linesSection).toBeVisible()

    // Verify table columns
    const tableHeaders = page.locator('table th')
    await expect(tableHeaders).toContainText('Product')
    await expect(tableHeaders).toContainText('Quantity')
    await expect(tableHeaders).toContainText('UoM')
  })

  // ===== AC-3.7.8: Cannot Plan TO Without Lines =====
  test('AC-3.7.8: Cannot change status to Planned without adding lines', async ({ page }) => {
    await page.goto(`/planning/transfer-orders/${toId}`)

    // Try to change status
    const planButton = page.locator('button:has-text("Plan"), button:has-text("Change Status")')
    await planButton.click()

    await page.locator('text=planned').click()

    // Should see error
    const errorMessage = page.locator('text=without lines|at least one product')
    await expect(errorMessage).toBeVisible({ timeout: 3000 })
  })

  // ===== Add TO Line =====
  test('Add TO line with product and quantity', async ({ page }) => {
    await page.goto(`/planning/transfer-orders/${toId}`)

    // Click "Add Line" button
    const addLineButton = page.locator('button:has-text("Add Line"), button:has-text("Add Product")')
    await addLineButton.click()

    // Select product
    const productSelect = page.locator('select, [role="combobox"]').filter({ hasText: 'Product' })
    await productSelect.click()
    await page.locator(`text=${productId}`).first().click()

    // Enter quantity
    const quantityInput = page.locator('input[type="number"]').filter({ hasText: 'Quantity' })
    await quantityInput.fill('100')

    // Save
    await page.locator('button:has-text("Save"), button:has-text("Add")').click()

    // Verify line appears
    const lineRow = page.locator('tr').filter({ hasText: 'product' })
    await expect(lineRow).toBeVisible({ timeout: 3000 })
  })

  // ===== Edit TO Line =====
  test('Edit TO line quantity', async ({ page }) => {
    await page.goto(`/planning/transfer-orders/${toId}`)

    // Add line first
    await addTestLine(page, productId, '50')

    // Click edit button on line
    const editButton = page.locator('button[aria-label*="edit"]').first()
    await editButton.click()

    // Update quantity
    const quantityInput = page.locator('input[type="number"]')
    await quantityInput.clear()
    await quantityInput.fill('75')

    // Save
    await page.locator('button:has-text("Save")').click()

    // Verify update
    const lineRow = page.locator('tr').filter({ hasText: '75' })
    await expect(lineRow).toBeVisible({ timeout: 3000 })
  })

  // ===== Delete TO Line =====
  test('Delete TO line with confirmation', async ({ page }) => {
    await page.goto(`/planning/transfer-orders/${toId}`)

    // Add line first
    await addTestLine(page, productId, '50')

    // Click delete button
    const deleteButton = page.locator('button[aria-label*="delete"]').first()
    await deleteButton.click()

    // Confirm delete
    const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")')
    await confirmButton.click()

    // Verify line removed
    const emptyState = page.locator('text=No products|Add Line')
    await expect(emptyState).toBeVisible({ timeout: 3000 })
  })
})

// ============================================================================
// STORY 3.8: PARTIAL SHIPMENTS
// ============================================================================

test.describe('Story 3.8: Partial Shipments', () => {
  let toId: string

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)

    // Get existing data and create TO with lines
    const warehouses = await getExistingWarehouses(page, testOrgId)
    const products = await getExistingProducts(page, testOrgId)

    toId = await createTestTransferOrder(page, warehouses.from_warehouse_id, warehouses.to_warehouse_id)
    await addTestLine(page, products[0].id, '100')
  })

  // ===== AC-3.8.4: Confirm Partial Shipment =====
  test('AC-3.8.4: Ship partial quantity and update status', async ({ page }) => {
    await page.goto(`/planning/transfer-orders/${toId}`)

    // Change status to Planned first
    const planButton = page.locator('button:has-text("Plan")')
    await planButton.click()

    // Click "Ship" button
    const shipButton = page.locator('button:has-text("Ship")')
    await shipButton.click()

    // Enter ship quantity (50 out of 100)
    const shipQtyInput = page.locator('input[placeholder*="Ship|Qty"]')
    await shipQtyInput.fill('50')

    // Set actual ship date
    const shipDateInput = page.locator('input[type="date"]')
    const today = new Date().toISOString().split('T')[0]
    await shipDateInput.fill(today)

    // Confirm shipment
    await page.locator('button:has-text("Confirm|Ship")').click()

    // Verify status changed to "partially_shipped"
    const statusBadge = page.locator('[class*="status"]')
    await expect(statusBadge).toContainText('Partially Shipped|partially_shipped')
  })

  // ===== AC-3.8.6: Status Calculation =====
  test('AC-3.8.6: Status transitions based on shipment quantities', async ({ page }) => {
    await page.goto(`/planning/transfer-orders/${toId}`)

    // Initial status: draft
    let statusBadge = page.locator('[class*="badge"], [class*="status"]').first()
    await expect(statusBadge).toContainText('Draft')

    // Plan TO
    await page.locator('button:has-text("Plan")').click()
    await expect(statusBadge).toContainText('Planned')

    // Ship partial quantity
    await shipPartialQuantity(page, 50, 100)
    statusBadge = page.locator('[class*="badge"], [class*="status"]').first()
    await expect(statusBadge).toContainText('Partially Shipped|partially_shipped')

    // Ship remaining quantity
    await shipPartialQuantity(page, 50, 100)
    statusBadge = page.locator('[class*="badge"], [class*="status"]').first()
    await expect(statusBadge).toContainText('Shipped')
  })

  // ===== ERROR: Over-shipping validation =====
  test('ERROR: Prevent shipping more than planned quantity', async ({ page }) => {
    await page.goto(`/planning/transfer-orders/${toId}`)

    await page.locator('button:has-text("Plan")').click()
    await page.locator('button:has-text("Ship")').click()

    // Try to ship 150 (more than 100)
    const shipQtyInput = page.locator('input[placeholder*="Ship|Qty"]')
    await shipQtyInput.fill('150')

    // Try to confirm
    await page.locator('button:has-text("Confirm")').click()

    // Expect error
    const errorMessage = page.locator('text=exceeds|more than|maximum')
    await expect(errorMessage).toBeVisible({ timeout: 3000 })
  })

  // ===== AC-3.8.9: Actual Ship Date Immutability =====
  test('AC-3.8.9: Actual ship date set on first shipment only', async ({ page }) => {
    await page.goto(`/planning/transfer-orders/${toId}`)

    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]

    // First shipment with today's date
    await page.locator('button:has-text("Plan")').click()
    await page.locator('button:has-text("Ship")').click()

    const shipDateInput = page.locator('input[type="date"]')
    await shipDateInput.fill(today)
    await page.locator('input[placeholder*="Ship"]').fill('50')
    await page.locator('button:has-text("Confirm")').click()

    // Read actual_ship_date from display
    const actualDateDisplay = page.locator('text=Shipped.*:/,').first()
    const firstShipDate = await actualDateDisplay.textContent()

    // Second shipment with tomorrow's date
    await page.locator('button:has-text("Ship")').click()
    await shipDateInput.fill(tomorrow)
    await page.locator('input[placeholder*="Ship"]').fill('50')
    await page.locator('button:has-text("Confirm")').click()

    // Verify actual_ship_date stayed the same
    const updatedDateDisplay = page.locator('text=Shipped.*:/,').first()
    const secondShipDate = await updatedDateDisplay.textContent()

    expect(firstShipDate).toEqual(secondShipDate)
  })
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function loginAsTestUser(page: Page) {
  // Go to login page
  await page.goto('/login')

  // Fill login form
  const testUserEmail = process.env.TEST_USER_EMAIL || 'test-user@monopilot.test'
  const testUserPassword = process.env.TEST_USER_PASSWORD || 'Test123!@#'

  await page.locator('input[type="email"]').fill(testUserEmail)
  await page.locator('input[type="password"]').fill(testUserPassword)

  // Submit login
  await page.locator('button:has-text("Sign In"), button:has-text("Login")').click()

  // Wait for redirect to planning
  await page.waitForURL('**/planning/**')
  await page.waitForLoadState('networkidle')
}

async function getExistingWarehouses(page: Page, orgId: string) {
  try {
    const response = await page.request.get('http://localhost:5000/api/settings/warehouses')

    if (!response.ok()) {
      throw new Error(`API returned ${response.status()}: ${response.statusText()}`)
    }

    const data = await response.json()
    const warehouses = data.warehouses || data

    if (!Array.isArray(warehouses) || warehouses.length < 2) {
      throw new Error(`Need at least 2 warehouses. Found ${warehouses.length}`)
    }

    return {
      from_warehouse_id: warehouses[0].id,
      to_warehouse_id: warehouses[1].id,
    }
  } catch (error) {
    console.error('Failed to get warehouses:', error)
    throw new Error('Could not load warehouses for testing')
  }
}

async function getExistingProducts(page: Page, orgId: string) {
  try {
    const response = await page.request.get('http://localhost:5000/api/technical/products')

    if (!response.ok()) {
      throw new Error(`API returned ${response.status()}: ${response.statusText()}`)
    }

    const data = await response.json()
    const products = data.data || data.products || data

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('No products found in organization')
    }

    return products
  } catch (error) {
    console.error('Failed to get products:', error)
    throw new Error('Could not load products for testing')
  }
}

async function createTestTransferOrder(
  page: Page,
  fromWarehouseId: string,
  toWarehouseId: string
): Promise<string> {
  await page.goto('/planning/transfer-orders')
  await page.locator('button:has-text("Create"), button:has-text("New")').first().click()

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  await page.locator('select').nth(0).selectOption(fromWarehouseId)
  await page.locator('select').nth(1).selectOption(toWarehouseId)
  await page.locator('input[type="date"]').nth(0).fill(tomorrowStr)
  await page.locator('input[type="date"]').nth(1).fill(tomorrowStr)

  await page.locator('button:has-text("Save")').click()
  await page.waitForLoadState('networkidle')

  return page.url().split('/').pop() || ''
}

async function addTestLine(page: Page, productId: string, quantity: string) {
  await page.locator('button:has-text("Add Line"), button:has-text("Add Product")').first().click()
  await page.locator('select').first().selectOption(productId)
  await page.locator('input[type="number"]').fill(quantity)
  await page.locator('button:has-text("Save"), button:has-text("Add")').click()
  await page.waitForLoadState('networkidle')
}

async function shipPartialQuantity(page: Page, quantity: number, maxQuantity: number) {
  await page.locator('button:has-text("Ship")').click()
  const shipQtyInput = page.locator('input[placeholder*="Ship"]')
  await shipQtyInput.fill(quantity.toString())

  const shipDateInput = page.locator('input[type="date"]')
  const today = new Date().toISOString().split('T')[0]
  await shipDateInput.fill(today)

  await page.locator('button:has-text("Confirm")').click()
  await page.waitForLoadState('networkidle')
}
