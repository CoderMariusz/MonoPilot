/**
 * LP Detail API Route Integration Tests (Story 05.6)
 * Endpoints:
 * - GET /api/warehouse/license-plates/:id (LP detail with joins)
 * - PUT /api/warehouse/license-plates/:id/block (block LP)
 * - PUT /api/warehouse/license-plates/:id/unblock (unblock LP)
 * - GET /api/warehouse/license-plates/:id/transactions (transaction history - Phase 2)
 *
 * Phase: RED - Tests will fail until implementation exists
 *
 * Coverage Target: 90%+
 * Test Count: 20+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-13: API Endpoint - Get LP Detail
 * - AC-14: API Endpoint - LP Not Found
 * - AC-15: Cross-Tenant Protection
 * - AC-10: Block LP with reason validation
 * - AC-11: Unblock LP
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PUT } from '../route'
import { NextRequest } from 'next/server'

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(),
}))

// Mock the service layer
vi.mock('@/lib/services/license-plate-detail-service', () => ({
  getLPDetail: vi.fn(),
  blockLP: vi.fn(),
  unblockLP: vi.fn(),
  getLPTransactions: vi.fn(),
}))

// Import mocked functions
import { createServerSupabase } from '@/lib/supabase/server'
import {
  getLPDetail,
  blockLP,
  unblockLP,
  getLPTransactions,
} from '@/lib/services/license-plate-detail-service'

/**
 * Mock Types
 */
interface LPDetailView {
  id: string
  org_id: string
  lp_number: string
  status: 'available' | 'reserved' | 'consumed' | 'blocked'
  qa_status: 'pending' | 'passed' | 'failed' | 'quarantine'
  product_id: string
  quantity: number
  uom: string
  location_id: string
  warehouse_id: string
  batch_number?: string | null
  supplier_batch_number?: string | null
  expiry_date?: string | null
  manufacture_date?: string | null
  source: 'production' | 'receipt' | 'split' | 'merge'
  wo_id?: string | null
  grn_id?: string | null
  po_number?: string | null
  parent_lp_id?: string | null
  consumed_by_wo_id?: string | null
  pallet_id?: string | null
  catch_weight_kg?: number | null
  block_reason?: string | null
  created_at: string
  updated_at: string
  product: {
    id: string
    name: string
    code: string
  }
  warehouse: {
    id: string
    name: string
    code: string
  }
  location: {
    id: string
    full_path: string
  }
}

const createMockLPDetail = (overrides?: Partial<LPDetailView>): LPDetailView => ({
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
  ...overrides,
})

