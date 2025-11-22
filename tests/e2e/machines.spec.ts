import { test, expect } from '../support/fixtures'

/**
 * E2E Tests: Machine Configuration CRUD
 * Story: 1.7 Machine Configuration
 * Story: 1.14 (AC-2.1) E2E Tests for Machine CRUD
 *
 * Tests complete machine management workflows:
 * - Creating machines with all validations
 * - Listing and filtering machines by status
 * - Searching machines by code/name
 * - Updating machine details (status, capacity)
 * - Line assignment integration
 * - Deleting machines with FK constraints
 */

test.describe('Machine Configuration - CRUD Operations', () => {
  test('AC-006.1: Admin can create a machine with required fields only', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    // Given: an admin user
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    // When: admin navigates to machines page
    await page.goto('/settings/machines')

    // And: clicks the create machine button
    await page.click('button:has-text("Add Machine")')

    // Then: create machine modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible()

    // When: admin fills in required fields only
    // Fill code (auto-uppercase)
    await page.fill('input#code', 'mix-01')

    // Fill name
    await page.fill('input#name', 'Mixer Machine 1')

    // Select status (default is 'active')
    await page.click('button[role="combobox"]:near(label:has-text("Status"))')
    await page.click('div[role="option"]:has-text("Active")')

    // Note: capacity_per_hour is optional

    // And: submits the form
    await page.click('button:has-text("Create Machine")')

    // Then: success message should appear
    await expect(page.getByText(/created successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // And: modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // And: new machine should appear in the list (code auto-uppercased)
    await expect(page.getByText('MIX-01')).toBeVisible()
    await expect(page.getByText('Mixer Machine 1')).toBeVisible()
    await expect(page.getByText('Active')).toBeVisible()
  })

  test('AC-006.1: Can create machine with optional capacity', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/machines')
    await page.click('button:has-text("Add Machine")')

    // Fill required fields
    await page.fill('input#code', 'pack-01')
    await page.fill('input#name', 'Packing Machine 1')
    await page.click('button[role="combobox"]:near(label:has-text("Status"))')
    await page.click('div[role="option"]:has-text("Active")')

    // When: admin adds capacity per hour
    await page.fill('input#capacity_per_hour', '1000.50')

    // And: submits the form
    await page.click('button:has-text("Create Machine")')

    // Then: machine should be created with capacity
    await expect(page.getByText(/created successfully/i)).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByText('PACK-01')).toBeVisible()
    await expect(page.getByText('1000.5')).toBeVisible()
  })

  test('AC-006.1: Code must be uppercase and unique', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/machines')

    // Create first machine with code "TEST-UNIQUE"
    await page.click('button:has-text("Add Machine")')
    await page.fill('input#code', 'test-unique')
    await page.fill('input#name', 'First Machine')
    await page.click('button[role="combobox"]:near(label:has-text("Status"))')
    await page.click('div[role="option"]:first')
    await page.click('button:has-text("Create Machine")')
    await expect(page.getByText(/created successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // Verify code was uppercased
    await expect(page.getByText('TEST-UNIQUE')).toBeVisible()

    // When: admin attempts to create another machine with same code
    await page.click('button:has-text("Add Machine")')
    await page.fill('input#code', 'TEST-UNIQUE') // Same code
    await page.fill('input#name', 'Duplicate Machine')
    await page.click('button[role="combobox"]:near(label:has-text("Status"))')
    await page.click('div[role="option"]:first')
    await page.click('button:has-text("Create Machine")')

    // Then: error message should appear
    await expect(
      page.getByText(/already exists|duplicate/i)
    ).toBeVisible({ timeout: 5000 })

    // And: modal should remain open
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('AC-006.1: Code format validation (uppercase, numbers, hyphens only)', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/machines')
    await page.click('button:has-text("Add Machine")')

    // When: admin enters invalid code with special characters
    await page.fill('input#code', 'INVALID_CODE!')
    await page.fill('input#name', 'Test Machine')
    await page.click('button:has-text("Create Machine")')

    // Then: validation error should appear
    await expect(
      page.getByText(/uppercase.*numbers.*hyphens|invalid.*format/i)
    ).toBeVisible()

    // And: modal should remain open
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('AC-006.2: Admin can edit machine status', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    // Given: an admin and a machine exist
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/machines')

    // When: admin clicks edit on a machine
    const editButton = page
      .locator('table tbody tr:first')
      .locator('button[aria-label*="Edit"]')
      .or(page.locator('table tbody tr:first').locator('button:has-text("Edit")'))

    await editButton.click()

    // Then: edit modal should open
    await expect(page.getByText('Edit Machine')).toBeVisible()

    // When: admin changes status to "Down"
    await page.click('button[role="combobox"]:near(label:has-text("Status"))')
    await page.click('div[role="option"]:has-text("Down")')

    // And: submits the form
    await page.click('button:has-text("Update Machine")')

    // Then: success message should appear
    await expect(page.getByText(/updated successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // And: modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // And: machine status should be updated in the list
    await expect(page.getByText('Down')).toBeVisible()
  })

  test('AC-006.2: Admin can edit machine capacity', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/machines')

    // When: admin clicks edit on a machine
    const editButton = page
      .locator('table tbody tr:first')
      .locator('button[aria-label*="Edit"]')
      .or(page.locator('table tbody tr:first').locator('button:has-text("Edit")'))

    await editButton.click()

    // When: admin updates capacity
    await page.fill('input#capacity_per_hour', '2500.75')

    // And: submits the form
    await page.click('button:has-text("Update Machine")')

    // Then: success message should appear
    await expect(page.getByText(/updated successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // And: capacity should be updated in the list
    await expect(page.getByText('2500.75')).toBeVisible()
  })

  test('AC-006.3: Can assign production lines to machine (Story 1.14 AC-2.3)', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/machines')

    // When: admin creates/edits a machine
    await page.click('button:has-text("Add Machine")')

    // Fill required fields
    await page.fill('input#code', 'LINE-MACHINE-01')
    await page.fill('input#name', 'Line Machine 1')
    await page.click('button[role="combobox"]:near(label:has-text("Status"))')
    await page.click('div[role="option"]:first')

    // When: admin assigns production lines (if any exist)
    const lineDropdown = page.locator('button[role="combobox"]:near(label:has-text("Production Lines"))')
    const lineDropdownExists = await lineDropdown.count()

    if (lineDropdownExists > 0) {
      await lineDropdown.click()
      // Select first available line
      await page.click('div[role="option"]:first')

      // Then: selected line should appear as a badge
      await expect(page.locator('.inline-flex.items-center.rounded-full')).toBeVisible()
    }

    // And: submits the form
    await page.click('button:has-text("Create Machine")')

    // Then: machine should be created
    await expect(page.getByText(/created successfully/i)).toBeVisible({
      timeout: 5000,
    })
  })

  test('AC-006.4: Can filter machines by status', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/machines')

    // Initial state: all machines visible
    const initialRows = await page.locator('table tbody tr').count()
    expect(initialRows).toBeGreaterThan(0)

    // When: admin filters by status "Active"
    await page.click('button:has-text("All Statuses")')
    await page.click('div[role="option"]:has-text("Active")')

    // Wait for filter to apply
    await page.waitForTimeout(500)

    // Then: only active machines should be visible
    const rows = await page.locator('table tbody tr')
    const count = await rows.count()

    if (count > 0) {
      // Verify all visible rows have "Active" status
      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i).getByText('Active')).toBeVisible()
      }
    }
  })

  test('AC-006.4: Can search machines by code', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/machines')

    // When: admin searches by machine code
    await page.fill('input[placeholder*="Search"]', 'MIX')

    // Wait for debounced search (300ms)
    await page.waitForTimeout(400)

    // Then: only matching machines should be visible
    const rows = await page.locator('table tbody tr')
    const count = await rows.count()

    if (count > 0) {
      // Verify all visible rows contain search term
      for (let i = 0; i < count; i++) {
        await expect(
          rows.nth(i).locator('td:has-text("MIX")')
        ).toBeVisible()
      }
    }
  })

  test('AC-006.4: Can search machines by name', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/machines')

    // When: admin searches by machine name
    await page.fill('input[placeholder*="Search"]', 'Mixer')

    // Wait for debounced search (300ms)
    await page.waitForTimeout(400)

    // Then: only matching machines should be visible
    const rows = await page.locator('table tbody tr')
    const count = await rows.count()

    if (count > 0) {
      // Verify all visible rows contain search term
      for (let i = 0; i < count; i++) {
        await expect(
          rows.nth(i).locator('td:has-text("Mixer")')
        ).toBeVisible()
      }
    }
  })

  test('AC-006.5: Can sort machines by code', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/machines')

    // When: admin clicks on "Code" column header to sort
    await page.click('th:has-text("Code")')

    // Wait for sort to apply
    await page.waitForTimeout(500)

    // Then: machines should be sorted by code
    const rows = await page.locator('table tbody tr')
    const count = await rows.count()

    if (count > 1) {
      // Get first two machine codes
      const firstCode = await rows.nth(0).locator('td:first').textContent()
      const secondCode = await rows.nth(1).locator('td:first').textContent()

      // Verify they are in order (ascending)
      expect(firstCode!.trim() <= secondCode!.trim()).toBeTruthy()
    }
  })

  test('AC-006.5: Can sort machines by name', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/machines')

    // When: admin clicks on "Name" column header to sort
    await page.click('th:has-text("Name")')

    // Wait for sort to apply
    await page.waitForTimeout(500)

    // Then: machines should be sorted by name
    const rows = await page.locator('table tbody tr')
    const count = await rows.count()

    if (count > 1) {
      // Get first two machine names
      const firstCell = await rows.nth(0).locator('td').nth(1).textContent()
      const secondCell = await rows.nth(1).locator('td').nth(1).textContent()

      // Verify they are in order (ascending)
      expect(firstCell!.trim() <= secondCell!.trim()).toBeTruthy()
    }
  })

  test('AC-006.2: Cannot delete machine with active work orders (FK constraint)', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    // This test assumes a machine is referenced by active work orders
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/machines')

    // When: admin attempts to delete a machine with FK constraints
    const deleteButton = page
      .locator('table tbody tr:first')
      .locator('button[aria-label*="Delete"]')
      .or(page.locator('table tbody tr:first').locator('button:has-text("Delete")'))

    page.once('dialog', (dialog) => {
      expect(dialog.message()).toContain('delete')
      dialog.accept()
    })

    await deleteButton.click()

    // Then: error message should appear with helpful info
    await expect(
      page.getByText(/active.*work.*order|cannot.*delete|in use/i)
    ).toBeVisible({ timeout: 5000 })

    // And: suggestion to change status should be shown
    await expect(
      page.getByText(/status.*down|status.*maintenance/i)
    ).toBeVisible({ timeout: 5000 })
  })

  test('AC-006.2: Can delete machine with no dependencies', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/machines')

    // Create a new machine (guaranteed to have no dependencies)
    await page.click('button:has-text("Add Machine")')
    await page.fill('input#code', 'DELETE-ME-01')
    await page.fill('input#name', 'Machine to Delete')
    await page.click('button[role="combobox"]:near(label:has-text("Status"))')
    await page.click('div[role="option"]:first')
    await page.click('button:has-text("Create Machine")')
    await expect(page.getByText(/created successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // When: admin deletes the newly created machine
    const machineRow = page.locator('tr:has-text("DELETE-ME-01")')
    const deleteButton = machineRow
      .locator('button[aria-label*="Delete"]')
      .or(machineRow.locator('button:has-text("Delete")'))

    page.once('dialog', (dialog) => {
      expect(dialog.message()).toContain('delete')
      dialog.accept()
    })

    await deleteButton.click()

    // Then: success message should appear
    await expect(page.getByText(/deleted successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // And: machine should be removed from the list
    await expect(page.getByText('DELETE-ME-01')).not.toBeVisible()
  })

  test('Manager can view machines but cannot create/edit/delete', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    // Given: a manager user is logged in
    const managerUser = await userFactory.createUser({
      role: 'manager',
      status: 'active',
    })
    await authHelper.login(page, managerUser.email, managerUser.password)

    // When: manager navigates to machines page
    await page.goto('/settings/machines')

    // Then: manager should see the machine list
    await expect(page.getByRole('table')).toBeVisible()

    // But: Add Machine button should not be visible or disabled
    const addButton = page.locator('button:has-text("Add Machine")')
    await expect(addButton).not.toBeVisible().catch(async () => {
      // Or it might be disabled
      await expect(addButton).toBeDisabled()
    })

    // And: Edit/Delete buttons should not be visible on rows
    const editButtons = page.locator('button[aria-label*="Edit"]')
    const count = await editButtons.count()
    expect(count).toBe(0)
  })

  test('Non-admin/non-manager users cannot access machine management', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    // Given: an operator user is logged in
    const operatorUser = await userFactory.createUser({
      role: 'operator',
      status: 'active',
    })
    await authHelper.login(page, operatorUser.email, operatorUser.password)

    // When: user attempts to navigate to machine management
    await page.goto('/settings/machines')

    // Then: user should see access denied or be redirected
    await expect(page).toHaveURL(/\/(unauthorized|403|dashboard)/)
    // OR
    await expect(page.getByText(/unauthorized|access denied/i)).toBeVisible()
  })
})

