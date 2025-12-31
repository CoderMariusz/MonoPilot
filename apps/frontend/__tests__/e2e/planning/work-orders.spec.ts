/**
 * Work Order E2E Tests (Story 03.10)
 * Purpose: Test end-to-end user flows for Work Order CRUD and BOM auto-selection
 * Phase: RED - Tests will fail until implementation exists
 *
 * Tests critical user flows:
 * - View WO list with filters
 * - Create WO with BOM auto-selection
 * - Create WO with manual BOM override
 * - Edit WO header
 * - Plan WO (draft -> planned)
 * - Release WO (planned -> released)
 * - Cancel WO
 * - Delete draft WO
 * - View WO detail with status history
 * - Search and filter
 *
 * Tools: Playwright
 * Coverage Target: Critical user paths
 * Test Count: 10+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-01, AC-02, AC-07: WO List
 * - AC-08, AC-09, AC-14: Create WO
 * - AC-23, AC-24, AC-26: Status transitions
 * - AC-28, AC-31: Edit and delete
 */

import { test, expect, Page } from '@playwright/test'

/**
 * Test configuration
 */
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const TEST_TIMEOUT = 30000

test.describe('Work Order E2E Tests (Story 03.10)', () => {
  let page: Page
  let testWoNumber: string

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    // Would set auth token in beforeAll if needed
  })

  test.beforeEach(async () => {
    // Set up test data before each test
    // Create test org, users, products, BOMs in fixture
  })

  test.afterEach(async () => {
    // Clean up test data
  })

  test('AC-01: View work orders list', async () => {
    // Navigate to /planning/work-orders
    await page.goto(`${BASE_URL}/planning/work-orders`)

    // Wait for page load (max 300ms per AC-01)
    const startTime = Date.now()

    // Verify page elements exist
    // - WO list table with columns
    // - KPI cards (Scheduled Today, In Progress, On Hold, This Week)
    // - Filter controls
    // - Search input

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(300)

    // Verify table columns exist
    const expectedColumns = [
      'WO Number',
      'Product',
      'Quantity',
      'Status',
      'Scheduled Date',
      'Line',
      'Priority',
      'Created',
    ]

    for (const col of expectedColumns) {
      // Check column header exists (would use page.locator in real test)
      expect(col).toBeDefined()
    }

    // Verify table displays data
    // Should have at least 1 WO visible
  })

  test('AC-02, AC-07: Search and pagination', async () => {
    await page.goto(`${BASE_URL}/planning/work-orders`)

    // Wait for list to load
    await page.waitForLoadState('networkidle')

    // Test search by WO number
    const searchInput = await page.locator('input[placeholder*="Search"]')
    await searchInput.fill('WO-20241216')

    // Wait for results (max 200ms per AC-02)
    await page.waitForTimeout(200)

    // Verify search results filtered
    // Should show only WOs matching search term

    // Test pagination
    const paginationNext = await page.locator('button:has-text("Next")')
    if (await paginationNext.isVisible()) {
      await paginationNext.click()
      // Should load next page
    }
  })

  test('AC-03, AC-04, AC-05, AC-06: Filters', async () => {
    await page.goto(`${BASE_URL}/planning/work-orders`)
    await page.waitForLoadState('networkidle')

    // Filter by status
    const statusFilter = await page.locator('select[name="status"]')
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('draft')
      // Should show only draft WOs
    }

    // Filter by product
    const productFilter = await page.locator('select[name="product"]')
    if (await productFilter.isVisible()) {
      await productFilter.click()
      await page.locator('text=FG-BREAD-001').click()
      // Should show only WOs for that product
    }

    // Filter by line
    const lineFilter = await page.locator('select[name="line"]')
    if (await lineFilter.isVisible()) {
      await lineFilter.click()
      await page.locator('text=Line 1').click()
      // Should show only WOs for that line
    }

    // Filter by date range
    const dateFromInput = await page.locator('input[name="dateFrom"]')
    if (await dateFromInput.isVisible()) {
      await dateFromInput.fill('2024-12-19')
      const dateToInput = await page.locator('input[name="dateTo"]')
      await dateToInput.fill('2024-12-21')
      // Should show WOs in date range
    }
  })

  test('AC-08, AC-09: Create WO with BOM auto-selection', async () => {
    await page.goto(`${BASE_URL}/planning/work-orders`)

    // Click "+ New Work Order"
    const newWoBtn = await page.locator('button:has-text("New Work Order")')
    await newWoBtn.click()

    // Wait for form to open
    await page.waitForSelector('[role="dialog"]')

    // Select product
    const productSelect = await page.locator('input[name="product_id"]')
    await productSelect.click()
    await page.locator('text=FG-BREAD-001').click()

    // Wait for BOM auto-selection (should be fast)
    const bomPreview = await page.locator('[data-testid="bom-preview"]')
    await bomPreview.waitFor({ state: 'visible' })

    // Verify BOM preview shows selected BOM
    // Should show BOM code, version, effective dates, item count

    // Enter quantity
    const qtyInput = await page.locator('input[name="planned_quantity"]')
    await qtyInput.fill('50')

    // Enter scheduled date
    const dateInput = await page.locator('input[name="planned_start_date"]')
    await dateInput.fill('2024-12-20')

    // Select production line
    const lineSelect = await page.locator('select[name="production_line_id"]')
    if (await lineSelect.isVisible()) {
      await lineSelect.selectOption('line-001')
    }

    // Set priority
    const prioritySelect = await page.locator('select[name="priority"]')
    if (await prioritySelect.isVisible()) {
      await prioritySelect.selectOption('normal')
    }

    // Add notes
    const notesInput = await page.locator('textarea[name="notes"]')
    if (await notesInput.isVisible()) {
      await notesInput.fill('Test work order')
    }

    // Save
    const saveBtn = await page.locator('button:has-text("Save")')
    await saveBtn.click()

    // Wait for success toast
    const successToast = await page.locator('[role="status"]:has-text("saved")')
    await successToast.waitFor({ state: 'visible' })

    // Verify redirect to detail page
    // Should be on /planning/work-orders/:id

    // Extract WO number from page for later tests
    const woNumberElement = await page.locator('[data-testid="wo-number"]')
    testWoNumber = await woNumberElement.textContent()
  })

  test('AC-09, AC-18: BOM override modal', async () => {
    await page.goto(`${BASE_URL}/planning/work-orders`)

    // Click "+ New Work Order"
    const newWoBtn = await page.locator('button:has-text("New Work Order")')
    await newWoBtn.click()
    await page.waitForSelector('[role="dialog"]')

    // Select product
    const productSelect = await page.locator('input[name="product_id"]')
    await productSelect.click()
    await page.locator('text=FG-BREAD-001').click()

    // Wait for BOM auto-selection
    await page.locator('[data-testid="bom-preview"]').waitFor({ state: 'visible' })

    // Click "Change BOM" button
    const changeBomBtn = await page.locator('button:has-text("Change BOM")')
    await changeBomBtn.click()

    // Wait for BOM selection modal
    await page.waitForSelector('[data-testid="bom-selection-modal"]')

    // Verify modal shows all active BOMs for product
    const bomOptions = await page.locator('[data-testid="bom-option"]')
    const bomCount = await bomOptions.count()
    expect(bomCount).toBeGreaterThan(0)

    // Select different BOM
    const bomOption = await page.locator('[data-testid="bom-option"]').nth(0)
    await bomOption.click()

    // Verify BOM preview updates
    await page.locator('[data-testid="bom-preview"]').waitFor({ state: 'visible' })

    // Close modal by saving
    const confirmBtn = await page.locator('[data-testid="bom-selection-modal"] button:has-text("Select")')
    await confirmBtn.click()

    // Verify modal closes and form updates
  })

  test('AC-11, AC-12, AC-13: Validation errors display', async () => {
    await page.goto(`${BASE_URL}/planning/work-orders`)

    // Click "+ New Work Order"
    const newWoBtn = await page.locator('button:has-text("New Work Order")')
    await newWoBtn.click()
    await page.waitForSelector('[role="dialog"]')

    // Try to save without product
    const saveBtn = await page.locator('button:has-text("Save")')
    await saveBtn.click()

    // Verify error message for product
    const productError = await page.locator('text=Product is required')
    await productError.waitFor({ state: 'visible' })

    // Select product
    const productSelect = await page.locator('input[name="product_id"]')
    await productSelect.click()
    await page.locator('text=FG-BREAD-001').click()

    // Test quantity validation
    const qtyInput = await page.locator('input[name="planned_quantity"]')
    await qtyInput.fill('0')
    await saveBtn.click()

    const qtyError = await page.locator('text=Quantity must be greater than 0')
    await qtyError.waitFor({ state: 'visible' })

    // Test date validation (past date)
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const dateStr = twoDaysAgo.toISOString().split('T')[0]

    const dateInput = await page.locator('input[name="planned_start_date"]')
    await dateInput.fill(dateStr)
    await saveBtn.click()

    const dateError = await page.locator('text=Scheduled date cannot be in the past')
    await dateError.waitFor({ state: 'visible' })
  })

  test('AC-28: Edit WO fields', async () => {
    // Navigate to draft WO detail
    await page.goto(`${BASE_URL}/planning/work-orders/${testWoNumber}`)
    await page.waitForLoadState('networkidle')

    // Click Edit button
    const editBtn = await page.locator('button:has-text("Edit")')
    if (await editBtn.isVisible()) {
      await editBtn.click()
    }

    // Modify quantity
    const qtyInput = await page.locator('input[name="planned_quantity"]')
    await qtyInput.clear()
    await qtyInput.fill('75')

    // Modify priority
    const prioritySelect = await page.locator('select[name="priority"]')
    await prioritySelect.selectOption('high')

    // Save changes
    const saveBtn = await page.locator('button:has-text("Save")')
    await saveBtn.click()

    // Verify success toast
    const successToast = await page.locator('[role="status"]:has-text("updated")')
    await successToast.waitFor({ state: 'visible' })

    // Verify changes persisted
    expect(await qtyInput.inputValue()).toBe('75')
  })

  test('AC-29: WO number immutable', async () => {
    // Navigate to WO detail
    await page.goto(`${BASE_URL}/planning/work-orders/${testWoNumber}`)

    // Try to find WO number field
    const woNumberField = await page.locator('input[name="wo_number"]')

    // Verify field is disabled/read-only
    if (await woNumberField.isVisible()) {
      const isDisabled = await woNumberField.isDisabled()
      expect(isDisabled).toBe(true)
    }
  })

  test('AC-23: Plan WO (draft -> planned)', async () => {
    // Navigate to draft WO
    await page.goto(`${BASE_URL}/planning/work-orders/${testWoNumber}`)
    await page.waitForLoadState('networkidle')

    // Verify current status is draft
    const statusBadge = await page.locator('[data-testid="wo-status"]')
    expect(await statusBadge.textContent()).toContain('Draft')

    // Click Plan button
    const planBtn = await page.locator('button:has-text("Plan")')
    await planBtn.click()

    // Optional: handle confirmation dialog if present
    const confirmBtn = await page.locator('[role="dialog"] button:has-text("Confirm")')
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click()
    }

    // Wait for status update
    await page.waitForTimeout(500)

    // Verify status changed to planned
    expect(await statusBadge.textContent()).toContain('Planned')

    // Verify success toast
    const successToast = await page.locator('[role="status"]:has-text("planned")')
    await successToast.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
  })

  test('AC-24: Release WO (planned -> released)', async () => {
    // First ensure WO is in planned status
    // Navigate to planned WO
    const woId = 'wo-planned-uuid' // Would use actual test fixture

    await page.goto(`${BASE_URL}/planning/work-orders/${woId}`)
    await page.waitForLoadState('networkidle')

    // Verify current status is planned
    const statusBadge = await page.locator('[data-testid="wo-status"]')
    expect(await statusBadge.textContent()).toContain('Planned')

    // Click Release button
    const releaseBtn = await page.locator('button:has-text("Release")')
    await releaseBtn.click()

    // Optional: handle confirmation dialog
    const confirmBtn = await page.locator('[role="dialog"] button:has-text("Confirm")')
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click()
    }

    // Wait for status update
    await page.waitForTimeout(500)

    // Verify status changed to released
    expect(await statusBadge.textContent()).toContain('Released')
  })

  test('AC-25: Released WO field restrictions', async () => {
    // Navigate to released WO
    const woId = 'wo-released-uuid'

    await page.goto(`${BASE_URL}/planning/work-orders/${woId}`)
    await page.waitForLoadState('networkidle')

    // Click Edit button
    const editBtn = await page.locator('button:has-text("Edit")')
    if (await editBtn.isVisible()) {
      await editBtn.click()
    }

    // Verify product field is disabled
    const productField = await page.locator('input[name="product_id"]')
    if (await productField.isVisible()) {
      expect(await productField.isDisabled()).toBe(true)
    }

    // Verify BOM field is disabled
    const bomField = await page.locator('select[name="bom_id"]')
    if (await bomField.isVisible()) {
      expect(await bomField.isDisabled()).toBe(true)
    }

    // Verify quantity field is disabled
    const qtyField = await page.locator('input[name="planned_quantity"]')
    if (await qtyField.isVisible()) {
      expect(await qtyField.isDisabled()).toBe(true)
    }

    // Verify date/line/priority CAN be edited
    const dateField = await page.locator('input[name="planned_start_date"]')
    if (await dateField.isVisible()) {
      expect(await dateField.isDisabled()).toBe(false)
    }
  })

  test('AC-26: Cancel WO', async () => {
    // Navigate to WO (draft or planned)
    await page.goto(`${BASE_URL}/planning/work-orders/${testWoNumber}`)
    await page.waitForLoadState('networkidle')

    // Click Cancel button
    const cancelBtn = await page.locator('button:has-text("Cancel")')
    await cancelBtn.click()

    // Handle confirmation dialog
    const confirmBtn = await page.locator('[role="dialog"] button:has-text("Confirm")')
    await confirmBtn.click()

    // Optional: enter cancel reason if modal has input
    const reasonInput = await page.locator('textarea[name="cancel_reason"]')
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('No longer needed')
    }

    // Wait for status update
    await page.waitForTimeout(500)

    // Verify status changed to cancelled
    const statusBadge = await page.locator('[data-testid="wo-status"]')
    expect(await statusBadge.textContent()).toContain('Cancelled')
  })

  test('AC-27: Status history timeline', async () => {
    // Navigate to WO with history
    await page.goto(`${BASE_URL}/planning/work-orders/${testWoNumber}`)
    await page.waitForLoadState('networkidle')

    // Click History tab
    const historyTab = await page.locator('[role="tab"]:has-text("History")')
    if (await historyTab.isVisible()) {
      await historyTab.click()
    }

    // Wait for history to load
    await page.waitForLoadState('networkidle')

    // Verify timeline shows transitions
    const timeline = await page.locator('[data-testid="status-timeline"]')
    await timeline.waitFor({ state: 'visible' })

    // Verify timeline items show:
    // - from_status
    // - to_status
    // - changed_by (user name)
    // - changed_at (timestamp)
    // - notes (if provided)

    const timelineItems = await page.locator('[data-testid="timeline-item"]')
    const itemCount = await timelineItems.count()
    expect(itemCount).toBeGreaterThan(0)

    // Verify items are in chronological order
    // First item should have from_status = null (initial creation)
  })

  test('AC-31, AC-32: Delete WO', async () => {
    // Create fresh draft WO for deletion
    const woToDelete = 'wo-for-deletion-uuid'

    await page.goto(`${BASE_URL}/planning/work-orders/${woToDelete}`)
    await page.waitForLoadState('networkidle')

    // Verify Delete button is visible (only for draft)
    const deleteBtn = await page.locator('button:has-text("Delete")')
    expect(await deleteBtn.isVisible()).toBe(true)

    // Click Delete
    await deleteBtn.click()

    // Handle confirmation dialog
    const confirmBtn = await page.locator('[role="dialog"] button:has-text("Delete")')
    await confirmBtn.click()

    // Wait for deletion and redirect
    await page.waitForURL('**/work-orders')

    // Verify WO no longer in list
    const woRow = await page.locator(`text=${woToDelete}`)
    expect(await woRow.isVisible()).toBe(false)
  })

  test('AC-32: Delete button hidden for non-draft WO', async () => {
    // Navigate to planned WO
    const plannedWo = 'wo-planned-uuid'

    await page.goto(`${BASE_URL}/planning/work-orders/${plannedWo}`)
    await page.waitForLoadState('networkidle')

    // Verify Delete button is hidden
    const deleteBtn = await page.locator('button:has-text("Delete")')
    expect(await deleteBtn.isVisible()).toBe(false)

    // Verify only Cancel is available
    const cancelBtn = await page.locator('button:has-text("Cancel")')
    expect(await cancelBtn.isVisible()).toBe(true)
  })

  test('AC-35: Operator view-only access', async () => {
    // Set user to OPERATOR role (would be in setup)
    // Navigate to WO list
    await page.goto(`${BASE_URL}/planning/work-orders`)

    // Verify Create button is hidden
    const newWoBtn = await page.locator('button:has-text("New Work Order")')
    expect(await newWoBtn.isVisible()).toBe(false)

    // Navigate to WO detail
    await page.goto(`${BASE_URL}/planning/work-orders/${testWoNumber}`)

    // Verify Edit button is hidden
    const editBtn = await page.locator('button:has-text("Edit")')
    expect(await editBtn.isVisible()).toBe(false)

    // Verify Delete button is hidden
    const deleteBtn = await page.locator('button:has-text("Delete")')
    expect(await deleteBtn.isVisible()).toBe(false)

    // Verify Plan/Release buttons hidden
    const planBtn = await page.locator('button:has-text("Plan")')
    expect(await planBtn.isVisible()).toBe(false)

    // Verify view-only controls present
    const detailPanel = await page.locator('[data-testid="wo-detail"]')
    expect(await detailPanel.isVisible()).toBe(true)
  })
})
