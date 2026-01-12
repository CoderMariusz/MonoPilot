/**
 * Stock Moves API Integration Tests (Story 05.16)
 * Purpose: Test API routes for stock move operations
 *
 * Tests the API endpoints:
 * - GET /api/warehouse/stock-moves - List with filters
 * - POST /api/warehouse/stock-moves - Create stock move
 * - GET /api/warehouse/stock-moves/:id - Get by ID
 * - POST /api/warehouse/stock-moves/:id/cancel - Cancel move
 * - GET /api/warehouse/license-plates/:id/movements - LP movement history
 *
 * Coverage Target: 80%+
 * Test Count: 35+ scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase - define before vi.mock
vi.mock('@/lib/supabase/server', () => {
  const mockUser = {
    id: 'user-001',
    email: 'test@example.com',
  }

  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  }

  return {
    createServerSupabase: vi.fn().mockResolvedValue(mockSupabaseClient),
    __mockSupabaseClient: mockSupabaseClient,
    __mockUser: mockUser,
  }
})

// Mock StockMoveService
vi.mock('@/lib/services/stock-move-service', () => ({
  StockMoveService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    cancel: vi.fn(),
    getLPMovementHistory: vi.fn(),
  },
}))

import { GET, POST } from '@/app/api/warehouse/stock-moves/route'
import { GET as GET_BY_ID } from '@/app/api/warehouse/stock-moves/[id]/route'
import { POST as CANCEL } from '@/app/api/warehouse/stock-moves/[id]/cancel/route'
import { GET as GET_LP_MOVEMENTS } from '@/app/api/warehouse/license-plates/[id]/movements/route'
import { StockMoveService } from '@/lib/services/stock-move-service'
import * as serverModule from '@/lib/supabase/server'

// Get mock references after import
const { __mockSupabaseClient: mockSupabaseClient, __mockUser: mockUser } = serverModule as any

describe('Stock Moves API Routes (Story 05.16)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (mockSupabaseClient?.auth?.getUser) {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
    }
  })

  // ==========================================================================
  // GET /api/warehouse/stock-moves
  // ==========================================================================
  describe('GET /api/warehouse/stock-moves', () => {
    it('should return 401 if not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return paginated stock moves (AC-12)', async () => {
      const mockResult = {
        data: [
          { id: 'move-001', move_number: 'SM-2025-00001', move_type: 'transfer' },
          { id: 'move-002', move_number: 'SM-2025-00002', move_type: 'adjustment' },
        ],
        pagination: { page: 1, limit: 50, total: 2, total_pages: 1 },
      }

      vi.mocked(StockMoveService.list).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves')
      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.data).toHaveLength(2)
      expect(body.meta.page).toBe(1)
    })

    it('should filter by move type', async () => {
      const mockResult = {
        data: [{ id: 'move-001', move_type: 'transfer' }],
        pagination: { page: 1, limit: 50, total: 1, total_pages: 1 },
      }

      vi.mocked(StockMoveService.list).mockResolvedValue(mockResult)

      const request = new NextRequest(
        'http://localhost/api/warehouse/stock-moves?moveType=transfer'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(StockMoveService.list).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ moveType: 'transfer' })
      )
    })

    it('should filter by LP ID', async () => {
      const mockResult = {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, total_pages: 0 },
      }

      vi.mocked(StockMoveService.list).mockResolvedValue(mockResult)

      const lpId = '11111111-1111-1111-1111-111111111111'
      const request = new NextRequest(
        `http://localhost/api/warehouse/stock-moves?lpId=${lpId}`
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(StockMoveService.list).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ lpId })
      )
    })

    it('should filter by date range', async () => {
      const mockResult = {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, total_pages: 0 },
      }

      vi.mocked(StockMoveService.list).mockResolvedValue(mockResult)

      const request = new NextRequest(
        'http://localhost/api/warehouse/stock-moves?dateFrom=2025-01-01&dateTo=2025-01-31'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(StockMoveService.list).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ dateFrom: '2025-01-01', dateTo: '2025-01-31' })
      )
    })

    it('should filter by location', async () => {
      const mockResult = {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, total_pages: 0 },
      }

      vi.mocked(StockMoveService.list).mockResolvedValue(mockResult)

      const locationId = '22222222-2222-2222-2222-222222222222'
      const request = new NextRequest(
        `http://localhost/api/warehouse/stock-moves?locationId=${locationId}`
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(StockMoveService.list).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ locationId })
      )
    })

    it('should search by move number', async () => {
      const mockResult = {
        data: [{ id: 'move-001', move_number: 'SM-2025-00042' }],
        pagination: { page: 1, limit: 50, total: 1, total_pages: 1 },
      }

      vi.mocked(StockMoveService.list).mockResolvedValue(mockResult)

      const request = new NextRequest(
        'http://localhost/api/warehouse/stock-moves?search=SM-2025-00042'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(StockMoveService.list).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ search: 'SM-2025-00042' })
      )
    })

    it('should handle pagination params', async () => {
      const mockResult = {
        data: [],
        pagination: { page: 2, limit: 25, total: 50, total_pages: 2 },
      }

      vi.mocked(StockMoveService.list).mockResolvedValue(mockResult)

      const request = new NextRequest(
        'http://localhost/api/warehouse/stock-moves?page=2&limit=25'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(StockMoveService.list).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ page: 2, limit: 25 })
      )
    })
  })

  // ==========================================================================
  // POST /api/warehouse/stock-moves
  // ==========================================================================
  describe('POST /api/warehouse/stock-moves', () => {
    it('should return 401 if not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should create transfer move (AC-3)', async () => {
      const mockMove = {
        id: 'move-001',
        move_number: 'SM-2025-00001',
        move_type: 'transfer',
        status: 'completed',
      }

      vi.mocked(StockMoveService.create).mockResolvedValue(mockMove as any)

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves', {
        method: 'POST',
        body: JSON.stringify({
          lpId: '11111111-1111-1111-1111-111111111111',
          moveType: 'transfer',
          toLocationId: '22222222-2222-2222-2222-222222222222',
        }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(201)
      expect(body.move_type).toBe('transfer')
    })

    it('should create adjustment move (AC-8)', async () => {
      const mockMove = {
        id: 'move-001',
        move_type: 'adjustment',
        reason_code: 'damage',
      }

      vi.mocked(StockMoveService.create).mockResolvedValue(mockMove as any)

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves', {
        method: 'POST',
        body: JSON.stringify({
          lpId: '11111111-1111-1111-1111-111111111111',
          moveType: 'adjustment',
          quantity: -5,
          reasonCode: 'damage',
          reason: 'Damaged packaging',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('should return 400 for validation error', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/stock-moves', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 if LP not available', async () => {
      vi.mocked(StockMoveService.create).mockRejectedValue(
        new Error('LP not available for movement (status: consumed)')
      )

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves', {
        method: 'POST',
        body: JSON.stringify({
          lpId: '11111111-1111-1111-1111-111111111111',
          moveType: 'transfer',
          toLocationId: '22222222-2222-2222-2222-222222222222',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 if quantity exceeds available', async () => {
      vi.mocked(StockMoveService.create).mockRejectedValue(
        new Error('Move quantity exceeds available quantity')
      )

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves', {
        method: 'POST',
        body: JSON.stringify({
          lpId: '11111111-1111-1111-1111-111111111111',
          moveType: 'transfer',
          toLocationId: '22222222-2222-2222-2222-222222222222',
          quantity: 1000,
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 if destination location invalid', async () => {
      vi.mocked(StockMoveService.create).mockRejectedValue(
        new Error('Destination location not available')
      )

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves', {
        method: 'POST',
        body: JSON.stringify({
          lpId: '11111111-1111-1111-1111-111111111111',
          moveType: 'transfer',
          toLocationId: '33333333-3333-3333-3333-333333333333',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 404 if LP not found', async () => {
      vi.mocked(StockMoveService.create).mockRejectedValue(
        new Error('LP not found')
      )

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves', {
        method: 'POST',
        body: JSON.stringify({
          lpId: '44444444-4444-4444-4444-444444444444',
          moveType: 'transfer',
          toLocationId: '22222222-2222-2222-2222-222222222222',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(404)
    })
  })

  // ==========================================================================
  // GET /api/warehouse/stock-moves/:id
  // ==========================================================================
  describe('GET /api/warehouse/stock-moves/:id', () => {
    it('should return 401 if not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves/move-001')
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'move-001' }) })

      expect(response.status).toBe(401)
    })

    it('should return stock move by ID', async () => {
      const mockMove = {
        id: 'move-001',
        move_number: 'SM-2025-00001',
        move_type: 'transfer',
        license_plate: { lp_number: 'LP00000001' },
      }

      vi.mocked(StockMoveService.getById).mockResolvedValue(mockMove as any)

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves/move-001')
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'move-001' }) })
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.id).toBe('move-001')
    })

    it('should return 404 if stock move not found', async () => {
      vi.mocked(StockMoveService.getById).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves/nonexistent')
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'nonexistent' }) })

      expect(response.status).toBe(404)
    })
  })

  // ==========================================================================
  // POST /api/warehouse/stock-moves/:id/cancel
  // ==========================================================================
  describe('POST /api/warehouse/stock-moves/:id/cancel', () => {
    it('should return 401 if not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves/move-001/cancel', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Test cancellation' }),
      })
      const response = await CANCEL(request, { params: Promise.resolve({ id: 'move-001' }) })

      expect(response.status).toBe(401)
    })

    it('should cancel stock move (AC-11)', async () => {
      const mockMove = {
        id: 'move-001',
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      }

      vi.mocked(StockMoveService.cancel).mockResolvedValue(mockMove as any)

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves/move-001/cancel', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Moved to wrong location' }),
      })
      const response = await CANCEL(request, { params: Promise.resolve({ id: 'move-001' }) })
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.status).toBe('cancelled')
    })

    it('should return 400 for validation error (reason too short)', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/stock-moves/move-001/cancel', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Short' }), // Less than 10 chars
      })
      const response = await CANCEL(request, { params: Promise.resolve({ id: 'move-001' }) })

      expect(response.status).toBe(400)
    })

    it('should return 404 if stock move not found', async () => {
      vi.mocked(StockMoveService.cancel).mockRejectedValue(
        new Error('Stock move not found')
      )

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves/nonexistent/cancel', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Valid cancellation reason' }),
      })
      const response = await CANCEL(request, { params: Promise.resolve({ id: 'nonexistent' }) })

      expect(response.status).toBe(404)
    })

    it('should return 400 if move already cancelled', async () => {
      vi.mocked(StockMoveService.cancel).mockRejectedValue(
        new Error('Move already cancelled')
      )

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves/move-001/cancel', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Valid cancellation reason' }),
      })
      const response = await CANCEL(request, { params: Promise.resolve({ id: 'move-001' }) })

      expect(response.status).toBe(400)
    })

    it('should return 400 if move is older than 24 hours', async () => {
      vi.mocked(StockMoveService.cancel).mockRejectedValue(
        new Error('Cannot cancel moves older than 24 hours')
      )

      const request = new NextRequest('http://localhost/api/warehouse/stock-moves/move-001/cancel', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Valid cancellation reason' }),
      })
      const response = await CANCEL(request, { params: Promise.resolve({ id: 'move-001' }) })

      expect(response.status).toBe(400)
    })
  })

  // ==========================================================================
  // GET /api/warehouse/license-plates/:id/movements
  // ==========================================================================
  describe('GET /api/warehouse/license-plates/:id/movements', () => {
    it('should return 401 if not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new NextRequest('http://localhost/api/warehouse/license-plates/lp-001/movements')
      const response = await GET_LP_MOVEMENTS(request, { params: Promise.resolve({ id: 'lp-001' }) })

      expect(response.status).toBe(401)
    })

    it('should return LP movement history (AC-13)', async () => {
      const mockMoves = [
        { id: 'move-003', move_type: 'transfer', move_date: '2025-01-10T15:00:00Z' },
        { id: 'move-002', move_type: 'putaway', move_date: '2025-01-09T10:00:00Z' },
        { id: 'move-001', move_type: 'receipt', move_date: '2025-01-08T08:00:00Z' },
      ]

      vi.mocked(StockMoveService.getLPMovementHistory).mockResolvedValue(mockMoves as any)

      const request = new NextRequest('http://localhost/api/warehouse/license-plates/lp-001/movements')
      const response = await GET_LP_MOVEMENTS(request, { params: Promise.resolve({ id: 'lp-001' }) })
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.data).toHaveLength(3)
    })

    it('should respect limit param', async () => {
      vi.mocked(StockMoveService.getLPMovementHistory).mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/warehouse/license-plates/lp-001/movements?limit=10')
      await GET_LP_MOVEMENTS(request, { params: Promise.resolve({ id: 'lp-001' }) })

      expect(StockMoveService.getLPMovementHistory).toHaveBeenCalledWith(
        expect.anything(),
        'lp-001',
        10
      )
    })

    it('should cap limit at 200', async () => {
      vi.mocked(StockMoveService.getLPMovementHistory).mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/warehouse/license-plates/lp-001/movements?limit=500')
      await GET_LP_MOVEMENTS(request, { params: Promise.resolve({ id: 'lp-001' }) })

      expect(StockMoveService.getLPMovementHistory).toHaveBeenCalledWith(
        expect.anything(),
        'lp-001',
        200
      )
    })

    it('should return empty array if no movements', async () => {
      vi.mocked(StockMoveService.getLPMovementHistory).mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/warehouse/license-plates/lp-new/movements')
      const response = await GET_LP_MOVEMENTS(request, { params: Promise.resolve({ id: 'lp-new' }) })
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.data).toEqual([])
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * GET /api/warehouse/stock-moves - 8 tests:
 *   - Auth check
 *   - Paginated results (AC-12)
 *   - Filter by move type
 *   - Filter by LP ID
 *   - Filter by date range
 *   - Filter by location
 *   - Search by move number
 *   - Pagination params
 *
 * POST /api/warehouse/stock-moves - 7 tests:
 *   - Auth check
 *   - Create transfer (AC-3)
 *   - Create adjustment (AC-8)
 *   - Validation error
 *   - LP not available
 *   - Quantity exceeds
 *   - Location invalid
 *   - LP not found
 *
 * GET /api/warehouse/stock-moves/:id - 3 tests:
 *   - Auth check
 *   - Return by ID
 *   - Not found
 *
 * POST /api/warehouse/stock-moves/:id/cancel - 6 tests:
 *   - Auth check
 *   - Cancel success (AC-11)
 *   - Validation error
 *   - Not found
 *   - Already cancelled
 *   - Older than 24 hours
 *
 * GET /api/warehouse/license-plates/:id/movements - 5 tests:
 *   - Auth check
 *   - Return history (AC-13)
 *   - Limit param
 *   - Cap at 200
 *   - Empty array
 *
 * Total: 29 tests
 * Coverage: 80%+
 */
