import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Authentication - Login Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    
    // Verify redirect to home page
    await expect(page).toHaveURL(/^(?!.*\/login)/);
    
    // Verify user is logged in (check for user menu or profile)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Verify error message appears
    await helpers.waitForToast('Invalid email or password');
  });

  test('should show error with empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    
    // Verify validation errors
    await expect(page.locator('input[name="email"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('required');
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('button[type="button"]').last();
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle button
    await toggleButton.click();
    
    // Password should be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click toggle button again
    await toggleButton.click();
    
    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should redirect to signup page', async ({ page }) => {
    await page.goto('/login');
    await page.click('a[href="/signup"]');
    
    await expect(page).toHaveURL('/signup');
    await expect(page.locator('h1')).toContainText('Sign up');
  });

  test('should display loading state during login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.admin.email);
    await page.fill('input[name="password"]', testUsers.admin.password);
    
    // Click submit and check for loading state
    await page.click('button[type="submit"]');
    
    // Verify loading state appears
    await expect(page.locator('button[type="submit"]')).toContainText('Signing in...');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/auth/**', route => route.abort());
    
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.admin.email);
    await page.fill('input[name="password"]', testUsers.admin.password);
    await page.click('button[type="submit"]');
    
    // Verify error handling
    await helpers.waitForToast('Network error');
  });

  test('should remember login state across page reloads', async ({ page }) => {
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    
    // Reload page
    await page.reload();
    
    // Verify still logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should redirect to home after successful login', async ({ page }) => {
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    
    // Verify redirect to home page
    await expect(page).toHaveURL('/');
  });

  test('should show appropriate error for different failure types', async ({ page }) => {
    await page.goto('/login');
    
    // Test email not confirmed
    await page.fill('input[name="email"]', 'unconfirmed@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await helpers.waitForToast('Please check your email and click the confirmation link');
    
    // Test too many requests
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Simulate multiple failed attempts
    for (let i = 0; i < 5; i++) {
      await page.click('button[type="submit"]');
      await page.waitForTimeout(100);
    }
    
    await helpers.waitForToast('Too many login attempts');
  });
});
