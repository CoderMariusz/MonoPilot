import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helpers for MonoPilot
 */

// Test user credentials (should match your Supabase test user)
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'przyslony@gmail.com',
  password: process.env.TEST_USER_PASSWORD || 'Test1234',
};

/**
 * Login helper - logs in a user and waits for dashboard
 */
export async function login(page: Page, email?: string, password?: string) {
  await page.goto('/login');
  
  // Wait for login form to be visible
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  
  // Fill login form
  await page.fill('input[type="email"]', email || TEST_USER.email);
  await page.fill('input[type="password"]', password || TEST_USER.password);
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for navigation away from login page (to any authenticated route)
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
  
  // Wait a bit for the page to fully load
  await page.waitForTimeout(1000);
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  // Click user menu to open dropdown
  await page.click('[data-testid="user-menu"]');
  
  // Wait for menu to be visible
  await page.waitForTimeout(500);
  
  // Click logout button
  await page.click('[data-testid="logout-button"]');
  
  // Wait for redirect to login page
  await page.waitForURL('/login', { timeout: 10000 });
  
  // Verify we're on login page
  await expect(page.locator('input[type="email"]')).toBeVisible();
}

/**
 * Navigate to a specific section
 */
export async function navigateTo(page: Page, section: 'planning' | 'production' | 'warehouse' | 'settings') {
  await page.click(`a[href="/${section}"], nav >> text=${section}`);
  await page.waitForURL(`**/${section}**`);
}

/**
 * Wait for toast notification and verify message
 */
export async function waitForToast(page: Page, expectedMessage?: string) {
  const toast = page.locator('[role="alert"], .toast, [data-testid="toast"]').first();
  await expect(toast).toBeVisible({ timeout: 5000 });
  
  if (expectedMessage) {
    await expect(toast).toContainText(expectedMessage);
  }
  
  return toast;
}

/**
 * Fill form field by label
 */
export async function fillByLabel(page: Page, label: string, value: string) {
  const input = page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + select, label:has-text("${label}") + textarea`);
  await input.fill(value);
}

/**
 * Select dropdown option by label
 */
export async function selectByLabel(page: Page, label: string, value: string) {
  const select = page.locator(`label:has-text("${label}") + select`);
  await select.selectOption(value);
}

/**
 * Click button with text
 */
export async function clickButton(page: Page, text: string) {
  // Use more specific selector to avoid backdrop issues
  const button = page.locator(`button:has-text("${text}")`).last();
  await button.click({ force: true });
}

/**
 * Wait for modal to open
 */
export async function waitForModal(page: Page, titleText: string) {
  // Wait for modal backdrop or modal container
  const modal = page.locator('.fixed.inset-0, [role="dialog"]').filter({ hasText: titleText }).first();
  await expect(modal).toBeVisible({ timeout: 10000 });
  
  // Also wait for the title to be visible
  const title = page.locator(`h2:has-text("${titleText}"), h3:has-text("${titleText}")`);
  await expect(title).toBeVisible({ timeout: 5000 });
  
  return modal;
}

/**
 * Close modal
 */
export async function closeModal(page: Page) {
  await page.click('button:has-text("Close"), button:has-text("Cancel"), [role="dialog"] button[aria-label="Close"]');
}

/**
 * Wait for table to load data
 */
export async function waitForTableData(page: Page, minRows: number = 1) {
  await page.waitForSelector('table tbody tr', { timeout: 10000 });
  const rows = await page.locator('table tbody tr').count();
  expect(rows).toBeGreaterThanOrEqual(minRows);
}

/**
 * Generate unique test ID
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

