/**
 * Quality Settings Service Unit Tests
 * Story: 06.0 - Quality Settings (Module Configuration)
 * Phase: P2 - Test Writing (RED)
 *
 * Tests the service layer for quality settings:
 * - get() - Get settings for current org (auto-initialize if missing)
 * - update(data) - Update settings (full replace)
 * - getDefaultSettings() - Returns default values
 *
 * Coverage Target: >90%
 * Expected Status: ALL TESTS FAIL (RED phase)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as QualitySettingsService from '../quality-settings-service';
import { DEFAULT_QUALITY_SETTINGS } from '@/lib/validation/quality-settings';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(),
}));

describe('Quality Settings Service', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('get()', () => {
    it('should return quality settings for authenticated user org', async () => {
      // GIVEN authenticated user with org
      const mockSettings = {
        id: 'settings-1',
        org_id: 'org-1',
        require_incoming_inspection: true,
        ncr_auto_number_prefix: 'NCR-',
        retention_years: 7,
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { org_id: 'org-1' },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: mockSettings,
        error: null,
      });

      // WHEN calling get()
      const result = await QualitySettingsService.get();

      // THEN returns settings
      expect(result).toEqual(mockSettings);
    });

    it('should auto-initialize settings if none exist (PGRST116)', async () => {
      // GIVEN no existing settings (PGRST116 = no rows)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { org_id: 'org-1' },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'new-settings', org_id: 'org-1', ...DEFAULT_QUALITY_SETTINGS },
        error: null,
      });

      // WHEN calling get()
      const result = await QualitySettingsService.get();

      // THEN auto-initializes with defaults
      expect(result.org_id).toBe('org-1');
      expect(result.require_incoming_inspection).toBe(true);
    });

    it('should throw error for unauthenticated user', async () => {
      // GIVEN no authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      // WHEN/THEN calling get() throws
      await expect(QualitySettingsService.get()).rejects.toThrow('Unauthorized');
    });

    it('should throw error if user not found in users table', async () => {
      // GIVEN authenticated user but not in users table
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // WHEN/THEN calling get() throws
      await expect(QualitySettingsService.get()).rejects.toThrow('User not found');
    });

    it('should throw error for database errors other than PGRST116', async () => {
      // GIVEN database error
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { org_id: 'org-1' },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: '42P01', message: 'relation does not exist' },
      });

      // WHEN/THEN calling get() throws
      await expect(QualitySettingsService.get()).rejects.toThrow();
    });
  });

  describe('update()', () => {
    it('should update quality settings for authenticated user org', async () => {
      // GIVEN authenticated user and valid update data
      const updateData = {
        ncr_critical_response_hours: 12,
        retention_years: 10,
      };
      const updatedSettings = {
        id: 'settings-1',
        org_id: 'org-1',
        ...updateData,
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { org_id: 'org-1' },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedSettings,
        error: null,
      });

      // WHEN calling update()
      const result = await QualitySettingsService.update(updateData);

      // THEN returns updated settings
      expect(result.ncr_critical_response_hours).toBe(12);
      expect(result.retention_years).toBe(10);
    });

    it('should throw error for unauthenticated user', async () => {
      // GIVEN no authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      // WHEN/THEN calling update() throws
      await expect(
        QualitySettingsService.update({ retention_years: 10 })
      ).rejects.toThrow('Unauthorized');
    });

    it('should handle partial updates correctly', async () => {
      // GIVEN single field update
      const updateData = { ncr_auto_number_prefix: 'NC-' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { org_id: 'org-1' },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'settings-1', org_id: 'org-1', ncr_auto_number_prefix: 'NC-' },
        error: null,
      });

      // WHEN calling update()
      const result = await QualitySettingsService.update(updateData);

      // THEN only specified field updated
      expect(result.ncr_auto_number_prefix).toBe('NC-');
    });

    it('should throw error for database update failure', async () => {
      // GIVEN database error
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { org_id: 'org-1' },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: '23514', message: 'check constraint violation' },
      });

      // WHEN/THEN calling update() throws
      await expect(
        QualitySettingsService.update({ retention_years: 100 })
      ).rejects.toThrow();
    });
  });

  describe('getDefaultSettings()', () => {
    it('should return default quality settings', () => {
      // WHEN calling getDefaultSettings()
      const defaults = QualitySettingsService.getDefaultSettings();

      // THEN returns all default values
      expect(defaults.require_incoming_inspection).toBe(true);
      expect(defaults.require_final_inspection).toBe(true);
      expect(defaults.auto_create_inspection_on_grn).toBe(true);
      expect(defaults.default_sampling_level).toBe('II');
    });

    it('should return correct NCR defaults', () => {
      const defaults = QualitySettingsService.getDefaultSettings();

      expect(defaults.ncr_auto_number_prefix).toBe('NCR-');
      expect(defaults.ncr_require_root_cause).toBe(true);
      expect(defaults.ncr_critical_response_hours).toBe(24);
      expect(defaults.ncr_major_response_hours).toBe(48);
    });

    it('should return correct CAPA defaults', () => {
      const defaults = QualitySettingsService.getDefaultSettings();

      expect(defaults.capa_auto_number_prefix).toBe('CAPA-');
      expect(defaults.capa_require_effectiveness).toBe(true);
      expect(defaults.capa_effectiveness_wait_days).toBe(30);
    });

    it('should return correct HACCP defaults', () => {
      const defaults = QualitySettingsService.getDefaultSettings();

      expect(defaults.ccp_deviation_escalation_minutes).toBe(15);
      expect(defaults.ccp_auto_create_ncr).toBe(true);
    });

    it('should return correct audit defaults', () => {
      const defaults = QualitySettingsService.getDefaultSettings();

      expect(defaults.require_change_reason).toBe(true);
      expect(defaults.retention_years).toBe(7);
    });
  });
});

describe('Quality Settings Service - Permission Checks', () => {
  describe('canUpdateQualitySettings()', () => {
    it('should return true for admin role', async () => {
      // GIVEN user with admin role
      const roleCode = 'admin';

      // WHEN checking permission
      const canUpdate = await QualitySettingsService.canUpdateQualitySettings(roleCode);

      // THEN returns true
      expect(canUpdate).toBe(true);
    });

    it('should return true for owner role', async () => {
      // GIVEN user with owner role
      const roleCode = 'owner';

      // WHEN checking permission
      const canUpdate = await QualitySettingsService.canUpdateQualitySettings(roleCode);

      // THEN returns true
      expect(canUpdate).toBe(true);
    });

    it('should return true for quality_manager role', async () => {
      // GIVEN user with quality_manager role
      const roleCode = 'quality_manager';

      // WHEN checking permission
      const canUpdate = await QualitySettingsService.canUpdateQualitySettings(roleCode);

      // THEN returns true (QA Manager can update quality settings)
      expect(canUpdate).toBe(true);
    });

    it('should return false for viewer role', async () => {
      // GIVEN user with viewer role
      const roleCode = 'viewer';

      // WHEN checking permission
      const canUpdate = await QualitySettingsService.canUpdateQualitySettings(roleCode);

      // THEN returns false
      expect(canUpdate).toBe(false);
    });

    it('should return false for production_operator role', async () => {
      // GIVEN user with production_operator role
      const roleCode = 'production_operator';

      // WHEN checking permission
      const canUpdate = await QualitySettingsService.canUpdateQualitySettings(roleCode);

      // THEN returns false
      expect(canUpdate).toBe(false);
    });

    it('should return false for quality_inspector role', async () => {
      // GIVEN user with quality_inspector role (not manager)
      const roleCode = 'quality_inspector';

      // WHEN checking permission
      const canUpdate = await QualitySettingsService.canUpdateQualitySettings(roleCode);

      // THEN returns false (only QA Manager, not inspector)
      expect(canUpdate).toBe(false);
    });

    it('should return false for warehouse_manager role', async () => {
      // GIVEN user with warehouse_manager role
      const roleCode = 'warehouse_manager';

      // WHEN checking permission
      const canUpdate = await QualitySettingsService.canUpdateQualitySettings(roleCode);

      // THEN returns false (different module)
      expect(canUpdate).toBe(false);
    });

    it('should return false for invalid role', async () => {
      // GIVEN invalid role
      const roleCode = 'hacker_role';

      // WHEN checking permission
      const canUpdate = await QualitySettingsService.canUpdateQualitySettings(roleCode);

      // THEN returns false
      expect(canUpdate).toBe(false);
    });

    it('should return false for undefined role', async () => {
      // GIVEN undefined role
      const roleCode = undefined as any;

      // WHEN checking permission
      const canUpdate = await QualitySettingsService.canUpdateQualitySettings(roleCode);

      // THEN returns false (secure default)
      expect(canUpdate).toBe(false);
    });
  });
});

/**
 * Test Summary for Story 06.0 - Quality Settings Service
 * ======================================================
 *
 * Test Coverage:
 * - get() method: 5 tests
 * - update() method: 4 tests
 * - getDefaultSettings() method: 5 tests
 * - canUpdateQualitySettings(): 9 tests
 * - Total: 23 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * Reason: quality-settings-service.ts implementations don't exist yet
 *
 * Next Steps for DEV:
 * 1. Implement get() with auto-initialization
 * 2. Implement update() with org_id filtering
 * 3. Implement getDefaultSettings() returning DEFAULT_QUALITY_SETTINGS
 * 4. Implement canUpdateQualitySettings() checking admin/owner/quality_manager
 * 5. Follow warehouse-settings-service.ts pattern
 */
