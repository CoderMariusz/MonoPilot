import { Page } from '@playwright/test';

export class DataHelpers {
  constructor(private page: Page) {}

  generateUniqueId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`;
  }

  async createTestProduct(data: {
    partNumber?: string;
    description?: string;
    category?: 'MEAT' | 'DRYGOODS' | 'FINISHED_GOODS' | 'PROCESS';
    uom?: string;
    price?: string;
    supplierId?: string;
    expiryPolicy?: string;
    shelfLifeDays?: string;
  }) {
    const productData = {
      partNumber: data.partNumber || this.generateUniqueId('PROD'),
      description: data.description || `Test Product ${Date.now()}`,
      category: data.category || 'DRYGOODS',
      uom: data.uom || 'kg',
      price: data.price || '10.00',
      supplierId: data.supplierId,
      expiryPolicy: data.expiryPolicy,
      shelfLifeDays: data.shelfLifeDays,
    };

    // Navigate to BOM module
    await this.page.click('a[href="/technical/bom"]');
    await this.page.waitForLoadState('networkidle');

    // Click Add Item button
    await this.page.click('button:has-text("Add Item")');
    await this.page.waitForSelector('.modal');

    // Fill basic product information
    await this.page.fill('input[name="part_number"]', productData.partNumber);
    await this.page.fill('input[name="description"]', productData.description);
    await this.page.fill('input[name="uom"]', productData.uom);
    await this.page.fill('input[name="std_price"]', productData.price);

    // Select category
    await this.page.click(`button:has-text("${productData.category}")`);

    // Fill category-specific fields
    if (productData.category === 'MEAT' && productData.supplierId) {
      await this.page.selectOption('select[name="preferred_supplier_id"]', productData.supplierId);
    }

    if (productData.category === 'MEAT' && productData.expiryPolicy) {
      await this.page.selectOption('select[name="expiry_policy"]', productData.expiryPolicy);
    }

    if (productData.category === 'MEAT' && productData.shelfLifeDays) {
      await this.page.fill('input[name="shelf_life_days"]', productData.shelfLifeDays);
    }

    // Save product
    await this.page.click('button:has-text("Save")');
    await this.page.waitForLoadState('networkidle');

    return productData;
  }

  async deleteTestProduct(partNumber: string) {
    // Navigate to BOM module
    await this.page.click('a[href="/technical/bom"]');
    await this.page.waitForLoadState('networkidle');

    // Find and delete the product
    const productRow = this.page.locator(`tr:has-text("${partNumber}")`);
    if (await productRow.count() > 0) {
      await productRow.locator('button[aria-label="Delete"]').click();
      await this.page.click('button:has-text("Confirm")');
      await this.page.waitForLoadState('networkidle');
    }
  }

  async createTestWorkOrder(data: {
    productId?: string;
    quantity?: string;
    lineNumber?: string;
    scheduledDate?: string;
    priority?: string;
  }) {
    const workOrderData = {
      productId: data.productId || '1',
      quantity: data.quantity || '100',
      lineNumber: data.lineNumber || 'Line 1',
      scheduledDate: data.scheduledDate || new Date().toISOString().split('T')[0],
      priority: data.priority || 'Normal',
    };

    // Navigate to Planning module
    await this.page.click('a[href="/planning"]');
    await this.page.waitForLoadState('networkidle');

    // Click Create Work Order button
    await this.page.click('button:has-text("Create Work Order")');
    await this.page.waitForSelector('.modal');

    // Fill work order information
    await this.page.selectOption('select[name="product_id"]', workOrderData.productId);
    await this.page.fill('input[name="quantity"]', workOrderData.quantity);
    await this.page.selectOption('select[name="line_number"]', workOrderData.lineNumber);
    await this.page.fill('input[name="scheduled_date"]', workOrderData.scheduledDate);
    await this.page.selectOption('select[name="priority"]', workOrderData.priority);

    // Save work order
    await this.page.click('button:has-text("Save")');
    await this.page.waitForLoadState('networkidle');

    return workOrderData;
  }

  async deleteTestWorkOrder(workOrderNumber: string) {
    // Navigate to Planning module
    await this.page.click('a[href="/planning"]');
    await this.page.waitForLoadState('networkidle');

    // Find and delete the work order
    const workOrderRow = this.page.locator(`tr:has-text("${workOrderNumber}")`);
    if (await workOrderRow.count() > 0) {
      await workOrderRow.locator('button[aria-label="Delete"]').click();
      await this.page.click('button:has-text("Confirm")');
      await this.page.waitForLoadState('networkidle');
    }
  }

  async createTestPurchaseOrder(data: {
    supplierId?: string;
    items?: Array<{
      productId: string;
      quantity: string;
      price: string;
    }>;
  }) {
    const poData = {
      supplierId: data.supplierId || '1',
      items: data.items || [
        { productId: '1', quantity: '100', price: '10.00' }
      ],
    };

    // Navigate to Planning module
    await this.page.click('a[href="/planning"]');
    await this.page.waitForLoadState('networkidle');

    // Click Purchase Orders tab
    await this.page.click('[data-testid="tab-purchase-orders"]');

    // Click Create Purchase Order button
    await this.page.click('button:has-text("Create Purchase Order")');
    await this.page.waitForSelector('.modal');

    // Fill purchase order information
    await this.page.selectOption('select[name="supplier_id"]', poData.supplierId);

    // Add line items
    for (let i = 0; i < poData.items.length; i++) {
      if (i > 0) {
        await this.page.click('button:has-text("Add Line Item")');
      }
      
      await this.page.selectOption(`select[name="items[${i}].product_id"]`, poData.items[i].productId);
      await this.page.fill(`input[name="items[${i}].quantity"]`, poData.items[i].quantity);
      await this.page.fill(`input[name="items[${i}].price"]`, poData.items[i].price);
    }

    // Save purchase order
    await this.page.click('button:has-text("Save")');
    await this.page.waitForLoadState('networkidle');

    return poData;
  }

  async deleteTestPurchaseOrder(poNumber: string) {
    // Navigate to Planning module
    await this.page.click('a[href="/planning"]');
    await this.page.waitForLoadState('networkidle');

    // Click Purchase Orders tab
    await this.page.click('[data-testid="tab-purchase-orders"]');

    // Find and delete the purchase order
    const poRow = this.page.locator(`tr:has-text("${poNumber}")`);
    if (await poRow.count() > 0) {
      await poRow.locator('button[aria-label="Delete"]').click();
      await this.page.click('button:has-text("Confirm")');
      await this.page.waitForLoadState('networkidle');
    }
  }

  async createTestTransferOrder(data: {
    fromWarehouse?: string;
    toWarehouse?: string;
    items?: Array<{
      productId: string;
      quantity: string;
    }>;
  }) {
    const transferData = {
      fromWarehouse: data.fromWarehouse || '1',
      toWarehouse: data.toWarehouse || '2',
      items: data.items || [
        { productId: '1', quantity: '50' }
      ],
    };

    // Navigate to Planning module
    await this.page.click('a[href="/planning"]');
    await this.page.waitForLoadState('networkidle');

    // Click Transfer Orders tab
    await this.page.click('[data-testid="tab-transfer-orders"]');

    // Click Create Transfer Order button
    await this.page.click('button:has-text("Create Transfer Order")');
    await this.page.waitForSelector('.modal');

    // Fill transfer order information
    await this.page.selectOption('select[name="from_warehouse_id"]', transferData.fromWarehouse);
    await this.page.selectOption('select[name="to_warehouse_id"]', transferData.toWarehouse);

    // Add line items
    for (let i = 0; i < transferData.items.length; i++) {
      if (i > 0) {
        await this.page.click('button:has-text("Add Line Item")');
      }
      
      await this.page.selectOption(`select[name="items[${i}].product_id"]`, transferData.items[i].productId);
      await this.page.fill(`input[name="items[${i}].quantity"]`, transferData.items[i].quantity);
    }

    // Save transfer order
    await this.page.click('button:has-text("Save")');
    await this.page.waitForLoadState('networkidle');

    return transferData;
  }

  async deleteTestTransferOrder(transferOrderNumber: string) {
    // Navigate to Planning module
    await this.page.click('a[href="/planning"]');
    await this.page.waitForLoadState('networkidle');

    // Click Transfer Orders tab
    await this.page.click('[data-testid="tab-transfer-orders"]');

    // Find and delete the transfer order
    const transferRow = this.page.locator(`tr:has-text("${transferOrderNumber}")`);
    if (await transferRow.count() > 0) {
      await transferRow.locator('button[aria-label="Delete"]').click();
      await this.page.click('button:has-text("Confirm")');
      await this.page.waitForLoadState('networkidle');
    }
  }

  async createTestGRN(data: {
    purchaseOrderId?: string;
    items?: Array<{
      productId: string;
      quantity: string;
      receivedQuantity: string;
    }>;
  }) {
    const grnData = {
      purchaseOrderId: data.purchaseOrderId || '1',
      items: data.items || [
        { productId: '1', quantity: '100', receivedQuantity: '100' }
      ],
    };

    // Navigate to Warehouse module
    await this.page.click('a[href="/warehouse"]');
    await this.page.waitForLoadState('networkidle');

    // Click GRN tab
    await this.page.click('[data-testid="tab-grn"]');

    // Click Create GRN button
    await this.page.click('button:has-text("Create GRN")');
    await this.page.waitForSelector('.modal');

    // Fill GRN information
    await this.page.selectOption('select[name="purchase_order_id"]', grnData.purchaseOrderId);

    // Add line items
    for (let i = 0; i < grnData.items.length; i++) {
      if (i > 0) {
        await this.page.click('button:has-text("Add Line Item")');
      }
      
      await this.page.selectOption(`select[name="items[${i}].product_id"]`, grnData.items[i].productId);
      await this.page.fill(`input[name="items[${i}].quantity"]`, grnData.items[i].quantity);
      await this.page.fill(`input[name="items[${i}].received_quantity"]`, grnData.items[i].receivedQuantity);
    }

    // Save GRN
    await this.page.click('button:has-text("Save")');
    await this.page.waitForLoadState('networkidle');

    return grnData;
  }

  async deleteTestGRN(grnNumber: string) {
    // Navigate to Warehouse module
    await this.page.click('a[href="/warehouse"]');
    await this.page.waitForLoadState('networkidle');

    // Click GRN tab
    await this.page.click('[data-testid="tab-grn"]');

    // Find and delete the GRN
    const grnRow = this.page.locator(`tr:has-text("${grnNumber}")`);
    if (await grnRow.count() > 0) {
      await grnRow.locator('button[aria-label="Delete"]').click();
      await this.page.click('button:has-text("Confirm")');
      await this.page.waitForLoadState('networkidle');
    }
  }

  async createTestUser(data: {
    email?: string;
    name?: string;
    role?: string;
    password?: string;
  }) {
    const userData = {
      email: data.email || `testuser${Date.now()}@forza.com`,
      name: data.name || `Test User ${Date.now()}`,
      role: data.role || 'Operator',
      password: data.password || 'password123',
    };

    // Navigate to Admin module
    await this.page.click('a[href="/admin"]');
    await this.page.waitForLoadState('networkidle');

    // Click User Management tab
    await this.page.click('[data-testid="tab-users"]');

    // Click Create User button
    await this.page.click('button:has-text("Create User")');
    await this.page.waitForSelector('.modal');

    // Fill user information
    await this.page.fill('input[name="email"]', userData.email);
    await this.page.fill('input[name="name"]', userData.name);
    await this.page.selectOption('select[name="role"]', userData.role);
    await this.page.fill('input[name="password"]', userData.password);

    // Save user
    await this.page.click('button:has-text("Save")');
    await this.page.waitForLoadState('networkidle');

    return userData;
  }

  async deleteTestUser(email: string) {
    // Navigate to Admin module
    await this.page.click('a[href="/admin"]');
    await this.page.waitForLoadState('networkidle');

    // Click User Management tab
    await this.page.click('[data-testid="tab-users"]');

    // Find and delete the user
    const userRow = this.page.locator(`tr:has-text("${email}")`);
    if (await userRow.count() > 0) {
      await userRow.locator('button[aria-label="Delete"]').click();
      await this.page.click('button:has-text("Confirm")');
      await this.page.waitForLoadState('networkidle');
    }
  }

  async cleanupAllTestData() {
    // This method would clean up all test data created during the test run
    // Implementation would depend on the specific cleanup requirements
    console.log('Cleaning up all test data...');
  }

  async waitForDataLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('[data-testid="loading"]', { state: 'hidden' });
  }

  async verifyDataExists(selector: string, expectedText: string) {
    await this.page.waitForSelector(selector);
    const element = this.page.locator(selector);
    await element.waitFor();
    const text = await element.textContent();
    if (!text?.includes(expectedText)) {
      throw new Error(`Expected "${expectedText}" but found "${text}"`);
    }
  }

  async verifyDataNotExists(selector: string, unexpectedText: string) {
    await this.page.waitForSelector(selector);
    const element = this.page.locator(selector);
    await element.waitFor();
    const text = await element.textContent();
    if (text?.includes(unexpectedText)) {
      throw new Error(`Unexpectedly found "${unexpectedText}" in "${text}"`);
    }
  }
}
