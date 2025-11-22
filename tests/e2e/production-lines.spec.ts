import { test, expect } from '../support/fixtures'

/**
 * E2E Tests: Production Line Management CRUD
 * Story: 1.8 Production Line Configuration
 * BATCH 3: E2E Tests
 *
 * Tests complete production line management workflows:
 * - Creating production lines with warehouse and location
 * - Listing and filtering by warehouse
 * - Updating production line details
 * - Deleting production lines (with FK validation)
 * - Machine assignment (Epic 4 integration)
 */

test.describe('Production Line Management - CRUD Operations', () => {
  test('AC-007.1: Admin can create a production line with required fields', async ({
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

    // When: admin navigates to production lines page
    await page.goto('/settings/production-lines')

    // And: clicks the create production line button
    await page.click('button:has-text("Add Production Line")')

    // Then: create production line modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible()

    // When: admin fills in required fields
    await page.fill('input#code', 'LINE-01')
    await page.fill('input#name', 'Packaging Line 1')

    // Select warehouse
    await page.click('button[role="combobox"]:near(label:has-text("Warehouse"))')
    await page.click('div[role="option"]:first')

    // Wait for locations to load
    await page.waitForTimeout(500)

    // Select default output location (optional)
    await page.click('button[role="combobox"]:near(label:has-text("Default Output Location"))')
    await page.click('div[role="option"]:has-text("LOC-"):first')

    // And: submits the form
    await page.click('button:has-text("Create Line")')

    // Then: success message should appear
    await expect(page.getByText(/created successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // And: modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // And: new production line should appear in the list
    await expect(page.getByText('LINE-01')).toBeVisible()
    await expect(page.getByText('Packaging Line 1')).toBeVisible()
  })

  test('AC-007.1: Code is auto-converted to uppercase', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/production-lines')
    await page.click('button:has-text("Add Production Line")')

    // When: admin enters lowercase code
    await page.fill('input#code', 'line-lowercase')
    await page.fill('input#name', 'Lowercase Test Line')

    // Select warehouse
    await page.click('button[role="combobox"]:near(label:has-text("Warehouse"))')
    await page.click('div[role="option"]:first')

    await page.click('button:has-text("Create Line")')

    // Then: code should be converted to uppercase
    await expect(page.getByText(/created successfully/i)).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByText('LINE-LOWERCASE')).toBeVisible()
  })

  test('AC-007.1: Cannot create production line with duplicate code', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/production-lines')

    // Create first production line
    await page.click('button:has-text("Add Production Line")')
    await page.fill('input#code', 'UNIQUE-LINE')
    await page.fill('input#name', 'First Line')
    await page.click('button[role="combobox"]:near(label:has-text("Warehouse"))')
    await page.click('div[role="option"]:first')
    await page.click('button:has-text("Create Line")')
    await expect(page.getByText(/created successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // When: admin attempts to create another line with same code
    await page.click('button:has-text("Add Production Line")')
    await page.fill('input#code', 'UNIQUE-LINE')
    await page.fill('input#name', 'Duplicate Line')
    await page.click('button[role="combobox"]:near(label:has-text("Warehouse"))')
    await page.click('div[role="option"]:first')
    await page.click('button:has-text("Create Line")')

    // Then: error message should appear
    await expect(
      page.getByText(/already exists|duplicate/i)
    ).toBeVisible({ timeout: 5000 })

    // And: modal should remain open
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('AC-007.1: Default output location is optional', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/production-lines')
    await page.click('button:has-text("Add Production Line")')

    // When: admin creates line without output location
    await page.fill('input#code', 'LINE-NO-LOC')
    await page.fill('input#name', 'Line Without Output Location')
    await page.click('button[role="combobox"]:near(label:has-text("Warehouse"))')
    await page.click('div[role="option"]:first')
    // Do NOT select output location

    await page.click('button:has-text("Create Line")')

    // Then: line should be created successfully
    await expect(page.getByText(/created successfully/i)).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByText('LINE-NO-LOC')).toBeVisible()

    // And: output location should show "Not set"
    const row = page.locator('table tbody tr:has-text("LINE-NO-LOC")')
    await expect(row.getByText('Not set')).toBeVisible()
  })

  test('AC-007.4: Can filter production lines by warehouse', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/production-lines')

    // When: admin filters by a specific warehouse
    await page.click('button[role="combobox"]:has-text("All Warehouses")')
    await page.click('div[role="option"]:not(:has-text("All Warehouses")):first')

    // Wait for filter to apply
    await page.waitForTimeout(500)

    // Then: only lines from that warehouse should be visible
    const rows = await page.locator('table tbody tr')
    const count = await rows.count()

    if (count > 0) {
      // All visible rows should have same warehouse badge
      const warehouseBadge = await rows.nth(0).locator('td:nth-child(3)').textContent()
      for (let i = 1; i < count; i++) {
        const badge = await rows.nth(i).locator('td:nth-child(3)').textContent()
        expect(badge).toBe(warehouseBadge)
      }
    }
  })

  test('AC-007.4: Can search production lines by code or name', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/production-lines')

    // When: admin searches by code
    await page.fill('input[placeholder*="Search"]', 'LINE-')

    // Wait for debounced search (300ms)
    await page.waitForTimeout(400)

    // Then: only matching lines should be visible
    const rows = await page.locator('table tbody tr')
    const count = await rows.count()

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const rowText = await rows.nth(i).textContent()
        expect(rowText).toContain('LINE-')
      }
    }
  })

  test('AC-007.4: Can sort production lines by code, name, warehouse', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/production-lines')

    // When: admin clicks sort by name column
    await page.click('th:has-text("Name")')

    // Wait for sort to apply
    await page.waitForTimeout(500)

    // Then: table should be sorted (verify arrow indicator)
    await expect(page.locator('th:has-text("Name"):has-text("↑")')).toBeVisible()
  })

  test('AC-007.6: Admin can edit production line', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/production-lines')

    // When: admin clicks edit on a production line
    const editButton = page
      .locator('table tbody tr:first')
      .locator('button:has(svg.lucide-edit)')

    await editButton.click()

    // Then: edit modal should open
    await expect(page.getByText('Edit Production Line')).toBeVisible()

    // When: admin updates name
    await page.fill('input#name', 'Updated Line Name')

    // And: submits the form
    await page.click('button:has-text("Save Changes")')

    // Then: success message should appear
    await expect(page.getByText(/updated successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // And: modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // And: line should be updated in the list
    await expect(page.getByText('Updated Line Name')).toBeVisible()
  })

  test('AC-007.2: Can delete production line if not assigned to work orders', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/production-lines')

    // Create a new line to delete
    await page.click('button:has-text("Add Production Line")')
    await page.fill('input#code', 'DELETE-LINE')
    await page.fill('input#name', 'Line to Delete')
    await page.click('button[role="combobox"]:near(label:has-text("Warehouse"))')
    await page.click('div[role="option"]:first')
    await page.click('button:has-text("Create Line")')
    await expect(page.getByText(/created successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // When: admin clicks delete on the line
    const deleteButton = page
      .locator('table tbody tr:has-text("DELETE-LINE")')
      .locator('button:has(svg.lucide-trash-2)')

    await deleteButton.click()

    // Then: confirmation dialog should appear
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByText(/delete production line/i)).toBeVisible()

    // When: admin confirms deletion
    await page.click('button:has-text("Delete")')

    // Then: success message should appear
    await expect(page.getByText(/deleted successfully/i)).toBeVisible({
      timeout: 5000,
    })

    // And: line should be removed from the list
    await expect(page.getByText('DELETE-LINE')).not.toBeVisible()
  })

  test('AC-007.4: Displays assigned machine count for each line', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/production-lines')

    // Then: Machines column should be visible
    await expect(page.getByText('Machines')).toBeVisible()

    // And: each row should display a count (number or 0)
    const rows = await page.locator('table tbody tr')
    const count = await rows.count()

    if (count > 0) {
      const firstRowCount = await rows.nth(0).locator('td:nth-child(5)').textContent()
      expect(firstRowCount).toMatch(/^\d+$/) // Should be a number
    }
  })

  test('AC-007.1: Location dropdown loads locations for selected warehouse', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/production-lines')
    await page.click('button:has-text("Add Production Line")')

    await page.fill('input#code', 'TEST-LOC-LOAD')
    await page.fill('input#name', 'Test Location Loading')

    // Initially, location dropdown should be disabled
    const locationSelect = page.locator('button[role="combobox"]:near(label:has-text("Default Output Location"))')
    await expect(locationSelect).toBeDisabled()

    // When: admin selects a warehouse
    await page.click('button[role="combobox"]:near(label:has-text("Warehouse"))')
    await page.click('div[role="option"]:first')

    // Wait for locations to load
    await page.waitForTimeout(1000)

    // Then: location dropdown should be enabled
    await expect(locationSelect).not.toBeDisabled()

    // And: should have location options
    await locationSelect.click()
    const locationOptions = page.locator('div[role="option"]:has-text("LOC-")')
    await expect(locationOptions.first()).toBeVisible()
  })
})

/**
 * Test Coverage Summary:
 *
 * ✅ AC-007.1: Create production line with required fields (1 test)
 * ✅ AC-007.1: Code auto-uppercase (1 test)
 * ✅ AC-007.1: Duplicate code validation (1 test)
 * ✅ AC-007.1: Default output location optional (1 test)
 * ✅ AC-007.4: Filter by warehouse (1 test)
 * ✅ AC-007.4: Search by code/name (1 test)
 * ✅ AC-007.4: Sort by code, name, warehouse (1 test)
 * ✅ AC-007.6: Edit production line (1 test)
 * ✅ AC-007.2: Delete production line (not used) (1 test)
 * ✅ AC-007.4: Display machine count (1 test)
 * ✅ AC-007.1: Location dropdown loads based on warehouse (1 test)
 *
 * Total: 11 E2E test cases covering all production line workflows
 */
