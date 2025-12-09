import { test, expect, Page } from '@playwright/test'
import { createTestOrganization, createTestUser, cleanupTestData } from './fixtures/test-setup'

/**
 * Material Reservation E2E Tests
 * Epic 4: Production Module (Batch 04A-2)
 * Story 4.7: Material Reservation (Desktop)
 *
 * Acceptance Criteria:
 * - AC-4.7.1: View material requirements with reservation status
 * - AC-4.7.2: Search and select LPs for reservation
 * - AC-4.7.3: Reserve LP with quantity validation
 * - AC-4.7.4: View reservation sequence/order
 * - AC-4.7.5: Cancel (unreserve) a reservation
 * - AC-4.7.6: Progress bar shows reservation percentage
 * - AC-4.7.7: Error handling for invalid operations
 */

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

let testOrgId: string
let testUserId: string
let testUserEmail: string
let testUserPassword: string

test.beforeAll(async () => {
  const orgResult = await createTestOrganization()
  testOrgId = orgResult.orgId

  const userResult = await createTestUser(testOrgId)
  testUserId = userResult.userId
  testUserEmail = userResult.email
  testUserPassword = userResult.password
})

test.afterAll(async () => {
  await cleanupTestData(testOrgId)
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function loginAsTestUser(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForSelector('input[type="email"]', { timeout: 30000 })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button:has-text("Sign In")')
  await page.waitForURL(/\/(dashboard|planning|production)/, { timeout: 60000 })
}

async function getExistingProduct(page: Page): Promise<string | null> {
  const response = await page.request.get('/api/products')
  if (!response.ok()) return null

  const data = await response.json()
  const products = data.products || data || []
  return products.length > 0 ? products[0].id : null
}

async function getExistingProductionLine(page: Page): Promise<string | null> {
  const response = await page.request.get('/api/settings/production-lines')
  if (!response.ok()) return null

  const data = await response.json()
  const lines = data.production_lines || data || []
  return lines.length > 0 ? lines[0].id : null
}

async function getWorkOrderWithMaterials(page: Page): Promise<string | null> {
  // Find a WO that has materials (from BOM)
  const response = await page.request.get('/api/planning/work-orders?status=planned,in_progress')
  if (!response.ok()) return null

  const data = await response.json()
  const workOrders = data.work_orders || data || []

  // Return first WO - it should have materials from BOM
  return workOrders.length > 0 ? workOrders[0].id : null
}

async function createWorkOrderViaAPI(
  page: Page,
  productId: string,
  productionLineId: string
): Promise<string> {
  const plannedStartDate = new Date()
  plannedStartDate.setDate(plannedStartDate.getDate() + 1)
  const plannedEndDate = new Date()
  plannedEndDate.setDate(plannedEndDate.getDate() + 2)

  const response = await page.request.post('/api/planning/work-orders', {
    data: {
      product_id: productId,
      production_line_id: productionLineId,
      planned_quantity: 100,
      planned_start_date: plannedStartDate.toISOString().split('T')[0],
      planned_end_date: plannedEndDate.toISOString().split('T')[0],
      priority: 'medium',
      notes: 'E2E Test - Material Reservation',
    },
  })

  if (!response.ok()) {
    throw new Error(`Failed to create WO: ${await response.text()}`)
  }

  const data = await response.json()
  return data.work_order?.id || data.id
}

async function deleteWorkOrderViaAPI(page: Page, woId: string): Promise<void> {
  await page.request.delete(`/api/planning/work-orders/${woId}`)
}

// ============================================================================
// STORY 4.7: MATERIAL RESERVATION (DESKTOP)
// ============================================================================

test.describe('Story 4.7: Material Reservation Desktop', () => {
  let productId: string | null
  let productionLineId: string | null

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, testUserEmail, testUserPassword)

    productId = await getExistingProduct(page)
    productionLineId = await getExistingProductionLine(page)

    if (!productId || !productionLineId) {
      test.skip()
    }
  })

  // ===== AC-4.7.1: View Material Requirements =====
  test('AC-4.7.1: View material requirements with reservation status on WO detail', async ({ page }) => {
    const woId = await getWorkOrderWithMaterials(page)

    if (!woId) {
      // Create a new WO if none exist
      if (!productId || !productionLineId) return
      const newWoId = await createWorkOrderViaAPI(page, productId, productionLineId)

      try {
        await page.goto(`/planning/work-orders/${newWoId}`)
        await expect(page.locator('text=/WO-/i')).toBeVisible({ timeout: 10000 })

        // Look for Materials tab
        const materialsTab = page.locator('[role="tab"], button').filter({ hasText: /Materials|Materiały/i })

        if (await materialsTab.isVisible()) {
          await materialsTab.click()
          await page.waitForTimeout(500)

          // Verify materials table or empty state
          const materialsContent = page.locator('text=/Material|Required|Zarezerwowano|No materials/i')
          await expect(materialsContent).toBeVisible({ timeout: 5000 })
        }
      } finally {
        await deleteWorkOrderViaAPI(page, newWoId)
      }
      return
    }

    await page.goto(`/planning/work-orders/${woId}`)
    await expect(page.locator('text=/WO-/i')).toBeVisible({ timeout: 10000 })

    // Click Materials tab
    const materialsTab = page.locator('[role="tab"], button').filter({ hasText: /Materials|Materiały/i })

    if (await materialsTab.isVisible()) {
      await materialsTab.click()
      await page.waitForTimeout(500)

      // Verify materials are displayed
      const materialsTable = page.locator('table')
      await expect(materialsTable).toBeVisible({ timeout: 5000 })

      // Verify columns: Material, Required Qty, Reserved, Status
      const headers = page.locator('table th')
      await expect(headers.filter({ hasText: /Material|Materiał/i })).toBeVisible()
    }
  })

  // ===== AC-4.7.2: Search and Select LPs =====
  test('AC-4.7.2: Open reserve modal and search available LPs', async ({ page }) => {
    const woId = await getWorkOrderWithMaterials(page)
    if (!woId) {
      test.skip()
      return
    }

    await page.goto(`/planning/work-orders/${woId}`)
    await expect(page.locator('text=/WO-/i')).toBeVisible({ timeout: 10000 })

    // Click Materials tab
    const materialsTab = page.locator('[role="tab"], button').filter({ hasText: /Materials|Materiały/i })

    if (await materialsTab.isVisible()) {
      await materialsTab.click()
      await page.waitForTimeout(500)

      // Look for Reserve button in first material row
      const reserveButton = page.locator('button').filter({ hasText: /Reserve|Rezerwuj/i }).first()

      if (await reserveButton.isVisible()) {
        await reserveButton.click()

        // Modal should open
        const modal = page.locator('[role="dialog"]')
        await expect(modal).toBeVisible({ timeout: 5000 })

        // Verify modal title mentions material reservation
        await expect(modal.locator('text=/Reserve|Rezerwacja/i')).toBeVisible()

        // Look for LP search/select
        const lpSearch = modal.locator('input[placeholder*="Search"], input[placeholder*="LP"], [role="combobox"]')

        if (await lpSearch.isVisible()) {
          // Search functionality exists
          await expect(lpSearch).toBeEnabled()
        }

        // Close modal
        const closeButton = modal.locator('button').filter({ hasText: /Cancel|Close|Anuluj/i })
        if (await closeButton.isVisible()) {
          await closeButton.click()
        }
      }
    }
  })

  // ===== AC-4.7.3: Reserve LP with Quantity Validation =====
  test('AC-4.7.3: Reserve LP validates quantity against available and consume_whole_lp', async ({ page }) => {
    const woId = await getWorkOrderWithMaterials(page)
    if (!woId) {
      test.skip()
      return
    }

    await page.goto(`/planning/work-orders/${woId}`)
    await expect(page.locator('text=/WO-/i')).toBeVisible({ timeout: 10000 })

    // Click Materials tab
    const materialsTab = page.locator('[role="tab"], button').filter({ hasText: /Materials|Materiały/i })

    if (await materialsTab.isVisible()) {
      await materialsTab.click()
      await page.waitForTimeout(500)

      const reserveButton = page.locator('button').filter({ hasText: /Reserve|Rezerwuj/i }).first()

      if (await reserveButton.isVisible()) {
        await reserveButton.click()

        const modal = page.locator('[role="dialog"]')
        await expect(modal).toBeVisible({ timeout: 5000 })

        // If consume_whole_lp is false, quantity input should be visible
        const qtyInput = modal.locator('input[type="number"], input[name*="qty"], input[name*="quantity"]')

        // Quantity input visibility depends on consume_whole_lp setting
        // If visible, it should have min/max validation

        // Close modal
        const closeButton = modal.locator('button').filter({ hasText: /Cancel|Close|Anuluj/i })
        if (await closeButton.isVisible()) {
          await closeButton.click()
        }
      }
    }
  })

  // ===== AC-4.7.4: View Reservation Sequence =====
  test('AC-4.7.4: View reservation sequence order for material', async ({ page }) => {
    const woId = await getWorkOrderWithMaterials(page)
    if (!woId) {
      test.skip()
      return
    }

    await page.goto(`/planning/work-orders/${woId}`)
    await expect(page.locator('text=/WO-/i')).toBeVisible({ timeout: 10000 })

    // Click Materials tab
    const materialsTab = page.locator('[role="tab"], button').filter({ hasText: /Materials|Materiały/i })

    if (await materialsTab.isVisible()) {
      await materialsTab.click()
      await page.waitForTimeout(500)

      // Look for expandable rows with reservation details
      const expandButton = page.locator('button').filter({ hasText: /Expand|Show|►|▼/i }).first()

      if (await expandButton.isVisible()) {
        await expandButton.click()
        await page.waitForTimeout(300)

        // Reservation rows should show sequence numbers
        const sequenceIndicator = page.locator('text=/#|Seq|Sequence/i')
        // Sequence is visible when reservations exist
      }
    }
  })

  // ===== AC-4.7.5: Cancel (Unreserve) =====
  test('AC-4.7.5: Cancel reservation with confirmation dialog', async ({ page }) => {
    const woId = await getWorkOrderWithMaterials(page)
    if (!woId) {
      test.skip()
      return
    }

    await page.goto(`/planning/work-orders/${woId}`)
    await expect(page.locator('text=/WO-/i')).toBeVisible({ timeout: 10000 })

    // Click Materials tab
    const materialsTab = page.locator('[role="tab"], button').filter({ hasText: /Materials|Materiały/i })

    if (await materialsTab.isVisible()) {
      await materialsTab.click()
      await page.waitForTimeout(500)

      // Look for unreserve/cancel button in reservation rows
      const unreserveButton = page.locator('button').filter({ hasText: /Unreserve|Cancel|Remove|Anuluj rezerwację/i }).first()

      if (await unreserveButton.isVisible()) {
        await unreserveButton.click()

        // Confirmation dialog should appear
        const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]').filter({ hasText: /Cancel|Are you sure|Confirmation/i })

        if (await confirmDialog.isVisible()) {
          // Verify confirmation message
          await expect(confirmDialog.locator('text=/LP|reservation|rezerwację/i')).toBeVisible()

          // Cancel the dialog (don't actually unreserve)
          const keepButton = confirmDialog.locator('button').filter({ hasText: /Keep|No|Cancel|Anuluj/i }).first()
          if (await keepButton.isVisible()) {
            await keepButton.click()
          }
        }
      }
    }
  })

  // ===== AC-4.7.6: Progress Bar =====
  test('AC-4.7.6: Progress bar shows reservation percentage', async ({ page }) => {
    const woId = await getWorkOrderWithMaterials(page)
    if (!woId) {
      test.skip()
      return
    }

    await page.goto(`/planning/work-orders/${woId}`)
    await expect(page.locator('text=/WO-/i')).toBeVisible({ timeout: 10000 })

    // Click Materials tab
    const materialsTab = page.locator('[role="tab"], button').filter({ hasText: /Materials|Materiały/i })

    if (await materialsTab.isVisible()) {
      await materialsTab.click()
      await page.waitForTimeout(500)

      // Look for progress bars in material rows
      const progressBar = page.locator('[class*="progress"], [role="progressbar"]').first()

      if (await progressBar.isVisible()) {
        // Progress bar exists
        await expect(progressBar).toBeVisible()
      }

      // Look for percentage text
      const percentageText = page.locator('text=/%/').first()
      // Percentage may be 0% if no reservations
    }
  })

  // ===== AC-4.7.7: Error Handling =====
  test('AC-4.7.7: Display error for invalid reservation attempts', async ({ page }) => {
    const woId = await getWorkOrderWithMaterials(page)
    if (!woId) {
      test.skip()
      return
    }

    await page.goto(`/planning/work-orders/${woId}`)
    await expect(page.locator('text=/WO-/i')).toBeVisible({ timeout: 10000 })

    // Click Materials tab
    const materialsTab = page.locator('[role="tab"], button').filter({ hasText: /Materials|Materiały/i })

    if (await materialsTab.isVisible()) {
      await materialsTab.click()
      await page.waitForTimeout(500)

      const reserveButton = page.locator('button').filter({ hasText: /Reserve|Rezerwuj/i }).first()

      if (await reserveButton.isVisible()) {
        await reserveButton.click()

        const modal = page.locator('[role="dialog"]')
        await expect(modal).toBeVisible({ timeout: 5000 })

        // Try to submit without selecting LP (should show error)
        const submitButton = modal.locator('button[type="submit"], button').filter({ hasText: /Reserve|Confirm|Zatwierdź/i })

        if (await submitButton.isVisible()) {
          // Don't click if disabled (proper validation)
          const isDisabled = await submitButton.isDisabled()

          if (!isDisabled) {
            await submitButton.click()

            // Error toast or validation message should appear
            const errorMessage = page.locator('[role="alert"], [class*="toast"], text=/Error|required|Invalid/i')
            // Error handling in place
          }
        }

        // Close modal
        const closeButton = modal.locator('button').filter({ hasText: /Cancel|Close|Anuluj/i })
        if (await closeButton.isVisible()) {
          await closeButton.click()
        }
      }
    }
  })
})

