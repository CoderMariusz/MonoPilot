/**
 * ASN E2E Tests (Story 05.8)
 * Purpose: End-to-end tests for ASN workflows
 * Phase: RED - Tests will fail until UI and API are implemented
 *
 * Tests workflows:
 * - Create ASN from PO
 * - Edit ASN
 * - Add item to ASN
 * - Cancel ASN
 * - Filter and search ASN list
 * - ASN feature hidden when disabled
 *
 * Coverage Target: Smoke test for critical paths
 *
 * Acceptance Criteria Coverage:
 * - AC-1: Settings Toggle (enable_asn)
 * - AC-2: ASN List Page
 * - AC-3: Create ASN Header
 * - AC-4: ASN-to-PO Linkage
 * - AC-5: ASN Item Management
 * - AC-6: ASN Status Lifecycle
 * - AC-10: ASN Detail View
 * - AC-11: ASN Edit and Delete
 */

import { test, expect } from '@playwright/test'

test.describe('ASN Workflows - E2E Tests (Story 05.8)', () => {
  // ==========================================================================
  // Setup and Teardown
  // ==========================================================================
  test.beforeEach(async ({ page }) => {
    // Login as warehouse manager
    await page.goto('/login')
    await page.fill('[name="email"]', 'warehouse-manager@test.com')
    await page.fill('[name="password"]', 'test-password')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')

    // Ensure ASN feature is enabled
    await page.goto('/settings/warehouse')
    await page.check('[name="enable_asn"]')
    await page.click('button:has-text("Save")')
    await expect(page.getByText('Settings saved')).toBeVisible()
  })

  // ==========================================================================
  // ASN Feature Toggle (AC-1)
  // ==========================================================================
  test.describe('Feature Toggle - enable_asn', () => {
    test('should show ASN menu item when enable_asn is true', async ({ page }) => {
      await page.goto('/warehouse')

      const asnMenuItem = page.locator('nav >> text=ASNs')
      await expect(asnMenuItem).toBeVisible()
    })

    test('should hide ASN menu item when enable_asn is false', async ({ page }) => {
      // Disable ASN feature
      await page.goto('/settings/warehouse')
      await page.uncheck('[name="enable_asn"]')
      await page.click('button:has-text("Save")')

      await page.goto('/warehouse')

      const asnMenuItem = page.locator('nav >> text=ASNs')
      await expect(asnMenuItem).not.toBeVisible()

      // Re-enable for other tests
      await page.goto('/settings/warehouse')
      await page.check('[name="enable_asn"]')
      await page.click('button:has-text("Save")')
    })
  })

  // ==========================================================================
  // ASN List Page (AC-2)
  // ==========================================================================
  test.describe('ASN List Page', () => {
    test('should display ASN list within 300ms', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/warehouse/asns')

      await expect(page.locator('table')).toBeVisible()
      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(300)
    })

    test('should show correct columns in ASN list', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await expect(page.locator('th:has-text("ASN Number")')).toBeVisible()
      await expect(page.locator('th:has-text("PO Number")')).toBeVisible()
      await expect(page.locator('th:has-text("Supplier")')).toBeVisible()
      await expect(page.locator('th:has-text("Expected Date")')).toBeVisible()
      await expect(page.locator('th:has-text("Status")')).toBeVisible()
      await expect(page.locator('th:has-text("Items Count")')).toBeVisible()
    })

    test('should filter ASNs by status', async ({ page }) => {
      await page.goto('/warehouse/asns')

      // Select pending filter
      await page.selectOption('[name="status_filter"]', 'pending')

      await page.waitForTimeout(200)

      // Verify all visible ASNs have pending status
      const statusBadges = await page.locator('[data-status-badge]').all()
      for (const badge of statusBadges) {
        await expect(badge).toHaveText(/pending/i)
      }
    })

    test('should search ASNs by number', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await page.fill('[name="search"]', 'ASN-2024')

      await page.waitForTimeout(200)

      const results = await page.locator('tbody tr').all()
      expect(results.length).toBeGreaterThan(0)

      for (const row of results) {
        const text = await row.textContent()
        expect(text).toContain('ASN-2024')
      }
    })

    test('should paginate ASN list', async ({ page }) => {
      await page.goto('/warehouse/asns')

      // Check pagination controls exist
      await expect(page.locator('[aria-label="pagination"]')).toBeVisible()

      // Check 20 items per page
      const rows = await page.locator('tbody tr').count()
      expect(rows).toBeLessThanOrEqual(20)
    })

    test('should sort by expected date', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await page.click('th:has-text("Expected Date")')

      await page.waitForTimeout(200)

      const dates = await page.locator('td[data-expected-date]').allTextContents()
      const sortedDates = [...dates].sort()

      expect(dates).toEqual(sortedDates)
    })
  })

  // ==========================================================================
  // Create ASN from PO (AC-3, AC-4)
  // ==========================================================================
  test.describe('Create ASN from PO', () => {
    test('should create ASN from PO with auto-populated items', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await page.click('button:has-text("New ASN")')

      // Select PO from dropdown
      await page.click('[name="po_id"]')
      await page.click('text=PO-2024-00123')

      // Verify supplier auto-fills
      const supplierField = page.locator('[name="supplier"]')
      await expect(supplierField).toHaveValue(/Test Supplier/)

      // Verify expected date defaults to PO expected_delivery_date
      const expectedDateField = page.locator('[name="expected_date"]')
      await expect(expectedDateField).not.toBeEmpty()

      // Verify items auto-populate
      await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)

      // Enter carrier and tracking
      await page.fill('[name="carrier"]', 'FedEx')
      await page.fill('[name="tracking_number"]', '1234567890')

      // Save ASN
      await page.click('button:has-text("Save")')

      // Verify success
      await expect(page.getByText('ASN created successfully')).toBeVisible()

      // Verify redirected to detail page
      await expect(page).toHaveURL(/\/warehouse\/asns\/[a-f0-9-]+/)

      // Verify ASN number generated
      await expect(page.locator('[data-asn-number]')).toHaveText(/ASN-\d{4}-\d{5}/)

      // Verify status is pending
      await expect(page.locator('[data-status-badge]')).toHaveText(/pending/i)
    })

    test('should show error when PO is not selected', async ({ page }) => {
      await page.goto('/warehouse/asns/new')

      await page.fill('[name="carrier"]', 'FedEx')
      await page.click('button:has-text("Save")')

      await expect(page.getByText('Purchase Order is required')).toBeVisible()
    })

    test('should show error for fully received PO', async ({ page }) => {
      await page.goto('/warehouse/asns/new')

      await page.click('[name="po_id"]')
      await page.click('text=PO-2024-FULLY-RECEIVED')

      await expect(page.getByText('Cannot create ASN for fully received PO')).toBeVisible()
    })
  })

  // ==========================================================================
  // ASN Detail View (AC-10)
  // ==========================================================================
  test.describe('ASN Detail View', () => {
    test('should display ASN detail with all fields', async ({ page }) => {
      // Create ASN first
      await page.goto('/warehouse/asns/new')
      await page.click('[name="po_id"]')
      await page.click('text=PO-2024-00123')
      await page.fill('[name="carrier"]', 'FedEx')
      await page.fill('[name="tracking_number"]', '1234567890')
      await page.click('button:has-text("Save")')

      // Verify detail page
      await expect(page.locator('[data-asn-number]')).toBeVisible()
      await expect(page.locator('[data-po-number]')).toBeVisible()
      await expect(page.locator('[data-supplier-name]')).toBeVisible()
      await expect(page.locator('[data-expected-date]')).toBeVisible()
      await expect(page.locator('[data-carrier]')).toHaveText('FedEx')
      await expect(page.locator('[data-tracking-number]')).toHaveText('1234567890')
      await expect(page.locator('[data-status-badge]')).toBeVisible()
    })

    test('should display items table in detail view', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await page.click('tbody tr:first-child >> td:first-child')

      await expect(page.locator('h2:has-text("Items")')).toBeVisible()

      await expect(page.locator('th:has-text("Product Code")')).toBeVisible()
      await expect(page.locator('th:has-text("Expected Qty")')).toBeVisible()
      await expect(page.locator('th:has-text("Received Qty")')).toBeVisible()
      await expect(page.locator('th:has-text("UoM")')).toBeVisible()
    })

    test('should display tracking URL as clickable link', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await page.click('tbody tr:has-text("FedEx"):first-child')

      const trackingLink = page.locator('[data-tracking-link]')
      await expect(trackingLink).toBeVisible()
      await expect(trackingLink).toHaveAttribute('href', /fedex.com/)
    })
  })

  // ==========================================================================
  // Edit ASN (AC-11)
  // ==========================================================================
  test.describe('Edit ASN', () => {
    test('should edit ASN when status is pending', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await page.click('tbody tr[data-status="pending"]:first-child >> td:first-child')

      await page.click('button:has-text("Edit")')

      await page.fill('[name="carrier"]', 'UPS')
      await page.fill('[name="tracking_number"]', '0987654321')

      await page.click('button:has-text("Save")')

      await expect(page.getByText('ASN updated successfully')).toBeVisible()

      await expect(page.locator('[data-carrier]')).toHaveText('UPS')
      await expect(page.locator('[data-tracking-number]')).toHaveText('0987654321')
    })

    test('should show error when editing non-pending ASN', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await page.click('tbody tr[data-status="partial"]:first-child >> td:first-child')

      await page.click('button:has-text("Edit")')

      await expect(page.getByText('Cannot modify ASN in partial status')).toBeVisible()
    })

    test('should make fields read-only when status is received', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await page.click('tbody tr[data-status="received"]:first-child >> td:first-child')

      const carrierField = page.locator('[name="carrier"]')
      await expect(carrierField).toBeDisabled()

      const trackingField = page.locator('[name="tracking_number"]')
      await expect(trackingField).toBeDisabled()
    })
  })

  // ==========================================================================
  // Add Item to ASN (AC-5)
  // ==========================================================================
  test.describe('Add Item to ASN', () => {
    test('should add item to pending ASN', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await page.click('tbody tr[data-status="pending"]:first-child >> td:first-child')

      await page.click('button:has-text("Add Line")')

      await page.click('[name="product_id"]')
      await page.click('text=RM-FLOUR-001')

      await page.fill('[name="expected_qty"]', '100')

      await page.click('button:has-text("Add")')

      await expect(page.getByText('Item added successfully')).toBeVisible()

      await expect(page.locator('tbody >> tr:has-text("RM-FLOUR-001")')).toBeVisible()
    })

    test('should show error when adding duplicate product', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await page.click('tbody tr[data-status="pending"]:first-child >> td:first-child')

      await page.click('button:has-text("Add Line")')

      await page.click('[name="product_id"]')
      await page.click('text=RM-FLOUR-001') // Product already in ASN

      await page.fill('[name="expected_qty"]', '100')

      await page.click('button:has-text("Add")')

      await expect(page.getByText('Product already exists in ASN items')).toBeVisible()
    })

    test('should block adding item to non-pending ASN', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await page.click('tbody tr[data-status="partial"]:first-child >> td:first-child')

      const addLineButton = page.locator('button:has-text("Add Line")')
      await expect(addLineButton).toBeDisabled()
    })
  })

  // ==========================================================================
  // Delete ASN (AC-11)
  // ==========================================================================
  test.describe('Delete ASN', () => {
    test('should delete pending ASN with confirmation', async ({ page }) => {
      await page.goto('/warehouse/asns')

      const asnNumber = await page.locator('tbody tr[data-status="pending"]:first-child >> td:first-child').textContent()

      await page.click('tbody tr[data-status="pending"]:first-child >> button[aria-label="Delete"]')

      await expect(page.getByText('Permanently delete this ASN?')).toBeVisible()

      await page.click('button:has-text("Confirm")')

      await expect(page.getByText('ASN deleted successfully')).toBeVisible()

      await expect(page.locator(`tr:has-text("${asnNumber}")`)).not.toBeVisible()
    })

    test('should show error when deleting ASN with received items', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await page.click('tbody tr[data-status="partial"]:first-child >> button[aria-label="Delete"]')

      await expect(page.getByText('Cannot delete ASN with received items')).toBeVisible()
    })
  })

  // ==========================================================================
  // Cancel ASN (AC-6)
  // ==========================================================================
  test.describe('Cancel ASN', () => {
    test('should cancel pending ASN with confirmation', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await page.click('tbody tr[data-status="pending"]:first-child >> td:first-child')

      await page.click('button:has-text("Cancel ASN")')

      await expect(page.getByText('Cancel this ASN?')).toBeVisible()

      await page.click('button:has-text("Confirm")')

      await expect(page.getByText('ASN cancelled successfully')).toBeVisible()

      await expect(page.locator('[data-status-badge]')).toHaveText(/cancelled/i)
    })

    test('should show error when cancelling non-pending ASN', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await page.click('tbody tr[data-status="partial"]:first-child >> td:first-child')

      await page.click('button:has-text("Cancel ASN")')

      await expect(page.getByText('Cannot cancel ASN with received items')).toBeVisible()
    })
  })

  // ==========================================================================
  // Data Validation (AC-12)
  // ==========================================================================
  test.describe('Data Validation', () => {
    test('should show error for negative expected quantity', async ({ page }) => {
      await page.goto('/warehouse/asns/new')

      await page.click('[name="po_id"]')
      await page.click('text=PO-2024-00123')

      await page.click('button:has-text("Add Line")')

      await page.click('[name="product_id"]')
      await page.click('text=RM-FLOUR-001')

      await page.fill('[name="expected_qty"]', '-10')

      await page.click('button:has-text("Add")')

      await expect(page.getByText('Expected quantity must be greater than 0')).toBeVisible()
    })

    test('should show warning for past expiry date', async ({ page }) => {
      await page.goto('/warehouse/asns')

      await page.click('tbody tr[data-status="pending"]:first-child >> td:first-child')

      await page.click('button:has-text("Add Line")')

      await page.fill('[name="expiry_date"]', '2020-01-01')

      await page.click('button:has-text("Add")')

      await expect(page.getByText('Expiry date is in the past')).toBeVisible()
    })
  })

  // ==========================================================================
  // Response Time Requirements
  // ==========================================================================
  test.describe('Performance', () => {
    test('should load ASN list within 300ms', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/warehouse/asns')
      await page.waitForSelector('table')

      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(300)
    })

    test('should load ASN detail within 200ms', async ({ page }) => {
      await page.goto('/warehouse/asns')

      const startTime = Date.now()

      await page.click('tbody tr:first-child >> td:first-child')
      await page.waitForSelector('[data-asn-number]')

      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(200)
    })

    test('should create ASN within 500ms', async ({ page }) => {
      await page.goto('/warehouse/asns/new')

      await page.click('[name="po_id"]')
      await page.click('text=PO-2024-00123')

      await page.fill('[name="carrier"]', 'FedEx')

      const startTime = Date.now()

      await page.click('button:has-text("Save")')
      await page.waitForSelector('[data-asn-number]')

      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(500)
    })
  })
})
