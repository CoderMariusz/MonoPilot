/**
 * Unit Tests: Genealogy Service
 * Batch 2D - Stories: 2.18 (Forward Traceability), 2.19 (Backward Traceability)
 *
 * Tests genealogy service functions:
 * - traceForward() - Forward trace from LP to descendants
 * - traceBackward() - Backward trace from LP to ancestors
 * - buildTree() - Tree structure builder
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { traceForward, traceBackward } from '../genealogy-service'
import type { TraceNode, LicensePlate } from '../../types/traceability'

/**
 * Mock Supabase Admin Client
 */
interface MockRpcResult {
  data: Array<{
    lp: LicensePlate
    depth: number
    product_code?: string
    product_name?: string
  }> | null
  error: { message: string } | null
}

let mockRpcResult: MockRpcResult = { data: null, error: null }

vi.mock('../../supabase/admin-client', () => ({
  createAdminClient: vi.fn(() => ({
    rpc: vi.fn((fnName: string) => {
      if (fnName === 'trace_forward' || fnName === 'trace_backward') {
        return Promise.resolve(mockRpcResult)
      }
      return Promise.resolve({ data: null, error: null })
    }),
  })),
}))

/**
 * Helper: Create mock LP data
 */
function createMockLp(overrides: Partial<LicensePlate> = {}): LicensePlate {
  return {
    id: 'lp-001',
    lp_number: 'LP-001',
    batch_number: 'BATCH-001',
    product_id: 'prod-001',
    quantity: 100,
    uom: 'kg',
    status: 'available',
    location_id: 'loc-001',
    manufacturing_date: '2025-01-01',
    expiry_date: '2025-12-31',
    ...overrides,
  }
}

/**
 * Helper: Create mock trace result
 */
function createMockTraceData(depth: number = 1, count: number = 3) {
  const data = []
  for (let i = 0; i < count; i++) {
    data.push({
      lp: createMockLp({ id: `lp-${depth}-${i}`, lp_number: `LP-${depth}-${i}` }),
      depth,
      product_code: `PROD-${i}`,
      product_name: `Product ${i}`,
    })
  }
  return data
}

