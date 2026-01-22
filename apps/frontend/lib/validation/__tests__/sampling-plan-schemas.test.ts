/**
 * Sampling Plan Validation Schemas - Unit Tests (Story 06.7)
 * Schemas:
 *   - createSamplingPlanSchema
 *   - updateSamplingPlanSchema
 *   - createSamplingRecordSchema
 *
 * Phase: GREEN - Tests now pass with implementation
 *
 * Coverage Target: 90%+
 * Test Count: 85+ scenarios
 *
 * Validation File: lib/validation/sampling-plan-schemas.ts
 * Framework: Zod
 *
 * AQL Sampling Plans based on ISO 2859 / ANSI Z1.4
 * - Inspection Levels: I, II, III
 * - AQL Values: 0.065, 0.10, 0.15, 0.25, 0.40, 0.65, 1.0, 1.5, 2.5, 4.0, 6.5, 10.0
 * - Lot size range mapping to sample sizes
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createSamplingPlanSchema,
  updateSamplingPlanSchema,
  createSamplingRecordSchema,
} from '../sampling-plan-schemas'

const mockOrgId = '550e8400-e29b-41d4-a716-446655440000'
const mockProductId = '550e8400-e29b-41d4-a716-446655440001'
const mockPlanId = '550e8400-e29b-41d4-a716-446655440002'
const mockInspectionId = '550e8400-e29b-41d4-a716-446655440003'

describe('Sampling Plan Validation Schemas', () => {
  beforeEach(() => {
    // Setup for each test
  })

  // ==========================================================================
  // createSamplingPlanSchema Tests
  // ==========================================================================
  describe('createSamplingPlanSchema', () => {
    const validData = {
      name: 'Incoming RM Level II',
      description: 'Raw material incoming inspection with AQL 2.5',
      inspection_type: 'incoming' as const,
      aql_level: 'II' as const,
      lot_size_min: 50,
      lot_size_max: 90,
      sample_size: 8,
      acceptance_number: 1,
      rejection_number: 2,
    }

    // ========================================================================
    // name Field Tests
    // ========================================================================
    describe('name field', () => {
      it('should accept valid name (3+ characters)', () => {
        const data = { ...validData, name: 'Incoming RM' }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept name at minimum length (3 characters)', () => {
        const data = { ...validData, name: 'ABC' }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept name at maximum length (200 characters)', () => {
        const data = { ...validData, name: 'a'.repeat(200) }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept name with special characters', () => {
        const data = { ...validData, name: 'Incoming RM (Level II) - AQL 2.5 [ISO 2859]' }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject name with less than 3 characters', () => {
        const data = { ...validData, name: 'AB' }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Name must be at least 3 characters')
        }
      })

      it('should reject name exceeding 200 characters', () => {
        const data = { ...validData, name: 'a'.repeat(201) }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Name must be at most 200 characters')
        }
      })

      it('should reject empty name', () => {
        const data = { ...validData, name: '' }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // ========================================================================
    // description Field Tests
    // ========================================================================
    describe('description field', () => {
      it('should accept valid description (optional field)', () => {
        const data = { ...validData, description: 'Detailed plan for raw materials' }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept empty description (optional field)', () => {
        const data = { ...validData, description: '' }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept undefined description (optional field)', () => {
        const { description, ...data } = validData
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept description at maximum length (1000 characters)', () => {
        const data = { ...validData, description: 'a'.repeat(1000) }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject description exceeding 1000 characters', () => {
        const data = { ...validData, description: 'a'.repeat(1001) }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // ========================================================================
    // inspection_type Field Tests
    // ========================================================================
    describe('inspection_type field', () => {
      it('should accept incoming inspection type', () => {
        const data = { ...validData, inspection_type: 'incoming' as const }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept in_process inspection type', () => {
        const data = { ...validData, inspection_type: 'in_process' as const }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept final inspection type', () => {
        const data = { ...validData, inspection_type: 'final' as const }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject invalid inspection type', () => {
        const data = { ...validData, inspection_type: 'invalid_type' }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject missing inspection type', () => {
        const { inspection_type, ...data } = validData
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // ========================================================================
    // aql_level Field Tests
    // ========================================================================
    describe('aql_level field', () => {
      it('should accept Inspection Level I', () => {
        const data = { ...validData, aql_level: 'I' as const }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept Inspection Level II', () => {
        const data = { ...validData, aql_level: 'II' as const }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept Inspection Level III', () => {
        const data = { ...validData, aql_level: 'III' as const }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept undefined aql_level (optional field)', () => {
        const { aql_level, ...data } = validData
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject invalid aql_level', () => {
        const data = { ...validData, aql_level: 'IV' }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject aql_level with lowercase letters', () => {
        const data = { ...validData, aql_level: 'ii' }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // ========================================================================
    // lot_size_min Field Tests
    // ========================================================================
    describe('lot_size_min field', () => {
      it('should accept valid lot_size_min (positive integer)', () => {
        const data = { ...validData, lot_size_min: 50 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept lot_size_min = 1 (minimum value)', () => {
        const data = { ...validData, lot_size_min: 1 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept lot_size_min = 1000000 (large value)', () => {
        const data = { ...validData, lot_size_min: 1000000, lot_size_max: 1000001 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject lot_size_min = 0', () => {
        const data = { ...validData, lot_size_min: 0 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Lot size min must be positive')
        }
      })

      it('should reject negative lot_size_min', () => {
        const data = { ...validData, lot_size_min: -10 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject decimal lot_size_min', () => {
        const data = { ...validData, lot_size_min: 50.5 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject missing lot_size_min', () => {
        const { lot_size_min, ...data } = validData
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // ========================================================================
    // lot_size_max Field Tests
    // ========================================================================
    describe('lot_size_max field', () => {
      it('should accept valid lot_size_max (positive integer)', () => {
        const data = { ...validData, lot_size_max: 90 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept lot_size_max = 1 (minimum value)', () => {
        const data = { ...validData, lot_size_max: 1, lot_size_min: 1 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept lot_size_max > lot_size_min', () => {
        const data = { ...validData, lot_size_min: 50, lot_size_max: 100 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject lot_size_max = 0', () => {
        const data = { ...validData, lot_size_max: 0 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject negative lot_size_max', () => {
        const data = { ...validData, lot_size_max: -10 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject decimal lot_size_max', () => {
        const data = { ...validData, lot_size_max: 90.5 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject missing lot_size_max', () => {
        const { lot_size_max, ...data } = validData
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // ========================================================================
    // Lot Size Range Validation (Cross-field)
    // ========================================================================
    describe('lot size range validation (lot_size_min <= lot_size_max)', () => {
      it('should accept when lot_size_min equals lot_size_max', () => {
        const data = { ...validData, lot_size_min: 50, lot_size_max: 50 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept when lot_size_min < lot_size_max', () => {
        const data = { ...validData, lot_size_min: 50, lot_size_max: 90 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject when lot_size_min > lot_size_max', () => {
        const data = { ...validData, lot_size_min: 100, lot_size_max: 50 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Lot size min must be <= max')
        }
      })

      it('should reject with error path pointing to lot_size_max', () => {
        const data = { ...validData, lot_size_min: 100, lot_size_max: 50 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].path).toContain('lot_size_max')
        }
      })
    })

    // ========================================================================
    // sample_size Field Tests
    // ========================================================================
    describe('sample_size field', () => {
      it('should accept valid sample_size (positive integer)', () => {
        const data = { ...validData, sample_size: 8 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept sample_size = 1 (minimum value)', () => {
        const data = { ...validData, sample_size: 1 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept sample_size = 800 (large value)', () => {
        const data = { ...validData, sample_size: 800 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject sample_size = 0', () => {
        const data = { ...validData, sample_size: 0 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Sample size must be > 0')
        }
      })

      it('should reject negative sample_size', () => {
        const data = { ...validData, sample_size: -5 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject decimal sample_size', () => {
        const data = { ...validData, sample_size: 8.5 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject missing sample_size', () => {
        const { sample_size, ...data } = validData
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // ========================================================================
    // acceptance_number (Ac) Field Tests
    // ========================================================================
    describe('acceptance_number (Ac) field', () => {
      it('should accept valid acceptance_number (non-negative integer)', () => {
        const data = { ...validData, acceptance_number: 1 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept acceptance_number = 0 (zero defects)', () => {
        const data = { ...validData, acceptance_number: 0, rejection_number: 1 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept large acceptance_number', () => {
        const data = { ...validData, acceptance_number: 100, rejection_number: 101 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject negative acceptance_number', () => {
        const data = { ...validData, acceptance_number: -1 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Acceptance number must be >= 0')
        }
      })

      it('should reject decimal acceptance_number', () => {
        const data = { ...validData, acceptance_number: 1.5 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject missing acceptance_number', () => {
        const { acceptance_number, ...data } = validData
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // ========================================================================
    // rejection_number (Re) Field Tests
    // ========================================================================
    describe('rejection_number (Re) field', () => {
      it('should accept valid rejection_number (positive integer)', () => {
        const data = { ...validData, rejection_number: 2 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept rejection_number = 1 (minimum value)', () => {
        const data = { ...validData, acceptance_number: 0, rejection_number: 1 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept rejection_number = 101', () => {
        const data = { ...validData, acceptance_number: 100, rejection_number: 101 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject rejection_number = 0', () => {
        const data = { ...validData, rejection_number: 0 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Rejection number must be > 0')
        }
      })

      it('should reject negative rejection_number', () => {
        const data = { ...validData, rejection_number: -1 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject decimal rejection_number', () => {
        const data = { ...validData, rejection_number: 2.5 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject missing rejection_number', () => {
        const { rejection_number, ...data } = validData
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // ========================================================================
    // Acceptance/Rejection Cross-field Validation
    // ========================================================================
    describe('acceptance vs rejection validation (Ac < Re)', () => {
      it('should accept when Ac < Re (normal case)', () => {
        const data = { ...validData, acceptance_number: 1, rejection_number: 2 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept when Ac = 0 and Re = 1', () => {
        const data = { ...validData, acceptance_number: 0, rejection_number: 1 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject when Ac = Re', () => {
        const data = { ...validData, acceptance_number: 2, rejection_number: 2 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Acceptance number must be < rejection number')
        }
      })

      it('should reject when Ac > Re', () => {
        const data = { ...validData, acceptance_number: 5, rejection_number: 2 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject with error path pointing to rejection_number', () => {
        const data = { ...validData, acceptance_number: 5, rejection_number: 2 }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].path).toContain('rejection_number')
        }
      })
    })

    // ========================================================================
    // product_id Field Tests (Optional)
    // ========================================================================
    describe('product_id field (optional)', () => {
      it('should accept valid product_id (UUID)', () => {
        const data = { ...validData, product_id: mockProductId }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept undefined product_id (optional field)', () => {
        const { product_id, ...data } = validData
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject invalid product_id (not UUID)', () => {
        const data = { ...validData, product_id: 'not-a-uuid' }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Invalid product')
        }
      })

      it('should reject malformed UUID', () => {
        const data = { ...validData, product_id: '550e8400-e29b-41d4-invalid' }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })
  })

  // ==========================================================================
  // createSamplingRecordSchema Tests
  // ==========================================================================
  describe('createSamplingRecordSchema', () => {
    const validData = {
      plan_id: mockPlanId,
      inspection_id: mockInspectionId,
      sample_identifier: 'S-001',
      location_description: 'Top layer, pallet 1',
      notes: 'Sample looks good, no visible defects',
    }

    // ========================================================================
    // plan_id Field Tests
    // ========================================================================
    describe('plan_id field', () => {
      it('should accept valid plan_id (UUID)', () => {
        const data = { ...validData, plan_id: mockPlanId }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject invalid plan_id (not UUID)', () => {
        const data = { ...validData, plan_id: 'not-a-uuid' }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Invalid sampling plan')
        }
      })

      it('should reject malformed UUID for plan_id', () => {
        const data = { ...validData, plan_id: '550e8400-invalid' }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject missing plan_id', () => {
        const { plan_id, ...data } = validData
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // ========================================================================
    // inspection_id Field Tests
    // ========================================================================
    describe('inspection_id field', () => {
      it('should accept valid inspection_id (UUID)', () => {
        const data = { ...validData, inspection_id: mockInspectionId }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject invalid inspection_id (not UUID)', () => {
        const data = { ...validData, inspection_id: 'not-a-uuid' }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Invalid inspection')
        }
      })

      it('should reject missing inspection_id', () => {
        const { inspection_id, ...data } = validData
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // ========================================================================
    // sample_identifier Field Tests
    // ========================================================================
    describe('sample_identifier field', () => {
      it('should accept valid sample_identifier (1+ characters)', () => {
        const data = { ...validData, sample_identifier: 'S-001' }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept sample_identifier at minimum length (1 character)', () => {
        const data = { ...validData, sample_identifier: 'A' }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept sample_identifier at maximum length (50 characters)', () => {
        const data = { ...validData, sample_identifier: 'S'.repeat(50) }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept sample_identifier with numbers and special chars', () => {
        const data = { ...validData, sample_identifier: 'Sample-001_Lot#123' }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject empty sample_identifier', () => {
        const data = { ...validData, sample_identifier: '' }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Sample identifier required')
        }
      })

      it('should reject sample_identifier exceeding 50 characters', () => {
        const data = { ...validData, sample_identifier: 'S'.repeat(51) }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject missing sample_identifier', () => {
        const { sample_identifier, ...data } = validData
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // ========================================================================
    // location_description Field Tests (Optional)
    // ========================================================================
    describe('location_description field (optional)', () => {
      it('should accept valid location_description', () => {
        const data = { ...validData, location_description: 'Top layer, pallet 1' }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept location_description at maximum length (500 characters)', () => {
        const data = { ...validData, location_description: 'a'.repeat(500) }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept undefined location_description (optional field)', () => {
        const { location_description, ...data } = validData
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept empty location_description', () => {
        const data = { ...validData, location_description: '' }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject location_description exceeding 500 characters', () => {
        const data = { ...validData, location_description: 'a'.repeat(501) }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // ========================================================================
    // notes Field Tests (Optional)
    // ========================================================================
    describe('notes field (optional)', () => {
      it('should accept valid notes', () => {
        const data = { ...validData, notes: 'Sample looks good, no visible defects' }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept notes at maximum length (1000 characters)', () => {
        const data = { ...validData, notes: 'a'.repeat(1000) }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept undefined notes (optional field)', () => {
        const { notes, ...data } = validData
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept empty notes', () => {
        const data = { ...validData, notes: '' }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject notes exceeding 1000 characters', () => {
        const data = { ...validData, notes: 'a'.repeat(1001) }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should accept notes with special characters and newlines', () => {
        const data = { ...validData, notes: 'Line 1\nLine 2\nWith @#$%^&*()' }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  // ==========================================================================
  // updateSamplingPlanSchema Tests
  // ==========================================================================
  describe('updateSamplingPlanSchema', () => {
    const validData = {
      name: 'Updated Sampling Plan',
      description: 'Updated description',
      inspection_type: 'final' as const,
      aql_level: 'III' as const,
      lot_size_min: 100,
      lot_size_max: 200,
      sample_size: 13,
      acceptance_number: 0,
      rejection_number: 1,
      is_active: true,
    }

    // ========================================================================
    // All required fields from create schema
    // ========================================================================
    describe('inherited from createSamplingPlanSchema', () => {
      it('should validate same fields as create schema', () => {
        const result = updateSamplingPlanSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should enforce lot size constraints in update', () => {
        const data = { ...validData, lot_size_min: 200, lot_size_max: 100 }
        const result = updateSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should enforce Ac/Re constraints in update', () => {
        const data = { ...validData, acceptance_number: 10, rejection_number: 5 }
        const result = updateSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // ========================================================================
    // is_active Field Tests
    // ========================================================================
    describe('is_active field', () => {
      it('should accept is_active = true', () => {
        const data = { ...validData, is_active: true }
        const result = updateSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept is_active = false', () => {
        const data = { ...validData, is_active: false }
        const result = updateSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept undefined is_active (optional field)', () => {
        const { is_active, ...data } = validData
        const result = updateSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject is_active with non-boolean value', () => {
        const data = { ...validData, is_active: 'true' }
        const result = updateSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject is_active with numeric value', () => {
        const data = { ...validData, is_active: 1 }
        const result = updateSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })
  })

  // ==========================================================================
  // Edge Cases and Complex Scenarios
  // ==========================================================================
  describe('edge cases and complex scenarios', () => {
    describe('ISO 2859 standard compliance', () => {
      it('should accept valid ISO 2859 lot size range (2-8)', () => {
        const data = {
          name: 'ISO Example 1',
          inspection_type: 'incoming' as const,
          aql_level: 'II' as const,
          lot_size_min: 2,
          lot_size_max: 8,
          sample_size: 2,
          acceptance_number: 0,
          rejection_number: 1,
        }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept valid ISO 2859 lot size range (51-90)', () => {
        const data = {
          name: 'ISO Example 2',
          inspection_type: 'incoming' as const,
          aql_level: 'II' as const,
          lot_size_min: 51,
          lot_size_max: 90,
          sample_size: 8,
          acceptance_number: 0,
          rejection_number: 1,
        }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept valid ISO 2859 lot size range (500001+)', () => {
        const data = {
          name: 'ISO Example 3',
          inspection_type: 'incoming' as const,
          aql_level: 'II' as const,
          lot_size_min: 500001,
          lot_size_max: 999999,
          sample_size: 800,
          acceptance_number: 7,
          rejection_number: 8,
        }
        const result = createSamplingPlanSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept all three inspection levels (I, II, III)', () => {
        const levels: ('I' | 'II' | 'III')[] = ['I', 'II', 'III']
        levels.forEach(level => {
          const data = {
            name: `Level ${level} Plan`,
            inspection_type: 'incoming' as const,
            aql_level: level,
            lot_size_min: 50,
            lot_size_max: 90,
            sample_size: 8,
            acceptance_number: 1,
            rejection_number: 2,
          }
          const result = createSamplingPlanSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })
    })

    describe('simultaneous field constraints', () => {
      it('should validate lot size range AND Ac/Re simultaneously', () => {
        const validData = {
          name: 'Complex validation',
          inspection_type: 'incoming' as const,
          aql_level: 'II' as const,
          lot_size_min: 50,
          lot_size_max: 90,
          sample_size: 8,
          acceptance_number: 1,
          rejection_number: 2,
        }
        const result = createSamplingPlanSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should fail if multiple constraints violated', () => {
        const invalidData = {
          name: 'Multiple failures',
          inspection_type: 'incoming' as const,
          aql_level: 'II' as const,
          lot_size_min: 100,
          lot_size_max: 50, // Violates min <= max
          sample_size: 8,
          acceptance_number: 5, // Violates Ac < Re
          rejection_number: 2,
        }
        const result = createSamplingPlanSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('sampling record creation in context', () => {
      it('should create record with minimal data (required fields only)', () => {
        const data = {
          plan_id: mockPlanId,
          inspection_id: mockInspectionId,
          sample_identifier: 'S-001',
        }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should create record with all fields populated', () => {
        const data = {
          plan_id: mockPlanId,
          inspection_id: mockInspectionId,
          sample_identifier: 'Sample-001',
          location_description: 'Top layer, position 5, pallet 3',
          notes: 'Visual inspection complete, no defects found\nReady for testing',
        }
        const result = createSamplingRecordSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should handle auto-generated sample identifiers (S-001 to S-800)', () => {
        for (let i = 1; i <= 5; i++) {
          const data = {
            plan_id: mockPlanId,
            inspection_id: mockInspectionId,
            sample_identifier: `S-${String(i).padStart(3, '0')}`,
          }
          const result = createSamplingRecordSchema.safeParse(data)
          expect(result.success).toBe(true)
        }
      })
    })
  })
})
