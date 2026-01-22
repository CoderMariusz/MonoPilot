/**
 * Quality Spec Parameter Validation Schema - Unit Tests (Story 06.4)
 * Purpose: Test Zod schemas for parameter creation, update, and reordering
 * Phase: RED - Tests FAIL until schemas are implemented
 *
 * Tests the Quality Spec Parameter Zod schemas which validate:
 * - createParameterSchema: Parameter types, acceptance criteria, validation rules
 * - updateParameterSchema: Partial updates with type-specific validation
 * - reorderParametersSchema: Parameter ID array validation
 *
 * Coverage Target: 95%+
 * Test Count: 67 scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-Add-01 to AC-Add-08: Parameter type validation
 * - AC-Edit-01 to AC-Edit-05: Update validation
 * - AC-Reorder-01 to AC-Reorder-03: Sequence validation
 * - AC-Critical-01 to AC-Critical-03: Critical flag validation
 * - AC-UOM-01 to AC-UOM-02: Unit of measure validation
 * - AC-Criteria-01 to AC-Criteria-02: Acceptance criteria validation
 */

import { describe, it, expect } from 'vitest'
import {
  createParameterSchema,
  updateParameterSchema,
  reorderParametersSchema,
} from '@/lib/validation/spec-parameter-schema'

