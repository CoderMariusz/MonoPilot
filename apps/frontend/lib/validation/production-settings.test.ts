import { describe, it, expect } from 'vitest';
import { productionSettingsSchema, updateProductionSettingsSchema } from './production-settings';

/**
 * RED PHASE TESTS
 * These tests validate the Zod schemas for Production Settings.
 * They will fail because the validation file does not exist yet.
 */

describe('production-settings Validation', () => {
  describe('productionSettingsSchema', () => {
    it('should pass validation for a valid complete object', () => {
      const validInput = {
        allow_pause_wo: true,
        auto_complete_wo: false,
        require_operation_sequence: true,
        allow_over_consumption: false,
        allow_partial_lp_consumption: true,
        require_qa_on_output: true,
        auto_create_by_product_lp: true,
        enable_material_reservations: true,
        dashboard_refresh_seconds: 30,
        show_material_alerts: true,
        show_delay_alerts: true,
        show_quality_alerts: true,
        enable_oee_tracking: false,
        target_oee_percent: 85,
        enable_downtime_tracking: false,
      };

      const result = productionSettingsSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should fail validation if dashboard_refresh_seconds is less than 5', () => {
      const invalidInput = {
        dashboard_refresh_seconds: 3,
      };

      const result = productionSettingsSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 5 seconds');
      }
    });

    it('should fail validation if dashboard_refresh_seconds is greater than 300', () => {
      const invalidInput = {
        dashboard_refresh_seconds: 301,
      };

      const result = productionSettingsSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('not exceed 300 seconds');
      }
    });

    it('should fail validation if target_oee_percent is greater than 100', () => {
      const invalidInput = {
        target_oee_percent: 105,
      };

      const result = productionSettingsSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('between 0 and 100');
      }
    });

    it('should fail validation if target_oee_percent is less than 0', () => {
      const invalidInput = {
        target_oee_percent: -5,
      };

      const result = productionSettingsSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('between 0 and 100');
      }
    });

    it('should apply default values for missing fields', () => {
      const partialInput = {};

      const result = productionSettingsSchema.parse(partialInput);
      expect(result.dashboard_refresh_seconds).toBe(30);
      expect(result.allow_pause_wo).toBe(false);
      expect(result.target_oee_percent).toBe(85);
    });
  });

  describe('updateProductionSettingsSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        dashboard_refresh_seconds: 15,
      };

      const result = updateProductionSettingsSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dashboard_refresh_seconds).toBe(15);
      }
    });

    it('should still validate fields present in partial update', () => {
      const invalidPartial = {
        target_oee_percent: 150,
      };

      const result = updateProductionSettingsSchema.safeParse(invalidPartial);
      expect(result.success).toBe(false);
    });
  });
});