describe('Genealogy Service (Batch 2D)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpcResult = { data: null, error: null }
  })

  // ============================================================================
  // traceForward Tests (Story 2.18)
  // ============================================================================
  describe('traceForward (Story 2.18)', () => {
    it('should return trace result for valid LP ID', async () => {
      const mockData = createMockTraceData(1, 3)
      mockRpcResult = { data: mockData, error: null }

      const result = await traceForward('lp-root')

      expect(result).toBeDefined()
      expect(result.summary.total_descendants).toBe(3)
    })

    it('should call RPC with correct parameters', async () => {
      const mockData = createMockTraceData(1, 1)
      mockRpcResult = { data: mockData, error: null }

      await traceForward('lp-test', 10)

      // RPC should be called with trace_forward function
      const { createAdminClient } = await import('../../supabase/admin-client')
      const client = createAdminClient()
      expect(client.rpc).toHaveBeenCalledWith('trace_forward', {
        p_lp_id: 'lp-test',
        p_max_depth: 10,
      })
    })

    it('should use default max_depth of 20', async () => {
      const mockData = createMockTraceData(1, 1)
      mockRpcResult = { data: mockData, error: null }

      await traceForward('lp-test')

      const { createAdminClient } = await import('../../supabase/admin-client')
      const client = createAdminClient()
      expect(client.rpc).toHaveBeenCalledWith('trace_forward', {
        p_lp_id: 'lp-test',
        p_max_depth: 20,
      })
    })

    it('should throw error when RPC fails', async () => {
      mockRpcResult = {
        data: null,
        error: { message: 'Database connection failed' }
      }

      await expect(traceForward('lp-error')).rejects.toThrow('Forward trace failed')
    })

    it('should calculate max_depth from results', async () => {
      const mockData = [
        ...createMockTraceData(1, 2),
        ...createMockTraceData(2, 2),
        ...createMockTraceData(3, 1),
      ]
      mockRpcResult = { data: mockData, error: null }

      const result = await traceForward('lp-deep')

      expect(result.summary.max_depth).toBe(3)
    })

    it('should return root_lp from first result', async () => {
      const rootLp = createMockLp({ id: 'root-lp', lp_number: 'ROOT-LP' })
      const mockData = [{ lp: rootLp, depth: 0, product_code: 'ROOT', product_name: 'Root Product' }]
      mockRpcResult = { data: mockData, error: null }

      const result = await traceForward('root-lp')

      expect(result.root_lp).toEqual(rootLp)
    })

    it('should build tree from flat data', async () => {
      const mockData = createMockTraceData(1, 3)
      mockRpcResult = { data: mockData, error: null }

      const result = await traceForward('lp-tree')

      expect(result.trace_tree).toBeDefined()
      expect(Array.isArray(result.trace_tree)).toBe(true)
    })

    it('should handle empty result set', async () => {
      mockRpcResult = { data: [], error: null }

      const result = await traceForward('lp-empty')

      expect(result.summary.total_descendants).toBe(0)
      expect(result.summary.max_depth).toBe(-Infinity) // Math.max on empty array
    })
  })

  // ============================================================================
  // traceBackward Tests (Story 2.19)
  // ============================================================================
  describe('traceBackward (Story 2.19)', () => {
    it('should return trace result for valid LP ID', async () => {
      const mockData = createMockTraceData(1, 5)
      mockRpcResult = { data: mockData, error: null }

      const result = await traceBackward('lp-child')

      expect(result).toBeDefined()
      expect(result.summary.total_ancestors).toBe(5)
    })

    it('should call RPC with trace_backward function', async () => {
      const mockData = createMockTraceData(1, 1)
      mockRpcResult = { data: mockData, error: null }

      await traceBackward('lp-test', 15)

      const { createAdminClient } = await import('../../supabase/admin-client')
      const client = createAdminClient()
      expect(client.rpc).toHaveBeenCalledWith('trace_backward', {
        p_lp_id: 'lp-test',
        p_max_depth: 15,
      })
    })

    it('should use default max_depth of 20', async () => {
      const mockData = createMockTraceData(1, 1)
      mockRpcResult = { data: mockData, error: null }

      await traceBackward('lp-default')

      const { createAdminClient } = await import('../../supabase/admin-client')
      const client = createAdminClient()
      expect(client.rpc).toHaveBeenCalledWith('trace_backward', {
        p_lp_id: 'lp-default',
        p_max_depth: 20,
      })
    })

    it('should throw error when RPC fails', async () => {
      mockRpcResult = {
        data: null,
        error: { message: 'RPC function not found' }
      }

      await expect(traceBackward('lp-error')).rejects.toThrow('Backward trace failed')
    })

    it('should calculate max_depth from ancestor chain', async () => {
      const mockData = [
        ...createMockTraceData(1, 1),
        ...createMockTraceData(2, 1),
        ...createMockTraceData(3, 1),
        ...createMockTraceData(4, 1),
      ]
      mockRpcResult = { data: mockData, error: null }

      const result = await traceBackward('lp-deep-ancestor')

      expect(result.summary.max_depth).toBe(4)
    })

    it('should return root_lp from first result', async () => {
      const childLp = createMockLp({ id: 'child-lp', lp_number: 'CHILD-LP' })
      const mockData = [{ lp: childLp, depth: 0, product_code: 'CHILD', product_name: 'Child Product' }]
      mockRpcResult = { data: mockData, error: null }

      const result = await traceBackward('child-lp')

      expect(result.root_lp).toEqual(childLp)
    })

    it('should handle complex ancestor chain', async () => {
      // Simulate a merge scenario: multiple parents
      const mockData = [
        ...createMockTraceData(1, 2), // 2 direct parents
        ...createMockTraceData(2, 3), // 3 grandparents
      ]
      mockRpcResult = { data: mockData, error: null }

      const result = await traceBackward('lp-merged')

      expect(result.summary.total_ancestors).toBe(5)
    })
  })

  // ============================================================================
  // Edge Cases and Error Handling
  // ============================================================================
  describe('Edge Cases and Error Handling', () => {
    it('should handle LP with no descendants (forward)', async () => {
      const singleLp = createMockLp({ id: 'lp-leaf', lp_number: 'LP-LEAF' })
      mockRpcResult = {
        data: [{ lp: singleLp, depth: 0, product_code: 'LEAF', product_name: 'Leaf Product' }],
        error: null
      }

      const result = await traceForward('lp-leaf')

      expect(result.summary.total_descendants).toBe(1)
      expect(result.trace_tree).toHaveLength(0) // No children at depth 1
    })

    it('should handle LP with no ancestors (backward)', async () => {
      const rootLp = createMockLp({ id: 'lp-root', lp_number: 'LP-ROOT' })
      mockRpcResult = {
        data: [{ lp: rootLp, depth: 0, product_code: 'ROOT', product_name: 'Root Product' }],
        error: null
      }

      const result = await traceBackward('lp-root')

      expect(result.summary.total_ancestors).toBe(1)
    })

    it('should handle database timeout', async () => {
      mockRpcResult = {
        data: null,
        error: { message: 'Query timeout exceeded' }
      }

      await expect(traceForward('lp-timeout')).rejects.toThrow('Forward trace failed')
    })

    it('should handle malformed data from RPC', async () => {
      // Empty array should not throw, just return empty results
      mockRpcResult = { data: [], error: null }

      const result = await traceForward('lp-empty')

      expect(result.trace_tree).toEqual([])
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * traceForward (8 tests):
 *   - Valid LP trace
 *   - RPC call with correct parameters
 *   - Default max_depth
 *   - Error handling
 *   - Max depth calculation
 *   - Root LP extraction
 *   - Tree building
 *   - Empty results
 *
 * traceBackward (7 tests):
 *   - Valid LP trace
 *   - RPC call with trace_backward
 *   - Default max_depth
 *   - Error handling
 *   - Max depth calculation
 *   - Root LP extraction
 *   - Complex ancestor chain
 *
 * Edge Cases (4 tests):
 *   - LP with no descendants
 *   - LP with no ancestors
 *   - Database timeout
 *   - Malformed data
 *
 * Total: 19 tests
 */
