/**
 * Test Setup Helpers for Technical Module E2E Tests
 *
 * Common setup functions for creating test data and initializing tests.
 */

import { Page } from '@playwright/test';
import {
  productFixtures,
  bomFixtures,
  routingFixtures,
  createProductData,
  createBOMWithItems,
  createRoutingWithOperations,
} from '../fixtures/technical';

/**
 * Setup test environment before test
 */
export async function setupTestEnvironment(page: Page) {
  // Navigate to app
  await page.goto('/');

  // Wait for app to load
  await page.waitForLoadState('networkidle');

  // Optional: Ensure authenticated (depends on auth setup)
  // const isAuthNeeded = await page.url().includes('/login');
  // if (isAuthNeeded) { /* handle auth */ }
}

/**
 * Create test product via API (faster than UI)
 */
export async function createProductViaAPI(
  page: Page,
  productData: any,
): Promise<string> {
  const response = await page.request.post('/api/technical/products', {
    data: productData,
  });

  if (!response.ok()) {
    throw new Error(`Failed to create product: ${response.status()}`);
  }

  const result = await response.json();
  return result.id || result.data?.id;
}

/**
 * Create test BOM via API (faster than UI)
 */
export async function createBOMViaAPI(
  page: Page,
  bomData: any,
): Promise<string> {
  const response = await page.request.post('/api/technical/boms', {
    data: bomData,
  });

  if (!response.ok()) {
    throw new Error(`Failed to create BOM: ${response.status()}`);
  }

  const result = await response.json();
  return result.id || result.data?.id;
}

/**
 * Create test routing via API (faster than UI)
 */
export async function createRoutingViaAPI(
  page: Page,
  routingData: any,
): Promise<string> {
  const response = await page.request.post('/api/technical/routings', {
    data: routingData,
  });

  if (!response.ok()) {
    throw new Error(`Failed to create routing: ${response.status()}`);
  }

  const result = await response.json();
  return result.id || result.data?.id;
}

/**
 * Delete product via API (cleanup)
 */
export async function deleteProductViaAPI(
  page: Page,
  productId: string,
): Promise<void> {
  const response = await page.request.delete(
    `/api/technical/products/${productId}`,
  );

  if (!response.ok() && response.status() !== 404) {
    throw new Error(`Failed to delete product: ${response.status()}`);
  }
}

/**
 * Delete BOM via API (cleanup)
 */
export async function deleteBOMViaAPI(
  page: Page,
  bomId: string,
): Promise<void> {
  const response = await page.request.delete(`/api/technical/boms/${bomId}`);

  if (!response.ok() && response.status() !== 404) {
    throw new Error(`Failed to delete BOM: ${response.status()}`);
  }
}

/**
 * Delete routing via API (cleanup)
 */
export async function deleteRoutingViaAPI(
  page: Page,
  routingId: string,
): Promise<void> {
  const response = await page.request.delete(
    `/api/technical/routings/${routingId}`,
  );

  if (!response.ok() && response.status() !== 404) {
    throw new Error(`Failed to delete routing: ${response.status()}`);
  }
}

/**
 * Create complete product ecosystem (product + BOM + routing)
 */
export async function createProductEcosystem(page: Page) {
  // Create product
  const productData = createProductData('FIN');
  const productId = await createProductViaAPI(page, productData);

  // Create BOM
  const bomData = createBOMWithItems(productId, 2);
  const bomId = await createBOMViaAPI(page, bomData);

  // Create routing
  const routingData = createRoutingWithOperations(2, true);
  const routingId = await createRoutingViaAPI(page, routingData);

  return {
    productId,
    productData,
    bomId,
    bomData,
    routingId,
    routingData,
  };
}

/**
 * Cleanup created entities via API
 */
export async function cleanupTestData(
  page: Page,
  data: {
    productId?: string;
    bomId?: string;
    routingId?: string;
  },
) {
  // Delete in order: BOM first (references product), then routing, then product
  if (data.bomId) {
    try {
      await deleteBOMViaAPI(page, data.bomId);
    } catch (e) {
      console.warn(`Cleanup warning: Failed to delete BOM ${data.bomId}`);
    }
  }

  if (data.routingId) {
    try {
      await deleteRoutingViaAPI(page, data.routingId);
    } catch (e) {
      console.warn(`Cleanup warning: Failed to delete routing ${data.routingId}`);
    }
  }

  if (data.productId) {
    try {
      await deleteProductViaAPI(page, data.productId);
    } catch (e) {
      console.warn(`Cleanup warning: Failed to delete product ${data.productId}`);
    }
  }
}

