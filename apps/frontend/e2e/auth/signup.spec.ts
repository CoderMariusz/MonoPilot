import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Authentication - Signup Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should create new user account', async ({ page }) => {
    const testEmail = `testuser${Date.now()}@forza.com`;
    const testPassword = 'password123';
    const testName = 'Test User';

    await page.goto('/signup');
    
    // Fill signup form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.fill('input[name="name"]', testName);
    await page.selectOption('select[name="role"]', 'Operator');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success message
    await helpers.waitForToast('Account created successfully');
    
    // Verify redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/signup');
    
    // Test invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');
    
    // Verify validation error
    await expect(page.locator('input[name="email"]')).toHaveAttribute('type', 'email');
    await helpers.waitForToast('Please enter a valid email address');
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/signup');
    
    // Test weak password
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');
    
    // Verify validation error
    await helpers.waitForToast('Password must be at least 8 characters');
  });

  test('should validate password confirmation', async ({ page }) => {
    await page.goto('/signup');
    
    // Test password mismatch
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'differentpassword');
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');
    
    // Verify validation error
    await helpers.waitForToast('Passwords do not match');
  });

  test('should show error for existing email', async ({ page }) => {
    await page.goto('/signup');
    
    // Use existing email
    await page.fill('input[name="email"]', 'admin@forza.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');
    
    // Verify error message
    await helpers.waitForToast('Email already exists');
  });

  test('should redirect to login after signup', async ({ page }) => {
    const testEmail = `testuser${Date.now()}@forza.com`;
    
    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.fill('input[name="name"]', 'Test User');
    await page.selectOption('select[name="role"]', 'Operator');
    await page.click('button[type="submit"]');
    
    // Verify redirect to login
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Sign in');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/signup');
    await page.click('button[type="submit"]');
    
    // Verify all required fields show validation
    await expect(page.locator('input[name="email"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="confirmPassword"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="name"]')).toHaveAttribute('required');
    await expect(page.locator('select[name="role"]')).toHaveAttribute('required');
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/signup');
    
    const passwordInput = page.locator('input[name="password"]');
    const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
    const toggleButtons = page.locator('button[type="button"]');
    
    // Test password field toggle
    await toggleButtons.nth(0).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleButtons.nth(0).click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Test confirm password field toggle
    await toggleButtons.nth(1).click();
    await expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    await toggleButtons.nth(1).click();
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  test('should display loading state during signup', async ({ page }) => {
    const testEmail = `testuser${Date.now()}@forza.com`;
    
    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.fill('input[name="name"]', 'Test User');
    await page.selectOption('select[name="role"]', 'Operator');
    
    // Click submit and check for loading state
    await page.click('button[type="submit"]');
    
    // Verify loading state appears
    await expect(page.locator('button[type="submit"]')).toContainText('Creating account...');
  });

  test('should redirect to login page from signup', async ({ page }) => {
    await page.goto('/signup');
    await page.click('a[href="/login"]');
    
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Sign in');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/auth/**', route => route.abort());
    
    const testEmail = `testuser${Date.now()}@forza.com`;
    
    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.fill('input[name="name"]', 'Test User');
    await page.selectOption('select[name="role"]', 'Operator');
    await page.click('button[type="submit"]');
    
    // Verify error handling
    await helpers.waitForToast('Network error');
  });
});
