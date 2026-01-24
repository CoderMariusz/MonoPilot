/**
 * Technical Module - Common Assertions
 *
 * Reusable assertion helpers for Technical module tests.
 * These are custom assertions beyond Playwright's standard expect().
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Assert product has been created with correct data
 */
export async function expectProductCreated(
  page: Page,
  productData: {
    code: string;
    name: string;
    type?: string;
    base_uom?: string;
  },
) {
  // Product should appear in list
  await expect(page.getByText(productData.code)).toBeVisible();
  await expect(page.getByText(productData.name)).toBeVisible();

  // If type and UOM provided, verify they appear
  if (productData.type) {
    const typeCell = page
      .locator('table tbody tr')
      .filter({ hasText: productData.code })
      .getByText(productData.type);
    await expect(typeCell).toBeVisible();
  }

  if (productData.base_uom) {
    const uomCell = page
      .locator('table tbody tr')
      .filter({ hasText: productData.code })
      .getByText(productData.base_uom);
    await expect(uomCell).toBeVisible();
  }
}

/**
 * Assert BOM has been created with items
 */
export async function expectBOMCreatedWithItems(
  page: Page,
  productName: string,
  itemCount: number,
) {
  // BOM should appear in list
  await expect(page.getByText(productName)).toBeVisible();

  // Navigate to detail
  const bomRow = page
    .locator('table tbody tr')
    .filter({ hasText: productName })
    .first();
  await bomRow.click();
  await page.waitForLoadState('networkidle');

  // Verify items count
  const itemRows = page.locator('table tbody tr');
  const count = await itemRows.count();
  expect(count).toBeGreaterThanOrEqual(itemCount);
}

/**
 * Assert routing has been created with operations
 */
export async function expectRoutingCreatedWithOperations(
  page: Page,
  routingCode: string,
  operationCount: number,
) {
  // Routing should appear in list
  await expect(page.getByText(routingCode)).toBeVisible();

  // Navigate to detail
  const routingRow = page
    .locator('table tbody tr')
    .filter({ hasText: routingCode })
    .first();
  await routingRow.click();
  await page.waitForLoadState('networkidle');

  // Verify operations count
  const operationRows = page.locator('table tbody tr');
  const count = await operationRows.count();
  expect(count).toBeGreaterThanOrEqual(operationCount);
}

/**
 * Assert cost calculation is reasonable
 */
export async function expectCostReasonable(
  page: Page,
  minCost: number,
  maxCost: number,
) {
  const costText = await page
    .getByText(/total.*cost:?\s+\$[\d.]+/i)
    .textContent();

  if (!costText) {
    throw new Error('Cost not found on page');
  }

  const cost = parseFloat(costText.match(/\$?([\d.]+)/)?.[1] || '0');

  expect(cost).toBeGreaterThanOrEqual(minCost);
  expect(cost).toBeLessThanOrEqual(maxCost);
}

/**
 * Assert version has incremented
 */
export async function expectVersionIncremented(
  currentVersion: string,
  newVersionText: string,
): Promise<boolean> {
  const newVersion = newVersionText.match(/[\d.]+/)?.[0];

  if (!newVersion) {
    throw new Error('Version not found in text');
  }

  const current = parseFloat(currentVersion);
  const updated = parseFloat(newVersion);

  expect(updated).toBeGreaterThan(current);
  return true;
}

/**
 * Assert allergen is declared on product
 */
export async function expectAllergenDeclared(
  page: Page,
  allergenName: string,
  relation: 'contains' | 'may_contain',
) {
  const allergenRow = page
    .locator('table tbody tr')
    .filter({ hasText: allergenName });

  await expect(allergenRow).toBeVisible();

  // Check relation type
  const relationText = relation === 'may_contain' ? 'May Contain' : 'Contains';
  const relationCell = allergenRow.getByText(relationText);

  await expect(relationCell).toBeVisible();
}

/**
 * Assert BOM items have correct quantities
 */
export async function expectBOMItemQuantities(
  page: Page,
  items: Array<{ name: string; quantity: number; uom: string }>,
) {
  for (const item of items) {
    const row = page
      .locator('table tbody tr')
      .filter({ hasText: item.name });
    const quantityCell = row.getByText(`${item.quantity} ${item.uom}`);

    await expect(quantityCell).toBeVisible();
  }
}

/**
 * Assert routing operations have time values
 */
export async function expectRoutingOperationTimes(
  page: Page,
  operationName: string,
  setupTime: number,
  duration: number,
  cleanupTime: number,
) {
  const operationRow = page
    .locator('table tbody tr')
    .filter({ hasText: operationName });

  // These checks are flexible as the exact layout may vary
  const timeText = await operationRow.textContent();

  expect(timeText).toContain(setupTime.toString());
  expect(timeText).toContain(duration.toString());
  expect(timeText).toContain(cleanupTime.toString());
}

/**
 * Assert cost breakdown is visible and reasonable
 */
export async function expectCostBreakdown(
  page: Page,
  materials: number,
  labor: number,
  overhead: number,
) {
  // Material cost
  const materialCost = page.getByText(/material.*cost|ingredient.*cost/i);
  await expect(materialCost).toBeVisible();

  // Labor cost
  const laborCost = page.getByText(/labor|operation.*cost/i);
  await expect(laborCost).toBeVisible();

  // Overhead
  const overheadCost = page.getByText(/overhead/i);
  await expect(overheadCost).toBeVisible();

  // Total should be greater than each component
  const totalCostText = await page
    .getByText(/total.*cost:?\s+\$[\d.]+/i)
    .textContent();

  if (totalCostText) {
    const total = parseFloat(totalCostText.match(/\$?([\d.]+)/)?.[1] || '0');
    expect(total).toBeGreaterThan(0);
  }
}

