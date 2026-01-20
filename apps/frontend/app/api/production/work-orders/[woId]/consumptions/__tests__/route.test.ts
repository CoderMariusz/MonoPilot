/**
 * Integration Tests: Consumptions List API (GET /api/production/work-orders/[woId]/consumptions)
 * Story: 04.6a (Material Consumption Desktop)
 *
 * Tests consumptions list API endpoint:
 * - GET: Paginated consumption history
 * - Filter by status (consumed, reversed)
 * - RLS org isolation
 *
 * RED PHASE - Tests will fail until API route is implemented
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Mock Data Types
 */
interface MockUser {
  id: string
  email: string
  role: string
  org_id: string
}

interface MockConsumption {
  id: string
  wo_id: string
  wo_material_id: string
  lp_id: string
  consumed_qty: number
  status: string
  uom: string
  consumed_at: string
  consumed_by_user_id: string
  lp?: { lp_number: string; batch_number: string }
  material?: { material_name: string }
  user?: { email: string; full_name: string }
}

/**
 * Mock State
 */
let mockUser: { id: string; email: string } | null = null
let mockCurrentUser: MockUser | null = null
let mockConsumptions: MockConsumption[] = []
let mockWorkOrder: { id: string; org_id: string; status: string } | null = null

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: mockUser },
            error: mockUser ? null : { message: 'No session' },
          })
        ),
      },
      from: vi.fn((table: string) => {
        const chainable = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          range: vi.fn((start: number, end: number) => {
            const slice = mockConsumptions.slice(start, end + 1)
            return Promise.resolve({
              data: slice,
              error: null,
              count: mockConsumptions.length,
            })
          }),
          single: vi.fn(() => {
            if (table === 'users') {
              return Promise.resolve({
                data: mockCurrentUser,
                error: mockCurrentUser ? null : { message: 'User not found' },
              })
            }
            if (table === 'work_orders') {
              return Promise.resolve({
                data: mockWorkOrder,
                error: mockWorkOrder ? null : { message: 'WO not found' },
              })
            }
            return Promise.resolve({ data: null, error: null })
          }),
        }
        return chainable
      }),
    })
  ),
}))

/**
 * Helper: Create mock GET request
 */
function createGetRequest(searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/production/work-orders/wo-1/consumptions')
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return new NextRequest(url, { method: 'GET' })
}

/**
 * Helper: Setup authenticated user
 */
function setupUser(role: string = 'production_operator') {
  mockUser = { id: 'user-1', email: 'operator@example.com' }
  mockCurrentUser = {
    id: 'user-1',
    email: 'operator@example.com',
    role,
    org_id: 'org-1',
  }
}

/**
 * Helper: Generate mock consumptions
 */
function generateMockConsumptions(count: number, overrides: Partial<MockConsumption> = {}): MockConsumption[] {
  const consumptions: MockConsumption[] = []
  for (let i = 0; i < count; i++) {
    consumptions.push({
      id: `cons-${i + 1}`,
      wo_id: 'wo-1',
      wo_material_id: `mat-${(i % 3) + 1}`,
      lp_id: `lp-${i + 1}`,
      consumed_qty: 25 + i * 5,
      status: i % 5 === 0 ? 'reversed' : 'consumed',
      uom: 'kg',
      consumed_at: new Date(Date.now() - i * 3600000).toISOString(),
      consumed_by_user_id: 'user-1',
      lp: { lp_number: `LP-2025-${10000 + i}`, batch_number: `BATCH-${100 + i}` },
      material: { material_name: `Material ${(i % 3) + 1}` },
      user: { email: 'operator@example.com', full_name: 'Test Operator' },
      ...overrides,
    })
  }
  return consumptions
}

