/**
 * WO Operations Schemas - Unit Tests
 * Story: 03.12 - WO Operations (Routing Copy)
 *
 * Tests Zod validation schemas for:
 * - copyRoutingSchema: Manual routing copy trigger
 * - updateWOOperationSchema: Update operation fields
 * - startOperationSchema: Start operation with timestamp
 * - completeOperationSchema: Complete operation with yield
 * - skipOperationSchema: Skip operation with required reason
 * - operationsQuerySchema: Query params for list endpoint
 *
 * Coverage Target: 80%+
 */

import { describe, it, expect } from 'vitest'
import {
  copyRoutingSchema,
  updateWOOperationSchema,
  startOperationSchema,
  completeOperationSchema,
  skipOperationSchema,
  operationsQuerySchema,
  woOperationStatusEnum,
} from '../wo-operations-schemas'

// ============================================================================
// woOperationStatusEnum Tests
// ============================================================================

describe('woOperationStatusEnum', () => {
  it('should accept valid status "pending"', () => {
    const result = woOperationStatusEnum.safeParse('pending')
    expect(result.success).toBe(true)
    expect(result.data).toBe('pending')
  })

  it('should accept valid status "in_progress"', () => {
    const result = woOperationStatusEnum.safeParse('in_progress')
    expect(result.success).toBe(true)
    expect(result.data).toBe('in_progress')
  })

  it('should accept valid status "completed"', () => {
    const result = woOperationStatusEnum.safeParse('completed')
    expect(result.success).toBe(true)
    expect(result.data).toBe('completed')
  })

  it('should accept valid status "skipped"', () => {
    const result = woOperationStatusEnum.safeParse('skipped')
    expect(result.success).toBe(true)
    expect(result.data).toBe('skipped')
  })

  it('should reject invalid status', () => {
    const result = woOperationStatusEnum.safeParse('invalid')
    expect(result.success).toBe(false)
  })

  it('should reject empty string', () => {
    const result = woOperationStatusEnum.safeParse('')
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// copyRoutingSchema Tests
// ============================================================================

describe('copyRoutingSchema', () => {
  it('should accept valid UUID for wo_id', () => {
    const result = copyRoutingSchema.safeParse({
      wo_id: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid UUID', () => {
    const result = copyRoutingSchema.safeParse({
      wo_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Invalid Work Order ID')
    }
  })

  it('should reject missing wo_id', () => {
    const result = copyRoutingSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('should reject empty string wo_id', () => {
    const result = copyRoutingSchema.safeParse({
      wo_id: '',
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// updateWOOperationSchema Tests
// ============================================================================

describe('updateWOOperationSchema', () => {
  it('should accept empty object (all fields optional)', () => {
    const result = updateWOOperationSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should accept valid status', () => {
    const result = updateWOOperationSchema.safeParse({
      status: 'in_progress',
    })
    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('in_progress')
  })

  it('should reject invalid status', () => {
    const result = updateWOOperationSchema.safeParse({
      status: 'invalid_status',
    })
    expect(result.success).toBe(false)
  })

  it('should accept valid actual_duration_minutes', () => {
    const result = updateWOOperationSchema.safeParse({
      actual_duration_minutes: 45,
    })
    expect(result.success).toBe(true)
    expect(result.data?.actual_duration_minutes).toBe(45)
  })

  it('should accept zero duration', () => {
    const result = updateWOOperationSchema.safeParse({
      actual_duration_minutes: 0,
    })
    expect(result.success).toBe(true)
    expect(result.data?.actual_duration_minutes).toBe(0)
  })

  it('should reject negative duration', () => {
    const result = updateWOOperationSchema.safeParse({
      actual_duration_minutes: -10,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('negative')
    }
  })

  it('should reject non-integer duration', () => {
    const result = updateWOOperationSchema.safeParse({
      actual_duration_minutes: 45.5,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('whole number')
    }
  })

  it('should accept null duration', () => {
    const result = updateWOOperationSchema.safeParse({
      actual_duration_minutes: null,
    })
    expect(result.success).toBe(true)
    expect(result.data?.actual_duration_minutes).toBeNull()
  })

  it('should accept valid actual_yield_percent', () => {
    const result = updateWOOperationSchema.safeParse({
      actual_yield_percent: 95.5,
    })
    expect(result.success).toBe(true)
    expect(result.data?.actual_yield_percent).toBe(95.5)
  })

  it('should accept zero yield', () => {
    const result = updateWOOperationSchema.safeParse({
      actual_yield_percent: 0,
    })
    expect(result.success).toBe(true)
  })

  it('should accept 100% yield', () => {
    const result = updateWOOperationSchema.safeParse({
      actual_yield_percent: 100,
    })
    expect(result.success).toBe(true)
  })

  it('should reject yield over 100', () => {
    const result = updateWOOperationSchema.safeParse({
      actual_yield_percent: 101,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('100')
    }
  })

  it('should reject negative yield', () => {
    const result = updateWOOperationSchema.safeParse({
      actual_yield_percent: -5,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('negative')
    }
  })

  it('should accept valid skip_reason', () => {
    const result = updateWOOperationSchema.safeParse({
      skip_reason: 'Equipment malfunction',
    })
    expect(result.success).toBe(true)
    expect(result.data?.skip_reason).toBe('Equipment malfunction')
  })

  it('should reject skip_reason over 500 chars', () => {
    const result = updateWOOperationSchema.safeParse({
      skip_reason: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('500')
    }
  })

  it('should accept valid notes', () => {
    const result = updateWOOperationSchema.safeParse({
      notes: 'Operation completed with minor adjustments',
    })
    expect(result.success).toBe(true)
    expect(result.data?.notes).toBe('Operation completed with minor adjustments')
  })

  it('should reject notes over 2000 chars', () => {
    const result = updateWOOperationSchema.safeParse({
      notes: 'a'.repeat(2001),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('2000')
    }
  })

  it('should accept all fields together', () => {
    const result = updateWOOperationSchema.safeParse({
      status: 'completed',
      actual_duration_minutes: 50,
      actual_yield_percent: 97.3,
      notes: 'All good',
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// startOperationSchema Tests
// ============================================================================

describe('startOperationSchema', () => {
  it('should accept empty object (started_at optional)', () => {
    const result = startOperationSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should accept valid ISO 8601 timestamp', () => {
    const result = startOperationSchema.safeParse({
      started_at: '2025-01-09T10:30:00Z',
    })
    expect(result.success).toBe(true)
    expect(result.data?.started_at).toBe('2025-01-09T10:30:00Z')
  })

  it('should reject timestamp with offset (Zod datetime requires Z suffix)', () => {
    // Note: Zod's z.string().datetime() by default only accepts UTC (Z suffix)
    // Offset format like +05:00 requires offset: true option
    const result = startOperationSchema.safeParse({
      started_at: '2025-01-09T10:30:00+05:00',
    })
    // This fails because offset timestamps require explicit offset: true in Zod
    expect(result.success).toBe(false)
  })

  it('should accept timestamp with milliseconds', () => {
    const result = startOperationSchema.safeParse({
      started_at: '2025-01-09T10:30:00.123Z',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid timestamp format', () => {
    const result = startOperationSchema.safeParse({
      started_at: '2025-01-09 10:30:00',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('ISO 8601')
    }
  })

  it('should reject date only (no time)', () => {
    const result = startOperationSchema.safeParse({
      started_at: '2025-01-09',
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-string timestamp', () => {
    const result = startOperationSchema.safeParse({
      started_at: 1704800000000,
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// completeOperationSchema Tests
// ============================================================================

describe('completeOperationSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = completeOperationSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should accept valid completed_at timestamp', () => {
    const result = completeOperationSchema.safeParse({
      completed_at: '2025-01-09T11:30:00Z',
    })
    expect(result.success).toBe(true)
  })

  it('should accept valid actual_yield_percent', () => {
    const result = completeOperationSchema.safeParse({
      actual_yield_percent: 98.5,
    })
    expect(result.success).toBe(true)
    expect(result.data?.actual_yield_percent).toBe(98.5)
  })

  it('should reject yield over 100', () => {
    const result = completeOperationSchema.safeParse({
      actual_yield_percent: 105,
    })
    expect(result.success).toBe(false)
  })

  it('should accept valid notes', () => {
    const result = completeOperationSchema.safeParse({
      notes: 'Completed successfully',
    })
    expect(result.success).toBe(true)
  })

  it('should accept all fields together', () => {
    const result = completeOperationSchema.safeParse({
      completed_at: '2025-01-09T11:30:00Z',
      actual_yield_percent: 96.2,
      notes: 'Minor variance in temperature',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid timestamp', () => {
    const result = completeOperationSchema.safeParse({
      completed_at: 'not-a-timestamp',
    })
    expect(result.success).toBe(false)
  })

  it('should reject notes over 2000 chars', () => {
    const result = completeOperationSchema.safeParse({
      notes: 'x'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// skipOperationSchema Tests
// ============================================================================

describe('skipOperationSchema', () => {
  it('should accept valid skip_reason', () => {
    const result = skipOperationSchema.safeParse({
      skip_reason: 'Equipment not available',
    })
    expect(result.success).toBe(true)
    expect(result.data?.skip_reason).toBe('Equipment not available')
  })

  it('should reject missing skip_reason', () => {
    const result = skipOperationSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('should reject empty skip_reason', () => {
    const result = skipOperationSchema.safeParse({
      skip_reason: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('required')
    }
  })

  it('should reject skip_reason over 500 chars', () => {
    const result = skipOperationSchema.safeParse({
      skip_reason: 'r'.repeat(501),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('500')
    }
  })

  it('should accept exactly 500 char skip_reason', () => {
    const result = skipOperationSchema.safeParse({
      skip_reason: 'r'.repeat(500),
    })
    expect(result.success).toBe(true)
  })

  it('should accept single character skip_reason', () => {
    const result = skipOperationSchema.safeParse({
      skip_reason: 'X',
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// operationsQuerySchema Tests
// ============================================================================

describe('operationsQuerySchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = operationsQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should accept valid status filter', () => {
    const result = operationsQuerySchema.safeParse({
      status: 'pending',
    })
    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('pending')
  })

  it('should reject invalid status filter', () => {
    const result = operationsQuerySchema.safeParse({
      status: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('should transform include_completed "true" to boolean', () => {
    const result = operationsQuerySchema.safeParse({
      include_completed: 'true',
    })
    expect(result.success).toBe(true)
    expect(result.data?.include_completed).toBe(true)
  })

  it('should transform include_completed "false" to boolean', () => {
    const result = operationsQuerySchema.safeParse({
      include_completed: 'false',
    })
    expect(result.success).toBe(true)
    expect(result.data?.include_completed).toBe(false)
  })

  it('should transform include_skipped "true" to boolean', () => {
    const result = operationsQuerySchema.safeParse({
      include_skipped: 'true',
    })
    expect(result.success).toBe(true)
    expect(result.data?.include_skipped).toBe(true)
  })

  it('should reject invalid include_completed value', () => {
    const result = operationsQuerySchema.safeParse({
      include_completed: 'yes',
    })
    expect(result.success).toBe(false)
  })

  it('should accept all filters together', () => {
    const result = operationsQuerySchema.safeParse({
      status: 'in_progress',
      include_completed: 'true',
      include_skipped: 'false',
    })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      status: 'in_progress',
      include_completed: true,
      include_skipped: false,
    })
  })
})
