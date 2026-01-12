/**
 * ASN Service - Unit Tests (Story 05.8)
 * Purpose: Test ASNService business logic for ASN CRUD and workflow operations
 * Phase: RED - Tests will fail until service is implemented
 *
 * Tests the ASNService which handles:
 * - ASN CRUD operations (create, read, update, delete)
 * - ASN item management (add, update, delete items)
 * - ASN-to-PO linkage and auto-population
 * - ASN status lifecycle (pending -> partial -> received -> cancelled)
 * - ASN number auto-generation
 * - GRN pre-fill from ASN
 * - Expected Today dashboard widget
 *
 * Coverage Target: 80%+
 * Test Count: 30+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-3: Create ASN Header
 * - AC-4: ASN-to-PO Linkage and Auto-Population
 * - AC-5: ASN Item Management
 * - AC-6: ASN Status Lifecycle
 * - AC-9: GRN Pre-fill from ASN
 * - AC-11: ASN Edit and Delete
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

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

const mockSupabaseClient = {
  from: vi.fn(() => createChainableMock()),
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
}

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
  createClient: vi.fn(() => mockSupabaseClient),
}))

import {
  ASNService,
  type ASN,
  type ASNItem,
  type ASNWithDetails,
  type CreateASNInput,
  type UpdateASNInput,
  type CreateASNItemInput,
  type UpdateASNItemInput,
  type CreateASNFromPOInput,
  type ASNFilters,
} from '../asn-service'

describe('ASNService (Story 05.8)', () => {
  let mockSupabase: any
  let mockQuery: any
  let mockASNs: any[]
  let mockASNItems: any[]
  let service: typeof ASNService

  beforeEach(() => {
    vi.clearAllMocks()

    // Sample ASN data
    mockASNs = [
      {
        id: 'asn-001',
        org_id: 'org-123',
        asn_number: 'ASN-2025-00001',
        po_id: 'po-001',
        supplier_id: 'sup-001',
        expected_date: '2025-12-25',
        actual_date: null,
        carrier: 'FedEx',
        tracking_number: '1234567890',
        status: 'pending',
        notes: 'Test ASN',
        created_at: '2025-12-20T10:00:00Z',
        created_by: 'user-001',
        updated_at: '2025-12-20T10:00:00Z',
      },
      {
        id: 'asn-002',
        org_id: 'org-123',
        asn_number: 'ASN-2025-00002',
        po_id: 'po-002',
        supplier_id: 'sup-002',
        expected_date: '2025-12-26',
        actual_date: null,
        carrier: 'UPS',
        tracking_number: '0987654321',
        status: 'partial',
        notes: null,
        created_at: '2025-12-20T11:00:00Z',
        created_by: 'user-001',
        updated_at: '2025-12-20T11:00:00Z',
      },
    ]

    // Sample ASN items
    mockASNItems = [
      {
        id: 'item-001',
        asn_id: 'asn-001',
        product_id: 'prod-001',
        po_line_id: 'line-001',
        expected_qty: 100.0,
        received_qty: 0.0,
        uom: 'KG',
        supplier_lp_number: 'SUP-LP-001',
        supplier_batch_number: 'SUP-BATCH-001',
        gtin: '12345678901234',
        expiry_date: '2026-12-31',
        notes: null,
      },
      {
        id: 'item-002',
        asn_id: 'asn-001',
        product_id: 'prod-002',
        po_line_id: 'line-002',
        expected_qty: 50.0,
        received_qty: 0.0,
        uom: 'KG',
        supplier_lp_number: null,
        supplier_batch_number: null,
        gtin: null,
        expiry_date: null,
        notes: null,
      },
    ]

    // Mock query builder
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockASNs[0], error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn((resolve) => resolve({ data: null, error: null })),
    }

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQuery),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    service = ASNService
  })

  // ==========================================================================
  // ASN Number Generation (AC-3)
  // ==========================================================================
  describe('generateASNNumber', () => {
    it('should generate ASN number in ASN-YYYY-NNNNN format', async () => {
      const currentYear = new Date().getFullYear()
      mockQuery.maybeSingle.mockResolvedValueOnce({
        data: { asn_number: `ASN-${currentYear}-00005` },
        error: null,
      })

      const asnNumber = await ASNService.generateASNNumber(mockSupabase, 'org-123')

      expect(asnNumber).toMatch(/^ASN-\d{4}-\d{5}$/)
      expect(asnNumber).toBe(`ASN-${currentYear}-00006`)
    })

    it('should generate ASN-YYYY-00001 when no ASNs exist for year', async () => {
      mockQuery.maybeSingle.mockResolvedValueOnce({ data: null, error: null })

      const asnNumber = await ASNService.generateASNNumber(mockSupabase, 'org-123')

      expect(asnNumber).toMatch(/^ASN-\d{4}-00001$/)
    })

    it('should use current year in ASN number', async () => {
      mockQuery.maybeSingle.mockResolvedValueOnce({ data: null, error: null })

      const asnNumber = await ASNService.generateASNNumber(mockSupabase, 'org-123')
      const currentYear = new Date().getFullYear()

      expect(asnNumber).toContain(`ASN-${currentYear}`)
    })
  })

  // ==========================================================================
  // Create ASN (AC-3, AC-4)
  // ==========================================================================
  describe('createASN', () => {
    it('should create ASN with auto-generated number', async () => {
      const input: CreateASNInput = {
        po_id: 'po-001',
        expected_date: '2025-12-25',
        carrier: 'FedEx',
        tracking_number: '1234567890',
        notes: 'Test ASN',
        items: [
          {
            product_id: 'prod-001',
            expected_qty: 100,
            uom: 'KG',
          },
        ],
      }

      // Setup sequential mock responses
      // 1. PO lookup: select().eq().single()
      mockQuery.single.mockResolvedValueOnce({
        data: { org_id: 'org-123', supplier_id: 'sup-001', po_number: 'PO-001' },
        error: null,
      })

      // 2. ASN number generation: select().eq().ilike().order().limit().maybeSingle()
      mockQuery.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // 3. ASN creation: insert().select().single()
      mockQuery.single.mockResolvedValueOnce({
        data: mockASNs[0],
        error: null,
      })

      // 4. Items creation: insert().select() - uses .then()
      mockQuery.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: [{ ...mockASNItems[0], product_id: 'prod-001' }], error: null })
      )

      // 5. Supplier lookup: select().eq().single()
      mockQuery.single.mockResolvedValueOnce({
        data: { name: 'Test Supplier' },
        error: null,
      })

      const result = await ASNService.createASN(mockSupabase, input, 'user-001')

      expect(result.asn_number).toMatch(/^ASN-\d{4}-\d{5}$/)
      expect(result.status).toBe('pending')
      expect(mockSupabase.from).toHaveBeenCalledWith('asns')
    })

    it('should validate required po_id field', async () => {
      const input: any = {
        expected_date: '2025-12-25',
      }

      await expect(ASNService.createASN(mockSupabase, input, 'user-001')).rejects.toThrow()
    })

    it('should create ASN with items in atomic transaction', async () => {
      const input: CreateASNInput = {
        po_id: 'po-001',
        expected_date: '2025-12-25',
        items: [
          { product_id: 'prod-001', expected_qty: 100, uom: 'KG' },
          { product_id: 'prod-002', expected_qty: 50, uom: 'KG' },
        ],
      }

      // 1. PO lookup
      mockQuery.single.mockResolvedValueOnce({
        data: { org_id: 'org-123', supplier_id: 'sup-001', po_number: 'PO-001' },
        error: null,
      })

      // 2. ASN number generation
      mockQuery.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // 3. ASN creation
      mockQuery.single.mockResolvedValueOnce({
        data: mockASNs[0],
        error: null,
      })

      // 4. Items creation - uses .then()
      mockQuery.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: mockASNItems, error: null })
      )

      // 5. Supplier lookup
      mockQuery.single.mockResolvedValueOnce({
        data: { name: 'Test Supplier' },
        error: null,
      })

      await ASNService.createASN(mockSupabase, input, 'user-001')

      expect(mockSupabase.from).toHaveBeenCalledWith('asns')
      expect(mockSupabase.from).toHaveBeenCalledWith('asn_items')
    })
  })

  // ==========================================================================
  // Create ASN from PO (AC-4)
  // ==========================================================================
  describe('createASNFromPO', () => {
    it('should auto-populate items from PO lines', async () => {
      const poLines = [
        { id: 'line-001', product_id: 'prod-001', quantity: 100, received_qty: 20, uom: 'KG' },
        { id: 'line-002', product_id: 'prod-002', quantity: 50, received_qty: 0, uom: 'KG' },
      ]

      // 1. PO lines fetch: select().eq() - uses .then()
      mockQuery.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: poLines, error: null })
      )

      // 2. PO lookup (from createASN)
      mockQuery.single.mockResolvedValueOnce({
        data: { org_id: 'org-123', supplier_id: 'sup-001', po_number: 'PO-001' },
        error: null,
      })

      // 3. ASN number generation
      mockQuery.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // 4. ASN creation
      mockQuery.single.mockResolvedValueOnce({
        data: mockASNs[0],
        error: null,
      })

      // 5. Items creation - uses .then()
      mockQuery.then.mockImplementationOnce((resolve: any) =>
        resolve({
          data: [
            { ...mockASNItems[0], expected_qty: 80 },
            { ...mockASNItems[1], expected_qty: 50 },
          ],
          error: null,
        })
      )

      // 6. Supplier lookup
      mockQuery.single.mockResolvedValueOnce({
        data: { name: 'Test Supplier' },
        error: null,
      })

      const input: CreateASNFromPOInput = {
        po_id: 'po-001',
        expected_date: '2025-12-25',
      }

      const result = await ASNService.createASNFromPO(mockSupabase, input, 'user-001')

      expect(result.items).toHaveLength(2)
      expect(result.items[0].expected_qty).toBe(80) // 100 - 20
      expect(result.items[1].expected_qty).toBe(50) // 50 - 0
    })

    it('should exclude fully received lines from ASN items', async () => {
      const poLines = [
        { id: 'line-001', product_id: 'prod-001', quantity: 100, received_qty: 20, uom: 'KG' },
        { id: 'line-002', product_id: 'prod-002', quantity: 50, received_qty: 50, uom: 'KG' }, // Fully received
        { id: 'line-003', product_id: 'prod-003', quantity: 25, received_qty: 0, uom: 'KG' },
      ]

      // 1. PO lines fetch - uses .then()
      mockQuery.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: poLines, error: null })
      )

      // 2. PO lookup (from createASN)
      mockQuery.single.mockResolvedValueOnce({
        data: { org_id: 'org-123', supplier_id: 'sup-001', po_number: 'PO-001' },
        error: null,
      })

      // 3. ASN number generation
      mockQuery.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // 4. ASN creation
      mockQuery.single.mockResolvedValueOnce({
        data: mockASNs[0],
        error: null,
      })

      // 5. Items creation - uses .then()
      mockQuery.then.mockImplementationOnce((resolve: any) =>
        resolve({
          data: [
            { ...mockASNItems[0], product_id: 'prod-001', expected_qty: 80 },
            { ...mockASNItems[1], product_id: 'prod-003', expected_qty: 25 },
          ],
          error: null,
        })
      )

      // 6. Supplier lookup
      mockQuery.single.mockResolvedValueOnce({
        data: { name: 'Test Supplier' },
        error: null,
      })

      const input: CreateASNFromPOInput = {
        po_id: 'po-001',
        expected_date: '2025-12-25',
      }

      const result = await ASNService.createASNFromPO(mockSupabase, input, 'user-001')

      expect(result.items).toHaveLength(2) // Only unreceived lines
      expect(result.items.find((i: any) => i.product_id === 'prod-002')).toBeUndefined()
    })

    it('should reject PO with all lines fully received', async () => {
      const poLines = [
        { id: 'line-001', product_id: 'prod-001', quantity: 100, received_qty: 100, uom: 'KG' },
        { id: 'line-002', product_id: 'prod-002', quantity: 50, received_qty: 50, uom: 'KG' },
      ]

      // PO lines fetch - uses .then()
      mockQuery.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: poLines, error: null })
      )

      const input: CreateASNFromPOInput = {
        po_id: 'po-001',
        expected_date: '2025-12-25',
      }

      await expect(ASNService.createASNFromPO(mockSupabase, input, 'user-001')).rejects.toThrow(
        'Cannot create ASN for fully received PO'
      )
    })
  })

  // ==========================================================================
  // Update ASN (AC-11)
  // ==========================================================================
  describe('updateASN', () => {
    it('should update ASN header when status is pending', async () => {
      const input: UpdateASNInput = {
        expected_date: '2025-12-26',
        carrier: 'UPS',
        tracking_number: '0987654321',
      }

      // First .single() call for status check
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockASNs[0], status: 'pending' },
        error: null,
      })

      // Second .single() call for update result
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockASNs[0], ...input },
        error: null,
      })

      const result = await ASNService.updateASN(mockSupabase, 'asn-001', input)

      expect(result.carrier).toBe('UPS')
      expect(mockSupabase.from).toHaveBeenCalledWith('asns')
    })

    it('should block modification when status is not pending', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockASNs[0], status: 'partial' },
        error: null,
      })

      const input: UpdateASNInput = {
        expected_date: '2025-12-26',
      }

      await expect(ASNService.updateASN(mockSupabase, 'asn-001', input)).rejects.toThrow(
        'Cannot modify ASN in partial status'
      )
    })
  })

  // ==========================================================================
  // Delete ASN (AC-11)
  // ==========================================================================
  describe('deleteASN', () => {
    it('should delete ASN when status is pending and no receipts', async () => {
      // Mock ASN fetch
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockASNs[0], status: 'pending' },
        error: null,
      })

      // Mock items fetch - uses .then()
      mockQuery.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: mockASNItems.map((item) => ({ ...item, received_qty: 0 })), error: null })
      )

      // Mock delete operation - no data needed
      mockQuery.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: null, error: null })
      )

      await ASNService.deleteASN(mockSupabase, 'asn-001')

      expect(mockSupabase.from).toHaveBeenCalledWith('asns')
    })

    it('should block deletion when ASN has received items', async () => {
      // Mock ASN fetch
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockASNs[0], status: 'partial' },
        error: null,
      })

      // Mock items fetch - uses .then()
      mockQuery.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: mockASNItems.map((item) => ({ ...item, received_qty: 10 })), error: null })
      )

      await expect(ASNService.deleteASN(mockSupabase, 'asn-001')).rejects.toThrow(
        'Cannot delete ASN with received items'
      )
    })
  })

  // ==========================================================================
  // Cancel ASN (AC-6)
  // ==========================================================================
  describe('cancelASN', () => {
    it('should cancel ASN when status is pending', async () => {
      // Mock ASN fetch for status check
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockASNs[0], status: 'pending' },
        error: null,
      })

      // Mock update result
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockASNs[0], status: 'cancelled' },
        error: null,
      })

      const result = await ASNService.cancelASN(mockSupabase, 'asn-001')

      expect(result.status).toBe('cancelled')
    })

    it('should block cancellation when status is not pending', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockASNs[0], status: 'partial' },
        error: null,
      })

      await expect(ASNService.cancelASN(mockSupabase, 'asn-001')).rejects.toThrow(
        'Cannot cancel ASN with received items'
      )
    })
  })

  // ==========================================================================
  // ASN Item Management (AC-5)
  // ==========================================================================
  describe('addASNItem', () => {
    it('should add item to ASN', async () => {
      // Mock ASN status check
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockASNs[0], status: 'pending' },
        error: null,
      })

      // Mock existing items check - uses .then()
      mockQuery.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: [], error: null })
      )

      const input: CreateASNItemInput = {
        product_id: 'prod-003',
        expected_qty: 75,
        uom: 'KG',
      }

      // Mock item creation result
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockASNItems[0], ...input },
        error: null,
      })

      const result = await ASNService.addASNItem(mockSupabase, 'asn-001', input)

      expect(result.product_id).toBe('prod-003')
      expect(result.expected_qty).toBe(75)
    })

    it('should block adding duplicate product to ASN', async () => {
      // Mock ASN status check
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockASNs[0], status: 'pending' },
        error: null,
      })

      // Mock existing items check (product already exists) - uses .then()
      mockQuery.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: [{ product_id: 'prod-001' }], error: null })
      )

      const input: CreateASNItemInput = {
        product_id: 'prod-001',
        expected_qty: 100,
        uom: 'KG',
      }

      await expect(ASNService.addASNItem(mockSupabase, 'asn-001', input)).rejects.toThrow(
        'Product already exists in ASN items'
      )
    })
  })

  describe('updateASNItem', () => {
    it('should update ASN item', async () => {
      // Mock ASN status check
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockASNs[0], status: 'pending' },
        error: null,
      })

      const input: UpdateASNItemInput = {
        expected_qty: 120,
      }

      // Mock item update result
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockASNItems[0], ...input },
        error: null,
      })

      const result = await ASNService.updateASNItem(mockSupabase, 'asn-001', 'item-001', input)

      expect(result.expected_qty).toBe(120)
    })
  })

  describe('deleteASNItem', () => {
    it('should delete ASN item', async () => {
      // Mock ASN status check
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockASNs[0], status: 'pending' },
        error: null,
      })

      // Mock delete operation (no return data needed) - uses .then()
      mockQuery.then.mockImplementationOnce((resolve: any) =>
        resolve({ data: null, error: null })
      )

      await ASNService.deleteASNItem(mockSupabase, 'asn-001', 'item-001')

      expect(mockSupabase.from).toHaveBeenCalledWith('asn_items')
    })
  })

  // ==========================================================================
  // ASN Status Updates (AC-6)
  // ==========================================================================
  describe('updateASNStatus', () => {
    it('should set status to pending when no items received', async () => {
      mockQuery.select.mockResolvedValueOnce({
        data: mockASNItems.map((item) => ({ ...item, received_qty: 0 })),
        error: null,
      })

      const status = await ASNService.calculateASNStatus(mockASNItems.map((item) => ({ ...item, received_qty: 0 })))

      expect(status).toBe('pending')
    })

    it('should set status to partial when some items partially received', async () => {
      const items = [
        { ...mockASNItems[0], expected_qty: 100, received_qty: 50 },
        { ...mockASNItems[1], expected_qty: 50, received_qty: 0 },
      ]

      const status = await ASNService.calculateASNStatus(items)

      expect(status).toBe('partial')
    })

    it('should set status to received when all items fully received', async () => {
      const items = [
        { ...mockASNItems[0], expected_qty: 100, received_qty: 100 },
        { ...mockASNItems[1], expected_qty: 50, received_qty: 50 },
      ]

      const status = await ASNService.calculateASNStatus(items)

      expect(status).toBe('received')
    })
  })

  // ==========================================================================
  // Tracking URL (AC-7)
  // ==========================================================================
  describe('getTrackingUrl', () => {
    it('should return FedEx tracking URL for FedEx carrier', () => {
      const url = ASNService.getTrackingUrl('FedEx', '1234567890')

      expect(url).toContain('fedex.com')
      expect(url).toContain('1234567890')
    })

    it('should return UPS tracking URL for UPS carrier', () => {
      const url = ASNService.getTrackingUrl('UPS', '1234567890')

      expect(url).toContain('ups.com')
      expect(url).toContain('1234567890')
    })

    it('should return null for unknown carriers', () => {
      const url = ASNService.getTrackingUrl('Unknown Carrier', '1234567890')

      expect(url).toBeNull()
    })

    it('should return null when tracking number is missing', () => {
      const url = ASNService.getTrackingUrl('FedEx', '')

      expect(url).toBeNull()
    })
  })

  // ==========================================================================
  // Expected Today (AC-8)
  // ==========================================================================
  describe('getExpectedTodayASNs', () => {
    it('should return ASNs expected today with pending or partial status', async () => {
      const today = new Date().toISOString().split('T')[0]
      const expectedASNs = [
        { ...mockASNs[0], expected_date: today, status: 'pending' },
        { ...mockASNs[1], expected_date: today, status: 'partial' },
      ]

      mockQuery.order.mockResolvedValueOnce({
        data: expectedASNs,
        error: null,
      })

      const result = await ASNService.getExpectedTodayASNs(mockSupabase)

      expect(result).toHaveLength(2)
      expect(result[0].expected_date).toBe(today)
      expect(mockSupabase.from).toHaveBeenCalledWith('asns')
    })

    it('should exclude received and cancelled ASNs', async () => {
      const today = new Date().toISOString().split('T')[0]
      const expectedASNs = [
        { ...mockASNs[0], expected_date: today, status: 'pending' },
      ]

      mockQuery.order.mockResolvedValueOnce({
        data: expectedASNs,
        error: null,
      })

      const result = await ASNService.getExpectedTodayASNs(mockSupabase)

      expect(result.every((asn: ASN) => ['pending', 'partial'].includes(asn.status))).toBe(true)
    })
  })

  // ==========================================================================
  // List ASNs with Filters (AC-2)
  // ==========================================================================
  describe('listASNs', () => {
    it('should return paginated ASN list', async () => {
      mockQuery.range.mockResolvedValueOnce({
        data: mockASNs,
        error: null,
      })

      const filters: ASNFilters = {
        page: 1,
        limit: 20,
      }

      const result = await ASNService.listASNs(mockSupabase, filters)

      expect(result).toHaveLength(2)
      expect(mockSupabase.from).toHaveBeenCalledWith('asns')
    })

    it('should filter by status', async () => {
      mockQuery.range.mockResolvedValueOnce({
        data: [mockASNs[0]],
        error: null,
      })

      const filters: ASNFilters = {
        status: 'pending',
      }

      await ASNService.listASNs(mockSupabase, filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'pending')
    })

    it('should search by ASN number, PO number, or supplier', async () => {
      mockQuery.range.mockResolvedValueOnce({
        data: [mockASNs[0]],
        error: null,
      })

      const filters: ASNFilters = {
        search: 'ASN-2025',
      }

      await ASNService.listASNs(mockSupabase, filters)

      expect(mockQuery.ilike).toHaveBeenCalled()
    })
  })
})