/**
 * Wait for table to refresh after action
 */
export async function waitForTableRefresh(page: Page) {
  await page.waitForLoadState('networkidle');
  // Additional check: wait for spinner to disappear if present
  const spinner = page.locator('[data-testid="loading"], .spinner');
  if ((await spinner.count()) > 0) {
    await spinner.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
}

/**
 * Wait for form validation
 */
export async function waitForFormValidation(page: Page) {
  // Wait for any validation messages or form readiness
  await page.waitForLoadState('networkidle');
}

/**
 * Get API error response
 */
export async function captureAPIError(page: Page, url: RegExp | string) {
  const promise = page.waitForResponse(url);

  return promise
    .then((response) => {
      if (!response.ok()) {
        return response.json().catch(() => ({ status: response.status() }));
      }
      return null;
    })
    .catch(() => null);
}

/**
 * Mock API response (for testing error handling)
 */
export async function mockAPIError(
  page: Page,
  urlPattern: RegExp | string,
  statusCode: number = 500,
  errorMessage: string = 'Internal Server Error',
) {
  await page.route(urlPattern, (route) => {
    route.abort('failed');
  });
}

/**
 * Restore API mocks
 */
export async function restoreAPIMocks(page: Page) {
  await page.unroute('**/*');
}

/**
 * Create multiple products for list testing
 */
export async function createMultipleProducts(
  page: Page,
  count: number = 5,
): Promise<string[]> {
  const productIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const productData = createProductData(['RAW', 'WIP', 'FIN', 'PKG'][i % 4] as any);
    const productId = await createProductViaAPI(page, productData);
    productIds.push(productId);
  }

  return productIds;
}

/**
 * Create products with specific types
 */
export async function createProductsByType(
  page: Page,
  types: ('RAW' | 'WIP' | 'FIN' | 'PKG')[],
): Promise<Record<string, string>> {
  const products: Record<string, string> = {};

  for (const type of types) {
    const productData = createProductData(type);
    const productId = await createProductViaAPI(page, productData);
    products[type] = productId;
  }

  return products;
}

/**
 * Create BOM items with specific components
 */
export async function createBOMWithSpecificItems(
  page: Page,
  productId: string,
  componentIds: string[],
): Promise<string> {
  const items = componentIds.map((componentId, index) => ({
    component_id: componentId,
    quantity: 10 + index,
    uom: 'KG',
    operation_seq: Math.floor(index / 2) + 1,
    scrap_percent: 0,
  }));

  const bomData = {
    product_id: productId,
    version: 1,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: null,
    output_qty: 100,
    output_uom: 'EA',
    items,
  };

  return createBOMViaAPI(page, bomData);
}

/**
 * Take screenshot for debugging
 */
export async function debugScreenshot(
  page: Page,
  testName: string,
  suffix: string = '',
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `debug-${testName}-${suffix}-${timestamp}.png`;

  try {
    await page.screenshot({ path: `test-results/${fileName}` });
    console.log(`Screenshot saved: ${fileName}`);
  } catch (e) {
    console.warn(`Failed to save screenshot: ${e}`);
  }
}

/**
 * Get all visible text content from page
 */
export async function capturePageContent(page: Page): Promise<string> {
  return await page.evaluate(() => document.body.innerText);
}

/**
 * Verify no console errors
 */
export async function expectNoConsoleErrors(page: Page) {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  return () => {
    if (errors.length > 0) {
      throw new Error(`Console errors detected: ${errors.join(', ')}`);
    }
  };
}

// ==================== Export All Helpers ====================

export default {
  setupTestEnvironment,
  createProductViaAPI,
  createBOMViaAPI,
  createRoutingViaAPI,
  deleteProductViaAPI,
  deleteBOMViaAPI,
  deleteRoutingViaAPI,
  createProductEcosystem,
  cleanupTestData,
  waitForTableRefresh,
  waitForFormValidation,
  captureAPIError,
  mockAPIError,
  restoreAPIMocks,
  createMultipleProducts,
  createProductsByType,
  createBOMWithSpecificItems,
  debugScreenshot,
  capturePageContent,
  expectNoConsoleErrors,
};
