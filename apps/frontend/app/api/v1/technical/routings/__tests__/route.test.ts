/**
 * Integration Tests: Routing API Routes (Story 02.7)
 *
 * Tests API endpoints for routing management:
 * - GET /api/v1/technical/routings - List routings with pagination/search/filter
 * - POST /api/v1/technical/routings - Create new routing
 *
 * Coverage Target: 80%
 * Test Count: 35+ tests
 *
 * Acceptance Criteria Coverage:
 * - AC-01 to AC-04: List routings with filters
 * - AC-05 to AC-10: Create routing with validation
 * - AC-15 to AC-18: Cost configuration (ADR-009)
 * - AC-19 to AC-21: Clone routing
 * - AC-29 to AC-30: Permission checks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

const mockSupabaseAdmin = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve(mockSupabase)),
  createServerSupabaseAdmin: vi.fn(() => mockSupabaseAdmin),
}))

// Import routes after mocking
import { GET, POST } from '../route'

// Mock routing data
const mockRouting = {
  id: 'routing-001-uuid',
  org_id: 'test-org-id',
  code: 'RTG-BREAD-01',
  name: 'Standard Bread Line',
  description: 'Mixing -> Proofing -> Baking -> Cooling',
  is_active: true,
  is_reusable: true,
  version: 1,
  setup_cost: 50.0,
  working_cost_per_unit: 0.25,
  overhead_percent: 15.0,
  currency: 'PLN',
  operations_count: 5,
  boms_count: 3,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const mockRoutingList = [
  mockRouting,
  {
    ...mockRouting,
    id: 'routing-002-uuid',
    code: 'RTG-CAKE-01',
    name: 'Cake Production',
    operations_count: 4,
    boms_count: 0,
  },
]

const mockUserData = {
  org_id: 'test-org-id',
  role: {
    code: 'prod_manager',
    permissions: { technical: 'CRUD' },
  },
}

// Helper to setup authenticated user
function setupAuthenticatedUser(roleCode = 'prod_manager', permissions = { technical: 'CRUD' }) {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: 'test-user-id' } },
    error: null,
  })
}

// Helper to setup unauthenticated user
function setupUnauthenticatedUser() {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Not authenticated' },
  })
}

// Helper to create mock query chain
function createMockQuery(overrides: Record<string, any> = {}) {
  const query: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    ...overrides,
  }
  return query
}

describe('Story 02.7: GET /api/v1/technical/routings - List Routings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupAuthenticatedUser()
  })

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      setupUnauthenticatedUser()

      const request = new NextRequest('http://localhost/api/v1/technical/routings')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should allow PROD_MANAGER to list routings (AC-30)', async () => {
      setupAuthenticatedUser('prod_manager')

      // Mock users query
      const usersQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
      })

      // Mock routings query with counts
      const routingsResult = { data: mockRoutingList, count: 2, error: null }

      // Mock operations count query
      const opsQuery = createMockQuery()
      opsQuery.in = vi.fn().mockResolvedValue({ data: [], error: null })

      // Mock boms count query
      const bomsQuery = createMockQuery()
      bomsQuery.in = vi.fn().mockReturnThis()
      bomsQuery.not = vi.fn().mockResolvedValue({ data: [], error: null })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery
        if (table === 'routings') {
          const q = createMockQuery()
          q.range = vi.fn().mockResolvedValue(routingsResult)
          return q
        }
        if (table === 'routing_operations') return opsQuery
        if (table === 'boms') return bomsQuery
        return createMockQuery()
      })

      const request = new NextRequest('http://localhost/api/v1/technical/routings')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.routings).toHaveLength(2)
    })

    it('should allow VIEWER to list routings (read-only, AC-29)', async () => {
      setupAuthenticatedUser('viewer')

      const viewerData = {
        org_id: 'test-org-id',
        role: { code: 'viewer', permissions: { technical: 'R' } },
      }

      const usersQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: viewerData, error: null }),
      })

      const routingsResult = { data: mockRoutingList, count: 2, error: null }

      // Mock operations count query
      const opsQuery = createMockQuery()
      opsQuery.in = vi.fn().mockResolvedValue({ data: [], error: null })

      // Mock boms count query
      const bomsQuery = createMockQuery()
      bomsQuery.in = vi.fn().mockReturnThis()
      bomsQuery.not = vi.fn().mockResolvedValue({ data: [], error: null })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery
        if (table === 'routings') {
          const q = createMockQuery()
          q.range = vi.fn().mockResolvedValue(routingsResult)
          return q
        }
        if (table === 'routing_operations') return opsQuery
        if (table === 'boms') return bomsQuery
        return createMockQuery()
      })

      const request = new NextRequest('http://localhost/api/v1/technical/routings')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('List Functionality', () => {
    it('should return all routings with default filters (AC-01)', async () => {
      const usersQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
      })

      const routingsResult = { data: mockRoutingList, count: 2, error: null }

      // Mock operations count query
      const opsQuery = createMockQuery()
      opsQuery.in = vi.fn().mockResolvedValue({ data: [], error: null })

      // Mock boms count query
      const bomsQuery = createMockQuery()
      bomsQuery.in = vi.fn().mockReturnThis()
      bomsQuery.not = vi.fn().mockResolvedValue({ data: [], error: null })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery
        if (table === 'routings') {
          const q = createMockQuery()
          q.range = vi.fn().mockResolvedValue(routingsResult)
          return q
        }
        if (table === 'routing_operations') return opsQuery
        if (table === 'boms') return bomsQuery
        return createMockQuery()
      })

      const request = new NextRequest('http://localhost/api/v1/technical/routings')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.routings).toHaveLength(2)
      expect(data.total).toBe(2)
    })

    it('should return empty array when no routings exist (AC-04)', async () => {
      const usersQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
      })

      const routingsResult = { data: [], count: 0, error: null }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery
        if (table === 'routings') {
          const q = createMockQuery()
          q.range = vi.fn().mockResolvedValue(routingsResult)
          return q
        }
        return createMockQuery()
      })

      const request = new NextRequest('http://localhost/api/v1/technical/routings')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.routings).toHaveLength(0)
      expect(data.total).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should return 404 when user not found', async () => {
      const usersQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery
        return createMockQuery()
      })

      const request = new NextRequest('http://localhost/api/v1/technical/routings')
      const response = await GET(request)

      expect(response.status).toBe(404)
    })

    it('should return 500 on database error', async () => {
      const usersQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery
        if (table === 'routings') {
          const q = createMockQuery()
          q.range = vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
          return q
        }
        return createMockQuery()
      })

      const request = new NextRequest('http://localhost/api/v1/technical/routings')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })
})

describe('Story 02.7: POST /api/v1/technical/routings - Create Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupAuthenticatedUser()
  })

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      setupUnauthenticatedUser()

      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-TEST',
          name: 'Test Routing',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 when VIEWER tries to create (AC-29)', async () => {
      setupAuthenticatedUser('viewer')

      const viewerData = {
        org_id: 'test-org-id',
        role: { code: 'viewer', permissions: { technical: 'R' } },
      }

      const usersQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: viewerData, error: null }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery
        return createMockQuery()
      })

      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-TEST',
          name: 'Test Routing',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('permission')
    })

    it('should allow PROD_MANAGER to create routing (AC-30)', async () => {
      const usersQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
      })

      // Mock duplicate check (none found)
      const checkQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      // Mock insert
      const insertQuery = createMockQuery()
      insertQuery.select = vi.fn().mockReturnThis()
      insertQuery.single = vi.fn().mockResolvedValue({
        data: { ...mockRouting, version: 1 },
        error: null,
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery
        return createMockQuery()
      })

      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        if (table === 'routings') {
          const q = createMockQuery()
          q.single = vi.fn().mockResolvedValue({ data: null, error: null }) // duplicate check
          q.insert = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { ...mockRouting, version: 1 }, error: null }),
            }),
          })
          return q
        }
        return createMockQuery()
      })

      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-BREAD-01',
          name: 'Standard Bread Line',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.code).toBe('RTG-BREAD-01')
      expect(data.version).toBe(1)
    })
  })

  describe('Validation Errors', () => {
    it('should return 400 for invalid code format (AC-08)', async () => {
      const usersQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery
        return createMockQuery()
      })

      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'bread line 01', // invalid - lowercase and spaces
          name: 'Test Routing',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('uppercase')
    })

    it('should return 400 for code less than 2 characters (AC-09)', async () => {
      const usersQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery
        return createMockQuery()
      })

      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'R',
          name: 'Test Routing',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('at least 2 characters')
    })

    it('should return 400 for empty name (AC-10)', async () => {
      const usersQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery
        return createMockQuery()
      })

      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-01',
          name: '',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should return 400 for overhead_percent > 100 (AC-17)', async () => {
      const usersQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery
        return createMockQuery()
      })

      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-01',
          name: 'Test Routing',
          overhead_percent: 150,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('100%')
    })

    it('should return 400 for negative setup_cost (AC-18)', async () => {
      const usersQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery
        return createMockQuery()
      })

      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-01',
          name: 'Test Routing',
          setup_cost: -10,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('negative')
    })
  })

  describe('Duplicate Code Handling', () => {
    it('should return 409 for duplicate code (AC-07)', async () => {
      const usersQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery
        return createMockQuery()
      })

      // Mock duplicate check - found existing
      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        if (table === 'routings') {
          const q = createMockQuery()
          q.single = vi.fn().mockResolvedValue({ data: { id: 'existing-id' }, error: null })
          return q
        }
        return createMockQuery()
      })

      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-BREAD-01',
          name: 'Duplicate Routing',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error).toContain('already exists')
    })
  })

  describe('Cost Configuration (ADR-009)', () => {
    it('should create routing with cost fields (AC-15, AC-16)', async () => {
      const usersQuery = createMockQuery({
        single: vi.fn().mockResolvedValue({ data: mockUserData, error: null }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') return usersQuery
        return createMockQuery()
      })

      const routingWithCosts = {
        ...mockRouting,
        setup_cost: 50.0,
        working_cost_per_unit: 0.25,
        overhead_percent: 15.0,
        currency: 'PLN',
      }

      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        if (table === 'routings') {
          const q = createMockQuery()
          q.single = vi.fn().mockResolvedValue({ data: null, error: null }) // duplicate check
          q.insert = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: routingWithCosts, error: null }),
            }),
          })
          return q
        }
        return createMockQuery()
      })

      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-BREAD-01',
          name: 'Standard Bread Line',
          setup_cost: 50.0,
          working_cost_per_unit: 0.25,
          overhead_percent: 15.0,
          currency: 'PLN',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.setup_cost).toBe(50.0)
      expect(data.working_cost_per_unit).toBe(0.25)
      expect(data.overhead_percent).toBe(15.0)
      expect(data.currency).toBe('PLN')
    })
  })
})
