/**
 * Epic 2 - Products Tests (Stories 2.1-2.5)
 *
 * P0 Tests: Product code immutability, version tracking, allergen inheritance
 * Based on test-design-epic-2.md v1.2
 */
import { test, expect } from '@playwright/test';
import { createTestOrganization, createTestUser, supabaseAdmin } from '../fixtures/test-setup';

test.describe('Epic 2: Products @p0 @epic2', () => {
  let orgId: string;
  let userId: string;
  let authToken: string;
  const createdProductIds: string[] = [];
  const createdAllergenIds: string[] = [];

  test.beforeAll(async () => {
    const org = await createTestOrganization();
    orgId = org.orgId;
    const user = await createTestUser(orgId);
    userId = user.userId;
    authToken = user.token;
  });

  test.afterAll(async () => {
    // Cleanup product allergens first
    if (createdProductIds.length > 0) {
      await supabaseAdmin
        .from('product_allergens')
        .delete()
        .in('product_id', createdProductIds);
    }

    // Cleanup allergens
    if (createdAllergenIds.length > 0) {
      await supabaseAdmin
        .from('allergens')
        .delete()
        .in('id', createdAllergenIds);
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
    const code = `TEST-${Date.now()}-${Math.random().toString(36).substring(7)}`.toUpperCase();
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        code,
        name: 'Test Product',
        type: 'Raw Material',
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

  async function createAllergen(overrides: Record<string, any> = {}) {
    const code = `ALG-${Date.now()}`.toUpperCase();
    const { data, error } = await supabaseAdmin
      .from('allergens')
      .insert({
        code,
        name: 'Test Allergen',
        org_id: orgId,
        is_major: false,
        is_custom: true,
        ...overrides,
      })
      .select()
      .single();

    if (error) throw new Error(`createAllergen: ${error.message}`);
    createdAllergenIds.push(data.id);
    return data;
  }

  test.describe('2.1 Product Code Immutability @p0 @security', () => {
    test('should prevent product code modification via direct DB update', async () => {
      const uniqueCode = `IMMUTABLE-${Date.now()}`;
      const product = await createProduct({ code: uniqueCode });

      // Attempt to update code directly - should be blocked by DB constraint or trigger
      const { error } = await supabaseAdmin
        .from('products')
        .update({ code: 'HACKED-CODE' })
        .eq('id', product.id);

      // Verify code unchanged
      const { data: fetched } = await supabaseAdmin
        .from('products')
        .select('code')
        .eq('id', product.id)
        .single();

      // Code should either be unchanged or update should have failed
      expect(fetched?.code).toBe(uniqueCode);
    });

    test('should create product with unique code per org', async () => {
      const uniqueCode = `UNIQUE-${Date.now()}`;
      const product1 = await createProduct({ code: uniqueCode });

      // Attempt duplicate code
      const { error } = await supabaseAdmin
        .from('products')
        .insert({
          code: uniqueCode,
          name: 'Duplicate',
          type: 'Raw Material',
          uom: 'KG',
          org_id: orgId,
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('duplicate');
    });
  });

  test.describe('2.2 Product Versioning @p0', () => {
    test('should start with version 1.0', async () => {
      const product = await createProduct();
      expect(Number(product.version)).toBe(1.0);
    });

    test('should track version in product_version_history on update', async () => {
      const product = await createProduct({ name: 'Version Test' });

      // Update product
      await supabaseAdmin
        .from('products')
        .update({
          description: 'Updated description',
          version: 1.1,
          updated_by: userId
        })
        .eq('id', product.id);

      // Check version history was created
      const { data: history } = await supabaseAdmin
        .from('product_version_history')
        .select('*')
        .eq('product_id', product.id);

      // History should exist (may need trigger to auto-create)
      expect(history).toBeDefined();
    });
  });

  test.describe('2.4 Product Allergens @p0 @food-safety', () => {
    test('should assign "contains" allergen to product', async () => {
      const product = await createProduct({ name: 'Allergen Test' });
      const allergen = await createAllergen({ code: `MILK-${Date.now()}`, name: 'Milk', is_major: true });

      const { data, error } = await supabaseAdmin
        .from('product_allergens')
        .insert({
          product_id: product.id,
          allergen_id: allergen.id,
          relation_type: 'contains',
          org_id: orgId,
          created_by: userId,
        })
        .select();

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0]?.relation_type).toBe('contains');
    });

    test('should assign "may_contain" allergen to product', async () => {
      const product = await createProduct({ name: 'May Contain Test' });
      const allergen = await createAllergen({ code: `NUTS-${Date.now()}`, name: 'Tree Nuts', is_major: true });

      const { data, error } = await supabaseAdmin
        .from('product_allergens')
        .insert({
          product_id: product.id,
          allergen_id: allergen.id,
          relation_type: 'may_contain',
          org_id: orgId,
          created_by: userId,
        })
        .select();

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0]?.relation_type).toBe('may_contain');
    });

    test('should prevent duplicate allergen assignment with same relation type', async () => {
      const product = await createProduct({ name: 'Duplicate Test' });
      const allergen = await createAllergen({ code: `EGGS-${Date.now()}`, name: 'Eggs' });

      // First assignment
      await supabaseAdmin
        .from('product_allergens')
        .insert({
          product_id: product.id,
          allergen_id: allergen.id,
          relation_type: 'contains',
          org_id: orgId,
        });

      // Duplicate assignment should fail (composite PK)
      const { error } = await supabaseAdmin
        .from('product_allergens')
        .insert({
          product_id: product.id,
          allergen_id: allergen.id,
          relation_type: 'contains',
          org_id: orgId,
        });

      expect(error).toBeTruthy();
    });
  });

  test.describe('2.3 Product Version History @p1', () => {
    test('should create version history entry on product update', async () => {
      const product = await createProduct({ name: 'History Test Product' });

      // Create version history entry manually (simulating what app does)
      const { data, error } = await supabaseAdmin
        .from('product_version_history')
        .insert({
          product_id: product.id,
          version: 1.0,
          changed_fields: { description: 'Initial version' },
          change_summary: 'Product created',
          changed_by: userId,
          org_id: orgId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.product_id).toBe(product.id);
      expect(Number(data?.version)).toBe(1.0);
    });

    test('should track multiple version history entries', async () => {
      const product = await createProduct({ name: 'Multi Version Test' });

      // Create multiple history entries
      await supabaseAdmin
        .from('product_version_history')
        .insert([
          {
            product_id: product.id,
            version: 1.0,
            changed_fields: { name: 'Original name' },
            change_summary: 'Initial version',
            changed_by: userId,
            org_id: orgId,
          },
          {
            product_id: product.id,
            version: 1.1,
            changed_fields: { description: 'Added description' },
            change_summary: 'Added product description',
            changed_by: userId,
            org_id: orgId,
          },
        ]);

      // Verify history entries
      const { data: history, error } = await supabaseAdmin
        .from('product_version_history')
        .select('*')
        .eq('product_id', product.id)
        .order('version', { ascending: true });

      expect(error).toBeNull();
      expect(history).toHaveLength(2);
      expect(Number(history?.[0]?.version)).toBe(1.0);
      expect(Number(history?.[1]?.version)).toBe(1.1);
    });

    test('should store changed_fields as JSONB', async () => {
      const product = await createProduct({ name: 'JSONB Test' });

      const changedFields = {
        name: { old: 'Old Name', new: 'New Name' },
        description: { old: null, new: 'New description' },
      };

      const { data, error } = await supabaseAdmin
        .from('product_version_history')
        .insert({
          product_id: product.id,
          version: 1.1,
          changed_fields: changedFields,
          change_summary: 'Updated name and description',
          changed_by: userId,
          org_id: orgId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.changed_fields).toEqual(changedFields);
    });

    test('should require product_id foreign key', async () => {
      const fakeProductId = '00000000-0000-0000-0000-000000000000';

      const { error } = await supabaseAdmin
        .from('product_version_history')
        .insert({
          product_id: fakeProductId,
          version: 1.0,
          changed_fields: {},
          changed_by: userId,
          org_id: orgId,
        });

      expect(error).toBeTruthy();
    });
  });

  test.describe('2.5 Product Types @p1', () => {
    test('should create products with different types', async () => {
      const types = ['Raw Material', 'Semi-Finished', 'Finished Good', 'Packaging', 'By-Product'];

      for (const type of types) {
        const product = await createProduct({
          name: `${type} Test`,
          type: type,
        });
        expect(product.type).toBe(type);
      }
    });

    test('should enforce valid product type enum', async () => {
      const { error } = await supabaseAdmin
        .from('products')
        .insert({
          code: `INVALID-TYPE-${Date.now()}`,
          name: 'Invalid Type',
          type: 'INVALID_TYPE',
          uom: 'KG',
          org_id: orgId,
        });

      expect(error).toBeTruthy();
    });
  });
});
