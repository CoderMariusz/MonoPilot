import { test, expect } from '../support/fixtures'

/**
 * E2E Tests: Settings Wizard
 * Story: 1.12 Settings Wizard (UX Design)
 * BATCH 3: E2E Tests
 *
 * Tests complete settings wizard workflows:
 * - 6-step wizard flow
 * - Step validation
 * - Progress tracking
 * - Back/Next navigation
 * - Wizard completion
 */

test.describe('Settings Wizard - Onboarding Flow', () => {
  test('AC-012.1: Can complete full 6-step wizard flow', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    // Given: an admin user is logged in
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    // When: admin navigates to wizard page
    await page.goto('/settings/wizard')

    // Then: wizard should be visible with step 1
    await expect(page.getByText('Organization Setup Wizard')).toBeVisible()
    await expect(page.getByText('Step 1 of 6: Organization Basics')).toBeVisible()

    // ============ STEP 1: Organization Basics ============
    await page.fill('input#company_name', 'Test Company Inc.')
    await page.fill('input#city', 'Warsaw')
    await page.fill('input#postal_code', '00-001')
    await page.fill('input#address', '123 Test Street')

    // Click Next
    await page.click('button:has-text("Next")')

    // ============ STEP 2: Regional Settings ============
    await expect(page.getByText('Step 2 of 6: Regional Settings')).toBeVisible()

    // Fields should be pre-filled with defaults
    await expect(page.locator('button[role="combobox"]:has-text("Europe/Warsaw")')).toBeVisible()

    // Change currency to EUR
    await page.click('button[role="combobox"]:near(label:has-text("Currency"))')
    await page.click('div[role="option"]:has-text("EUR")')

    // Click Next
    await page.click('button:has-text("Next")')

    // ============ STEP 3: First Warehouse ============
    await expect(page.getByText('Step 3 of 6: First Warehouse')).toBeVisible()

    await page.fill('input#warehouse_code', 'WH-01')
    await page.fill('input#warehouse_name', 'Main Warehouse')
    await page.fill('input#warehouse_address', '456 Warehouse Ave')

    // Click Next
    await page.click('button:has-text("Next")')

    // ============ STEP 4: Key Locations ============
    await expect(page.getByText('Step 4 of 6: Key Locations')).toBeVisible()

    // Default location codes should be pre-filled
    await expect(page.locator('input[value="RCV-01"]')).toBeVisible()
    await expect(page.locator('input[value="SHP-01"]')).toBeVisible()
    await expect(page.locator('input[value="TRN-01"]')).toBeVisible()
    await expect(page.locator('input[value="PRD-01"]')).toBeVisible()

    // Optionally customize location names
    await page.fill('input#receiving_name', 'Receiving Dock A')

    // Click Next
    await page.click('button:has-text("Next")')

    // ============ STEP 5: Module Selection ============
    await expect(page.getByText('Step 5 of 6: Module Selection')).toBeVisible()

    // Default modules should be checked
    const technicalCheckbox = page.locator('input[type="checkbox"]#technical')
    await expect(technicalCheckbox).toBeChecked()

    // Optionally enable Quality module
    const qualityCheckbox = page.locator('input[type="checkbox"]#quality')
    const isQualityChecked = await qualityCheckbox.isChecked()
    if (!isQualityChecked) {
      await page.click('label[for="quality"]')
    }

    // Click Next
    await page.click('button:has-text("Next")')

    // ============ STEP 6: Invite Users ============
    await expect(page.getByText('Step 6 of 6: Invite Users')).toBeVisible()

    // Add a user
    await page.click('button:has-text("+ Add User")')

    // Fill user details
    const firstUserRow = page.locator('div:has-text("User 1")').locator('..')
    await firstUserRow.locator('input[placeholder="Email"]').fill('test.user@example.com')
    await firstUserRow.locator('input[placeholder="First Name"]').fill('Test')
    await firstUserRow.locator('input[placeholder="Last Name"]').fill('User')
    await firstUserRow.locator('button[role="combobox"]').click()
    await page.click('div[role="option"]:has-text("User")')

    // Click Complete Setup
    await page.click('button:has-text("Complete Setup")')

    // Then: success message should appear
    await expect(page.getByText(/completed successfully/i)).toBeVisible({
      timeout: 10000,
    })

    // And: should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('AC-012.2: Step 1 validates required company name', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/wizard')

    // When: admin tries to proceed without company name
    await page.click('button:has-text("Next")')

    // Then: validation error should appear
    await expect(page.getByText(/company name is required/i)).toBeVisible()

    // And: should remain on step 1
    await expect(page.getByText('Step 1 of 6')).toBeVisible()
  })

  test('AC-012.2: Step 3 validates required warehouse fields', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/wizard')

    // Complete step 1
    await page.fill('input#company_name', 'Test Company')
    await page.click('button:has-text("Next")')

    // Complete step 2 (already has defaults)
    await page.click('button:has-text("Next")')

    // When: admin tries to proceed step 3 without warehouse code
    await page.fill('input#warehouse_name', 'Warehouse Name Only')
    await page.click('button:has-text("Next")')

    // Then: validation error should appear
    await expect(page.getByText(/warehouse code is required/i)).toBeVisible()

    // And: should remain on step 3
    await expect(page.getByText('Step 3 of 6')).toBeVisible()
  })

  test('AC-012.2: Step 5 requires at least one module enabled', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/wizard')

    // Fast-forward to step 5
    await page.fill('input#company_name', 'Test Company')
    await page.click('button:has-text("Next")') // Step 1 → 2
    await page.click('button:has-text("Next")') // Step 2 → 3
    await page.fill('input#warehouse_code', 'WH-01')
    await page.fill('input#warehouse_name', 'Main Warehouse')
    await page.click('button:has-text("Next")') // Step 3 → 4
    await page.click('button:has-text("Next")') // Step 4 → 5

    // When: admin unchecks all modules
    const technicalCheckbox = page.locator('input[type="checkbox"]#technical')
    await page.click('label[for="technical"]') // Uncheck Technical
    await page.click('label[for="planning"]') // Uncheck Planning
    await page.click('label[for="production"]') // Uncheck Production
    await page.click('label[for="warehouse"]') // Uncheck Warehouse

    // Try to proceed
    await page.click('button:has-text("Next")')

    // Then: validation error should appear
    await expect(page.getByText(/at least one module/i)).toBeVisible()

    // And: should remain on step 5
    await expect(page.getByText('Step 5 of 6')).toBeVisible()
  })

  test('AC-012.8: Can navigate back through wizard steps', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/wizard')

    // Complete step 1
    await page.fill('input#company_name', 'Test Company')
    await page.click('button:has-text("Next")')

    // Now on step 2
    await expect(page.getByText('Step 2 of 6')).toBeVisible()

    // When: admin clicks Back
    await page.click('button:has-text("Back")')

    // Then: should return to step 1
    await expect(page.getByText('Step 1 of 6')).toBeVisible()

    // And: company name should be preserved
    const companyNameInput = page.locator('input#company_name')
    await expect(companyNameInput).toHaveValue('Test Company')
  })

  test('AC-012.8: Back button is disabled on step 1', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/wizard')

    // Then: Back button should be disabled on step 1
    const backButton = page.locator('button:has-text("Back")')
    await expect(backButton).toBeDisabled()
  })

  test('AC-012.8: Progress bar updates with each step', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/wizard')

    // Then: progress bar should exist
    const progressBar = page.locator('[role="progressbar"]')
    await expect(progressBar).toBeVisible()

    // Initial progress (step 1/6 = ~16.67%)
    const initialValue = await progressBar.getAttribute('aria-valuenow')
    expect(parseFloat(initialValue || '0')).toBeGreaterThan(0)
    expect(parseFloat(initialValue || '0')).toBeLessThan(20)

    // Complete step 1
    await page.fill('input#company_name', 'Test Company')
    await page.click('button:has-text("Next")')

    // Progress should increase (step 2/6 = ~33.33%)
    const step2Value = await progressBar.getAttribute('aria-valuenow')
    expect(parseFloat(step2Value || '0')).toBeGreaterThan(parseFloat(initialValue || '0'))
  })

  test('AC-012.6: Step 6 allows adding and removing users', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/wizard')

    // Fast-forward to step 6
    await page.fill('input#company_name', 'Test Company')
    await page.click('button:has-text("Next")')
    await page.click('button:has-text("Next")')
    await page.fill('input#warehouse_code', 'WH-01')
    await page.fill('input#warehouse_name', 'Main Warehouse')
    await page.click('button:has-text("Next")')
    await page.click('button:has-text("Next")')
    await page.click('button:has-text("Next")')

    // When: admin adds multiple users
    await page.click('button:has-text("+ Add User")')
    await page.click('button:has-text("+ Add User")')

    // Then: should show 2 user forms
    await expect(page.getByText('User 1')).toBeVisible()
    await expect(page.getByText('User 2')).toBeVisible()

    // When: admin removes user 1
    const removeButton = page.locator('div:has-text("User 1")').locator('button:has(svg)')
    await removeButton.click()

    // Then: only user 2 should remain (now shown as User 1)
    const userForms = page.locator('div:has-text("User"):has(input[placeholder="Email"])')
    const count = await userForms.count()
    expect(count).toBe(1)
  })

  test('Step 6 user invitations are optional', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/wizard')

    // Complete all steps without adding users
    await page.fill('input#company_name', 'Test Company')
    await page.click('button:has-text("Next")')
    await page.click('button:has-text("Next")')
    await page.fill('input#warehouse_code', 'WH-01')
    await page.fill('input#warehouse_name', 'Main Warehouse')
    await page.click('button:has-text("Next")')
    await page.click('button:has-text("Next")')
    await page.click('button:has-text("Next")')

    // Now on step 6 - don't add any users

    // When: admin completes without users
    await page.click('button:has-text("Complete Setup")')

    // Then: wizard should complete successfully
    await expect(page.getByText(/completed successfully/i)).toBeVisible({
      timeout: 10000,
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * ✅ AC-012.1: Complete full 6-step wizard flow (1 test)
 * ✅ AC-012.2: Step 1 company name validation (1 test)
 * ✅ AC-012.2: Step 3 warehouse validation (1 test)
 * ✅ AC-012.2: Step 5 module validation (1 test)
 * ✅ AC-012.8: Back navigation (1 test)
 * ✅ AC-012.8: Back disabled on step 1 (1 test)
 * ✅ AC-012.8: Progress bar updates (1 test)
 * ✅ AC-012.6: Add/remove users (1 test)
 * ✅ Step 6 users optional (1 test)
 *
 * Total: 9 E2E test cases covering settings wizard workflow
 *
 * Note: Additional tests for wizard skip/resume, progress save,
 * and circular dependency resolution require more complex setup
 */
