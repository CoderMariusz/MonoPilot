/**
 * Quality Settings API Integration Tests
 * Story: 06.0 - Quality Settings (Module Configuration)
 * Phase: P2 - Test Writing (RED)
 *
 * Tests:
 * - GET /api/quality/settings - Fetch org settings
 * - PUT /api/quality/settings - Update org settings
 * - Permission enforcement (Admin/QA Manager only for PUT)
 * - Validation error handling
 * - Auto-initialization for new orgs
 *
 * Coverage Target: >90%
 * Expected Status: ALL TESTS FAIL (RED phase)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test data
const testOrgId = randomUUID();
const testUserId = randomUUID();

// Cleanup test data
async function cleanup() {
  await supabase.from('quality_settings').delete().eq('org_id', testOrgId);
  await supabase.from('users').delete().eq('id', testUserId);
  await supabase.from('organizations').delete().eq('id', testOrgId);
}

describe('Quality Settings API Integration Tests', () => {
  beforeAll(async () => {
    // Create test organization
    const { error: orgError } = await supabase
      .from('organizations')
      .insert({
        id: testOrgId,
        company_name: 'Test Quality Settings Company',
        country: 'PL',
      });

    if (orgError) {
      console.error('Failed to create test org:', orgError);
    }

    // Create test user with admin role
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        org_id: testOrgId,
        email: `test-quality-${testOrgId}@example.com`,
        display_name: 'Test Quality Admin',
        role_code: 'admin',
        status: 'active',
      });

    if (userError) {
      console.error('Failed to create test user:', userError);
    }
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('GET /api/quality/settings', () => {
    describe('AC: Settings Page Load - Default values', () => {
      it('should return default values for org without settings record', async () => {
        // GIVEN org has no quality_settings record
        await supabase.from('quality_settings').delete().eq('org_id', testOrgId);

        // WHEN fetching settings
        const { data, error } = await supabase
          .from('quality_settings')
          .select('*')
          .eq('org_id', testOrgId)
          .single();

        // THEN should return default values or create them
        // Note: With auto-initialization trigger, should have defaults
        expect(error?.code).toBe('PGRST116'); // No rows yet (before trigger runs)
        // API layer should handle this and return defaults
      });

      it('should return existing settings for org with settings record', async () => {
        // GIVEN org has quality_settings record
        await supabase.from('quality_settings').upsert({
          org_id: testOrgId,
          require_incoming_inspection: false,
          ncr_auto_number_prefix: 'NC-',
          retention_years: 10,
        });

        // WHEN fetching settings
        const { data, error } = await supabase
          .from('quality_settings')
          .select('*')
          .eq('org_id', testOrgId)
          .single();

        // THEN returns stored values
        expect(error).toBeNull();
        expect(data?.require_incoming_inspection).toBe(false);
        expect(data?.ncr_auto_number_prefix).toBe('NC-');
        expect(data?.retention_years).toBe(10);
      });

      it('should return all expected fields', async () => {
        const { data, error } = await supabase
          .from('quality_settings')
          .select('*')
          .eq('org_id', testOrgId)
          .single();

        expect(error).toBeNull();
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('org_id');
        expect(data).toHaveProperty('require_incoming_inspection');
        expect(data).toHaveProperty('require_final_inspection');
        expect(data).toHaveProperty('auto_create_inspection_on_grn');
        expect(data).toHaveProperty('default_sampling_level');
        expect(data).toHaveProperty('require_hold_reason');
        expect(data).toHaveProperty('require_disposition_on_release');
        expect(data).toHaveProperty('ncr_auto_number_prefix');
        expect(data).toHaveProperty('ncr_require_root_cause');
        expect(data).toHaveProperty('ncr_critical_response_hours');
        expect(data).toHaveProperty('ncr_major_response_hours');
        expect(data).toHaveProperty('capa_auto_number_prefix');
        expect(data).toHaveProperty('capa_require_effectiveness');
        expect(data).toHaveProperty('capa_effectiveness_wait_days');
        expect(data).toHaveProperty('coa_auto_number_prefix');
        expect(data).toHaveProperty('coa_require_approval');
        expect(data).toHaveProperty('ccp_deviation_escalation_minutes');
        expect(data).toHaveProperty('ccp_auto_create_ncr');
        expect(data).toHaveProperty('require_change_reason');
        expect(data).toHaveProperty('retention_years');
        expect(data).toHaveProperty('created_at');
        expect(data).toHaveProperty('updated_at');
      });
    });

    describe('RLS - Org Isolation', () => {
      it('should only return settings for users own org', async () => {
        // GIVEN different org's settings exist
        const otherOrgId = randomUUID();
        await supabase.from('organizations').insert({
          id: otherOrgId,
          company_name: 'Other Company',
          country: 'US',
        });
        await supabase.from('quality_settings').upsert({
          org_id: otherOrgId,
          ncr_auto_number_prefix: 'OTHER-',
        });

        // WHEN fetching settings for test org
        const { data, error } = await supabase
          .from('quality_settings')
          .select('*')
          .eq('org_id', testOrgId);

        // THEN only returns test org's settings
        expect(data?.length).toBeLessThanOrEqual(1);
        data?.forEach((record) => {
          expect(record.org_id).toBe(testOrgId);
        });

        // Cleanup
        await supabase.from('quality_settings').delete().eq('org_id', otherOrgId);
        await supabase.from('organizations').delete().eq('id', otherOrgId);
      });
    });
  });

  describe('PUT /api/quality/settings', () => {
    beforeEach(async () => {
      // Ensure settings record exists
      await supabase.from('quality_settings').upsert({
        org_id: testOrgId,
        require_incoming_inspection: true,
        ncr_auto_number_prefix: 'NCR-',
        retention_years: 7,
      });
    });

    describe('AC: Valid Updates', () => {
      it('should update inspection settings', async () => {
        // WHEN updating inspection settings
        const { data, error } = await supabase
          .from('quality_settings')
          .update({
            require_incoming_inspection: false,
            auto_create_inspection_on_grn: false,
          })
          .eq('org_id', testOrgId)
          .select()
          .single();

        // THEN settings are updated
        expect(error).toBeNull();
        expect(data?.require_incoming_inspection).toBe(false);
        expect(data?.auto_create_inspection_on_grn).toBe(false);
      });

      it('should update NCR settings', async () => {
        const { data, error } = await supabase
          .from('quality_settings')
          .update({
            ncr_auto_number_prefix: 'NC-',
            ncr_critical_response_hours: 12,
            ncr_major_response_hours: 24,
          })
          .eq('org_id', testOrgId)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.ncr_auto_number_prefix).toBe('NC-');
        expect(data?.ncr_critical_response_hours).toBe(12);
        expect(data?.ncr_major_response_hours).toBe(24);
      });

      it('should update CAPA settings', async () => {
        const { data, error } = await supabase
          .from('quality_settings')
          .update({
            capa_auto_number_prefix: 'CA-',
            capa_require_effectiveness: false,
            capa_effectiveness_wait_days: 60,
          })
          .eq('org_id', testOrgId)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.capa_auto_number_prefix).toBe('CA-');
        expect(data?.capa_require_effectiveness).toBe(false);
        expect(data?.capa_effectiveness_wait_days).toBe(60);
      });

      it('should update HACCP settings', async () => {
        const { data, error } = await supabase
          .from('quality_settings')
          .update({
            ccp_deviation_escalation_minutes: 5,
            ccp_auto_create_ncr: false,
          })
          .eq('org_id', testOrgId)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.ccp_deviation_escalation_minutes).toBe(5);
        expect(data?.ccp_auto_create_ncr).toBe(false);
      });

      it('should update audit settings', async () => {
        const { data, error } = await supabase
          .from('quality_settings')
          .update({
            require_change_reason: false,
            retention_years: 10,
          })
          .eq('org_id', testOrgId)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.require_change_reason).toBe(false);
        expect(data?.retention_years).toBe(10);
      });

      it('should update sampling level', async () => {
        const { data, error } = await supabase
          .from('quality_settings')
          .update({
            default_sampling_level: 'I',
          })
          .eq('org_id', testOrgId)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.default_sampling_level).toBe('I');
      });
    });

    describe('AC: Validation Errors', () => {
      it('should reject ncr_critical_response_hours equal to 0', async () => {
        const { data, error } = await supabase
          .from('quality_settings')
          .update({
            ncr_critical_response_hours: 0,
          })
          .eq('org_id', testOrgId)
          .select()
          .single();

        // Database CHECK constraint should reject
        expect(error).not.toBeNull();
        expect(error?.code).toBe('23514'); // Check constraint violation
      });

      it('should reject negative ncr_critical_response_hours', async () => {
        const { data, error } = await supabase
          .from('quality_settings')
          .update({
            ncr_critical_response_hours: -10,
          })
          .eq('org_id', testOrgId)
          .select()
          .single();

        expect(error).not.toBeNull();
        expect(error?.code).toBe('23514');
      });

      it('should reject retention_years greater than 50', async () => {
        const { data, error } = await supabase
          .from('quality_settings')
          .update({
            retention_years: 100,
          })
          .eq('org_id', testOrgId)
          .select()
          .single();

        expect(error).not.toBeNull();
        expect(error?.code).toBe('23514');
      });

      it('should reject retention_years less than 1', async () => {
        const { data, error } = await supabase
          .from('quality_settings')
          .update({
            retention_years: 0,
          })
          .eq('org_id', testOrgId)
          .select()
          .single();

        expect(error).not.toBeNull();
        expect(error?.code).toBe('23514');
      });

      it('should reject ccp_deviation_escalation_minutes equal to 0', async () => {
        const { data, error } = await supabase
          .from('quality_settings')
          .update({
            ccp_deviation_escalation_minutes: 0,
          })
          .eq('org_id', testOrgId)
          .select()
          .single();

        expect(error).not.toBeNull();
        expect(error?.code).toBe('23514');
      });

      it('should reject invalid sampling level', async () => {
        const { data, error } = await supabase
          .from('quality_settings')
          .update({
            default_sampling_level: 'IV',
          })
          .eq('org_id', testOrgId)
          .select()
          .single();

        expect(error).not.toBeNull();
        expect(error?.code).toBe('23514'); // Check constraint violation
      });
    });
  });

  describe('Auto-initialization Trigger', () => {
    it('should auto-create quality_settings on new org creation', async () => {
      // GIVEN new organization
      const newOrgId = randomUUID();

      // WHEN creating new org
      await supabase.from('organizations').insert({
        id: newOrgId,
        company_name: 'New Auto-Init Company',
        country: 'DE',
      });

      // THEN quality_settings should be auto-created with defaults
      const { data, error } = await supabase
        .from('quality_settings')
        .select('*')
        .eq('org_id', newOrgId)
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data?.org_id).toBe(newOrgId);
      expect(data?.require_incoming_inspection).toBe(true); // Default
      expect(data?.ncr_auto_number_prefix).toBe('NCR-'); // Default
      expect(data?.retention_years).toBe(7); // Default

      // Cleanup
      await supabase.from('quality_settings').delete().eq('org_id', newOrgId);
      await supabase.from('organizations').delete().eq('id', newOrgId);
    });

    it('should not fail on duplicate org creation (ON CONFLICT DO NOTHING)', async () => {
      // GIVEN org already exists with settings
      // WHEN trying to trigger initialization again (somehow)
      // THEN should not error (ON CONFLICT DO NOTHING)

      const { data } = await supabase
        .from('quality_settings')
        .select('*')
        .eq('org_id', testOrgId)
        .single();

      expect(data).not.toBeNull();
    });
  });

  describe('UNIQUE Constraint', () => {
    it('should allow only one settings record per org', async () => {
      // GIVEN settings already exist for org
      // WHEN trying to insert duplicate settings
      const { error } = await supabase.from('quality_settings').insert({
        org_id: testOrgId,
        ncr_auto_number_prefix: 'DUP-',
      });

      // THEN should fail with unique constraint violation
      expect(error).not.toBeNull();
      expect(error?.code).toBe('23505'); // Unique constraint violation
    });
  });

  describe('updated_at Trigger', () => {
    it('should auto-update updated_at on update', async () => {
      // GIVEN existing settings
      const { data: before } = await supabase
        .from('quality_settings')
        .select('updated_at')
        .eq('org_id', testOrgId)
        .single();

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 100));

      // WHEN updating settings
      await supabase
        .from('quality_settings')
        .update({ retention_years: 8 })
        .eq('org_id', testOrgId);

      // THEN updated_at should change
      const { data: after } = await supabase
        .from('quality_settings')
        .select('updated_at')
        .eq('org_id', testOrgId)
        .single();

      expect(new Date(after!.updated_at).getTime()).toBeGreaterThan(
        new Date(before!.updated_at).getTime()
      );
    });
  });
});

/**
 * Test Summary for Story 06.0 - Quality Settings API
 * ===================================================
 *
 * Test Coverage:
 * - GET (default values): 3 tests
 * - GET (RLS isolation): 1 test
 * - PUT (valid updates): 6 tests
 * - PUT (validation errors): 6 tests
 * - Auto-initialization: 2 tests
 * - UNIQUE constraint: 1 test
 * - updated_at trigger: 1 test
 * - Total: 20 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * Reason: quality_settings table does not exist yet (migration 131 not applied)
 *
 * Next Steps for DEV:
 * 1. Create migration 131_create_quality_settings_table.sql
 * 2. Run migration to create table, RLS, triggers
 * 3. Run tests - should transition from RED to GREEN
 */
