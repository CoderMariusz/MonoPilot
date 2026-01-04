/**
 * E2E Tests: Warehouse Settings Page
 * Story: 05.0 - Warehouse Settings (Module Configuration)
 * Phase: RED - Tests verify all acceptance criteria
 *
 * Tests critical end-to-end scenarios:
 * - Load Warehouse Settings page (AC-01)
 * - Display all 4 phase sections with defaults (AC-02 to AC-12)
 * - Edit and save settings successfully (AC-13)
 * - Validation error handling (AC-13)
 * - Cross-field dependencies (AC-2, AC-4, AC-5, AC-8, AC-11)
 * - Section collapse/expand with state persistence (AC-01)
 * - Unsaved changes warning (AC-13)
 * - Read-only mode for non-admin users (AC-01, AC-15)
 *
 * Coverage Target: 80% (comprehensive smoke tests)
 * Test Count: 12 critical scenarios
 *
 * Run with: npx playwright test warehouse-settings.spec.ts
 */

import { test, expect } from '@playwright/test'

/**
 * Test configuration
 */
const ADMIN_EMAIL = 'admin@monopilot-e2e.com'
const ADMIN_PASSWORD = 'Test123!@#'
const VIEWER_EMAIL = 'viewer@monopilot-e2e.com'
const VIEWER_PASSWORD = 'Test123!@#'
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

/**
 * Helper: Login as admin user
 */
