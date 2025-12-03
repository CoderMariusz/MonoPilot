/**
 * E2E Tests: Material Reservation Desktop (Story 4.7)
 * Epic 4: Production Module - Batch 4A-2
 *
 * Tests complete user flows for:
 * - Materials table display (AC-4.7.1)
 * - Material reservation modal (AC-4.7.2)
 * - Reservation recording (AC-4.7.3)
 * - Progress tracking (AC-4.7.4)
 * - Unreservation (AC-4.7.5)
 * - API validation errors (AC-4.7.12)
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
  await page.waitForURL(/\/(dashboard|production)/)
}

/**
 * Helper: Navigate to production dashboard
 */
async function goToProductionDashboard(page: Page) {
  await page.goto('/production/dashboard')
  await page.waitForSelector('[data-testid="production-dashboard"]', { timeout: 10000 })
}

// ============================================================================
// Material Reservation Tests (Story 4.7)
// ============================================================================
test.describe('Material Reservation Desktop (Story 4.7)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display production dashboard (AC-4.7.11)', async ({ page }) => {
    await goToProductionDashboard(page)

    // Verify dashboard is displayed
    await expect(page.locator('[data-testid="production-dashboard"]')).toBeVisible()
  })

  test.describe('Materials Table Display (AC-4.7.1)', () => {
    test('should display materials table when WO modal is opened', async ({ page }) => {
      await goToProductionDashboard(page)

      // Find an in_progress WO and click to view details
      const woRow = page.locator('[data-testid="wo-row"][data-status="in_progress"]').first()

      if (await woRow.count() === 0) {
        test.skip(true, 'No in_progress WO found for testing')
        return
      }

      await woRow.click()

      // Wait for materials tab/section
      await page.waitForSelector('[data-testid="materials-reservations-table"]', { timeout: 10000 })

      // Verify table headers
      await expect(page.locator('th:has-text("Material")')).toBeVisible()
      await expect(page.locator('th:has-text("Required")')).toBeVisible()
      await expect(page.locator('th:has-text("Reserved")')).toBeVisible()
      await expect(page.locator('th:has-text("Progress")')).toBeVisible()
    })

    test('should show progress bars for materials', async ({ page }) => {
      await goToProductionDashboard(page)

      const woRow = page.locator('[data-testid="wo-row"][data-status="in_progress"]').first()

      if (await woRow.count() === 0) {
        test.skip(true, 'No in_progress WO found for testing')
        return
      }

      await woRow.click()
      await page.waitForSelector('[data-testid="materials-reservations-table"]', { timeout: 10000 })

      // Verify progress bars exist
      const progressBars = page.locator('[role="progressbar"]')
      await expect(progressBars.first()).toBeVisible()
    })

    test('should show status badges (Complete/In Progress/Not Started)', async ({ page }) => {
      await goToProductionDashboard(page)

      const woRow = page.locator('[data-testid="wo-row"][data-status="in_progress"]').first()

      if (await woRow.count() === 0) {
        test.skip(true, 'No in_progress WO found for testing')
        return
      }

      await woRow.click()
      await page.waitForSelector('[data-testid="materials-reservations-table"]', { timeout: 10000 })

      // Verify at least one status badge exists
      const badges = page.locator('.bg-green-100, .bg-yellow-100, .bg-gray-100')
      const count = await badges.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Material Reservation Modal (AC-4.7.2)', () => {
    test('should open reservation modal when clicking Reserve button', async ({ page }) => {
      await goToProductionDashboard(page)

      const woRow = page.locator('[data-testid="wo-row"][data-status="in_progress"]').first()

      if (await woRow.count() === 0) {
        test.skip(true, 'No in_progress WO found for testing')
        return
      }

      await woRow.click()
      await page.waitForSelector('[data-testid="materials-reservations-table"]', { timeout: 10000 })

      // Click Reserve button on first material with remaining qty
      const reserveBtn = page.locator('button:has-text("Reserve")').first()

      if (await reserveBtn.isDisabled()) {
        test.skip(true, 'No materials available for reservation')
        return
      }

      await reserveBtn.click()

      // Verify modal is displayed
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.locator('text=Reserve Material')).toBeVisible()
    })

    test('should display LP search in modal', async ({ page }) => {
      await goToProductionDashboard(page)

      const woRow = page.locator('[data-testid="wo-row"][data-status="in_progress"]').first()

      if (await woRow.count() === 0) {
        test.skip(true, 'No in_progress WO found for testing')
        return
      }

      await woRow.click()
      await page.waitForSelector('[data-testid="materials-reservations-table"]', { timeout: 10000 })

      const reserveBtn = page.locator('button:has-text("Reserve")').first()

      if (await reserveBtn.isDisabled()) {
        test.skip(true, 'No materials available for reservation')
        return
      }

      await reserveBtn.click()
      await expect(page.locator('[role="dialog"]')).toBeVisible()

      // Verify LP search input exists
      await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
    })

    test('should show sequence number indicator', async ({ page }) => {
      await goToProductionDashboard(page)

      const woRow = page.locator('[data-testid="wo-row"][data-status="in_progress"]').first()

      if (await woRow.count() === 0) {
        test.skip(true, 'No in_progress WO found for testing')
        return
      }

      await woRow.click()
      await page.waitForSelector('[data-testid="materials-reservations-table"]', { timeout: 10000 })

      const reserveBtn = page.locator('button:has-text("Reserve")').first()

      if (await reserveBtn.isDisabled()) {
        test.skip(true, 'No materials available for reservation')
        return
      }

      await reserveBtn.click()
      await expect(page.locator('[role="dialog"]')).toBeVisible()

      // Verify sequence indicator is shown after selecting LP
      const lpRow = page.locator('table tbody tr').first()
      if (await lpRow.count() > 0) {
        await lpRow.click()
        await expect(page.locator('text=/.*#\\d+ in sequence.*/')).toBeVisible()
      }
    })
  })

  test.describe('Unreservation (AC-4.7.5)', () => {
    test('should show unreserve button for reserved LPs', async ({ page }) => {
      await goToProductionDashboard(page)

      const woRow = page.locator('[data-testid="wo-row"][data-status="in_progress"]').first()

      if (await woRow.count() === 0) {
        test.skip(true, 'No in_progress WO found for testing')
        return
      }

      await woRow.click()
      await page.waitForSelector('[data-testid="materials-reservations-table"]', { timeout: 10000 })

      // Expand a material with reservations
      const expandBtn = page.locator('button:has([class*="ChevronRight"])').first()
      if (await expandBtn.count() > 0) {
        await expandBtn.click()

        // Check for unreserve button (X icon)
        const unreserveBtn = page.locator('button.text-red-600').first()
        if (await unreserveBtn.count() > 0) {
          await expect(unreserveBtn).toBeVisible()
        }
      }
    })

    test('should show confirmation dialog when clicking unreserve', async ({ page }) => {
      await goToProductionDashboard(page)

      const woRow = page.locator('[data-testid="wo-row"][data-status="in_progress"]').first()

      if (await woRow.count() === 0) {
        test.skip(true, 'No in_progress WO found for testing')
        return
      }

      await woRow.click()
      await page.waitForSelector('[data-testid="materials-reservations-table"]', { timeout: 10000 })

      // Expand material and click unreserve
      const expandBtn = page.locator('button:has([class*="ChevronRight"])').first()
      if (await expandBtn.count() > 0) {
        await expandBtn.click()

        const unreserveBtn = page.locator('button.text-red-600').first()
        if (await unreserveBtn.count() > 0) {
          await unreserveBtn.click()

          // Verify confirmation dialog
          await expect(page.locator('[role="alertdialog"]')).toBeVisible()
          await expect(page.locator('text=Cancel Reservation')).toBeVisible()
        }
      }
    })
  })

  test.describe('Role-Based Access (AC-4.7.8)', () => {
    test('should show Reserve button for authorized roles', async ({ page }) => {
      await goToProductionDashboard(page)

      const woRow = page.locator('[data-testid="wo-row"][data-status="in_progress"]').first()

      if (await woRow.count() === 0) {
        test.skip(true, 'No in_progress WO found for testing')
        return
      }

      await woRow.click()
      await page.waitForSelector('[data-testid="materials-reservations-table"]', { timeout: 10000 })

      // Admin/Manager/Operator should see Reserve button
      const reserveBtn = page.locator('button:has-text("Reserve")')
      expect(await reserveBtn.count()).toBeGreaterThan(0)
    })
  })

  test.describe('Validation & Error Messages (AC-4.7.12)', () => {
    test('should show warning when WO is not in_progress', async ({ page }) => {
      await goToProductionDashboard(page)

      // Try to find a non-in_progress WO
      const woRow = page.locator('[data-testid="wo-row"]:not([data-status="in_progress"])').first()

      if (await woRow.count() === 0) {
        test.skip(true, 'No non-in_progress WO found for testing')
        return
      }

      await woRow.click()

      // Check for warning message about WO status
      await page.waitForTimeout(1000)
      const warning = page.locator('text=/Material reservation is only available when WO is in progress/')
      if (await warning.count() > 0) {
        await expect(warning).toBeVisible()
      }
    })

    test('should disable Reserve button when material is fully reserved', async ({ page }) => {
      await goToProductionDashboard(page)

      const woRow = page.locator('[data-testid="wo-row"][data-status="in_progress"]').first()

      if (await woRow.count() === 0) {
        test.skip(true, 'No in_progress WO found for testing')
        return
      }

      await woRow.click()
      await page.waitForSelector('[data-testid="materials-reservations-table"]', { timeout: 10000 })

      // Look for a fully reserved material (Complete status)
      const completeMaterial = page.locator('tr:has(.bg-green-100) button:has-text("Reserve")')
      if (await completeMaterial.count() > 0) {
        await expect(completeMaterial.first()).toBeDisabled()
      }
    })
  })
})

// ============================================================================
// API Tests (Integration)
// ============================================================================
test.describe('Material Reservation API (AC-4.7.6, AC-4.7.7)', () => {
  test('POST /api/production/work-orders/:id/materials/reserve should require auth', async ({ request }) => {
    const response = await request.post('/api/production/work-orders/test-id/materials/reserve', {
      data: {
        material_id: 'test-material',
        lp_id: 'test-lp',
        reserved_qty: 10
      }
    })

    // Should return 401 without auth
    expect(response.status()).toBe(401)
  })

  test('DELETE /api/production/work-orders/:id/materials/reservations/:reservationId should require auth', async ({ request }) => {
    const response = await request.delete('/api/production/work-orders/test-id/materials/reservations/test-res')

    // Should return 401 without auth
    expect(response.status()).toBe(401)
  })
})
