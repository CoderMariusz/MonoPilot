/**
 * GRN Service Tests (Story 05.10)
 * Unit tests for GRN CRUD and workflow operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GRNService } from '../grn-service'

// Mock Supabase client
const createMockSupabase = () => {
  const mockSingle = vi.fn()
  const mockMaybeSingle = vi.fn()
  const mockRpc = vi.fn()

  // Create chainable mock that returns itself
  const createChainableMock = () => {
    const chainable: Record<string, any> = {}
    const methods = ['select', 'eq', 'ilike', 'gte', 'lte', 'order', 'range', 'limit', 'in', 'insert', 'update', 'delete']

    methods.forEach(method => {
      chainable[method] = vi.fn().mockReturnValue(chainable)
    })

    chainable.single = mockSingle
    chainable.maybeSingle = mockMaybeSingle

    return chainable
  }

  const chainableMock = createChainableMock()

  const mockFrom = vi.fn().mockReturnValue(chainableMock)

  return {
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
    _mocks: {
      mockSingle,
      mockMaybeSingle,
      mockRpc,
      mockOrder: chainableMock.order,
    },
  }
}

describe('GRNService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
  })

  // ===========================================================================
  // generateGRNNumber Tests
  // ===========================================================================

  describe('generateGRNNumber', () => {
    it('generates GRN-YYYY-00001 format for first GRN', async () => {
      const year = new Date().getFullYear()
      mockSupabase._mocks.mockMaybeSingle.mockResolvedValue({ data: null, error: null })

      const result = await GRNService.generateGRNNumber(mockSupabase as any, 'test-org')

      expect(result).toBe(`GRN-${year}-00001`)
    })

    it('increments sequence for existing GRNs', async () => {
      const year = new Date().getFullYear()
      mockSupabase._mocks.mockMaybeSingle.mockResolvedValue({
        data: { grn_number: `GRN-${year}-00005` },
        error: null,
      })

      const result = await GRNService.generateGRNNumber(mockSupabase as any, 'test-org')

      expect(result).toBe(`GRN-${year}-00006`)
    })

    it('pads sequence number correctly', async () => {
      const year = new Date().getFullYear()
      mockSupabase._mocks.mockMaybeSingle.mockResolvedValue({
        data: { grn_number: `GRN-${year}-99999` },
        error: null,
      })

      const result = await GRNService.generateGRNNumber(mockSupabase as any, 'test-org')

      expect(result).toBe(`GRN-${year}-100000`)
    })

    it('throws error on database failure', async () => {
      mockSupabase._mocks.mockMaybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(
        GRNService.generateGRNNumber(mockSupabase as any, 'test-org')
      ).rejects.toThrow('Failed to generate GRN number')
    })
  })

  // ===========================================================================
  // getById Tests
  // ===========================================================================

  describe('getById', () => {
    it('returns GRN with items when found', async () => {
      const mockGRN = {
        id: 'grn-1',
        grn_number: 'GRN-2025-00001',
        status: 'draft',
        org_id: 'test-org',
      }
      const mockItems = [
        { id: 'item-1', product_id: 'prod-1', received_qty: 100 },
      ]

      // First call for GRN
      mockSupabase._mocks.mockSingle
        .mockResolvedValueOnce({ data: mockGRN, error: null })
        // Second call for items
        .mockResolvedValueOnce({ data: mockItems, error: null })

      const result = await GRNService.getById(mockSupabase as any, 'grn-1')

      expect(result).toBeTruthy()
      expect(result?.grn_number).toBe('GRN-2025-00001')
      expect(result?.items).toBeDefined()
    })

    it('returns null when GRN not found', async () => {
      mockSupabase._mocks.mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      const result = await GRNService.getById(mockSupabase as any, 'non-existent')

      expect(result).toBeNull()
    })
  })

  // ===========================================================================
  // update Tests
  // ===========================================================================

  describe('update', () => {
    it('blocks update on completed GRN', async () => {
      const mockGRN = { id: 'grn-1', status: 'completed', items: [] }
      mockSupabase._mocks.mockSingle.mockResolvedValue({ data: mockGRN, error: null })

      await expect(
        GRNService.update(mockSupabase as any, 'grn-1', { notes: 'Updated' })
      ).rejects.toThrow('Cannot modify completed GRN')
    })

    it('blocks update on cancelled GRN', async () => {
      const mockGRN = { id: 'grn-1', status: 'cancelled', items: [] }
      mockSupabase._mocks.mockSingle.mockResolvedValue({ data: mockGRN, error: null })

      await expect(
        GRNService.update(mockSupabase as any, 'grn-1', { notes: 'Updated' })
      ).rejects.toThrow('Cannot modify cancelled GRN')
    })

    it('throws when GRN not found', async () => {
      mockSupabase._mocks.mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      await expect(
        GRNService.update(mockSupabase as any, 'non-existent', { notes: 'Updated' })
      ).rejects.toThrow('GRN not found')
    })
  })

  // ===========================================================================
  // addItem Tests
  // ===========================================================================

  describe('addItem', () => {
    it('blocks adding item to completed GRN', async () => {
      const mockGRN = { id: 'grn-1', status: 'completed', items: [] }
      mockSupabase._mocks.mockSingle.mockResolvedValue({ data: mockGRN, error: null })

      await expect(
        GRNService.addItem(mockSupabase as any, 'grn-1', {
          product_id: 'prod-1',
          received_qty: 100,
          uom: 'KG',
        })
      ).rejects.toThrow('Cannot modify items on completed GRN')
    })

    it('throws when GRN not found', async () => {
      mockSupabase._mocks.mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      await expect(
        GRNService.addItem(mockSupabase as any, 'non-existent', {
          product_id: 'prod-1',
          received_qty: 100,
          uom: 'KG',
        })
      ).rejects.toThrow('GRN not found')
    })
  })

  // ===========================================================================
  // updateItem Tests
  // ===========================================================================

  describe('updateItem', () => {
    it('blocks updating item on completed GRN', async () => {
      const mockGRN = { id: 'grn-1', status: 'completed', items: [] }
      mockSupabase._mocks.mockSingle.mockResolvedValue({ data: mockGRN, error: null })

      await expect(
        GRNService.updateItem(mockSupabase as any, 'grn-1', 'item-1', {
          received_qty: 150,
        })
      ).rejects.toThrow('Cannot modify items on completed GRN')
    })
  })

  // ===========================================================================
  // removeItem Tests
  // ===========================================================================

  describe('removeItem', () => {
    it('blocks removing item from completed GRN', async () => {
      const mockGRN = { id: 'grn-1', status: 'completed', items: [] }
      mockSupabase._mocks.mockSingle.mockResolvedValue({ data: mockGRN, error: null })

      await expect(
        GRNService.removeItem(mockSupabase as any, 'grn-1', 'item-1')
      ).rejects.toThrow('Cannot modify items on completed GRN')
    })
  })

  // ===========================================================================
  // complete Tests
  // ===========================================================================

  describe('complete', () => {
    it('throws when GRN not found', async () => {
      mockSupabase._mocks.mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      await expect(
        GRNService.complete(mockSupabase as any, 'non-existent', 'user-1')
      ).rejects.toThrow('GRN not found')
    })

    it('blocks completing already completed GRN', async () => {
      const mockGRN = { id: 'grn-1', status: 'completed', items: [] }
      mockSupabase._mocks.mockSingle.mockResolvedValue({ data: mockGRN, error: null })

      await expect(
        GRNService.complete(mockSupabase as any, 'grn-1', 'user-1')
      ).rejects.toThrow('Cannot complete completed GRN')
    })

    it('blocks completing GRN with no items', async () => {
      const mockGRN = { id: 'grn-1', status: 'draft', items: [], org_id: 'test-org' }
      mockSupabase._mocks.mockSingle
        .mockResolvedValueOnce({ data: mockGRN, error: null })
        .mockResolvedValueOnce({ data: [], error: null })

      await expect(
        GRNService.complete(mockSupabase as any, 'grn-1', 'user-1')
      ).rejects.toThrow('Cannot complete GRN with no items')
    })
  })

  // ===========================================================================
  // cancel Tests
  // ===========================================================================

  describe('cancel', () => {
    it('throws when GRN not found', async () => {
      mockSupabase._mocks.mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      await expect(
        GRNService.cancel(mockSupabase as any, 'non-existent', 'Test reason', 'user-1')
      ).rejects.toThrow('GRN not found')
    })

    it('blocks cancelling already cancelled GRN', async () => {
      const mockGRN = { id: 'grn-1', status: 'cancelled', items: [] }
      mockSupabase._mocks.mockSingle.mockResolvedValue({ data: mockGRN, error: null })

      await expect(
        GRNService.cancel(mockSupabase as any, 'grn-1', 'Test reason', 'user-1')
      ).rejects.toThrow('GRN is already cancelled')
    })
  })

  // ===========================================================================
  // validateForCancellation Tests
  // ===========================================================================

  describe('validateForCancellation', () => {
    it('returns valid for GRN with no items', async () => {
      const grn = { id: 'grn-1', status: 'completed' } as any

      const result = await GRNService.validateForCancellation(mockSupabase as any, grn)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns valid for GRN with available LPs', async () => {
      const grn = {
        id: 'grn-1',
        status: 'completed',
        items: [{ id: 'item-1', lp_id: 'lp-1' }],
      } as any

      mockSupabase._mocks.mockSingle.mockResolvedValue({
        data: { lp_number: 'LP-001', status: 'available' },
        error: null,
      })

      const result = await GRNService.validateForCancellation(mockSupabase as any, grn)

      expect(result.valid).toBe(true)
    })

    it('returns invalid when LP is reserved', async () => {
      const grn = {
        id: 'grn-1',
        status: 'completed',
        items: [{ id: 'item-1', lp_id: 'lp-1' }],
      } as any

      mockSupabase._mocks.mockSingle.mockResolvedValue({
        data: { lp_number: 'LP-001', status: 'reserved' },
        error: null,
      })

      const result = await GRNService.validateForCancellation(mockSupabase as any, grn)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Cannot cancel GRN - LP LP-001 is reserved')
    })

    it('returns invalid when LP is consumed', async () => {
      const grn = {
        id: 'grn-1',
        status: 'completed',
        items: [{ id: 'item-1', lp_id: 'lp-1' }],
      } as any

      mockSupabase._mocks.mockSingle.mockResolvedValue({
        data: { lp_number: 'LP-001', status: 'consumed' },
        error: null,
      })

      const result = await GRNService.validateForCancellation(mockSupabase as any, grn)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Cannot cancel GRN - LP LP-001 has been consumed')
    })
  })

  // ===========================================================================
  // exists Tests
  // ===========================================================================

  describe('exists', () => {
    it('returns true when GRN exists', async () => {
      mockSupabase._mocks.mockSingle.mockResolvedValue({
        data: { id: 'grn-1' },
        error: null,
      })

      const result = await GRNService.exists(mockSupabase as any, 'grn-1')

      expect(result).toBe(true)
    })

    it('returns false when GRN not found', async () => {
      mockSupabase._mocks.mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      const result = await GRNService.exists(mockSupabase as any, 'non-existent')

      expect(result).toBe(false)
    })
  })

  // ===========================================================================
  // getByPOId Tests
  // ===========================================================================

  describe('getByPOId', () => {
    it('returns GRNs for given PO', async () => {
      const mockGRNs = [
        { id: 'grn-1', po_id: 'po-1' },
        { id: 'grn-2', po_id: 'po-1' },
      ]
      mockSupabase._mocks.mockOrder.mockResolvedValue({
        data: mockGRNs,
        error: null,
      })

      const result = await GRNService.getByPOId(mockSupabase as any, 'po-1')

      expect(result).toHaveLength(2)
    })

    it('throws on database error', async () => {
      mockSupabase._mocks.mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(
        GRNService.getByPOId(mockSupabase as any, 'po-1')
      ).rejects.toThrow('Failed to fetch GRNs for PO')
    })
  })

  // ===========================================================================
  // getByTOId Tests
  // ===========================================================================

  describe('getByTOId', () => {
    it('returns GRNs for given TO', async () => {
      const mockGRNs = [
        { id: 'grn-1', to_id: 'to-1' },
      ]
      mockSupabase._mocks.mockOrder.mockResolvedValue({
        data: mockGRNs,
        error: null,
      })

      const result = await GRNService.getByTOId(mockSupabase as any, 'to-1')

      expect(result).toHaveLength(1)
    })
  })
})
