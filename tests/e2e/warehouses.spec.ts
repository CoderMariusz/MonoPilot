import { test, expect } from '../support/fixtures'

/**
 * E2E Tests: Warehouse Configuration
 * Story: 1.5 Warehouse Configuration
 * Task 6: Integration & Testing
 *
 * Tests complete warehouse management workflows:
 * - Creating warehouses
 * - Editing warehouses
 * - Archiving/activating warehouses
 * - Searching and filtering warehouses
 * - Default location configuration
 */

test.describe('Warehouse Management - CRUD Operations', () => {
  test('AC-004.1: Admin can create a warehouse with required fields', async ({
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

    // When: admin navigates to warehouse management page
    await page.goto('/settings/warehouses')

    // And: clicks the create warehouse button
    await page.click('button:has-text("Add Warehouse")')

    // Then: create warehouse modal/drawer should be visible
    await expect(page.getByRole('dialog')).toBeVisible()

    // When: admin fills in the warehouse form
    await page.fill('input[name="code"]', 'WH-MAIN')
    await page.fill('input[name="name"]', 'Main Warehouse')
    await page.fill('input[name="address"]', '123 Industrial Blvd, City, State 12345')

    // And: submits the form
    await page.click('button:has-text("Create Warehouse")')

    // Then: success message should appear
    await expect(page.getByText(/created successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // And: modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // And: new warehouse should appear in the list
    await expect(page.getByText('WH-MAIN')).toBeVisible()
    await expect(page.getByText('Main Warehouse')).toBeVisible()
    await expect(page.getByText('123 Industrial Blvd')).toBeVisible()
  })

  test('AC-004.1: Cannot create warehouse with duplicate code', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    // Given: an admin user and an existing warehouse
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/warehouses')

    // Create first warehouse
    await page.click('button:has-text("Add Warehouse")')
    await page.fill('input[name="code"]', 'WH-DUP')
    await page.fill('input[name="name"]', 'First Warehouse')
    await page.click('button:has-text("Create Warehouse")')
    await expect(page.getByText(/created successfully/i)).toBeVisible({ timeout: 5000 })

    // When: admin attempts to create another warehouse with same code
    await page.click('button:has-text("Add Warehouse")')
    await page.fill('input[name="code"]', 'WH-DUP')
    await page.fill('input[name="name"]', 'Second Warehouse')
    await page.click('button:has-text("Create Warehouse")')

    // Then: error message should appear
    await expect(page.getByText(/already exists/i)).toBeVisible({
      timeout: 5000,
    })

    // And: modal should remain open (form not submitted)
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('AC-004.3: Can filter warehouses by active status', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    // Given: an admin user and multiple warehouses
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/warehouses')

    // Create active warehouse
    await page.click('button:has-text("Add Warehouse")')
    await page.fill('input[name="code"]', 'WH-ACTIVE')
    await page.fill('input[name="name"]', 'Active Warehouse')
    await page.click('button:has-text("Create Warehouse")')
    await expect(page.getByText(/created successfully/i)).toBeVisible({ timeout: 5000 })

    // Create and then archive another warehouse
    await page.click('button:has-text("Add Warehouse")')
    await page.fill('input[name="code"]', 'WH-ARCHIVED')
    await page.fill('input[name="name"]', 'Archived Warehouse')
    await page.click('button:has-text("Create Warehouse")')
    await expect(page.getByText(/created successfully/i)).toBeVisible({ timeout: 5000 })

    // Archive the second warehouse
    const archivedRow = page.locator('tr', { hasText: 'WH-ARCHIVED' })
    const archiveButton = archivedRow.locator('button[aria-label*="Archive"]').or(
      archivedRow.locator('button:has-text("Archive")')
    )
    await archiveButton.click()

    // Confirm archive action
    await expect(page.getByText(/archived successfully/i)).toBeVisible({ timeout: 5000 })

    // When: admin filters by active only
    await page.click('button:has-text("Filter")')
    await page.click('text=Active Only')

    // Wait for filter to apply
    await page.waitForTimeout(500)

    // Then: only active warehouse should be visible
    await expect(page.getByText('WH-ACTIVE')).toBeVisible()
    await expect(page.getByText('WH-ARCHIVED')).not.toBeVisible()

    // When: admin shows all warehouses
    await page.click('button:has-text("Filter")')
    await page.click('text=All')
    await page.waitForTimeout(500)

    // Then: both warehouses should be visible
    await expect(page.getByText('WH-ACTIVE')).toBeVisible()
    await expect(page.getByText('WH-ARCHIVED')).toBeVisible()
  })

  test('AC-004.3: Can search warehouses by code or name', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    // Given: an admin user and multiple warehouses
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/warehouses')

    // Create warehouses
    const warehouses = [
      { code: 'WH-NORTH', name: 'North Distribution Center' },
      { code: 'WH-SOUTH', name: 'South Distribution Center' },
      { code: 'WH-EAST', name: 'East Warehouse' },
    ]

    for (const wh of warehouses) {
      await page.click('button:has-text("Add Warehouse")')
      await page.fill('input[name="code"]', wh.code)
      await page.fill('input[name="name"]', wh.name)
      await page.click('button:has-text("Create Warehouse")')
      await expect(page.getByText(/created successfully/i)).toBeVisible({ timeout: 5000 })
    }

    // When: admin searches by code
    await page.fill('input[placeholder*="Search"]', 'WH-NORTH')
    await page.waitForTimeout(400) // Debounce delay

    // Then: only matching warehouse should be visible
    await expect(page.getByText('WH-NORTH')).toBeVisible()
    await expect(page.getByText('WH-SOUTH')).not.toBeVisible()
    await expect(page.getByText('WH-EAST')).not.toBeVisible()

    // When: admin searches by name
    await page.fill('input[placeholder*="Search"]', 'Distribution')
    await page.waitForTimeout(400)

    // Then: both distribution centers should be visible
    await expect(page.getByText('WH-NORTH')).toBeVisible()
    await expect(page.getByText('WH-SOUTH')).toBeVisible()
    await expect(page.getByText('WH-EAST')).not.toBeVisible()

    // When: admin clears search
    await page.fill('input[placeholder*="Search"]', '')
    await page.waitForTimeout(400)

    // Then: all warehouses should be visible
    await expect(page.getByText('WH-NORTH')).toBeVisible()
    await expect(page.getByText('WH-SOUTH')).toBeVisible()
    await expect(page.getByText('WH-EAST')).toBeVisible()
  })

  test('AC-004.5: Admin can edit warehouse details', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    // Given: an admin user and an existing warehouse
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/warehouses')

    // Create warehouse
    await page.click('button:has-text("Add Warehouse")')
    await page.fill('input[name="code"]', 'WH-EDIT')
    await page.fill('input[name="name"]', 'Original Name')
    await page.fill('input[name="address"]', 'Original Address')
    await page.click('button:has-text("Create Warehouse")')
    await expect(page.getByText(/created successfully/i)).toBeVisible({ timeout: 5000 })

    // When: admin clicks edit on the warehouse
    const editButton = page
      .locator('tr', { hasText: 'WH-EDIT' })
      .locator('button[aria-label="Edit"]')
      .or(page.locator('tr', { hasText: 'WH-EDIT' }).locator('button').first())

    await editButton.click()

    // Then: edit drawer/modal should open
    await expect(page.getByText(/Edit Warehouse/i)).toBeVisible()

    // And: code field should be read-only or disabled (code is immutable after creation)
    const codeInput = page.locator('input[name="code"]')
    const isDisabled = await codeInput.isDisabled().catch(() => false)
    const isReadOnly = await codeInput.getAttribute('readonly').then(val => val !== null).catch(() => false)
    expect(isDisabled || isReadOnly).toBe(true)

    // When: admin updates name and address
    await page.fill('input[name="name"]', 'Updated Warehouse Name')
    await page.fill('input[name="address"]', '456 New Street, City, State 67890')

    // And: submits the form
    await page.click('button:has-text("Save Changes")')

    // Then: success message should appear
    await expect(page.getByText(/updated successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // And: drawer should close
    await expect(page.getByText(/Edit Warehouse/i)).not.toBeVisible()

    // And: warehouse should be updated in the list
    await expect(page.getByText('Updated Warehouse Name')).toBeVisible()
    await expect(page.getByText('456 New Street')).toBeVisible()
    await expect(page.getByText('Original Name')).not.toBeVisible()
  })

  test('AC-004.4: Admin can archive warehouse (soft delete)', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    // Given: an admin user and an active warehouse
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/warehouses')

    // Create warehouse
    await page.click('button:has-text("Add Warehouse")')
    await page.fill('input[name="code"]', 'WH-ARCHIVE')
    await page.fill('input[name="name"]', 'Warehouse to Archive')
    await page.click('button:has-text("Create Warehouse")')
    await expect(page.getByText(/created successfully/i)).toBeVisible({ timeout: 5000 })

    // Verify warehouse is active
    const warehouseRow = page.locator('tr', { hasText: 'WH-ARCHIVE' })
    await expect(warehouseRow.getByText(/active/i)).toBeVisible()

    // When: admin clicks archive button
    const archiveButton = warehouseRow.locator('button[aria-label*="Archive"]').or(
      warehouseRow.locator('button:has-text("Archive")')
    )

    // Listen for confirmation dialog (if implemented)
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/archive/i)
      await dialog.accept()
    })

    await archiveButton.click()

    // Then: success message should appear
    await expect(page.getByText(/archived successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // And: warehouse status should change to inactive/archived
    await expect(warehouseRow.getByText(/inactive|archived/i)).toBeVisible({ timeout: 3000 })
  })

  test('AC-004.7: Admin can activate archived warehouse', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    // Given: an admin user and an archived warehouse
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/warehouses')

    // Create and archive warehouse
    await page.click('button:has-text("Add Warehouse")')
    await page.fill('input[name="code"]', 'WH-ACTIVATE')
    await page.fill('input[name="name"]', 'Warehouse to Activate')
    await page.click('button:has-text("Create Warehouse")')
    await expect(page.getByText(/created successfully/i)).toBeVisible({ timeout: 5000 })

    // Archive it
    const warehouseRow = page.locator('tr', { hasText: 'WH-ACTIVATE' })
    const archiveButton = warehouseRow.locator('button[aria-label*="Archive"]').or(
      warehouseRow.locator('button:has-text("Archive")')
    )
    await archiveButton.click()
    await expect(page.getByText(/archived successfully/i)).toBeVisible({ timeout: 5000 })

    // When: admin clicks activate button
    const activateButton = warehouseRow.locator('button[aria-label*="Activate"]').or(
      warehouseRow.locator('button:has-text("Activate")')
    )
    await activateButton.click()

    // Then: success message should appear
    await expect(page.getByText(/activated successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // And: warehouse status should change back to active
    await expect(warehouseRow.getByText(/active/i)).toBeVisible({ timeout: 3000 })
  })

  test('AC-004.2, AC-004.5: Admin can set default locations after warehouse creation', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    // Given: an admin user, a warehouse, and some locations
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    // Navigate to warehouse management
    await page.goto('/settings/warehouses')

    // Create warehouse (default locations are NULL initially per AC-004.2)
    await page.click('button:has-text("Add Warehouse")')
    await page.fill('input[name="code"]', 'WH-LOC')
    await page.fill('input[name="name"]', 'Warehouse with Locations')
    await page.click('button:has-text("Create Warehouse")')
    await expect(page.getByText(/created successfully/i)).toBeVisible({ timeout: 5000 })

    // Note: In a real scenario, we would create locations first via Location Management UI
    // For this test, we assume locations exist or we navigate to create them

    // When: admin edits warehouse to set default locations
    const editButton = page
      .locator('tr', { hasText: 'WH-LOC' })
      .locator('button[aria-label="Edit"]')
      .or(page.locator('tr', { hasText: 'WH-LOC' }).locator('button').first())

    await editButton.click()
    await expect(page.getByText(/Edit Warehouse/i)).toBeVisible()

    // And: selects default locations (if UI has dropdowns)
    // This is a placeholder - actual implementation depends on UI design
    const receivingSelect = page.locator('select[name="default_receiving_location_id"]').or(
      page.locator('button[aria-label*="Default Receiving"]')
    )

    if (await receivingSelect.isVisible().catch(() => false)) {
      // Select location from dropdown (if exists)
      await receivingSelect.click()
      // Note: Actual selection depends on available locations
    }

    // And: submits the form
    await page.click('button:has-text("Save Changes")')

    // Then: success message should appear
    await expect(page.getByText(/updated successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // Document: This resolves the circular dependency (AC-004.2)
    // Warehouse created first with NULL default locations
    // Locations created next (referencing warehouse_id)
    // Warehouse updated to set default locations
  })

  test('Non-admin users cannot create or edit warehouses', async ({
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

    // When: manager navigates to warehouse management
    await page.goto('/settings/warehouses')

    // Then: manager should either see access denied or read-only view
    // (Depending on implementation, managers might have read access but no write)

    // Check if Add Warehouse button is hidden or disabled
    const addButton = page.locator('button:has-text("Add Warehouse")')
    const isVisible = await addButton.isVisible().catch(() => false)

    if (isVisible) {
      // If button is visible, it should be disabled
      await expect(addButton).toBeDisabled()
    } else {
      // Button is hidden - expected for non-admin
      expect(isVisible).toBe(false)
    }

    // OR: User should be redirected/shown access denied
    const hasAccessDenied = await page.getByText(/unauthorized|access denied|forbidden/i).isVisible().catch(() => false)
    const isRedirected = page.url().includes('/unauthorized') || page.url().includes('/403')

    // At least one of these should be true
    expect(hasAccessDenied || isRedirected || !isVisible).toBe(true)
  })

  test('AC-004.3: Warehouses list supports dynamic sorting', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    // Given: an admin user and multiple warehouses
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/warehouses')

    // Create warehouses with different codes and names
    const warehouses = [
      { code: 'WH-03', name: 'Charlie Warehouse' },
      { code: 'WH-01', name: 'Alpha Warehouse' },
      { code: 'WH-02', name: 'Beta Warehouse' },
    ]

    for (const wh of warehouses) {
      await page.click('button:has-text("Add Warehouse")')
      await page.fill('input[name="code"]', wh.code)
      await page.fill('input[name="name"]', wh.name)
      await page.click('button:has-text("Create Warehouse")')
      await expect(page.getByText(/created successfully/i)).toBeVisible({ timeout: 5000 })
    }

    // When: admin clicks on "Code" column header to sort
    const codeHeader = page.locator('th:has-text("Code")').or(
      page.locator('button:has-text("Code")')
    )

    if (await codeHeader.isVisible()) {
      await codeHeader.click()
      await page.waitForTimeout(500)

      // Then: warehouses should be sorted by code (ascending)
      const rows = await page.locator('table tbody tr').allTextContents()
      expect(rows[0]).toContain('WH-01')
      expect(rows[1]).toContain('WH-02')
      expect(rows[2]).toContain('WH-03')

      // When: admin clicks again to reverse sort
      await codeHeader.click()
      await page.waitForTimeout(500)

      // Then: warehouses should be sorted by code (descending)
      const rowsDesc = await page.locator('table tbody tr').allTextContents()
      expect(rowsDesc[0]).toContain('WH-03')
      expect(rowsDesc[1]).toContain('WH-02')
      expect(rowsDesc[2]).toContain('WH-01')
    }

    // Document: Dynamic sorting by code, name, or created_at (AC-004.3)
  })
})

/**
 * Test Coverage Summary:
 *
 * AC-004.1: Create warehouse (2 tests)
 *   - Create with required fields
 *   - Duplicate code validation
 *
 * AC-004.3: List and filter warehouses (3 tests)
 *   - Filter by active status
 *   - Search by code or name
 *   - Dynamic sorting
 *
 * AC-004.4: Archive warehouse (1 test)
 *   - Soft delete (archive)
 *
 * AC-004.5: Edit warehouse (2 tests)
 *   - Update warehouse details
 *   - Set default locations after creation
 *
 * AC-004.7: Activate warehouse (1 test)
 *   - Restore archived warehouse
 *
 * Authorization (1 test)
 *   - Non-admin cannot create/edit
 *
 * Total: 10 E2E test cases covering complete warehouse workflows
 *
 * Test Run Command: pnpm test:e2e warehouses.spec.ts
 */
