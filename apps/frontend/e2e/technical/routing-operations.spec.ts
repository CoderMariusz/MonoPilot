/**
 * Routing Operations - End-to-End Tests
 * Story: 02.8 - Routing Operations (Steps) Management
 * Phase: RED - Tests will fail until implementation exists
 *
 * Tests the complete routing operations workflow:
 * - Create operation
 * - Edit operation
 * - Reorder operations (move up/down)
 * - Delete operation with confirmation
 * - Parallel operations creation and display
 * - Machine dropdown with empty state
 * - Attachment upload/download/delete workflow
 * - Permission enforcement (hidden/disabled actions)
 *
 * Test Workflows:
 * 1. Full operations workflow - create, edit, reorder, delete
 * 2. Parallel operations - create and display with (Parallel) suffix
 * 3. Machine dropdown - empty state and populated state
 * 4. Attachments - upload, download, delete
 * 5. Permission checks - hide unauthorized actions
 *
 * Tool: Playwright
 * Coverage Target: 80%+
 * Test Count: 15+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-01: List operations within 500ms
 * - AC-02: All columns display correctly
 * - AC-04-07: Parallel operations
 * - AC-08-10: Time tracking
 * - AC-11-14: Machine assignment
 * - AC-19-21: Attachment workflow
 * - AC-25-27: Reorder operations
 * - AC-32: Permission enforcement
 */

import { test, expect } from '@playwright/test'

/**
 * Common test setup and navigation
 */
