/**
 * E2E Test Fixtures and Helpers
 * Story: 03.5b - PO Approval Workflow
 *
 * Provides:
 * - Login helpers for different user roles
 * - Common test data accessors
 * - Utility functions for E2E tests
 */

import { Page, BrowserContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Test credentials (must match seed-e2e-test-data.ts)
export const TEST_CREDENTIALS = {
  planner: {
    email: 'planner@company.com',
    password: 'password123',
    role: 'planner'
  },
  manager: {
    email: 'manager@company.com',
    password: 'password123',
    role: 'manager'
  },
  admin: {
    email: 'admin@company.com',
    password: 'password123',
    role: 'admin'
  }
} as const;

// Test data constants (must match seed-e2e-test-data.ts)
export const TEST_DATA = {
  organization: {
    name: 'E2E Test Organization',
    slug: 'e2e-test-org'
  },
  suppliers: [
    { code: 'MILL-001', name: 'Mill Co.' },
    { code: 'SUGAR-001', name: 'Sugar Inc.' },
    { code: 'SMALL-001', name: 'Small Supplier' }
  ],
  warehouses: [
    { code: 'MAIN-WH', name: 'Main Warehouse' },
    { code: 'RAW-WH', name: 'Raw Materials Warehouse' }
  ],
  products: [
    { code: 'FLOUR-A', name: 'Flour Type A' },
    { code: 'SUGAR-W', name: 'White Sugar' },
    { code: 'SALT-S', name: 'Sea Salt' }
  ],
  settings: {
    approvalThreshold: 10000,
    approvalRoles: ['manager', 'admin']
  }
} as const;

/**
 * Login helper for standard user login flow
 *
 * @param page Playwright page instance
 * @param email User email
 * @param password User password
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Login as planner role
 *
 * @param page Playwright page instance
 */
export async function loginAsPlanner(page: Page) {
  const { email, password } = TEST_CREDENTIALS.planner;
  await login(page, email, password);
}

/**
 * Login as manager role
 *
 * @param page Playwright page instance
 */
export async function loginAsManager(page: Page) {
  const { email, password } = TEST_CREDENTIALS.manager;
  await login(page, email, password);
}

/**
 * Login as admin role
 *
 * @param page Playwright page instance
 */
export async function loginAsAdmin(page: Page) {
  const { email, password } = TEST_CREDENTIALS.admin;
  await login(page, email, password);
}

/**
 * Create a new browser context with a specific user logged in
 *
 * @param context Parent browser context
 * @param role User role to log in as
 * @returns New page with user logged in
 */
export async function createUserContext(
  context: BrowserContext,
  role: keyof typeof TEST_CREDENTIALS
): Promise<Page> {
  const page = await context.newPage();
  const credentials = TEST_CREDENTIALS[role];
  await login(page, credentials.email, credentials.password);
  return page;
}

/**
 * Logout current user
 *
 * @param page Playwright page instance
 */
export async function logout(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu"]');
  // Click logout
  await page.click('text=Logout');
  // Wait for redirect to login
  await page.waitForURL('/login', { timeout: 5000 });
}

/**
 * Navigate to Purchase Orders list page
 *
 * @param page Playwright page instance
 */
export async function goToPurchaseOrders(page: Page) {
  await page.goto('/planning/purchase-orders');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to Create Purchase Order page
 *
 * @param page Playwright page instance
 */
export async function goToCreatePurchaseOrder(page: Page) {
  await page.goto('/planning/purchase-orders/new');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to specific Purchase Order detail page
 *
 * @param page Playwright page instance
 * @param poId Purchase Order ID
 */
export async function goToPurchaseOrderDetail(page: Page, poId: string) {
  await page.goto(`/planning/purchase-orders/${poId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Create a basic Purchase Order
 *
 * @param page Playwright page instance
 * @param options PO creation options
 * @returns PO URL and number
 */
export async function createPurchaseOrder(
  page: Page,
  options: {
    supplier: string;
    warehouse: string;
    product: string;
    quantity: number;
    unitPrice: number;
    expectedDelivery?: string;
  }
) {
  await goToCreatePurchaseOrder(page);

  // Fill basic info
  await page.fill('input[name="supplier"]', options.supplier);
  await page.fill('input[name="warehouse"]', options.warehouse);

  if (options.expectedDelivery) {
    await page.fill('input[name="expected_delivery"]', options.expectedDelivery);
  }

  // Add line item
  await page.click('button:has-text("Add Line")');
  await page.fill('input[name="product"]', options.product);
  await page.fill('input[name="quantity"]', options.quantity.toString());
  await page.fill('input[name="unit_price"]', options.unitPrice.toString());

  // Save PO
  await page.click('button:has-text("Save")');
  await page.waitForLoadState('networkidle');

  // Get PO details
  const poUrl = page.url();
  const poNumber = await page.textContent('[data-testid="po-number"]');

  return { poUrl, poNumber: poNumber || '' };
}

/**
 * Submit PO for approval
 *
 * @param page Playwright page instance
 */
export async function submitPOForApproval(page: Page) {
  await page.click('button:has-text("Submit for Approval")');
  await page.waitForSelector('text=submitted for approval', { timeout: 5000 });
}

/**
 * Approve a Purchase Order
 *
 * @param page Playwright page instance
 * @param notes Optional approval notes
 */
export async function approvePO(page: Page, notes?: string) {
  // Open approval modal
  await page.click('button:has-text("Approve")');
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

  // Fill notes if provided
  if (notes) {
    const notesField = page.locator('textarea[name="notes"]');
    await notesField.fill(notes);
  }

  // Approve
  await page.click('button:has-text("Approve PO")');
  await page.waitForSelector('text=approved successfully', { timeout: 5000 });
}

/**
 * Reject a Purchase Order
 *
 * @param page Playwright page instance
 * @param reason Rejection reason (required)
 */
export async function rejectPO(page: Page, reason: string) {
  // Open rejection modal
  await page.click('button:has-text("Reject")');
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

  // Fill rejection reason
  const reasonField = page.locator('textarea[name="rejection_reason"]');
  await reasonField.fill(reason);

  // Reject
  await page.click('button:has-text("Reject PO")');
  await page.waitForSelector('text=rejected', { timeout: 5000 });
}

/**
 * Verify PO status badge text
 *
 * @param page Playwright page instance
 * @param expectedStatus Expected status text (e.g., 'Pending Approval')
 */
export async function verifyPOStatus(page: Page, expectedStatus: string) {
  const statusBadge = page.locator('[data-testid="po-status"]');
  await statusBadge.waitFor({ state: 'visible', timeout: 5000 });
  const text = await statusBadge.textContent();

  if (!text?.includes(expectedStatus)) {
    throw new Error(`Expected status "${expectedStatus}" but got "${text}"`);
  }
}

/**
 * Get approval history entries
 *
 * @param page Playwright page instance
 * @returns Array of history entries
 */
export async function getApprovalHistory(page: Page) {
  // Click to expand history
  await page.click('text=Approval History');
  await page.waitForSelector('[data-testid="history-entry"]', { timeout: 5000 });

  // Get all entries
  const entries = await page.locator('[data-testid="history-entry"]').all();

  return Promise.all(
    entries.map(async (entry) => ({
      text: await entry.textContent(),
      action: await entry.getAttribute('data-action'),
      user: await entry.getAttribute('data-user')
    }))
  );
}

/**
 * Wait for toast notification with specific text
 *
 * @param page Playwright page instance
 * @param text Expected notification text
 */
export async function waitForNotification(page: Page, text: string) {
  await page.waitForSelector(`text=${text}`, { timeout: 5000 });
}

/**
 * Get Supabase client for direct database operations in tests
 *
 * @returns Supabase client instance
 */
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in environment');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Clean up test data (use carefully!)
 *
 * @param orgId Organization ID to clean up
 */
export async function cleanupTestData(orgId: string) {
  const supabase = getSupabaseClient();

  // Delete in correct order (respect foreign keys)
  await supabase.from('po_approval_history').delete().eq('org_id', orgId);
  await supabase.from('purchase_order_lines').delete().eq('org_id', orgId);
  await supabase.from('purchase_orders').delete().eq('org_id', orgId);
  await supabase.from('supplier_products').delete().eq('org_id', orgId);
  await supabase.from('products').delete().eq('org_id', orgId);
  await supabase.from('suppliers').delete().eq('org_id', orgId);
  await supabase.from('warehouses').delete().eq('org_id', orgId);
  await supabase.from('planning_settings').delete().eq('org_id', orgId);

  console.log(`✅ Cleaned up test data for org ${orgId}`);
}

/**
 * Calculate PO total based on quantity and unit price
 *
 * @param quantity Quantity
 * @param unitPrice Unit price
 * @returns Total amount
 */
export function calculatePOTotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

/**
 * Check if PO total exceeds approval threshold
 *
 * @param total PO total amount
 * @param threshold Approval threshold (default: 10000)
 * @returns True if approval required
 */
export function requiresApproval(total: number, threshold: number = 10000): boolean {
  return total > threshold;
}

/**
 * Format date for input fields (YYYY-MM-DD)
 *
 * @param date Date object or ISO string
 * @returns Formatted date string
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Get date N days from now
 *
 * @param days Number of days to add
 * @returns Date object
 */
export function getDaysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Test data builder for Purchase Orders
 */
export class POTestDataBuilder {
  private data: any = {
    supplier: TEST_DATA.suppliers[0].name,
    warehouse: TEST_DATA.warehouses[0].name,
    product: TEST_DATA.products[0].name,
    quantity: 100,
    unitPrice: 50,
    expectedDelivery: formatDateForInput(getDaysFromNow(7))
  };

  withSupplier(supplierName: string) {
    this.data.supplier = supplierName;
    return this;
  }

  withWarehouse(warehouseName: string) {
    this.data.warehouse = warehouseName;
    return this;
  }

  withProduct(productName: string) {
    this.data.product = productName;
    return this;
  }

  withQuantity(quantity: number) {
    this.data.quantity = quantity;
    return this;
  }

  withUnitPrice(unitPrice: number) {
    this.data.unitPrice = unitPrice;
    return this;
  }

  withExpectedDelivery(date: Date | string) {
    this.data.expectedDelivery = typeof date === 'string'
      ? date
      : formatDateForInput(date);
    return this;
  }

  /**
   * Build PO data that requires approval (total > threshold)
   */
  requiringApproval() {
    // Set quantity and price so total > 10000
    this.data.quantity = 500;
    this.data.unitPrice = 30; // Total: 15,000
    return this;
  }

  /**
   * Build PO data that doesn't require approval (total <= threshold)
   */
  belowThreshold() {
    // Set quantity and price so total <= 10000
    this.data.quantity = 100;
    this.data.unitPrice = 40; // Total: 4,000
    return this;
  }

  build() {
    return { ...this.data };
  }

  getTotal() {
    return calculatePOTotal(this.data.quantity, this.data.unitPrice);
  }
}
