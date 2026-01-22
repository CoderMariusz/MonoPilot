/**
 * Inspection Validation Schemas - Unit Tests
 * Story: 06.5 - Incoming Inspection
 * Phase: GREEN - Tests pass with implemented schemas
 *
 * Tests the Zod validation schemas for inspection operations including:
 * - Create inspection validation (product_id, references, priority)
 * - Assign inspector validation (inspector_id required, UUID format)
 * - Start inspection validation (take_over optional flag)
 * - Complete inspection validation (result required, conditional fields)
 * - Cancel inspection validation (reason required, min length)
 * - List query validation (filters, pagination, sorting)
 *
 * Coverage Target: 85%+
 * Test Count: 60 scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-2: Inspection number generation
 * - AC-4: Manual inspection creation with validation
 * - AC-6: Inspector assignment validation
 * - AC-9-11: Complete inspection result validation
 * - AC-13: Cancel inspection validation
 */

import { describe, it, expect } from 'vitest'
import {
  createInspectionSchema,
  assignInspectionSchema,
  startInspectionSchema,
  completeInspectionSchema,
  cancelInspectionSchema,
  inspectionListQuerySchema,
  inspectionTypeEnum,
  inspectionStatusEnum,
  inspectionPriorityEnum,
  inspectionResultEnum,
  type CreateInspectionInput,
  type AssignInspectionInput,
  type CompleteInspectionInput,
  type InspectionListQuery,
} from '@/lib/validation/inspection'

