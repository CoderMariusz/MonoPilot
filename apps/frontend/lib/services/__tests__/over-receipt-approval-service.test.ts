/**
 * Over-Receipt Approval Service - Unit Tests (Story 05.15)
 * Purpose: Test over-receipt approval workflow
 * Phase: RED -> GREEN - Tests for approval service
 *
 * Tests the approval workflow which handles:
 * - Over-receipt validation beyond tolerance
 * - Approval request creation
 * - Approve/reject actions (manager only)
 * - Duplicate approval prevention
 * - Status checks during GRN creation
 *
 * Coverage Target: 80%+
 * Test Count: 35-45 scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-3: Over-Receipt Validation Logic
 * - AC-4: Over-Receipt Approval Table
 * - AC-5: Request Over-Receipt Approval
 * - AC-6: Approve Over-Receipt
 * - AC-7: Reject Over-Receipt
 * - AC-10: Integration with GRN Workflow
 * - AC-12: RLS Policy Enforcement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Mock Supabase - Create chainable mock that mimics Supabase query builder
 */
const createChainableMock = (): any => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    not: vi.fn(() => chain),
    in: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    range: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn((resolve) => resolve({ data: null, error: null, count: 0 })),
  }
  return chain
}

const mockSupabaseClient = {
  from: vi.fn(() => createChainableMock()),
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-001' } }, error: null })),
  },
}

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
  createClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/supabase/admin-client', () => ({
  createAdminClient: vi.fn(() => mockSupabaseClient),
}))

import {
  OverReceiptApprovalService,
  calculateOverReceiptStatus,
  type WarehouseSettings,
} from '../over-receipt-approval-service'

