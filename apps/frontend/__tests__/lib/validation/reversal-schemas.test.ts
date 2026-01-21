/**
 * Validation Schema Tests: Consumption Reversal Schemas
 * Story: 04.6d - Consumption Correction (Reversal)
 * Phase: RED - Tests should FAIL (schema updates not yet implemented)
 *
 * Tests Zod validation schemas for consumption reversal:
 * - reverseConsumptionSchema: Request to reverse a consumption
 * - Reason enum validation
 * - Notes requirement when reason is 'other'
 *
 * Related PRD: docs/1-BASELINE/product/modules/PRODUCTION.md (FR-PROD-009)
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Import the schema that should be created/updated
// Note: These imports will fail until implementation is complete
import {
  reverseConsumptionSchema,
  reversalReasonLabels,
} from '@/lib/validation/production-schemas'

describe('Reversal Validation Schemas (Story 04.6d)', () => {
  /**
   * AC6: Reversal Reason Validation
   */
  describe('reverseConsumptionSchema', () => {
    it('should reject empty object', () => {
      const result = reverseConsumptionSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('should reject missing consumption_id', () => {
      const result = reverseConsumptionSchema.safeParse({
        reason: 'scanned_wrong_lp',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('consumption_id'))).toBe(true)
      }
    })

    it('should reject invalid consumption_id (not UUID)', () => {
      const result = reverseConsumptionSchema.safeParse({
        consumption_id: 'not-a-uuid',
        reason: 'scanned_wrong_lp',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing reason', () => {
      const result = reverseConsumptionSchema.safeParse({
        consumption_id: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('reason'))).toBe(true)
      }
    })

    it('should accept valid consumption_id and reason', () => {
      const result = reverseConsumptionSchema.safeParse({
        consumption_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'scanned_wrong_lp',
      })
      expect(result.success).toBe(true)
    })

    it('should accept reason "scanned_wrong_lp"', () => {
      const result = reverseConsumptionSchema.safeParse({
        consumption_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'scanned_wrong_lp',
      })
      expect(result.success).toBe(true)
    })

    it('should accept reason "wrong_quantity"', () => {
      const result = reverseConsumptionSchema.safeParse({
        consumption_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'wrong_quantity',
      })
      expect(result.success).toBe(true)
    })

    it('should accept reason "operator_error"', () => {
      const result = reverseConsumptionSchema.safeParse({
        consumption_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'operator_error',
      })
      expect(result.success).toBe(true)
    })

    it('should accept reason "quality_issue"', () => {
      const result = reverseConsumptionSchema.safeParse({
        consumption_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'quality_issue',
      })
      expect(result.success).toBe(true)
    })

    it('should accept reason "other" with notes provided', () => {
      const result = reverseConsumptionSchema.safeParse({
        consumption_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'other',
        notes: 'Custom reason explanation',
      })
      expect(result.success).toBe(true)
    })

    it('should reject reason "other" without notes', () => {
      const result = reverseConsumptionSchema.safeParse({
        consumption_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'other',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('notes'))).toBe(true)
      }
    })

    it('should reject reason "other" with empty notes', () => {
      const result = reverseConsumptionSchema.safeParse({
        consumption_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'other',
        notes: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject reason "other" with whitespace-only notes', () => {
      const result = reverseConsumptionSchema.safeParse({
        consumption_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'other',
        notes: '   ',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid reason value', () => {
      const result = reverseConsumptionSchema.safeParse({
        consumption_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'invalid_reason',
      })
      expect(result.success).toBe(false)
    })

    it('should accept optional notes for non-other reasons', () => {
      const result = reverseConsumptionSchema.safeParse({
        consumption_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'scanned_wrong_lp',
        notes: 'Additional context',
      })
      expect(result.success).toBe(true)
    })

    it('should reject notes over 500 characters', () => {
      const longNotes = 'a'.repeat(501)
      const result = reverseConsumptionSchema.safeParse({
        consumption_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'other',
        notes: longNotes,
      })
      expect(result.success).toBe(false)
    })

    it('should accept notes at exactly 500 characters', () => {
      const maxNotes = 'a'.repeat(500)
      const result = reverseConsumptionSchema.safeParse({
        consumption_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'other',
        notes: maxNotes,
      })
      expect(result.success).toBe(true)
    })
  })

  /**
   * Reversal Reason Labels
   */
  describe('reversalReasonLabels', () => {
    it('should have label for scanned_wrong_lp', () => {
      expect(reversalReasonLabels.scanned_wrong_lp).toBe('Scanned Wrong LP')
    })

    it('should have label for wrong_quantity', () => {
      expect(reversalReasonLabels.wrong_quantity).toBe('Wrong Quantity Entered')
    })

    it('should have label for operator_error', () => {
      expect(reversalReasonLabels.operator_error).toBe('Operator Error')
    })

    it('should have label for quality_issue', () => {
      expect(reversalReasonLabels.quality_issue).toBe('Quality Issue')
    })

    it('should have label for other', () => {
      expect(reversalReasonLabels.other).toBe('Other (specify)')
    })

    it('should have exactly 5 reason labels', () => {
      expect(Object.keys(reversalReasonLabels)).toHaveLength(5)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * reverseConsumptionSchema (17 tests):
 *   - Empty object rejection
 *   - Missing consumption_id
 *   - Invalid consumption_id (not UUID)
 *   - Missing reason
 *   - Valid consumption_id + reason
 *   - All valid reason values (5 tests)
 *   - Reason "other" with/without notes (4 tests)
 *   - Invalid reason value
 *   - Optional notes for non-other
 *   - Notes length validation (2 tests)
 *
 * reversalReasonLabels (6 tests):
 *   - Label for each reason type
 *   - Count of labels
 *
 * Total: 23 tests
 */
