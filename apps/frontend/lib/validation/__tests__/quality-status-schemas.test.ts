/**
 * Quality Status Validation Schemas - Unit Tests (Story 06.1)
 * Purpose: Test Zod validation schemas for quality status operations
 * Phase: RED - Tests will fail until schemas are implemented
 *
 * Tests validation schemas:
 * - qualityStatusEnum (7 statuses)
 * - entityTypeEnum (lp, batch, inspection)
 * - validateTransitionSchema
 * - changeStatusSchema
 * - statusHistoryQuerySchema
 * - currentStatusQuerySchema
 *
 * Coverage Target: 100% (all validation rules)
 * Test Count: 55+ scenarios
 */

import { describe, it, expect } from 'vitest'
import {
  qualityStatusEnum,
  entityTypeEnum,
  validateTransitionSchema,
  changeStatusSchema,
  statusHistoryQuerySchema,
  currentStatusQuerySchema,
} from '../quality-status-schemas'

describe('Quality Status Validation Schemas (Story 06.1)', () => {
  // ==========================================================================
  // Quality Status Enum
  // ==========================================================================
  describe('qualityStatusEnum', () => {
    it('should accept PENDING status', () => {
      expect(() => qualityStatusEnum.parse('PENDING')).not.toThrow()
    })

    it('should accept PASSED status', () => {
      expect(() => qualityStatusEnum.parse('PASSED')).not.toThrow()
    })

    it('should accept FAILED status', () => {
      expect(() => qualityStatusEnum.parse('FAILED')).not.toThrow()
    })

    it('should accept HOLD status', () => {
      expect(() => qualityStatusEnum.parse('HOLD')).not.toThrow()
    })

    it('should accept RELEASED status', () => {
      expect(() => qualityStatusEnum.parse('RELEASED')).not.toThrow()
    })

    it('should accept QUARANTINED status', () => {
      expect(() => qualityStatusEnum.parse('QUARANTINED')).not.toThrow()
    })

    it('should accept COND_APPROVED status', () => {
      expect(() => qualityStatusEnum.parse('COND_APPROVED')).not.toThrow()
    })

    it('should reject invalid status value', () => {
      expect(() => qualityStatusEnum.parse('INVALID')).toThrow()
    })

    it('should reject lowercase status value', () => {
      expect(() => qualityStatusEnum.parse('pending')).toThrow()
    })

    it('should reject empty string', () => {
      expect(() => qualityStatusEnum.parse('')).toThrow()
    })

    it('should reject null', () => {
      expect(() => qualityStatusEnum.parse(null)).toThrow()
    })

    it('should reject undefined', () => {
      expect(() => qualityStatusEnum.parse(undefined)).toThrow()
    })
  })

  // ==========================================================================
  // Entity Type Enum
  // ==========================================================================
  describe('entityTypeEnum', () => {
    it('should accept lp entity type', () => {
      expect(() => entityTypeEnum.parse('lp')).not.toThrow()
    })

    it('should accept batch entity type', () => {
      expect(() => entityTypeEnum.parse('batch')).not.toThrow()
    })

    it('should accept inspection entity type', () => {
      expect(() => entityTypeEnum.parse('inspection')).not.toThrow()
    })

    it('should reject invalid entity type', () => {
      expect(() => entityTypeEnum.parse('invalid')).toThrow()
    })

    it('should reject uppercase entity type', () => {
      expect(() => entityTypeEnum.parse('LP')).toThrow()
    })

    it('should reject empty string', () => {
      expect(() => entityTypeEnum.parse('')).toThrow()
    })
  })

  // ==========================================================================
  // Validate Transition Schema
  // ==========================================================================
  describe('validateTransitionSchema', () => {
    it('should accept valid transition request', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        from_status: 'PENDING',
        to_status: 'PASSED',
        reason: 'Inspection completed successfully',
      }

      const result = validateTransitionSchema.parse(input)

      expect(result.entity_type).toBe('lp')
      expect(result.from_status).toBe('PENDING')
      expect(result.to_status).toBe('PASSED')
    })

    it('should accept all valid entity types', () => {
      const entityTypes = ['lp', 'batch', 'inspection'] as const

      entityTypes.forEach(entity_type => {
        const input = {
          entity_type,
          entity_id: '123e4567-e89b-12d3-a456-426614174000',
          from_status: 'PENDING',
          to_status: 'PASSED',
        }

        const result = validateTransitionSchema.parse(input)
        expect(result.entity_type).toBe(entity_type)
      })
    })

    it('should accept all valid status combinations', () => {
      const statuses = ['PENDING', 'PASSED', 'FAILED', 'HOLD', 'RELEASED', 'QUARANTINED', 'COND_APPROVED'] as const

      statuses.forEach(from_status => {
        statuses.forEach(to_status => {
          if (from_status === to_status) return // Same status should be rejected by refinement

          const input = {
            entity_type: 'lp',
            entity_id: '123e4567-e89b-12d3-a456-426614174000',
            from_status,
            to_status,
          }

          const result = validateTransitionSchema.parse(input)
          expect(result.from_status).toBe(from_status)
          expect(result.to_status).toBe(to_status)
        })
      })
    })

    it('should accept optional reason', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        from_status: 'PENDING',
        to_status: 'PASSED',
      }

      const result = validateTransitionSchema.parse(input)

      expect(result.reason).toBeUndefined()
    })

    it('should accept reason with transition', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        from_status: 'PENDING',
        to_status: 'HOLD',
        reason: 'Further investigation needed',
      }

      const result = validateTransitionSchema.parse(input)

      expect(result.reason).toBe('Further investigation needed')
    })

    it('should require entity_type field', () => {
      const input = {
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        from_status: 'PENDING',
        to_status: 'PASSED',
      }

      expect(() => validateTransitionSchema.parse(input)).toThrow()
    })

    it('should require entity_id field', () => {
      const input = {
        entity_type: 'lp',
        from_status: 'PENDING',
        to_status: 'PASSED',
      }

      expect(() => validateTransitionSchema.parse(input)).toThrow()
    })

    it('should require valid UUID for entity_id', () => {
      const input = {
        entity_type: 'lp',
        entity_id: 'invalid-uuid',
        from_status: 'PENDING',
        to_status: 'PASSED',
      }

      expect(() => validateTransitionSchema.parse(input)).toThrow(/Invalid.*UUID/i)
    })

    it('should require from_status field', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        to_status: 'PASSED',
      }

      expect(() => validateTransitionSchema.parse(input)).toThrow()
    })

    it('should require to_status field', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        from_status: 'PENDING',
      }

      expect(() => validateTransitionSchema.parse(input)).toThrow()
    })

    it('should reject same from and to status', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        from_status: 'PENDING',
        to_status: 'PENDING',
      }

      expect(() => validateTransitionSchema.parse(input)).toThrow(/same/i)
    })

    it('should enforce minimum reason length (10 characters)', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        from_status: 'PENDING',
        to_status: 'HOLD',
        reason: 'Short', // Only 5 characters
      }

      expect(() => validateTransitionSchema.parse(input)).toThrow(/at least.*10/i)
    })

    it('should enforce maximum reason length (500 characters)', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        from_status: 'PENDING',
        to_status: 'HOLD',
        reason: 'R'.repeat(501), // 501 characters
      }

      expect(() => validateTransitionSchema.parse(input)).toThrow(/max.*500/i)
    })

    it('should accept reason exactly 10 characters', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        from_status: 'PENDING',
        to_status: 'HOLD',
        reason: '1234567890', // Exactly 10 characters
      }

      const result = validateTransitionSchema.parse(input)

      expect(result.reason).toBe('1234567890')
    })

    it('should accept reason exactly 500 characters', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        from_status: 'PENDING',
        to_status: 'HOLD',
        reason: 'R'.repeat(500), // Exactly 500 characters
      }

      const result = validateTransitionSchema.parse(input)

      expect(result.reason).toHaveLength(500)
    })
  })

  // ==========================================================================
  // Change Status Schema
  // ==========================================================================
  describe('changeStatusSchema', () => {
    it('should accept valid change status request', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        to_status: 'PASSED',
        reason: 'QA inspection passed all tests',
      }

      const result = changeStatusSchema.parse(input)

      expect(result.entity_type).toBe('lp')
      expect(result.to_status).toBe('PASSED')
      expect(result.reason).toBe('QA inspection passed all tests')
    })

    it('should require reason field', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        to_status: 'PASSED',
      }

      expect(() => changeStatusSchema.parse(input)).toThrow(/reason.*required/i)
    })

    it('should enforce minimum reason length (10 characters)', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        to_status: 'HOLD',
        reason: 'Short', // Only 5 characters
      }

      expect(() => changeStatusSchema.parse(input)).toThrow(/at least.*10/i)
    })

    it('should enforce maximum reason length (500 characters)', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        to_status: 'HOLD',
        reason: 'R'.repeat(501), // 501 characters
      }

      expect(() => changeStatusSchema.parse(input)).toThrow(/max.*500/i)
    })

    it('should accept optional inspection_id', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        to_status: 'PASSED',
        reason: 'Inspection completed',
        inspection_id: '456e7890-e89b-12d3-a456-426614174000',
      }

      const result = changeStatusSchema.parse(input)

      expect(result.inspection_id).toBe('456e7890-e89b-12d3-a456-426614174000')
    })

    it('should validate inspection_id as UUID when provided', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        to_status: 'PASSED',
        reason: 'Inspection completed',
        inspection_id: 'invalid-uuid',
      }

      expect(() => changeStatusSchema.parse(input)).toThrow(/Invalid.*UUID/i)
    })

    it('should accept request without inspection_id', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        to_status: 'HOLD',
        reason: 'Investigation required',
      }

      const result = changeStatusSchema.parse(input)

      expect(result.inspection_id).toBeUndefined()
    })

    it('should require entity_type field', () => {
      const input = {
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        to_status: 'PASSED',
        reason: 'QA inspection passed',
      }

      expect(() => changeStatusSchema.parse(input)).toThrow()
    })

    it('should require entity_id field', () => {
      const input = {
        entity_type: 'lp',
        to_status: 'PASSED',
        reason: 'QA inspection passed',
      }

      expect(() => changeStatusSchema.parse(input)).toThrow()
    })

    it('should require to_status field', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'QA inspection passed',
      }

      expect(() => changeStatusSchema.parse(input)).toThrow()
    })

    it('should reject invalid to_status value', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        to_status: 'INVALID',
        reason: 'Test reason here',
      }

      expect(() => changeStatusSchema.parse(input)).toThrow()
    })
  })

  // ==========================================================================
  // Status History Query Schema
  // ==========================================================================
  describe('statusHistoryQuerySchema', () => {
    it('should accept valid history query', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = statusHistoryQuerySchema.parse(input)

      expect(result.entity_type).toBe('lp')
      expect(result.entity_id).toBe('123e4567-e89b-12d3-a456-426614174000')
    })

    it('should accept all entity types', () => {
      const entityTypes = ['lp', 'batch', 'inspection'] as const

      entityTypes.forEach(entity_type => {
        const input = {
          entity_type,
          entity_id: '123e4567-e89b-12d3-a456-426614174000',
        }

        const result = statusHistoryQuerySchema.parse(input)
        expect(result.entity_type).toBe(entity_type)
      })
    })

    it('should require entity_type field', () => {
      const input = {
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
      }

      expect(() => statusHistoryQuerySchema.parse(input)).toThrow()
    })

    it('should require entity_id field', () => {
      const input = {
        entity_type: 'lp',
      }

      expect(() => statusHistoryQuerySchema.parse(input)).toThrow()
    })

    it('should validate entity_id as UUID', () => {
      const input = {
        entity_type: 'lp',
        entity_id: 'invalid-uuid',
      }

      expect(() => statusHistoryQuerySchema.parse(input)).toThrow(/Invalid.*UUID/i)
    })

    it('should accept optional limit parameter', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        limit: 50,
      }

      const result = statusHistoryQuerySchema.parse(input)

      expect(result.limit).toBe(50)
    })

    it('should accept optional offset parameter', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        offset: 10,
      }

      const result = statusHistoryQuerySchema.parse(input)

      expect(result.offset).toBe(10)
    })

    it('should reject negative limit', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        limit: -5,
      }

      expect(() => statusHistoryQuerySchema.parse(input)).toThrow()
    })

    it('should reject negative offset', () => {
      const input = {
        entity_type: 'lp',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        offset: -1,
      }

      expect(() => statusHistoryQuerySchema.parse(input)).toThrow()
    })
  })

  // ==========================================================================
  // Current Status Query Schema
  // ==========================================================================
  describe('currentStatusQuerySchema', () => {
    it('should accept valid current status query', () => {
      const input = {
        current: 'PENDING',
      }

      const result = currentStatusQuerySchema.parse(input)

      expect(result.current).toBe('PENDING')
    })

    it('should accept all valid status values', () => {
      const statuses = ['PENDING', 'PASSED', 'FAILED', 'HOLD', 'RELEASED', 'QUARANTINED', 'COND_APPROVED'] as const

      statuses.forEach(current => {
        const result = currentStatusQuerySchema.parse({ current })
        expect(result.current).toBe(current)
      })
    })

    it('should require current field', () => {
      expect(() => currentStatusQuerySchema.parse({})).toThrow()
    })

    it('should reject invalid status value', () => {
      const input = {
        current: 'INVALID',
      }

      expect(() => currentStatusQuerySchema.parse(input)).toThrow()
    })

    it('should reject lowercase status value', () => {
      const input = {
        current: 'pending',
      }

      expect(() => currentStatusQuerySchema.parse(input)).toThrow()
    })

    it('should reject empty string', () => {
      const input = {
        current: '',
      }

      expect(() => currentStatusQuerySchema.parse(input)).toThrow()
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * qualityStatusEnum - 12 tests:
 *   - All 7 valid statuses accepted
 *   - Invalid status rejected
 *   - Case sensitivity
 *   - Edge cases (empty, null, undefined)
 *
 * entityTypeEnum - 6 tests:
 *   - All 3 valid entity types accepted
 *   - Invalid type rejected
 *   - Case sensitivity
 *
 * validateTransitionSchema - 17 tests:
 *   - Valid transition request
 *   - All entity types
 *   - All status combinations
 *   - Optional/required fields
 *   - UUID validation
 *   - Same status rejection
 *   - Reason length validation
 *
 * changeStatusSchema - 11 tests:
 *   - Valid change request
 *   - Required reason field
 *   - Reason length validation
 *   - Optional inspection_id
 *   - UUID validation
 *   - Required fields
 *
 * statusHistoryQuerySchema - 9 tests:
 *   - Valid query
 *   - All entity types
 *   - Required fields
 *   - UUID validation
 *   - Optional limit/offset
 *   - Negative value rejection
 *
 * currentStatusQuerySchema - 6 tests:
 *   - Valid query
 *   - All status values
 *   - Required field
 *   - Invalid value rejection
 *
 * Total: 55+ tests
 * Coverage: 100% (all validation rules tested)
 * Status: RED (schemas not implemented yet)
 */
