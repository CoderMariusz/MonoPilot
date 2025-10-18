import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Authentication - Auth State', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should maintain session across page reloads', async ({ page }) => {
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    
    // Verify logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Reload page
    await page.reload();
    
    // Verify still logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    
    // Click user menu
    await page.click('[data-testid="user-menu"]');
    
    // Click logout
    await page.click('[data-testid="logout-button"]');
    
    // Verify redirect to login
    await expect(page).toHaveURL(/.*\/login/);
    
    // Verify logged out state
    await expect(page.locator('[data-testid="user-menu"]')).toBeHidden();
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access protected route without login
    await page.goto('/technical/bom');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access various protected routes
    const protectedRoutes = [
      '/technical/bom',
      '/planning',
      '/production',
      '/warehouse',
      '/scanner',
      '/settings',
      '/admin'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*\/login/);
    }
  });

  test('should allow access to public routes without login', async ({ page }) => {
    // Public routes should be accessible
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    
    await page.goto('/signup');
    await expect(page).toHaveURL('/signup');
  });

  test('should redirect to home after login', async ({ page }) => {
    await page.goto('/login');
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
  });

  test('should maintain user session across browser tabs', async ({ context }) => {
    // Login in first tab
    const page1 = await context.newPage();
    const helpers1 = new TestHelpers(page1);
    await helpers1.login(testUsers.admin.email, testUsers.admin.password);
    
    // Open second tab
    const page2 = await context.newPage();
    
    // Navigate to protected route in second tab
    await page2.goto('/technical/bom');
    
    // Should be logged in (no redirect to login)
    await expect(page2).toHaveURL('/technical/bom');
    
    // Cleanup
    await page1.close();
    await page2.close();
  });

  test('should handle session expiration', async ({ page }) => {
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    
    // Mock session expiration
    await page.evaluate(() => {
      localStorage.removeItem('supabase.auth.token');
    });
    
    // Try to access protected route
    await page.goto('/technical/bom');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should display user information in topbar', async ({ page }) => {
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    
    // Click user menu
    await page.click('[data-testid="user-menu"]');
    
    // Verify user info is displayed
    await expect(page.locator(`text="${testUsers.admin.name}"`)).toBeVisible();
    await expect(page.locator(`text="${testUsers.admin.role}"`)).toBeVisible();
  });

  test('should handle concurrent login attempts', async ({ page }) => {
    // Start login process
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.admin.email);
    await page.fill('input[name="password"]', testUsers.admin.password);
    
    // Click submit multiple times quickly
    await page.click('button[type="submit"]');
    await page.click('button[type="submit"]');
    await page.click('button[type="submit"]');
    
    // Should still work correctly
    await expect(page).toHaveURL(/^(?!.*\/login)/);
  });

  test('should handle logout from multiple tabs', async ({ context }) => {
    // Login in first tab
    const page1 = await context.newPage();
    const helpers1 = new TestHelpers(page1);
    await helpers1.login(testUsers.admin.email, testUsers.admin.password);
    
    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/technical/bom');
    
    // Logout from first tab
    await page1.click('[data-testid="user-menu"]');
    await page1.click('[data-testid="logout-button"]');
    
    // Second tab should also be logged out
    await page2.goto('/technical/bom');
    await expect(page2).toHaveURL(/.*\/login/);
    
    // Cleanup
    await page1.close();
    await page2.close();
  });

  test('should remember last visited route after login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/technical/bom');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
    
    // Login
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    
    // Should redirect back to original route
    await expect(page).toHaveURL('/technical/bom');
  });

  test('should handle role-based access control', async ({ page }) => {
    // Login as operator (limited access)
    await helpers.login(testUsers.operator.email, testUsers.operator.password);
    
    // Should be able to access production
    await page.goto('/production');
    await expect(page).toHaveURL('/production');
    
    // Should not be able to access admin
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should display appropriate navigation based on role', async ({ page }) => {
    // Login as admin
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    
    // Should see all navigation items
    await expect(page.locator('a[href="/technical/bom"]')).toBeVisible();
    await expect(page.locator('a[href="/planning"]')).toBeVisible();
    await expect(page.locator('a[href="/production"]')).toBeVisible();
    await expect(page.locator('a[href="/warehouse"]')).toBeVisible();
    await expect(page.locator('a[href="/scanner"]')).toBeVisible();
    await expect(page.locator('a[href="/settings"]')).toBeVisible();
    await expect(page.locator('a[href="/admin"]')).toBeVisible();
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    // Mock authentication failure
    await page.route('**/auth/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' })
      });
    });
    
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.admin.email);
    await page.fill('input[name="password"]', testUsers.admin.password);
    await page.click('button[type="submit"]');
    
    // Should handle error gracefully
    await helpers.waitForToast('Authentication failed');
  });
});
