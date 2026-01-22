/**
 * Spec Parameter Service - Unit Tests (Story 06.4)
 * Purpose: Test SpecParameterService validateValue method and pure functions
 * Phase: GREEN - Tests for validateValue (no server context needed)
 *
 * Note: Tests for CRUD operations (getBySpecId, create, update, delete, reorder, cloneToNewSpec)
 * require server context and are tested via API integration tests in __tests__/api/quality/spec-parameters.test.ts
 *
 * Coverage Target: 90%+ for validateValue
 * Test Count: 20 scenarios
 */

import { describe, it, expect } from 'vitest'
import {
  validateValue,
} from '@/lib/services/spec-parameter-service'
import type { QualitySpecParameter } from '@/lib/types/quality'

describe('SpecParameterService - validateValue (Story 06.4)', () => {
  const TEST_USER_ID = '44444444-4444-4444-4444-444444444444'

  // Helper to create test parameters
  const createTestParam = (overrides: Partial<QualitySpecParameter>): QualitySpecParameter => ({
    id: 'param-001',
    spec_id: 'spec-001',
    sequence: 1,
    parameter_name: 'Test Parameter',
    parameter_type: 'numeric',
    target_value: null,
    min_value: 60,
    max_value: 80,
    unit: 'C',
    test_method: 'Thermometer',
    instrument_required: false,
    instrument_id: null,
    instrument_name: null,
    is_critical: false,
    acceptance_criteria: null,
    sampling_instructions: null,
    created_at: '2024-01-01T00:00:00Z',
    created_by: TEST_USER_ID,
    updated_at: '2024-01-01T00:00:00Z',
    updated_by: TEST_USER_ID,
    ...overrides,
  })

  // ============================================
  // NUMERIC TYPE VALIDATION
  // ============================================
  describe('numeric type validation', () => {
    it('should validate numeric within range', () => {
      const param = createTestParam({ min_value: 60, max_value: 80 })
      const result = validateValue(param, 72)
      expect(result.valid).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should fail numeric below minimum', () => {
      const param = createTestParam({ min_value: 60, max_value: 80 })
      const result = validateValue(param, 50)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Below minimum')
    })

    it('should fail numeric above maximum', () => {
      const param = createTestParam({ min_value: 60, max_value: 80 })
      const result = validateValue(param, 90)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Above maximum')
    })

    it('should validate numeric at exact minimum', () => {
      const param = createTestParam({ min_value: 60, max_value: 80 })
      const result = validateValue(param, 60)
      expect(result.valid).toBe(true)
    })

    it('should validate numeric at exact maximum', () => {
      const param = createTestParam({ min_value: 60, max_value: 80 })
      const result = validateValue(param, 80)
      expect(result.valid).toBe(true)
    })

    it('should validate numeric only min value', () => {
      const param = createTestParam({ min_value: 60, max_value: null })
      const result1 = validateValue(param, 70)
      expect(result1.valid).toBe(true)

      const result2 = validateValue(param, 50)
      expect(result2.valid).toBe(false)
    })

    it('should validate numeric only max value', () => {
      const param = createTestParam({ min_value: null, max_value: 80 })
      const result1 = validateValue(param, 70)
      expect(result1.valid).toBe(true)

      const result2 = validateValue(param, 90)
      expect(result2.valid).toBe(false)
    })

    it('should parse string numeric values', () => {
      const param = createTestParam({ min_value: 60, max_value: 80 })
      const result = validateValue(param, '72')
      expect(result.valid).toBe(true)
    })

    it('should fail invalid numeric string', () => {
      const param = createTestParam({ min_value: 60, max_value: 80 })
      const result = validateValue(param, 'not-a-number')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Invalid numeric')
    })

    it('should handle no min/max for numeric', () => {
      const param = createTestParam({
        parameter_type: 'numeric',
        min_value: null,
        max_value: null,
      })
      const result = validateValue(param, 72)
      expect(result.valid).toBe(true)
    })
  })

  // ============================================
  // RANGE TYPE VALIDATION
  // ============================================
  describe('range type validation', () => {
    it('should validate range within min/max', () => {
      const param = createTestParam({
        parameter_type: 'range',
        min_value: 4.0,
        max_value: 6.5,
      })
      const result = validateValue(param, 5.2)
      expect(result.valid).toBe(true)
    })

    it('should fail range below minimum', () => {
      const param = createTestParam({
        parameter_type: 'range',
        min_value: 4.0,
        max_value: 6.5,
      })
      const result = validateValue(param, 3.5)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Below minimum')
    })

    it('should fail range above maximum', () => {
      const param = createTestParam({
        parameter_type: 'range',
        min_value: 4.0,
        max_value: 6.5,
      })
      const result = validateValue(param, 7.0)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Above maximum')
    })
  })

  // ============================================
  // BOOLEAN TYPE VALIDATION
  // ============================================
  describe('boolean type validation', () => {
    it('should validate boolean matches target', () => {
      const param = createTestParam({
        parameter_type: 'boolean',
        target_value: 'Yes',
        min_value: null,
        max_value: null,
      })
      const resultYes = validateValue(param, 'Yes')
      expect(resultYes.valid).toBe(true)

      const resultNo = validateValue(param, 'No')
      expect(resultNo.valid).toBe(false)
    })

    it('should validate boolean case-insensitive', () => {
      const param = createTestParam({
        parameter_type: 'boolean',
        target_value: 'Yes',
        min_value: null,
        max_value: null,
      })
      const result = validateValue(param, 'yes')
      expect(result.valid).toBe(true)
    })

    it('should allow boolean with no target', () => {
      const param = createTestParam({
        parameter_type: 'boolean',
        target_value: null,
        min_value: null,
        max_value: null,
      })
      const result = validateValue(param, 'yes')
      expect(result.valid).toBe(true)
    })
  })

  // ============================================
  // TEXT TYPE VALIDATION
  // ============================================
  describe('text type validation', () => {
    it('should allow text parameter (manual evaluation)', () => {
      const param = createTestParam({
        parameter_type: 'text',
        min_value: null,
        max_value: null,
      })
      const result = validateValue(param, 'Any value here')
      expect(result.valid).toBe(true)
    })

    it('should allow any text for text parameter', () => {
      const param = createTestParam({
        parameter_type: 'text',
        target_value: 'Golden Brown',
        min_value: null,
        max_value: null,
      })
      const result = validateValue(param, 'Dark Brown')
      // Text is manually evaluated, so always valid
      expect(result.valid).toBe(true)
    })
  })

  // ============================================
  // EDGE CASES
  // ============================================
  describe('edge cases', () => {
    it('should handle unknown parameter type', () => {
      const param = createTestParam({
        parameter_type: 'unknown' as any,
        min_value: null,
        max_value: null,
      })
      const result = validateValue(param, 72)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Unknown parameter type')
    })

    it('should handle negative values', () => {
      const param = createTestParam({ min_value: -40, max_value: 0 })
      const result1 = validateValue(param, -20)
      expect(result1.valid).toBe(true)

      const result2 = validateValue(param, -50)
      expect(result2.valid).toBe(false)
    })

    it('should handle decimal precision', () => {
      const param = createTestParam({ min_value: 4.123456, max_value: 6.654321 })
      const result = validateValue(param, 5.5)
      expect(result.valid).toBe(true)
    })

    it('should handle zero values', () => {
      const param = createTestParam({ min_value: 0, max_value: 100 })
      const result = validateValue(param, 0)
      expect(result.valid).toBe(true)
    })
  })
})