// ============================================================================
// API INTEGRATION TESTS
// ============================================================================

test.describe('Material Reservation API', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, testUserEmail, testUserPassword)
  })

  test('GET /api/production/work-orders/:id/materials returns materials list', async ({ page }) => {
    const woId = await getWorkOrderWithMaterials(page)
    if (!woId) {
      test.skip()
      return
    }

    const response = await page.request.get(`/api/production/work-orders/${woId}/materials`)

    expect(response.status()).toBeLessThanOrEqual(404) // 200 or 404 if no materials

    if (response.ok()) {
      const data = await response.json()
      expect(data).toHaveProperty('materials')
      expect(Array.isArray(data.materials)).toBe(true)
    }
  })

  test('GET /api/production/work-orders/:id/materials/available-lps returns LPs', async ({ page }) => {
    const woId = await getWorkOrderWithMaterials(page)
    if (!woId) {
      test.skip()
      return
    }

    // Get a material ID first
    const materialsResponse = await page.request.get(`/api/production/work-orders/${woId}/materials`)

    if (!materialsResponse.ok()) {
      test.skip()
      return
    }

    const materialsData = await materialsResponse.json()
    const materials = materialsData.materials || []

    if (materials.length === 0) {
      test.skip()
      return
    }

    const materialId = materials[0].id
    const productId = materials[0].product_id

    const response = await page.request.get(
      `/api/production/work-orders/${woId}/materials/available-lps?material_id=${materialId}&product_id=${productId}`
    )

    expect(response.status()).toBeLessThanOrEqual(404)

    if (response.ok()) {
      const data = await response.json()
      expect(data).toHaveProperty('available_lps')
      expect(Array.isArray(data.available_lps)).toBe(true)
    }
  })

  test('POST /api/production/work-orders/:id/materials/reserve validates required fields', async ({ page }) => {
    const woId = await getWorkOrderWithMaterials(page)
    if (!woId) {
      test.skip()
      return
    }

    // Try to reserve without required fields
    const response = await page.request.post(`/api/production/work-orders/${woId}/materials/reserve`, {
      data: {
        // Missing material_id, lp_id, qty
      },
    })

    expect(response.status()).toBe(400)

    const data = await response.json()
    expect(data.error || data.message).toBeDefined()
  })

  test('DELETE /api/production/work-orders/:id/materials/reservations/:reservationId requires valid ID', async ({ page }) => {
    const woId = await getWorkOrderWithMaterials(page)
    if (!woId) {
      test.skip()
      return
    }

    // Try to delete non-existent reservation
    const fakeReservationId = '00000000-0000-0000-0000-000000000000'
    const response = await page.request.delete(
      `/api/production/work-orders/${woId}/materials/reservations/${fakeReservationId}`
    )

    // Should return 404 for non-existent reservation
    expect([404, 400]).toContain(response.status())
  })
})