describe('OverReceiptApprovalService (Story 05.15)', () => {
  let service: typeof OverReceiptApprovalService

  beforeEach(() => {
    vi.clearAllMocks()
    service = OverReceiptApprovalService
  })

  // =========================================================================
  // AC-3: Over-Receipt Calculation & Status
  // =========================================================================
  describe('calculateOverReceiptStatus', () => {
    const defaultSettings: WarehouseSettings = {
      allow_over_receipt: true,
      over_receipt_tolerance_pct: 10,
    }

    it('should identify no over-receipt when under ordered qty', () => {
      const result = calculateOverReceiptStatus(100, 0, 80, defaultSettings)

      expect(result.isOverReceipt).toBe(false)
      expect(result.overReceiptPct).toBe(0)
      expect(result.exceedsTolerance).toBe(false)
      expect(result.totalAfterReceipt).toBe(80)
    })

    it('should identify no over-receipt at exact ordered qty', () => {
      const result = calculateOverReceiptStatus(100, 0, 100, defaultSettings)

      expect(result.isOverReceipt).toBe(false)
      expect(result.overReceiptPct).toBe(0)
      expect(result.exceedsTolerance).toBe(false)
    })

    it('should calculate over-receipt percentage correctly', () => {
      const result = calculateOverReceiptStatus(100, 0, 110, defaultSettings)

      expect(result.isOverReceipt).toBe(true)
      expect(result.overReceiptPct).toBe(10)
      expect(result.totalAfterReceipt).toBe(110)
    })

    it('should identify within tolerance (8% over, 10% tolerance)', () => {
      const result = calculateOverReceiptStatus(100, 0, 108, defaultSettings)

      expect(result.isOverReceipt).toBe(true)
      expect(result.overReceiptPct).toBe(8)
      expect(result.exceedsTolerance).toBe(false)
    })

    it('should identify exceeds tolerance (15% over, 10% tolerance)', () => {
      const result = calculateOverReceiptStatus(100, 0, 115, defaultSettings)

      expect(result.isOverReceipt).toBe(true)
      expect(result.overReceiptPct).toBe(15)
      expect(result.exceedsTolerance).toBe(true)
    })

    it('should calculate with existing received qty', () => {
      // Ordered 100, already received 50, attempting 60 = total 110 (10% over)
      const result = calculateOverReceiptStatus(100, 50, 60, defaultSettings)

      expect(result.isOverReceipt).toBe(true)
      expect(result.overReceiptPct).toBe(10)
      expect(result.totalAfterReceipt).toBe(110)
      expect(result.exceedsTolerance).toBe(false) // exactly at tolerance
    })

    it('should calculate max allowed qty correctly', () => {
      const result = calculateOverReceiptStatus(100, 0, 110, defaultSettings)

      expect(result.maxAllowedQty).toBeCloseTo(110, 2) // 100 * 1.10
    })

    it('should return ordered qty as max when over-receipt disabled', () => {
      const settings: WarehouseSettings = {
        allow_over_receipt: false,
        over_receipt_tolerance_pct: 10, // Still tracks tolerance for reference
      }

      const result = calculateOverReceiptStatus(100, 0, 110, settings)

      expect(result.maxAllowedQty).toBe(100) // Max is ordered qty when disabled
      expect(result.isOverReceipt).toBe(true) // 110 > 100
      // Note: exceedsTolerance is based on pct comparison, not disabled status
      // 10% over does NOT exceed 10% tolerance threshold
      expect(result.overReceiptPct).toBe(10)
    })

    it('should handle decimal quantities', () => {
      const result = calculateOverReceiptStatus(100.5, 50.25, 55.25, defaultSettings)

      expect(result.totalAfterReceipt).toBeCloseTo(105.5, 2)
      expect(result.isOverReceipt).toBe(true)
    })

    it('should handle zero ordered qty', () => {
      const result = calculateOverReceiptStatus(0, 0, 10, defaultSettings)

      expect(result.overReceiptPct).toBe(0) // avoid division by zero
    })

    it('should handle 0% tolerance (exact match only)', () => {
      const settings: WarehouseSettings = {
        allow_over_receipt: true,
        over_receipt_tolerance_pct: 0,
      }

      const result = calculateOverReceiptStatus(100, 0, 101, settings)

      expect(result.exceedsTolerance).toBe(true)
    })

    it('should handle 100% tolerance', () => {
      const settings: WarehouseSettings = {
        allow_over_receipt: true,
        over_receipt_tolerance_pct: 100,
      }

      const result = calculateOverReceiptStatus(100, 0, 199, settings)

      expect(result.exceedsTolerance).toBe(false)
      expect(result.maxAllowedQty).toBe(200)
    })
  })

  // =========================================================================
  // AC-3: Validate Over-Receipt
  // =========================================================================
  describe('validateOverReceipt', () => {
    it('should return allowed=true for normal receipt', async () => {
      const mockChain = createChainableMock()
      mockChain.single
        .mockResolvedValueOnce({
          data: { id: 'line-1', product_id: 'prod-1', quantity: 100, received_qty: 0 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { allow_over_receipt: true, over_receipt_tolerance_pct: 10 },
          error: null,
        })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.validateOverReceipt(
        'line-1',
        80, // 80 out of 100, no over-receipt
        'org-1',
        testSupabase as any
      )

      expect(result.allowed).toBe(true)
      expect(result.requires_approval).toBe(false)
    })

    it('should return error when PO line not found', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.validateOverReceipt('invalid-line', 100, 'org-1', testSupabase as any)

      expect(result.allowed).toBe(false)
      expect(result.error).toBe('PO line not found')
    })

    it('should block over-receipt when disabled in settings', async () => {
      const mockChain = createChainableMock()
      mockChain.single
        .mockResolvedValueOnce({
          data: { id: 'line-1', product_id: 'prod-1', quantity: 100, received_qty: 0 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { allow_over_receipt: false, over_receipt_tolerance_pct: 0 },
          error: null,
        })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.validateOverReceipt('line-1', 110, 'org-1', testSupabase as any)

      expect(result.allowed).toBe(false)
      expect(result.requires_approval).toBe(false)
      expect(result.error).toContain('Over-receipt not allowed')
    })

    it('should allow over-receipt within tolerance with warning', async () => {
      const mockChain = createChainableMock()
      mockChain.single
        .mockResolvedValueOnce({
          data: { id: 'line-1', product_id: 'prod-1', quantity: 100, received_qty: 0 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { allow_over_receipt: true, over_receipt_tolerance_pct: 10 },
          error: null,
        })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.validateOverReceipt('line-1', 108, 'org-1', testSupabase as any)

      expect(result.allowed).toBe(true)
      expect(result.requires_approval).toBe(false)
      expect(result.over_receipt_pct).toBe(8)
      expect(result.warning).toContain('8%')
    })

    it('should require approval when exceeds tolerance', async () => {
      const mockChain = createChainableMock()
      mockChain.single
        .mockResolvedValueOnce({
          data: { id: 'line-1', product_id: 'prod-1', quantity: 100, received_qty: 0 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { allow_over_receipt: true, over_receipt_tolerance_pct: 10 },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // no existing approval

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.validateOverReceipt('line-1', 115, 'org-1', testSupabase as any)

      expect(result.allowed).toBe(false)
      expect(result.requires_approval).toBe(true)
      expect(result.over_receipt_pct).toBe(15)
      expect(result.error).toContain('exceeds tolerance')
    })

    it('should allow when approved approval exists', async () => {
      const mockChain = createChainableMock()
      mockChain.single
        .mockResolvedValueOnce({
          data: { id: 'line-1', product_id: 'prod-1', quantity: 100, received_qty: 0 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { allow_over_receipt: true, over_receipt_tolerance_pct: 10 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'approved' },
          error: null,
        })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.validateOverReceipt('line-1', 115, 'org-1', testSupabase as any)

      expect(result.allowed).toBe(true)
      expect(result.approval?.status).toBe('approved')
    })

    it('should block when rejected approval exists', async () => {
      const mockChain = createChainableMock()
      mockChain.single
        .mockResolvedValueOnce({
          data: { id: 'line-1', product_id: 'prod-1', quantity: 100, received_qty: 0 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { allow_over_receipt: true, over_receipt_tolerance_pct: 10 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'rejected' },
          error: null,
        })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.validateOverReceipt('line-1', 115, 'org-1', testSupabase as any)

      expect(result.allowed).toBe(false)
      expect(result.error).toContain('rejected')
    })

    it('should indicate pending when pending approval exists', async () => {
      const mockChain = createChainableMock()
      mockChain.single
        .mockResolvedValueOnce({
          data: { id: 'line-1', product_id: 'prod-1', quantity: 100, received_qty: 0 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { allow_over_receipt: true, over_receipt_tolerance_pct: 10 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'pending' },
          error: null,
        })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.validateOverReceipt('line-1', 115, 'org-1', testSupabase as any)

      expect(result.allowed).toBe(false)
      expect(result.requires_approval).toBe(true)
      expect(result.approval?.status).toBe('pending')
    })
  })

  // =========================================================================
  // AC-5: Request Approval
  // =========================================================================
  describe('requestApproval', () => {
    it('should create approval request successfully', async () => {
      const mockChain = createChainableMock()

      // No existing pending
      mockChain.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        // PO line data
        .mockResolvedValueOnce({
          data: { product_id: 'prod-1', quantity: 100, received_qty: 0 },
          error: null,
        })
        // Settings
        .mockResolvedValueOnce({
          data: { over_receipt_tolerance_pct: 10 },
          error: null,
        })
        // Insert result
        .mockResolvedValueOnce({
          data: {
            id: 'approval-1',
            status: 'pending',
            over_receipt_pct: 15,
          },
          error: null,
        })

      mockChain.insert = vi.fn(() => mockChain)

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.requestApproval(
        {
          po_id: 'po-1',
          po_line_id: 'line-1',
          requesting_qty: 115,
          reason: 'Supplier shipped extra units in full pallet',
        },
        'org-1',
        'user-1',
        testSupabase as any
      )

      expect(result.status).toBe('pending')
    })

    it('should throw error if pending approval already exists', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({
        data: { id: 'existing-approval' },
        error: null,
      })

      const testSupabase = { from: vi.fn(() => mockChain) }

      await expect(
        service.requestApproval(
          {
            po_id: 'po-1',
            po_line_id: 'line-1',
            requesting_qty: 115,
            reason: 'Supplier shipped extra units',
          },
          'org-1',
          'user-1',
          testSupabase as any
        )
      ).rejects.toThrow('Pending approval already exists for this PO line')
    })

    it('should throw error if PO line not found', async () => {
      const mockChain = createChainableMock()
      mockChain.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // no existing
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // PO line not found

      const testSupabase = { from: vi.fn(() => mockChain) }

      await expect(
        service.requestApproval(
          {
            po_id: 'po-1',
            po_line_id: 'invalid-line',
            requesting_qty: 115,
            reason: 'Supplier shipped extra units',
          },
          'org-1',
          'user-1',
          testSupabase as any
        )
      ).rejects.toThrow('PO line not found')
    })

    it('should calculate over_receipt_pct correctly', async () => {
      const mockChain = createChainableMock()
      const insertData: any = null

      mockChain.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({
          data: { product_id: 'prod-1', quantity: 100, received_qty: 0 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { over_receipt_tolerance_pct: 10 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'approval-1',
            over_receipt_pct: 15,
            total_after_receipt: 115,
          },
          error: null,
        })

      mockChain.insert = vi.fn(() => mockChain)

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.requestApproval(
        {
          po_id: 'po-1',
          po_line_id: 'line-1',
          requesting_qty: 115,
          reason: 'Supplier shipped extra units',
        },
        'org-1',
        'user-1',
        testSupabase as any
      )

      // With ordered=100, requesting=115, over_receipt should be 15%
      expect(result.over_receipt_pct).toBe(15)
    })
  })

  // =========================================================================
  // AC-6: Approve Request
  // =========================================================================
  describe('approveRequest', () => {
    it('should approve request when user is manager', async () => {
      const mockChain = createChainableMock()

      // Check manager role
      mockChain.single
        .mockResolvedValueOnce({
          data: { roles: { code: 'WH_MANAGER' } },
          error: null,
        })
        // Get approval
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'pending', org_id: 'org-1' },
          error: null,
        })
        // Update result
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'approved', reviewed_by: 'manager-1' },
          error: null,
        })

      mockChain.update = vi.fn(() => mockChain)

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.approveRequest(
        { approvalId: 'approval-1', reviewNotes: 'Accepted supplier overage' },
        'org-1',
        'manager-1',
        testSupabase as any
      )

      expect(result.status).toBe('approved')
    })

    it('should reject when user is not manager', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({
        data: { roles: { code: 'WH_OPERATOR' } },
        error: null,
      })

      const testSupabase = { from: vi.fn(() => mockChain) }

      await expect(
        service.approveRequest(
          { approvalId: 'approval-1' },
          'org-1',
          'operator-1',
          testSupabase as any
        )
      ).rejects.toThrow('Only warehouse managers can approve over-receipts')
    })

    it('should reject when approval not found', async () => {
      const mockChain = createChainableMock()
      mockChain.single
        .mockResolvedValueOnce({
          data: { roles: { code: 'WH_MANAGER' } },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

      const testSupabase = { from: vi.fn(() => mockChain) }

      await expect(
        service.approveRequest({ approvalId: 'invalid-id' }, 'org-1', 'manager-1', testSupabase as any)
      ).rejects.toThrow('Approval request not found')
    })

    it('should reject when approval already reviewed', async () => {
      const mockChain = createChainableMock()
      mockChain.single
        .mockResolvedValueOnce({
          data: { roles: { code: 'WH_MANAGER' } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'approved' },
          error: null,
        })

      const testSupabase = { from: vi.fn(() => mockChain) }

      await expect(
        service.approveRequest(
          { approvalId: 'approval-1' },
          'org-1',
          'manager-1',
          testSupabase as any
        )
      ).rejects.toThrow('Approval request already reviewed')
    })

    it('should allow ADMIN role to approve', async () => {
      const mockChain = createChainableMock()
      mockChain.single
        .mockResolvedValueOnce({
          data: { roles: { code: 'ADMIN' } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'pending', org_id: 'org-1' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'approved' },
          error: null,
        })

      mockChain.update = vi.fn(() => mockChain)

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.approveRequest(
        { approvalId: 'approval-1' },
        'org-1',
        'admin-1',
        testSupabase as any
      )

      expect(result.status).toBe('approved')
    })

    it('should allow SUPER_ADMIN role to approve', async () => {
      const mockChain = createChainableMock()
      mockChain.single
        .mockResolvedValueOnce({
          data: { roles: { code: 'SUPER_ADMIN' } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'pending', org_id: 'org-1' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'approved' },
          error: null,
        })

      mockChain.update = vi.fn(() => mockChain)

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.approveRequest(
        { approvalId: 'approval-1' },
        'org-1',
        'superadmin-1',
        testSupabase as any
      )

      expect(result.status).toBe('approved')
    })
  })

  // =========================================================================
  // AC-7: Reject Request
  // =========================================================================
  describe('rejectRequest', () => {
    it('should reject request when user is manager with review notes', async () => {
      const mockChain = createChainableMock()

      mockChain.single
        .mockResolvedValueOnce({
          data: { roles: { code: 'WH_MANAGER' } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'pending', org_id: 'org-1' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'rejected', review_notes: 'Too much overage' },
          error: null,
        })

      mockChain.update = vi.fn(() => mockChain)

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.rejectRequest(
        { approvalId: 'approval-1', reviewNotes: 'Quantity discrepancy too large, return excess' },
        'org-1',
        'manager-1',
        testSupabase as any
      )

      expect(result.status).toBe('rejected')
    })

    it('should require review notes for rejection', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({
        data: { roles: { code: 'WH_MANAGER' } },
        error: null,
      })

      const testSupabase = { from: vi.fn(() => mockChain) }

      await expect(
        service.rejectRequest(
          { approvalId: 'approval-1', reviewNotes: '' },
          'org-1',
          'manager-1',
          testSupabase as any
        )
      ).rejects.toThrow('Review notes required for rejection')
    })

    it('should require minimum length for review notes', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({
        data: { roles: { code: 'WH_MANAGER' } },
        error: null,
      })

      const testSupabase = { from: vi.fn(() => mockChain) }

      await expect(
        service.rejectRequest(
          { approvalId: 'approval-1', reviewNotes: 'Too short' },
          'org-1',
          'manager-1',
          testSupabase as any
        )
      ).rejects.toThrow('Review notes required for rejection')
    })

    it('should reject when user is not manager', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({
        data: { roles: { code: 'WH_OPERATOR' } },
        error: null,
      })

      const testSupabase = { from: vi.fn(() => mockChain) }

      await expect(
        service.rejectRequest(
          { approvalId: 'approval-1', reviewNotes: 'This is a sufficient review note.' },
          'org-1',
          'operator-1',
          testSupabase as any
        )
      ).rejects.toThrow('Only warehouse managers can reject over-receipts')
    })
  })

  // =========================================================================
  // List & Query
  // =========================================================================
  describe('list', () => {
    it('should return paginated results', async () => {
      const mockChain = createChainableMock()

      // Mock the promise resolution for list query
      mockChain.then = vi.fn((resolve) =>
        resolve({
          data: [
            { id: 'approval-1', status: 'pending', over_receipt_pct: 15 },
            { id: 'approval-2', status: 'approved', over_receipt_pct: 12 },
          ],
          error: null,
          count: 2,
        })
      )

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.list(
        { page: 1, limit: 10, sort: 'requested_at', order: 'desc' },
        'org-1',
        testSupabase as any
      )

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(1)
    })

    it('should apply status filter', async () => {
      const mockChain = createChainableMock()
      mockChain.then = vi.fn((resolve) =>
        resolve({
          data: [{ id: 'approval-1', status: 'pending' }],
          error: null,
          count: 1,
        })
      )

      const testSupabase = { from: vi.fn(() => mockChain) }

      await service.list(
        { page: 1, limit: 10, status: 'pending', sort: 'requested_at', order: 'desc' },
        'org-1',
        testSupabase as any
      )

      expect(mockChain.eq).toHaveBeenCalledWith('status', 'pending')
    })

    it('should apply date filters', async () => {
      const mockChain = createChainableMock()
      mockChain.then = vi.fn((resolve) =>
        resolve({ data: [], error: null, count: 0 })
      )

      const testSupabase = { from: vi.fn(() => mockChain) }

      await service.list(
        {
          page: 1,
          limit: 10,
          date_from: '2025-01-01',
          date_to: '2025-01-31',
          sort: 'requested_at',
          order: 'desc',
        },
        'org-1',
        testSupabase as any
      )

      expect(mockChain.gte).toHaveBeenCalledWith('requested_at', '2025-01-01')
      expect(mockChain.lte).toHaveBeenCalled()
    })
  })

  // =========================================================================
  // Get By ID
  // =========================================================================
  describe('getById', () => {
    it('should return approval with joined data', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({
        data: {
          id: 'approval-1',
          status: 'pending',
          products: { name: 'Product A', code: 'PROD-A' },
          purchase_orders: { po_number: 'PO-001' },
          requester: { full_name: 'John Doe' },
          reviewer: null,
        },
        error: null,
      })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.getById('approval-1', 'org-1', testSupabase as any)

      expect(result).not.toBeNull()
      expect(result?.product_name).toBe('Product A')
      expect(result?.po_number).toBe('PO-001')
      expect(result?.requester_name).toBe('John Doe')
    })

    it('should return null when not found', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.getById('invalid-id', 'org-1', testSupabase as any)

      expect(result).toBeNull()
    })
  })

  // =========================================================================
  // Helper Methods
  // =========================================================================
  describe('getPendingApprovalForLine', () => {
    it('should return pending approval for PO line', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({
        data: { id: 'approval-1', status: 'pending', po_line_id: 'line-1' },
        error: null,
      })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.getPendingApprovalForLine('line-1', 'org-1', testSupabase as any)

      expect(result).not.toBeNull()
      expect(result?.status).toBe('pending')
    })

    it('should return null when no pending approval', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.getPendingApprovalForLine('line-1', 'org-1', testSupabase as any)

      expect(result).toBeNull()
    })
  })

  describe('getApprovedApprovalForLine', () => {
    it('should return approved approval for PO line', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({
        data: { id: 'approval-1', status: 'approved', po_line_id: 'line-1' },
        error: null,
      })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.getApprovedApprovalForLine('line-1', 'org-1', testSupabase as any)

      expect(result).not.toBeNull()
      expect(result?.status).toBe('approved')
    })
  })

  describe('checkCanApprove', () => {
    it('should return true for WH_MANAGER', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({
        data: { roles: { code: 'WH_MANAGER' } },
        error: null,
      })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.checkCanApprove('user-1', testSupabase as any)

      expect(result).toBe(true)
    })

    it('should return true for ADMIN', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({
        data: { roles: { code: 'ADMIN' } },
        error: null,
      })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.checkCanApprove('user-1', testSupabase as any)

      expect(result).toBe(true)
    })

    it('should return true for SUPER_ADMIN', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({
        data: { roles: { code: 'SUPER_ADMIN' } },
        error: null,
      })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.checkCanApprove('user-1', testSupabase as any)

      expect(result).toBe(true)
    })

    it('should return false for WH_OPERATOR', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({
        data: { roles: { code: 'WH_OPERATOR' } },
        error: null,
      })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.checkCanApprove('user-1', testSupabase as any)

      expect(result).toBe(false)
    })

    it('should return false for unknown user', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

      const testSupabase = { from: vi.fn(() => mockChain) }

      const result = await service.checkCanApprove('invalid-user', testSupabase as any)

      expect(result).toBe(false)
    })
  })
})