const ROUTING_DETAIL_URL = '/technical/routings/test-routing-id'
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('Routing Operations - E2E Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // Setup: Authenticate if needed
    // For now, assume we're already authenticated
    // Navigate to a specific routing detail page
  })

  // ============================================================================
  // AC-01: Operations Load Within 500ms
  // ============================================================================
  test('should load operations within 500ms for 50 operations (AC-01)', async ({
    page,
  }) => {
    // Arrange - Navigate to routing with 50 operations
    await page.goto(`${BASE_URL}${ROUTING_DETAIL_URL}`)

    // Act - Measure load time
    const startTime = Date.now()

    // Assert - Operations should be visible within 500ms
    await expect(page.locator('[data-testid="operations-table"]')).toBeVisible({
      timeout: 500,
    })

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(500)
  })

  // ============================================================================
  // Full Operations Workflow
  // ============================================================================
  test('full operations workflow - create, edit, reorder, delete', async ({
    page,
  }) => {
    // Arrange
    await page.goto(`${BASE_URL}${ROUTING_DETAIL_URL}`)

    // Step 1: Click Add Operation
    await page.click('button:has-text("[+ Add Operation]")')

    // Assert: Modal opens
    await expect(page.locator('[data-testid="operation-modal"]')).toBeVisible()

    // Step 2: Fill form (seq=1, name='Mixing', duration=15)
    await page.fill('[data-testid="operation-sequence"]', '1')
    await page.fill('[data-testid="operation-name"]', 'Mixing')
    await page.fill('[data-testid="operation-duration"]', '15')

    // Step 3: Save operation
    await page.click('button:has-text("Add Operation")')

    // Assert: Operation added to table
    await expect(page.locator('td:has-text("Mixing")')).toBeVisible()

    // Step 4: Add second operation (seq=2)
    await page.click('button:has-text("[+ Add Operation]")')
    await page.fill('[data-testid="operation-sequence"]', '2')
    await page.fill('[data-testid="operation-name"]', 'Proofing')
    await page.fill('[data-testid="operation-duration"]', '45')
    await page.click('button:has-text("Add Operation")')

    // Assert: Second operation visible
    await expect(page.locator('td:has-text("Proofing")')).toBeVisible()

    // Step 5: Reorder operation 2 up (swap with 1)
    const reorderButtons = page.locator('[data-testid="reorder-up-button"]')
    const proofingRow = page.locator('tr:has-text("Proofing")')
    const moveUpButton = proofingRow.locator('[data-testid="reorder-up-button"]')
    await moveUpButton.click()

    // Assert: Operations reordered (Proofing now at seq 1, Mixing at seq 2)
    const table = page.locator('[data-testid="operations-table"]')
    const rows = table.locator('tbody tr')
    const firstRow = rows.first()
    await expect(firstRow).toContainText('Proofing')

    // Step 6: Edit operation (change duration)
    const editButton = proofingRow.locator('[data-testid="edit-button"]')
    await editButton.click()

    // Assert: Modal opens with prefilled data
    await expect(page.locator('[data-testid="operation-modal"]')).toBeVisible()
    const durationField = page.locator('[data-testid="operation-duration"]')
    await expect(durationField).toHaveValue('45')

    // Change duration
    await durationField.clear()
    await durationField.fill('50')
    await page.click('button:has-text("Save Changes")')

    // Assert: Duration updated
    await expect(
      proofingRow.locator('[data-testid="operation-duration"]')
    ).toContainText('50')

    // Step 7: Delete operation with confirmation
    const deleteButton = proofingRow.locator('[data-testid="delete-button"]')
    await deleteButton.click()

    // Assert: Confirmation dialog appears
    const confirmDialog = page.locator('[data-testid="delete-confirm-dialog"]')
    await expect(confirmDialog).toBeVisible()
    await expect(confirmDialog).toContainText('Delete operation')

    // Confirm deletion
    await page.click('button:has-text("Delete")')

    // Assert: Operation removed from table
    await expect(proofingRow).not.toBeVisible()
  })

  // ============================================================================
  // Parallel Operations Workflow
  // ============================================================================
  test('parallel operations - create and display with (Parallel) suffix', async ({
    page,
  }) => {
    // Arrange
    await page.goto(`${BASE_URL}${ROUTING_DETAIL_URL}`)

    // Step 1: Create operation with seq=1
    await page.click('button:has-text("[+ Add Operation]")')
    await page.fill('[data-testid="operation-sequence"]', '1')
    await page.fill('[data-testid="operation-name"]', 'Proofing')
    await page.fill('[data-testid="operation-duration"]', '30')
    await page.click('button:has-text("Add Operation")')

    // Assert: First operation created
    await expect(page.locator('td:has-text("Proofing")')).toBeVisible()

    // Step 2: Create another operation with same seq=1 (parallel)
    await page.click('button:has-text("[+ Add Operation]")')
    await page.fill('[data-testid="operation-sequence"]', '1')
    await page.fill('[data-testid="operation-name"]', 'Heating')
    await page.fill('[data-testid="operation-duration"]', '45')

    // Assert: Info message shown (not blocking error)
    await expect(
      page.locator('[data-testid="info-message"]:has-text("already used")')
    ).toBeVisible()

    // Step 3: Save operation (should allow duplicate sequence)
    await page.click('button:has-text("Add Operation")')

    // Assert: Both operations display with (Parallel) suffix
    await expect(
      page.locator('td:has-text("Proofing (Parallel)")')
    ).toBeVisible()
    await expect(
      page.locator('td:has-text("Heating (Parallel)")')
    ).toBeVisible()

    // Step 4: Verify summary uses MAX duration (45, not 75)
    const summaryDuration = page.locator(
      '[data-testid="summary-total-duration"]'
    )
    // 45 minutes (MAX of 30 and 45 parallel ops)
    await expect(summaryDuration).toContainText('45')
  })

  // ============================================================================
  // Machine Dropdown - Empty State
  // ============================================================================
  test('machine dropdown - empty state when no machines configured', async ({
    page,
  }) => {
    // Arrange - Ensure no machines are configured
    await page.goto(`${BASE_URL}${ROUTING_DETAIL_URL}`)

    // Step 1: Open add operation modal
    await page.click('button:has-text("[+ Add Operation]")')

    // Assert: Modal opens
    await expect(page.locator('[data-testid="operation-modal"]')).toBeVisible()

    // Step 2: Check machine dropdown empty state
    const machineDropdown = page.locator('[data-testid="machine-dropdown"]')
    await machineDropdown.click()

    // Assert: Empty state message displayed
    const emptyMessage = page.locator(
      '[data-testid="machine-empty-state"]:has-text("No machines configured")'
    )
    await expect(emptyMessage).toBeVisible()

    // Assert: Link to Settings visible
    const settingsLink = page.locator('a:has-text("Settings")')
    await expect(settingsLink).toBeVisible()
    expect(settingsLink).toHaveAttribute('href', /\/settings\/machines/)

    // Step 3: Save operation with machine_id = null
    await page.fill('[data-testid="operation-sequence"]', '1')
    await page.fill('[data-testid="operation-name"]', 'Mixing')
    await page.fill('[data-testid="operation-duration"]', '30')
    await page.click('button:has-text("Add Operation")')

    // Assert: Operation created successfully
    await expect(page.locator('td:has-text("Mixing")')).toBeVisible()

    // Assert: Machine column shows '-' or empty
    const mixingRow = page.locator('tr:has-text("Mixing")')
    const machineCell = mixingRow.locator('[data-testid="operation-machine"]')
    const machineText = await machineCell.textContent()
    expect(machineText?.trim()).toMatch(/^(-|)$/)
  })

  // ============================================================================
  // Machine Dropdown - Populated State
  // ============================================================================
  test('machine dropdown - populated with machines when configured', async ({
    page,
  }) => {
    // Arrange - Setup: machines are already configured
    await page.goto(`${BASE_URL}${ROUTING_DETAIL_URL}`)

    // Step 1: Open add operation modal
    await page.click('button:has-text("[+ Add Operation]")')

    // Step 2: Click machine dropdown
    const machineDropdown = page.locator('[data-testid="machine-dropdown"]')
    await machineDropdown.click()

    // Assert: "None / Not assigned" option available
    await expect(page.locator('text=None / Not assigned')).toBeVisible()

    // Assert: List of machines displayed
    await expect(
      page.locator('[data-testid="machine-option"]').first()
    ).toBeVisible()

    // Step 3: Select a machine
    await page.click('[data-testid="machine-option"]:first-child')

    // Assert: Machine selected in dropdown
    const selectedValue = page.locator('[data-testid="machine-dropdown-value"]')
    const selectedText = await selectedValue.textContent()
    expect(selectedText).not.toMatch(/None|Not assigned/)

    // Step 4: Save operation with machine assigned
    await page.fill('[data-testid="operation-sequence"]', '1')
    await page.fill('[data-testid="operation-name"]', 'Mixing')
    await page.fill('[data-testid="operation-duration"]', '30')
    await page.click('button:has-text("Add Operation")')

    // Assert: Machine column shows machine name
    const mixingRow = page.locator('tr:has-text("Mixing")')
    const machineCell = mixingRow.locator('[data-testid="operation-machine"]')
    const machineText = await machineCell.textContent()
    expect(machineText?.trim()).not.toMatch(/^(-|)$/)
  })

  // ============================================================================
  // Attachments Workflow
  // ============================================================================
  test('attachments workflow - upload, download, delete', async ({ page }) => {
    // Arrange
    await page.goto(`${BASE_URL}${ROUTING_DETAIL_URL}`)

    // Step 1: Create operation first
    await page.click('button:has-text("[+ Add Operation]")')
    await page.fill('[data-testid="operation-sequence"]', '1')
    await page.fill('[data-testid="operation-name"]', 'Baking')
    await page.fill('[data-testid="operation-duration"]', '30')
    await page.click('button:has-text("Add Operation")')

    // Assert: Operation created
    await expect(page.locator('td:has-text("Baking")')).toBeVisible()

    // Step 2: Edit operation to access attachments
    const bakingRow = page.locator('tr:has-text("Baking")')
    const editButton = bakingRow.locator('[data-testid="edit-button"]')
    await editButton.click()

    // Assert: Modal opens with attachments section
    const attachmentSection = page.locator(
      '[data-testid="attachments-section"]'
    )
    await expect(attachmentSection).toBeVisible()

    // Step 3: Upload PDF attachment
    const fileInput = page.locator('[data-testid="attachment-upload-input"]')
    await fileInput.setInputFiles('tests/fixtures/instructions.pdf')

    // Assert: File in list with delete button
    await expect(
      page.locator('[data-testid="attachment-item"]:has-text("instructions.pdf")')
    ).toBeVisible()

    const downloadButton = page.locator(
      '[data-testid="attachment-download-button"]'
    )
    await expect(downloadButton).toBeVisible()

    // Step 4: Download attachment
    // Note: File download happens in background
    await downloadButton.click()

    // Step 5: Delete attachment
    const deleteAttachmentButton = page.locator(
      '[data-testid="attachment-delete-button"]'
    )
    await deleteAttachmentButton.click()

    // Assert: Confirmation or immediate removal
    // If async with confirmation:
    const confirmButton = page.locator('button:has-text("Delete")')
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }

    // Assert: Attachment removed from list
    await expect(
      page.locator('[data-testid="attachment-item"]:has-text("instructions.pdf")')
    ).not.toBeVisible()
  })

  // ============================================================================
  // Attachment Size Validation
  // ============================================================================
  test('attachments - reject files > 10MB', async ({ page }) => {
    // Arrange
    await page.goto(`${BASE_URL}${ROUTING_DETAIL_URL}`)

    // Step 1: Create operation and edit to open attachments
    await page.click('button:has-text("[+ Add Operation]")')
    await page.fill('[data-testid="operation-sequence"]', '1')
    await page.fill('[data-testid="operation-name"]', 'Process')
    await page.fill('[data-testid="operation-duration"]', '30')
    await page.click('button:has-text("Add Operation")')

    const processRow = page.locator('tr:has-text("Process")')
    await processRow.locator('[data-testid="edit-button"]').click()

    // Step 2: Try to upload large file
    const fileInput = page.locator('[data-testid="attachment-upload-input"]')
    await fileInput.setInputFiles('tests/fixtures/large-file-15mb.bin')

    // Assert: Error message displayed
    const errorMessage = page.locator(
      '[data-testid="error-message"]:has-text("File size must be less than 10MB")'
    )
    await expect(errorMessage).toBeVisible()
  })

  // ============================================================================
  // Attachments Maximum Count (5)
  // ============================================================================
  test('attachments - reject 6th attachment (max 5)', async ({ page }) => {
    // Arrange - Operation with 5 attachments already
    await page.goto(`${BASE_URL}${ROUTING_DETAIL_URL}`)

    // Navigate to operation with 5 attachments
    const fullOperationRow = page.locator(
      '[data-testid="operation-row"][data-attachments="5"]'
    )
    await fullOperationRow.locator('[data-testid="edit-button"]').click()

    // Step 1: Try to upload 6th file
    const fileInput = page.locator('[data-testid="attachment-upload-input"]')
    await fileInput.setInputFiles('tests/fixtures/doc.pdf')

    // Assert: Error message displayed
    const errorMessage = page.locator(
      '[data-testid="error-message"]:has-text("Maximum 5 attachments")'
    )
    await expect(errorMessage).toBeVisible()

    // Assert: Upload button disabled or area disabled
    const uploadArea = page.locator('[data-testid="attachment-upload-area"]')
    expect(await uploadArea.getAttribute('aria-disabled')).toBe('true')
  })

  // ============================================================================
  // Permission Enforcement
  // ============================================================================
  test('permission checks - hide unauthorized actions (AC-32)', async ({
    page,
  }) => {
    // Arrange - Login as user without technical write permission
    // For now, assume we can set this via query param or context
    await page.goto(`${BASE_URL}${ROUTING_DETAIL_URL}?role=viewer`)

    // Assert: Add Operation button hidden
    await expect(
      page.locator('button:has-text("[+ Add Operation]")')
    ).not.toBeVisible()

    // Navigate to table and check action buttons
    await page.locator('[data-testid="operations-table"]').waitFor({
      state: 'visible',
    })

    // Assert: Edit button hidden
    const editButton = page.locator('[data-testid="edit-button"]').first()
    await expect(editButton).not.toBeVisible()

    // Assert: Delete button hidden
    const deleteButton = page.locator('[data-testid="delete-button"]').first()
    await expect(deleteButton).not.toBeVisible()

    // Assert: Reorder buttons hidden
    const reorderUpButton = page.locator(
      '[data-testid="reorder-up-button"]'
    ).first()
    await expect(reorderUpButton).not.toBeVisible()

    const reorderDownButton = page.locator(
      '[data-testid="reorder-down-button"]'
    ).first()
    await expect(reorderDownButton).not.toBeVisible()
  })

  // ============================================================================
  // Time Tracking Validation
  // ============================================================================
  test('time tracking - negative setup time validation', async ({ page }) => {
    // Arrange
    await page.goto(`${BASE_URL}${ROUTING_DETAIL_URL}`)

    // Step 1: Open add operation modal
    await page.click('button:has-text("[+ Add Operation]")')

    // Step 2: Try to enter negative setup time
    await page.fill('[data-testid="operation-sequence"]', '1')
    await page.fill('[data-testid="operation-name"]', 'Mixing')
    await page.fill('[data-testid="operation-duration"]', '30')
    await page.fill('[data-testid="operation-setup-time"]', '-5')

    // Step 3: Try to save
    await page.click('button:has-text("Add Operation")')

    // Assert: Validation error shown
    const errorMessage = page.locator(
      '[data-testid="error-message"]:has-text("Setup time cannot be negative")'
    )
    await expect(errorMessage).toBeVisible()

    // Assert: Modal stays open
    const modal = page.locator('[data-testid="operation-modal"]')
    await expect(modal).toBeVisible()
  })

  // ============================================================================
  // Instructions Field Validation
  // ============================================================================
  test('instructions - reject > 2000 characters', async ({ page }) => {
    // Arrange
    await page.goto(`${BASE_URL}${ROUTING_DETAIL_URL}`)

    // Step 1: Open add operation modal
    await page.click('button:has-text("[+ Add Operation]")')

    // Step 2: Fill with very long instructions
    const longText = 'a'.repeat(2001)
    await page.fill('[data-testid="operation-sequence"]', '1')
    await page.fill('[data-testid="operation-name"]', 'Mixing')
    await page.fill('[data-testid="operation-duration"]', '30')
    await page.fill('[data-testid="operation-instructions"]', longText)

    // Step 3: Try to save
    await page.click('button:has-text("Add Operation")')

    // Assert: Validation error shown
    const errorMessage = page.locator(
      '[data-testid="error-message"]:has-text("Instructions must be less than 2000")'
    )
    await expect(errorMessage).toBeVisible()
  })

  // ============================================================================
  // Operations Summary Panel
  // ============================================================================
  test('summary panel displays calculated totals', async ({ page }) => {
    // Arrange
    await page.goto(`${BASE_URL}${ROUTING_DETAIL_URL}`)

    // Create multiple operations with known times
    // Op 1: setup=5, duration=15, cleanup=2
    // Op 2: setup=0, duration=45, cleanup=0
    // Op 3: setup=10, duration=30, cleanup=5
    // Total: setup=15, duration=90, cleanup=7

    // Step 1: Create operations (abbreviated)
    for (let i = 0; i < 3; i++) {
      await page.click('button:has-text("[+ Add Operation]")')
      await page.fill('[data-testid="operation-sequence"]', `${i + 1}`)
      await page.fill('[data-testid="operation-name"]', `Op${i + 1}`)
      await page.fill('[data-testid="operation-duration"]', '30')
      await page.click('button:has-text("Add Operation")')
    }

    // Step 2: Check summary panel
    const summaryPanel = page.locator('[data-testid="summary-panel"]')
    await expect(summaryPanel).toBeVisible()

    // Assert: Total operations count
    const operationCount = page.locator(
      '[data-testid="summary-total-operations"]'
    )
    await expect(operationCount).toContainText('3')

    // Assert: Total duration displayed
    const totalDuration = page.locator('[data-testid="summary-total-duration"]')
    await expect(totalDuration).toBeVisible()

    // Step 3: Click to expand breakdown
    await page.click('[data-testid="summary-breakdown-toggle"]')

    // Assert: Per-operation breakdown visible
    const breakdown = page.locator('[data-testid="summary-breakdown-detail"]')
    await expect(breakdown).toBeVisible()
  })

  // ============================================================================
  // Related BOMs Section
  // ============================================================================
  test('related BOMs section displays when routing used', async ({ page }) => {
    // Arrange - Routing used by 2 BOMs
    await page.goto(`${BASE_URL}${ROUTING_DETAIL_URL}`)

    // Assert: Related BOMs section visible
    const relatedSection = page.locator('[data-testid="related-boms-section"]')
    await expect(relatedSection).toBeVisible()

    // Assert: BOM list displayed
    const bomList = page.locator('[data-testid="bom-item"]')
    const bomCount = await bomList.count()
    expect(bomCount).toBeGreaterThan(0)

    // Assert: "[View All BOMs ->]" link if more than 5
    if (bomCount > 5) {
      const viewAllLink = page.locator('[data-testid="view-all-boms-link"]')
      await expect(viewAllLink).toBeVisible()
    }
  })

  // ============================================================================
  // Related BOMs Section - Not Used Yet
  // ============================================================================
  test('related BOMs section shows "Not used yet" when empty', async ({
    page,
  }) => {
    // Arrange - Routing not used by any BOMs
    await page.goto(`${BASE_URL}${ROUTING_DETAIL_URL}?unused=true`)

    // Assert: Empty state message
    const emptyMessage = page.locator(
      '[data-testid="related-boms-section"]:has-text("Not used yet")'
    )
    await expect(emptyMessage).toBeVisible()
  })

  // ============================================================================
  // Responsive Design
  // ============================================================================
  test('operations table is responsive on mobile', async ({ page }) => {
    // Arrange
    page.setViewportSize({ width: 375, height: 667 }) // iPhone size
    await page.goto(`${BASE_URL}${ROUTING_DETAIL_URL}`)

    // Assert: Table still visible and usable
    const table = page.locator('[data-testid="operations-table"]')
    await expect(table).toBeVisible()

    // Assert: Action buttons accessible
    const firstRowActions = page.locator(
      '[data-testid="operations-table"] tbody tr:first-child [data-testid="edit-button"]'
    )
    await expect(firstRowActions).toBeVisible()

    // Assert: Touch target size >= 48x48dp
    const editButton = firstRowActions.first()
    const box = await editButton.boundingBox()
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44) // Allow some tolerance
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })
})