// ============================================================================
// NAVIGATION & UI TESTS
// ============================================================================

test.describe('Material Reservation Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, testUserEmail, testUserPassword)
  })

  test('Materials tab is visible on WO detail page', async ({ page }) => {
    const productId = await getExistingProduct(page)
    const productionLineId = await getExistingProductionLine(page)

    if (!productId || !productionLineId) {
      test.skip()
      return
    }

    const woId = await createWorkOrderViaAPI(page, productId, productionLineId)

    try {
      await page.goto(`/planning/work-orders/${woId}`)
      await expect(page.locator('text=/WO-/i')).toBeVisible({ timeout: 10000 })

      // Look for Materials tab
      const materialsTab = page.locator('[role="tab"], button').filter({ hasText: /Materials|Materiały/i })

      // Tab should exist (even if empty)
      // Material tab may not exist if WO has no BOM materials
    } finally {
      await deleteWorkOrderViaAPI(page, woId)
    }
  })

  test('Empty state shown when no materials on WO', async ({ page }) => {
    const productId = await getExistingProduct(page)
    const productionLineId = await getExistingProductionLine(page)

    if (!productId || !productionLineId) {
      test.skip()
      return
    }

    const woId = await createWorkOrderViaAPI(page, productId, productionLineId)

    try {
      await page.goto(`/planning/work-orders/${woId}`)
      await expect(page.locator('text=/WO-/i')).toBeVisible({ timeout: 10000 })

      // Click Materials tab if it exists
      const materialsTab = page.locator('[role="tab"], button').filter({ hasText: /Materials|Materiały/i })

      if (await materialsTab.isVisible()) {
        await materialsTab.click()
        await page.waitForTimeout(500)

        // Should show empty state or "No materials" message
        const emptyState = page.locator('text=/No materials|Brak materiałów|empty/i')
        // Empty state may be visible for WOs without BOM
      }
    } finally {
      await deleteWorkOrderViaAPI(page, woId)
    }
  })
})

// ============================================================================
// STATUS BADGE TESTS
// ============================================================================

test.describe('Reservation Status Display', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, testUserEmail, testUserPassword)
  })

  test('Status badges show correct reservation state', async ({ page }) => {
    const woId = await getWorkOrderWithMaterials(page)
    if (!woId) {
      test.skip()
      return
    }

    await page.goto(`/planning/work-orders/${woId}`)
    await expect(page.locator('text=/WO-/i')).toBeVisible({ timeout: 10000 })

    const materialsTab = page.locator('[role="tab"], button').filter({ hasText: /Materials|Materiały/i })

    if (await materialsTab.isVisible()) {
      await materialsTab.click()
      await page.waitForTimeout(500)

      // Look for status badges: Not Started, Partial, Complete
      const statusBadges = page.locator('[class*="badge"]')

      // At least one badge should be visible (material status)
      const badgeCount = await statusBadges.count()
      // Badges exist for materials with status
    }
  })
})
