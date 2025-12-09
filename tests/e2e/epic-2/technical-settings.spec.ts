/**
 * Epic 2 - Technical Settings Tests (Story 2.22)
 *
 * P1 Tests: Technical settings configuration per organization
 * Based on test-design-epic-2.md v1.2
 */
import { test, expect } from '@playwright/test';
import { createTestOrganization, createTestUser, supabaseAdmin } from '../fixtures/test-setup';

test.describe('Epic 2: Technical Settings @p1 @epic2', () => {
  let orgId: string;
  let userId: string;

  test.beforeAll(async () => {
    const org = await createTestOrganization();
    orgId = org.orgId;
    const user = await createTestUser(orgId);
    userId = user.userId;
  });

  test.afterAll(async () => {
    // Cleanup test settings (restore defaults or delete)
    await supabaseAdmin
      .from('technical_settings')
      .delete()
      .eq('org_id', orgId);
  });

  test.describe('2.22 Technical Settings CRUD @p1', () => {
    test('should create technical settings for organization', async () => {
      const { data, error } = await supabaseAdmin
        .from('technical_settings')
        .upsert({
          org_id: orgId,
          product_field_config: {
            required_fields: ['code', 'name', 'type', 'uom'],
            optional_fields: ['description', 'shelf_life_days'],
          },
          max_bom_versions: 10,
          use_conditional_flags: true,
          conditional_flags: ['organic', 'vegan', 'kosher', 'halal'],
          updated_by: userId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.org_id).toBe(orgId);
      expect(data?.max_bom_versions).toBe(10);
      expect(data?.use_conditional_flags).toBe(true);
    });

    test('should update technical settings', async () => {
      // First create settings
      await supabaseAdmin
        .from('technical_settings')
        .upsert({
          org_id: orgId,
          product_field_config: { required_fields: ['code'] },
          max_bom_versions: 5,
          updated_by: userId,
        });

      // Then update
      const { data, error } = await supabaseAdmin
        .from('technical_settings')
        .update({
          max_bom_versions: 15,
          use_conditional_flags: false,
          updated_by: userId,
        })
        .eq('org_id', orgId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.max_bom_versions).toBe(15);
      expect(data?.use_conditional_flags).toBe(false);
    });

    test('should retrieve technical settings by org_id', async () => {
      // Ensure settings exist
      await supabaseAdmin
        .from('technical_settings')
        .upsert({
          org_id: orgId,
          product_field_config: { test: true },
          max_bom_versions: 20,
          updated_by: userId,
        });

      const { data, error } = await supabaseAdmin
        .from('technical_settings')
        .select('*')
        .eq('org_id', orgId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.max_bom_versions).toBe(20);
    });
  });

  test.describe('2.22 Product Field Configuration @p1', () => {
    test('should store product field config as JSONB', async () => {
      const fieldConfig = {
        required_fields: ['code', 'name', 'type', 'uom'],
        optional_fields: ['description', 'shelf_life_days', 'storage_temp'],
        custom_fields: [
          { name: 'batch_size', type: 'number', required: false },
          { name: 'supplier_code', type: 'string', required: false },
        ],
      };

      const { data, error } = await supabaseAdmin
        .from('technical_settings')
        .upsert({
          org_id: orgId,
          product_field_config: fieldConfig,
          updated_by: userId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.product_field_config).toEqual(fieldConfig);
    });

    test('should allow complex nested field config', async () => {
      const complexConfig = {
        required_fields: ['code', 'name'],
        field_validations: {
          code: { pattern: '^[A-Z]{2,4}-\\d{4}$', max_length: 20 },
          name: { min_length: 3, max_length: 100 },
        },
        product_type_specific: {
          'Raw Material': { extra_fields: ['supplier', 'origin_country'] },
          'Finished Good': { extra_fields: ['shelf_life', 'storage_conditions'] },
        },
      };

      const { data, error } = await supabaseAdmin
        .from('technical_settings')
        .upsert({
          org_id: orgId,
          product_field_config: complexConfig,
          updated_by: userId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.product_field_config.field_validations).toBeDefined();
      expect(data?.product_field_config.product_type_specific).toBeDefined();
    });
  });

  test.describe('2.22 BOM Version Limits @p1', () => {
    test('should set max_bom_versions limit', async () => {
      const { data, error } = await supabaseAdmin
        .from('technical_settings')
        .upsert({
          org_id: orgId,
          product_field_config: {},
          max_bom_versions: 25,
          updated_by: userId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.max_bom_versions).toBe(25);
    });

    test('should allow null max_bom_versions (unlimited)', async () => {
      const { data, error } = await supabaseAdmin
        .from('technical_settings')
        .upsert({
          org_id: orgId,
          product_field_config: {},
          max_bom_versions: null,
          updated_by: userId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.max_bom_versions).toBeNull();
    });
  });

  test.describe('2.22 Conditional Flags @p1', () => {
    test('should enable conditional flags feature', async () => {
      const { data, error } = await supabaseAdmin
        .from('technical_settings')
        .upsert({
          org_id: orgId,
          product_field_config: {},
          use_conditional_flags: true,
          conditional_flags: ['organic', 'vegan', 'gluten-free', 'kosher', 'halal'],
          updated_by: userId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.use_conditional_flags).toBe(true);
      expect(data?.conditional_flags).toContain('organic');
      expect(data?.conditional_flags).toHaveLength(5);
    });

    test('should disable conditional flags feature', async () => {
      const { data, error } = await supabaseAdmin
        .from('technical_settings')
        .upsert({
          org_id: orgId,
          product_field_config: {},
          use_conditional_flags: false,
          conditional_flags: null,
          updated_by: userId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.use_conditional_flags).toBe(false);
    });

    test('should store custom conditional flags as array', async () => {
      const customFlags = ['premium', 'eco-friendly', 'fair-trade', 'non-gmo', 'local'];

      const { data, error } = await supabaseAdmin
        .from('technical_settings')
        .upsert({
          org_id: orgId,
          product_field_config: {},
          use_conditional_flags: true,
          conditional_flags: customFlags,
          updated_by: userId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.conditional_flags).toEqual(customFlags);
    });
  });

  test.describe('2.22 Settings Uniqueness @p0', () => {
    test('should enforce one settings record per org (upsert behavior)', async () => {
      // First insert
      await supabaseAdmin
        .from('technical_settings')
        .upsert({
          org_id: orgId,
          product_field_config: { version: 1 },
          max_bom_versions: 10,
          updated_by: userId,
        });

      // Second upsert should update, not create duplicate
      await supabaseAdmin
        .from('technical_settings')
        .upsert({
          org_id: orgId,
          product_field_config: { version: 2 },
          max_bom_versions: 20,
          updated_by: userId,
        });

      // Verify only one record exists
      const { data, error } = await supabaseAdmin
        .from('technical_settings')
        .select('*')
        .eq('org_id', orgId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0]?.max_bom_versions).toBe(20);
    });
  });
});
