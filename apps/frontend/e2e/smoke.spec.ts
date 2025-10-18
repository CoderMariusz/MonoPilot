import { test, expect } from '@playwright/test';

test('smoke test - app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Forza/i);
});
