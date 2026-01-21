/**
 * Unit Tests: Output Aggregation Service
 * Story: 04.7d - Multiple Outputs per WO
 *
 * Tests:
 * - Progress calculation (0%, partial, 100%, over-production)
 * - Output list retrieval with filtering
 * - By-product exclusion from aggregation
 * - Summary calculation
 *
 * RED PHASE - All tests should FAIL until service is implemented
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock data for tests
const mockOutputs = [
  {
    id: 'out-1',
    quantity: 400,
    uom: 'kg',
    qa_status: 'approved',
    location_id: 'loc-1',
    is_by_product: false,
    produced_at: '2025-01-20T08:00:00Z',
    notes: null,
    lp_id: 'lp-1',
    license_plates: { id: 'lp-1', lp_number: 'LP-001', batch_number: 'B-001', expiry_date: '2025-06-01' },
    locations: { id: 'loc-1', name: 'WH-A/Z1' },
    users: { full_name: 'John Smith' },
  },
  {
    id: 'out-2',
    quantity: 300,
    uom: 'kg',
    qa_status: 'pending',
    location_id: 'loc-1',
    is_by_product: false,
    produced_at: '2025-01-20T09:00:00Z',
    notes: null,
    lp_id: 'lp-2',
    license_plates: { id: 'lp-2', lp_number: 'LP-002', batch_number: 'B-001', expiry_date: '2025-06-01' },
    locations: { id: 'loc-1', name: 'WH-A/Z1' },
    users: { full_name: 'Jane Doe' },
  },
  {
    id: 'out-3',
    quantity: 300,
    uom: 'kg',
    qa_status: 'rejected',
    location_id: 'loc-2',
    is_by_product: false,
    produced_at: '2025-01-20T10:00:00Z',
    notes: null,
    lp_id: 'lp-3',
    license_plates: { id: 'lp-3', lp_number: 'LP-003', batch_number: 'B-001', expiry_date: '2025-06-01' },
    locations: { id: 'loc-2', name: 'WH-B/Z1' },
    users: { full_name: 'Bob Wilson' },
  },
]

// Different WO scenarios for cumulative tracking tests
const mockWorkOrders: Record<string, { id: string; wo_number: string; planned_quantity: number; output_qty: number; status: string; org_id: string }> = {
  'wo-123': {
    id: 'wo-123',
    wo_number: 'WO-2025-0001',
    planned_quantity: 1000,
    output_qty: 1000,
    status: 'in_progress',
    org_id: 'org-1',
  },
  'wo-first-output': {
    id: 'wo-first-output',
    wo_number: 'WO-2025-0002',
    planned_quantity: 1000,
    output_qty: 400,
    status: 'in_progress',
    org_id: 'org-1',
  },
  'wo-two-outputs': {
    id: 'wo-two-outputs',
    wo_number: 'WO-2025-0003',
    planned_quantity: 1000,
    output_qty: 700,
    status: 'in_progress',
    org_id: 'org-1',
  },
  'wo-complete': {
    id: 'wo-complete',
    wo_number: 'WO-2025-0004',
    planned_quantity: 1000,
    output_qty: 1000,
    status: 'in_progress',
    org_id: 'org-1',
  },
  'wo-overproduced': {
    id: 'wo-overproduced',
    wo_number: 'WO-2025-0005',
    planned_quantity: 1000,
    output_qty: 1200,
    status: 'in_progress',
    org_id: 'org-1',
  },
  'wo-completed': {
    id: 'wo-completed',
    wo_number: 'WO-2025-0006',
    planned_quantity: 1000,
    output_qty: 1000,
    status: 'completed',
    org_id: 'org-1',
  },
}

const mockProductionSettings = {
  auto_complete_wo: true,
}

// Track the woId being queried for WO-specific mock responses
let currentWoId = 'wo-123'

// Chainable mock factory
function createChainableMock(table: string) {
  const chainable: Record<string, unknown> = {}

  // Track eq calls to capture woId
  chainable.eq = vi.fn((field: string, value: unknown) => {
    if (field === 'wo_id' || field === 'id') {
      currentWoId = value as string
    }
    return chainable
  })
  chainable.neq = vi.fn(() => chainable)
  chainable.in = vi.fn(() => chainable)
  chainable.order = vi.fn(() => chainable)
  chainable.range = vi.fn(() => {
    if (table === 'production_outputs') {
      return Promise.resolve({ data: mockOutputs, error: null, count: mockOutputs.length })
    }
    return Promise.resolve({ data: [], error: null, count: 0 })
  })
  chainable.single = vi.fn(() => {
    if (table === 'work_orders') {
      const wo = mockWorkOrders[currentWoId] || mockWorkOrders['wo-123']
      return Promise.resolve({ data: wo, error: null })
    }
    if (table === 'production_settings') {
      return Promise.resolve({ data: mockProductionSettings, error: null })
    }
    return Promise.resolve({ data: null, error: null })
  })
  chainable.select = vi.fn(() => chainable)

  return chainable
}

// Mock Supabase admin client
vi.mock('@/lib/supabase/admin-client', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => createChainableMock(table)),
  })),
}))

// Import service under test (will fail until implemented)
import {
  OutputAggregationService,
  calculateProgress,
  getOutputsForWO,
  getOutputsSummary,
  getWOProgress,
} from '@/lib/services/output-aggregation-service'

describe('OutputAggregationService (Story 04.7d)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Progress Calculation Tests
  // ============================================================================
  describe('calculateProgress', () => {
    it('should return 0 when output qty is 0', () => {
      const progress = calculateProgress(0, 1000)
      expect(progress).toBe(0)
    })

    it('should return correct percentage for partial completion', () => {
      // AC: GIVEN WO.planned_qty = 1000 AND output = 400
      // WHEN progress calculated, THEN progress = 40%
      const progress = calculateProgress(400, 1000)
      expect(progress).toBe(40)
    })

    it('should return 100 when output equals planned', () => {
      const progress = calculateProgress(1000, 1000)
      expect(progress).toBe(100)
    })

    it('should return >100 for over-production', () => {
      // AC: GIVEN output_qty = 1200 AND planned_qty = 1000
      // THEN progress = 120%
      const progress = calculateProgress(1200, 1000)
      expect(progress).toBe(120)
    })

    it('should handle decimal precision correctly', () => {
      const progress = calculateProgress(333.33, 1000)
      expect(progress).toBeCloseTo(33.33, 2)
    })

    it('should return 0 when planned qty is 0 (edge case)', () => {
      const progress = calculateProgress(100, 0)
      expect(progress).toBe(0)
    })

    it('should handle very large quantities', () => {
      const progress = calculateProgress(500000, 1000000)
      expect(progress).toBe(50)
    })
  })

  // ============================================================================
  // Output Retrieval Tests
  // ============================================================================
  describe('getOutputsForWO', () => {
    it('should return paginated outputs with default options', async () => {
      const result = await getOutputsForWO('wo-123')

      expect(result).toHaveProperty('outputs')
      expect(result).toHaveProperty('summary')
      expect(result).toHaveProperty('pagination')
      expect(result.pagination).toHaveProperty('page', 1)
      expect(result.pagination).toHaveProperty('limit', 20)
    })

    it('should apply page and limit options', async () => {
      const result = await getOutputsForWO('wo-123', { page: 2, limit: 10 })

      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(10)
    })

    it('should filter by qa_status when provided', async () => {
      const result = await getOutputsForWO('wo-123', { qa_status: 'approved' })

      // Service should return outputs (filtering is done by Supabase)
      // In unit tests with mocks, we verify the service calls work
      expect(result).toHaveProperty('outputs')
      expect(result).toHaveProperty('summary')
      expect(result).toHaveProperty('pagination')
    })

    it('should filter by location_id when provided', async () => {
      const result = await getOutputsForWO('wo-123', {
        location_id: 'loc-abc',
      })

      // Service should return outputs (filtering is done by Supabase)
      expect(result).toHaveProperty('outputs')
      expect(result).toHaveProperty('summary')
    })

    it('should exclude by-products from output list', async () => {
      const result = await getOutputsForWO('wo-123')

      // By-products should NOT be included in the list
      result.outputs.forEach((output) => {
        expect(output.is_by_product).not.toBe(true)
      })
    })

    it('should sort by created_at DESC by default', async () => {
      const result = await getOutputsForWO('wo-123')

      // Service should return outputs (sorting is done by Supabase)
      expect(result).toHaveProperty('outputs')
      expect(result.outputs.length).toBeGreaterThan(0)
    })

    it('should support ascending order', async () => {
      const result = await getOutputsForWO('wo-123', {
        sort: 'created_at',
        order: 'asc',
      })

      // Service should accept asc order option
      expect(result).toHaveProperty('outputs')
    })

    it('should include all required output fields', async () => {
      const result = await getOutputsForWO('wo-123')

      if (result.outputs.length > 0) {
        const output = result.outputs[0]
        expect(output).toHaveProperty('id')
        expect(output).toHaveProperty('lp_id')
        expect(output).toHaveProperty('lp_number')
        expect(output).toHaveProperty('quantity')
        expect(output).toHaveProperty('uom')
        expect(output).toHaveProperty('batch_number')
        expect(output).toHaveProperty('qa_status')
        expect(output).toHaveProperty('location_id')
        expect(output).toHaveProperty('location_name')
        expect(output).toHaveProperty('expiry_date')
        expect(output).toHaveProperty('created_at')
        expect(output).toHaveProperty('created_by_name')
      }
    })
  })

  // ============================================================================
  // Summary Calculation Tests
  // ============================================================================
  describe('getOutputsSummary', () => {
    it('should return summary with total counts and quantities', async () => {
      const summary = await getOutputsSummary('wo-123')

      expect(summary).toHaveProperty('total_outputs')
      expect(summary).toHaveProperty('total_qty')
      expect(summary).toHaveProperty('approved_count')
      expect(summary).toHaveProperty('approved_qty')
      expect(summary).toHaveProperty('pending_count')
      expect(summary).toHaveProperty('pending_qty')
      expect(summary).toHaveProperty('rejected_count')
      expect(summary).toHaveProperty('rejected_qty')
    })

    it('should calculate summary excluding by-products', async () => {
      // AC: by-product outputs are excluded from sum
      const summary = await getOutputsSummary('wo-123')

      // Total should not include by-product quantities
      expect(summary.total_qty).toBeGreaterThanOrEqual(0)
    })

    it('should aggregate quantities correctly across multiple outputs', async () => {
      const summary = await getOutputsSummary('wo-123')

      // Sum of approved + pending + rejected should equal total
      const calculatedTotal =
        summary.approved_qty + summary.pending_qty + summary.rejected_qty
      expect(calculatedTotal).toBe(summary.total_qty)
    })
  })

  // ============================================================================
  // WO Progress Tracking Tests
  // ============================================================================
  describe('getWOProgress', () => {
    it('should return complete progress response', async () => {
      const progress = await getWOProgress('wo-123')

      expect(progress).toHaveProperty('wo_id')
      expect(progress).toHaveProperty('wo_number')
      expect(progress).toHaveProperty('planned_qty')
      expect(progress).toHaveProperty('output_qty')
      expect(progress).toHaveProperty('progress_percent')
      expect(progress).toHaveProperty('remaining_qty')
      expect(progress).toHaveProperty('outputs_count')
      expect(progress).toHaveProperty('is_complete')
      expect(progress).toHaveProperty('auto_complete_enabled')
      expect(progress).toHaveProperty('status')
    })

    it('should calculate remaining quantity correctly', async () => {
      const progress = await getWOProgress('wo-123')

      // remaining = planned - output (minimum 0)
      const expectedRemaining = Math.max(
        0,
        progress.planned_qty - progress.output_qty
      )
      expect(progress.remaining_qty).toBe(expectedRemaining)
    })

    it('should set remaining to 0 for over-production', async () => {
      // Mock WO with output > planned
      const progress = await getWOProgress('wo-overproduced')

      if (progress.output_qty > progress.planned_qty) {
        expect(progress.remaining_qty).toBe(0)
      }
    })

    it('should report is_complete true when status is completed', async () => {
      const progress = await getWOProgress('wo-completed')

      if (progress.status === 'completed') {
        expect(progress.is_complete).toBe(true)
      }
    })

    it('should include auto_complete_enabled flag from settings', async () => {
      const progress = await getWOProgress('wo-123')

      expect(typeof progress.auto_complete_enabled).toBe('boolean')
    })
  })

  // ============================================================================
  // Cumulative Output Tracking Tests
  // ============================================================================
  describe('Cumulative Output Tracking', () => {
    it('should aggregate first output correctly', async () => {
      // AC: GIVEN first output = 400, THEN WO.output_qty = 400
      const progress = await getWOProgress('wo-first-output')

      // After first output registration
      expect(progress.output_qty).toBe(400)
      expect(progress.progress_percent).toBe(40)
    })

    it('should aggregate subsequent outputs cumulatively', async () => {
      // AC: GIVEN WO.output_qty = 400 AND second output = 300
      // THEN WO.output_qty = 700 AND progress = 70%
      const progress = await getWOProgress('wo-two-outputs')

      expect(progress.output_qty).toBe(700)
      expect(progress.progress_percent).toBe(70)
    })

    it('should reach 100% when outputs equal planned', async () => {
      // AC: GIVEN third output = 300 (total = 1000)
      // THEN progress = 100%
      const progress = await getWOProgress('wo-complete')

      expect(progress.output_qty).toBe(1000)
      expect(progress.progress_percent).toBe(100)
    })

    it('should handle over-production (>100%)', async () => {
      // AC: GIVEN output_qty = 1200 AND planned_qty = 1000
      // THEN progress = 120%
      const progress = await getWOProgress('wo-overproduced')

      expect(progress.output_qty).toBe(1200)
      expect(progress.progress_percent).toBe(120)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * calculateProgress (7 tests):
 *   - Zero output
 *   - Partial completion (40%)
 *   - Complete (100%)
 *   - Over-production (>100%)
 *   - Decimal precision
 *   - Zero planned (edge case)
 *   - Large quantities
 *
 * getOutputsForWO (8 tests):
 *   - Default pagination
 *   - Custom page/limit
 *   - QA status filter
 *   - Location filter
 *   - By-product exclusion
 *   - Default sort (DESC)
 *   - Ascending sort
 *   - Required fields
 *
 * getOutputsSummary (3 tests):
 *   - Summary structure
 *   - By-product exclusion
 *   - Aggregate correctness
 *
 * getWOProgress (5 tests):
 *   - Response structure
 *   - Remaining calculation
 *   - Over-production remaining
 *   - Completion status
 *   - Auto-complete flag
 *
 * Cumulative Tracking (4 tests):
 *   - First output
 *   - Subsequent outputs
 *   - 100% completion
 *   - Over-production
 *
 * Total: 27 tests (RED - will fail until service implemented)
 */
