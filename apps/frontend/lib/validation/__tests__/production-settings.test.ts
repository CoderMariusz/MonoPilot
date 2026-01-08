/**
 * Validation Schema Tests: Production Settings
 * Story: 04.5 - Production Settings
 * Phase: RED - Tests should FAIL (schema not yet implemented)
 *
 * Tests Zod validation schemas for Production Settings:
 * - productionSettingsSchema (full settings object)
 * - updateProductionSettingsSchema (partial updates)
 * - All 15 fields across 6 sections
 *
 * Related PRD: docs/1-BASELINE/product/modules/production.md (FR-PROD-017)
 */

import { describe, it, expect } from 'vitest'
import {
  productionSettingsSchema,
  updateProductionSettingsSchema,
  type ProductionSettingsInput,
  type UpdateProductionSettingsInput,
} from '@/lib/validation/production-settings'

describe('Production Settings Validation Schemas (Story 04.5)', () => {
  /**
   * Full Settings Schema Tests
   */
  describe('productionSettingsSchema', () => {
    describe('Valid Settings', () => {
      it('should accept valid full production settings object', () => {
        const validSettings: ProductionSettingsInput = {
          // WO Execution (Phase 0)
          allow_pause_wo: true,
          auto_complete_wo: false,
          require_operation_sequence: true,
          // Material Consumption (Phase 1)
          allow_over_consumption: false,
          allow_partial_lp_consumption: true,
          // Output (Phase 1)
          require_qa_on_output: true,
          auto_create_by_product_lp: true,
          // Reservations (Phase 1)
          enable_material_reservations: true,
          // Dashboard (Phase 0)
          dashboard_refresh_seconds: 30,
          show_material_alerts: true,
          show_delay_alerts: true,
          show_quality_alerts: true,
          // OEE (Phase 2)
          enable_oee_tracking: false,
          target_oee_percent: 85,
          enable_downtime_tracking: false,
        }

        const result = productionSettingsSchema.safeParse(validSettings)
        expect(result.success).toBe(true)
      })

      it('should accept settings with all defaults', () => {
        const result = productionSettingsSchema.safeParse({})
        expect(result.success).toBe(true)
        if (result.success) {
          // Verify all default values
          expect(result.data.allow_pause_wo).toBe(false)
          expect(result.data.auto_complete_wo).toBe(false)
          expect(result.data.require_operation_sequence).toBe(true)
          expect(result.data.allow_over_consumption).toBe(false)
          expect(result.data.allow_partial_lp_consumption).toBe(true)
          expect(result.data.require_qa_on_output).toBe(true)
          expect(result.data.auto_create_by_product_lp).toBe(true)
          expect(result.data.enable_material_reservations).toBe(true)
          expect(result.data.dashboard_refresh_seconds).toBe(30)
          expect(result.data.show_material_alerts).toBe(true)
          expect(result.data.show_delay_alerts).toBe(true)
          expect(result.data.show_quality_alerts).toBe(true)
          expect(result.data.enable_oee_tracking).toBe(false)
          expect(result.data.target_oee_percent).toBe(85)
          expect(result.data.enable_downtime_tracking).toBe(false)
        }
      })

      it('should accept settings with minimal fields', () => {
        const result = productionSettingsSchema.safeParse({
          allow_pause_wo: true,
        })
        expect(result.success).toBe(true)
      })
    })

    /**
     * WO Execution Settings (Phase 0)
     */
    describe('WO Execution Settings', () => {
      it('should accept boolean allow_pause_wo', () => {
        const result = productionSettingsSchema.safeParse({ allow_pause_wo: true })
        expect(result.success).toBe(true)
      })

      it('should reject non-boolean allow_pause_wo', () => {
        const result = productionSettingsSchema.safeParse({ allow_pause_wo: 'yes' })
        expect(result.success).toBe(false)
      })

      it('should accept boolean auto_complete_wo', () => {
        const result = productionSettingsSchema.safeParse({ auto_complete_wo: true })
        expect(result.success).toBe(true)
      })

      it('should reject non-boolean auto_complete_wo', () => {
        const result = productionSettingsSchema.safeParse({ auto_complete_wo: 1 })
        expect(result.success).toBe(false)
      })

      it('should accept boolean require_operation_sequence', () => {
        const result = productionSettingsSchema.safeParse({ require_operation_sequence: false })
        expect(result.success).toBe(true)
      })

      it('should reject non-boolean require_operation_sequence', () => {
        const result = productionSettingsSchema.safeParse({ require_operation_sequence: null })
        expect(result.success).toBe(false)
      })
    })

    /**
     * Material Consumption Settings (Phase 1)
     */
    describe('Material Consumption Settings', () => {
      it('should accept boolean allow_over_consumption', () => {
        const result = productionSettingsSchema.safeParse({ allow_over_consumption: true })
        expect(result.success).toBe(true)
      })

      it('should reject non-boolean allow_over_consumption', () => {
        const result = productionSettingsSchema.safeParse({ allow_over_consumption: 'false' })
        expect(result.success).toBe(false)
      })

      it('should accept boolean allow_partial_lp_consumption', () => {
        const result = productionSettingsSchema.safeParse({ allow_partial_lp_consumption: false })
        expect(result.success).toBe(true)
      })

      it('should reject non-boolean allow_partial_lp_consumption', () => {
        const result = productionSettingsSchema.safeParse({ allow_partial_lp_consumption: 0 })
        expect(result.success).toBe(false)
      })
    })

    /**
     * Output Settings (Phase 1)
     */
    describe('Output Settings', () => {
      it('should accept boolean require_qa_on_output', () => {
        const result = productionSettingsSchema.safeParse({ require_qa_on_output: false })
        expect(result.success).toBe(true)
      })

      it('should reject non-boolean require_qa_on_output', () => {
        const result = productionSettingsSchema.safeParse({ require_qa_on_output: 'true' })
        expect(result.success).toBe(false)
      })

      it('should accept boolean auto_create_by_product_lp', () => {
        const result = productionSettingsSchema.safeParse({ auto_create_by_product_lp: false })
        expect(result.success).toBe(true)
      })

      it('should reject non-boolean auto_create_by_product_lp', () => {
        const result = productionSettingsSchema.safeParse({ auto_create_by_product_lp: undefined })
        expect(result.success).toBe(false)
      })
    })

    /**
     * Reservations Settings (Phase 1)
     */
    describe('Reservations Settings', () => {
      it('should accept boolean enable_material_reservations', () => {
        const result = productionSettingsSchema.safeParse({ enable_material_reservations: false })
        expect(result.success).toBe(true)
      })

      it('should reject non-boolean enable_material_reservations', () => {
        const result = productionSettingsSchema.safeParse({ enable_material_reservations: 'yes' })
        expect(result.success).toBe(false)
      })
    })

    /**
     * Dashboard Settings (Phase 0)
     * AC-4, AC-5: dashboard_refresh_seconds validation (5-300)
     */
    describe('Dashboard Settings', () => {
      it('should accept dashboard_refresh_seconds at minimum (5)', () => {
        const result = productionSettingsSchema.safeParse({ dashboard_refresh_seconds: 5 })
        expect(result.success).toBe(true)
      })

      it('should accept dashboard_refresh_seconds at maximum (300)', () => {
        const result = productionSettingsSchema.safeParse({ dashboard_refresh_seconds: 300 })
        expect(result.success).toBe(true)
      })

      it('should accept dashboard_refresh_seconds in valid range (15)', () => {
        const result = productionSettingsSchema.safeParse({ dashboard_refresh_seconds: 15 })
        expect(result.success).toBe(true)
      })

      it('should reject dashboard_refresh_seconds below minimum (0)', () => {
        const result = productionSettingsSchema.safeParse({ dashboard_refresh_seconds: 0 })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 5 seconds')
        }
      })

      it('should reject dashboard_refresh_seconds below minimum (4)', () => {
        const result = productionSettingsSchema.safeParse({ dashboard_refresh_seconds: 4 })
        expect(result.success).toBe(false)
      })

      it('should reject dashboard_refresh_seconds above maximum (301)', () => {
        const result = productionSettingsSchema.safeParse({ dashboard_refresh_seconds: 301 })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('300 seconds')
        }
      })

      it('should reject non-integer dashboard_refresh_seconds', () => {
        const result = productionSettingsSchema.safeParse({ dashboard_refresh_seconds: 15.5 })
        expect(result.success).toBe(false)
      })

      it('should reject negative dashboard_refresh_seconds', () => {
        const result = productionSettingsSchema.safeParse({ dashboard_refresh_seconds: -10 })
        expect(result.success).toBe(false)
      })

      it('should accept boolean show_material_alerts', () => {
        const result = productionSettingsSchema.safeParse({ show_material_alerts: false })
        expect(result.success).toBe(true)
      })

      it('should accept boolean show_delay_alerts', () => {
        const result = productionSettingsSchema.safeParse({ show_delay_alerts: false })
        expect(result.success).toBe(true)
      })

      it('should accept boolean show_quality_alerts', () => {
        const result = productionSettingsSchema.safeParse({ show_quality_alerts: false })
        expect(result.success).toBe(true)
      })
    })

    /**
     * OEE Settings (Phase 2)
     * AC-6, AC-7: target_oee_percent validation (0-100)
     */
    describe('OEE Settings', () => {
      it('should accept enable_oee_tracking boolean', () => {
        const result = productionSettingsSchema.safeParse({ enable_oee_tracking: true })
        expect(result.success).toBe(true)
      })

      it('should accept target_oee_percent at minimum (0)', () => {
        const result = productionSettingsSchema.safeParse({ target_oee_percent: 0 })
        expect(result.success).toBe(true)
      })

      it('should accept target_oee_percent at maximum (100)', () => {
        const result = productionSettingsSchema.safeParse({ target_oee_percent: 100 })
        expect(result.success).toBe(true)
      })

      it('should accept target_oee_percent in valid range (85)', () => {
        const result = productionSettingsSchema.safeParse({ target_oee_percent: 85 })
        expect(result.success).toBe(true)
      })

      it('should accept target_oee_percent with decimals (85.5)', () => {
        const result = productionSettingsSchema.safeParse({ target_oee_percent: 85.5 })
        expect(result.success).toBe(true)
      })

      it('should reject target_oee_percent above maximum (110)', () => {
        const result = productionSettingsSchema.safeParse({ target_oee_percent: 110 })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('between 0 and 100')
        }
      })

      it('should reject target_oee_percent above maximum (105)', () => {
        const result = productionSettingsSchema.safeParse({ target_oee_percent: 105 })
        expect(result.success).toBe(false)
      })

      it('should reject negative target_oee_percent (-5)', () => {
        const result = productionSettingsSchema.safeParse({ target_oee_percent: -5 })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('between 0 and 100')
        }
      })

      it('should accept enable_downtime_tracking boolean', () => {
        const result = productionSettingsSchema.safeParse({ enable_downtime_tracking: true })
        expect(result.success).toBe(true)
      })
    })
  })

  /**
   * Partial Update Schema Tests
   * AC-14: PUT API updates specified fields only
   */
  describe('updateProductionSettingsSchema', () => {
    it('should accept empty update (no fields)', () => {
      const result = updateProductionSettingsSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should accept single field update', () => {
      const result = updateProductionSettingsSchema.safeParse({
        allow_pause_wo: true,
      })
      expect(result.success).toBe(true)
    })

    it('should accept multiple field update', () => {
      const result = updateProductionSettingsSchema.safeParse({
        allow_pause_wo: true,
        dashboard_refresh_seconds: 15,
        show_material_alerts: false,
      })
      expect(result.success).toBe(true)
    })

    it('should accept all fields update', () => {
      const result = updateProductionSettingsSchema.safeParse({
        allow_pause_wo: true,
        auto_complete_wo: true,
        require_operation_sequence: false,
        allow_over_consumption: true,
        allow_partial_lp_consumption: false,
        require_qa_on_output: false,
        auto_create_by_product_lp: false,
        enable_material_reservations: false,
        dashboard_refresh_seconds: 60,
        show_material_alerts: false,
        show_delay_alerts: false,
        show_quality_alerts: false,
        enable_oee_tracking: true,
        target_oee_percent: 90,
        enable_downtime_tracking: true,
      })
      expect(result.success).toBe(true)
    })

    it('should validate dashboard_refresh_seconds in partial update', () => {
      const result = updateProductionSettingsSchema.safeParse({
        dashboard_refresh_seconds: 3, // Invalid: below minimum
      })
      expect(result.success).toBe(false)
    })

    it('should validate target_oee_percent in partial update', () => {
      const result = updateProductionSettingsSchema.safeParse({
        target_oee_percent: 150, // Invalid: above maximum
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid field types in partial update', () => {
      const result = updateProductionSettingsSchema.safeParse({
        allow_pause_wo: 'yes', // Invalid: not boolean
      })
      expect(result.success).toBe(false)
    })

    it('should strip unknown fields', () => {
      const result = updateProductionSettingsSchema.safeParse({
        allow_pause_wo: true,
        unknown_field: 'should be stripped',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect('unknown_field' in result.data).toBe(false)
      }
    })
  })

  /**
   * Type Exports Verification
   */
  describe('Type Exports', () => {
    it('should export ProductionSettingsInput type', () => {
      // This test verifies the type exists at compile time
      const settings: ProductionSettingsInput = {
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
      }
      expect(settings).toBeDefined()
    })

    it('should export UpdateProductionSettingsInput type', () => {
      // This test verifies the type exists at compile time
      const update: UpdateProductionSettingsInput = {
        allow_pause_wo: true,
      }
      expect(update).toBeDefined()
    })
  })
})

/**
 * Test Summary for Story 04.5 - Production Settings Validation
 * ===========================================================
 *
 * Test Coverage:
 * - Full Settings Schema: 35+ tests
 *   - Valid settings acceptance
 *   - WO Execution (3 fields): 6 tests
 *   - Material Consumption (2 fields): 4 tests
 *   - Output (2 fields): 4 tests
 *   - Reservations (1 field): 2 tests
 *   - Dashboard (4 fields): 12 tests
 *   - OEE (3 fields): 9 tests
 * - Partial Update Schema: 8 tests
 * - Type Exports: 2 tests
 *
 * Total: 45+ test cases
 *
 * Acceptance Criteria Covered:
 * - AC-4: dashboard_refresh_seconds validation (5-300)
 * - AC-5: dashboard_refresh_seconds valid range
 * - AC-6: target_oee_percent validation (0-100)
 * - AC-7: target_oee_percent valid value (85)
 * - AC-14: Partial updates in PUT API
 * - AC-15: Validation error responses
 * - AC-16: target_oee_percent error (105)
 */
