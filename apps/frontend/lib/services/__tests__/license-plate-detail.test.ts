/**
 * License Plate Detail Service - Unit Tests (Story 05.6)
 * Purpose: Test LP Detail service methods for detail view and transactions
 * Phase: RED - Tests will fail until service is implemented
 *
 * Tests the LP Detail service which handles:
 * - Get LP detail with joined product, warehouse, location
 * - Block/unblock LP with reason validation
 * - LP transaction history (placeholder for Phase 2)
 * - Expiry date calculations
 * - Status badge color mapping
 *
 * Coverage Target: 80%+
 * Test Count: 25+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-13: API Endpoint - Get LP Detail
 * - AC-14: API Endpoint - LP Not Found
 * - AC-10: Quick Actions - Block LP
 * - AC-11: Quick Actions - Unblock LP
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
  LicensePlateDetailService,
  type LPDetailView,
  type BlockLPInput,
  type LPTransaction,
} from '../license-plate-detail-service'

describe('LicensePlateDetailService (Story 05.6)', () => {
  let mockSupabase: any
  let mockQuery: any

  const mockLPDetail: LPDetailView = {
    id: 'lp-001',
    org_id: 'org-123',
    lp_number: 'LP00000001',
    status: 'available',
    qa_status: 'passed',
    product_id: 'prod-001',
    quantity: 500.0,
    uom: 'KG',
    location_id: 'loc-001',
    warehouse_id: 'wh-001',
    batch_number: 'BATCH-2025-001',
    supplier_batch_number: 'SUP-BATCH-001',
    expiry_date: '2026-06-15',
    manufacture_date: '2025-06-15',
    source: 'production',
    wo_id: 'wo-001',
    grn_id: null,
    po_number: null,
    parent_lp_id: null,
    consumed_by_wo_id: null,
    pallet_id: null,
    catch_weight_kg: 505.3,
    block_reason: null,
    created_at: '2025-12-20T14:23:15Z',
    updated_at: '2025-12-20T14:23:15Z',
    product: {
      id: 'prod-001',
      name: 'Premium Chocolate Bar',
      code: 'CHOC-001',
    },
    warehouse: {
      id: 'wh-001',
      name: 'Main Warehouse',
      code: 'WH-001',
    },
    location: {
      id: 'loc-001',
      full_path: 'WH-001 > Zone A > Bin 5',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock chain
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    }

    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQuery),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    }
  })

  /**
   * Test Group: getLPDetail
   * AC-13: Returns LP with joined fields
   */
  describe('getLPDetail', () => {
    it('should return LP detail with joined product, warehouse, location', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: mockLPDetail,
        error: null,
      })

      const result = await LicensePlateDetailService.getLPDetail(
        mockSupabase as any,
        'lp-001'
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('license_plates')
      expect(mockQuery.select).toHaveBeenCalledWith(
        expect.stringContaining('product:products')
      )
      expect(mockQuery.select).toHaveBeenCalledWith(
        expect.stringContaining('warehouse:warehouses')
      )
      expect(mockQuery.select).toHaveBeenCalledWith(
        expect.stringContaining('location:locations')
      )
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'lp-001')
      expect(result).toEqual(mockLPDetail)
    })

    it('should return null when LP not found', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const result = await LicensePlateDetailService.getLPDetail(
        mockSupabase as any,
        'invalid-id'
      )

      expect(result).toBeNull()
    })

    it('should throw error on database failure', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database connection failed' },
      })

      await expect(
        LicensePlateDetailService.getLPDetail(mockSupabase as any, 'lp-001')
      ).rejects.toThrow('Database connection failed')
    })

    it('should enforce RLS by org_id', async () => {
      // RLS automatically filters by org_id at DB level
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      })

      const result = await LicensePlateDetailService.getLPDetail(
        mockSupabase as any,
        'lp-from-other-org'
      )

      expect(result).toBeNull() // Returns 404, not 403
    })
  })

  /**
   * Test Group: blockLP
   * AC-10: Block LP with reason validation
   */
  describe('blockLP', () => {
    it('should validate reason is provided', async () => {
      const input: BlockLPInput = {
        lpId: 'lp-001',
        reason: '',
      }

      await expect(
        LicensePlateDetailService.blockLP(mockSupabase as any, input)
      ).rejects.toThrow('Reason is required')
    })

    it('should validate reason length (max 500 chars)', async () => {
      const input: BlockLPInput = {
        lpId: 'lp-001',
        reason: 'x'.repeat(501),
      }

      await expect(
        LicensePlateDetailService.blockLP(mockSupabase as any, input)
      ).rejects.toThrow('Reason must be 500 characters or less')
    })

    it('should block LP and return updated LP', async () => {
      const input: BlockLPInput = {
        lpId: 'lp-001',
        reason: 'Quality issue detected',
      }

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockLPDetail, status: 'blocked', block_reason: input.reason },
        error: null,
      })

      const result = await LicensePlateDetailService.blockLP(
        mockSupabase as any,
        input
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('license_plates')
      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'blocked',
        block_reason: input.reason,
        updated_at: expect.any(String),
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'lp-001')
      expect(result.status).toBe('blocked')
      expect(result.block_reason).toBe(input.reason)
    })

    it('should throw error if LP already blocked', async () => {
      const input: BlockLPInput = {
        lpId: 'lp-001',
        reason: 'Quality issue',
      }

      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'LP cannot be blocked (current status: blocked)',
        },
      })

      await expect(
        LicensePlateDetailService.blockLP(mockSupabase as any, input)
      ).rejects.toThrow('LP cannot be blocked')
    })

    it('should create audit log entry for block action', async () => {
      const input: BlockLPInput = {
        lpId: 'lp-001',
        reason: 'Quality issue',
      }

      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockLPDetail, status: 'blocked' },
        error: null,
      })

      await LicensePlateDetailService.blockLP(mockSupabase as any, input)

      // Verify audit log created (check in transaction log)
      expect(mockSupabase.from).toHaveBeenCalledWith('lp_transactions')
    })
  })

  /**
   * Test Group: unblockLP
   * AC-11: Unblock LP
   */
  describe('unblockLP', () => {
    it('should unblock LP and return updated LP', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: {
          ...mockLPDetail,
          status: 'available',
          block_reason: null,
        },
        error: null,
      })

      const result = await LicensePlateDetailService.unblockLP(
        mockSupabase as any,
        'lp-001'
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('license_plates')
      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'available',
        block_reason: null,
        updated_at: expect.any(String),
      })
      expect(result.status).toBe('available')
      expect(result.block_reason).toBeNull()
    })

    it('should throw error if LP not blocked', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'LP cannot be unblocked (current status: available)',
        },
      })

      await expect(
        LicensePlateDetailService.unblockLP(mockSupabase as any, 'lp-001')
      ).rejects.toThrow('LP cannot be unblocked')
    })

    it('should create audit log entry for unblock action', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockLPDetail, status: 'available' },
        error: null,
      })

      await LicensePlateDetailService.unblockLP(mockSupabase as any, 'lp-001')

      expect(mockSupabase.from).toHaveBeenCalledWith('lp_transactions')
    })
  })

  /**
   * Test Group: Expiry Calculation
   * AC-5: Days until expiry
   */
  describe('calculateDaysRemaining', () => {
    it('should calculate days remaining correctly', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const expiryDate = futureDate.toISOString().split('T')[0]

      const days = LicensePlateDetailService.calculateDaysRemaining(expiryDate)

      expect(days).toBe(30)
    })

    it('should return negative for expired items', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 5)
      const expiryDate = pastDate.toISOString().split('T')[0]

      const days = LicensePlateDetailService.calculateDaysRemaining(expiryDate)

      expect(days).toBe(-5)
    })

    it('should return null for no expiry date', () => {
      const days = LicensePlateDetailService.calculateDaysRemaining(null)

      expect(days).toBeNull()
    })

    it('should return 0 for today expiry', () => {
      const today = new Date().toISOString().split('T')[0]

      const days = LicensePlateDetailService.calculateDaysRemaining(today)

      expect(days).toBe(0)
    })
  })

  /**
   * Test Group: Badge Colors
   * UX Spec: Status and QA badge colors
   */
  describe('getStatusBadgeColor', () => {
    it('should return green for available status', () => {
      const color = LicensePlateDetailService.getStatusBadgeColor('available')

      expect(color).toEqual({
        background: 'bg-green-100',
        border: 'border-green-300',
        text: 'text-green-800',
      })
    })

    it('should return yellow for reserved status', () => {
      const color = LicensePlateDetailService.getStatusBadgeColor('reserved')

      expect(color).toEqual({
        background: 'bg-yellow-100',
        border: 'border-yellow-300',
        text: 'text-yellow-800',
      })
    })

    it('should return gray for consumed status', () => {
      const color = LicensePlateDetailService.getStatusBadgeColor('consumed')

      expect(color).toEqual({
        background: 'bg-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-500',
      })
    })

    it('should return red for blocked status', () => {
      const color = LicensePlateDetailService.getStatusBadgeColor('blocked')

      expect(color).toEqual({
        background: 'bg-red-100',
        border: 'border-red-300',
        text: 'text-red-800',
      })
    })
  })

  describe('getQABadgeColor', () => {
    it('should return yellow for pending QA status', () => {
      const color = LicensePlateDetailService.getQABadgeColor('pending')

      expect(color).toEqual({
        background: 'bg-yellow-100',
        border: 'border-yellow-300',
        text: 'text-yellow-800',
      })
    })

    it('should return green for passed QA status', () => {
      const color = LicensePlateDetailService.getQABadgeColor('passed')

      expect(color).toEqual({
        background: 'bg-green-100',
        border: 'border-green-300',
        text: 'text-green-800',
      })
    })

    it('should return red for failed QA status', () => {
      const color = LicensePlateDetailService.getQABadgeColor('failed')

      expect(color).toEqual({
        background: 'bg-red-100',
        border: 'border-red-300',
        text: 'text-red-800',
      })
    })

    it('should return orange for quarantine QA status', () => {
      const color = LicensePlateDetailService.getQABadgeColor('quarantine')

      expect(color).toEqual({
        background: 'bg-orange-100',
        border: 'border-orange-300',
        text: 'text-orange-800',
      })
    })
  })

  /**
   * Test Group: Expiry Warning Colors
   * AC-5: Color-coded expiry warnings
   */
  describe('getExpiryWarningLevel', () => {
    it('should return "expired" for past dates', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      const expiryDate = pastDate.toISOString().split('T')[0]

      const level = LicensePlateDetailService.getExpiryWarningLevel(expiryDate)

      expect(level).toBe('expired')
    })

    it('should return "critical" for 0-7 days remaining', () => {
      const criticalDate = new Date()
      criticalDate.setDate(criticalDate.getDate() + 5)
      const expiryDate = criticalDate.toISOString().split('T')[0]

      const level = LicensePlateDetailService.getExpiryWarningLevel(expiryDate)

      expect(level).toBe('critical')
    })

    it('should return "warning" for 8-30 days remaining', () => {
      const warningDate = new Date()
      warningDate.setDate(warningDate.getDate() + 20)
      const expiryDate = warningDate.toISOString().split('T')[0]

      const level = LicensePlateDetailService.getExpiryWarningLevel(expiryDate)

      expect(level).toBe('warning')
    })

    it('should return "normal" for >30 days remaining', () => {
      const normalDate = new Date()
      normalDate.setDate(normalDate.getDate() + 60)
      const expiryDate = normalDate.toISOString().split('T')[0]

      const level = LicensePlateDetailService.getExpiryWarningLevel(expiryDate)

      expect(level).toBe('normal')
    })

    it('should return "na" for null expiry date', () => {
      const level = LicensePlateDetailService.getExpiryWarningLevel(null)

      expect(level).toBe('na')
    })
  })

  /**
   * Test Group: LP Transactions (Phase 2 Placeholder)
   */
  describe('getLPTransactions', () => {
    it('should return empty array for Phase 0', async () => {
      // Phase 0: History tab is placeholder
      const result = await LicensePlateDetailService.getLPTransactions(
        mockSupabase as any,
        'lp-001',
        { page: 1, limit: 10 }
      )

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      })
    })

    it('should support pagination parameters', async () => {
      const result = await LicensePlateDetailService.getLPTransactions(
        mockSupabase as any,
        'lp-001',
        { page: 2, limit: 20 }
      )

      expect(result.page).toBe(2)
      expect(result.limit).toBe(20)
    })
  })
})
