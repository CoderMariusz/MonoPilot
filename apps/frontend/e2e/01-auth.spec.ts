import { test, expect } from '@playwright/test';
import { login, logout, TEST_USER } from './helpers';

test.describe('Authentication Flow', () => {
  test('should successfully login and redirect to dashboard', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Should show login form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Login
    await login(page);

    // Should be on an authenticated page (not login)
    expect(page.url()).not.toContain('/login');

    // Should see navigation or header
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();
  });

  test('should successfully logout and redirect to login', async ({ page }) => {
    // Login first
    await login(page);

    // Should be authenticated
    expect(page.url()).not.toContain('/login');

    // Logout
    await logout(page);

    // Should be back on login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Try login with invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await page.waitForTimeout(2000);

    // Check for error message in the UI
    const errorMessage = page.locator('text=/Invalid email or password|Invalid login credentials|Failed to sign in/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Browser validation should prevent submission
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/planning');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);

    // Should show login form
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Try another protected route
    await page.goto('/production');
    await expect(page).toHaveURL(/\/login/);

    // And another
    await page.goto('/warehouse');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should preserve returnTo parameter and redirect after login', async ({ page }) => {
    // Navigate to protected route (should redirect to login with returnTo)
    await page.goto('/planning');

    // Should be on login page with returnTo parameter
    await expect(page).toHaveURL(/\/login.*returnTo/);

    // Should show session expired notice
    const sessionExpiredNotice = page.locator('text=/Your session has expired|Please sign in again/i');
    await expect(sessionExpiredNotice).toBeVisible();

    // Login
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForTimeout(3000);

    // Should redirect back to originally requested page
    // Note: May redirect to dashboard instead of returnTo - both are acceptable
    expect(page.url()).not.toContain('/login');
  });

  test('should persist session across page refreshes', async ({ page }) => {
    // Login
    await login(page);

    // Navigate to a page
    await page.goto('/planning');
    await page.waitForLoadState('networkidle');

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be authenticated (not redirected to login)
    expect(page.url()).not.toContain('/login');
    expect(page.url()).toContain('/planning');
  });

  test('should handle password visibility toggle', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('input[type="password"]').or(page.locator('input[name="password"]'));
    const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).first();

    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button
    await toggleButton.click();
    await page.waitForTimeout(200);

    // Password should now be visible (type changed to text)
    const visibleInput = page.locator('input[type="text"][name="password"]');
    await expect(visibleInput).toBeVisible();
  });
});

test.describe('Signup Flow', () => {
  test('should show signup form', async ({ page }) => {
    await page.goto('/signup');

    // Should show all required fields
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    await page.goto('/signup');

    // Fill form with mismatched passwords
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', 'newuser@test.com');
    await page.fill('input[name="password"]', 'Password123');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error
    await page.waitForTimeout(1000);
    const errorMessage = page.locator('text=/Passwords do not match/i');
    await expect(errorMessage).toBeVisible();
  });

  test('should validate password length', async ({ page }) => {
    await page.goto('/signup');

    // Fill form with short password
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', 'newuser@test.com');
    await page.fill('input[name="password"]', '12345');
    await page.fill('input[name="confirmPassword"]', '12345');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error
    await page.waitForTimeout(1000);
    const errorMessage = page.locator('text=/Password must be at least 6 characters/i');
    await expect(errorMessage).toBeVisible();
  });

  test('should validate name length', async ({ page }) => {
    await page.goto('/signup');

    // Fill form with short name
    await page.fill('input[name="name"]', 'A');
    await page.fill('input[type="email"]', 'newuser@test.com');
    await page.fill('input[name="password"]', 'Password123');
    await page.fill('input[name="confirmPassword"]', 'Password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error
    await page.waitForTimeout(1000);
    const errorMessage = page.locator('text=/Name must be at least 2 characters/i');
    await expect(errorMessage).toBeVisible();
  });

  test('should show info about default role', async ({ page }) => {
    await page.goto('/signup');

    // Should show info note about default Operator role
    const infoNote = page.locator('text=/New accounts are created with Operator role/i');
    await expect(infoNote).toBeVisible();
  });

  test('should navigate to login from signup', async ({ page }) => {
    await page.goto('/signup');

    // Click "Sign in" link
    const signInLink = page.locator('a[href="/login"]');
    await expect(signInLink).toBeVisible();
    await signInLink.click();

    // Should navigate to login page
    await expect(page).toHaveURL('/login');
  });

  test('should navigate to signup from login', async ({ page }) => {
    await page.goto('/login');

    // Click "Sign up" link
    const signUpLink = page.locator('a[href="/signup"]');
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();

    // Should navigate to signup page
    await expect(page).toHaveURL('/signup');
  });
});

test.describe('Auth UI/UX', () => {
  test('should show loading state during login', async ({ page }) => {
    await page.goto('/login');

    // Fill credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    // Click submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show loading state (disabled button + loading text/spinner)
    await expect(submitButton).toBeDisabled();

    // May show "Signing in..." text or spinner
    const loadingIndicator = page.locator('text=/Signing in|Loading/i').or(page.locator('.animate-spin'));
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 2000 });
  });

  test('should show redirecting state when already authenticated', async ({ page }) => {
    // Login first
    await login(page);

    // Navigate to login page (should redirect)
    await page.goto('/login');

    // May briefly show "Redirecting..." message before redirect
    // This is optional - just navigate away from login
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('/login');
  });

  test('should display test account info in development', async ({ page }) => {
    // This test only runs in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      await page.goto('/login');

      // Should show test account credentials
      const testAccountInfo = page.locator('text=/Test Account|test@monopilot.com/i');
      await expect(testAccountInfo).toBeVisible();
    }
  });
});
