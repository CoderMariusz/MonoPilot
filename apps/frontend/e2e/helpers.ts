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
  
  // Give Supabase time to set session
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

  const start = Date.now();
  while (Date.now() - start < 15000) {
    const current = page.url();
    if (!current.includes('/login')) {
      break;
    }

    // Sometimes Supabase leaves us on /login?returnTo=... – force navigation to returnTo or root
    const returnTo = new URL(current).searchParams.get('returnTo');
    if (returnTo) {
      await page.goto(returnTo);
    } else {
      await page.goto('/');
    }

    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(250);
  }

  // Ensure we're no longer on login page
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });

  // Navigate to default landing page (production dashboard) to ensure layout loads
  await page.goto('/production');

  // Wait for sidebar/header to be ready
  await page.waitForSelector('button:has-text("Work Orders")', { timeout: 10000 });
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
 * Navigate to a specific top-level section (planning, production, warehouse, settings)
 */
export async function navigateTo(page: Page, section: 'planning' | 'production' | 'warehouse' | 'settings') {
  await page.click(`a[href="/${section}"], nav >> text=${section}`);
  await page.waitForURL(`**/${section}**`);
}

/**
 * Navigate to a production tab (Work Orders, Yield, Consume, Operations, Trace)
 */
export async function gotoProductionTab(
  page: Page,
  tab:
    | 'Work Orders'
    | 'Yield'
    | 'Consume'
    | 'Operations'
    | 'Trace'
) {
  if (!page.url().includes('/production')) {
    await page.goto('/production');
    await page.waitForSelector('button:has-text("Work Orders")', { timeout: 10000 });
  }

  await page.click(`button:has-text("${tab}")`);

  // Wait for tab content to render by looking for the headline
  const expectedHeading =
    tab === 'Work Orders'
      ? 'Work Orders'
      : tab === 'Yield'
      ? 'Yield Report'
      : tab === 'Consume'
      ? 'Consume Report'
      : tab === 'Operations'
      ? 'Operations'
      : 'Traceability';

  // Use more specific selector to avoid matching multiple headings
  await expect(
    page.locator('h2.text-xl, h1.text-3xl').filter({ hasText: expectedHeading })
  ).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Navigate to a planning tab (Work Orders, Purchase Orders, Transfer Orders)
 */
export async function gotoPlanningTab(
  page: Page,
  tab: 'Work Orders' | 'Purchase Orders' | 'Transfer Orders'
) {
  if (!page.url().includes('/planning')) {
    await page.goto('/planning');
    await page.waitForSelector('button:has-text("Work Orders")', { timeout: 10000 });
  }

  await page.click(`button:has-text("${tab}")`);

  const expectedHeading =
    tab === 'Work Orders'
      ? 'Work Orders'
      : tab === 'Purchase Orders'
      ? 'Purchase Orders'
      : 'Transfer Orders';

  // Use more specific selector to avoid matching multiple headings
  await expect(
    page.locator('h2.text-xl, h1.text-3xl').filter({ hasText: expectedHeading })
  ).toBeVisible({
    timeout: 10000,
  });
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

