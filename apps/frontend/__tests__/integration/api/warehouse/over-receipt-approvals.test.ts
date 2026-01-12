/**
 * Over-Receipt Approvals API - Integration Tests (Story 05.15)
 * Purpose: Test API endpoints for over-receipt approval workflow
 * Phase: GREEN - Tests for API routes
 *
 * Tests API endpoints:
 * - POST /api/warehouse/grns/validate-over-receipt
 * - GET /api/warehouse/over-receipt-approvals
 * - POST /api/warehouse/over-receipt-approvals
 * - GET /api/warehouse/over-receipt-approvals/:id
 * - POST /api/warehouse/over-receipt-approvals/:id/approve
 * - POST /api/warehouse/over-receipt-approvals/:id/reject
 *
 * Coverage Target: 80%+
 * Test Count: 25-30 scenarios
 *
 * Note: These tests use mocks for Supabase. For full integration,
 * use Playwright E2E tests with a real database.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase server client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// Helper to create mock chainable Supabase query
const createMockChain = () => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn((resolve) => resolve({ data: null, error: null, count: 0 })),
  }
  return chain
}

// Helper to create NextRequest
const createRequest = (
  method: string,
  url: string,
  body?: any,
  searchParams?: Record<string, string>
) => {
  const urlObj = new URL(url, 'http://localhost:3000')
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value)
    })
  }

  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }

  if (body) {
    init.body = JSON.stringify(body)
  }

  return new NextRequest(urlObj, init)
}

describe('Over-Receipt Approvals API (Story 05.15)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // POST /api/warehouse/grns/validate-over-receipt
  // =========================================================================
  describe('POST /api/warehouse/grns/validate-over-receipt', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const { POST } = await import(
        '@/app/api/warehouse/grns/validate-over-receipt/route'
      )

      const request = createRequest(
        'POST',
        '/api/warehouse/grns/validate-over-receipt',
        {
          po_line_id: '123e4567-e89b-12d3-a456-426614174000',
          receiving_qty: 100,
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid input', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockChain = createMockChain()
      mockChain.single.mockResolvedValueOnce({
        data: { org_id: 'org-1' },
        error: null,
      })
      mockSupabase.from.mockReturnValue(mockChain)

      const { POST } = await import(
        '@/app/api/warehouse/grns/validate-over-receipt/route'
      )

      const request = createRequest(
        'POST',
        '/api/warehouse/grns/validate-over-receipt',
        {
          po_line_id: 'invalid-uuid',
          receiving_qty: -10, // Invalid
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should return validation result for valid request', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockChain = createMockChain()
      mockChain.single
        .mockResolvedValueOnce({ data: { org_id: 'org-1' }, error: null })
        .mockResolvedValueOnce({
          data: { id: 'line-1', product_id: 'prod-1', quantity: 100, received_qty: 0 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { allow_over_receipt: true, over_receipt_tolerance_pct: 10 },
          error: null,
        })

      mockSupabase.from.mockReturnValue(mockChain)

      const { POST } = await import(
        '@/app/api/warehouse/grns/validate-over-receipt/route'
      )

      const request = createRequest(
        'POST',
        '/api/warehouse/grns/validate-over-receipt',
        {
          po_line_id: '123e4567-e89b-12d3-a456-426614174000',
          receiving_qty: 80, // Under ordered qty
        }
      )

      const response = await POST(request)
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.allowed).toBe(true)
    })
  })

  // =========================================================================
  // GET /api/warehouse/over-receipt-approvals
  // =========================================================================
  describe('GET /api/warehouse/over-receipt-approvals', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const { GET } = await import('@/app/api/warehouse/over-receipt-approvals/route')

      const request = createRequest('GET', '/api/warehouse/over-receipt-approvals')

      const response = await GET(request)
      expect(response.status).toBe(401)
    })

    it('should return paginated approvals list', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockChain = createMockChain()
      mockChain.single.mockResolvedValueOnce({
        data: { org_id: 'org-1' },
        error: null,
      })
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

      mockSupabase.from.mockReturnValue(mockChain)

      const { GET } = await import('@/app/api/warehouse/over-receipt-approvals/route')

      const request = createRequest('GET', '/api/warehouse/over-receipt-approvals', undefined, {
        status: 'pending',
        page: '1',
        limit: '10',
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.data).toBeDefined()
      expect(body.meta).toBeDefined()
    })
  })

  // =========================================================================
  // POST /api/warehouse/over-receipt-approvals
  // =========================================================================
  describe('POST /api/warehouse/over-receipt-approvals', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const { POST } = await import('@/app/api/warehouse/over-receipt-approvals/route')

      const request = createRequest('POST', '/api/warehouse/over-receipt-approvals', {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        requesting_qty: 115,
        reason: 'Supplier shipped extra units',
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('should return 400 when reason too short', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockChain = createMockChain()
      mockChain.single.mockResolvedValueOnce({
        data: { org_id: 'org-1' },
        error: null,
      })
      mockSupabase.from.mockReturnValue(mockChain)

      const { POST } = await import('@/app/api/warehouse/over-receipt-approvals/route')

      const request = createRequest('POST', '/api/warehouse/over-receipt-approvals', {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        requesting_qty: 115,
        reason: 'Short', // Too short
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should create approval request successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockChain = createMockChain()
      mockChain.single
        .mockResolvedValueOnce({ data: { org_id: 'org-1' }, error: null })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // no existing
        .mockResolvedValueOnce({
          data: { product_id: 'prod-1', quantity: 100, received_qty: 0 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { over_receipt_tolerance_pct: 10 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'pending' },
          error: null,
        })

      mockChain.insert = vi.fn(() => mockChain)
      mockSupabase.from.mockReturnValue(mockChain)

      const { POST } = await import('@/app/api/warehouse/over-receipt-approvals/route')

      const request = createRequest('POST', '/api/warehouse/over-receipt-approvals', {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        requesting_qty: 115,
        reason: 'Supplier shipped extra units in full pallet',
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const body = await response.json()
      expect(body.status).toBe('pending')
    })

    it('should return 400 when pending approval already exists', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockChain = createMockChain()
      mockChain.single
        .mockResolvedValueOnce({ data: { org_id: 'org-1' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'existing-approval' }, error: null })

      mockSupabase.from.mockReturnValue(mockChain)

      const { POST } = await import('@/app/api/warehouse/over-receipt-approvals/route')

      const request = createRequest('POST', '/api/warehouse/over-receipt-approvals', {
        po_id: '123e4567-e89b-12d3-a456-426614174000',
        po_line_id: '123e4567-e89b-12d3-a456-426614174001',
        requesting_qty: 115,
        reason: 'Supplier shipped extra units in full pallet',
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const body = await response.json()
      expect(body.error).toContain('already exists')
    })
  })

  // =========================================================================
  // GET /api/warehouse/over-receipt-approvals/:id
  // =========================================================================
  describe('GET /api/warehouse/over-receipt-approvals/:id', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const { GET } = await import(
        '@/app/api/warehouse/over-receipt-approvals/[id]/route'
      )

      const request = createRequest(
        'GET',
        '/api/warehouse/over-receipt-approvals/123e4567-e89b-12d3-a456-426614174000'
      )

      const response = await GET(request, {
        params: Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' }),
      })
      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid UUID', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockChain = createMockChain()
      mockChain.single.mockResolvedValueOnce({
        data: { org_id: 'org-1' },
        error: null,
      })
      mockSupabase.from.mockReturnValue(mockChain)

      const { GET } = await import(
        '@/app/api/warehouse/over-receipt-approvals/[id]/route'
      )

      const request = createRequest(
        'GET',
        '/api/warehouse/over-receipt-approvals/invalid-uuid'
      )

      const response = await GET(request, {
        params: Promise.resolve({ id: 'invalid-uuid' }),
      })
      expect(response.status).toBe(400)
    })

    it('should return 404 when approval not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockChain = createMockChain()
      mockChain.single
        .mockResolvedValueOnce({ data: { org_id: 'org-1' }, error: null })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

      mockSupabase.from.mockReturnValue(mockChain)

      const { GET } = await import(
        '@/app/api/warehouse/over-receipt-approvals/[id]/route'
      )

      const request = createRequest(
        'GET',
        '/api/warehouse/over-receipt-approvals/123e4567-e89b-12d3-a456-426614174000'
      )

      const response = await GET(request, {
        params: Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' }),
      })
      expect(response.status).toBe(404)
    })

    it('should return approval details', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockChain = createMockChain()
      mockChain.single
        .mockResolvedValueOnce({ data: { org_id: 'org-1' }, error: null })
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'pending',
            over_receipt_pct: 15,
            products: { name: 'Product A', code: 'PROD-A' },
          },
          error: null,
        })

      mockSupabase.from.mockReturnValue(mockChain)

      const { GET } = await import(
        '@/app/api/warehouse/over-receipt-approvals/[id]/route'
      )

      const request = createRequest(
        'GET',
        '/api/warehouse/over-receipt-approvals/123e4567-e89b-12d3-a456-426614174000'
      )

      const response = await GET(request, {
        params: Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' }),
      })
      expect(response.status).toBe(200)
    })
  })

  // =========================================================================
  // POST /api/warehouse/over-receipt-approvals/:id/approve
  // =========================================================================
  describe('POST /api/warehouse/over-receipt-approvals/:id/approve', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const { POST } = await import(
        '@/app/api/warehouse/over-receipt-approvals/[id]/approve/route'
      )

      const request = createRequest(
        'POST',
        '/api/warehouse/over-receipt-approvals/123e4567-e89b-12d3-a456-426614174000/approve',
        { review_notes: 'Approved' }
      )

      const response = await POST(request, {
        params: Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' }),
      })
      expect(response.status).toBe(401)
    })

    it('should return 403 when user is not manager', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockChain = createMockChain()
      mockChain.single
        .mockResolvedValueOnce({ data: { org_id: 'org-1' }, error: null })
        .mockResolvedValueOnce({ data: { roles: { code: 'WH_OPERATOR' } }, error: null })

      mockSupabase.from.mockReturnValue(mockChain)

      const { POST } = await import(
        '@/app/api/warehouse/over-receipt-approvals/[id]/approve/route'
      )

      const request = createRequest(
        'POST',
        '/api/warehouse/over-receipt-approvals/123e4567-e89b-12d3-a456-426614174000/approve',
        { review_notes: 'Approved' }
      )

      const response = await POST(request, {
        params: Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' }),
      })
      expect(response.status).toBe(403)
    })

    it('should approve request when user is manager', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'manager-1' } },
        error: null,
      })

      const mockChain = createMockChain()
      mockChain.single
        .mockResolvedValueOnce({ data: { org_id: 'org-1' }, error: null })
        .mockResolvedValueOnce({ data: { roles: { code: 'WH_MANAGER' } }, error: null })
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'pending', org_id: 'org-1' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'approved' },
          error: null,
        })

      mockChain.update = vi.fn(() => mockChain)
      mockSupabase.from.mockReturnValue(mockChain)

      const { POST } = await import(
        '@/app/api/warehouse/over-receipt-approvals/[id]/approve/route'
      )

      const request = createRequest(
        'POST',
        '/api/warehouse/over-receipt-approvals/123e4567-e89b-12d3-a456-426614174000/approve',
        { review_notes: 'Approved - acceptable supplier overage' }
      )

      const response = await POST(request, {
        params: Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' }),
      })
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.status).toBe('approved')
    })
  })

  // =========================================================================
  // POST /api/warehouse/over-receipt-approvals/:id/reject
  // =========================================================================
  describe('POST /api/warehouse/over-receipt-approvals/:id/reject', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const { POST } = await import(
        '@/app/api/warehouse/over-receipt-approvals/[id]/reject/route'
      )

      const request = createRequest(
        'POST',
        '/api/warehouse/over-receipt-approvals/123e4567-e89b-12d3-a456-426614174000/reject',
        { review_notes: 'Rejected - quantity too high' }
      )

      const response = await POST(request, {
        params: Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' }),
      })
      expect(response.status).toBe(401)
    })

    it('should return 400 when review notes missing', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'manager-1' } },
        error: null,
      })

      const mockChain = createMockChain()
      mockChain.single.mockResolvedValueOnce({
        data: { org_id: 'org-1' },
        error: null,
      })
      mockSupabase.from.mockReturnValue(mockChain)

      const { POST } = await import(
        '@/app/api/warehouse/over-receipt-approvals/[id]/reject/route'
      )

      const request = createRequest(
        'POST',
        '/api/warehouse/over-receipt-approvals/123e4567-e89b-12d3-a456-426614174000/reject',
        { review_notes: '' } // Empty
      )

      const response = await POST(request, {
        params: Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' }),
      })
      expect(response.status).toBe(400)
    })

    it('should reject request when user is manager with review notes', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'manager-1' } },
        error: null,
      })

      const mockChain = createMockChain()
      mockChain.single
        .mockResolvedValueOnce({ data: { org_id: 'org-1' }, error: null })
        .mockResolvedValueOnce({ data: { roles: { code: 'WH_MANAGER' } }, error: null })
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'pending', org_id: 'org-1' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'approval-1', status: 'rejected' },
          error: null,
        })

      mockChain.update = vi.fn(() => mockChain)
      mockSupabase.from.mockReturnValue(mockChain)

      const { POST } = await import(
        '@/app/api/warehouse/over-receipt-approvals/[id]/reject/route'
      )

      const request = createRequest(
        'POST',
        '/api/warehouse/over-receipt-approvals/123e4567-e89b-12d3-a456-426614174000/reject',
        { review_notes: 'Quantity discrepancy too large, return excess to supplier' }
      )

      const response = await POST(request, {
        params: Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' }),
      })
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.status).toBe('rejected')
    })
  })
})