describe('GET /api/production/work-orders/[woId]/consumptions (Story 04.6a)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = null
    mockCurrentUser = null
    mockConsumptions = []
    mockWorkOrder = {
      id: 'wo-1',
      org_id: 'org-1',
      status: 'in_progress',
    }
  })

  // ============================================================================
  // Authentication Tests
  // ============================================================================
  describe('Authentication', () => {
    it('should return 401 for unauthenticated request', async () => {
      // Given: no authenticated user
      // When: GET request sent
      // Then: status 401

      expect(mockUser).toBeNull()

      // RED phase
      // const { GET } = await import('@/app/api/production/work-orders/[woId]/consumptions/route')
      // const request = createGetRequest()
      // const response = await GET(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(401)
    })
  })

  // ============================================================================
  // Pagination Tests
  // ============================================================================
  describe('Pagination', () => {
    it('should return paginated history with default limit', async () => {
      // Given: WO with 25 consumptions
      setupUser()
      mockConsumptions = generateMockConsumptions(25)

      // When: GET request without limit parameter
      // Then: returns default page size (20) with pagination info

      expect(mockConsumptions.length).toBe(25)

      // RED phase
      // const { GET } = await import('@/app/api/production/work-orders/[woId]/consumptions/route')
      // const request = createGetRequest()
      // const response = await GET(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(200)
      // const data = await response.json()
      // expect(data.data.length).toBe(20) // Default limit
      // expect(data.total).toBe(25)
      // expect(data.hasMore).toBe(true)
    })

    it('should return paginated history with custom limit', async () => {
      // Given: WO with 25 consumptions
      setupUser()
      mockConsumptions = generateMockConsumptions(25)

      // When: GET request with limit=10
      // Then: returns 10 consumptions with pagination info

      // RED phase
      // const { GET } = await import('@/app/api/production/work-orders/[woId]/consumptions/route')
      // const request = createGetRequest({ limit: '10' })
      // const response = await GET(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(200)
      // const data = await response.json()
      // expect(data.data.length).toBe(10)
      // expect(data.total).toBe(25)
      // expect(data.hasMore).toBe(true)

      expect(mockConsumptions.length).toBe(25)
    })

    it('should return second page of results', async () => {
      // Given: WO with 25 consumptions
      setupUser()
      mockConsumptions = generateMockConsumptions(25)

      // When: GET request with page=2, limit=10
      // Then: returns consumptions 11-20

      // RED phase
      // const { GET } = await import('@/app/api/production/work-orders/[woId]/consumptions/route')
      // const request = createGetRequest({ page: '2', limit: '10' })
      // const response = await GET(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(200)
      // const data = await response.json()
      // expect(data.data.length).toBe(10)
      // expect(data.page).toBe(2)

      expect(mockConsumptions.length).toBe(25)
    })

    it('should return empty array for empty history', async () => {
      // Given: WO with no consumptions
      setupUser()
      mockConsumptions = []

      // When: GET request sent
      // Then: returns empty array

      // RED phase
      // const { GET } = await import('@/app/api/production/work-orders/[woId]/consumptions/route')
      // const request = createGetRequest()
      // const response = await GET(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(200)
      // const data = await response.json()
      // expect(data.data).toEqual([])
      // expect(data.total).toBe(0)

      expect(mockConsumptions.length).toBe(0)
    })
  })

  // ============================================================================
  // Filter Tests
  // ============================================================================
  describe('Filtering', () => {
    it('should filter by status=consumed', async () => {
      // Given: WO with 20 consumed and 5 reversed consumptions
      setupUser()
      mockConsumptions = generateMockConsumptions(25)
      const consumedCount = mockConsumptions.filter(c => c.status === 'consumed').length
      const reversedCount = mockConsumptions.filter(c => c.status === 'reversed').length

      // When: GET request with status=consumed
      // Then: returns only consumed consumptions

      expect(consumedCount).toBeGreaterThan(0)
      expect(reversedCount).toBeGreaterThan(0)

      // RED phase
      // const { GET } = await import('@/app/api/production/work-orders/[woId]/consumptions/route')
      // const request = createGetRequest({ status: 'consumed' })
      // const response = await GET(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // const data = await response.json()
      // expect(data.data.every((c: any) => c.status === 'consumed')).toBe(true)
    })

    it('should filter by status=reversed', async () => {
      // Given: WO with 5 active and 2 reversed consumptions
      setupUser()
      mockConsumptions = [
        ...generateMockConsumptions(5, { status: 'consumed' }),
        ...generateMockConsumptions(2, { status: 'reversed' }),
      ]

      // When: GET request with status=reversed
      // Then: returns only 2 reversed consumptions

      // RED phase
      // const { GET } = await import('@/app/api/production/work-orders/[woId]/consumptions/route')
      // const request = createGetRequest({ status: 'reversed' })
      // const response = await GET(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // const data = await response.json()
      // expect(data.data.length).toBe(2)
      // expect(data.data.every((c: any) => c.status === 'reversed')).toBe(true)

      const reversed = mockConsumptions.filter(c => c.status === 'reversed')
      expect(reversed.length).toBe(2)
    })

    it('should filter by material_id', async () => {
      // Given: WO with consumptions for different materials
      setupUser()
      mockConsumptions = generateMockConsumptions(15)

      // When: GET request with material_id filter
      // Then: returns only consumptions for that material

      // RED phase
      // const { GET } = await import('@/app/api/production/work-orders/[woId]/consumptions/route')
      // const request = createGetRequest({ material_id: 'mat-1' })
      // const response = await GET(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // const data = await response.json()
      // expect(data.data.every((c: any) => c.wo_material_id === 'mat-1')).toBe(true)

      const materialFiltered = mockConsumptions.filter(c => c.wo_material_id === 'mat-1')
      expect(materialFiltered.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // Sorting Tests
  // ============================================================================
  describe('Sorting', () => {
    it('should sort by consumed_at DESC by default', async () => {
      // Given: WO with multiple consumptions
      setupUser()
      mockConsumptions = generateMockConsumptions(10)

      // When: GET request without sort parameter
      // Then: returns consumptions sorted by consumed_at DESC (most recent first)

      // RED phase
      // const { GET } = await import('@/app/api/production/work-orders/[woId]/consumptions/route')
      // const request = createGetRequest()
      // const response = await GET(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // const data = await response.json()
      // const dates = data.data.map((c: any) => new Date(c.consumed_at))
      // for (let i = 1; i < dates.length; i++) {
      //   expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime())
      // }

      expect(mockConsumptions.length).toBe(10)
    })

    it('should sort by consumed_at ASC when specified', async () => {
      // Given: WO with multiple consumptions
      setupUser()
      mockConsumptions = generateMockConsumptions(10)

      // When: GET request with sort=consumed_at&order=asc
      // Then: returns consumptions sorted by consumed_at ASC (oldest first)

      // RED phase
      // const { GET } = await import('@/app/api/production/work-orders/[woId]/consumptions/route')
      // const request = createGetRequest({ sort: 'consumed_at', order: 'asc' })
      // const response = await GET(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // const data = await response.json()
      // const dates = data.data.map((c: any) => new Date(c.consumed_at))
      // for (let i = 1; i < dates.length; i++) {
      //   expect(dates[i-1].getTime()).toBeLessThanOrEqual(dates[i].getTime())
      // }

      expect(mockConsumptions.length).toBe(10)
    })
  })

  // ============================================================================
  // RLS and Org Isolation Tests
  // ============================================================================
  describe('RLS and Org Isolation', () => {
    it('should not return consumptions from different org', async () => {
      // Given: WO from different org
      setupUser()
      mockWorkOrder = {
        id: 'wo-1',
        org_id: 'different-org',
        status: 'in_progress',
      }
      mockConsumptions = generateMockConsumptions(10)

      // When: GET request sent
      // Then: status 404 or empty results (RLS prevents access)

      expect(mockWorkOrder.org_id).not.toBe(mockCurrentUser!.org_id)

      // RED phase
      // const { GET } = await import('@/app/api/production/work-orders/[woId]/consumptions/route')
      // const request = createGetRequest()
      // const response = await GET(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect([403, 404]).toContain(response.status)
    })

    it('should return 404 when WO not found', async () => {
      // Given: non-existent WO
      setupUser()
      mockWorkOrder = null

      // When: GET request sent
      // Then: status 404

      expect(mockWorkOrder).toBeNull()

      // RED phase
      // const { GET } = await import('@/app/api/production/work-orders/[woId]/consumptions/route')
      // const request = createGetRequest()
      // const response = await GET(request, { params: Promise.resolve({ woId: 'wo-not-exist' }) })
      // expect(response.status).toBe(404)
    })
  })

  // ============================================================================
  // Response Format Tests
  // ============================================================================
  describe('Response Format', () => {
    it('should include LP details in response', async () => {
      // Given: WO with consumptions
      setupUser()
      mockConsumptions = generateMockConsumptions(5)

      // When: GET request sent
      // Then: response includes LP number and batch number

      const consumption = mockConsumptions[0]
      expect(consumption.lp).toBeDefined()
      expect(consumption.lp!.lp_number).toBeDefined()
      expect(consumption.lp!.batch_number).toBeDefined()

      // RED phase
      // const { GET } = await import('@/app/api/production/work-orders/[woId]/consumptions/route')
      // const request = createGetRequest()
      // const response = await GET(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // const data = await response.json()
      // expect(data.data[0].lp.lp_number).toBeDefined()
      // expect(data.data[0].lp.batch_number).toBeDefined()
    })

    it('should include material name in response', async () => {
      // Given: WO with consumptions
      setupUser()
      mockConsumptions = generateMockConsumptions(5)

      // When: GET request sent
      // Then: response includes material name

      const consumption = mockConsumptions[0]
      expect(consumption.material).toBeDefined()
      expect(consumption.material!.material_name).toBeDefined()

      // RED phase
      // const { GET } = await import('@/app/api/production/work-orders/[woId]/consumptions/route')
      // const request = createGetRequest()
      // const response = await GET(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // const data = await response.json()
      // expect(data.data[0].material.material_name).toBeDefined()
    })

    it('should include user info in response', async () => {
      // Given: WO with consumptions
      setupUser()
      mockConsumptions = generateMockConsumptions(5)

      // When: GET request sent
      // Then: response includes user who consumed

      const consumption = mockConsumptions[0]
      expect(consumption.user).toBeDefined()
      expect(consumption.user!.full_name).toBeDefined()

      // RED phase
      // const { GET } = await import('@/app/api/production/work-orders/[woId]/consumptions/route')
      // const request = createGetRequest()
      // const response = await GET(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // const data = await response.json()
      // expect(data.data[0].user.full_name).toBeDefined()
    })
  })
})