describe('LP Detail API Routes (Story 05.6)', () => {
  let mockRequest: NextRequest
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getSession: vi.fn(),
        getUser: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
        insert: vi.fn(),
      })),
    }

    // Mock createServerSupabase to return our mock
    vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase)

    // Default: authenticated session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-001' },
          access_token: 'mock-token',
        },
      },
      error: null,
    })
  })

  /**
   * Test Group: GET /api/warehouse/license-plates/:id
   * AC-13: Get LP Detail with all fields
   */
  describe('GET /api/warehouse/license-plates/:id', () => {
    it('should return LP detail with all joined fields', async () => {
      const mockLP = createMockLPDetail()
      vi.mocked(getLPDetail).mockResolvedValue(mockLP)

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-001')
      )

      const response = await GET(mockRequest, { params: Promise.resolve({ id: 'lp-001' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('id', 'lp-001')
      expect(data).toHaveProperty('lp_number')
      expect(data).toHaveProperty('product')
      expect(data.product).toHaveProperty('name')
      expect(data).toHaveProperty('warehouse')
      expect(data.warehouse).toHaveProperty('name')
      expect(data).toHaveProperty('location')
      expect(data.location).toHaveProperty('full_path')
    })

    it('should return 404 for invalid LP ID', async () => {
      vi.mocked(getLPDetail).mockResolvedValue(null)

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/invalid-uuid')
      )

      const response = await GET(mockRequest, { params: Promise.resolve({ id: 'invalid-uuid' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('License Plate not found')
    })

    it('should return 404 for cross-tenant LP (not 403)', async () => {
      // AC-15: RLS blocks access, returns 404
      vi.mocked(getLPDetail).mockResolvedValue(null)

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-other-org')
      )

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: 'lp-other-org' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('License Plate not found')
    })

    it('should return LP detail within 200ms', async () => {
      const mockLP = createMockLPDetail()
      vi.mocked(getLPDetail).mockResolvedValue(mockLP)

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-001')
      )

      const startTime = Date.now()
      const response = await GET(mockRequest, { params: Promise.resolve({ id: 'lp-001' }) })
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(200)
    })

    it('should include all LP fields in response', async () => {
      const mockLP = createMockLPDetail()
      vi.mocked(getLPDetail).mockResolvedValue(mockLP)

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-001')
      )

      const response = await GET(mockRequest, { params: Promise.resolve({ id: 'lp-001' }) })
      const data = await response.json()

      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('lp_number')
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('qa_status')
      expect(data).toHaveProperty('quantity')
      expect(data).toHaveProperty('uom')
      expect(data).toHaveProperty('batch_number')
      expect(data).toHaveProperty('expiry_date')
      expect(data).toHaveProperty('manufacture_date')
      expect(data).toHaveProperty('source')
      expect(data).toHaveProperty('created_at')
      expect(data).toHaveProperty('updated_at')
    })

    it('should handle LP without optional fields', async () => {
      const mockLP = createMockLPDetail({
        batch_number: null,
        expiry_date: null,
        supplier_batch_number: null,
        wo_id: null,
        block_reason: null,
      })
      vi.mocked(getLPDetail).mockResolvedValue(mockLP)

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-minimal')
      )

      const response = await GET(mockRequest, { params: Promise.resolve({ id: 'lp-minimal' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.batch_number).toBeNull()
      expect(data.expiry_date).toBeNull()
    })

    it('should return 401 if not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-001'),
        { headers: { authorization: '' } }
      )

      const response = await GET(mockRequest, { params: Promise.resolve({ id: 'lp-001' }) })

      expect(response.status).toBe(401)
    })

    it('should return 500 on database error', async () => {
      vi.mocked(getLPDetail).mockRejectedValue(new Error('Database error'))

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-error')
      )

      const response = await GET(mockRequest, { params: Promise.resolve({ id: 'lp-error' }) })

      expect(response.status).toBe(500)
    })
  })

  /**
   * Test Group: PUT /api/warehouse/license-plates/:id/block
   * AC-10: Block LP with reason
   */
  describe('PUT /api/warehouse/license-plates/:id/block', () => {
    it('should block LP with valid reason', async () => {
      const mockLP = createMockLPDetail({ status: 'blocked', block_reason: 'Quality issue detected' })
      vi.mocked(blockLP).mockResolvedValue(mockLP)

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-001/block'),
        {
          method: 'PUT',
          body: JSON.stringify({ reason: 'Quality issue detected' }),
        }
      )

      const response = await PUT(mockRequest, {
        params: Promise.resolve({ id: 'lp-001', action: 'block' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('blocked')
      expect(data.block_reason).toBe('Quality issue detected')
    })

    it('should return 400 if reason is missing', async () => {
      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-001/block'),
        {
          method: 'PUT',
          body: JSON.stringify({}),
        }
      )

      const response = await PUT(mockRequest, {
        params: Promise.resolve({ id: 'lp-001', action: 'block' }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Reason is required')
    })

    it('should return 400 if reason exceeds 500 chars', async () => {
      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-001/block'),
        {
          method: 'PUT',
          body: JSON.stringify({ reason: 'x'.repeat(501) }),
        }
      )

      const response = await PUT(mockRequest, {
        params: Promise.resolve({ id: 'lp-001', action: 'block' }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('500 characters')
    })

    it('should return 400 if LP already blocked', async () => {
      vi.mocked(blockLP).mockRejectedValue(new Error('LP cannot be blocked (current status: blocked)'))

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-blocked/block'),
        {
          method: 'PUT',
          body: JSON.stringify({ reason: 'Another issue' }),
        }
      )

      const response = await PUT(mockRequest, {
        params: Promise.resolve({ id: 'lp-blocked', action: 'block' }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('cannot be blocked')
    })

    it('should create transaction log entry on block', async () => {
      const mockLP = createMockLPDetail({ status: 'blocked', block_reason: 'Quality issue' })
      vi.mocked(blockLP).mockResolvedValue(mockLP)

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-001/block'),
        {
          method: 'PUT',
          body: JSON.stringify({ reason: 'Quality issue' }),
        }
      )

      const response = await PUT(mockRequest, {
        params: Promise.resolve({ id: 'lp-001', action: 'block' }),
      })

      expect(response.status).toBe(200)
      // Transaction log should be created by service layer
      expect(vi.mocked(blockLP)).toHaveBeenCalledWith(
        mockSupabase,
        expect.objectContaining({ lpId: 'lp-001', reason: 'Quality issue' })
      )
    })

    it('should return 404 for non-existent LP', async () => {
      vi.mocked(blockLP).mockRejectedValue(new Error('LP not found'))

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/invalid/block'),
        {
          method: 'PUT',
          body: JSON.stringify({ reason: 'Test' }),
        }
      )

      const response = await PUT(mockRequest, {
        params: Promise.resolve({ id: 'invalid', action: 'block' }),
      })

      expect(response.status).toBe(404)
    })
  })

  /**
   * Test Group: PUT /api/warehouse/license-plates/:id/unblock
   * AC-11: Unblock LP
   */
  describe('PUT /api/warehouse/license-plates/:id/unblock', () => {
    it('should unblock LP and clear block_reason', async () => {
      const mockLP = createMockLPDetail({ status: 'available', block_reason: null })
      vi.mocked(unblockLP).mockResolvedValue(mockLP)

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-blocked/unblock'),
        { method: 'PUT' }
      )

      const response = await PUT(mockRequest, {
        params: Promise.resolve({ id: 'lp-blocked', action: 'unblock' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('available')
      expect(data.block_reason).toBeNull()
    })

    it('should return 400 if LP not blocked', async () => {
      vi.mocked(unblockLP).mockRejectedValue(new Error('LP cannot be unblocked (current status: available)'))

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-001/unblock'),
        { method: 'PUT' }
      )

      const response = await PUT(mockRequest, {
        params: Promise.resolve({ id: 'lp-001', action: 'unblock' }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('cannot be unblocked')
    })

    it('should create transaction log entry on unblock', async () => {
      const mockLP = createMockLPDetail({ status: 'available', block_reason: null })
      vi.mocked(unblockLP).mockResolvedValue(mockLP)

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-blocked/unblock'),
        { method: 'PUT' }
      )

      const response = await PUT(mockRequest, {
        params: Promise.resolve({ id: 'lp-blocked', action: 'unblock' }),
      })

      expect(response.status).toBe(200)
      // Transaction log should be created by service layer
      expect(vi.mocked(unblockLP)).toHaveBeenCalledWith(mockSupabase, 'lp-blocked')
    })

    it('should return 404 for non-existent LP', async () => {
      vi.mocked(unblockLP).mockRejectedValue(new Error('LP not found'))

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/invalid/unblock'),
        { method: 'PUT' }
      )

      const response = await PUT(mockRequest, {
        params: Promise.resolve({ id: 'invalid', action: 'unblock' }),
      })

      expect(response.status).toBe(404)
    })
  })

  /**
   * Test Group: GET /api/warehouse/license-plates/:id/transactions
   * Phase 2 Placeholder - Returns empty array
   */
  describe('GET /api/warehouse/license-plates/:id/transactions', () => {
    it('should return empty array for Phase 0', async () => {
      vi.mocked(getLPTransactions).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      })

      mockRequest = new NextRequest(
        new URL(
          'http://localhost/api/warehouse/license-plates/lp-001/transactions'
        )
      )

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: 'lp-001', action: 'transactions' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('data')
      expect(data.data).toEqual([])
      expect(data.total).toBe(0)
    })

    it('should accept pagination parameters', async () => {
      vi.mocked(getLPTransactions).mockResolvedValue({
        data: [],
        total: 0,
        page: 2,
        limit: 20,
      })

      mockRequest = new NextRequest(
        new URL(
          'http://localhost/api/warehouse/license-plates/lp-001/transactions?page=2&limit=20'
        )
      )

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: 'lp-001', action: 'transactions' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.page).toBe(2)
      expect(data.limit).toBe(20)
    })

    it('should default to page 1, limit 10', async () => {
      vi.mocked(getLPTransactions).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      })

      mockRequest = new NextRequest(
        new URL(
          'http://localhost/api/warehouse/license-plates/lp-001/transactions'
        )
      )

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: 'lp-001', action: 'transactions' }),
      })
      const data = await response.json()

      expect(data.page).toBe(1)
      expect(data.limit).toBe(10)
    })
  })

  /**
   * Test Group: RLS Isolation
   * AC-15: Cross-tenant protection
   */
  describe('RLS Isolation', () => {
    it('should not expose LP from another org', async () => {
      vi.mocked(getLPDetail).mockResolvedValue(null)

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-org-b')
      )

      const response = await GET(mockRequest, { params: Promise.resolve({ id: 'lp-org-b' }) })

      expect(response.status).toBe(404)
      expect(await response.json()).toHaveProperty(
        'error',
        'License Plate not found'
      )
    })

    it('should not allow blocking LP from another org', async () => {
      vi.mocked(blockLP).mockRejectedValue(new Error('LP not found'))

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-org-b/block'),
        {
          method: 'PUT',
          body: JSON.stringify({ reason: 'Test' }),
        }
      )

      const response = await PUT(mockRequest, {
        params: Promise.resolve({ id: 'lp-org-b', action: 'block' }),
      })

      expect(response.status).toBe(404)
    })
  })

  /**
   * Test Group: Performance
   * AC-13: Response time requirements
   */
  describe('Performance', () => {
    it('should respond to GET within 200ms', async () => {
      const mockLP = createMockLPDetail()
      vi.mocked(getLPDetail).mockResolvedValue(mockLP)

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-001')
      )

      const startTime = performance.now()
      await GET(mockRequest, { params: Promise.resolve({ id: 'lp-001' }) })
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(200)
    })

    it('should respond to block within 300ms', async () => {
      const mockLP = createMockLPDetail({ status: 'blocked', block_reason: 'Test' })
      vi.mocked(blockLP).mockResolvedValue(mockLP)

      mockRequest = new NextRequest(
        new URL('http://localhost/api/warehouse/license-plates/lp-001/block'),
        {
          method: 'PUT',
          body: JSON.stringify({ reason: 'Test' }),
        }
      )

      const startTime = performance.now()
      await PUT(mockRequest, { params: Promise.resolve({ id: 'lp-001', action: 'block' }) })
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(300)
    })
  })
})
