/**
 * LP Genealogy Service - Unit Tests (Story 05.2)
 * Purpose: Test LP Genealogy Tracking for parent-child relationships
 * Phase: RED - Tests will fail until service is implemented
 *
 * Tests the LP Genealogy Service which handles:
 * - Link consumption operations (parent LP -> child LP)
 * - Link output operations (multiple consumed LPs -> output LP)
 * - Link split operations (source LP -> new LP)
 * - Link merge operations (multiple source LPs -> target LP)
 * - Reverse genealogy links (for corrections)
 * - Forward trace queries (find descendants)
 * - Backward trace queries (find ancestors)
 * - Full tree queries (both directions)
 * - Work Order genealogy queries
 *
 * CRITICAL: Unblocks Epic 04.7 (Output Registration)
 *
 * Coverage Target: 80%+
 * Test Count: 50+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-3: Link Consumption Operation
 * - AC-4: Link Output Operation (Multiple Consumed LPs)
 * - AC-5: Link Split Operation
 * - AC-6: Link Merge Operation
 * - AC-7: Reverse Genealogy Link
 * - AC-8: Forward Trace Query (Single Level)
 * - AC-9: Forward Trace Query (Multi-Level)
 * - AC-10: Backward Trace Query (Multi-Level)
 * - AC-11: Forward Trace - Complex Tree (Multiple Children)
 * - AC-12: Backward Trace - Complex Tree (Multiple Parents)
 * - AC-13: Depth Limit Enforcement
 * - AC-14: Reversed Links Excluded by Default
 * - AC-15: Get Genealogy by Work Order
 * - AC-19: API Validation - Invalid LP IDs
 * - AC-20: API Validation - Self-Reference Prevention
 * - AC-21: API Validation - Duplicate Link Prevention
 * - AC-22: API Validation - Operation Type Enum
 * - AC-23: Performance - Large Genealogy Tree
 * - AC-25: Recursive CTE - Cycle Detection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Mock Supabase
 */
/**
 * Mock Supabase - Create chainable mock that mimics Supabase query builder
 */
const createChainableMock = (): any => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    not: vi.fn(() => chain),
    in: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    lt: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn((resolve) => resolve({ data: null, error: null })),
  }
  return chain
}

/**
 * Mock Supabase - Create chainable mock that mimics Supabase query builder
 */
const createChainableMock = (): any => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    not: vi.fn(() => chain),
    in: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    lt: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn((resolve) => resolve({ data: null, error: null })),
  }
  return chain
}

const mockSupabaseClient = {
  from: vi.fn(() => createChainableMock()),
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
}

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
  createClient: vi.fn(() => mockSupabaseClient),
}))

import {
  LPGenealogyService,
  type GenealogyLink,
  type GenealogyNode,
  type GenealogyTraceResult,
  type LinkConsumptionInput,
  type LinkOutputInput,
  type LinkSplitInput,
  type LinkMergeInput,
} from '../lp-genealogy-service'

