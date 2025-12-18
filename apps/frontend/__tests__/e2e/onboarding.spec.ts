/**
 * E2E Tests: Onboarding Wizard
 * Story: 01.3 - Onboarding Wizard Launcher
 * Phase: RED - All tests should FAIL (no implementation yet)
 *
 * Tests critical end-to-end scenarios:
 * - Full wizard flow: launch → complete all steps
 * - Skip wizard flow: launch → skip → demo data created
 * - Resume wizard flow: start → logout → login → resume
 *
 * Coverage Target: 80% (Standard)
 * Test Count: 3 critical scenarios
 *
 * Run with: pnpm test:e2e
 */

import { test, expect } from '@playwright/test'

/**
 * Test helpers
 */
const TEST_USER_EMAIL = 'test-admin@monopilot-e2e.com'
const TEST_USER_PASSWORD = 'Test123!@#'
const TEST_ORG_NAME = 'E2E Test Organization'

/**
 * Helper: Create a new organization for testing
 */
async function createNewOrganization(page: any) {
  // This would use the registration flow
  await page.goto('/auth/register')
  await page.fill('[name="email"]', TEST_USER_EMAIL)
  await page.fill('[name="password"]', TEST_USER_PASSWORD)
  await page.fill('[name="company_name"]', TEST_ORG_NAME)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

/**
 * Helper: Login as existing user
 */
async function login(page: any, email: string, password: string) {
  await page.goto('/auth/login')
  await page.fill('[name="email"]', email)
  await page.fill('[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForLoadState('networkidle')
}

/**
 * Helper: Logout
 */
async function logout(page: any) {
  await page.click('[data-testid="user-menu"]')
  await page.click('text=Logout')
  await page.waitForURL('/auth/login')
}

test.describe('Onboarding Wizard E2E - Story 01.3', () => {
  test.beforeEach(async ({ page }) => {
    // Clean up any existing test data
    // This would call a test API endpoint to reset the database
    await page.request.post('/api/test/cleanup', {
      data: { email: TEST_USER_EMAIL },
    })
  })

  /**
   * Critical Scenario 1: Full wizard flow
   * AC-1, AC-2, AC-8
   */
  test('should complete full onboarding wizard flow', async ({ page }) => {
    // GIVEN new organization registered
    await createNewOrganization(page)

    // THEN wizard launcher appears automatically
    await expect(page.locator('text=Welcome to MonoPilot')).toBeVisible()
    await expect(
      page.locator('text=Quick Onboarding Wizard')
    ).toBeVisible()
    await expect(page.locator('text=Step 1: Organization Profile')).toBeVisible()
    await expect(page.locator('text=Step 2: First Warehouse')).toBeVisible()
    await expect(page.locator('text=Step 3: Storage Locations')).toBeVisible()
    await expect(page.locator('text=Step 4: First Product')).toBeVisible()
    await expect(page.locator('text=Step 5: Demo Work Order')).toBeVisible()
    await expect(page.locator('text=Step 6: Review & Complete')).toBeVisible()

    // WHEN "Start Onboarding Wizard" clicked
    await page.click('button:has-text("Start Onboarding Wizard")')

    // THEN Step 1 appears (Organization Profile)
    await expect(page.locator('text=Step 1 of 6')).toBeVisible()
    await expect(page.locator('text=Organization Profile')).toBeVisible()

    // Fill out Step 1
    await page.fill('[name="company_name"]', TEST_ORG_NAME)
    await page.fill('[name="address"]', '123 Test Street')
    await page.fill('[name="city"]', 'Test City')
    await page.selectOption('[name="country"]', 'US')
    await page.click('button:has-text("Next")')

    // THEN Step 2 appears (First Warehouse)
    await expect(page.locator('text=Step 2 of 6')).toBeVisible()
    await expect(page.locator('text=First Warehouse')).toBeVisible()

    // Fill out Step 2
    await page.fill('[name="warehouse_code"]', 'WH-001')
    await page.fill('[name="warehouse_name"]', 'Main Warehouse')
    await page.click('button:has-text("Next")')

    // THEN Step 3 appears (Storage Locations)
    await expect(page.locator('text=Step 3 of 6')).toBeVisible()
    await expect(page.locator('text=Storage Locations')).toBeVisible()

    // Fill out Step 3
    await page.fill('[name="location_code"]', 'A-001')
    await page.fill('[name="location_name"]', 'Zone A')
    await page.click('button:has-text("Next")')

    // THEN Step 4 appears (First Product)
    await expect(page.locator('text=Step 4 of 6')).toBeVisible()
    await expect(page.locator('text=First Product')).toBeVisible()

    // Fill out Step 4
    await page.fill('[name="product_code"]', 'PROD-001')
    await page.fill('[name="product_name"]', 'Test Product')
    await page.selectOption('[name="uom"]', 'EA')
    await page.click('button:has-text("Next")')

    // THEN Step 5 appears (Demo Work Order)
    await expect(page.locator('text=Step 5 of 6')).toBeVisible()
    await expect(page.locator('text=Demo Work Order')).toBeVisible()

    // Fill out Step 5
    await page.fill('[name="wo_code"]', 'WO-001')
    await page.fill('[name="quantity"]', '100')
    await page.click('button:has-text("Next")')

    // THEN Step 6 appears (Review & Complete)
    await expect(page.locator('text=Step 6 of 6')).toBeVisible()
    await expect(page.locator('text=Review & Complete')).toBeVisible()

    // Review shows all entered data
    await expect(page.locator(`text=${TEST_ORG_NAME}`)).toBeVisible()
    await expect(page.locator('text=WH-001')).toBeVisible()
    await expect(page.locator('text=A-001')).toBeVisible()
    await expect(page.locator('text=PROD-001')).toBeVisible()

    // WHEN "Complete Setup" clicked
    await page.click('button:has-text("Complete Setup")')

    // THEN redirects to dashboard
    await page.waitForURL('/dashboard')
    await expect(
      page.locator('text=Onboarding completed successfully')
    ).toBeVisible()

    // AND wizard does not appear on subsequent visits
    await page.reload()
    await expect(
      page.locator('text=Quick Onboarding Wizard')
    ).not.toBeVisible()
  })

  /**
   * Critical Scenario 2: Skip wizard flow
   * AC-5, AC-6
   */
  test('should skip wizard and create demo data', async ({ page }) => {
    // GIVEN new organization registered
    await createNewOrganization(page)

    // THEN wizard launcher appears
    await expect(page.locator('text=Welcome to MonoPilot')).toBeVisible()

    // WHEN "Skip Onboarding" clicked
    await page.click('button:has-text("Skip Onboarding")')

    // THEN confirmation dialog appears
    await expect(
      page.locator('text=Skip Onboarding Wizard?')
    ).toBeVisible()
    await expect(
      page.locator("text=We'll create a demo warehouse")
    ).toBeVisible()
    await expect(page.locator('button:has-text("Skip Wizard")')).toBeVisible()
    await expect(
      page.locator('button:has-text("Continue Setup")')
    ).toBeVisible()

    // Test cancellation first
    await page.click('button:has-text("Continue Setup")')

    // THEN dialog closes, wizard remains open
    await expect(
      page.locator('text=Skip Onboarding Wizard?')
    ).not.toBeVisible()
    await expect(page.locator('text=Quick Onboarding Wizard')).toBeVisible()

    // Open skip dialog again
    await page.click('button:has-text("Skip Onboarding")')

    // WHEN "Skip Wizard" confirmed
    await page.click('button:has-text("Skip Wizard")')

    // THEN redirects to dashboard with demo data
    await page.waitForURL('/dashboard')
    await expect(
      page.locator('text=Setup skipped - Configure anytime from Settings')
    ).toBeVisible()

    // Verify demo data created by navigating to settings
    await page.goto('/settings/warehouses')
    await expect(page.locator('text=DEMO-WH')).toBeVisible()
    await expect(page.locator('text=Main Warehouse')).toBeVisible()

    await page.goto('/settings/locations')
    await expect(page.locator('text=DEFAULT')).toBeVisible()
    await expect(page.locator('text=Default Location')).toBeVisible()

    await page.goto('/technical/products')
    await expect(page.locator('text=SAMPLE-001')).toBeVisible()
    await expect(page.locator('text=Sample Product')).toBeVisible()

    // AND wizard does not appear again
    await page.goto('/dashboard')
    await expect(
      page.locator('text=Quick Onboarding Wizard')
    ).not.toBeVisible()
  })

  /**
   * Critical Scenario 3: Resume wizard flow
   * AC-2, AC-8
   */
  test('should resume wizard after logout and login', async ({ page }) => {
    // GIVEN new organization registered and wizard started
    await createNewOrganization(page)

    // Start wizard
    await page.click('button:has-text("Start Onboarding Wizard")')
    await expect(page.locator('text=Step 1 of 6')).toBeVisible()

    // Complete Step 1
    await page.fill('[name="company_name"]', TEST_ORG_NAME)
    await page.fill('[name="address"]', '123 Test Street')
    await page.fill('[name="city"]', 'Test City')
    await page.selectOption('[name="country"]', 'US')
    await page.click('button:has-text("Next")')

    // Now at Step 2
    await expect(page.locator('text=Step 2 of 6')).toBeVisible()

    // Complete Step 2
    await page.fill('[name="warehouse_code"]', 'WH-001')
    await page.fill('[name="warehouse_name"]', 'Main Warehouse')
    await page.click('button:has-text("Next")')

    // Now at Step 3
    await expect(page.locator('text=Step 3 of 6')).toBeVisible()

    // WHEN user logs out
    await logout(page)

    // AND user logs back in
    await login(page, TEST_USER_EMAIL, TEST_USER_PASSWORD)

    // THEN wizard resumes at Step 3
    await expect(page.locator('text=Step 3 of 6')).toBeVisible()
    await expect(page.locator('text=Storage Locations')).toBeVisible()

    // AND previous steps show as completed (checkmarks)
    await expect(page.locator('[data-testid="step-complete-1"]')).toBeVisible()
    await expect(page.locator('[data-testid="step-complete-2"]')).toBeVisible()

    // User can navigate back to see previous data
    await page.click('button:has-text("Back")')
    await expect(page.locator('text=Step 2 of 6')).toBeVisible()

    // Previous data is preserved
    await expect(page.locator('[name="warehouse_code"]')).toHaveValue('WH-001')
    await expect(page.locator('[name="warehouse_name"]')).toHaveValue(
      'Main Warehouse'
    )

    // Navigate forward again
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=Step 3 of 6')).toBeVisible()

    // Continue wizard from where left off
    await page.fill('[name="location_code"]', 'A-001')
    await page.fill('[name="location_name"]', 'Zone A')
    await page.click('button:has-text("Next")')

    // Wizard continues normally
    await expect(page.locator('text=Step 4 of 6')).toBeVisible()
  })

  /**
   * Additional Scenario: Non-admin user access
   * AC-4
   */
  test('should show setup message for non-admin users', async ({ page }) => {
    // GIVEN organization with incomplete onboarding
    // AND viewer user (non-admin)
    const VIEWER_EMAIL = 'viewer@monopilot-e2e.com'
    const VIEWER_PASSWORD = 'Test123!@#'

    // Create org with admin
    await createNewOrganization(page)

    // Admin invites viewer (this would be done through UI or API)
    await page.request.post('/api/v1/settings/invitations', {
      data: {
        email: VIEWER_EMAIL,
        role_code: 'viewer',
      },
    })

    // Logout admin
    await logout(page)

    // Viewer accepts invitation and creates account
    // (simplified - would normally check email)
    await page.goto('/auth/register')
    await page.fill('[name="email"]', VIEWER_EMAIL)
    await page.fill('[name="password"]', VIEWER_PASSWORD)
    await page.click('button[type="submit"]')

    // WHEN viewer logs in
    await login(page, VIEWER_EMAIL, VIEWER_PASSWORD)

    // THEN sees "Setup in progress" message, NOT wizard
    await expect(
      page.locator('text=Organization setup in progress')
    ).toBeVisible()
    await expect(
      page.locator('text=Contact your administrator')
    ).toBeVisible()

    // AND cannot access wizard
    await expect(
      page.locator('text=Start Onboarding Wizard')
    ).not.toBeVisible()
    await expect(page.locator('text=Quick Onboarding Wizard')).not.toBeVisible()

    // Logout viewer, login admin, complete onboarding
    await logout(page)
    await login(page, TEST_USER_EMAIL, TEST_USER_PASSWORD)

    // Skip wizard to complete onboarding
    await page.click('button:has-text("Skip Onboarding")')
    await page.click('button:has-text("Skip Wizard")')
    await page.waitForURL('/dashboard')

    // Logout admin, login viewer again
    await logout(page)
    await login(page, VIEWER_EMAIL, VIEWER_PASSWORD)

    // THEN viewer can access dashboard normally
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(
      page.locator('text=Organization setup in progress')
    ).not.toBeVisible()
  })
})

/**
 * Test Summary for Onboarding E2E Tests
 * ======================================
 *
 * Test Coverage:
 * - Full wizard flow (all 6 steps): 1 test
 * - Skip wizard flow (with cancellation): 1 test
 * - Resume wizard after logout/login: 1 test
 * - Non-admin user access: 1 test (bonus)
 * - Total: 4 critical scenarios
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - Complete onboarding flow not implemented
 * - Tests real user interactions end-to-end
 * - Tests database persistence
 * - Tests multi-session behavior
 *
 * Next Steps for DEV Team:
 * 1. Implement full onboarding wizard (all 6 steps)
 * 2. Implement skip functionality with demo data creation
 * 3. Implement progress saving across sessions
 * 4. Implement role-based access control
 * 5. Run E2E tests - should transition from RED to GREEN
 *
 * How to Run:
 * - Single test: pnpm test:e2e onboarding.spec.ts
 * - With UI: pnpm test:e2e:ui onboarding.spec.ts
 * - Debug mode: pnpm test:e2e:debug onboarding.spec.ts
 *
 * Coverage Target: 80%
 */