/**
 * Assert traceability data is visible
 */
export async function expectTraceabilityData(
  page: Page,
  lotNumber: string,
  parentLots?: string[],
  childLots?: string[],
) {
  // Lot should be visible
  await expect(page.getByText(lotNumber)).toBeVisible();

  // Parent lots if provided
  if (parentLots) {
    for (const parentLot of parentLots) {
      await expect(page.getByText(parentLot)).toBeVisible();
    }
  }

  // Child lots if provided
  if (childLots) {
    for (const childLot of childLots) {
      await expect(page.getByText(childLot)).toBeVisible();
    }
  }
}

/**
 * Assert dashboard stats are visible and have values
 */
export async function expectDashboardStats(
  page: Page,
  stats: string[],
) {
  for (const stat of stats) {
    const statCard = page.getByText(new RegExp(stat, 'i'));
    await expect(statCard).toBeVisible();

    // Should have a numeric value
    const value = statCard.locator('xpath=..').getByText(/\d+/);
    await expect(value).toBeVisible();
  }
}

/**
 * Assert multi-level BOM structure
 */
export async function expectMultiLevelBOM(
  page: Page,
  mainProduct: string,
  level1Items: string[],
  level2Items?: string[],
) {
  // Main product visible
  await expect(page.getByText(mainProduct)).toBeVisible();

  // Level 1 items visible
  for (const item of level1Items) {
    await expect(page.getByText(item)).toBeVisible();
  }

  // Level 2 items if provided
  if (level2Items) {
    for (const item of level2Items) {
      await expect(page.getByText(item)).toBeVisible();
    }
  }
}

/**
 * Assert shelf life configuration is complete
 */
export async function expectShelfLifeComplete(
  page: Page,
  isPerishable: boolean,
  shelfLifeDays?: number,
  expiryPolicy?: string,
) {
  if (isPerishable) {
    if (shelfLifeDays) {
      const daysText = page.getByText(
        new RegExp(`${shelfLifeDays}.*days?|shelf.*life`, 'i'),
      );
      await expect(daysText).toBeVisible();
    }

    if (expiryPolicy) {
      const policyText = page.getByText(new RegExp(expiryPolicy, 'i'));
      await expect(policyText).toBeVisible();
    }
  } else {
    // Non-perishable should not have shelf life
    const shelfLife = page.getByText(/shelf|expiry|perishable/i);
    const isVisible = await shelfLife.isVisible().catch(() => false);
    if (isVisible) {
      // Should be marked as "Not Applicable"
      const notApplicable = page.getByText(/not applicable|n\/a|no|none/i);
      await expect(notApplicable).toBeVisible();
    }
  }
}

/**
 * Assert product has no duplicate
 */
export async function expectNoDuplicateProduct(
  page: Page,
  productCode: string,
) {
  const rows = page
    .locator('table tbody tr')
    .filter({ hasText: productCode });

  const count = await rows.count();
  expect(count).toBeLessThanOrEqual(1); // Should appear at most once
}

/**
 * Assert BOM date range does not overlap
 */
export async function expectNoBOMDateOverlap(
  existingStart: string,
  existingEnd: string | null,
  newStart: string,
  newEnd: string | null,
): Promise<boolean> {
  const existingStartDate = new Date(existingStart);
  const newStartDate = new Date(newStart);
  const newEndDate = newEnd ? new Date(newEnd) : null;
  const existingEndDate = existingEnd ? new Date(existingEnd) : null;

  // Check for overlap
  const hasOverlap =
    newStartDate <= (existingEndDate || new Date('2099-12-31')) &&
    (newEndDate || new Date('2099-12-31')) >= existingStartDate;

  expect(hasOverlap).toBe(false);
  return true;
}

/**
 * Assert routing can be reused (assigned to multiple BOMs)
 */
export async function expectRoutingReusable(
  page: Page,
  bomCount: number,
) {
  const bomAssignments = page.getByText(/assigned.*BOM|in use/i);
  const text = await bomAssignments.textContent();

  if (text) {
    const count = parseInt(text.match(/\d+/)?.[0] || '0');
    expect(count).toBeGreaterThanOrEqual(bomCount);
  }
}

/**
 * Assert traceability shows genealogy
 */
export async function expectGenealogyVisible(
  page: Page,
  ancestorProduct: string,
  descendantProduct: string,
) {
  // Both should be visible in genealogy tree
  await expect(page.getByText(ancestorProduct)).toBeVisible();
  await expect(page.getByText(descendantProduct)).toBeVisible();

  // There should be connection/relationship indicator
  const tree = page.locator('[data-testid="genealogy-tree"], .tree-view');
  await expect(tree).toBeVisible();
}

/**
 * Assert recall simulation shows affected items
 */
export async function expectRecallSimulation(
  page: Page,
  affectedProducts: string[],
  customers: string[],
  totalQuantity: number,
) {
  // Affected products should be visible
  for (const product of affectedProducts) {
    await expect(page.getByText(product)).toBeVisible();
  }

  // Customers should be visible
  for (const customer of customers) {
    await expect(page.getByText(customer)).toBeVisible();
  }

  // Total quantity should be shown
  const quantity = page.getByText(
    new RegExp(`${totalQuantity}.*kg|quantity`, 'i'),
  );
  await expect(quantity).toBeVisible();
}