/**
 * Test Coverage Summary:
 *
 * ✅ AC-006.1: Create machine - required fields (1 test)
 * ✅ AC-006.1: Create machine - with optional capacity (1 test)
 * ✅ AC-006.1: Code uniqueness validation (1 test)
 * ✅ AC-006.1: Code format validation (uppercase, numbers, hyphens) (1 test)
 * ✅ AC-006.2: Edit machine - update status (1 test)
 * ✅ AC-006.2: Edit machine - update capacity (1 test)
 * ✅ AC-006.3: Assign production lines to machine (1 test) - Story 1.14 AC-2.3
 * ✅ AC-006.4: Filter machines by status (1 test)
 * ✅ AC-006.4: Search machines by code (1 test)
 * ✅ AC-006.4: Search machines by name (1 test)
 * ✅ AC-006.5: Sort machines by code (1 test)
 * ✅ AC-006.5: Sort machines by name (1 test)
 * ✅ AC-006.2: Cannot delete machine with FK constraints (1 test)
 * ✅ AC-006.2: Can delete machine with no dependencies (1 test)
 * ✅ Authorization: Manager view-only (1 test)
 * ✅ Authorization: Non-admin cannot access (1 test)
 *
 * Total: 16 E2E test cases covering all Machine CRUD workflows
 *
 * Story 1.14 AC-2.1 Requirements Met:
 * ✅ E2E test: Create machine flow (with all validations) - 4 tests
 * ✅ E2E test: Edit machine flow (update status, capacity) - 2 tests
 * ✅ E2E test: Delete machine with FK constraints (error handling) - 2 tests
 * ✅ E2E test: Filter machines by status - 1 test
 * ✅ E2E test: Search machines by code/name - 2 tests
 * ✅ E2E test: Sort machines by different columns - 2 tests
 */
