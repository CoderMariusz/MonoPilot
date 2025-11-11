import { test, expect } from '@playwright/test';
import { login, navigateTo, clickButton, waitForToast } from './helpers';

test.describe('Settings Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'settings');
    await page.waitForTimeout(500);
  });

  test('should update system settings', async ({ page }) => {
    // Find company name input
    const companyInput = page.locator('input[name="company_name"], input:near(label:has-text("Company"))');
    
    if (await companyInput.isVisible({ timeout: 3000 })) {
      const testValue = `Test Company ${Date.now()}`;
      await companyInput.clear();
      await companyInput.fill(testValue);
      
      // Save settings
      await clickButton(page, 'Save');
      
      // Wait for success
      await waitForToast(page, 'saved');
      
      // Reload page and verify persistence
      await page.reload();
      await page.waitForTimeout(1000);
      
      const savedValue = await companyInput.inputValue();
      expect(savedValue).toBe(testValue);
    }
  });

  test('should update currency settings', async ({ page }) => {
    // Find currency select
    const currencySelect = page.locator('select[name="default_currency"], select:near(label:has-text("Currency"))');
    
    if (await currencySelect.isVisible({ timeout: 3000 })) {
      // Select a currency
      await currencySelect.selectOption({ index: 1 });
      
      // Save
      await clickButton(page, 'Save');
      
      // Wait for success
      await waitForToast(page, 'saved');
    }
  });

  test('should update language settings', async ({ page }) => {
    // Find language select
    const languageSelect = page.locator('select[name="language"], select:near(label:has-text("Language"))');
    
    if (await languageSelect.isVisible({ timeout: 3000 })) {
      // Select a language
      await languageSelect.selectOption({ index: 1 });
      
      // Save
      await clickButton(page, 'Save');
      
      // Wait for success
      await waitForToast(page, 'saved');
    }
  });

  test('should show loading state while saving', async ({ page }) => {
    // Find any input
    const input = page.locator('input, select').first();
    
    if (await input.isVisible({ timeout: 3000 })) {
      // Make a change
      await input.focus();
      await input.press('ArrowDown');
      
      // Click save
      const saveButton = page.locator('button:has-text("Save")');
      await saveButton.click();
      
      // Should show loading state (disabled button or spinner)
      await expect(saveButton).toBeDisabled({ timeout: 1000 });
      
      // Wait for completion
      await page.waitForTimeout(2000);
    }
  });

  test('should persist settings after logout', async ({ page }) => {
    // Update a setting
    const companyInput = page.locator('input[name="company_name"]');
    
    if (await companyInput.isVisible({ timeout: 3000 })) {
      const testValue = `Persistent Test ${Date.now()}`;
      await companyInput.clear();
      await companyInput.fill(testValue);
      await clickButton(page, 'Save');
      await waitForToast(page, 'saved');
      
      // Logout
      await page.click('button:has-text("Logout"), button:has-text("Sign out")');
      await page.waitForURL('/login');
      
      // Login again
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@monopilot.com');
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword123');
      await page.click('button[type="submit"]');
      
      // Navigate back to settings
      await navigateTo(page, 'settings');
      await page.waitForTimeout(1000);
      
      // Verify value persisted
      const savedValue = await companyInput.inputValue();
      expect(savedValue).toBe(testValue);
    }
  });
});

