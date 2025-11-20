import { test, expect } from '../support/fixtures';

/**
 * Example Test Suite
 *
 * Demonstrates best practices:
 * - Using fixtures for data factories
 * - Proper selector strategy (data-testid)
 * - Given-When-Then structure
 * - Automatic cleanup after tests
 */

test.describe('Example Test Suite', () => {
  test('should load homepage', async ({ page }) => {
    // Given: user navigates to homepage
    await page.goto('/');

    // Then: page title should be visible
    await expect(page).toHaveTitle(/MonoPilot|MES|Home/i);
  });

  test('should create user and login', async ({ page, userFactory, authHelper }) => {
    // Given: a test user is created
    const user = await userFactory.createUser({
      role: 'operator',
    });

    // When: user attempts to login
    await authHelper.login(page, user.email, user.password);

    // Then: user should be logged in and see dashboard
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page).toHaveURL(/\/(dashboard|home)/);
  });

  test('should demonstrate data factory with multiple users', async ({ userFactory }) => {
    // Given: multiple test users are created
    const users = await userFactory.createUsers(3);

    // Then: all users should have unique emails
    const emails = users.map(u => u.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(3);

    // Auto-cleanup: userFactory.cleanup() called automatically after test
  });

  test('should handle authentication flow', async ({ page, userFactory, authHelper }) => {
    // Given: a test user exists
    const user = await userFactory.createUser();

    // When: user logs in
    await authHelper.login(page, user.email, user.password);

    // Then: authentication token should be set
    const token = await authHelper.getAuthToken(page);
    expect(token).toBeTruthy();

    // When: user logs out
    await authHelper.logout(page);

    // Then: user should be redirected to login page
    await expect(page).toHaveURL('/login');
    expect(await authHelper.isLoggedIn(page)).toBe(false);
  });
});

/**
 * Best Practices Demonstrated:
 *
 * 1. Selector Strategy: Use data-testid attributes
 *    ❌ Bad: page.click('.btn-primary')
 *    ✅ Good: page.click('[data-testid="login-button"]')
 *
 * 2. Test Isolation: Each test is independent
 *    - Factories create fresh data per test
 *    - Cleanup happens automatically via fixtures
 *
 * 3. Given-When-Then: Clear test structure
 *    - Given: Setup preconditions
 *    - When: Execute the action
 *    - Then: Assert the outcome
 *
 * 4. No Hard Waits: Use deterministic waiting
 *    ❌ Bad: await page.waitForTimeout(5000)
 *    ✅ Good: await expect(element).toBeVisible()
 *
 * 5. Network-First: Intercept before navigate (if mocking)
 *    await page.route('** /api/users', route => route.fulfill(...))
 *    await page.goto('/dashboard')
 */
