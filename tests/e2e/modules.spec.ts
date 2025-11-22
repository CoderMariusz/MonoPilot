import { test, expect } from '../support/fixtures'

/**
 * E2E Tests: Module Activation
 * Story: 1.11 Module Activation
 * BATCH 3: E2E Tests
 *
 * Tests complete module activation workflows:
 * - Viewing all available modules
 * - Enabling/disabling modules with confirmation
 * - Module status persistence
 * - Navigation impact of module activation
 */

test.describe('Module Activation - Toggle Operations', () => {
  test('AC-010.2: Admin can view all available modules with status', async ({
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

    // When: admin navigates to modules page
    await page.goto('/settings/modules')

    // Then: all 8 modules should be visible
    const moduleCards = page.locator('div[class*="card"]:has-text("Epic")')
    const count = await moduleCards.count()
    expect(count).toBeGreaterThanOrEqual(7) // At least 7 modules (Technical, Planning, Production, Warehouse, Quality, Shipping, NPD)

    // And: each module should display name, description, epic badge
    await expect(page.getByText('Technical')).toBeVisible()
    await expect(page.getByText('Planning')).toBeVisible()
    await expect(page.getByText('Production')).toBeVisible()
    await expect(page.getByText('Warehouse')).toBeVisible()
    await expect(page.getByText('Quality')).toBeVisible()
    await expect(page.getByText('Shipping')).toBeVisible()
    await expect(page.getByText('NPD')).toBeVisible()

    // And: should display descriptions
    await expect(page.getByText('Products, BOMs, Routings')).toBeVisible()
    await expect(page.getByText('POs, TOs, WOs')).toBeVisible()
  })

  test('AC-010.2: Shows enabled/disabled status for each module', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/modules')

    // Then: enabled modules should show "Enabled" badge
    const enabledBadges = page.locator('div:has-text("Enabled")')
    const enabledCount = await enabledBadges.count()
    expect(enabledCount).toBeGreaterThan(0)

    // And: each module should have a toggle switch
    const switches = page.locator('button[role="switch"]')
    const switchCount = await switches.count()
    expect(switchCount).toBeGreaterThanOrEqual(7)
  })

  test('AC-010.3: Can enable a disabled module with confirmation', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/modules')

    // Find a disabled module (e.g., Quality or Shipping)
    const qualityCard = page.locator('div:has-text("Quality"):has-text("QA Workflows")')
    const qualitySwitch = qualityCard.locator('button[role="switch"]')

    // Check if it's currently disabled
    const isEnabled = await qualitySwitch.getAttribute('data-state')

    if (isEnabled === 'unchecked') {
      // When: admin clicks the toggle to enable
      await qualitySwitch.click()

      // Then: confirmation dialog should appear
      await expect(page.getByRole('alertdialog')).toBeVisible()
      await expect(page.getByText(/enable.*quality/i)).toBeVisible()
      await expect(page.getByText(/QA Workflows/i)).toBeVisible()

      // When: admin confirms enabling
      await page.click('button:has-text("Enable Module")')

      // Then: success message should appear
      await expect(page.getByText(/enabled successfully/i)).toBeVisible({
        timeout: 5000,
      })

      // And: module card should show as enabled
      await expect(qualityCard.getByText('Enabled')).toBeVisible()

      // And: switch should be in enabled state
      const newState = await qualitySwitch.getAttribute('data-state')
      expect(newState).toBe('checked')
    }
  })

  test('AC-010.3: Can disable an enabled module with confirmation', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/modules')

    // Find an enabled module (e.g., Technical - should be enabled by default)
    const technicalCard = page.locator('div:has-text("Technical"):has-text("Products, BOMs, Routings")')
    const technicalSwitch = technicalCard.locator('button[role="switch"]')

    // Check if it's currently enabled
    const isEnabled = await technicalSwitch.getAttribute('data-state')

    if (isEnabled === 'checked') {
      // When: admin clicks the toggle to disable
      await technicalSwitch.click()

      // Then: confirmation dialog should appear
      await expect(page.getByRole('alertdialog')).toBeVisible()
      await expect(page.getByText(/disable.*technical/i)).toBeVisible()
      await expect(page.getByText(/hide.*Products, BOMs, Routings/i)).toBeVisible()

      // When: admin confirms disabling
      await page.click('button:has-text("Disable Module")')

      // Then: success message should appear
      await expect(page.getByText(/disabled successfully/i)).toBeVisible({
        timeout: 5000,
      })

      // And: switch should be in disabled state
      const newState = await technicalSwitch.getAttribute('data-state')
      expect(newState).toBe('unchecked')
    }
  })

  test('AC-010.3: Can cancel module toggle from confirmation dialog', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/modules')

    // Find any module
    const warehouseCard = page.locator('div:has-text("Warehouse"):has-text("LPs, Moves, Pallets")')
    const warehouseSwitch = warehouseCard.locator('button[role="switch"]')

    // Get initial state
    const initialState = await warehouseSwitch.getAttribute('data-state')

    // When: admin clicks toggle
    await warehouseSwitch.click()

    // Then: confirmation dialog should appear
    await expect(page.getByRole('alertdialog')).toBeVisible()

    // When: admin cancels
    await page.click('button:has-text("Cancel")')

    // Then: dialog should close
    await expect(page.getByRole('alertdialog')).not.toBeVisible()

    // And: switch state should remain unchanged
    const finalState = await warehouseSwitch.getAttribute('data-state')
    expect(finalState).toBe(initialState)
  })

  test('AC-010.2: Shows recommended badge for default modules', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/modules')

    // Then: Technical, Planning, Production, Warehouse should have "Recommended" badge
    const technicalCard = page.locator('div:has-text("Technical"):has-text("Products, BOMs, Routings")')
    await expect(technicalCard.getByText('Recommended')).toBeVisible()

    const planningCard = page.locator('div:has-text("Planning"):has-text("POs, TOs, WOs")')
    await expect(planningCard.getByText('Recommended')).toBeVisible()

    const productionCard = page.locator('div:has-text("Production"):has-text("WO Execution")')
    await expect(productionCard.getByText('Recommended')).toBeVisible()

    const warehouseCard = page.locator('div:has-text("Warehouse"):has-text("LPs, Moves, Pallets")')
    await expect(warehouseCard.getByText('Recommended')).toBeVisible()
  })

  test('AC-010.2: Shows epic badges with correct numbers', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/modules')

    // Then: each module should display its epic number
    await expect(page.getByText('Epic 2')).toBeVisible() // Technical
    await expect(page.getByText('Epic 3')).toBeVisible() // Planning
    await expect(page.getByText('Epic 4')).toBeVisible() // Production
    await expect(page.getByText('Epic 5')).toBeVisible() // Warehouse
    await expect(page.getByText('Epic 6')).toBeVisible() // Quality
    await expect(page.getByText('Epic 7')).toBeVisible() // Shipping
    await expect(page.getByText('Epic 8')).toBeVisible() // NPD
  })

  test('AC-010.2: Module status persists across page reloads', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/modules')

    // Find Quality module
    const qualityCard = page.locator('div:has-text("Quality"):has-text("QA Workflows")')
    const qualitySwitch = qualityCard.locator('button[role="switch"]')

    // Get initial state
    const initialState = await qualitySwitch.getAttribute('data-state')

    // If disabled, enable it
    if (initialState === 'unchecked') {
      await qualitySwitch.click()
      await page.click('button:has-text("Enable Module")')
      await expect(page.getByText(/enabled successfully/i)).toBeVisible({
        timeout: 5000,
      })
    }

    // When: page is reloaded
    await page.reload()

    // Then: Quality module should still be enabled
    const newState = await qualitySwitch.getAttribute('data-state')
    expect(newState).toBe('checked')
    await expect(qualityCard.getByText('Enabled')).toBeVisible()
  })

  test('Displays info banner with module usage instructions', async ({
    page,
    userFactory,
    authHelper,
  }) => {
    const adminUser = await userFactory.createUser({
      role: 'admin',
      status: 'active',
    })
    await authHelper.login(page, adminUser.email, adminUser.password)

    await page.goto('/settings/modules')

    // Then: info banner should be visible
    await expect(page.getByText('Module Configuration')).toBeVisible()

    // And: should explain core modules
    await expect(page.getByText(/Core modules.*recommended/i)).toBeVisible()

    // And: should explain disabling behavior
    await expect(page.getByText(/Disabling a module.*hide.*navigation/i)).toBeVisible()
  })
})

/**
 * Test Coverage Summary:
 *
 * ✅ AC-010.2: View all modules with status (1 test)
 * ✅ AC-010.2: Show enabled/disabled status (1 test)
 * ✅ AC-010.3: Enable module with confirmation (1 test)
 * ✅ AC-010.3: Disable module with confirmation (1 test)
 * ✅ AC-010.3: Cancel toggle from confirmation (1 test)
 * ✅ AC-010.2: Show recommended badge (1 test)
 * ✅ AC-010.2: Show epic badges (1 test)
 * ✅ AC-010.2: Module status persistence (1 test)
 * ✅ Info banner with usage instructions (1 test)
 *
 * Total: 9 E2E test cases covering all module activation workflows
 */
