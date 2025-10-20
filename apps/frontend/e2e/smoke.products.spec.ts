import { test, expect } from '@playwright/test';
import { testUsers } from './fixtures/test-data';

// Minimal smokes for new product flows

async function gotoBOM(page: any) {
  await page.goto('/technical');
  await page.waitForLoadState('networkidle');
  // Try direct BOM route if available
  await page.goto('/technical/bom');
  await page.waitForLoadState('networkidle');
}

test.describe('Products smoke', () => {
  test('Single / DRYGOODS → type DG', async ({ page }) => {
    const pn = `DG-SALT-${Date.now()}`;
    // login
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.admin.email);
    await page.fill('input[name="password"]', testUsers.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/^(?!.*\/login)/);

    await gotoBOM(page);
    await page.getByRole('button', { name: 'Add Single' }).click();
    await page.locator('label:has-text("Product Group") + select').selectOption('DRYGOODS');
    await page.locator('label:has-text("Product Type") + select').selectOption('DG_ING');
    await page.locator('label:has-text("Part Number") + input').fill(pn);
    await page.locator('label:has-text("Description") + input').fill('Iodized Salt');
    await page.locator('label:has-text("UoM") + input').fill('kg');
    await page.getByRole('button', { name: /Save \(DG\)/ }).click();
    // Confirm toast success to ensure insert completed
    await expect(page.locator('.toast p').filter({ hasText: 'Product created successfully' }).first()).toBeVisible({ timeout: 10000 });
    // Reload, switch to DRYGOODS tab, and search for the created part number to stabilize lookup
    await page.goto('/technical/bom');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Dry Goods' }).click();
    const search = page.locator('input[placeholder*="Search by item # or name"]');
    await search.fill(pn);
    await page.keyboard.press('Enter');
    const row = page.locator(`text=${pn}`);
    for (let i = 0; i < 6; i++) {
      if (await row.count()) break;
      await page.waitForTimeout(2000);
      await search.fill('');
      await search.fill(pn);
      await page.keyboard.press('Enter');
    }
    await expect(row).toBeVisible({ timeout: 5000 });
  });

  test('Single / MEAT → type RM', async ({ page }) => {
    const pn = `RM-BEEF-${Date.now()}`;
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.admin.email);
    await page.fill('input[name="password"]', testUsers.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/^(?!.*\/login)/);

    await gotoBOM(page);
    await page.getByRole('button', { name: 'Add Single' }).click();
    await page.locator('label:has-text("Product Group") + select').selectOption('MEAT');
    await page.locator('label:has-text("Product Type") + select').selectOption('RM_MEAT');
    await page.locator('label:has-text("Part Number") + input').fill(pn);
    await page.locator('label:has-text("Description") + input').fill('Beef Trim 80/20');
    await page.locator('label:has-text("UoM") + input').fill('kg');
    await page.getByRole('button', { name: /Save \(RM\)/ }).click();
    await page.goto('/technical/bom');
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${pn}`)).toBeVisible({ timeout: 10000 });
  });

  test('Composite / PR with >=1 item', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.admin.email);
    await page.fill('input[name="password"]', testUsers.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/^(?!.*\/login)/);

    await gotoBOM(page);
    await page.getByRole('button', { name: 'Add Composite' }).click();
    await page.locator('label:has-text("Product Type") + select').selectOption('PR');
    await page.locator('label:has-text("Part Number") + input').fill('PR-MIX-010');
    await page.locator('label:has-text("Description") + input').fill('Seasoned Mix');
    await page.locator('label:has-text("UoM") + input').fill('kg');
    await page.getByRole('button', { name: 'Add Item' }).click();
    const row = page.locator('input[placeholder="Material ID"]').first();
    await row.fill('1');
    await page.locator('input[placeholder="Qty"]').first().fill('0.95');
    await page.locator('input[placeholder="UoM"]').first().fill('kg');
    await page.getByRole('button', { name: 'Save Composite' }).click();
    await page.waitForLoadState('networkidle');
  });

  test('Composite / FG', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.admin.email);
    await page.fill('input[name="password"]', testUsers.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/^(?!.*\/login)/);

    await gotoBOM(page);
    await page.getByRole('button', { name: 'Add Composite' }).click();
    await page.locator('label:has-text("Product Type") + select').selectOption('FG');
    await page.locator('label:has-text("Part Number") + input').fill('FG-BURGER-180');
    await page.locator('label:has-text("Description") + input').fill('Beef Burger 180g');
    await page.locator('label:has-text("UoM") + input').fill('ea');
    await page.getByRole('button', { name: 'Add Item' }).click();
    await page.locator('input[placeholder="Material ID"]').first().fill('1');
    await page.locator('input[placeholder="Qty"]').first().fill('1');
    await page.locator('input[placeholder="UoM"]').first().fill('ea');
    await page.getByRole('button', { name: 'Save Composite' }).click();
    await page.waitForLoadState('networkidle');
  });

  test('Duplicate part_number → friendly error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.admin.email);
    await page.fill('input[name="password"]', testUsers.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/^(?!.*\/login)/);

    await gotoBOM(page);
    await page.getByRole('button', { name: 'Add Single' }).click();
    await page.locator('label:has-text("Product Group") + select').selectOption('DRYGOODS');
    await page.locator('label:has-text("Product Type") + select').selectOption('DG_ING');
    await page.locator('label:has-text("Part Number") + input').fill('DG-SALT-002');
    await page.locator('label:has-text("Description") + input').fill('Iodized Salt 2');
    await page.locator('label:has-text("UoM") + input').fill('kg');
    await page.getByRole('button', { name: /Save \(DG\)/ }).click();
    const toastMsg = page.locator('.toast p');
    await expect(toastMsg.filter({ hasText: 'Part number already exists' }).first()).toBeVisible({ timeout: 5000 });
  });
});