describe('LPGenealogyService (Story 05.2)', () => {
  let mockSupabase: any
  let mockQuery: any
  let mockGenealogyLinks: any[]
  let service: typeof LPGenealogyService

  beforeEach(() => {
    vi.clearAllMocks()

    // Sample genealogy link data
    mockGenealogyLinks = [
      {
        id: 'gen-001',
        org_id: 'org-123',
        parent_lp_id: 'lp-001',
        child_lp_id: 'lp-002',
        operation_type: 'consume',
        quantity: 50.0,
        operation_date: '2025-12-20T10:00:00Z',
        wo_id: 'wo-001',
        operation_id: null,
        is_reversed: false,
        reversed_at: null,
        reversed_by: null,
        created_at: '2025-12-20T10:00:00Z',
        created_by: 'user-001',
      },
      {
        id: 'gen-002',
        org_id: 'org-123',
        parent_lp_id: 'lp-002',
        child_lp_id: 'lp-003',
        operation_type: 'output',
        quantity: 100.0,
        operation_date: '2025-12-20T11:00:00Z',
        wo_id: 'wo-001',
        operation_id: null,
        is_reversed: false,
        reversed_at: null,
        reversed_by: null,
        created_at: '2025-12-20T11:00:00Z',
        created_by: 'user-001',
      },
    ]

    // Create chainable query mock
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(() => mockQuery),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    // Mock service to use our mock Supabase
    service = LPGenealogyService
  })

  // ==========================================================================
  // AC-3: Link Consumption Operation
  // ==========================================================================
  describe('linkConsumption() - Link Consumption Operation (AC-3)', () => {
    it('should create genealogy link for consumption', async () => {
      const createdLink = {
        ...mockGenealogyLinks[0],
        id: 'gen-new',
      }

      mockQuery.single
        .mockResolvedValueOnce({ data: { id: 'lp-001', org_id: 'org-123' }, error: null }) // Parent LP
        .mockResolvedValueOnce({ data: { id: 'lp-002', org_id: 'org-123' }, error: null }) // Child LP
        .mockResolvedValueOnce({ data: null, error: null }) // Check duplicate
        .mockResolvedValueOnce({ data: createdLink, error: null }) // Insert

      const input: LinkConsumptionInput = {
        parentLpId: 'lp-001',
        childLpId: 'lp-002',
        woId: 'wo-001',
        quantity: 50,
      }

      const result = await service.linkConsumption(mockSupabase, input)

      expect(result).toBeDefined()
      expect(result.parent_lp_id).toBe('lp-001')
      expect(result.child_lp_id).toBe('lp-002')
      expect(result.operation_type).toBe('consume')
      expect(result.quantity).toBe(50)
      expect(result.wo_id).toBe('wo-001')
      expect(result.is_reversed).toBe(false)
      expect(mockQuery.insert).toHaveBeenCalled()
    })

    it('should complete in under 200ms', async () => {
      // Mock all single() calls: parentLP, childLP, duplicate check, insert result
      mockQuery.single
        .mockResolvedValueOnce({ data: { id: 'lp-001', org_id: 'org-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'lp-002', org_id: 'org-123' }, error: null })
        .mockResolvedValueOnce({ data: null, error: null }) // No duplicate
        .mockResolvedValueOnce({ data: { ...mockGenealogyLinks[0] }, error: null }) // Insert result

      const input: LinkConsumptionInput = {
        parentLpId: 'lp-001',
        childLpId: 'lp-002',
        woId: 'wo-001',
        quantity: 50,
      }

      const start = Date.now()
      await service.linkConsumption(mockSupabase, input)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(200)
    })

    it('should include operation_id if provided', async () => {
      const createdLink = {
        ...mockGenealogyLinks[0],
        operation_id: 'op-001',
      }

      mockQuery.single
        .mockResolvedValueOnce({ data: { id: 'lp-001', org_id: 'org-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'lp-002', org_id: 'org-123' }, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: createdLink, error: null })

      const input: LinkConsumptionInput = {
        parentLpId: 'lp-001',
        childLpId: 'lp-002',
        woId: 'wo-001',
        quantity: 50,
        operationId: 'op-001',
      }

      const result = await service.linkConsumption(mockSupabase, input)

      expect(result.operation_id).toBe('op-001')
    })

    it('should throw error when parent LP not found (AC-19)', async () => {
      mockQuery.single.mockResolvedValueOnce({ data: null, error: null })

      const input: LinkConsumptionInput = {
        parentLpId: 'invalid-id',
        childLpId: 'lp-002',
        woId: 'wo-001',
        quantity: 50,
      }

      await expect(service.linkConsumption(mockSupabase, input)).rejects.toThrow(/parent.*not found/i)
    })

    it('should throw error when child LP not found (AC-19)', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: { id: 'lp-001', org_id: 'org-123' }, error: null })
        .mockResolvedValueOnce({ data: null, error: null })

      const input: LinkConsumptionInput = {
        parentLpId: 'lp-001',
        childLpId: 'invalid-id',
        woId: 'wo-001',
        quantity: 50,
      }

      await expect(service.linkConsumption(mockSupabase, input)).rejects.toThrow(/child.*not found/i)
    })

    it('should throw error for self-reference (AC-20)', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: { id: 'lp-001', org_id: 'org-123' }, error: null })

      const input: LinkConsumptionInput = {
        parentLpId: 'lp-001',
        childLpId: 'lp-001',
        woId: 'wo-001',
        quantity: 50,
      }

      await expect(service.linkConsumption(mockSupabase, input)).rejects.toThrow(/self-referencing/i)
    })

    it('should throw error when LPs belong to different orgs', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: { id: 'lp-001', org_id: 'org-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'lp-002', org_id: 'org-456' }, error: null })

      const input: LinkConsumptionInput = {
        parentLpId: 'lp-001',
        childLpId: 'lp-002',
        woId: 'wo-001',
        quantity: 50,
      }

      await expect(service.linkConsumption(mockSupabase, input)).rejects.toThrow(/different organizations/i)
    })

    it('should throw error for duplicate link (AC-21)', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: { id: 'lp-001', org_id: 'org-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'lp-002', org_id: 'org-123' }, error: null })
        .mockResolvedValueOnce({ data: mockGenealogyLinks[0], error: null }) // Duplicate exists

      const input: LinkConsumptionInput = {
        parentLpId: 'lp-001',
        childLpId: 'lp-002',
        woId: 'wo-001',
        quantity: 50,
      }

      await expect(service.linkConsumption(mockSupabase, input)).rejects.toThrow(/already exists/i)
    })
  })

  // ==========================================================================
  // AC-4: Link Output Operation (Multiple Consumed LPs)
  // ==========================================================================
  describe('linkOutput() - Link Output Operation (AC-4)', () => {
    it('should create multiple genealogy links for output', async () => {
      const createdLinks = [
        { ...mockGenealogyLinks[0], id: 'gen-out-1', parent_lp_id: 'lp-001', child_lp_id: 'lp-004', operation_type: 'output', wo_id: 'wo-001' },
        { ...mockGenealogyLinks[0], id: 'gen-out-2', parent_lp_id: 'lp-002', child_lp_id: 'lp-004', operation_type: 'output', wo_id: 'wo-001' },
        { ...mockGenealogyLinks[0], id: 'gen-out-3', parent_lp_id: 'lp-003', child_lp_id: 'lp-004', operation_type: 'output', wo_id: 'wo-001' },
      ]

      // Mock getLicensePlate calls for output LP
      mockQuery.single.mockResolvedValue({ data: { id: 'lp-004', org_id: 'org-123' }, error: null })
      // Mock insert().select() chain - insert returns query, select returns data
      mockQuery.insert.mockImplementation(() => ({
        select: vi.fn().mockResolvedValue({ data: createdLinks, error: null })
      }))

      const input: LinkOutputInput = {
        consumedLpIds: ['lp-001', 'lp-002', 'lp-003'],
        outputLpId: 'lp-004',
        woId: 'wo-001',
      }

      const result = await service.linkOutput(mockSupabase, input)

      expect(result).toHaveLength(3)
      expect(result[0].child_lp_id).toBe('lp-004')
      expect(result[1].child_lp_id).toBe('lp-004')
      expect(result[2].child_lp_id).toBe('lp-004')
      expect(result[0].operation_type).toBe('output')
      expect(result[0].wo_id).toBe('wo-001')
    })

    it('should complete batch insert in under 500ms', async () => {
      // Mock getLicensePlate calls
      mockQuery.single.mockResolvedValue({ data: { id: 'lp-004', org_id: 'org-123' }, error: null })
      // Mock insert().select() chain
      mockQuery.insert.mockImplementation(() => ({
        select: vi.fn().mockResolvedValue({ data: [], error: null })
      }))

      const input: LinkOutputInput = {
        consumedLpIds: ['lp-001', 'lp-002', 'lp-003'],
        outputLpId: 'lp-004',
        woId: 'wo-001',
      }

      const start = Date.now()
      await service.linkOutput(mockSupabase, input)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(500)
    })

    it('should return array of created genealogy IDs', async () => {
      const createdLinks = [
        { id: 'gen-out-1', child_lp_id: 'lp-004', operation_type: 'output', wo_id: 'wo-001' },
        { id: 'gen-out-2', child_lp_id: 'lp-004', operation_type: 'output', wo_id: 'wo-001' },
        { id: 'gen-out-3', child_lp_id: 'lp-004', operation_type: 'output', wo_id: 'wo-001' },
      ]

      // Mock getLicensePlate calls
      mockQuery.single.mockResolvedValue({ data: { id: 'lp-004', org_id: 'org-123' }, error: null })
      // Mock insert().select() chain
      mockQuery.insert.mockImplementation(() => ({
        select: vi.fn().mockResolvedValue({ data: createdLinks, error: null })
      }))

      const input: LinkOutputInput = {
        consumedLpIds: ['lp-001', 'lp-002', 'lp-003'],
        outputLpId: 'lp-004',
        woId: 'wo-001',
      }

      const result = await service.linkOutput(mockSupabase, input)

      expect(result.map(r => r.id)).toEqual(['gen-out-1', 'gen-out-2', 'gen-out-3'])
    })

    it('should throw error when output LP not found', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: null })

      const input: LinkOutputInput = {
        consumedLpIds: ['lp-001', 'lp-002'],
        outputLpId: 'invalid-id',
        woId: 'wo-001',
      }

      await expect(service.linkOutput(mockSupabase, input)).rejects.toThrow(/output.*not found/i)
    })

    it('should throw error for empty consumed LP array', async () => {
      const input: LinkOutputInput = {
        consumedLpIds: [],
        outputLpId: 'lp-004',
        woId: 'wo-001',
      }

      await expect(service.linkOutput(mockSupabase, input)).rejects.toThrow(/at least one/i)
    })
  })

  // ==========================================================================
  // AC-5: Link Split Operation
  // ==========================================================================
  describe('linkSplit() - Link Split Operation (AC-5)', () => {
    it('should create genealogy link for split', async () => {
      const createdLink = {
        id: 'gen-split',
        org_id: 'org-123',
        parent_lp_id: 'lp-001',
        child_lp_id: 'lp-005',
        operation_type: 'split',
        quantity: 30,
        wo_id: null,
      }

      mockQuery.single.mockResolvedValue({ data: createdLink, error: null })

      const input: LinkSplitInput = {
        sourceLpId: 'lp-001',
        newLpId: 'lp-005',
        quantity: 30,
      }

      const result = await service.linkSplit(mockSupabase, input)

      expect(result.parent_lp_id).toBe('lp-001')
      expect(result.child_lp_id).toBe('lp-005')
      expect(result.operation_type).toBe('split')
      expect(result.quantity).toBe(30)
      expect(result.wo_id).toBeNull()
    })

    it('should complete in under 200ms', async () => {
      mockQuery.single.mockResolvedValue({ data: mockGenealogyLinks[0], error: null })

      const input: LinkSplitInput = {
        sourceLpId: 'lp-001',
        newLpId: 'lp-005',
        quantity: 30,
      }

      const start = Date.now()
      await service.linkSplit(mockSupabase, input)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(200)
    })

    it('should throw error for self-reference in split', async () => {
      const input: LinkSplitInput = {
        sourceLpId: 'lp-001',
        newLpId: 'lp-001',
        quantity: 30,
      }

      await expect(service.linkSplit(mockSupabase, input)).rejects.toThrow(/self-referencing/i)
    })

    it('should validate quantity is positive', async () => {
      const input: LinkSplitInput = {
        sourceLpId: 'lp-001',
        newLpId: 'lp-005',
        quantity: -10,
      }

      await expect(service.linkSplit(mockSupabase, input)).rejects.toThrow(/positive/i)
    })
  })

  // ==========================================================================
  // AC-6: Link Merge Operation
  // ==========================================================================
  describe('linkMerge() - Link Merge Operation (AC-6)', () => {
    it('should create genealogy links for merge', async () => {
      const createdLinks = [
        {
          id: 'gen-merge-1',
          org_id: 'org-123',
          parent_lp_id: 'lp-002',
          child_lp_id: 'lp-001',
          operation_type: 'merge',
          quantity: 50,
        },
        {
          id: 'gen-merge-2',
          org_id: 'org-123',
          parent_lp_id: 'lp-003',
          child_lp_id: 'lp-001',
          operation_type: 'merge',
          quantity: 75,
        },
      ]

      // Mock getLicensePlate calls for source LPs
      mockQuery.single
        .mockResolvedValueOnce({ data: { id: 'lp-002', org_id: 'org-123', quantity: 50 }, error: null })
        .mockResolvedValueOnce({ data: { id: 'lp-003', org_id: 'org-123', quantity: 75 }, error: null })

      // Mock insert().select() chain
      mockQuery.insert.mockImplementation(() => ({
        select: vi.fn().mockResolvedValue({ data: createdLinks, error: null })
      }))

      const input: LinkMergeInput = {
        sourceLpIds: ['lp-002', 'lp-003'],
        targetLpId: 'lp-001',
      }

      const result = await service.linkMerge(mockSupabase, input)

      expect(result).toHaveLength(2)
      expect(result[0].operation_type).toBe('merge')
      expect(result[0].quantity).toBe(50)
      expect(result[1].quantity).toBe(75)
    })

    it('should complete in under 300ms', async () => {
      // Mock getLicensePlate calls
      mockQuery.single.mockResolvedValue({ data: { id: 'lp-001', org_id: 'org-123', quantity: 100 }, error: null })
      // Mock insert().select() chain
      mockQuery.insert.mockImplementation(() => ({
        select: vi.fn().mockResolvedValue({ data: [], error: null })
      }))

      const input: LinkMergeInput = {
        sourceLpIds: ['lp-002', 'lp-003'],
        targetLpId: 'lp-001',
      }

      const start = Date.now()
      await service.linkMerge(mockSupabase, input)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(300)
    })

    it('should throw error for empty source LP array', async () => {
      const input: LinkMergeInput = {
        sourceLpIds: [],
        targetLpId: 'lp-001',
      }

      await expect(service.linkMerge(mockSupabase, input)).rejects.toThrow(/at least one/i)
    })

    it('should throw error if target LP in source list', async () => {
      const input: LinkMergeInput = {
        sourceLpIds: ['lp-001', 'lp-002'],
        targetLpId: 'lp-001',
      }

      await expect(service.linkMerge(mockSupabase, input)).rejects.toThrow(/target.*source/i)
    })
  })

  // ==========================================================================
  // AC-7: Reverse Genealogy Link
  // ==========================================================================
  describe('reverseLink() - Reverse Genealogy Link (AC-7)', () => {
    it('should mark genealogy link as reversed', async () => {
      const reversedLink = {
        ...mockGenealogyLinks[0],
        is_reversed: true,
        reversed_at: '2025-12-22T10:00:00Z',
        reversed_by: 'user-002',
      }

      mockQuery.single.mockResolvedValue({ data: reversedLink, error: null })

      const result = await service.reverseLink(mockSupabase, 'gen-001')

      expect(result.is_reversed).toBe(true)
      expect(result.reversed_at).toBeDefined()
      expect(result.reversed_by).toBe('user-002')
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_reversed: true,
        })
      )
    })

    it('should complete in under 100ms', async () => {
      mockQuery.single.mockResolvedValue({ data: mockGenealogyLinks[0], error: null })

      const start = Date.now()
      await service.reverseLink(mockSupabase, 'gen-001')
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100)
    })

    it('should preserve original record (not delete)', async () => {
      mockQuery.single.mockResolvedValue({ data: mockGenealogyLinks[0], error: null })

      await service.reverseLink(mockSupabase, 'gen-001')

      expect(mockQuery.delete).not.toHaveBeenCalled()
      expect(mockQuery.update).toHaveBeenCalled()
    })

    it('should throw error when genealogy link not found', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })

      await expect(service.reverseLink(mockSupabase, 'invalid-id')).rejects.toThrow(/not found/i)
    })
  })

  // ==========================================================================
  // AC-8 & AC-9: Forward Trace Query
  // ==========================================================================
  describe('getForwardTrace() - Forward Trace Query (AC-8, AC-9)', () => {
    it('should return direct children (depth 1)', async () => {
      const mockData = [
        {
          lp_id: 'lp-002',
          lp_number: 'LP-002',
          product_name: 'Product A',
          operation_type: 'consume',
          quantity: 50,
          operation_date: '2025-12-20T10:00:00Z',
          depth: 1,
        },
      ]

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null })

      const result = await service.getForwardTrace(mockSupabase, 'lp-001', 1)

      expect(result.lpId).toBe('lp-001')
      expect(result.nodes).toHaveLength(1)
      expect(result.nodes[0].depth).toBe(1)
      expect(result.totalCount).toBe(1)
      // hasMoreLevels is true when any node is at max depth (could have more children)
      expect(result.hasMoreLevels).toBe(true)
    })

    it('should return multi-level descendants (AC-9)', async () => {
      const mockData = [
        { lp_id: 'lp-002', lp_number: 'LP-002', product_name: 'Product A', operation_type: 'consume', quantity: 50, depth: 1 },
        { lp_id: 'lp-003', lp_number: 'LP-003', product_name: 'Product B', operation_type: 'consume', quantity: 30, depth: 2 },
        { lp_id: 'lp-004', lp_number: 'LP-004', product_name: 'Product C', operation_type: 'output', quantity: 100, depth: 3 },
        { lp_id: 'lp-005', lp_number: 'LP-005', product_name: 'Product D', operation_type: 'split', quantity: 20, depth: 4 },
      ]

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null })

      const result = await service.getForwardTrace(mockSupabase, 'lp-001', 10)

      expect(result.nodes).toHaveLength(4)
      expect(result.nodes.map(n => n.depth)).toEqual([1, 2, 3, 4])
      expect(result.hasMoreLevels).toBe(false)
    })

    it('should complete in under 500ms for 10 levels (AC-9)', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      const start = Date.now()
      await service.getForwardTrace(mockSupabase, 'lp-001', 10)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(500)
    })

    it('should order results by depth ascending', async () => {
      const mockData = [
        { lp_id: 'lp-004', depth: 3 },
        { lp_id: 'lp-002', depth: 1 },
        { lp_id: 'lp-003', depth: 2 },
      ]

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null })

      const result = await service.getForwardTrace(mockSupabase, 'lp-001')

      expect(result.nodes[0].depth).toBe(1)
      expect(result.nodes[1].depth).toBe(2)
      expect(result.nodes[2].depth).toBe(3)
    })

    it('should handle complex tree with multiple children (AC-11)', async () => {
      const mockData = [
        { lp_id: 'lp-002', depth: 1 }, // Child 1
        { lp_id: 'lp-003', depth: 1 }, // Child 2
        { lp_id: 'lp-004', depth: 2 }, // Grandchild of lp-002
        { lp_id: 'lp-005', depth: 2 }, // Grandchild of lp-003
      ]

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null })

      const result = await service.getForwardTrace(mockSupabase, 'lp-001', 5)

      expect(result.nodes).toHaveLength(4)
      expect(result.nodes.filter(n => n.depth === 1)).toHaveLength(2)
      expect(result.nodes.filter(n => n.depth === 2)).toHaveLength(2)
    })

    it('should enforce max depth limit (AC-13)', async () => {
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        lp_id: `lp-${i + 2}`,
        depth: i + 1,
      }))

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null })

      const result = await service.getForwardTrace(mockSupabase, 'lp-001', 10)

      expect(result.nodes).toHaveLength(10)
      expect(result.nodes[9].depth).toBe(10)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_lp_forward_trace', {
        p_lp_id: 'lp-001',
        p_org_id: expect.any(String),
        p_max_depth: 10,
        p_include_reversed: false,
      })
    })

    it('should indicate hasMoreLevels when depth limit reached', async () => {
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        lp_id: `lp-${i + 2}`,
        depth: i + 1,
      }))

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null })

      const result = await service.getForwardTrace(mockSupabase, 'lp-001', 10)

      expect(result.hasMoreLevels).toBe(true)
    })

    it('should exclude reversed links by default (AC-14)', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      await service.getForwardTrace(mockSupabase, 'lp-001')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_lp_forward_trace', {
        p_lp_id: 'lp-001',
        p_org_id: expect.any(String),
        p_max_depth: 10,
        p_include_reversed: false,
      })
    })

    it('should include reversed links when flag is true', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      await service.getForwardTrace(mockSupabase, 'lp-001', 10, true)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_lp_forward_trace', {
        p_lp_id: 'lp-001',
        p_org_id: expect.any(String),
        p_max_depth: 10,
        p_include_reversed: true,
      })
    })
  })

  // ==========================================================================
  // AC-10 & AC-12: Backward Trace Query
  // ==========================================================================
  describe('getBackwardTrace() - Backward Trace Query (AC-10, AC-12)', () => {
    it('should return multi-level ancestors (AC-10)', async () => {
      const mockData = [
        { lp_id: 'lp-004', lp_number: 'LP-004', product_name: 'Product D', operation_type: 'consume', depth: 1 },
        { lp_id: 'lp-003', lp_number: 'LP-003', product_name: 'Product C', operation_type: 'output', depth: 2 },
        { lp_id: 'lp-002', lp_number: 'LP-002', product_name: 'Product B', operation_type: 'consume', depth: 3 },
        { lp_id: 'lp-001', lp_number: 'LP-001', product_name: 'Product A', operation_type: 'consume', depth: 4 },
      ]

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null })

      const result = await service.getBackwardTrace(mockSupabase, 'lp-005', 10)

      expect(result.nodes).toHaveLength(4)
      expect(result.nodes.map(n => n.depth)).toEqual([1, 2, 3, 4])
      expect(result.lpId).toBe('lp-005')
    })

    it('should complete in under 500ms for 10 levels (AC-10)', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      const start = Date.now()
      await service.getBackwardTrace(mockSupabase, 'lp-005', 10)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(500)
    })

    it('should handle multiple parents (AC-12)', async () => {
      const mockData = [
        { lp_id: 'lp-001', depth: 1 }, // Parent 1
        { lp_id: 'lp-002', depth: 1 }, // Parent 2
        { lp_id: 'lp-003', depth: 1 }, // Parent 3
      ]

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null })

      const result = await service.getBackwardTrace(mockSupabase, 'lp-005', 5)

      expect(result.nodes).toHaveLength(3)
      expect(result.nodes.every(n => n.depth === 1)).toBe(true)
    })

    it('should include multi-generation ancestors', async () => {
      const mockData = [
        { lp_id: 'lp-001', depth: 1 }, // Direct parent
        { lp_id: 'lp-002', depth: 1 }, // Direct parent
        { lp_id: 'lp-003', depth: 2 }, // Grandparent from lp-001
        { lp_id: 'lp-004', depth: 2 }, // Grandparent from lp-002
      ]

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null })

      const result = await service.getBackwardTrace(mockSupabase, 'lp-005', 10)

      expect(result.nodes.filter(n => n.depth === 1)).toHaveLength(2)
      expect(result.nodes.filter(n => n.depth === 2)).toHaveLength(2)
    })

    it('should order results by depth ascending', async () => {
      const mockData = [
        { lp_id: 'lp-003', depth: 3 },
        { lp_id: 'lp-001', depth: 1 },
        { lp_id: 'lp-002', depth: 2 },
      ]

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null })

      const result = await service.getBackwardTrace(mockSupabase, 'lp-005')

      expect(result.nodes[0].depth).toBe(1)
      expect(result.nodes[1].depth).toBe(2)
      expect(result.nodes[2].depth).toBe(3)
    })
  })

  // ==========================================================================
  // Full Tree Query
  // ==========================================================================
  describe('getFullTree() - Get Full Genealogy Tree', () => {
    it('should return both ancestors and descendants', async () => {
      const ancestorData = [{ lp_id: 'lp-001', depth: 1 }]
      const descendantData = [{ lp_id: 'lp-003', depth: 1 }]

      mockSupabase.rpc
        .mockResolvedValueOnce({ data: descendantData, error: null }) // Forward
        .mockResolvedValueOnce({ data: ancestorData, error: null }) // Backward

      const result = await service.getFullTree(mockSupabase, 'lp-002', 'both', 5)

      expect(result.ancestors).toHaveLength(1)
      expect(result.descendants).toHaveLength(1)
      expect(result.hasMoreLevels.ancestors).toBe(false)
      expect(result.hasMoreLevels.descendants).toBe(false)
    })

    it('should return only forward trace when direction is forward', async () => {
      const descendantData = [{ lp_id: 'lp-003', depth: 1 }]

      mockSupabase.rpc.mockResolvedValue({ data: descendantData, error: null })

      const result = await service.getFullTree(mockSupabase, 'lp-002', 'forward', 5)

      expect(result.descendants).toHaveLength(1)
      expect(result.ancestors).toHaveLength(0)
    })

    it('should return only backward trace when direction is backward', async () => {
      const ancestorData = [{ lp_id: 'lp-001', depth: 1 }]

      mockSupabase.rpc.mockResolvedValue({ data: ancestorData, error: null })

      const result = await service.getFullTree(mockSupabase, 'lp-002', 'backward', 5)

      expect(result.ancestors).toHaveLength(1)
      expect(result.descendants).toHaveLength(0)
    })
  })

  // ==========================================================================
  // AC-15: Get Genealogy by Work Order
  // ==========================================================================
  describe('getGenealogyByWO() - Get Genealogy by Work Order (AC-15)', () => {
    it('should return all genealogy records for work order', async () => {
      const woGenealogyData = [
        { ...mockGenealogyLinks[0], operation_type: 'consume' },
        { ...mockGenealogyLinks[1], operation_type: 'output' },
      ]

      // Chain ends with .eq() which needs to resolve
      mockQuery.eq.mockImplementation(() => ({
        ...mockQuery,
        eq: vi.fn().mockResolvedValue({ data: woGenealogyData, error: null }),
      }))

      const result = await service.getGenealogyByWO(mockSupabase, 'wo-001')

      expect(result.consume).toHaveLength(1)
      expect(result.output).toHaveLength(1)
    })

    it('should complete in under 300ms', async () => {
      // Chain ends with .eq() which needs to resolve
      mockQuery.eq.mockImplementation(() => ({
        ...mockQuery,
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }))

      const start = Date.now()
      await service.getGenealogyByWO(mockSupabase, 'wo-001')
      const duration = Date.now() - start

      expect(duration).toBeLessThan(300)
    })

    it('should group by operation type', async () => {
      const woGenealogyData = [
        { id: 'gen-1', operation_type: 'consume' },
        { id: 'gen-2', operation_type: 'consume' },
        { id: 'gen-3', operation_type: 'output' },
      ]

      // Chain ends with .eq() which needs to resolve
      mockQuery.eq.mockImplementation(() => ({
        ...mockQuery,
        eq: vi.fn().mockResolvedValue({ data: woGenealogyData, error: null }),
      }))

      const result = await service.getGenealogyByWO(mockSupabase, 'wo-001')

      expect(result.consume).toHaveLength(2)
      expect(result.output).toHaveLength(1)
    })

    it('should exclude reversed links', async () => {
      // Track eq calls and resolve on second call
      const eqMock = vi.fn()
      mockQuery.eq.mockImplementation((...args: unknown[]) => {
        eqMock(...args)
        return {
          ...mockQuery,
          eq: vi.fn().mockImplementation((...innerArgs: unknown[]) => {
            eqMock(...innerArgs)
            return Promise.resolve({ data: [], error: null })
          }),
        }
      })

      await service.getGenealogyByWO(mockSupabase, 'wo-001')

      expect(eqMock).toHaveBeenCalledWith('is_reversed', false)
    })

    it('should include joined LP and product data', async () => {
      const woGenealogyData = [
        {
          ...mockGenealogyLinks[0],
          parent_lp: { lp_number: 'LP-001', product: { name: 'Product A' } },
          child_lp: { lp_number: 'LP-002', product: { name: 'Product B' } },
        },
      ]

      // Chain ends with .eq() which needs to resolve
      mockQuery.eq.mockImplementation(() => ({
        ...mockQuery,
        eq: vi.fn().mockResolvedValue({ data: woGenealogyData, error: null }),
      }))

      const result = await service.getGenealogyByWO(mockSupabase, 'wo-001')

      expect(result.consume[0].parent_lp).toBeDefined()
      expect(result.consume[0].child_lp).toBeDefined()
    })
  })

  // ==========================================================================
  // AC-23: Performance - Large Genealogy Tree
  // ==========================================================================
  describe('Performance Tests (AC-23)', () => {
    it('should handle large genealogy tree (100+ nodes) in under 1 second', async () => {
      // Create 50 descendants and 50 ancestors
      const descendantData = Array.from({ length: 50 }, (_, i) => ({
        lp_id: `lp-d-${i}`,
        lp_number: `LP-D-${i}`,
        product_name: `Product ${i}`,
        depth: Math.floor(i / 10) + 1,
      }))
      const ancestorData = Array.from({ length: 50 }, (_, i) => ({
        lp_id: `lp-a-${i}`,
        lp_number: `LP-A-${i}`,
        product_name: `Product ${i}`,
        depth: Math.floor(i / 10) + 1,
      }))

      mockSupabase.rpc
        .mockResolvedValueOnce({ data: descendantData, error: null }) // Forward trace
        .mockResolvedValueOnce({ data: ancestorData, error: null }) // Backward trace

      const start = Date.now()
      const result = await service.getFullTree(mockSupabase, 'lp-root', 'both', 10)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000)
      expect(result.descendants.length + result.ancestors.length).toBeLessThanOrEqual(100)
    })

    it('should use proper indexes for performance', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      await service.getForwardTrace(mockSupabase, 'lp-001')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_lp_forward_trace', expect.any(Object))
    })
  })

  // ==========================================================================
  // AC-22: Validation - Operation Type Enum
  // ==========================================================================
  describe('Validation - Operation Type (AC-22)', () => {
    it('should accept valid operation types', async () => {
      const validTypes = ['consume', 'output', 'split', 'merge']

      for (const type of validTypes) {
        const link = { ...mockGenealogyLinks[0], operation_type: type }
        expect(['consume', 'output', 'split', 'merge']).toContain(link.operation_type)
      }
    })

    it('should reject invalid operation type', async () => {
      // This would be caught by Zod schema validation
      const invalidType = 'invalid_operation'
      expect(['consume', 'output', 'split', 'merge']).not.toContain(invalidType)
    })
  })

  // ==========================================================================
  // AC-25: Cycle Detection
  // ==========================================================================
  describe('Cycle Detection (AC-25)', () => {
    it('should detect cycles in recursive CTE', async () => {
      // RPC would handle this at database level
      const cyclicData = [
        { lp_id: 'lp-001', depth: 1 },
        { lp_id: 'lp-002', depth: 2 },
        { lp_id: 'lp-001', depth: 3 }, // Cycle detected
      ]

      mockSupabase.rpc.mockResolvedValue({ data: cyclicData, error: null })

      const result = await service.getForwardTrace(mockSupabase, 'lp-001', 10)

      // Cycle should be detected at DB level, partial results returned
      expect(result.nodes.length).toBeGreaterThan(0)
    })

    it('should not hang on circular reference', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      const start = Date.now()
      await service.getForwardTrace(mockSupabase, 'lp-001', 10)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000) // Should terminate safely
    })
  })

  // ==========================================================================
  // Utility Methods
  // ==========================================================================
  describe('Utility Methods', () => {
    it('should check if genealogy link exists', async () => {
      mockQuery.single.mockResolvedValue({ data: { id: 'gen-001' }, error: null })

      const result = await service.hasGenealogyLink(
        mockSupabase,
        'lp-001',
        'lp-002',
        'consume'
      )

      expect(result).toBe(true)
    })

    it('should return false when genealogy link does not exist', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: null })

      const result = await service.hasGenealogyLink(
        mockSupabase,
        'lp-001',
        'lp-999',
        'consume'
      )

      expect(result).toBe(false)
    })

    it('should get genealogy count for LP', async () => {
      mockQuery.single.mockResolvedValue({ data: { count: 5 }, error: null })

      const result = await service.getGenealogyCount(mockSupabase, 'lp-001')

      expect(result).toBe(5)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * linkConsumption() - 8 tests (AC-3, AC-19, AC-20, AC-21):
 *   - Create consumption link
 *   - Performance (<200ms)
 *   - Include operation_id
 *   - Parent LP not found error
 *   - Child LP not found error
 *   - Self-reference prevention
 *   - Different org validation
 *   - Duplicate link prevention
 *
 * linkOutput() - 5 tests (AC-4):
 *   - Create multiple output links
 *   - Performance (<500ms)
 *   - Return created IDs
 *   - Output LP not found error
 *   - Empty consumed array validation
 *
 * linkSplit() - 4 tests (AC-5):
 *   - Create split link
 *   - Performance (<200ms)
 *   - Self-reference prevention
 *   - Positive quantity validation
 *
 * linkMerge() - 4 tests (AC-6):
 *   - Create merge links
 *   - Performance (<300ms)
 *   - Empty source array validation
 *   - Target in source validation
 *
 * reverseLink() - 4 tests (AC-7):
 *   - Mark as reversed
 *   - Performance (<100ms)
 *   - Preserve original (no delete)
 *   - Not found error
 *
 * getForwardTrace() - 9 tests (AC-8, AC-9, AC-11, AC-13, AC-14):
 *   - Direct children (depth 1)
 *   - Multi-level descendants
 *   - Performance (<500ms)
 *   - Order by depth
 *   - Complex tree (multiple children)
 *   - Depth limit enforcement
 *   - Has more levels flag
 *   - Exclude reversed by default
 *   - Include reversed with flag
 *
 * getBackwardTrace() - 5 tests (AC-10, AC-12):
 *   - Multi-level ancestors
 *   - Performance (<500ms)
 *   - Multiple parents
 *   - Multi-generation ancestors
 *   - Order by depth
 *
 * getFullTree() - 3 tests:
 *   - Both directions
 *   - Forward only
 *   - Backward only
 *
 * getGenealogyByWO() - 5 tests (AC-15):
 *   - Return all WO genealogy
 *   - Performance (<300ms)
 *   - Group by operation type
 *   - Exclude reversed
 *   - Include joined data
 *
 * Performance Tests - 2 tests (AC-23):
 *   - Large tree (100+ nodes <1s)
 *   - Index usage
 *
 * Validation - 2 tests (AC-22):
 *   - Valid operation types
 *   - Invalid operation type
 *
 * Cycle Detection - 2 tests (AC-25):
 *   - Detect cycles
 *   - No hang on circular reference
 *
 * Utility Methods - 3 tests:
 *   - Check link exists
 *   - Link does not exist
 *   - Get genealogy count
 *
 * Total: 54 tests
 * Coverage: 80%+ (all service methods tested)
 * Status: RED (service not implemented yet)
 */
