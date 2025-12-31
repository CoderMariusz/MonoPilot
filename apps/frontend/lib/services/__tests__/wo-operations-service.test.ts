/**
 * WO Operations Service - Unit Tests
 * Story: 03.12 - WO Operations (Routing Copy)
 *
 * Tests the WOOperationsService which handles:
 * - copyRoutingToWO() - Copy routing operations to WO as immutable snapshot
 * - getOperationsForWO() - Retrieve operations ordered by sequence
 * - getOperationById() - Get single operation with variances
 * - calculateExpectedDuration() - Sum duration + setup + cleanup
 * - validateOperationSequence() - Check for duplicate sequences
 *
 * Coverage Target: 80%+
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  calculateExpectedDuration,
  validateOperationSequence,
  WOOperationsService,
} from '../wo-operations-service'

/**
 * Mock Supabase client
 */
const createMockSupabase = () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
  }

  return {
    from: vi.fn().mockReturnValue(mockQuery),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    _mockQuery: mockQuery,
  }
}

/**
 * ============================================================================
 * Unit Tests
 * ============================================================================
 */

describe('WOOperationsService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  /**
   * =========================================================================
   * calculateExpectedDuration() Tests
   * =========================================================================
   */

  describe('calculateExpectedDuration', () => {
    it('should sum duration + setup_time + cleanup_time', () => {
      const routingOp = {
        duration: 30,
        setup_time: 5,
        cleanup_time: 5,
      }

      const result = calculateExpectedDuration(routingOp)

      expect(result).toBe(40)
    })

    it('should handle null setup_time as 0', () => {
      const routingOp = {
        duration: 30,
        setup_time: null,
        cleanup_time: 5,
      }

      const result = calculateExpectedDuration(routingOp)

      expect(result).toBe(35)
    })

    it('should handle null cleanup_time as 0', () => {
      const routingOp = {
        duration: 30,
        setup_time: 5,
        cleanup_time: null,
      }

      const result = calculateExpectedDuration(routingOp)

      expect(result).toBe(35)
    })

    it('should handle null duration as 0', () => {
      const routingOp = {
        duration: null,
        setup_time: 5,
        cleanup_time: 5,
      }

      const result = calculateExpectedDuration(routingOp)

      expect(result).toBe(10)
    })

    it('should handle all values null as 0', () => {
      const routingOp = {
        duration: null,
        setup_time: null,
        cleanup_time: null,
      }

      const result = calculateExpectedDuration(routingOp)

      expect(result).toBe(0)
    })

    it('should calculate for large values', () => {
      const routingOp = {
        duration: 480, // 8 hours
        setup_time: 60, // 1 hour
        cleanup_time: 30, // 30 mins
      }

      const result = calculateExpectedDuration(routingOp)

      expect(result).toBe(570)
    })

    it('should handle zero values', () => {
      const routingOp = {
        duration: 0,
        setup_time: 0,
        cleanup_time: 0,
      }

      const result = calculateExpectedDuration(routingOp)

      expect(result).toBe(0)
    })

    it('should handle undefined values as 0', () => {
      const routingOp = {}

      const result = calculateExpectedDuration(routingOp)

      expect(result).toBe(0)
    })
  })

  /**
   * =========================================================================
   * validateOperationSequence() Tests
   * =========================================================================
   */

  describe('validateOperationSequence', () => {
    it('should return true for unique sequences', () => {
      const operations = [
        { sequence: 1 },
        { sequence: 2 },
        { sequence: 3 },
      ]

      const result = validateOperationSequence(operations)

      expect(result).toBe(true)
    })

    it('should return false when sequences contain duplicates', () => {
      const operations = [
        { sequence: 10 },
        { sequence: 20 },
        { sequence: 10 }, // Duplicate
      ]

      const result = validateOperationSequence(operations)

      expect(result).toBe(false)
    })

    it('should handle empty array', () => {
      const operations: { sequence: number }[] = []

      const result = validateOperationSequence(operations)

      expect(result).toBe(true)
    })

    it('should handle single operation', () => {
      const operations = [{ sequence: 1 }]

      const result = validateOperationSequence(operations)

      expect(result).toBe(true)
    })

    it('should detect duplicate at start', () => {
      const operations = [
        { sequence: 1 },
        { sequence: 1 },
        { sequence: 2 },
      ]

      const result = validateOperationSequence(operations)

      expect(result).toBe(false)
    })

    it('should detect duplicate at end', () => {
      const operations = [
        { sequence: 1 },
        { sequence: 2 },
        { sequence: 2 },
      ]

      const result = validateOperationSequence(operations)

      expect(result).toBe(false)
    })

    it('should handle non-sequential sequences', () => {
      const operations = [
        { sequence: 10 },
        { sequence: 25 },
        { sequence: 5 },
      ]

      const result = validateOperationSequence(operations)

      expect(result).toBe(true)
    })

    it('should detect multiple duplicates', () => {
      const operations = [
        { sequence: 1 },
        { sequence: 1 },
        { sequence: 2 },
        { sequence: 2 },
      ]

      const result = validateOperationSequence(operations)

      expect(result).toBe(false)
    })
  })

  /**
   * =========================================================================
   * copyRoutingToWO() Tests
   * =========================================================================
   */

  describe('copyRoutingToWO', () => {
    it('should call RPC function and return count', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: 3, error: null })

      const result = await WOOperationsService.copyRoutingToWO(
        mockSupabase as any,
        'wo-001',
        'org-123'
      )

      expect(mockSupabase.rpc).toHaveBeenCalledWith('copy_routing_to_wo', {
        p_wo_id: 'wo-001',
        p_org_id: 'org-123',
      })
      expect(result).toBe(3)
    })

    it('should return 0 when no operations copied', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: 0, error: null })

      const result = await WOOperationsService.copyRoutingToWO(
        mockSupabase as any,
        'wo-no-routing',
        'org-123'
      )

      expect(result).toBe(0)
    })

    it('should throw error on RPC failure', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Work order not found' },
      })

      await expect(
        WOOperationsService.copyRoutingToWO(mockSupabase as any, 'invalid', 'org-123')
      ).rejects.toThrow('Work order not found')
    })

    it('should return existing count on idempotent call', async () => {
      // First call returns 3 (operations created)
      mockSupabase.rpc.mockResolvedValueOnce({ data: 3, error: null })
      const result1 = await WOOperationsService.copyRoutingToWO(
        mockSupabase as any,
        'wo-001',
        'org-123'
      )

      // Second call returns same 3 (no duplicates)
      mockSupabase.rpc.mockResolvedValueOnce({ data: 3, error: null })
      const result2 = await WOOperationsService.copyRoutingToWO(
        mockSupabase as any,
        'wo-001',
        'org-123'
      )

      expect(result1).toBe(3)
      expect(result2).toBe(3)
    })
  })

  /**
   * =========================================================================
   * getOperationsForWO() Tests
   * =========================================================================
   */

  describe('getOperationsForWO', () => {
    it('should return operations ordered by sequence', async () => {
      const mockOperations = [
        { id: 'op-1', sequence: 1, operation_name: 'Mixing', machine: null, line: null, started_by_user: null, completed_by_user: null },
        { id: 'op-2', sequence: 2, operation_name: 'Baking', machine: null, line: null, started_by_user: null, completed_by_user: null },
      ]

      // Mock WO check
      mockSupabase._mockQuery.single.mockResolvedValueOnce({ data: { id: 'wo-001' }, error: null })
      // Mock operations query
      mockSupabase._mockQuery.single.mockRestore?.()
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'work_orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'wo-001' }, error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockOperations, error: null }),
        }
      })

      const result = await WOOperationsService.getOperationsForWO(
        mockSupabase as any,
        'wo-001'
      )

      expect(result.operations).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('should throw error when WO not found', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      }))

      await expect(
        WOOperationsService.getOperationsForWO(mockSupabase as any, 'invalid')
      ).rejects.toThrow('Work order not found')
    })

    it('should return empty array when WO has no operations', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'work_orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'wo-001' }, error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      })

      const result = await WOOperationsService.getOperationsForWO(
        mockSupabase as any,
        'wo-001'
      )

      expect(result.operations).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  /**
   * =========================================================================
   * getOperationById() Tests
   * =========================================================================
   */

  describe('getOperationById', () => {
    it('should return operation with calculated variances', async () => {
      const mockOperation = {
        id: 'op-1',
        wo_id: 'wo-001',
        organization_id: 'org-123',
        sequence: 1,
        operation_name: 'Mixing',
        description: null,
        instructions: 'Mix well',
        machine_id: null,
        line_id: null,
        expected_duration_minutes: 40,
        expected_yield_percent: 95,
        actual_duration_minutes: 45,
        actual_yield_percent: 93,
        status: 'completed',
        started_at: '2025-01-01T10:00:00Z',
        completed_at: '2025-01-01T10:45:00Z',
        started_by: 'user-1',
        completed_by: 'user-1',
        skip_reason: null,
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T10:45:00Z',
        machine: null,
        line: null,
        started_by_user: { id: 'user-1', name: 'John' },
        completed_by_user: { id: 'user-1', name: 'John' },
      }

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOperation, error: null }),
      }))

      const result = await WOOperationsService.getOperationById(
        mockSupabase as any,
        'wo-001',
        'op-1'
      )

      expect(result).not.toBeNull()
      expect(result!.duration_variance_minutes).toBe(5)
      expect(result!.yield_variance_percent).toBe(-2)
    })

    it('should return null variances when actuals not set', async () => {
      const mockOperation = {
        id: 'op-1',
        wo_id: 'wo-001',
        organization_id: 'org-123',
        sequence: 1,
        operation_name: 'Mixing',
        description: null,
        instructions: null,
        machine_id: null,
        line_id: null,
        expected_duration_minutes: 40,
        expected_yield_percent: 95,
        actual_duration_minutes: null,
        actual_yield_percent: null,
        status: 'pending',
        started_at: null,
        completed_at: null,
        started_by: null,
        completed_by: null,
        skip_reason: null,
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        machine: null,
        line: null,
        started_by_user: null,
        completed_by_user: null,
      }

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOperation, error: null }),
      }))

      const result = await WOOperationsService.getOperationById(
        mockSupabase as any,
        'wo-001',
        'op-1'
      )

      expect(result).not.toBeNull()
      expect(result!.duration_variance_minutes).toBeNull()
      expect(result!.yield_variance_percent).toBeNull()
    })

    it('should return null when operation not found', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      }))

      const result = await WOOperationsService.getOperationById(
        mockSupabase as any,
        'wo-001',
        'invalid'
      )

      expect(result).toBeNull()
    })

    it('should include machine and line data', async () => {
      const mockOperation = {
        id: 'op-1',
        wo_id: 'wo-001',
        organization_id: 'org-123',
        sequence: 1,
        operation_name: 'Mixing',
        description: null,
        instructions: null,
        machine_id: 'machine-1',
        line_id: 'line-1',
        expected_duration_minutes: 40,
        expected_yield_percent: null,
        actual_duration_minutes: null,
        actual_yield_percent: null,
        status: 'pending',
        started_at: null,
        completed_at: null,
        started_by: null,
        completed_by: null,
        skip_reason: null,
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        machine: { id: 'machine-1', code: 'MX-001', name: 'Mixer A' },
        line: { id: 'line-1', code: 'L-001', name: 'Line 1' },
        started_by_user: null,
        completed_by_user: null,
      }

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOperation, error: null }),
      }))

      const result = await WOOperationsService.getOperationById(
        mockSupabase as any,
        'wo-001',
        'op-1'
      )

      expect(result).not.toBeNull()
      expect(result!.machine).toEqual({ id: 'machine-1', code: 'MX-001', name: 'Mixer A' })
      expect(result!.line).toEqual({ id: 'line-1', code: 'L-001', name: 'Line 1' })
    })
  })
})
