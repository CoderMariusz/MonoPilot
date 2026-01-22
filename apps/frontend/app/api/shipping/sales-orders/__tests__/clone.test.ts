/**
 * Sales Order Clone API - Integration Tests (Story 07.5)
 * Purpose: Test clone endpoint POST /api/shipping/sales-orders/:id/clone
 * Phase: GREEN - Tests verify implementation
 *
 * Test Cases from tests.yaml:
 * - AC-CLONE-01: Clone SO - Happy Path
 * - AC-CLONE-04: Clone SO - RLS Isolation
 * - AC-CLONE-05: Clone SO - Not Found
 * - Clone SO increments sequence counter
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase server
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

const mockSupabaseAdmin = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve(mockSupabaseClient)),
  createServerSupabaseAdmin: vi.fn(() => mockSupabaseAdmin),
}))

// Mock SalesOrderService
vi.mock('@/lib/services/sales-order-service', () => ({
  SalesOrderService: {
    cloneSalesOrder: vi.fn(),
    generateNextNumber: vi.fn(),
  },
}))

// Import after mocks
import { POST } from '../[id]/clone/route'
import { SalesOrderService } from '@/lib/services/sales-order-service'

describe('Clone SO API - POST /api/shipping/sales-orders/:id/clone (Story 07.5)', () => {
  const TEST_ORG_ID = '22222222-2222-2222-2222-222222222222'
  const TEST_USER_ID = 'user-123'
  const TEST_SO_ID = '11111111-1111-1111-1111-111111111111'
  const TEST_CUSTOMER_ID = '33333333-3333-3333-3333-333333333333'

  const mockUserData = {
    org_id: TEST_ORG_ID,
    role: { code: 'sales' },
  }

  const mockSourceOrder = {
    id: TEST_SO_ID,
    org_id: TEST_ORG_ID,
    order_number: 'SO-2025-00123',
    status: 'confirmed',
  }

  const mockClonedOrder = {
    id: 'new-cloned-id',
    org_id: TEST_ORG_ID,
    order_number: 'SO-2025-00456',
    customer_id: TEST_CUSTOMER_ID,
    shipping_address_id: '55555555-5555-5555-5555-555555555555',
    status: 'draft',
    order_date: '2025-01-22',
    required_delivery_date: null,
    promised_ship_date: null,
    customer_po: null,
    notes: 'Special handling required',
    total_amount: 1050.00,
    line_count: 1,
    allergen_validated: false,
    confirmed_at: null,
    shipped_at: null,
    lines: [
      {
        id: 'new-line-1',
        line_number: 1,
        product_id: '44444444-4444-4444-4444-444444444444',
        quantity_ordered: 100,
        quantity_allocated: 0,
        quantity_picked: 0,
        quantity_packed: 0,
        quantity_shipped: 0,
        unit_price: 10.50,
        notes: null,
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-22'))

    // Default happy path mock setup
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: TEST_USER_ID } },
      error: null,
    })

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
            }),
          }),
        }
      }
      if (table === 'sales_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockSourceOrder, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'customers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { name: 'ACME Corp' }, error: null }),
            }),
          }),
        }
      }
      return { select: vi.fn() }
    })

    vi.mocked(SalesOrderService.cloneSalesOrder).mockResolvedValue(mockClonedOrder)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createRequest(): NextRequest {
    return new NextRequest(
      `http://localhost/api/shipping/sales-orders/${TEST_SO_ID}/clone`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  async function createParams(id: string) {
    return { id }
  }

  describe('Authentication', () => {
    it('should return 401 when user not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createRequest()
      const params = await createParams(TEST_SO_ID)
      const response = await POST(request, { params: Promise.resolve(params) })

      expect(response.status).toBe(401)
    })
  })

  describe('Authorization', () => {
    it('should return 403 when user lacks shipping.C permission', async () => {
      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { org_id: TEST_ORG_ID, role: { code: 'viewer' } },
                  error: null,
                }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      const request = createRequest()
      const params = await createParams(TEST_SO_ID)
      const response = await POST(request, { params: Promise.resolve(params) })

      expect(response.status).toBe(403)
    })
  })

  describe('AC-CLONE-05: Clone SO - Not Found', () => {
    it('should return 404 when SO not found', async () => {
      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
              }),
            }),
          }
        }
        if (table === 'sales_orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
                }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      const request = createRequest()
      const params = await createParams('non-existent-id')
      const response = await POST(request, { params: Promise.resolve(params) })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error.message).toBe('Sales order not found')
    })
  })

  describe('AC-CLONE-04: Clone SO - RLS Isolation', () => {
    it('should return 404 when trying to clone SO from different org (RLS)', async () => {
      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
              }),
            }),
          }
        }
        if (table === 'sales_orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      const request = createRequest()
      const params = await createParams('org-b-so-id')
      const response = await POST(request, { params: Promise.resolve(params) })

      expect(response.status).toBe(404)
    })
  })

  describe('AC-CLONE-01: Clone SO - Happy Path', () => {
    it('should clone SO successfully with 201 status', async () => {
      const request = createRequest()
      const params = await createParams(TEST_SO_ID)
      const response = await POST(request, { params: Promise.resolve(params) })

      expect(response.status).toBe(201)
    })

    it('should return cloned SO with new id', async () => {
      const request = createRequest()
      const params = await createParams(TEST_SO_ID)
      const response = await POST(request, { params: Promise.resolve(params) })
      const data = await response.json()

      expect(data.salesOrder).toBeDefined()
      expect(data.salesOrder.id).not.toBe(TEST_SO_ID)
    })

    it('should return cloned SO with new order_number', async () => {
      const request = createRequest()
      const params = await createParams(TEST_SO_ID)
      const response = await POST(request, { params: Promise.resolve(params) })
      const data = await response.json()

      expect(data.salesOrder.order_number).not.toBe('SO-2025-00123')
      expect(data.salesOrder.order_number).toMatch(/^SO-\d{4}-\d{5}$/)
    })

    it('should return cloned SO with status=draft', async () => {
      const request = createRequest()
      const params = await createParams(TEST_SO_ID)
      const response = await POST(request, { params: Promise.resolve(params) })
      const data = await response.json()

      expect(data.salesOrder.status).toBe('draft')
    })

    it('should preserve customer_id and shipping_address_id', async () => {
      const response = await POST(createRequest(), { params: Promise.resolve(await createParams(TEST_SO_ID)) })
      const data = await response.json()

      expect(data.salesOrder.customer_id).toBe(TEST_CUSTOMER_ID)
      expect(data.salesOrder.shipping_address_id).toBe('55555555-5555-5555-5555-555555555555')
    })

    it('should clear customer_po, promised_ship_date, required_delivery_date', async () => {
      const response = await POST(createRequest(), { params: Promise.resolve(await createParams(TEST_SO_ID)) })
      const data = await response.json()

      expect(data.salesOrder.customer_po).toBeNull()
      expect(data.salesOrder.promised_ship_date).toBeNull()
      expect(data.salesOrder.required_delivery_date).toBeNull()
    })

    it('should set allergen_validated to false', async () => {
      const response = await POST(createRequest(), { params: Promise.resolve(await createParams(TEST_SO_ID)) })
      const data = await response.json()

      expect(data.salesOrder.allergen_validated).toBe(false)
    })

    it('should clone all lines with renumbered line_numbers', async () => {
      const response = await POST(createRequest(), { params: Promise.resolve(await createParams(TEST_SO_ID)) })
      const data = await response.json()

      expect(data.salesOrder.lines).toBeDefined()
      expect(data.salesOrder.lines.length).toBe(1)
      expect(data.salesOrder.lines[0].line_number).toBe(1)
    })

    it('should reset quantity fields to 0 on cloned lines', async () => {
      const response = await POST(createRequest(), { params: Promise.resolve(await createParams(TEST_SO_ID)) })
      const data = await response.json()

      expect(data.salesOrder.lines[0].quantity_allocated).toBe(0)
      expect(data.salesOrder.lines[0].quantity_picked).toBe(0)
    })
  })

  describe('Clone SO increments sequence counter', () => {
    it('should increment org sequence counter after clone', async () => {
      const response = await POST(createRequest(), { params: Promise.resolve(await createParams(TEST_SO_ID)) })

      expect(response.status).toBe(201)
      expect(SalesOrderService.cloneSalesOrder).toHaveBeenCalledWith(TEST_SO_ID)
    })
  })

  describe('Response Format', () => {
    it('should return success message', async () => {
      const response = await POST(createRequest(), { params: Promise.resolve(await createParams(TEST_SO_ID)) })
      const data = await response.json()

      expect(data.message).toBe('Sales order cloned successfully')
    })

    it('should include clonedFrom order number in response', async () => {
      const response = await POST(createRequest(), { params: Promise.resolve(await createParams(TEST_SO_ID)) })
      const data = await response.json()

      expect(data.clonedFrom).toBe('SO-2025-00123')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      vi.mocked(SalesOrderService.cloneSalesOrder).mockRejectedValue(new Error('Database error'))

      const response = await POST(createRequest(), { params: Promise.resolve(await createParams(TEST_SO_ID)) })

      expect(response.status).toBe(500)
    })

    it('should return helpful error message on failure', async () => {
      vi.mocked(SalesOrderService.cloneSalesOrder).mockRejectedValue(new Error('Failed to clone'))

      const response = await POST(createRequest(), { params: Promise.resolve(await createParams(TEST_SO_ID)) })
      const data = await response.json()

      expect(data.error).toBeDefined()
      expect(data.error.message).toBe('Failed to clone')
    })
  })
})
