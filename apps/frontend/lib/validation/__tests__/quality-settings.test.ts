/**
 * Quality Settings Validation Schema Tests
 * Story: 06.0 - Quality Settings (Module Configuration)
 * Phase: P2 - Test Writing (RED)
 *
 * Tests the Zod validation schemas for quality settings:
 * - updateQualitySettingsSchema (partial updates)
 * - Sampling level enum validation
 * - Numeric constraints (positive hours, max retention)
 * - Prefix string validation
 * - Cross-field validation (if any)
 *
 * Coverage Target: >90%
 * Expected Status: ALL TESTS FAIL (RED phase)
 */

import { describe, it, expect } from 'vitest';
import {
  updateQualitySettingsSchema,
  samplingLevelEnum,
  DEFAULT_QUALITY_SETTINGS,
  type QualitySettings,
  type UpdateQualitySettingsInput,
} from '../quality-settings';

describe('Quality Settings Validation Schema', () => {
  describe('updateQualitySettingsSchema', () => {
    describe('Valid inputs', () => {
      it('should accept empty object (all fields optional)', () => {
        const input = {};
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('should accept valid partial update with boolean fields', () => {
        const input = {
          require_incoming_inspection: false,
          require_final_inspection: true,
          auto_create_inspection_on_grn: false,
        };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('should accept valid NCR settings', () => {
        const input = {
          ncr_auto_number_prefix: 'NC-',
          ncr_require_root_cause: true,
          ncr_critical_response_hours: 12,
          ncr_major_response_hours: 48,
        };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('should accept valid CAPA settings', () => {
        const input = {
          capa_auto_number_prefix: 'CA-',
          capa_require_effectiveness: true,
          capa_effectiveness_wait_days: 60,
        };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('should accept valid HACCP settings', () => {
        const input = {
          ccp_deviation_escalation_minutes: 5,
          ccp_auto_create_ncr: true,
        };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('should accept valid audit settings', () => {
        const input = {
          require_change_reason: true,
          retention_years: 10,
        };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('should accept maximum valid values for numeric fields', () => {
        const input = {
          ncr_critical_response_hours: 168, // Max 1 week
          ncr_major_response_hours: 336, // Max 2 weeks
          capa_effectiveness_wait_days: 365, // Max 1 year
          ccp_deviation_escalation_minutes: 1440, // Max 24 hours
          retention_years: 50, // Max 50 years
        };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('should accept minimum valid values for numeric fields', () => {
        const input = {
          ncr_critical_response_hours: 1,
          ncr_major_response_hours: 1,
          capa_effectiveness_wait_days: 0,
          ccp_deviation_escalation_minutes: 1,
          retention_years: 1,
        };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });

    describe('Invalid inputs - NCR settings', () => {
      it('should reject ncr_auto_number_prefix with empty string', () => {
        const input = { ncr_auto_number_prefix: '' };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('at least 1');
        }
      });

      it('should reject ncr_auto_number_prefix exceeding 10 characters', () => {
        const input = { ncr_auto_number_prefix: 'VERYLONG-NCR-' };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('10');
        }
      });

      it('should reject ncr_critical_response_hours less than 1', () => {
        const input = { ncr_critical_response_hours: 0 };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('1');
        }
      });

      it('should reject ncr_critical_response_hours greater than 168', () => {
        const input = { ncr_critical_response_hours: 169 };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('should reject negative ncr_critical_response_hours', () => {
        const input = { ncr_critical_response_hours: -10 };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('should reject ncr_major_response_hours greater than 336', () => {
        const input = { ncr_major_response_hours: 400 };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    describe('Invalid inputs - CAPA settings', () => {
      it('should reject capa_auto_number_prefix with empty string', () => {
        const input = { capa_auto_number_prefix: '' };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('should reject capa_auto_number_prefix exceeding 10 characters', () => {
        const input = { capa_auto_number_prefix: 'VERYLONGCAPA' };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('should reject negative capa_effectiveness_wait_days', () => {
        const input = { capa_effectiveness_wait_days: -5 };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('should reject capa_effectiveness_wait_days greater than 365', () => {
        const input = { capa_effectiveness_wait_days: 400 };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    describe('Invalid inputs - CoA settings', () => {
      it('should reject coa_auto_number_prefix with empty string', () => {
        const input = { coa_auto_number_prefix: '' };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('should reject coa_auto_number_prefix exceeding 10 characters', () => {
        const input = { coa_auto_number_prefix: 'VERYLONGCOA-' };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    describe('Invalid inputs - HACCP settings', () => {
      it('should reject ccp_deviation_escalation_minutes less than 1', () => {
        const input = { ccp_deviation_escalation_minutes: 0 };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('should reject ccp_deviation_escalation_minutes greater than 1440', () => {
        const input = { ccp_deviation_escalation_minutes: 1500 };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('should reject negative ccp_deviation_escalation_minutes', () => {
        const input = { ccp_deviation_escalation_minutes: -15 };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    describe('Invalid inputs - Audit settings', () => {
      it('should reject retention_years less than 1', () => {
        const input = { retention_years: 0 };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('should reject retention_years greater than 50', () => {
        const input = { retention_years: 100 };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('50');
        }
      });

      it('should reject negative retention_years', () => {
        const input = { retention_years: -7 };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    describe('Invalid inputs - Type validation', () => {
      it('should reject non-integer ncr_critical_response_hours', () => {
        const input = { ncr_critical_response_hours: 12.5 };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('should reject non-integer retention_years', () => {
        const input = { retention_years: 7.5 };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('should reject string for boolean field', () => {
        const input = { require_incoming_inspection: 'true' };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('should reject number for prefix field', () => {
        const input = { ncr_auto_number_prefix: 123 };
        const result = updateQualitySettingsSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('samplingLevelEnum', () => {
    it('should accept valid general inspection levels', () => {
      const validLevels = ['I', 'II', 'III'];
      validLevels.forEach((level) => {
        const result = samplingLevelEnum.safeParse(level);
        expect(result.success).toBe(true);
      });
    });

    it('should accept valid special inspection levels', () => {
      const validLevels = ['S-1', 'S-2', 'S-3', 'S-4'];
      validLevels.forEach((level) => {
        const result = samplingLevelEnum.safeParse(level);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid sampling level', () => {
      const invalidLevels = ['IV', 'S-5', 'A', '1', '', 'II ', ' II'];
      invalidLevels.forEach((level) => {
        const result = samplingLevelEnum.safeParse(level);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('DEFAULT_QUALITY_SETTINGS', () => {
    it('should have all required default values', () => {
      expect(DEFAULT_QUALITY_SETTINGS).toBeDefined();
      expect(DEFAULT_QUALITY_SETTINGS.require_incoming_inspection).toBe(true);
      expect(DEFAULT_QUALITY_SETTINGS.require_final_inspection).toBe(true);
      expect(DEFAULT_QUALITY_SETTINGS.auto_create_inspection_on_grn).toBe(true);
      expect(DEFAULT_QUALITY_SETTINGS.default_sampling_level).toBe('II');
    });

    it('should have correct NCR defaults', () => {
      expect(DEFAULT_QUALITY_SETTINGS.ncr_auto_number_prefix).toBe('NCR-');
      expect(DEFAULT_QUALITY_SETTINGS.ncr_require_root_cause).toBe(true);
      expect(DEFAULT_QUALITY_SETTINGS.ncr_critical_response_hours).toBe(24);
      expect(DEFAULT_QUALITY_SETTINGS.ncr_major_response_hours).toBe(48);
    });

    it('should have correct CAPA defaults', () => {
      expect(DEFAULT_QUALITY_SETTINGS.capa_auto_number_prefix).toBe('CAPA-');
      expect(DEFAULT_QUALITY_SETTINGS.capa_require_effectiveness).toBe(true);
      expect(DEFAULT_QUALITY_SETTINGS.capa_effectiveness_wait_days).toBe(30);
    });

    it('should have correct CoA defaults', () => {
      expect(DEFAULT_QUALITY_SETTINGS.coa_auto_number_prefix).toBe('COA-');
      expect(DEFAULT_QUALITY_SETTINGS.coa_require_approval).toBe(false);
    });

    it('should have correct HACCP defaults', () => {
      expect(DEFAULT_QUALITY_SETTINGS.ccp_deviation_escalation_minutes).toBe(15);
      expect(DEFAULT_QUALITY_SETTINGS.ccp_auto_create_ncr).toBe(true);
    });

    it('should have correct audit defaults', () => {
      expect(DEFAULT_QUALITY_SETTINGS.require_change_reason).toBe(true);
      expect(DEFAULT_QUALITY_SETTINGS.retention_years).toBe(7);
    });

    it('should have correct hold defaults', () => {
      expect(DEFAULT_QUALITY_SETTINGS.require_hold_reason).toBe(true);
      expect(DEFAULT_QUALITY_SETTINGS.require_disposition_on_release).toBe(true);
    });
  });

  describe('Type exports', () => {
    it('should export QualitySettings type with all fields', () => {
      const settings: QualitySettings = {
        id: 'test-id',
        org_id: 'test-org-id',
        require_incoming_inspection: true,
        require_final_inspection: true,
        auto_create_inspection_on_grn: true,
        default_sampling_level: 'II',
        require_hold_reason: true,
        require_disposition_on_release: true,
        ncr_auto_number_prefix: 'NCR-',
        ncr_require_root_cause: true,
        ncr_critical_response_hours: 24,
        ncr_major_response_hours: 48,
        capa_auto_number_prefix: 'CAPA-',
        capa_require_effectiveness: true,
        capa_effectiveness_wait_days: 30,
        coa_auto_number_prefix: 'COA-',
        coa_require_approval: false,
        ccp_deviation_escalation_minutes: 15,
        ccp_auto_create_ncr: true,
        require_change_reason: true,
        retention_years: 7,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      expect(settings.id).toBeDefined();
    });

    it('should export UpdateQualitySettingsInput type for partial updates', () => {
      const update: UpdateQualitySettingsInput = {
        ncr_critical_response_hours: 12,
      };
      expect(update.ncr_critical_response_hours).toBe(12);
    });
  });
});

/**
 * Test Summary for Story 06.0 - Quality Settings Validation
 * ==========================================================
 *
 * Test Coverage:
 * - Valid inputs: 8 tests
 * - NCR validation: 6 tests
 * - CAPA validation: 4 tests
 * - CoA validation: 2 tests
 * - HACCP validation: 3 tests
 * - Audit validation: 3 tests
 * - Type validation: 4 tests
 * - Sampling level enum: 3 tests
 * - Default values: 7 tests
 * - Type exports: 2 tests
 * - Total: 42 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * Reason: quality-settings.ts exports don't exist yet
 *
 * Next Steps for DEV:
 * 1. Implement updateQualitySettingsSchema with Zod
 * 2. Implement samplingLevelEnum
 * 3. Define DEFAULT_QUALITY_SETTINGS constant
 * 4. Export QualitySettings and UpdateQualitySettingsInput types
 */
