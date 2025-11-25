/**
 * Validation Schema Tests: Routing Schemas
 * Batch 2C - Stories: 2.15, 2.16, 2.17
 *
 * Tests Zod validation schemas for:
 * - Routing CRUD (Story 2.15)
 * - Routing Operations (Story 2.16)
 * - Product-Routing Assignments (Story 2.17)
 */

import { describe, it, expect } from 'vitest'
import {
  createRoutingSchema,
  updateRoutingSchema,
  routingFiltersSchema,
  createOperationSchema,
  updateOperationSchema,
  reorderOperationsSchema,
  assignProductsSchema,
  assignRoutingsSchema,
  type CreateRoutingInput,
  type UpdateRoutingInput,
  type CreateOperationInput,
  type UpdateOperationInput,
  type ReorderOperationsInput,
  type AssignProductsInput,
  type AssignRoutingsInput,
} from '@/lib/validation/routing-schemas'

describe('Routing Validation Schemas (Batch 2C)', () => {
  // ============================================================================
  // createRoutingSchema (Story 2.15) - AC-015.1
  // ============================================================================
  describe('createRoutingSchema (Story 2.15)', () => {
    it('should accept valid routing data', () => {
      const validRouting: CreateRoutingInput = {
        code: 'RT-001',
        name: 'Production Routing',
      }

      const result = createRoutingSchema.safeParse(validRouting)
      expect(result.success).toBe(true)
    })

    it('should accept routing with all optional fields', () => {
      const fullRouting: CreateRoutingInput = {
        code: 'RT-002',
        name: 'Full Routing',
        description: 'Complete routing with all fields',
        status: 'active',
        is_reusable: false,
      }

      const result = createRoutingSchema.safeParse(fullRouting)
      expect(result.success).toBe(true)
    })

    it('should transform code to uppercase', () => {
      const routing: CreateRoutingInput = {
        code: 'rt-lowercase',
        name: 'Test Routing',
      }

      const result = createRoutingSchema.safeParse(routing)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.code).toBe('RT-LOWERCASE')
      }
    })

    it('should reject code shorter than 2 characters', () => {
      const result = createRoutingSchema.safeParse({
        code: 'R',
        name: 'Test',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('code')
        expect(result.error.errors[0].message).toContain('at least 2')
      }
    })

    it('should reject code longer than 50 characters', () => {
      const result = createRoutingSchema.safeParse({
        code: 'R'.repeat(51),
        name: 'Test',
      })
      expect(result.success).toBe(false)
    })

    it('should reject code with invalid characters', () => {
      const invalidCodes = ['RT 001', 'RT@001', 'RT_001', 'RT.001', 'rt#001']

      invalidCodes.forEach((code) => {
        const result = createRoutingSchema.safeParse({
          code,
          name: 'Test',
        })
        expect(result.success).toBe(false)
      })
    })

    it('should accept valid code formats (uppercase, numbers, hyphens)', () => {
      const validCodes = ['RT-001', 'ROUTING-A', 'R1', 'ABC123', 'A-B-C-1']

      validCodes.forEach((code) => {
        const result = createRoutingSchema.safeParse({
          code,
          name: 'Test',
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject empty name', () => {
      const result = createRoutingSchema.safeParse({
        code: 'RT-001',
        name: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject name longer than 100 characters', () => {
      const result = createRoutingSchema.safeParse({
        code: 'RT-001',
        name: 'N'.repeat(101),
      })
      expect(result.success).toBe(false)
    })

    it('should reject description longer than 1000 characters', () => {
      const result = createRoutingSchema.safeParse({
        code: 'RT-001',
        name: 'Test',
        description: 'D'.repeat(1001),
      })
      expect(result.success).toBe(false)
    })

    it('should default status to active', () => {
      const result = createRoutingSchema.safeParse({
        code: 'RT-001',
        name: 'Test',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('active')
      }
    })

    it('should default is_reusable to true', () => {
      const result = createRoutingSchema.safeParse({
        code: 'RT-001',
        name: 'Test',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_reusable).toBe(true)
      }
    })

    it('should accept valid status values', () => {
      const statuses = ['active', 'inactive'] as const

      statuses.forEach((status) => {
        const result = createRoutingSchema.safeParse({
          code: 'RT-001',
          name: 'Test',
          status,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid status value', () => {
      const result = createRoutingSchema.safeParse({
        code: 'RT-001',
        name: 'Test',
        status: 'invalid',
      })
      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // updateRoutingSchema (Story 2.15) - AC-015.5
  // ============================================================================
  describe('updateRoutingSchema (Story 2.15)', () => {
    it('should accept partial update with name only', () => {
      const result = updateRoutingSchema.safeParse({
        name: 'Updated Name',
      })
      expect(result.success).toBe(true)
    })

    it('should accept partial update with status only', () => {
      const result = updateRoutingSchema.safeParse({
        status: 'inactive',
      })
      expect(result.success).toBe(true)
    })

    it('should accept all updatable fields', () => {
      const result = updateRoutingSchema.safeParse({
        name: 'Updated Name',
        description: 'Updated description',
        status: 'inactive',
        is_reusable: false,
      })
      expect(result.success).toBe(true)
    })

    it('should accept null description', () => {
      const result = updateRoutingSchema.safeParse({
        description: null,
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty update (all fields optional)', () => {
      const result = updateRoutingSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  // ============================================================================
  // routingFiltersSchema (Story 2.15) - AC-015.3
  // ============================================================================
  describe('routingFiltersSchema (Story 2.15)', () => {
    it('should accept valid filter options', () => {
      const result = routingFiltersSchema.safeParse({
        status: 'active',
        search: 'production',
        sort_by: 'code',
        sort_direction: 'asc',
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty filters', () => {
      const result = routingFiltersSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should accept status "all" for showing all routings', () => {
      const result = routingFiltersSchema.safeParse({
        status: 'all',
      })
      expect(result.success).toBe(true)
    })

    it('should accept valid sort_by values', () => {
      const sortFields = ['code', 'name', 'status', 'created_at'] as const

      sortFields.forEach((sort_by) => {
        const result = routingFiltersSchema.safeParse({ sort_by })
        expect(result.success).toBe(true)
      })
    })

    it('should accept valid sort_direction values', () => {
      const directions = ['asc', 'desc'] as const

      directions.forEach((sort_direction) => {
        const result = routingFiltersSchema.safeParse({ sort_direction })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid status', () => {
      const result = routingFiltersSchema.safeParse({
        status: 'invalid',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid sort_by', () => {
      const result = routingFiltersSchema.safeParse({
        sort_by: 'invalid_field',
      })
      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // createOperationSchema (Story 2.16) - AC-016.1
  // ============================================================================
  describe('createOperationSchema (Story 2.16)', () => {
    it('should accept valid operation data', () => {
      const validOp: CreateOperationInput = {
        sequence: 1,
        operation_name: 'Mixing',
        expected_duration_minutes: 30,
      }

      const result = createOperationSchema.safeParse(validOp)
      expect(result.success).toBe(true)
    })

    it('should accept operation with all fields', () => {
      const fullOp: CreateOperationInput = {
        sequence: 1,
        operation_name: 'Mixing',
        machine_id: '550e8400-e29b-41d4-a716-446655440000',
        line_id: '550e8400-e29b-41d4-a716-446655440001',
        expected_duration_minutes: 30,
        expected_yield_percent: 95.5,
        setup_time_minutes: 10,
        labor_cost: 25.50,
      }

      const result = createOperationSchema.safeParse(fullOp)
      expect(result.success).toBe(true)
    })

    it('should reject non-integer sequence', () => {
      const result = createOperationSchema.safeParse({
        sequence: 1.5,
        operation_name: 'Test',
        expected_duration_minutes: 30,
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative sequence', () => {
      const result = createOperationSchema.safeParse({
        sequence: -1,
        operation_name: 'Test',
        expected_duration_minutes: 30,
      })
      expect(result.success).toBe(false)
    })

    it('should reject zero sequence', () => {
      const result = createOperationSchema.safeParse({
        sequence: 0,
        operation_name: 'Test',
        expected_duration_minutes: 30,
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty operation_name', () => {
      const result = createOperationSchema.safeParse({
        sequence: 1,
        operation_name: '',
        expected_duration_minutes: 30,
      })
      expect(result.success).toBe(false)
    })

    it('should reject operation_name longer than 100 characters', () => {
      const result = createOperationSchema.safeParse({
        sequence: 1,
        operation_name: 'O'.repeat(101),
        expected_duration_minutes: 30,
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid machine_id (not UUID)', () => {
      const result = createOperationSchema.safeParse({
        sequence: 1,
        operation_name: 'Test',
        expected_duration_minutes: 30,
        machine_id: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid line_id (not UUID)', () => {
      const result = createOperationSchema.safeParse({
        sequence: 1,
        operation_name: 'Test',
        expected_duration_minutes: 30,
        line_id: 'invalid',
      })
      expect(result.success).toBe(false)
    })

    it('should reject non-positive expected_duration_minutes', () => {
      const result = createOperationSchema.safeParse({
        sequence: 1,
        operation_name: 'Test',
        expected_duration_minutes: 0,
      })
      expect(result.success).toBe(false)
    })

    it('should reject expected_yield_percent less than 0.01', () => {
      const result = createOperationSchema.safeParse({
        sequence: 1,
        operation_name: 'Test',
        expected_duration_minutes: 30,
        expected_yield_percent: 0,
      })
      expect(result.success).toBe(false)
    })

    it('should reject expected_yield_percent greater than 100', () => {
      const result = createOperationSchema.safeParse({
        sequence: 1,
        operation_name: 'Test',
        expected_duration_minutes: 30,
        expected_yield_percent: 101,
      })
      expect(result.success).toBe(false)
    })

    it('should default expected_yield_percent to 100', () => {
      const result = createOperationSchema.safeParse({
        sequence: 1,
        operation_name: 'Test',
        expected_duration_minutes: 30,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.expected_yield_percent).toBe(100)
      }
    })

    it('should default setup_time_minutes to 0', () => {
      const result = createOperationSchema.safeParse({
        sequence: 1,
        operation_name: 'Test',
        expected_duration_minutes: 30,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.setup_time_minutes).toBe(0)
      }
    })

    it('should reject negative setup_time_minutes', () => {
      const result = createOperationSchema.safeParse({
        sequence: 1,
        operation_name: 'Test',
        expected_duration_minutes: 30,
        setup_time_minutes: -5,
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative labor_cost', () => {
      const result = createOperationSchema.safeParse({
        sequence: 1,
        operation_name: 'Test',
        expected_duration_minutes: 30,
        labor_cost: -10,
      })
      expect(result.success).toBe(false)
    })

    it('should accept null machine_id', () => {
      const result = createOperationSchema.safeParse({
        sequence: 1,
        operation_name: 'Test',
        expected_duration_minutes: 30,
        machine_id: null,
      })
      expect(result.success).toBe(true)
    })

    it('should accept null line_id', () => {
      const result = createOperationSchema.safeParse({
        sequence: 1,
        operation_name: 'Test',
        expected_duration_minutes: 30,
        line_id: null,
      })
      expect(result.success).toBe(true)
    })
  })

  // ============================================================================
  // updateOperationSchema (Story 2.16) - AC-016.4
  // ============================================================================
  describe('updateOperationSchema (Story 2.16)', () => {
    it('should accept partial update', () => {
      const result = updateOperationSchema.safeParse({
        operation_name: 'Updated Name',
      })
      expect(result.success).toBe(true)
    })

    it('should accept all updatable fields', () => {
      const result = updateOperationSchema.safeParse({
        sequence: 2,
        operation_name: 'Updated Operation',
        machine_id: '550e8400-e29b-41d4-a716-446655440000',
        line_id: '550e8400-e29b-41d4-a716-446655440001',
        expected_duration_minutes: 60,
        expected_yield_percent: 98,
        setup_time_minutes: 15,
        labor_cost: 30.00,
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty update', () => {
      const result = updateOperationSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should accept null labor_cost', () => {
      const result = updateOperationSchema.safeParse({
        labor_cost: null,
      })
      expect(result.success).toBe(true)
    })
  })

  // ============================================================================
  // reorderOperationsSchema (Story 2.16) - AC-016.3
  // ============================================================================
  describe('reorderOperationsSchema (Story 2.16)', () => {
    it('should accept valid reorder data', () => {
      const reorder: ReorderOperationsInput = {
        operations: [
          { id: '550e8400-e29b-41d4-a716-446655440001', sequence: 1 },
          { id: '550e8400-e29b-41d4-a716-446655440002', sequence: 2 },
          { id: '550e8400-e29b-41d4-a716-446655440003', sequence: 3 },
        ],
      }

      const result = reorderOperationsSchema.safeParse(reorder)
      expect(result.success).toBe(true)
    })

    it('should reject invalid operation ID', () => {
      const result = reorderOperationsSchema.safeParse({
        operations: [
          { id: 'not-a-uuid', sequence: 1 },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative sequence', () => {
      const result = reorderOperationsSchema.safeParse({
        operations: [
          { id: '550e8400-e29b-41d4-a716-446655440001', sequence: -1 },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('should reject zero sequence', () => {
      const result = reorderOperationsSchema.safeParse({
        operations: [
          { id: '550e8400-e29b-41d4-a716-446655440001', sequence: 0 },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('should accept empty operations array', () => {
      const result = reorderOperationsSchema.safeParse({
        operations: [],
      })
      // Empty array should be valid (no ops to reorder)
      expect(result.success).toBe(true)
    })
  })

  // ============================================================================
  // assignProductsSchema (Story 2.17)
  // ============================================================================
  describe('assignProductsSchema (Story 2.17)', () => {
    it('should accept valid product assignment', () => {
      const assignment: AssignProductsInput = {
        product_ids: [
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
        ],
      }

      const result = assignProductsSchema.safeParse(assignment)
      expect(result.success).toBe(true)
    })

    it('should accept assignment with default_product_id', () => {
      const result = assignProductsSchema.safeParse({
        product_ids: ['550e8400-e29b-41d4-a716-446655440001'],
        default_product_id: '550e8400-e29b-41d4-a716-446655440001',
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty product_ids array', () => {
      const result = assignProductsSchema.safeParse({
        product_ids: [],
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid product_id (not UUID)', () => {
      const result = assignProductsSchema.safeParse({
        product_ids: ['invalid-id'],
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid default_product_id', () => {
      const result = assignProductsSchema.safeParse({
        product_ids: ['550e8400-e29b-41d4-a716-446655440001'],
        default_product_id: 'invalid',
      })
      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // assignRoutingsSchema (Story 2.17) - AC-017.5
  // ============================================================================
  describe('assignRoutingsSchema (Story 2.17)', () => {
    it('should accept valid routing assignment', () => {
      const assignment: AssignRoutingsInput = {
        routing_ids: [
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
        ],
      }

      const result = assignRoutingsSchema.safeParse(assignment)
      expect(result.success).toBe(true)
    })

    it('should accept assignment with default_routing_id', () => {
      const result = assignRoutingsSchema.safeParse({
        routing_ids: ['550e8400-e29b-41d4-a716-446655440001'],
        default_routing_id: '550e8400-e29b-41d4-a716-446655440001',
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty routing_ids array', () => {
      const result = assignRoutingsSchema.safeParse({
        routing_ids: [],
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid routing_id', () => {
      const result = assignRoutingsSchema.safeParse({
        routing_ids: ['not-a-valid-uuid'],
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid default_routing_id', () => {
      const result = assignRoutingsSchema.safeParse({
        routing_ids: [],
        default_routing_id: 'invalid',
      })
      expect(result.success).toBe(false)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * createRoutingSchema (14 tests):
 *   - Valid routing data
 *   - All optional fields
 *   - Code transform to uppercase
 *   - Code length validation (min/max)
 *   - Code character validation
 *   - Valid code formats
 *   - Name validation (empty/length)
 *   - Description length validation
 *   - Default values (status, is_reusable)
 *   - Status values validation
 *
 * updateRoutingSchema (5 tests):
 *   - Partial updates
 *   - All updatable fields
 *   - Null description
 *   - Empty update
 *
 * routingFiltersSchema (7 tests):
 *   - Valid filters
 *   - Empty filters
 *   - Status "all"
 *   - Sort by/direction values
 *   - Invalid values rejection
 *
 * createOperationSchema (18 tests):
 *   - Valid operation data
 *   - All fields
 *   - Sequence validation (int, positive)
 *   - operation_name validation
 *   - UUID validation (machine_id, line_id)
 *   - Duration validation
 *   - Yield percent validation
 *   - Default values
 *   - Labor cost validation
 *   - Null optional fields
 *
 * updateOperationSchema (4 tests):
 *   - Partial update
 *   - All fields
 *   - Empty update
 *   - Null labor_cost
 *
 * reorderOperationsSchema (5 tests):
 *   - Valid reorder
 *   - Invalid ID
 *   - Sequence validation
 *   - Empty array
 *
 * assignProductsSchema (5 tests):
 *   - Valid assignment
 *   - With default_product_id
 *   - Empty array
 *   - Invalid ID rejection
 *
 * assignRoutingsSchema (5 tests):
 *   - Valid assignment
 *   - With default_routing_id
 *   - Empty array
 *   - Invalid ID rejection
 *
 * Total: 63 tests
 */
