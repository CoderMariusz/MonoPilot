import { test, expect } from '@playwright/test';

test.describe('Debug Login', () => {
  test('debug login process', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    console.log('=== DEBUG LOGIN TEST ===');
    console.log('Current URL:', page.url());
    
    // Check if login form is visible
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    console.log('Login form is visible');
    
    // Fill form
    await emailInput.fill('przyslony@gmail.com');
    await passwordInput.fill('Test1234');
    
    console.log('Form filled');
    
    // Listen for console logs
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });
    
    // Listen for network requests
    page.on('request', request => {
      console.log('Request:', request.method(), request.url());
    });
    
    page.on('response', response => {
      console.log('Response:', response.status(), response.url());
    });
    
    // Click submit
    await submitButton.click();
    
    console.log('Submit clicked, waiting for response...');
    
    // Wait a bit to see what happens
    await page.waitForTimeout(5000);
    
    console.log('After 5 seconds, URL is:', page.url());
    
    // Check for any error messages
    const errorMessages = page.locator('.toast, .error, [data-testid="error"]');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorMessages.nth(i).textContent();
        console.log('Error message:', errorText);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-login.png' });
    
    console.log('=== END DEBUG ===');
  });
});
