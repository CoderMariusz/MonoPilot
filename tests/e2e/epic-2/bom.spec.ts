/**
 * Epic 2 - BOM Tests (Stories 2.6-2.14)
 *
 * P0 Tests: Date overlap validation, circular detection, version integrity
 * Based on test-design-epic-2.md v1.2
 */
import { test, expect } from '@playwright/test';
import { createTestOrganization, createTestUser, supabaseAdmin } from '../fixtures/test-setup';

test.describe('Epic 2: BOM Management @p0 @epic2', () => {
  let orgId: string;
  let userId: string;
  let authToken: string;
  const createdProductIds: string[] = [];
  const createdBOMIds: string[] = [];
  const createdBOMItemIds: string[] = [];

  test.beforeAll(async () => {
    const org = await createTestOrganization();
    orgId = org.orgId;
    const user = await createTestUser(orgId);
    userId = user.userId;
    authToken = user.token;
  });

  test.afterAll(async () => {
    // Cleanup BOM items first
    if (createdBOMItemIds.length > 0) {
      await supabaseAdmin
        .from('bom_items')
        .delete()
        .in('id', createdBOMItemIds);
    }

    // Cleanup BOMs
    if (createdBOMIds.length > 0) {
      await supabaseAdmin
        .from('boms')
        .delete()
        .in('id', createdBOMIds);
    }

    // Cleanup products
    if (createdProductIds.length > 0) {
      await supabaseAdmin
        .from('products')
        .delete()
        .in('id', createdProductIds);
    }
  });

  async function createProduct(overrides: Record<string, any> = {}) {
    const code = `BOM-PROD-${Date.now()}-${Math.random().toString(36).substring(7)}`.toUpperCase();
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        code,
        name: 'BOM Test Product',
        type: 'Finished Good',
        uom: 'KG',
        org_id: orgId,
        ...overrides,
      })
      .select()
      .single();

    if (error) throw new Error(`createProduct: ${error.message}`);
    createdProductIds.push(data.id);
    return data;
  }

  async function createBOM(productId: string, overrides: Record<string, any> = {}) {
    const { data, error } = await supabaseAdmin
      .from('boms')
      .insert({
        product_id: productId,
        org_id: orgId,
        version: '1.0',
        effective_from: new Date().toISOString().split('T')[0],
        status: 'Draft',
        output_qty: 1.0,
        output_uom: 'KG',
        created_by: userId,
        updated_by: userId,
        ...overrides,
      })
      .select()
      .single();

    if (error) throw new Error(`createBOM: ${error.message}`);
    createdBOMIds.push(data.id);
    return data;
  }

  async function createBOMItem(bomId: string, componentProductId: string, overrides: Record<string, any> = {}) {
    const { data, error } = await supabaseAdmin
      .from('bom_items')
      .insert({
        bom_id: bomId,
        product_id: componentProductId,
        quantity: 1.0,
        uom: 'KG',
        sequence: 1,
        scrap_percent: 0,
        ...overrides,
      })
      .select()
      .single();

    if (error) throw new Error(`createBOMItem: ${error.message}`);
    createdBOMItemIds.push(data.id);
    return data;
  }

  test.describe('2.6 BOM CRUD @p0', () => {
    test('should create BOM with version and effective date', async () => {
      const product = await createProduct({ name: 'BOM Parent' });
      const bom = await createBOM(product.id, {
        version: '1.0',
        effective_from: '2024-01-01',
        status: 'Active',
      });

      expect(bom.id).toBeTruthy();
      expect(bom.version).toBe('1.0');
      expect(bom.status).toBe('Active');
    });

    test('should add items to BOM', async () => {
      const parent = await createProduct({ name: 'Parent Product', type: 'Finished Good' });
      const component = await createProduct({ name: 'Component', type: 'Raw Material' });

      const bom = await createBOM(parent.id);
      const item = await createBOMItem(bom.id, component.id, {
        quantity: 5.5,
        uom: 'KG',
        sequence: 1,
      });

      expect(item.bom_id).toBe(bom.id);
      expect(Number(item.quantity)).toBe(5.5);
    });
  });

  test.describe('2.7 BOM Date Overlap Validation @p0 @critical', () => {
    test('should allow non-overlapping BOMs for same product', async () => {
      const product = await createProduct({ name: 'Non-Overlap Test' });

      // First BOM: Jan-Jun 2024
      const bom1 = await createBOM(product.id, {
        version: '1.0',
        effective_from: '2024-01-01',
        effective_to: '2024-06-30',
        status: 'Active',
      });

      // Second BOM: Jul+ 2024 (no overlap)
      const bom2 = await createBOM(product.id, {
        version: '2.0',
        effective_from: '2024-07-01',
        effective_to: null,
        status: 'Active',
      });

      expect(bom1.id).toBeTruthy();
      expect(bom2.id).toBeTruthy();
    });

    test('should detect overlapping date ranges', async () => {
      const product = await createProduct({ name: 'Overlap Check' });

      // Create first BOM
      await createBOM(product.id, {
        version: '1.0',
        effective_from: '2024-01-01',
        effective_to: '2024-12-31',
        status: 'Active',
      });

      // Check if overlapping dates can be detected
      // (This may need application-level validation or DB trigger)
      const { data: overlapping } = await supabaseAdmin
        .from('boms')
        .select('*')
        .eq('product_id', product.id)
        .eq('status', 'Active')
        .lte('effective_from', '2024-06-15')
        .or('effective_to.is.null,effective_to.gte.2024-06-15');

      expect(overlapping?.length).toBeGreaterThan(0);
    });
  });

  test.describe('2.8 Circular BOM Detection @p0 @critical', () => {
    test('should create valid linear BOM hierarchy (RM → SF → FG)', async () => {
      const rawMaterial = await createProduct({ name: 'Raw Material', type: 'Raw Material' });
      const semiFinished = await createProduct({ name: 'Semi-Finished', type: 'Semi-Finished' });
      const finishedGood = await createProduct({ name: 'Finished Good', type: 'Finished Good' });

      // SF uses RM
      const bomSF = await createBOM(semiFinished.id);
      await createBOMItem(bomSF.id, rawMaterial.id, { quantity: 2 });

      // FG uses SF
      const bomFG = await createBOM(finishedGood.id);
      await createBOMItem(bomFG.id, semiFinished.id, { quantity: 1 });

      // Verify hierarchy is valid
      const { data: items } = await supabaseAdmin
        .from('bom_items')
        .select('bom_id, product_id')
        .in('bom_id', [bomSF.id, bomFG.id]);

      expect(items?.length).toBe(2);
    });

    test('should detect potential circular reference scenario', async () => {
      // Create A, B, C products
      const productA = await createProduct({ name: 'Circle A', type: 'Finished Good' });
      const productB = await createProduct({ name: 'Circle B', type: 'Semi-Finished' });
      const productC = await createProduct({ name: 'Circle C', type: 'Semi-Finished' });

      // A uses B
      const bomA = await createBOM(productA.id);
      await createBOMItem(bomA.id, productB.id);

      // B uses C
      const bomB = await createBOM(productB.id);
      await createBOMItem(bomB.id, productC.id);

      // If C tries to use A, it would be circular
      // This test documents the scenario - validation should be in app layer
      const bomC = await createBOM(productC.id);

      // Query to check if adding A as component of C would create cycle
      // (Application should prevent this)
      const wouldBeCircular = await checkCircularReference(productC.id, productA.id);
      expect(wouldBeCircular).toBe(true);
    });
  });

  // Helper function to check circular reference
  // Returns true if adding componentProductId to parentProductId's BOM would create a cycle
  // Scenario: A uses B, B uses C. checkCircularReference(C, A) = true because A->B->C->A would be a cycle
  async function checkCircularReference(parentProductId: string, componentProductId: string): Promise<boolean> {
    // We want to add componentProductId as a component of parentProductId
    // This creates a cycle if componentProductId (directly or indirectly) uses parentProductId
    // i.e., if parentProductId is somewhere in the dependency chain of componentProductId

    const visited = new Set<string>();
    const stack = [componentProductId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);

      // Get BOM for current product to find what it uses
      const { data: boms } = await supabaseAdmin
        .from('boms')
        .select('id')
        .eq('product_id', current);

      if (!boms || boms.length === 0) continue;

      // Get components used by current product's BOM
      for (const bom of boms) {
        const { data: items } = await supabaseAdmin
          .from('bom_items')
          .select('product_id')
          .eq('bom_id', bom.id);

        for (const item of items || []) {
          // If we find parentProductId in the dependency chain, it's circular
          if (item.product_id === parentProductId) return true;

          if (!visited.has(item.product_id)) {
            stack.push(item.product_id);
          }
        }
      }
    }

    return false;
  }

  test.describe('2.12 By-Products @p1', () => {
    test('should create BOM item marked as by-product', async () => {
      const mainProduct = await createProduct({ name: 'Main Output', type: 'Finished Good' });
      const byProduct = await createProduct({ name: 'By-Product Waste', type: 'By-Product' });
      const input = await createProduct({ name: 'Input Material', type: 'Raw Material' });

      const bom = await createBOM(mainProduct.id);

      // Add input
      await createBOMItem(bom.id, input.id, { sequence: 1 });

      // Add by-product
      const byProductItem = await createBOMItem(bom.id, byProduct.id, {
        sequence: 2,
        is_by_product: true,
        yield_percent: 5,
      });

      expect(byProductItem.is_by_product).toBe(true);
      expect(Number(byProductItem.yield_percent)).toBe(5);
    });
  });

  test.describe('2.13 Conditional BOM Items @p1', () => {
    test('should create conditional BOM item with flags', async () => {
      const product = await createProduct({ name: 'Configurable' });
      const organicOption = await createProduct({ name: 'Organic Ingredient', type: 'Raw Material' });

      const bom = await createBOM(product.id);

      const conditionalItem = await createBOMItem(bom.id, organicOption.id, {
        condition_flags: ['organic', 'vegan'],
        condition_logic: 'AND',
      });

      expect(conditionalItem.condition_flags).toContain('organic');
      expect(conditionalItem.condition_logic).toBe('AND');
    });
  });

  test.describe('2.14 BOM Scrap Percentage @p2', () => {
    test('should set scrap percentage for BOM item', async () => {
      const product = await createProduct({ name: 'Scrap Test' });
      const component = await createProduct({ name: 'Scrap Component', type: 'Raw Material' });

      const bom = await createBOM(product.id);
      const item = await createBOMItem(bom.id, component.id, {
        quantity: 100,
        scrap_percent: 2.5,
      });

      expect(Number(item.scrap_percent)).toBe(2.5);
      // Effective quantity = 100 * (1 + 2.5/100) = 102.5
    });
  });
});
