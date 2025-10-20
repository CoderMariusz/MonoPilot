import { test, expect } from '@playwright/test';

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
    await gotoBOM(page);
    await page.getByRole('button', { name: 'Add Single' }).click();
    await page.getByLabel('Product Group').selectOption('DRYGOODS');
    await page.getByLabel('Product Type').fill('DG_ING');
    await page.getByLabel('Part Number').fill('DG-SALT-002');
    await page.getByLabel('Description').fill('Iodized Salt');
    await page.getByLabel('UoM').fill('kg');
    await page.getByRole('button', { name: /Save \(DG\)/ }).click();
    await expect(page.locator('text=No products found')).not.toBeVisible({ timeout: 5000 });
  });

  test('Single / MEAT → type RM', async ({ page }) => {
    await gotoBOM(page);
    await page.getByRole('button', { name: 'Add Single' }).click();
    await page.getByLabel('Product Group').selectOption('MEAT');
    await page.getByLabel('Product Type').fill('RM_MEAT');
    await page.getByLabel('Part Number').fill('RM-BEEF-001');
    await page.getByLabel('Description').fill('Beef Trim 80/20');
    await page.getByLabel('UoM').fill('kg');
    await page.getByRole('button', { name: /Save \(RM\)/ }).click();
    await expect(page.locator('text=No products found')).not.toBeVisible({ timeout: 5000 });
  });

  test('Composite / PR with >=1 item', async ({ page }) => {
    await gotoBOM(page);
    await page.getByRole('button', { name: 'Add Composite' }).click();
    await page.getByLabel('Product Type').selectOption('PR');
    await page.getByLabel('Part Number').fill('PR-MIX-010');
    await page.getByLabel('Description').fill('Seasoned Mix');
    await page.getByLabel('UoM').fill('kg');
    await page.getByRole('button', { name: 'Add Item' }).click();
    const row = page.locator('input[placeholder="Material ID"]').first();
    await row.fill('1');
    await page.locator('input[placeholder="Qty"]').first().fill('0.95');
    await page.locator('input[placeholder="UoM"]').first().fill('kg');
    await page.getByRole('button', { name: 'Save Composite' }).click();
    await page.waitForLoadState('networkidle');
  });

  test('Composite / FG', async ({ page }) => {
    await gotoBOM(page);
    await page.getByRole('button', { name: 'Add Composite' }).click();
    await page.getByLabel('Product Type').selectOption('FG');
    await page.getByLabel('Part Number').fill('FG-BURGER-180');
    await page.getByLabel('Description').fill('Beef Burger 180g');
    await page.getByLabel('UoM').fill('ea');
    await page.getByRole('button', { name: 'Add Item' }).click();
    await page.locator('input[placeholder="Material ID"]').first().fill('1');
    await page.locator('input[placeholder="Qty"]').first().fill('1');
    await page.locator('input[placeholder="UoM"]').first().fill('ea');
    await page.getByRole('button', { name: 'Save Composite' }).click();
    await page.waitForLoadState('networkidle');
  });

  test('Duplicate part_number → friendly error', async ({ page }) => {
    await gotoBOM(page);
    await page.getByRole('button', { name: 'Add Single' }).click();
    await page.getByLabel('Product Group').selectOption('DRYGOODS');
    await page.getByLabel('Product Type').fill('DG_ING');
    await page.getByLabel('Part Number').fill('DG-SALT-002');
    await page.getByLabel('Description').fill('Iodized Salt 2');
    await page.getByLabel('UoM').fill('kg');
    await page.getByRole('button', { name: /Save \(DG\)/ }).click();
    await expect(page.locator('text=Part number already exists')).toBeVisible({ timeout: 5000 });
  });
});