describe('Quality Spec Parameter Validation Schemas (Story 06.4)', () => {
  const TEST_SPEC_ID = '550e8400-e29b-41d4-a716-446655440000'
  const TEST_USER_ID = '660e8400-e29b-41d4-a716-446655440001'

  // ============================================
  // CREATE PARAMETER SCHEMA TESTS
  // ============================================
  describe('createParameterSchema', () => {
    // Test parameter_name validation
    describe('parameter_name field', () => {
      it('should require parameter_name', () => {
        const data = {
          parameter_type: 'numeric',
          min_value: 5,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some(i => i.path.includes('parameter_name'))).toBe(true)
        }
      })

      it('should accept valid parameter_name (2+ characters)', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 5,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject parameter_name < 2 characters', () => {
        const data = {
          parameter_name: 'T',
          parameter_type: 'numeric',
          min_value: 5,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 2 characters')
        }
      })

      it('should reject parameter_name > 200 characters', () => {
        const longName = 'A'.repeat(201)
        const data = {
          parameter_name: longName,
          parameter_type: 'numeric',
          min_value: 5,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('must not exceed 200 characters')
        }
      })

      it('should reject null parameter_name', () => {
        const data = {
          parameter_name: null,
          parameter_type: 'numeric',
          min_value: 5,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // Test parameter_type validation
    describe('parameter_type field', () => {
      it('should require parameter_type', () => {
        const data = {
          parameter_name: 'Temperature',
          min_value: 5,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some(i => i.path.includes('parameter_type'))).toBe(true)
        }
      })

      it('should accept parameter_type = "numeric"', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 5,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept parameter_type = "text"', () => {
        const data = {
          parameter_name: 'Color',
          parameter_type: 'text',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept parameter_type = "boolean"', () => {
        const data = {
          parameter_name: 'Presence',
          parameter_type: 'boolean',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept parameter_type = "range"', () => {
        const data = {
          parameter_name: 'pH Range',
          parameter_type: 'range',
          min_value: 4.0,
          max_value: 6.5,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject invalid parameter_type', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'invalid',
          min_value: 5,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // Test numeric type validation
    describe('numeric type validation', () => {
      it('should require at least min_value or max_value for numeric', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some(i => i.message.includes('at least one'))).toBe(true)
        }
      })

      it('should accept numeric with only min_value', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept numeric with only max_value', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          max_value: 80,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept numeric with both min and max', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          max_value: 80,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject numeric when min_value >= max_value', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 80,
          max_value: 60,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some(i => i.message.includes('less than'))).toBe(true)
        }
      })

      it('should accept optional target_value for numeric', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          max_value: 80,
          target_value: '72',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    // Test range type validation (stricter than numeric)
    describe('range type validation', () => {
      it('should require both min_value and max_value for range', () => {
        const data = {
          parameter_name: 'pH Range',
          parameter_type: 'range',
          min_value: 4.0,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some(i => i.message.includes('both'))).toBe(true)
        }
      })

      it('should require max_value for range', () => {
        const data = {
          parameter_name: 'pH Range',
          parameter_type: 'range',
          min_value: 4.0,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should accept range with both min and max', () => {
        const data = {
          parameter_name: 'pH Range',
          parameter_type: 'range',
          min_value: 4.0,
          max_value: 6.5,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject range when min >= max', () => {
        const data = {
          parameter_name: 'pH Range',
          parameter_type: 'range',
          min_value: 6.5,
          max_value: 4.0,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should accept optional target_value for range', () => {
        const data = {
          parameter_name: 'pH Range',
          parameter_type: 'range',
          min_value: 4.0,
          max_value: 6.5,
          target_value: '5.2',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    // Test text type validation
    describe('text type validation', () => {
      it('should accept text type with no min/max values', () => {
        const data = {
          parameter_name: 'Color',
          parameter_type: 'text',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept text with target_value', () => {
        const data = {
          parameter_name: 'Color',
          parameter_type: 'text',
          target_value: 'Golden Brown',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept text with acceptance_criteria', () => {
        const data = {
          parameter_name: 'Color',
          parameter_type: 'text',
          acceptance_criteria: 'Must be uniform golden brown. No dark spots.',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept text with both target and criteria', () => {
        const data = {
          parameter_name: 'Color',
          parameter_type: 'text',
          target_value: 'Golden Brown',
          acceptance_criteria: 'Must be uniform golden brown. No dark spots.',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    // Test boolean type validation
    describe('boolean type validation', () => {
      it('should accept boolean type', () => {
        const data = {
          parameter_name: 'Presence',
          parameter_type: 'boolean',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept boolean with target_value = "Yes"', () => {
        const data = {
          parameter_name: 'Presence',
          parameter_type: 'boolean',
          target_value: 'Yes',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept boolean with target_value = "No"', () => {
        const data = {
          parameter_name: 'Presence',
          parameter_type: 'boolean',
          target_value: 'No',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    // Test unit field validation
    describe('unit field validation', () => {
      it('should accept optional unit', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          unit: '°C',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject unit > 50 characters', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          unit: 'A'.repeat(51),
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should accept common unit symbols', () => {
        const units = ['°C', 'kg', 'mL', 'pH', '%', 'ppm', 'g']

        units.forEach(unit => {
          const data = {
            parameter_name: 'Test',
            parameter_type: 'numeric',
            min_value: 0,
            unit,
          }

          const result = createParameterSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })
    })

    // Test test_method field validation
    describe('test_method field validation', () => {
      it('should accept optional test_method', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          test_method: 'ISO 5509',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject test_method > 200 characters', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          test_method: 'A'.repeat(201),
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should accept common AOAC methods', () => {
        const methods = ['AOAC 942.15', 'AOAC 990.03', 'Visual Inspection', 'pH Meter']

        methods.forEach(method => {
          const data = {
            parameter_name: 'Test',
            parameter_type: 'numeric',
            min_value: 0,
            test_method: method,
          }

          const result = createParameterSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })
    })

    // Test critical flag validation
    describe('is_critical field validation', () => {
      it('should accept is_critical = true', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          is_critical: true,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept is_critical = false', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          is_critical: false,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should default is_critical to false', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.is_critical).toBe(false)
        }
      })
    })

    // Test acceptance_criteria field validation
    describe('acceptance_criteria field validation', () => {
      it('should accept optional acceptance_criteria', () => {
        const data = {
          parameter_name: 'Color',
          parameter_type: 'text',
          acceptance_criteria: 'Must be uniform golden brown',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject acceptance_criteria > 1000 characters', () => {
        const data = {
          parameter_name: 'Color',
          parameter_type: 'text',
          acceptance_criteria: 'A'.repeat(1001),
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should accept 1000 character acceptance_criteria', () => {
        const data = {
          parameter_name: 'Color',
          parameter_type: 'text',
          acceptance_criteria: 'A'.repeat(1000),
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    // Test sampling_instructions field validation
    describe('sampling_instructions field validation', () => {
      it('should accept optional sampling_instructions', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          sampling_instructions: 'Sample 5 units randomly from each pallet',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject sampling_instructions > 1000 characters', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          sampling_instructions: 'A'.repeat(1001),
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should accept 1000 character sampling_instructions', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          sampling_instructions: 'A'.repeat(1000),
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    // Test instrument fields validation
    describe('instrument fields validation', () => {
      it('should accept instrument_required = true', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          instrument_required: true,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept instrument_id as UUID', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          instrument_required: true,
          instrument_id: '550e8400-e29b-41d4-a716-446655440000',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject invalid instrument_id UUID', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          instrument_required: true,
          instrument_id: 'not-a-uuid',
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should accept null instrument_id', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          instrument_required: false,
          instrument_id: null,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    // Test target_value field validation
    describe('target_value field validation', () => {
      it('should reject target_value > 500 characters', () => {
        const data = {
          parameter_name: 'Color',
          parameter_type: 'text',
          target_value: 'A'.repeat(501),
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should accept 500 character target_value', () => {
        const data = {
          parameter_name: 'Color',
          parameter_type: 'text',
          target_value: 'A'.repeat(500),
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    // Test numeric value precision
    describe('numeric value precision validation', () => {
      it('should accept decimal values with up to 6 decimal places', () => {
        const data = {
          parameter_name: 'pH',
          parameter_type: 'range',
          min_value: 4.123456,
          max_value: 6.123456,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept integer values', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 60,
          max_value: 80,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept negative values', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: -40,
          max_value: 0,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept zero values', () => {
        const data = {
          parameter_name: 'Temperature',
          parameter_type: 'numeric',
          min_value: 0,
          max_value: 100,
        }

        const result = createParameterSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  // ============================================
  // UPDATE PARAMETER SCHEMA TESTS
  // ============================================
  describe('updateParameterSchema', () => {
    it('should allow partial updates with only parameter_name', () => {
      const data = {
        parameter_name: 'Updated Name',
      }

      const result = updateParameterSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should allow partial updates with only min_value', () => {
      const data = {
        min_value: 50,
      }

      const result = updateParameterSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should allow updating parameter type', () => {
      const data = {
        parameter_type: 'text',
      }

      const result = updateParameterSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should allow updating critical flag', () => {
      const data = {
        is_critical: true,
      }

      const result = updateParameterSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should validate min < max when both provided in update', () => {
      const data = {
        min_value: 80,
        max_value: 60,
      }

      const result = updateParameterSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should accept empty object for update', () => {
      const data = {}

      const result = updateParameterSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should validate all fields when provided in update', () => {
      const data = {
        parameter_name: 'Updated Temperature',
        parameter_type: 'numeric',
        min_value: 60,
        max_value: 80,
        target_value: '72',
        unit: '°C',
        test_method: 'Thermometer',
        is_critical: true,
        acceptance_criteria: 'Must reach temp quickly',
        sampling_instructions: 'Place probe in center',
        instrument_required: true,
      }

      const result = updateParameterSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  // ============================================
  // REORDER PARAMETERS SCHEMA TESTS
  // ============================================
  describe('reorderParametersSchema', () => {
    it('should require parameter_ids array', () => {
      const data = {}

      const result = reorderParametersSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('parameter_ids'))).toBe(true)
      }
    })

    it('should require non-empty parameter_ids array', () => {
      const data = {
        parameter_ids: [],
      }

      const result = reorderParametersSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('At least one'))).toBe(true)
      }
    })

    it('should accept single parameter ID', () => {
      const data = {
        parameter_ids: ['550e8400-e29b-41d4-a716-446655440000'],
      }

      const result = reorderParametersSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept multiple parameter IDs', () => {
      const data = {
        parameter_ids: [
          '550e8400-e29b-41d4-a716-446655440000',
          '660e8400-e29b-41d4-a716-446655440001',
          '770e8400-e29b-41d4-a716-446655440002',
        ],
      }

      const result = reorderParametersSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID in parameter_ids', () => {
      const data = {
        parameter_ids: ['not-a-uuid'],
      }

      const result = reorderParametersSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject mixed valid and invalid UUIDs', () => {
      const data = {
        parameter_ids: [
          '550e8400-e29b-41d4-a716-446655440000',
          'invalid-uuid',
        ],
      }

      const result = reorderParametersSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject null in parameter_ids array', () => {
      const data = {
        parameter_ids: [null],
      }

      const result = reorderParametersSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should preserve order of parameter IDs', () => {
      const ids = [
        '770e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440000',
        '660e8400-e29b-41d4-a716-446655440001',
      ]
      const data = {
        parameter_ids: ids,
      }

      const result = reorderParametersSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.parameter_ids).toEqual(ids)
      }
    })
  })

  // ============================================
  // INTEGRATION: Full Create Workflows
  // ============================================
  describe('Complete parameter workflows', () => {
    it('should accept complete numeric parameter', () => {
      const data = {
        parameter_name: 'Baking Temperature',
        parameter_type: 'numeric',
        min_value: 160,
        max_value: 180,
        target_value: '170',
        unit: '°C',
        test_method: 'Thermometer',
        is_critical: true,
        acceptance_criteria: 'Must be consistent throughout baking',
        sampling_instructions: 'Check every 30 seconds',
        instrument_required: true,
        instrument_id: '550e8400-e29b-41d4-a716-446655440000',
      }

      const result = createParameterSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept complete text parameter', () => {
      const data = {
        parameter_name: 'Color Quality',
        parameter_type: 'text',
        target_value: 'Golden Brown',
        unit: null,
        test_method: 'Visual Inspection',
        is_critical: true,
        acceptance_criteria: 'Uniform golden brown color without dark spots or burning',
        sampling_instructions: 'Inspect top, middle, and bottom surface of bread',
        instrument_required: false,
      }

      const result = createParameterSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept complete boolean parameter', () => {
      const data = {
        parameter_name: 'Package Seal Integrity',
        parameter_type: 'boolean',
        target_value: 'Yes',
        test_method: 'Visual + Manual Check',
        is_critical: true,
        acceptance_criteria: 'Seal must hold without separation',
        sampling_instructions: 'Check seal along entire edge',
        instrument_required: false,
      }

      const result = createParameterSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept complete range parameter', () => {
      const data = {
        parameter_name: 'pH Level',
        parameter_type: 'range',
        min_value: 4.0,
        max_value: 6.5,
        target_value: '5.2',
        unit: 'pH',
        test_method: 'AOAC 942.15',
        is_critical: false,
        acceptance_criteria: 'pH must remain stable to ensure shelf stability',
        sampling_instructions: 'Sample from 3 locations in each batch',
        instrument_required: true,
        instrument_id: '550e8400-e29b-41d4-a716-446655440000',
      }

      const result = createParameterSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept minimal numeric parameter', () => {
      const data = {
        parameter_name: 'Simple Test',
        parameter_type: 'numeric',
        min_value: 0,
      }

      const result = createParameterSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept minimal text parameter', () => {
      const data = {
        parameter_name: 'Simple Text Test',
        parameter_type: 'text',
      }

      const result = createParameterSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  // ============================================
  // ERROR MESSAGE VALIDATION
  // ============================================
  describe('Error messages are helpful', () => {
    it('provides specific error for missing numeric min/max', () => {
      const data = {
        parameter_name: 'Temperature',
        parameter_type: 'numeric',
      }

      const result = createParameterSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message).join(' ').toLowerCase()
        expect(messages).toContain('numeric')
      }
    })

    it('provides specific error for range missing both values', () => {
      const data = {
        parameter_name: 'pH Range',
        parameter_type: 'range',
        min_value: 4.0,
      }

      const result = createParameterSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message).join(' ').toLowerCase()
        expect(messages).toContain('range')
      }
    })

    it('provides specific error for min >= max', () => {
      const data = {
        parameter_name: 'Temperature',
        parameter_type: 'numeric',
        min_value: 80,
        max_value: 60,
      }

      const result = createParameterSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message).join(' ')
        expect(messages).toContain('less') || expect(messages).toContain('max') || expect(messages).toContain('min')
      }
    })
  })
})
