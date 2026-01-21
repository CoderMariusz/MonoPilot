/**
 * Over-Consumption Service Unit Tests
 * Story: 04.6e - Over-Consumption Control
 *
 * Tests the over-consumption detection service:
 * - checkOverConsumption: Detect when consumption exceeds BOM
 * - createOverConsumptionRequest: Request approval for over-consumption
 * - approveOverConsumption: Manager approval flow
 * - rejectOverConsumption: Manager rejection flow
 * - getPendingRequests: Get pending requests for a WO
 * - getHighVarianceWOs: Get WOs with >10% variance for dashboard
 *
 * RED PHASE: All tests should FAIL until service is implemented.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OverConsumptionService } from '../over-consumption-service'

// Mock state
let mockAuthUser: { id: string; email: string } | null = null
let mockUserData: { id: string; org_id: string; full_name: string } | null = null

// Track current table for conditional returns
let currentTable = ''
let singleCallIndex = 0
let maybeSingleCallIndex = 0
const singleResponses: Array<{ data: unknown; error: unknown }> = []
const maybeSingleResponses: Array<{ data: unknown; error: unknown }> = []
const eqResponses: Array<{ data: unknown; error: unknown }> = []

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(() =>
      Promise.resolve({
        data: { user: mockAuthUser },
        error: mockAuthUser ? null : { message: 'No session' },
      })
    ),
  },
  from: vi.fn((table: string) => {
    currentTable = table
    return mockSupabase
  }),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  eq: vi.fn(() => {
    // Return pre-configured response if we have one for this eq call
    if (eqResponses.length > 0) {
      const response = eqResponses.shift()
      if (response) return Promise.resolve(response)
    }
    return mockSupabase
  }),
  order: vi.fn(() => mockSupabase),
  gt: vi.fn(() => mockSupabase),
  single: vi.fn(() => {
    if (singleResponses.length > singleCallIndex) {
      return Promise.resolve(singleResponses[singleCallIndex++])
    }
    return Promise.resolve({ data: null, error: { message: 'Not found' } })
  }),
  maybeSingle: vi.fn(() => {
    if (maybeSingleResponses.length > maybeSingleCallIndex) {
      return Promise.resolve(maybeSingleResponses[maybeSingleCallIndex++])
    }
    return Promise.resolve({ data: null, error: null })
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// Helper to set up single() mock responses
function setupSingleResponses(responses: Array<{ data: unknown; error: unknown }>) {
  singleResponses.length = 0
  singleCallIndex = 0
  responses.forEach(r => singleResponses.push(r))
}

// Helper to set up maybeSingle() mock responses
function setupMaybeSingleResponses(responses: Array<{ data: unknown; error: unknown }>) {
  maybeSingleResponses.length = 0
  maybeSingleCallIndex = 0
  responses.forEach(r => maybeSingleResponses.push(r))
}

// Helper to set up eq() mock responses (for getPendingRequests, getHighVarianceWOs)
function setupEqResponses(responses: Array<{ data: unknown; error: unknown }>) {
  eqResponses.length = 0
  responses.forEach(r => eqResponses.push(r))
}

// Helper to set up authenticated user
function setupAuthUser() {
  mockAuthUser = { id: 'user-1', email: 'test@example.com' }
  mockUserData = { id: 'user-1', org_id: 'org-1', full_name: 'Test User' }
}

describe('OverConsumptionService (Story 04.6e)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthUser = null
    mockUserData = null
    singleResponses.length = 0
    singleCallIndex = 0
    maybeSingleResponses.length = 0
    maybeSingleCallIndex = 0
    eqResponses.length = 0
  })

  // ==========================================================================
  // checkOverConsumption
  // ==========================================================================
  describe('checkOverConsumption', () => {
    describe('Over-Consumption Detection', () => {
      it('should return true when consumption exceeds BOM requirement', async () => {
        setupSingleResponses([{
          data: {
            id: 'mat-1',
            required_qty: 100,
            consumed_qty: 100,
            uom: 'kg',
          },
          error: null,
        }])

        const result = await OverConsumptionService.checkOverConsumption('mat-1', 10)

        expect(result.isOverConsumption).toBe(true)
        expect(result.overQty).toBe(10)
        expect(result.variancePercent).toBe(10)
      })

      it('should return true when partial consumption + new exceeds BOM', async () => {
        setupSingleResponses([{
          data: {
            id: 'mat-1',
            required_qty: 100,
            consumed_qty: 95,
            uom: 'kg',
          },
          error: null,
        }])

        const result = await OverConsumptionService.checkOverConsumption('mat-1', 10)

        expect(result.isOverConsumption).toBe(true)
        expect(result.overQty).toBe(5) // 95 + 10 - 100 = 5
        expect(result.variancePercent).toBe(5)
      })

      it('should return false when consumption is within BOM', async () => {
        setupSingleResponses([{
          data: {
            id: 'mat-1',
            required_qty: 100,
            consumed_qty: 50,
            uom: 'kg',
          },
          error: null,
        }])

        const result = await OverConsumptionService.checkOverConsumption('mat-1', 40)

        expect(result.isOverConsumption).toBe(false)
        expect(result.overQty).toBeUndefined()
      })

      it('should return false when exactly meeting BOM requirement', async () => {
        setupSingleResponses([{
          data: {
            id: 'mat-1',
            required_qty: 100,
            consumed_qty: 90,
            uom: 'kg',
          },
          error: null,
        }])

        const result = await OverConsumptionService.checkOverConsumption('mat-1', 10)

        expect(result.isOverConsumption).toBe(false)
      })
    })

    describe('Variance Calculation', () => {
      it('should calculate variance percent correctly (10%)', async () => {
        setupSingleResponses([{
          data: {
            id: 'mat-1',
            required_qty: 100,
            consumed_qty: 100,
            uom: 'kg',
          },
          error: null,
        }])

        const result = await OverConsumptionService.checkOverConsumption('mat-1', 10)

        expect(result.variancePercent).toBe(10)
      })

      it('should calculate variance percent correctly (25%)', async () => {
        setupSingleResponses([{
          data: {
            id: 'mat-1',
            required_qty: 100,
            consumed_qty: 100,
            uom: 'kg',
          },
          error: null,
        }])

        const result = await OverConsumptionService.checkOverConsumption('mat-1', 25)

        expect(result.variancePercent).toBe(25)
      })

      it('should handle decimal variance (7.5%)', async () => {
        setupSingleResponses([{
          data: {
            id: 'mat-1',
            required_qty: 200,
            consumed_qty: 200,
            uom: 'kg',
          },
          error: null,
        }])

        const result = await OverConsumptionService.checkOverConsumption('mat-1', 15)

        expect(result.variancePercent).toBe(7.5)
      })

      it('should include required and consumed qty in result', async () => {
        setupSingleResponses([{
          data: {
            id: 'mat-1',
            required_qty: 100,
            consumed_qty: 80,
            uom: 'kg',
          },
          error: null,
        }])

        const result = await OverConsumptionService.checkOverConsumption('mat-1', 30)

        expect(result.requiredQty).toBe(100)
        expect(result.currentConsumedQty).toBe(80)
      })
    })

    describe('Error Handling', () => {
      it('should throw error when material not found', async () => {
        setupSingleResponses([{
          data: null,
          error: { message: 'Material not found' },
        }])

        await expect(
          OverConsumptionService.checkOverConsumption('invalid-mat', 10)
        ).rejects.toThrow(/material not found/i)
      })
    })
  })

  // ==========================================================================
  // createOverConsumptionRequest
  // ==========================================================================
  describe('createOverConsumptionRequest', () => {
    const requestParams = {
      woId: 'wo-123',
      woMaterialId: 'mat-456',
      lpId: 'lp-789',
      requestedQty: 10,
    }

    beforeEach(() => {
      setupAuthUser()
    })

    it('should create request and return request_id with pending status', async () => {
      // Mock sequence: 1. user lookup, 2. material lookup, 3. WO lookup, 4. check pending, 5. insert, 6. LP lookup
      setupSingleResponses([
        { data: mockUserData, error: null }, // user
        { data: { id: 'mat-456', wo_id: 'wo-123', required_qty: 100, consumed_qty: 100, products: { id: 'prod-1', code: 'RM-001', name: 'Raw Material A' } }, error: null }, // material
        { data: { id: 'wo-123', wo_number: 'WO-2025-001' }, error: null }, // WO
        { data: { id: 'req-001', status: 'pending', created_at: '2025-01-20T10:00:00Z' }, error: null }, // insert
        { data: { id: 'lp-789', lp_number: 'LP-001' }, error: null }, // LP
      ])
      setupMaybeSingleResponses([{ data: null, error: null }]) // no existing pending

      const result = await OverConsumptionService.createOverConsumptionRequest(
        requestParams.woId,
        requestParams.woMaterialId,
        requestParams.lpId,
        requestParams.requestedQty
      )

      expect(result.request_id).toBe('req-001')
      expect(result.status).toBe('pending')
    })

    it('should include all quantity information in result', async () => {
      setupSingleResponses([
        { data: mockUserData, error: null }, // user
        { data: { id: 'mat-456', wo_id: 'wo-123', required_qty: 100, consumed_qty: 100 }, error: null }, // material
        { data: { id: 'wo-123', wo_number: 'WO-2025-001' }, error: null }, // WO
        { data: { id: 'req-001', status: 'pending', created_at: '2025-01-20T10:00:00Z' }, error: null }, // insert
        { data: { id: 'lp-789', lp_number: 'LP-001' }, error: null }, // LP
      ])
      setupMaybeSingleResponses([{ data: null, error: null }])

      const result = await OverConsumptionService.createOverConsumptionRequest(
        requestParams.woId,
        requestParams.woMaterialId,
        requestParams.lpId,
        requestParams.requestedQty
      )

      expect(result.required_qty).toBe(100)
      expect(result.current_consumed_qty).toBe(100)
      expect(result.requested_qty).toBe(10)
      expect(result.total_after_qty).toBe(110)
      expect(result.over_consumption_qty).toBe(10)
      expect(result.variance_percent).toBe(10)
    })

    it('should throw error when pending request already exists', async () => {
      setupSingleResponses([
        { data: mockUserData, error: null }, // user
        { data: { id: 'mat-456', wo_id: 'wo-123', required_qty: 100, consumed_qty: 100 }, error: null }, // material
        { data: { id: 'wo-123', wo_number: 'WO-2025-001' }, error: null }, // WO
      ])
      // Existing pending request found
      setupMaybeSingleResponses([{ data: { id: 'existing-req', status: 'pending' }, error: null }])

      await expect(
        OverConsumptionService.createOverConsumptionRequest(
          requestParams.woId,
          requestParams.woMaterialId,
          requestParams.lpId,
          requestParams.requestedQty
        )
      ).rejects.toThrow(/pending approval request already exists/i)
    })

    it('should throw error when not actually over-consumption', async () => {
      setupSingleResponses([
        { data: mockUserData, error: null }, // user
        { data: { id: 'mat-456', required_qty: 100, consumed_qty: 50 }, error: null }, // material - only 50 consumed
        { data: { id: 'wo-123', wo_number: 'WO-2025-001' }, error: null }, // WO
      ])

      await expect(
        OverConsumptionService.createOverConsumptionRequest(
          requestParams.woId,
          requestParams.woMaterialId,
          requestParams.lpId,
          requestParams.requestedQty
        )
      ).rejects.toThrow(/does not exceed.*bom requirement/i)
    })
  })

  // ==========================================================================
  // approveOverConsumption
  // ==========================================================================
  describe('approveOverConsumption', () => {
    beforeEach(() => {
      setupAuthUser()
    })

    it('should update request status to approved', async () => {
      // Mock sequence: user, request, insert consumption, LP, WO material, audit log
      setupSingleResponses([
        { data: mockUserData, error: null }, // user
        { data: { id: 'req-001', status: 'pending', wo_id: 'wo-123', wo_material_id: 'mat-456', lp_id: 'lp-789', requested_qty: 10 }, error: null }, // request
        { data: { id: 'cons-001' }, error: null }, // consumption insert
        { data: { id: 'lp-789', qty: 100 }, error: null }, // LP lookup
        { data: { id: 'mat-456', consumed_qty: 100 }, error: null }, // WO material lookup
      ])

      const result = await OverConsumptionService.approveOverConsumption('req-001')

      expect(result.status).toBe('approved')
      expect(result.request_id).toBe('req-001')
    })

    it('should include approval reason when provided', async () => {
      setupSingleResponses([
        { data: mockUserData, error: null },
        { data: { id: 'req-001', status: 'pending', wo_id: 'wo-123', wo_material_id: 'mat-456', lp_id: 'lp-789', requested_qty: 10 }, error: null },
        { data: { id: 'cons-001' }, error: null },
        { data: { id: 'lp-789', qty: 100 }, error: null },
        { data: { id: 'mat-456', consumed_qty: 100 }, error: null },
      ])

      const result = await OverConsumptionService.approveOverConsumption(
        'req-001',
        'Higher moisture content'
      )

      expect(result.reason).toBe('Higher moisture content')
    })

    it('should create consumption record on approval', async () => {
      setupSingleResponses([
        { data: mockUserData, error: null },
        { data: { id: 'req-001', status: 'pending', wo_id: 'wo-123', wo_material_id: 'mat-456', lp_id: 'lp-789', requested_qty: 10 }, error: null },
        { data: { id: 'cons-001' }, error: null }, // consumption insert returns id
        { data: { id: 'lp-789', qty: 100 }, error: null },
        { data: { id: 'mat-456', consumed_qty: 100 }, error: null },
      ])

      const result = await OverConsumptionService.approveOverConsumption('req-001')

      expect(result.consumption_id).toBe('cons-001')
    })

    it('should include approver information in result', async () => {
      setupSingleResponses([
        { data: mockUserData, error: null },
        { data: { id: 'req-001', status: 'pending', wo_id: 'wo-123', wo_material_id: 'mat-456', lp_id: 'lp-789', requested_qty: 10 }, error: null },
        { data: { id: 'cons-001' }, error: null },
        { data: { id: 'lp-789', qty: 100 }, error: null },
        { data: { id: 'mat-456', consumed_qty: 100 }, error: null },
      ])

      const result = await OverConsumptionService.approveOverConsumption('req-001')

      expect(result.approved_by).toBe('user-1')
      expect(result.approved_at).toBeDefined()
    })

    it('should throw error for already decided request', async () => {
      setupSingleResponses([
        { data: mockUserData, error: null },
        { data: { id: 'req-001', status: 'approved' }, error: null }, // already approved
      ])

      await expect(
        OverConsumptionService.approveOverConsumption('req-001')
      ).rejects.toThrow(/already been approved or rejected/i)
    })

    it('should throw error when request not found', async () => {
      setupSingleResponses([
        { data: mockUserData, error: null },
        { data: null, error: { message: 'Not found' } },
      ])

      await expect(
        OverConsumptionService.approveOverConsumption('invalid-req')
      ).rejects.toThrow(/request not found/i)
    })

    it('should update LP quantity after approval', async () => {
      setupSingleResponses([
        { data: mockUserData, error: null },
        { data: { id: 'req-001', status: 'pending', wo_id: 'wo-123', wo_material_id: 'mat-456', lp_id: 'lp-789', requested_qty: 10 }, error: null },
        { data: { id: 'cons-001' }, error: null },
        { data: { id: 'lp-789', qty: 100 }, error: null }, // LP has 100, after -10 = 90
        { data: { id: 'mat-456', consumed_qty: 100 }, error: null },
      ])

      const result = await OverConsumptionService.approveOverConsumption('req-001')

      expect(result.lp_new_qty).toBe(90)
    })
  })

  // ==========================================================================
  // rejectOverConsumption
  // ==========================================================================
  describe('rejectOverConsumption', () => {
    beforeEach(() => {
      setupAuthUser()
    })

    it('should update request status to rejected with reason', async () => {
      setupSingleResponses([
        { data: mockUserData, error: null }, // user
        { data: { id: 'req-001', status: 'pending', wo_id: 'wo-123', wo_material_id: 'mat-456', requested_qty: 10 }, error: null }, // request
      ])

      const result = await OverConsumptionService.rejectOverConsumption(
        'req-001',
        'Investigate waste'
      )

      expect(result.status).toBe('rejected')
      expect(result.reason).toBe('Investigate waste')
    })

    it('should not create consumption record on rejection', async () => {
      setupSingleResponses([
        { data: mockUserData, error: null },
        { data: { id: 'req-001', status: 'pending', wo_id: 'wo-123', wo_material_id: 'mat-456', requested_qty: 10 }, error: null },
      ])

      const result = await OverConsumptionService.rejectOverConsumption(
        'req-001',
        'Investigate waste'
      )

      // Rejection should not have consumption_id
      expect((result as Record<string, unknown>).consumption_id).toBeUndefined()
    })

    it('should include rejector information in result', async () => {
      setupSingleResponses([
        { data: mockUserData, error: null },
        { data: { id: 'req-001', status: 'pending', wo_id: 'wo-123', wo_material_id: 'mat-456', requested_qty: 10 }, error: null },
      ])

      const result = await OverConsumptionService.rejectOverConsumption(
        'req-001',
        'Investigate waste'
      )

      expect(result.rejected_by).toBe('user-1')
      expect(result.rejected_at).toBeDefined()
    })

    it('should throw error when reason is empty', async () => {
      await expect(
        OverConsumptionService.rejectOverConsumption('req-001', '')
      ).rejects.toThrow(/rejection reason is required/i)
    })

    it('should throw error for already decided request', async () => {
      setupSingleResponses([
        { data: mockUserData, error: null },
        { data: { id: 'req-001', status: 'rejected' }, error: null }, // already rejected
      ])

      await expect(
        OverConsumptionService.rejectOverConsumption('req-001', 'Reason')
      ).rejects.toThrow(/already been approved or rejected/i)
    })
  })

  // ==========================================================================
  // getPendingRequests
  // ==========================================================================
  describe('getPendingRequests', () => {
    it('should return pending requests for a WO', async () => {
      // Override order() to return the data
      mockSupabase.order = vi.fn(() => Promise.resolve({
        data: [
          {
            id: 'req-001',
            status: 'pending',
            wo_material_id: 'mat-1',
            requested_at: '2025-01-20T10:00:00Z',
            requested_by: 'user-1',
            requested_qty: 10,
            over_consumption_qty: 5,
            variance_percent: 5,
            users: { full_name: 'John Doe' },
          },
          {
            id: 'req-002',
            status: 'pending',
            wo_material_id: 'mat-2',
            requested_at: '2025-01-20T10:05:00Z',
            requested_by: 'user-1',
            requested_qty: 15,
            over_consumption_qty: 10,
            variance_percent: 10,
            users: { full_name: 'John Doe' },
          },
        ],
        error: null,
      }))

      const result = await OverConsumptionService.getPendingRequests('wo-123')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('req-001')
      expect(result[1].id).toBe('req-002')
    })

    it('should return empty array when no pending requests', async () => {
      mockSupabase.order = vi.fn(() => Promise.resolve({
        data: [],
        error: null,
      }))

      const result = await OverConsumptionService.getPendingRequests('wo-123')

      expect(result).toHaveLength(0)
    })

    it('should include requester information', async () => {
      mockSupabase.order = vi.fn(() => Promise.resolve({
        data: [
          {
            id: 'req-001',
            status: 'pending',
            wo_material_id: 'mat-1',
            requested_at: '2025-01-20T10:00:00Z',
            requested_by: 'user-123',
            requested_qty: 10,
            over_consumption_qty: 5,
            variance_percent: 5,
            users: { full_name: 'John Doe' },
          },
        ],
        error: null,
      }))

      const result = await OverConsumptionService.getPendingRequests('wo-123')

      expect(result[0].requested_by_name).toBe('John Doe')
    })
  })

  // ==========================================================================
  // getHighVarianceWOs
  // ==========================================================================
  describe('getHighVarianceWOs', () => {
    it('should return WOs with variance > 10%', async () => {
      // Override gt() to return data with high variance materials
      mockSupabase.gt = vi.fn(() => Promise.resolve({
        data: [
          {
            wo_id: 'wo-1',
            required_qty: 100,
            consumed_qty: 120, // 20% variance
            work_orders: { id: 'wo-1', wo_number: 'WO-2025-001' },
          },
          {
            wo_id: 'wo-2',
            required_qty: 100,
            consumed_qty: 115, // 15% variance
            work_orders: { id: 'wo-2', wo_number: 'WO-2025-002' },
          },
        ],
        error: null,
      }))

      const result = await OverConsumptionService.getHighVarianceWOs()

      expect(result.length).toBeGreaterThan(0)
      expect(result[0].max_variance).toBeGreaterThan(10)
    })

    it('should return empty array when no high variance WOs', async () => {
      // All materials within 10% variance
      mockSupabase.gt = vi.fn(() => Promise.resolve({
        data: [
          {
            wo_id: 'wo-1',
            required_qty: 100,
            consumed_qty: 105, // 5% variance - within threshold
            work_orders: { id: 'wo-1', wo_number: 'WO-2025-001' },
          },
        ],
        error: null,
      }))

      const result = await OverConsumptionService.getHighVarianceWOs()

      expect(result).toHaveLength(0)
    })

    it('should order by variance descending', async () => {
      mockSupabase.gt = vi.fn(() => Promise.resolve({
        data: [
          { wo_id: 'wo-1', required_qty: 100, consumed_qty: 120, work_orders: { id: 'wo-1', wo_number: 'WO-2025-001' } }, // 20%
          { wo_id: 'wo-2', required_qty: 100, consumed_qty: 130, work_orders: { id: 'wo-2', wo_number: 'WO-2025-002' } }, // 30%
          { wo_id: 'wo-3', required_qty: 100, consumed_qty: 115, work_orders: { id: 'wo-3', wo_number: 'WO-2025-003' } }, // 15%
        ],
        error: null,
      }))

      const result = await OverConsumptionService.getHighVarianceWOs()

      expect(result[0].max_variance).toBe(30)
      expect(result[1].max_variance).toBe(20)
      expect(result[2].max_variance).toBe(15)
    })
  })

  // ==========================================================================
  // Variance Status Calculation Helper
  // ==========================================================================
  describe('getVarianceStatus (helper)', () => {
    it('should return exact for 0% variance', () => {
      const result = OverConsumptionService.getVarianceStatus(0)
      expect(result).toEqual({ status: 'exact', color: 'green' })
    })

    it('should return acceptable for 5% variance', () => {
      const result = OverConsumptionService.getVarianceStatus(5)
      expect(result).toEqual({ status: 'acceptable', color: 'yellow' })
    })

    it('should return acceptable for 10% variance (boundary)', () => {
      const result = OverConsumptionService.getVarianceStatus(10)
      expect(result).toEqual({ status: 'acceptable', color: 'yellow' })
    })

    it('should return high for 11% variance', () => {
      const result = OverConsumptionService.getVarianceStatus(11)
      expect(result).toEqual({ status: 'high', color: 'red' })
    })

    it('should return high for 50% variance', () => {
      const result = OverConsumptionService.getVarianceStatus(50)
      expect(result).toEqual({ status: 'high', color: 'red' })
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * checkOverConsumption (7 tests):
 *   - Over-consumption detection when exceeds BOM
 *   - Partial consumption + new exceeds
 *   - Within BOM (no over-consumption)
 *   - Exactly meeting BOM
 *   - Variance calculation 10%, 25%, 7.5%
 *   - Required/consumed qty in result
 *   - Error on material not found
 *
 * createOverConsumptionRequest (4 tests):
 *   - Create request with pending status
 *   - Quantity information in result
 *   - Error when pending request exists
 *   - Error when not over-consumption
 *
 * approveOverConsumption (7 tests):
 *   - Update status to approved
 *   - Include approval reason
 *   - Create consumption record
 *   - Approver information
 *   - Error for already decided
 *   - Error when not found
 *   - Update LP quantity
 *
 * rejectOverConsumption (5 tests):
 *   - Update status to rejected with reason
 *   - No consumption record
 *   - Rejector information
 *   - Error when reason empty
 *   - Error for already decided
 *
 * getPendingRequests (3 tests):
 *   - Return pending requests
 *   - Empty array when none
 *   - Include requester info
 *
 * getHighVarianceWOs (3 tests):
 *   - Return WOs with >10% variance
 *   - Empty when none
 *   - Order by variance desc
 *
 * getVarianceStatus (5 tests):
 *   - Exact for 0%
 *   - Acceptable for 5%
 *   - Acceptable for 10% (boundary)
 *   - High for 11%
 *   - High for 50%
 *
 * Total: 34 tests
 */