async function loginAsAdmin(page: any) {
  await page.goto(`${BASE_URL}/auth/login`)
  await page.fill('[name="email"]', ADMIN_EMAIL)
  await page.fill('[name="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForLoadState('networkidle')
}

/**
 * Helper: Login as viewer user
 */
async function loginAsViewer(page: any) {
  await page.goto(`${BASE_URL}/auth/login`)
  await page.fill('[name="email"]', VIEWER_EMAIL)
  await page.fill('[name="password"]', VIEWER_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForLoadState('networkidle')
}

/**
 * Helper: Navigate to Warehouse Settings page
 */
async function navigateToWarehouseSettings(page: any) {
  await page.goto(`${BASE_URL}/settings/warehouse`)
  await page.waitForLoadState('networkidle')
}

/**
 * Helper: Wait for page to fully load
 */
async function waitForPageLoad(page: any) {
  await page.waitForLoadState('domcontentloaded')
  // Wait for form to be rendered
  await page.waitForSelector('[data-testid="warehouse-settings-form"]', { timeout: 5000 })
}

test.describe('Warehouse Settings E2E - Story 05.0', () => {
  /**
   * AC-01: Warehouse Settings Page Loads
   * Verify page structure, header, description, and all 4 phase sections visible
   */
  test('AC-01: should load Warehouse Settings page with all 4 sections visible', async ({ page }) => {
    // GIVEN authenticated admin user
    await loginAsAdmin(page)

    // WHEN navigating to /settings/warehouse
    await navigateToWarehouseSettings(page)
    await waitForPageLoad(page)

    // THEN page header is visible
    await expect(page.locator('h1:has-text("Warehouse Settings")')).toBeVisible()

    // THEN description text is visible
    await expect(
      page.locator('text=Configure warehouse module behavior')
    ).toBeVisible()

    // THEN all 4 collapsible sections are visible with correct titles
    const phase0Section = page.locator('[data-testid="phase0-settings"]')
    const phase1Section = page.locator('[data-testid="phase1-settings"]')
    const phase2Section = page.locator('[data-testid="phase2-settings"]')
    const phase3Section = page.locator('[data-testid="phase3-settings"]')

    await expect(phase0Section).toBeVisible()
    await expect(phase1Section).toBeVisible()
    await expect(phase2Section).toBeVisible()
    await expect(phase3Section).toBeVisible()

    // THEN section titles are visible
    await expect(page.locator('text=PHASE 0: CORE CONFIGURATION')).toBeVisible()
    await expect(page.locator('text=PHASE 1: RECEIPT & INVENTORY')).toBeVisible()
    await expect(page.locator('text=PHASE 2: SCANNER & LABELS')).toBeVisible()
    await expect(page.locator('text=PHASE 3: ADVANCED FEATURES')).toBeVisible()

    // THEN Save Changes and View Change History buttons visible
    const saveButton = page.locator('button:has-text("Save Changes")')
    const historyButton = page.locator('button:has-text("View Change History")')
    const resetButton = page.locator('button:has-text("Reset to Defaults")')

    await expect(saveButton).toBeVisible()
    await expect(historyButton).toBeVisible()
    await expect(resetButton).toBeVisible()

    // THEN Save button is disabled when no changes made
    await expect(saveButton).toBeDisabled()
  })

  /**
   * AC-02: Phase 0 Settings - Default Values Display
   * Verify all Phase 0 fields display with correct defaults
   */
  test('AC-02: should display Phase 0 settings with correct default values', async ({ page }) => {
    // GIVEN user on Warehouse Settings page
    await loginAsAdmin(page)
    await navigateToWarehouseSettings(page)
    await waitForPageLoad(page)

    // THEN LP Configuration fields visible with defaults
    const autoGenerateToggle = page.locator('[data-testid="auto_generate_lp_number"]')
    await expect(autoGenerateToggle).toBeVisible()
    await expect(autoGenerateToggle).toBeChecked() // Default: ON

    const lpPrefix = page.locator('[data-testid="lp_number_prefix"]')
    await expect(lpPrefix).toHaveValue('LP')

    const lpSequenceLength = page.locator('[data-testid="lp_number_sequence_length"]')
    await expect(lpSequenceLength).toHaveValue('8')

    // THEN Pick Strategy toggles visible with defaults
    const fifoToggle = page.locator('[data-testid="enable_fifo"]')
    await expect(fifoToggle).toBeChecked() // Default: ON

    const fefoToggle = page.locator('[data-testid="enable_fefo"]')
    await expect(fefoToggle).not.toBeChecked() // Default: OFF

    // THEN Batch Tracking toggles visible with defaults
    const batchTrackingToggle = page.locator('[data-testid="enable_batch_tracking"]')
    await expect(batchTrackingToggle).toBeChecked() // Default: ON

    const requireBatchToggle = page.locator('[data-testid="require_batch_on_receipt"]')
    await expect(requireBatchToggle).not.toBeChecked() // Default: OFF

    const supplierBatchToggle = page.locator('[data-testid="enable_supplier_batch"]')
    await expect(supplierBatchToggle).toBeChecked() // Default: ON

    // THEN Expiry Tracking toggles visible with defaults
    const expiryTrackingToggle = page.locator('[data-testid="enable_expiry_tracking"]')
    await expect(expiryTrackingToggle).toBeChecked() // Default: ON

    const requireExpiryToggle = page.locator('[data-testid="require_expiry_on_receipt"]')
    await expect(requireExpiryToggle).not.toBeChecked() // Default: OFF

    const expiryWarningDays = page.locator('[data-testid="expiry_warning_days"]')
    await expect(expiryWarningDays).toHaveValue('30')

    // THEN QA Status toggles visible with defaults
    const requireQaToggle = page.locator('[data-testid="require_qa_on_receipt"]')
    await expect(requireQaToggle).toBeChecked() // Default: ON

    const defaultQaStatus = page.locator('[data-testid="default_qa_status"]')
    await expect(defaultQaStatus).toHaveValue('pending')

    // THEN Split/Merge toggle visible with default
    const splitMergeToggle = page.locator('[data-testid="enable_split_merge"]')
    await expect(splitMergeToggle).toBeChecked() // Default: ON
  })

  /**
   * AC-08: Phase 1 Settings - Default Values Display
   */
  test('AC-08: should display Phase 1 settings with correct default values', async ({ page }) => {
    // GIVEN user on Warehouse Settings page
    await loginAsAdmin(page)
    await navigateToWarehouseSettings(page)
    await waitForPageLoad(page)

    // THEN ASN toggle visible with default
    const asnToggle = page.locator('[data-testid="enable_asn"]')
    await expect(asnToggle).toBeVisible()
    await expect(asnToggle).not.toBeChecked() // Default: OFF

    // THEN Over-receipt toggles visible with defaults
    const allowOverReceiptToggle = page.locator('[data-testid="allow_over_receipt"]')
    await expect(allowOverReceiptToggle).not.toBeChecked() // Default: OFF

    const overReceiptTolerance = page.locator('[data-testid="over_receipt_tolerance_pct"]')
    await expect(overReceiptTolerance).toBeDisabled() // Disabled when toggle OFF
    await expect(overReceiptTolerance).toHaveValue('0')

    // THEN Transit Location toggle visible with default
    const transitLocationToggle = page.locator('[data-testid="enable_transit_location"]')
    await expect(transitLocationToggle).toBeChecked() // Default: ON
  })

  /**
   * AC-10: Phase 2 Settings - Default Values Display
   */
  test('AC-10: should display Phase 2 settings with correct default values', async ({ page }) => {
    // GIVEN user on Warehouse Settings page
    await loginAsAdmin(page)
    await navigateToWarehouseSettings(page)
    await waitForPageLoad(page)

    // THEN Scanner settings visible with defaults
    const scannerTimeout = page.locator('[data-testid="scanner_idle_timeout_sec"]')
    await expect(scannerTimeout).toHaveValue('300')

    const scannerSound = page.locator('[data-testid="scanner_sound_feedback"]')
    await expect(scannerSound).toBeChecked() // Default: ON

    // THEN Label printing settings visible with defaults
    const printLabelToggle = page.locator('[data-testid="print_label_on_receipt"]')
    await expect(printLabelToggle).toBeChecked() // Default: ON

    const labelCopies = page.locator('[data-testid="label_copies_default"]')
    await expect(labelCopies).toBeEnabled() // Enabled when toggle ON
    await expect(labelCopies).toHaveValue('1')
  })

  /**
   * AC-12: Phase 3 Settings - Default Values Display
   */
  test('AC-12: should display Phase 3 settings with correct default values (all OFF)', async ({ page }) => {
    // GIVEN user on Warehouse Settings page
    await loginAsAdmin(page)
    await navigateToWarehouseSettings(page)
    await waitForPageLoad(page)

    // THEN all Phase 3 toggles are OFF by default
    const palletsToggle = page.locator('[data-testid="enable_pallets"]')
    await expect(palletsToggle).not.toBeChecked()

    const gs1Toggle = page.locator('[data-testid="enable_gs1_barcodes"]')
    await expect(gs1Toggle).not.toBeChecked()

    const catchWeightToggle = page.locator('[data-testid="enable_catch_weight"]')
    await expect(catchWeightToggle).not.toBeChecked()

    const locationZonesToggle = page.locator('[data-testid="enable_location_zones"]')
    await expect(locationZonesToggle).not.toBeChecked()

    const locationCapacityToggle = page.locator('[data-testid="enable_location_capacity"]')
    await expect(locationCapacityToggle).not.toBeChecked()
  })

  /**
   * AC-13: Settings Update - Success Path
   * Edit settings, save successfully, verify toast, button state, and persistence
   */
  test('AC-13: should successfully edit and save settings with persistence', async ({ page }) => {
    // GIVEN user on Warehouse Settings page
    await loginAsAdmin(page)
    await navigateToWarehouseSettings(page)
    await waitForPageLoad(page)

    // WHEN changing LP Prefix
    const lpPrefix = page.locator('[data-testid="lp_number_prefix"]')
    await lpPrefix.clear()
    await lpPrefix.fill('WH-')

    // WHEN changing FIFO to OFF
    const fifoToggle = page.locator('[data-testid="enable_fifo"]')
    await fifoToggle.click()

    // THEN Save Changes button becomes enabled (form is dirty)
    const saveButton = page.locator('button:has-text("Save Changes")')
    await expect(saveButton).toBeEnabled()

    // WHEN clicking Save Changes
    await saveButton.click()

    // THEN success toast appears
    const successToast = page.locator('text=Warehouse settings saved successfully')
    await expect(successToast).toBeVisible()

    // THEN Save button becomes disabled again (form is clean)
    await expect(saveButton).toBeDisabled()

    // THEN changes persist on page reload
    await page.reload()
    await waitForPageLoad(page)

    // THEN LP Prefix still shows WH- after reload
    const lpPrefixAfterReload = page.locator('[data-testid="lp_number_prefix"]')
    await expect(lpPrefixAfterReload).toHaveValue('WH-')

    // THEN FIFO still OFF after reload
    const fifoToggleAfterReload = page.locator('[data-testid="enable_fifo"]')
    await expect(fifoToggleAfterReload).not.toBeChecked()
  })

  /**
   * AC-13: Settings Update - Validation Errors
   * Enter invalid prefix, verify error display and field highlighting
   */
  test('AC-13: should show validation error for invalid LP prefix format', async ({ page }) => {
    // GIVEN user on Warehouse Settings page
    await loginAsAdmin(page)
    await navigateToWarehouseSettings(page)
    await waitForPageLoad(page)

    // WHEN entering invalid prefix (lowercase)
    const lpPrefix = page.locator('[data-testid="lp_number_prefix"]')
    await lpPrefix.clear()
    await lpPrefix.fill('lp-') // Invalid - must be uppercase

    // WHEN clicking Save Changes
    const saveButton = page.locator('button:has-text("Save Changes")')
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    // THEN validation error appears below field
    const errorMessage = page.locator('text=Prefix must be uppercase alphanumeric with hyphens only')
    await expect(errorMessage).toBeVisible()

    // THEN field is highlighted with error styling
    const hasErrorClass = await lpPrefix.evaluate((el: Element) =>
      el.className.includes('error') || el.getAttribute('aria-invalid') === 'true'
    )
    expect(hasErrorClass).toBeTruthy()

    // THEN settings NOT saved - verify by checking persistence
    await page.reload()
    await waitForPageLoad(page)

    // THEN prefix still shows default LP (not the invalid lp-)
    const lpPrefixAfterReload = page.locator('[data-testid="lp_number_prefix"]')
    await expect(lpPrefixAfterReload).toHaveValue('LP')
  })

  /**
   * AC-2: Cross-field Dependency - Auto-Generate LP OFF disables prefix/sequence
   */
  test('AC-02: should disable LP prefix and sequence when auto-generate is OFF', async ({ page }) => {
    // GIVEN user on Warehouse Settings page
    await loginAsAdmin(page)
    await navigateToWarehouseSettings(page)
    await waitForPageLoad(page)

    // WHEN turning OFF auto_generate_lp_number
    const autoGenerateToggle = page.locator('[data-testid="auto_generate_lp_number"]')
    await autoGenerateToggle.click()

    // THEN LP prefix becomes disabled
    const lpPrefix = page.locator('[data-testid="lp_number_prefix"]')
    await expect(lpPrefix).toBeDisabled()

    // THEN LP sequence length becomes disabled
    const lpSequenceLength = page.locator('[data-testid="lp_number_sequence_length"]')
    await expect(lpSequenceLength).toBeDisabled()

    // THEN warning message displays
    const warningMessage = page.locator('text=Manual LP entry required on receipt')
    await expect(warningMessage).toBeVisible()

    // WHEN turning ON auto_generate_lp_number again
    await autoGenerateToggle.click()

    // THEN fields become enabled again
    await expect(lpPrefix).toBeEnabled()
    await expect(lpSequenceLength).toBeEnabled()
  })

  /**
   * AC-4: Cross-field Dependency - Require Batch requires Enable Batch
   */
  test('AC-04: should disable require_batch_on_receipt when enable_batch_tracking is OFF', async ({ page }) => {
    // GIVEN user on Warehouse Settings page
    await loginAsAdmin(page)
    await navigateToWarehouseSettings(page)
    await waitForPageLoad(page)

    // WHEN turning OFF enable_batch_tracking
    const batchTrackingToggle = page.locator('[data-testid="enable_batch_tracking"]')
    await batchTrackingToggle.click()

    // THEN require_batch_on_receipt becomes disabled
    const requireBatchToggle = page.locator('[data-testid="require_batch_on_receipt"]')
    await expect(requireBatchToggle).toBeDisabled()

    // THEN enable_supplier_batch becomes disabled
    const supplierBatchToggle = page.locator('[data-testid="enable_supplier_batch"]')
    await expect(supplierBatchToggle).toBeDisabled()

    // THEN tooltip displays
    const tooltip = page.locator('text=Enable batch tracking first')
    await expect(tooltip).toBeVisible()

    // WHEN turning ON enable_batch_tracking again
    await batchTrackingToggle.click()

    // THEN fields become enabled again
    await expect(requireBatchToggle).toBeEnabled()
    await expect(supplierBatchToggle).toBeEnabled()
  })

  /**
   * AC-8: Cross-field Dependency - Over-receipt tolerance disabled when allow_over_receipt OFF
   */
  test('AC-08: should enable over_receipt_tolerance_pct when allow_over_receipt is ON', async ({ page }) => {
    // GIVEN user on Warehouse Settings page
    await loginAsAdmin(page)
    await navigateToWarehouseSettings(page)
    await waitForPageLoad(page)

    // THEN over_receipt_tolerance_pct is disabled (allow_over_receipt is OFF by default)
    const toleranceInput = page.locator('[data-testid="over_receipt_tolerance_pct"]')
    await expect(toleranceInput).toBeDisabled()

    // WHEN toggling allow_over_receipt ON
    const allowOverReceiptToggle = page.locator('[data-testid="allow_over_receipt"]')
    await allowOverReceiptToggle.click()

    // THEN tolerance field becomes enabled
    await expect(toleranceInput).toBeEnabled()

    // WHEN entering tolerance value
    await toleranceInput.fill('10.5')

    // THEN value accepted
    await expect(toleranceInput).toHaveValue('10.5')

    // WHEN toggling allow_over_receipt OFF
    await allowOverReceiptToggle.click()

    // THEN tolerance field becomes disabled again
    await expect(toleranceInput).toBeDisabled()
  })

  /**
   * AC-11: Cross-field Dependency - Label copies disabled when print_label_on_receipt OFF
   */
  test('AC-11: should disable label_copies_default when print_label_on_receipt is OFF', async ({ page }) => {
    // GIVEN user on Warehouse Settings page
    await loginAsAdmin(page)
    await navigateToWarehouseSettings(page)
    await waitForPageLoad(page)

    // WHEN turning OFF print_label_on_receipt
    const printLabelToggle = page.locator('[data-testid="print_label_on_receipt"]')
    await printLabelToggle.click()

    // THEN label_copies_default becomes disabled
    const labelCopies = page.locator('[data-testid="label_copies_default"]')
    await expect(labelCopies).toBeDisabled()

    // WHEN turning ON print_label_on_receipt again
    await printLabelToggle.click()

    // THEN label_copies_default becomes enabled
    await expect(labelCopies).toBeEnabled()
  })

  /**
   * AC-01: Collapsible Sections with State Persistence
   */
  test('AC-01: should collapse and expand sections with state persistence', async ({ page }) => {
    // GIVEN user on Warehouse Settings page
    await loginAsAdmin(page)
    await navigateToWarehouseSettings(page)
    await waitForPageLoad(page)

    // THEN all sections are expanded by default
    const phase0Content = page.locator('[data-testid="phase0-settings"] >> text=License Plate Configuration')
    await expect(phase0Content).toBeVisible()

    // WHEN clicking collapse trigger on Phase 0 section
    const phase0Trigger = page.locator('[data-testid="phase0-settings"] >> button').first()
    await phase0Trigger.click()

    // THEN Phase 0 section collapses (content hidden)
    await expect(phase0Content).not.toBeVisible()

    // WHEN reloading page
    await page.reload()
    await waitForPageLoad(page)

    // THEN Phase 0 section remains collapsed (state persisted in localStorage)
    const phase0ContentAfterReload = page.locator('[data-testid="phase0-settings"] >> text=License Plate Configuration')
    await expect(phase0ContentAfterReload).not.toBeVisible()
  })

  /**
   * AC-14: View Change History Modal
   */
  test('AC-14: should open change history modal and display audit trail', async ({ page }) => {
    // GIVEN user on Warehouse Settings page
    await loginAsAdmin(page)
    await navigateToWarehouseSettings(page)
    await waitForPageLoad(page)

    // WHEN clicking View Change History button
    const historyButton = page.locator('button:has-text("View Change History")')
    await historyButton.click()

    // THEN history modal opens
    const historyModal = page.locator('[data-testid="settings-history-modal"]')
    await expect(historyModal).toBeVisible()

    // THEN modal title is visible
    await expect(page.locator('text=Settings Change History')).toBeVisible()

    // THEN table headers are visible
    await expect(page.locator('text=Setting Name')).toBeVisible()
    await expect(page.locator('text=Old Value')).toBeVisible()
    await expect(page.locator('text=New Value')).toBeVisible()
    await expect(page.locator('text=Changed By')).toBeVisible()
    await expect(page.locator('text=Date')).toBeVisible()

    // WHEN clicking Close button
    const closeButton = page.locator('button:has-text("Close")')
    await closeButton.click()

    // THEN modal closes
    await expect(historyModal).not.toBeVisible()
  })

  /**
   * AC-01, AC-15: Read-only Mode for Non-Admin Users
   */
  test('AC-01/AC-15: should display read-only mode for VIEWER role', async ({ page }) => {
    // GIVEN viewer user
    await loginAsViewer(page)
    await navigateToWarehouseSettings(page)
    await waitForPageLoad(page)

    // THEN Read-Only indicator visible
    await expect(page.locator('text=Read-Only')).toBeVisible()

    // THEN warning message visible
    await expect(
      page.locator('text=You have read-only access. Contact your administrator to modify settings')
    ).toBeVisible()

    // THEN all toggles are disabled
    const autoGenerateToggle = page.locator('[data-testid="auto_generate_lp_number"]')
    await expect(autoGenerateToggle).toBeDisabled()

    const fifoToggle = page.locator('[data-testid="enable_fifo"]')
    await expect(fifoToggle).toBeDisabled()

    // THEN all inputs are disabled
    const lpPrefix = page.locator('[data-testid="lp_number_prefix"]')
    await expect(lpPrefix).toBeDisabled()

    // THEN Save Changes button is hidden
    const saveButton = page.locator('button:has-text("Save Changes")')
    await expect(saveButton).not.toBeVisible()

    // THEN Reset to Defaults button is hidden
    const resetButton = page.locator('button:has-text("Reset to Defaults")')
    await expect(resetButton).not.toBeVisible()

    // THEN View Change History button is still visible (read-only)
    const historyButton = page.locator('button:has-text("View Change History")')
    await expect(historyButton).toBeVisible()
  })

  /**
   * AC-13: Unsaved Changes Warning
   */
  test('AC-13: should warn when navigating away with unsaved changes', async ({ page }) => {
    // GIVEN user on Warehouse Settings page
    await loginAsAdmin(page)
    await navigateToWarehouseSettings(page)
    await waitForPageLoad(page)

    // WHEN making a change (toggle FIFO)
    const fifoToggle = page.locator('[data-testid="enable_fifo"]')
    await fifoToggle.click()

    // THEN form is dirty - Save button becomes enabled
    const saveButton = page.locator('button:has-text("Save Changes")')
    await expect(saveButton).toBeEnabled()

    // WHEN trying to navigate away without saving
    // Setup dialog handler to verify dialog appears
    let dialogShown = false
    page.once('dialog', async (dialog) => {
      dialogShown = true
      // Dialog should contain warning about unsaved changes
      const message = dialog.message()
      expect(message.toLowerCase()).toContain('unsaved')
      // Accept dialog to allow navigation
      await dialog.accept()
    })

    // WHEN navigating to different page
    await page.goto(`${BASE_URL}/settings`)

    // THEN browser confirmation dialog appeared
    expect(dialogShown).toBeTruthy()
  })
})

/**
 * Test Summary for Story 05.0 - Warehouse Settings E2E
 * ======================================================
 *
 * Comprehensive E2E Test Coverage:
 *
 * Acceptance Criteria Covered:
 * - AC-01: Warehouse Settings Page Access (page structure, sections, read-only)
 * - AC-02: Phase 0 Settings - LP Configuration (defaults, dependencies)
 * - AC-04: Phase 0 Settings - Batch Tracking (defaults, dependencies)
 * - AC-08: Phase 1 Settings - ASN & Over-Receipt (defaults, dependencies)
 * - AC-10: Phase 2 Settings - Scanner Configuration (defaults)
 * - AC-11: Phase 2 Settings - Label Printing (defaults, dependencies)
 * - AC-12: Phase 3 Settings - Advanced Features (all OFF defaults)
 * - AC-13: Settings Save & Validation (success, errors, persistence, warnings)
 * - AC-14: Settings Audit Trail (history modal)
 * - AC-15: Multi-tenancy & Permissions (read-only mode)
 *
 * Test Scenarios (12 total):
 * 1. AC-01: Page load with all 4 sections visible
 * 2. AC-02: Display Phase 0 settings with correct defaults
 * 3. AC-08: Display Phase 1 settings with correct defaults
 * 4. AC-10: Display Phase 2 settings with correct defaults
 * 5. AC-12: Display Phase 3 settings with correct defaults (all OFF)
 * 6. AC-13: Edit and save settings successfully with persistence
 * 7. AC-13: Show validation error for invalid LP prefix format
 * 8. AC-02: Disable LP prefix/sequence when auto-generate is OFF
 * 9. AC-04: Disable require_batch when enable_batch is OFF
 * 10. AC-08: Enable over-receipt tolerance when allow_over_receipt is ON
 * 11. AC-11: Disable label copies when print_label_on_receipt is OFF
 * 12. AC-01: Collapse and expand sections with state persistence
 * 13. AC-14: Open change history modal and display audit trail
 * 14. AC-01/AC-15: Display read-only mode for VIEWER role
 * 15. AC-13: Warn when navigating away with unsaved changes
 *
 * Dependencies:
 * - DEV must implement: /settings/warehouse page and components
 * - DEV must implement: API routes (GET/PUT/PATCH/POST /api/warehouse/settings)
 * - DEV must implement: Warehouse settings service layer
 * - DEV must implement: Validation schemas
 * - DEV must implement: Phase 0-3 collapsible sections
 * - DEV must implement: Cross-field dependency logic
 * - QA must ensure: Playwright and test infrastructure ready
 *
 * Coverage Target: 80% (comprehensive smoke tests)
 * Status: COMPREHENSIVE E2E TEST SUITE READY FOR DEVELOPMENT
 */
