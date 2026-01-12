/**
 * GRN from TO Service - Unit Tests (Story 05.12)
 * Purpose: Test GRN creation from Transfer Order with LP generation
 * Phase: RED - Tests will fail until service is implemented
 *
 * Tests the GRN from TO workflow which handles:
 * - TO status validation (shipped/partial only)
 * - Destination warehouse validation
 * - Variance tracking (shipped vs received qty)
 * - Batch/expiry requirement enforcement
 * - LP creation per GRN item
 * - TO line received_qty updates
 * - TO status transitions (shipped -> partial -> received)
 * - Atomic transaction (GRN + items + LPs)
 *
 * Coverage Target: 80%+
 * Test Count: 45-55 scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-1: Create GRN from TO - Happy Path
 * - AC-2: Partial Receipt of TO
 * - AC-3: TO Status Validation
 * - AC-4: Variance Tracking
 * - AC-5: Transit Location Handling (future)
 * - AC-6: Warehouse Destination Validation
 * - AC-7: Batch Required Validation
 * - AC-8: Expiry Required Validation
 * - AC-9: LP Creation Details
 * - AC-11: RLS Policy Enforcement
 * - AC-12: Transaction Atomicity
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

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
    range: vi.fn(() => chain),
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
  GRNFromTOService,
  type CreateGRNFromTOInput,
  type TOForReceipt,
  type TOLineForReceipt,
  type GRNValidationResult,
  type VarianceCalculation,
} from '../grn-to-service'

describe('GRNFromTOService (Story 05.12)', () => {
  let service: typeof GRNFromTOService

  beforeEach(() => {
    vi.clearAllMocks()
    service = GRNFromTOService
  })

  // =========================================================================
  // AC-3: TO Status Validation
  // =========================================================================
  describe('validateTOForReceipt', () => {
    it('should allow receipt from shipped TO', async () => {
      const result = await service.validateTOForReceipt('shipped')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should allow receipt from partial TO', async () => {
      const result = await service.validateTOForReceipt('partial')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should block receipt from draft TO', async () => {
      const result = await service.validateTOForReceipt('draft')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        "Cannot receive from TO with status 'draft'. TO must be shipped or partial."
      )
    })

    it('should block receipt from planned TO', async () => {
      const result = await service.validateTOForReceipt('planned')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        "Cannot receive from TO with status 'planned'. TO must be shipped or partial."
      )
    })

    it('should block receipt from cancelled TO', async () => {
      const result = await service.validateTOForReceipt('cancelled')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Cannot receive from cancelled TO')
    })

    it('should block receipt from received TO', async () => {
      const result = await service.validateTOForReceipt('received')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('TO is already fully received - no more receipts allowed')
    })

    it('should block receipt from closed TO', async () => {
      const result = await service.validateTOForReceipt('closed')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('TO is already closed - no more receipts allowed')
    })
  })

  // =========================================================================
  // AC-6: Warehouse Destination Validation
  // =========================================================================
  describe('validateDestinationWarehouse', () => {
    it('should allow receipt at correct destination warehouse', async () => {
      const to = {
        from_warehouse_id: 'wh-001',
        to_warehouse_id: 'wh-002',
      }
      const result = await service.validateDestinationWarehouse('wh-002', to)
      expect(result.valid).toBe(true)
    })

    it('should block receipt at source warehouse', async () => {
      const to = {
        from_warehouse_id: 'wh-001',
        to_warehouse_id: 'wh-002',
      }
      const result = await service.validateDestinationWarehouse('wh-001', to)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Receipt must occur at destination warehouse')
    })

    it('should block receipt at wrong warehouse', async () => {
      const to = {
        from_warehouse_id: 'wh-001',
        to_warehouse_id: 'wh-002',
      }
      const result = await service.validateDestinationWarehouse('wh-003', to)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Receipt must occur at destination warehouse')
    })
  })

  // =========================================================================
  // AC-4: Variance Calculation
  // =========================================================================
  describe('calculateVariance', () => {
    it('should calculate exact receipt correctly (no variance)', async () => {
      const result = await service.calculateVariance(100, 0, 100)

      expect(result).toEqual({
        shippedQty: 100,
        alreadyReceivedQty: 0,
        attemptingQty: 100,
        remainingQty: 100,
        varianceQty: 0,
        variancePct: 0,
        isShortage: false,
        isOverage: false,
      })
    })

    it('should calculate shortage correctly', async () => {
      const result = await service.calculateVariance(100, 0, 95)

      expect(result).toEqual({
        shippedQty: 100,
        alreadyReceivedQty: 0,
        attemptingQty: 95,
        remainingQty: 100,
        varianceQty: -5,
        variancePct: -5,
        isShortage: true,
        isOverage: false,
      })
    })

    it('should calculate overage correctly', async () => {
      const result = await service.calculateVariance(100, 0, 105)

      expect(result).toEqual({
        shippedQty: 100,
        alreadyReceivedQty: 0,
        attemptingQty: 105,
        remainingQty: 100,
        varianceQty: 5,
        variancePct: 5,
        isShortage: false,
        isOverage: true,
      })
    })

    it('should calculate partial receipt variance', async () => {
      const result = await service.calculateVariance(100, 50, 40)
      // Remaining = 100 - 50 = 50
      // Attempting = 40, variance = 40 - 50 = -10

      expect(result.remainingQty).toBe(50)
      expect(result.varianceQty).toBe(-10)
      expect(result.isShortage).toBe(true)
    })

    it('should handle decimal quantities correctly', async () => {
      const result = await service.calculateVariance(100.5, 50.25, 50.25)

      expect(result.remainingQty).toBeCloseTo(50.25, 2)
      expect(result.varianceQty).toBeCloseTo(0, 2)
      expect(result.isShortage).toBe(false)
      expect(result.isOverage).toBe(false)
    })
  })

  // =========================================================================
  // AC-4: Variance Validation
  // =========================================================================
  describe('validateReceiptQty', () => {
    it('should block receiving more than shipped total', async () => {
      const result = await service.validateReceiptQty(
        100, // shipped
        80, // already received
        30 // attempting (would make 110 total)
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Cannot receive more than shipped quantity. Shipped: 100, Already received: 80, Attempting: 30'
      )
    })

    it('should allow receiving exactly remaining', async () => {
      const result = await service.validateReceiptQty(
        100, // shipped
        50, // already received
        50 // attempting (exactly remaining)
      )

      expect(result.valid).toBe(true)
    })

    it('should allow receiving less than remaining', async () => {
      const result = await service.validateReceiptQty(
        100, // shipped
        50, // already received
        30 // attempting (less than remaining 50)
      )

      expect(result.valid).toBe(true)
    })

    it('should require variance reason when qty differs from remaining', async () => {
      const result = await service.validateVarianceReason(
        100, // shipped
        0, // already received
        95, // attempting (shortage of 5)
        undefined // no reason provided
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Variance reason required when received qty differs from shipped')
    })

    it('should allow missing variance reason for exact receipt', async () => {
      const result = await service.validateVarianceReason(
        100, // shipped
        0, // already received
        100, // attempting (exact match)
        undefined // no reason needed
      )

      expect(result.valid).toBe(true)
    })
  })

  // =========================================================================
  // AC-7: Batch Required Validation
  // =========================================================================
  describe('validateBatchRequired', () => {
    it('should return error when batch required but missing', async () => {
      const settings = { require_batch_on_receipt: true }
      const items = [
        { to_line_id: 'line-1', received_qty: 100 }, // no batch_number
      ]

      const result = await service.validateBatchRequired(items, settings)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Batch number required for receipt (line 1)')
    })

    it('should allow missing batch when setting disabled', async () => {
      const settings = { require_batch_on_receipt: false }
      const items = [
        { to_line_id: 'line-1', received_qty: 100 },
      ]

      const result = await service.validateBatchRequired(items, settings)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should pass when batch provided and required', async () => {
      const settings = { require_batch_on_receipt: true }
      const items = [
        { to_line_id: 'line-1', received_qty: 100, batch_number: 'BATCH-001' },
      ]

      const result = await service.validateBatchRequired(items, settings)

      expect(result.valid).toBe(true)
    })

    it('should validate multiple items', async () => {
      const settings = { require_batch_on_receipt: true }
      const items = [
        { to_line_id: 'line-1', received_qty: 100, batch_number: 'BATCH-001' },
        { to_line_id: 'line-2', received_qty: 50 }, // missing
        { to_line_id: 'line-3', received_qty: 75, batch_number: 'BATCH-003' },
      ]

      const result = await service.validateBatchRequired(items, settings)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Batch number required for receipt (line 2)')
    })
  })

  // =========================================================================
  // AC-8: Expiry Required Validation
  // =========================================================================
  describe('validateExpiryRequired', () => {
    it('should return error when expiry required but missing', async () => {
      const settings = { require_expiry_on_receipt: true }
      const items = [
        { to_line_id: 'line-1', received_qty: 100 },
      ]

      const result = await service.validateExpiryRequired(items, settings)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Expiry date required for receipt (line 1)')
    })

    it('should allow missing expiry when setting disabled', async () => {
      const settings = { require_expiry_on_receipt: false }
      const items = [
        { to_line_id: 'line-1', received_qty: 100 },
      ]

      const result = await service.validateExpiryRequired(items, settings)

      expect(result.valid).toBe(true)
    })

    it('should pass when expiry provided and required', async () => {
      const settings = { require_expiry_on_receipt: true }
      const items = [
        { to_line_id: 'line-1', received_qty: 100, expiry_date: '2026-12-31' },
      ]

      const result = await service.validateExpiryRequired(items, settings)

      expect(result.valid).toBe(true)
    })
  })

  // =========================================================================
  // AC-9: LP Creation Details
  // =========================================================================
  describe('buildLPInputFromGRNItem', () => {
    it('should create LP with correct values from GRN item', async () => {
      const grnItem = {
        product_id: 'prod-001',
        received_qty: 500,
        uom: 'KG',
        batch_number: 'BATCH-001',
        expiry_date: '2026-06-01',
        location_id: 'loc-001',
        warehouse_id: 'wh-001',
      }

      const grnData = {
        grn_id: 'grn-001',
        to_number: 'TO-2025-00001',
      }

      const lpInput = service.buildLPInputFromGRNItem(grnItem, grnData)

      expect(lpInput).toEqual({
        product_id: 'prod-001',
        quantity: 500,
        uom: 'KG',
        batch_number: 'BATCH-001',
        expiry_date: '2026-06-01',
        location_id: 'loc-001',
        warehouse_id: 'wh-001',
        source: 'receipt',
        grn_id: 'grn-001',
      })
    })

    it('should handle null batch and expiry', async () => {
      const grnItem = {
        product_id: 'prod-001',
        received_qty: 100,
        uom: 'KG',
        location_id: 'loc-001',
        warehouse_id: 'wh-001',
      }

      const grnData = { grn_id: 'grn-001', to_number: 'TO-001' }

      const lpInput = service.buildLPInputFromGRNItem(grnItem, grnData)

      expect(lpInput.batch_number).toBeUndefined()
      expect(lpInput.expiry_date).toBeUndefined()
    })

    it('should include supplier batch number when provided', async () => {
      const grnItem = {
        product_id: 'prod-001',
        received_qty: 100,
        uom: 'KG',
        batch_number: 'INT-001',
        supplier_batch_number: 'SRC-BATCH-999',
        location_id: 'loc-001',
        warehouse_id: 'wh-001',
      }

      const grnData = { grn_id: 'grn-001', to_number: 'TO-001' }

      const lpInput = service.buildLPInputFromGRNItem(grnItem, grnData)

      expect(lpInput.supplier_batch_number).toBe('SRC-BATCH-999')
    })
  })

  // =========================================================================
  // AC-2: TO Status Calculation (Partial vs Received)
  // =========================================================================
  describe('calculateTOStatusFromLines', () => {
    it('should return partial when some lines incomplete', async () => {
      const toLines = [
        { shipped_qty: 100, received_qty: 100 }, // complete
        { shipped_qty: 50, received_qty: 30 }, // partial
        { shipped_qty: 200, received_qty: 0 }, // pending
      ]

      const newStatus = service.calculateTOStatusFromLines(toLines)

      expect(newStatus).toBe('partial')
    })

    it('should return received when all lines complete', async () => {
      const toLines = [
        { shipped_qty: 100, received_qty: 100 },
        { shipped_qty: 50, received_qty: 50 },
        { shipped_qty: 200, received_qty: 200 },
      ]

      const newStatus = service.calculateTOStatusFromLines(toLines)

      expect(newStatus).toBe('received')
    })

    it('should return partial when all lines have partial receipt', async () => {
      const toLines = [
        { shipped_qty: 100, received_qty: 50 },
        { shipped_qty: 50, received_qty: 25 },
      ]

      const newStatus = service.calculateTOStatusFromLines(toLines)

      expect(newStatus).toBe('partial')
    })

    it('should handle zero shipped lines', async () => {
      const toLines = [
        { shipped_qty: 0, received_qty: 0 },
        { shipped_qty: 100, received_qty: 100 },
      ]

      const newStatus = service.calculateTOStatusFromLines(toLines)

      // Zero shipped lines shouldn't block full received status
      expect(newStatus).toBe('received')
    })
  })

  // =========================================================================
  // AC-15: QA Status on Receipt
  // =========================================================================
  describe('QA status on receipt', () => {
    it('should set QA status from warehouse settings when QA required', () => {
      const settings = { require_qa_on_receipt: true, default_qa_status: 'pending' }
      const qaStatus = service.getDefaultQAStatus(settings)
      expect(qaStatus).toBe('pending')
    })

    it('should set QA status to passed when QA not required', () => {
      const settings = { require_qa_on_receipt: false, default_qa_status: 'pending' }
      const qaStatus = service.getDefaultQAStatus(settings)
      expect(qaStatus).toBe('passed')
    })

    it('should use quarantine status when configured', () => {
      const settings = { require_qa_on_receipt: true, default_qa_status: 'quarantine' }
      const qaStatus = service.getDefaultQAStatus(settings)
      expect(qaStatus).toBe('quarantine')
    })
  })

  // =========================================================================
  // AC-11: RLS Policy Enforcement
  // =========================================================================
  describe('org isolation', () => {
    it('should throw when TO not found (RLS filtered)', async () => {
      const mockChain = createChainableMock()
      mockChain.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

      const testSupabase = {
        from: vi.fn(() => mockChain),
      }

      await expect(
        service.getTOForReceipt('to-from-other-org', 'org-A', testSupabase as any)
      ).rejects.toThrow('Transfer order not found')
    })
  })

  // =========================================================================
  // Input Validation
  // =========================================================================
  describe('input validation', () => {
    it('should require at least one item', async () => {
      const input: CreateGRNFromTOInput = {
        to_id: 'to-001',
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
        items: [],
      }

      const result = await service.validateInput(input)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('At least one item required')
    })

    it('should validate received_qty is positive', async () => {
      const input: CreateGRNFromTOInput = {
        to_id: 'to-001',
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
        items: [{ to_line_id: 'line-1', received_qty: 0 }],
      }

      const result = await service.validateInput(input)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Received quantity must be positive (line 1)')
    })

    it('should validate UUID format for IDs', async () => {
      const input: CreateGRNFromTOInput = {
        to_id: 'invalid-uuid',
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
        items: [{ to_line_id: 'line-1', received_qty: 100 }],
      }

      const result = await service.validateInput(input)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid TO ID format')
    })

    it('should allow valid input', async () => {
      const input: CreateGRNFromTOInput = {
        to_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        warehouse_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        location_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        items: [
          {
            to_line_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            received_qty: 100,
            batch_number: 'BATCH-001',
            expiry_date: '2026-12-31',
          },
        ],
      }

      const result = await service.validateInput(input)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate expiry_date format', async () => {
      const input: CreateGRNFromTOInput = {
        to_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        warehouse_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        location_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        items: [
          {
            to_line_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            received_qty: 100,
            expiry_date: '31-12-2026', // invalid format
          },
        ],
      }

      const result = await service.validateInput(input)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid expiry date format (expected YYYY-MM-DD) (line 1)')
    })

    it('should validate variance_reason max length', async () => {
      const input: CreateGRNFromTOInput = {
        to_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        warehouse_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        location_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        items: [
          {
            to_line_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            received_qty: 100,
            variance_reason: 'x'.repeat(501), // exceeds 500 char limit
          },
        ],
      }

      const result = await service.validateInput(input)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Variance reason max 500 characters (line 1)')
    })
  })

  // =========================================================================
  // AC-12: Transaction Atomicity (Skipped - Integration)
  // =========================================================================
  describe('transaction atomicity', () => {
    it.skip('should rollback all changes on LP creation failure', async () => {
      // SKIPPED: Requires transaction mock setup
      // This test would verify that if LP creation fails:
      // - GRN is not created
      // - GRN items are not created
      // - TO lines are not updated
    })

    it.skip('should rollback all changes on TO line update failure', async () => {
      // SKIPPED: Requires transaction mock setup
    })
  })

  // =========================================================================
  // Support Operations
  // =========================================================================
  describe('getReceivableTOs', () => {
    it.skip('should return only TOs with receivable status', async () => {
      // SKIPPED: Complex mock chain
      // Should return TOs with status in ['shipped', 'partial']
    })
  })

  describe('getTOLinesForReceipt', () => {
    it.skip('should return TO lines with shipped and received quantities', async () => {
      // SKIPPED: Complex mock chain
      // Should include: shipped_qty, received_qty, remaining_qty
    })

    it.skip('should filter out fully received lines', async () => {
      // SKIPPED: Complex mock chain
    })
  })

  // =========================================================================
  // Performance Tests (AC-13)
  // =========================================================================
  describe('performance', () => {
    it.skip('should complete GRN creation in < 500ms for 10 lines', async () => {
      // SKIPPED: Performance test - verify manually or via benchmarks
    })
  })
})
