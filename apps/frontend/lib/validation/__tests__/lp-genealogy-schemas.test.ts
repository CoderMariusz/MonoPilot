/**
 * LP Genealogy Validation Schemas - Unit Tests (Story 05.2)
 * Purpose: Test Zod validation schemas for LP Genealogy operations
 * Phase: RED - Tests will fail until schemas are implemented
 *
 * Tests validation for:
 * - LinkConsumptionSchema
 * - LinkOutputSchema
 * - LinkSplitSchema
 * - LinkMergeSchema
 * - TraceQuerySchema
 * - GenealogyDirectionSchema
 * - OperationTypeEnum
 *
 * Acceptance Criteria Coverage:
 * - AC-20: Self-Reference Prevention
 * - AC-22: Operation Type Enum validation
 * - Schema validation for all genealogy operations
 */

import { describe, it, expect } from 'vitest'
import {
  OperationTypeEnum,
  LinkConsumptionSchema,
  LinkOutputSchema,
  LinkSplitSchema,
  LinkMergeSchema,
  TraceQuerySchema,
  GenealogyDirectionSchema,
} from '../lp-genealogy-schemas'

describe('LP Genealogy Validation Schemas (Story 05.2)', () => {
  // ==========================================================================
  // OperationTypeEnum - AC-22
  // ==========================================================================
  describe('OperationTypeEnum', () => {
    it('should accept valid operation types', () => {
      expect(OperationTypeEnum.parse('consume')).toBe('consume')
      expect(OperationTypeEnum.parse('output')).toBe('output')
      expect(OperationTypeEnum.parse('split')).toBe('split')
      expect(OperationTypeEnum.parse('merge')).toBe('merge')
    })

    it('should reject invalid operation types', () => {
      expect(() => OperationTypeEnum.parse('invalid')).toThrow()
      expect(() => OperationTypeEnum.parse('delete')).toThrow()
      expect(() => OperationTypeEnum.parse('CONSUME')).toThrow() // Case sensitive
      expect(() => OperationTypeEnum.parse('')).toThrow()
    })

    it('should reject non-string values', () => {
      expect(() => OperationTypeEnum.parse(123)).toThrow()
      expect(() => OperationTypeEnum.parse(null)).toThrow()
      expect(() => OperationTypeEnum.parse(undefined)).toThrow()
    })
  })

  // ==========================================================================
  // LinkConsumptionSchema - AC-3, AC-20
  // ==========================================================================
  describe('LinkConsumptionSchema', () => {
    it('should validate valid consumption input', () => {
      const valid = {
        parentLpId: 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607',
        childLpId: 'b2c3d4e5-f6a7-4890-b1c2-d3e4f5060708',
        woId: 'c3d4e5f6-a7b8-4901-c2d3-e4f506070809',
        quantity: 50.5,
      }

      const result = LinkConsumptionSchema.parse(valid)
      expect(result.parentLpId).toBe(valid.parentLpId)
      expect(result.childLpId).toBe(valid.childLpId)
      expect(result.woId).toBe(valid.woId)
      expect(result.quantity).toBe(50.5)
    })

    it('should allow optional operation_id', () => {
      const valid = {
        parentLpId: 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607',
        childLpId: 'b2c3d4e5-f6a7-4890-b1c2-d3e4f5060708',
        woId: 'c3d4e5f6-a7b8-4901-c2d3-e4f506070809',
        quantity: 50,
        operationId: 'd4e5f6a7-b8c9-4012-d3e4-f506070809a0',
      }

      const result = LinkConsumptionSchema.parse(valid)
      expect(result.operationId).toBe(valid.operationId)
    })

    it('should reject self-reference (AC-20)', () => {
      const selfRef = {
        parentLpId: 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607',
        childLpId: 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607', // Same as parent
        woId: 'c3d4e5f6-a7b8-4901-c2d3-e4f506070809',
        quantity: 50,
      }

      expect(() => LinkConsumptionSchema.parse(selfRef)).toThrow(/same/i)
    })

    it('should reject invalid UUID formats', () => {
      const invalid = {
        parentLpId: 'not-a-uuid',
        childLpId: 'b2c3d4e5-f6a7-4890-b1c2-d3e4f5060708',
        woId: 'c3d4e5f6-a7b8-4901-c2d3-e4f506070809',
        quantity: 50,
      }

      expect(() => LinkConsumptionSchema.parse(invalid)).toThrow(/uuid/i)
    })

    it('should reject negative quantity', () => {
      const invalid = {
        parentLpId: 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607',
        childLpId: 'b2c3d4e5-f6a7-4890-b1c2-d3e4f5060708',
        woId: 'c3d4e5f6-a7b8-4901-c2d3-e4f506070809',
        quantity: -10,
      }

      expect(() => LinkConsumptionSchema.parse(invalid)).toThrow(/positive/i)
    })

    it('should reject zero quantity', () => {
      const invalid = {
        parentLpId: 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607',
        childLpId: 'b2c3d4e5-f6a7-4890-b1c2-d3e4f5060708',
        woId: 'c3d4e5f6-a7b8-4901-c2d3-e4f506070809',
        quantity: 0,
      }

      expect(() => LinkConsumptionSchema.parse(invalid)).toThrow(/positive/i)
    })

    it('should reject missing required fields', () => {
      expect(() => LinkConsumptionSchema.parse({})).toThrow()
      expect(() =>
        LinkConsumptionSchema.parse({ parentLpId: 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607' })
      ).toThrow()
    })
  })

  // ==========================================================================
  // LinkOutputSchema - AC-4
  // ==========================================================================
  describe('LinkOutputSchema', () => {
    it('should validate valid output input', () => {
      const valid = {
        consumedLpIds: [
          'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607',
          'b2c3d4e5-f6a7-4890-b1c2-d3e4f5060708',
          'c3d4e5f6-a7b8-4901-c2d3-e4f506070809',
        ],
        outputLpId: 'd4e5f6a7-b8c9-4012-d3e4-f506070809a0',
        woId: 'e5f6a7b8-c9d0-4123-e4f5-060708090a0b',
      }

      const result = LinkOutputSchema.parse(valid)
      expect(result.consumedLpIds).toHaveLength(3)
      expect(result.outputLpId).toBe(valid.outputLpId)
      expect(result.woId).toBe(valid.woId)
    })

    it('should reject empty consumed LP array', () => {
      const invalid = {
        consumedLpIds: [],
        outputLpId: 'd4e5f6a7-b8c9-4012-d3e4-f506070809a0',
        woId: 'e5f6a7b8-c9d0-4123-e4f5-060708090a0b',
      }

      expect(() => LinkOutputSchema.parse(invalid)).toThrow(/at least one/i)
    })

    it('should reject invalid UUIDs in consumed array', () => {
      const invalid = {
        consumedLpIds: ['not-a-uuid', 'also-not-uuid'],
        outputLpId: 'd4e5f6a7-b8c9-4012-d3e4-f506070809a0',
        woId: 'e5f6a7b8-c9d0-4123-e4f5-060708090a0b',
      }

      expect(() => LinkOutputSchema.parse(invalid)).toThrow(/uuid/i)
    })

    it('should accept single consumed LP', () => {
      const valid = {
        consumedLpIds: ['a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607'],
        outputLpId: 'd4e5f6a7-b8c9-4012-d3e4-f506070809a0',
        woId: 'e5f6a7b8-c9d0-4123-e4f5-060708090a0b',
      }

      const result = LinkOutputSchema.parse(valid)
      expect(result.consumedLpIds).toHaveLength(1)
    })
  })

  // ==========================================================================
  // LinkSplitSchema - AC-5
  // ==========================================================================
  describe('LinkSplitSchema', () => {
    it('should validate valid split input', () => {
      const valid = {
        sourceLpId: 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607',
        newLpId: 'b2c3d4e5-f6a7-4890-b1c2-d3e4f5060708',
        quantity: 30.5,
      }

      const result = LinkSplitSchema.parse(valid)
      expect(result.sourceLpId).toBe(valid.sourceLpId)
      expect(result.newLpId).toBe(valid.newLpId)
      expect(result.quantity).toBe(30.5)
    })

    it('should reject self-reference in split (AC-20)', () => {
      const selfRef = {
        sourceLpId: 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607',
        newLpId: 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607', // Same as source
        quantity: 30,
      }

      expect(() => LinkSplitSchema.parse(selfRef)).toThrow(/same/i)
    })

    it('should reject negative quantity', () => {
      const invalid = {
        sourceLpId: 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607',
        newLpId: 'b2c3d4e5-f6a7-4890-b1c2-d3e4f5060708',
        quantity: -10,
      }

      expect(() => LinkSplitSchema.parse(invalid)).toThrow(/positive/i)
    })

    it('should reject zero quantity', () => {
      const invalid = {
        sourceLpId: 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607',
        newLpId: 'b2c3d4e5-f6a7-4890-b1c2-d3e4f5060708',
        quantity: 0,
      }

      expect(() => LinkSplitSchema.parse(invalid)).toThrow(/positive/i)
    })

    it('should reject invalid UUID formats', () => {
      const invalid = {
        sourceLpId: 'not-a-uuid',
        newLpId: 'b2c3d4e5-f6a7-4890-b1c2-d3e4f5060708',
        quantity: 30,
      }

      expect(() => LinkSplitSchema.parse(invalid)).toThrow(/uuid/i)
    })
  })

  // ==========================================================================
  // LinkMergeSchema - AC-6
  // ==========================================================================
  describe('LinkMergeSchema', () => {
    it('should validate valid merge input', () => {
      const valid = {
        sourceLpIds: [
          'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607',
          'b2c3d4e5-f6a7-4890-b1c2-d3e4f5060708',
        ],
        targetLpId: 'c3d4e5f6-a7b8-4901-c2d3-e4f506070809',
      }

      const result = LinkMergeSchema.parse(valid)
      expect(result.sourceLpIds).toHaveLength(2)
      expect(result.targetLpId).toBe(valid.targetLpId)
    })

    it('should reject empty source LP array', () => {
      const invalid = {
        sourceLpIds: [],
        targetLpId: 'c3d4e5f6-a7b8-4901-c2d3-e4f506070809',
      }

      expect(() => LinkMergeSchema.parse(invalid)).toThrow(/at least one/i)
    })

    it('should reject invalid UUIDs in source array', () => {
      const invalid = {
        sourceLpIds: ['not-a-uuid', 'also-not-uuid'],
        targetLpId: 'c3d4e5f6-a7b8-4901-c2d3-e4f506070809',
      }

      expect(() => LinkMergeSchema.parse(invalid)).toThrow(/uuid/i)
    })

    it('should accept single source LP', () => {
      const valid = {
        sourceLpIds: ['a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607'],
        targetLpId: 'c3d4e5f6-a7b8-4901-c2d3-e4f506070809',
      }

      const result = LinkMergeSchema.parse(valid)
      expect(result.sourceLpIds).toHaveLength(1)
    })

    it('should reject target UUID format error', () => {
      const invalid = {
        sourceLpIds: ['a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607'],
        targetLpId: 'not-a-uuid',
      }

      expect(() => LinkMergeSchema.parse(invalid)).toThrow(/uuid/i)
    })
  })

  // ==========================================================================
  // TraceQuerySchema - AC-8, AC-9, AC-13
  // ==========================================================================
  describe('TraceQuerySchema', () => {
    it('should validate valid trace query params', () => {
      const valid = {
        maxDepth: 5,
        includeReversed: true,
      }

      const result = TraceQuerySchema.parse(valid)
      expect(result.maxDepth).toBe(5)
      expect(result.includeReversed).toBe(true)
    })

    it('should use default values', () => {
      const result = TraceQuerySchema.parse({})
      expect(result.maxDepth).toBe(10)
      expect(result.includeReversed).toBe(false)
    })

    it('should coerce string to number for maxDepth', () => {
      const result = TraceQuerySchema.parse({ maxDepth: '7' })
      expect(result.maxDepth).toBe(7)
    })

    it('should coerce string to boolean for includeReversed', () => {
      const result1 = TraceQuerySchema.parse({ includeReversed: 'true' })
      expect(result1.includeReversed).toBe(true)

      // Note: z.coerce.boolean() treats any truthy string as true
      // For 'false' string, use explicit false boolean or omit the param
      const result2 = TraceQuerySchema.parse({ includeReversed: false })
      expect(result2.includeReversed).toBe(false)
    })

    it('should enforce min depth of 1', () => {
      expect(() => TraceQuerySchema.parse({ maxDepth: 0 })).toThrow()
      expect(() => TraceQuerySchema.parse({ maxDepth: -5 })).toThrow()
    })

    it('should enforce max depth of 10', () => {
      expect(() => TraceQuerySchema.parse({ maxDepth: 11 })).toThrow()
      expect(() => TraceQuerySchema.parse({ maxDepth: 100 })).toThrow()
    })

    it('should require integer for maxDepth', () => {
      expect(() => TraceQuerySchema.parse({ maxDepth: 5.5 })).toThrow()
      expect(() => TraceQuerySchema.parse({ maxDepth: 3.14 })).toThrow()
    })

    it('should accept maxDepth at boundaries', () => {
      const min = TraceQuerySchema.parse({ maxDepth: 1 })
      expect(min.maxDepth).toBe(1)

      const max = TraceQuerySchema.parse({ maxDepth: 10 })
      expect(max.maxDepth).toBe(10)
    })
  })

  // ==========================================================================
  // GenealogyDirectionSchema
  // ==========================================================================
  describe('GenealogyDirectionSchema', () => {
    it('should accept valid direction values', () => {
      expect(GenealogyDirectionSchema.parse('forward')).toBe('forward')
      expect(GenealogyDirectionSchema.parse('backward')).toBe('backward')
      expect(GenealogyDirectionSchema.parse('both')).toBe('both')
    })

    it('should use default value of "both"', () => {
      const result = GenealogyDirectionSchema.parse(undefined)
      expect(result).toBe('both')
    })

    it('should reject invalid direction values', () => {
      expect(() => GenealogyDirectionSchema.parse('up')).toThrow()
      expect(() => GenealogyDirectionSchema.parse('down')).toThrow()
      expect(() => GenealogyDirectionSchema.parse('FORWARD')).toThrow()
      expect(() => GenealogyDirectionSchema.parse('')).toThrow()
    })

    it('should reject non-string values', () => {
      expect(() => GenealogyDirectionSchema.parse(123)).toThrow()
      expect(() => GenealogyDirectionSchema.parse(null)).toThrow()
    })
  })

  // ==========================================================================
  // Integration Tests
  // ==========================================================================
  describe('Schema Integration', () => {
    it('should handle complete consumption workflow', () => {
      const consumption = {
        parentLpId: 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f50607',
        childLpId: 'b2c3d4e5-f6a7-4890-b1c2-d3e4f5060708',
        woId: 'c3d4e5f6-a7b8-4901-c2d3-e4f506070809',
        quantity: 50,
        operationId: 'd4e5f6a7-b8c9-4012-d3e4-f506070809a0',
      }

      const result = LinkConsumptionSchema.parse(consumption)
      expect(result).toMatchObject(consumption)
    })

    it('should handle complete trace query workflow', () => {
      const query = {
        maxDepth: 5,
        includeReversed: true,
      }

      const result = TraceQuerySchema.parse(query)
      expect(result.maxDepth).toBe(5)
      expect(result.includeReversed).toBe(true)
    })

    it('should validate all operation types in workflow', () => {
      const types = ['consume', 'output', 'split', 'merge'] as const

      types.forEach(type => {
        const result = OperationTypeEnum.parse(type)
        expect(result).toBe(type)
      })
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * OperationTypeEnum - 3 tests (AC-22):
 *   - Accept valid types
 *   - Reject invalid types
 *   - Reject non-string values
 *
 * LinkConsumptionSchema - 7 tests (AC-3, AC-20):
 *   - Valid input
 *   - Optional operation_id
 *   - Self-reference prevention
 *   - Invalid UUID format
 *   - Negative quantity
 *   - Zero quantity
 *   - Missing required fields
 *
 * LinkOutputSchema - 4 tests (AC-4):
 *   - Valid input
 *   - Empty consumed array
 *   - Invalid UUIDs in array
 *   - Single consumed LP
 *
 * LinkSplitSchema - 5 tests (AC-5, AC-20):
 *   - Valid input
 *   - Self-reference prevention
 *   - Negative quantity
 *   - Zero quantity
 *   - Invalid UUID format
 *
 * LinkMergeSchema - 5 tests (AC-6):
 *   - Valid input
 *   - Empty source array
 *   - Invalid UUIDs in array
 *   - Single source LP
 *   - Invalid target UUID
 *
 * TraceQuerySchema - 8 tests (AC-8, AC-9, AC-13):
 *   - Valid params
 *   - Default values
 *   - Coerce string to number
 *   - Coerce string to boolean
 *   - Min depth enforcement
 *   - Max depth enforcement
 *   - Integer requirement
 *   - Boundary values
 *
 * GenealogyDirectionSchema - 4 tests:
 *   - Valid direction values
 *   - Default value
 *   - Invalid direction values
 *   - Non-string values
 *
 * Integration Tests - 3 tests:
 *   - Complete consumption workflow
 *   - Complete trace query workflow
 *   - All operation types validation
 *
 * Total: 39 tests
 * Coverage: All validation schemas
 * Status: RED (schemas not implemented yet)
 */
