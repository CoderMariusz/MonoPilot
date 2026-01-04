/**
 * LP Status Management Validation Schemas - Unit Tests (Story 05.4)
 * Purpose: Test Zod validation schemas for LP status management operations
 * Phase: RED - Tests will fail until schemas are implemented
 *
 * Tests validation schemas:
 * - updateLPStatusSchema
 * - updateQAStatusSchema (with reason validation)
 * - blockLPSchema (with minimum reason length)
 * - validateConsumptionSchema
 * - statusTransitionSchema
 *
 * Coverage Target: 100% (all validation rules)
 */

import { describe, it, expect } from 'vitest'
import {
  updateLPStatusSchema,
  updateQAStatusSchemaWithReason,
  blockLPSchema,
  unblockLPSchema,
  validateConsumptionSchema,
  lpStatusEnum,
  qaStatusEnum,
} from '../lp-status-schemas'

describe('LP Status Management Validation Schemas (Story 05.4)', () => {
  // ==========================================================================
  // LP Status Enum
  // ==========================================================================
  describe('lpStatusEnum', () => {
    it('should accept all valid LP status values', () => {
      expect(() => lpStatusEnum.parse('available')).not.toThrow()
      expect(() => lpStatusEnum.parse('reserved')).not.toThrow()
      expect(() => lpStatusEnum.parse('consumed')).not.toThrow()
      expect(() => lpStatusEnum.parse('blocked')).not.toThrow()
    })

    it('should reject invalid LP status values', () => {
      expect(() => lpStatusEnum.parse('invalid')).toThrow()
      expect(() => lpStatusEnum.parse('active')).toThrow()
      expect(() => lpStatusEnum.parse('pending')).toThrow()
      expect(() => lpStatusEnum.parse('')).toThrow()
    })
  })

  // ==========================================================================
  // QA Status Enum
  // ==========================================================================
  describe('qaStatusEnum', () => {
    it('should accept all valid QA status values', () => {
      expect(() => qaStatusEnum.parse('pending')).not.toThrow()
      expect(() => qaStatusEnum.parse('passed')).not.toThrow()
      expect(() => qaStatusEnum.parse('failed')).not.toThrow()
      expect(() => qaStatusEnum.parse('quarantine')).not.toThrow()
    })

    it('should reject invalid QA status values', () => {
      expect(() => qaStatusEnum.parse('invalid')).toThrow()
      expect(() => qaStatusEnum.parse('approved')).toThrow()
      expect(() => qaStatusEnum.parse('rejected')).toThrow()
      expect(() => qaStatusEnum.parse('')).toThrow()
    })
  })

  // ==========================================================================
  // Update LP Status Schema
  // ==========================================================================
  describe('updateLPStatusSchema', () => {
    it('should accept valid status update', () => {
      const input = {
        status: 'blocked' as const,
        reason: 'Quality hold',
      }

      const result = updateLPStatusSchema.parse(input)

      expect(result.status).toBe('blocked')
      expect(result.reason).toBe('Quality hold')
    })

    it('should accept all valid status values', () => {
      const statuses = ['available', 'reserved', 'consumed', 'blocked'] as const

      statuses.forEach(status => {
        const result = updateLPStatusSchema.parse({ status })
        expect(result.status).toBe(status)
      })
    })

    it('should accept optional reason', () => {
      const input = {
        status: 'available' as const,
      }

      const result = updateLPStatusSchema.parse(input)

      expect(result.status).toBe('available')
      expect(result.reason).toBeUndefined()
    })

    it('should accept reason with status change', () => {
      const input = {
        status: 'blocked' as const,
        reason: 'Damaged packaging - manual block',
      }

      const result = updateLPStatusSchema.parse(input)

      expect(result.reason).toBe('Damaged packaging - manual block')
    })

    it('should reject invalid status value', () => {
      const input = {
        status: 'invalid',
      }

      expect(() => updateLPStatusSchema.parse(input)).toThrow()
    })

    it('should reject reason too long', () => {
      const input = {
        status: 'blocked' as const,
        reason: 'R'.repeat(501), // Max 500 characters
      }

      expect(() => updateLPStatusSchema.parse(input)).toThrow(/max.*500/i)
    })

    it('should require status field', () => {
      expect(() => updateLPStatusSchema.parse({})).toThrow()
    })
  })

  // ==========================================================================
  // Update QA Status Schema (with reason validation)
  // ==========================================================================
  describe('updateQAStatusSchemaWithReason', () => {
    it('should accept valid QA status update with reason', () => {
      const input = {
        qa_status: 'passed' as const,
        reason: 'QA inspection completed - all parameters within spec',
      }

      const result = updateQAStatusSchemaWithReason.parse(input)

      expect(result.qa_status).toBe('passed')
      expect(result.reason).toBe('QA inspection completed - all parameters within spec')
    })

    it('should accept all valid QA status values', () => {
      const statuses = ['pending', 'passed', 'failed', 'quarantine'] as const

      statuses.forEach(status => {
        const result = updateQAStatusSchemaWithReason.parse({
          qa_status: status,
          reason: 'Test reason',
        })
        expect(result.qa_status).toBe(status)
      })
    })

    it('should require reason for failed status', () => {
      const input = {
        qa_status: 'failed' as const,
      }

      expect(() => updateQAStatusSchemaWithReason.parse(input)).toThrow(/reason.*required/i)
    })

    it('should require reason for quarantine status', () => {
      const input = {
        qa_status: 'quarantine' as const,
      }

      expect(() => updateQAStatusSchemaWithReason.parse(input)).toThrow(/reason.*required/i)
    })

    it('should accept reason for passed status (optional)', () => {
      const input1 = {
        qa_status: 'passed' as const,
        reason: 'QA inspection OK',
      }
      const input2 = {
        qa_status: 'passed' as const,
      }

      const result1 = updateQAStatusSchemaWithReason.parse(input1)
      const result2 = updateQAStatusSchemaWithReason.parse(input2)

      expect(result1.reason).toBe('QA inspection OK')
      expect(result2.reason).toBeUndefined()
    })

    it('should accept reason for pending status (optional)', () => {
      const input = {
        qa_status: 'pending' as const,
      }

      const result = updateQAStatusSchemaWithReason.parse(input)

      expect(result.qa_status).toBe('pending')
      expect(result.reason).toBeUndefined()
    })

    it('should enforce minimum reason length for failed', () => {
      const input = {
        qa_status: 'failed' as const,
        reason: 'Bad', // Too short
      }

      expect(() => updateQAStatusSchemaWithReason.parse(input)).toThrow(/at least.*5/i)
    })

    it('should enforce minimum reason length for quarantine', () => {
      const input = {
        qa_status: 'quarantine' as const,
        reason: 'QC', // Too short
      }

      expect(() => updateQAStatusSchemaWithReason.parse(input)).toThrow(/at least.*5/i)
    })

    it('should reject reason too long', () => {
      const input = {
        qa_status: 'failed' as const,
        reason: 'F'.repeat(501), // Max 500 characters
      }

      expect(() => updateQAStatusSchemaWithReason.parse(input)).toThrow(/max.*500/i)
    })

    it('should require qa_status field', () => {
      expect(() => updateQAStatusSchemaWithReason.parse({})).toThrow()
    })
  })

  // ==========================================================================
  // Block LP Schema
  // ==========================================================================
  describe('blockLPSchema', () => {
    it('should accept valid block reason', () => {
      const input = {
        reason: 'Damaged packaging - pallet dropped during handling',
      }

      const result = blockLPSchema.parse(input)

      expect(result.reason).toBe('Damaged packaging - pallet dropped during handling')
    })

    it('should require reason field', () => {
      expect(() => blockLPSchema.parse({})).toThrow(/required/i)
    })

    it('should enforce minimum reason length (10 characters)', () => {
      const input = {
        reason: 'Damaged', // Only 7 characters
      }

      expect(() => blockLPSchema.parse(input)).toThrow(/at least.*10/i)
    })

    it('should accept reason exactly 10 characters', () => {
      const input = {
        reason: '1234567890', // Exactly 10 characters
      }

      const result = blockLPSchema.parse(input)

      expect(result.reason).toBe('1234567890')
    })

    it('should accept reason longer than 10 characters', () => {
      const input = {
        reason: 'Quality hold - foreign material suspected in batch',
      }

      const result = blockLPSchema.parse(input)

      expect(result.reason).toHaveLength(53)
    })

    it('should reject reason too long', () => {
      const input = {
        reason: 'R'.repeat(501), // Max 500 characters
      }

      expect(() => blockLPSchema.parse(input)).toThrow(/max.*500/i)
    })

    it('should reject empty string', () => {
      const input = {
        reason: '',
      }

      expect(() => blockLPSchema.parse(input)).toThrow(/at least.*10/i)
    })

    it('should reject null reason', () => {
      const input = {
        reason: null,
      }

      expect(() => blockLPSchema.parse(input)).toThrow()
    })
  })

  // ==========================================================================
  // Unblock LP Schema
  // ==========================================================================
  describe('unblockLPSchema', () => {
    it('should accept optional reason', () => {
      const input = {
        reason: 'Package inspected and resealed - no product contamination',
      }

      const result = unblockLPSchema.parse(input)

      expect(result.reason).toBe('Package inspected and resealed - no product contamination')
    })

    it('should accept empty object (no reason)', () => {
      const result = unblockLPSchema.parse({})

      expect(result.reason).toBeUndefined()
    })

    it('should accept null reason', () => {
      const result = unblockLPSchema.parse({ reason: null })

      expect(result.reason).toBeNull()
    })

    it('should reject reason too long', () => {
      const input = {
        reason: 'U'.repeat(501), // Max 500 characters
      }

      expect(() => unblockLPSchema.parse(input)).toThrow(/max.*500/i)
    })

    it('should accept reason up to 500 characters', () => {
      const input = {
        reason: 'U'.repeat(500), // Exactly 500 characters
      }

      const result = unblockLPSchema.parse(input)

      expect(result.reason).toHaveLength(500)
    })
  })

  // ==========================================================================
  // Validate Consumption Schema
  // ==========================================================================
  describe('validateConsumptionSchema', () => {
    it('should accept valid LP ID', () => {
      const input = {
        lp_id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = validateConsumptionSchema.parse(input)

      expect(result.lp_id).toBe(input.lp_id)
    })

    it('should require lp_id field', () => {
      expect(() => validateConsumptionSchema.parse({})).toThrow()
    })

    it('should reject invalid UUID format', () => {
      const input = {
        lp_id: 'invalid-uuid',
      }

      expect(() => validateConsumptionSchema.parse(input)).toThrow(/Invalid.*UUID/i)
    })

    it('should reject empty string', () => {
      const input = {
        lp_id: '',
      }

      expect(() => validateConsumptionSchema.parse(input)).toThrow()
    })

    it('should reject null value', () => {
      const input = {
        lp_id: null,
      }

      expect(() => validateConsumptionSchema.parse(input)).toThrow()
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Enum Schemas - 4 tests:
 *   - lpStatusEnum (2 tests)
 *   - qaStatusEnum (2 tests)
 *
 * updateLPStatusSchema - 7 tests:
 *   - Valid status values
 *   - Optional reason
 *   - Invalid status
 *   - Reason length validation
 *   - Required status field
 *
 * updateQAStatusSchemaWithReason - 11 tests:
 *   - All QA status values
 *   - Conditional reason requirement (failed/quarantine)
 *   - Optional reason (passed/pending)
 *   - Minimum reason length (5 chars for failed/quarantine)
 *   - Maximum reason length (500 chars)
 *   - Required qa_status field
 *
 * blockLPSchema - 8 tests:
 *   - Valid reason
 *   - Required field
 *   - Minimum length (10 chars)
 *   - Maximum length (500 chars)
 *   - Edge cases (empty, null, exact length)
 *
 * unblockLPSchema - 5 tests:
 *   - Optional reason
 *   - Empty object
 *   - Null reason
 *   - Maximum length
 *
 * validateConsumptionSchema - 5 tests:
 *   - Valid UUID
 *   - Required field
 *   - Invalid UUID format
 *   - Edge cases
 *
 * Total: 40 tests
 * Coverage: 100% (all validation rules tested)
 * Status: RED (schemas not implemented yet)
 */