describe('Inspection Validation Schemas (Story 06.5)', () => {
  describe('inspectionTypeEnum', () => {
    it('should accept incoming type', () => {
      const result = inspectionTypeEnum.safeParse('incoming')
      expect(result.success).toBe(true)
    })

    it('should accept in_process type', () => {
      const result = inspectionTypeEnum.safeParse('in_process')
      expect(result.success).toBe(true)
    })

    it('should accept final type', () => {
      const result = inspectionTypeEnum.safeParse('final')
      expect(result.success).toBe(true)
    })

    it('should reject invalid type', () => {
      const result = inspectionTypeEnum.safeParse('unknown')
      expect(result.success).toBe(false)
    })
  })

  describe('inspectionStatusEnum', () => {
    it('should accept all valid statuses', () => {
      const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled']
      statuses.forEach(status => {
        const result = inspectionStatusEnum.safeParse(status)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid status', () => {
      const result = inspectionStatusEnum.safeParse('pending')
      expect(result.success).toBe(false)
    })
  })

  describe('inspectionPriorityEnum', () => {
    it('should accept all valid priorities', () => {
      const priorities = ['low', 'normal', 'high', 'urgent']
      priorities.forEach(priority => {
        const result = inspectionPriorityEnum.safeParse(priority)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid priority', () => {
      const result = inspectionPriorityEnum.safeParse('critical')
      expect(result.success).toBe(false)
    })
  })

  describe('inspectionResultEnum', () => {
    it('should accept all valid results', () => {
      const results = ['pass', 'fail', 'conditional']
      results.forEach(result => {
        const parsed = inspectionResultEnum.safeParse(result)
        expect(parsed.success).toBe(true)
      })
    })

    it('should reject invalid result', () => {
      const result = inspectionResultEnum.safeParse('pending')
      expect(result.success).toBe(false)
    })
  })

  describe('createInspectionSchema - Valid Data', () => {
    it('should accept valid inspection with LP reference', () => {
      const valid: CreateInspectionInput = {
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        lp_id: '550e8400-e29b-41d4-a716-446655440002',
        priority: 'normal',
      }

      const result = createInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should accept valid inspection with GRN reference', () => {
      const valid: CreateInspectionInput = {
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        grn_id: '550e8400-e29b-41d4-a716-446655440003',
        priority: 'high',
      }

      const result = createInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should accept valid inspection with PO reference', () => {
      const valid: CreateInspectionInput = {
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        po_id: '550e8400-e29b-41d4-a716-446655440004',
        priority: 'urgent',
      }

      const result = createInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should accept inspection with all optional fields', () => {
      const valid: CreateInspectionInput = {
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        lp_id: '550e8400-e29b-41d4-a716-446655440002',
        spec_id: '550e8400-e29b-41d4-a716-446655440005',
        batch_number: 'BATCH-2025-001',
        lot_size: 100,
        priority: 'normal',
        scheduled_date: '2025-01-22',
        inspector_id: '550e8400-e29b-41d4-a716-446655440006',
        notes: 'Standard incoming inspection',
      }

      const result = createInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should default priority to normal if not provided', () => {
      const input: CreateInspectionInput = {
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        lp_id: '550e8400-e29b-41d4-a716-446655440002',
      }

      const result = createInspectionSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.priority).toBe('normal')
      }
    })
  })

  describe('createInspectionSchema - Required Fields', () => {
    it('should reject if product_id missing', () => {
      const invalid = {
        lp_id: '550e8400-e29b-41d4-a716-446655440002',
      }

      const result = createInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('product_id'))).toBe(true)
      }
    })

    it('should reject if product_id is not valid UUID', () => {
      const invalid: CreateInspectionInput = {
        product_id: 'not-a-uuid',
        lp_id: '550e8400-e29b-41d4-a716-446655440002',
      }

      const result = createInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject if no reference provided (AC-4)', () => {
      const invalid: CreateInspectionInput = {
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        // No lp_id, grn_id, or po_id
      }

      const result = createInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject if invalid priority provided', () => {
      const invalid = {
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        lp_id: '550e8400-e29b-41d4-a716-446655440002',
        priority: 'critical' as any,
      }

      const result = createInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject batch_number over 100 chars', () => {
      const invalid: CreateInspectionInput = {
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        lp_id: '550e8400-e29b-41d4-a716-446655440002',
        batch_number: 'x'.repeat(101),
      }

      const result = createInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject lot_size if not positive integer', () => {
      const invalid: CreateInspectionInput = {
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        lp_id: '550e8400-e29b-41d4-a716-446655440002',
        lot_size: -10,
      }

      const result = createInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject scheduled_date with invalid format', () => {
      const invalid: CreateInspectionInput = {
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        lp_id: '550e8400-e29b-41d4-a716-446655440002',
        scheduled_date: '01/22/2025',
      }

      const result = createInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject notes over 2000 chars', () => {
      const invalid: CreateInspectionInput = {
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        lp_id: '550e8400-e29b-41d4-a716-446655440002',
        notes: 'x'.repeat(2001),
      }

      const result = createInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('assignInspectionSchema', () => {
    it('should accept valid inspector_id UUID', () => {
      const valid: AssignInspectionInput = {
        inspector_id: '550e8400-e29b-41d4-a716-446655440001',
      }

      const result = assignInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID format', () => {
      const invalid = {
        inspector_id: 'not-a-uuid',
      }

      const result = assignInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject missing inspector_id', () => {
      const invalid = {}

      const result = assignInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('startInspectionSchema', () => {
    it('should accept with take_over true', () => {
      const valid = { take_over: true }

      const result = startInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should accept with take_over false', () => {
      const valid = { take_over: false }

      const result = startInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should default take_over to false', () => {
      const input = {}

      const result = startInspectionSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.take_over).toBe(false)
      }
    })
  })

  describe('completeInspectionSchema - Pass Result', () => {
    it('should accept pass result with minimal data', () => {
      const valid: CompleteInspectionInput = {
        result: 'pass',
      }

      const result = completeInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should accept pass result with optional notes', () => {
      const valid: CompleteInspectionInput = {
        result: 'pass',
        result_notes: 'All tests passed successfully',
      }

      const result = completeInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should accept pass result with defect counts', () => {
      const valid: CompleteInspectionInput = {
        result: 'pass',
        defects_found: 0,
        major_defects: 0,
        minor_defects: 0,
        critical_defects: 0,
      }

      const result = completeInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })
  })

  describe('completeInspectionSchema - Fail Result', () => {
    it('should accept fail result with minimal data', () => {
      const valid: CompleteInspectionInput = {
        result: 'fail',
      }

      const result = completeInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should accept fail result with notes', () => {
      const valid: CompleteInspectionInput = {
        result: 'fail',
        result_notes: 'Critical defect found',
        critical_defects: 1,
      }

      const result = completeInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should accept fail result with NCR creation flag', () => {
      const valid: CompleteInspectionInput = {
        result: 'fail',
        result_notes: 'Damage detected',
        create_ncr: true,
      }

      const result = completeInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })
  })

  describe('completeInspectionSchema - Conditional Result (AC-11)', () => {
    it('should accept conditional result with required fields', () => {
      const valid: CompleteInspectionInput = {
        result: 'conditional',
        conditional_reason: 'Marginal moisture reading',
        conditional_restrictions: 'Use within 5 days, store in cool location',
        conditional_expires_at: '2025-01-27T00:00:00Z',
      }

      const result = completeInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should reject conditional without reason', () => {
      const invalid: CompleteInspectionInput = {
        result: 'conditional',
        conditional_restrictions: 'Use within 5 days',
      }

      const result = completeInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject conditional without restrictions', () => {
      const invalid: CompleteInspectionInput = {
        result: 'conditional',
        conditional_reason: 'Marginal reading',
      }

      const result = completeInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject conditional_reason over 500 chars', () => {
      const invalid: CompleteInspectionInput = {
        result: 'conditional',
        conditional_reason: 'x'.repeat(501),
        conditional_restrictions: 'restrictions',
      }

      const result = completeInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject conditional_restrictions over 1000 chars', () => {
      const invalid: CompleteInspectionInput = {
        result: 'conditional',
        conditional_reason: 'reason',
        conditional_restrictions: 'x'.repeat(1001),
      }

      const result = completeInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('completeInspectionSchema - Defect Counts', () => {
    it('should accept all defect counts', () => {
      const valid: CompleteInspectionInput = {
        result: 'fail',
        defects_found: 10,
        major_defects: 3,
        minor_defects: 7,
        critical_defects: 0,
      }

      const result = completeInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should reject negative defect_found', () => {
      const invalid: CompleteInspectionInput = {
        result: 'fail',
        defects_found: -1,
      }

      const result = completeInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject non-integer defect count', () => {
      const invalid: CompleteInspectionInput = {
        result: 'fail',
        major_defects: 3.5 as any,
      }

      const result = completeInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should default defect counts to 0', () => {
      const input: CompleteInspectionInput = {
        result: 'pass',
      }

      const result = completeInspectionSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.defects_found).toBe(0)
        expect(result.data.major_defects).toBe(0)
      }
    })
  })

  describe('cancelInspectionSchema', () => {
    it('should accept valid cancellation reason', () => {
      const valid = {
        cancellation_reason: 'GRN was rejected by supplier',
      }

      const result = cancelInspectionSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should reject reason under 10 characters', () => {
      const invalid = {
        cancellation_reason: 'Too short',
      }

      const result = cancelInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject reason over 500 characters', () => {
      const invalid = {
        cancellation_reason: 'x'.repeat(501),
      }

      const result = cancelInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject missing reason', () => {
      const invalid = {}

      const result = cancelInspectionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('inspectionListQuerySchema', () => {
    it('should accept empty query', () => {
      const query: InspectionListQuery = {}

      const result = inspectionListQuerySchema.safeParse(query)
      expect(result.success).toBe(true)
    })

    it('should accept all filter parameters', () => {
      const query: InspectionListQuery = {
        inspection_type: 'incoming',
        status: 'scheduled',
        priority: 'high',
        inspector_id: '550e8400-e29b-41d4-a716-446655440001',
        product_id: '550e8400-e29b-41d4-a716-446655440002',
        lp_id: '550e8400-e29b-41d4-a716-446655440003',
        grn_id: '550e8400-e29b-41d4-a716-446655440004',
        po_id: '550e8400-e29b-41d4-a716-446655440005',
        search: 'INS-INC-2025',
      }

      const result = inspectionListQuerySchema.safeParse(query)
      expect(result.success).toBe(true)
    })

    it('should default page to 1', () => {
      const query: InspectionListQuery = {}

      const result = inspectionListQuerySchema.safeParse(query)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
      }
    })

    it('should default limit to 20', () => {
      const query: InspectionListQuery = {}

      const result = inspectionListQuerySchema.safeParse(query)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(20)
      }
    })

    it('should default sort_by to scheduled_date', () => {
      const query: InspectionListQuery = {}

      const result = inspectionListQuerySchema.safeParse(query)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sort_by).toBe('scheduled_date')
      }
    })

    it('should default sort_order to desc', () => {
      const query: InspectionListQuery = {}

      const result = inspectionListQuerySchema.safeParse(query)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sort_order).toBe('desc')
      }
    })

    it('should reject page < 1', () => {
      const query = {
        page: 0,
      }

      const result = inspectionListQuerySchema.safeParse(query)
      expect(result.success).toBe(false)
    })

    it('should reject limit < 1', () => {
      const query = {
        limit: 0,
      }

      const result = inspectionListQuerySchema.safeParse(query)
      expect(result.success).toBe(false)
    })

    it('should reject limit > 100', () => {
      const query = {
        limit: 101,
      }

      const result = inspectionListQuerySchema.safeParse(query)
      expect(result.success).toBe(false)
    })

    it('should coerce string page to number', () => {
      const query = {
        page: '5' as any,
      }

      const result = inspectionListQuerySchema.safeParse(query)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(5)
      }
    })

    it('should accept valid sort_by values', () => {
      const sortFields = ['inspection_number', 'scheduled_date', 'created_at', 'priority']
      sortFields.forEach(field => {
        const query = { sort_by: field as any }
        const result = inspectionListQuerySchema.safeParse(query)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid sort_by', () => {
      const query = {
        sort_by: 'invalid_field' as any,
      }

      const result = inspectionListQuerySchema.safeParse(query)
      expect(result.success).toBe(false)
    })
  })
})
