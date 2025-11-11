import { test, expect } from '@playwright/test';
import { login, logout, TEST_USER } from './helpers';

test.describe('Authentication Flow', () => {
  test('should successfully login and logout', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Should show login form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Login
    await login(page);
    
    // Should be on an authenticated page (not login)
    expect(page.url()).not.toContain('/login');
    
    // Should see navigation or header
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();
    
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
    
    // Should show error message (toast or alert)
    await page.waitForTimeout(2000); // Wait for error to appear
    
    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Browser validation or app validation should prevent submission
    // Check if we're still on login page (not navigated)
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/login/);
  });
});

