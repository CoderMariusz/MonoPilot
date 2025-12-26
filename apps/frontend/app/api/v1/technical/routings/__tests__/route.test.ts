/**
 * Integration Tests: Routing API Routes (Story 02.7)
 * Story: 02.7 - Routings CRUD
 * Phase: RED - All tests should FAIL (no implementation yet)
 *
 * Tests API endpoints for routing management:
 * - GET /api/v1/technical/routings - List routings with pagination/search/filter
 * - POST /api/v1/technical/routings - Create new routing
 * - POST /api/v1/technical/routings (with cloneFrom) - Clone routing
 *
 * Coverage Target: 90%
 * Test Count: 35+ tests
 *
 * Acceptance Criteria Coverage:
 * - AC-01 to AC-04: List routings with filters
 * - AC-05 to AC-10: Create routing with validation
 * - AC-15 to AC-18: Cost configuration (ADR-009)
 * - AC-19 to AC-21: Clone routing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'

/**
 * Mock Supabase client functions
 */
const mockSupabaseSelect = vi.fn()
const mockSupabaseInsert = vi.fn()
const mockSupabaseEq = vi.fn()
const mockSupabaseSingle = vi.fn()
const mockSupabaseRange = vi.fn()
const mockSupabaseOrder = vi.fn()
const mockSupabaseOr = vi.fn()
const mockSupabaseFrom = vi.fn()
const mockGetUser = vi.fn()
const mockRpc = vi.fn()

// Track query call count to differentiate context query from main query
let queryCallCount = 0
let currentRoleCode = 'prod_manager'
let mainQueryResult: any = { data: [], count: 0, error: null }

// Create a chainable mock that handles both context and main queries
function createChainableMock() {
  queryCallCount++
  const isContextQuery = queryCallCount === 1

  return {
    select: vi.fn().mockImplementation(() => ({
      eq: vi.fn().mockImplementation(() => ({
        single: vi.fn().mockResolvedValue({
          data: isContextQuery ? {
            org_id: 'test-org-id',
            role: [{ code: currentRoleCode }]
          } : null,
          error: null
        }),
        range: vi.fn().mockImplementation(() => ({
          order: vi.fn().mockResolvedValue(mainQueryResult)
        })),
        or: vi.fn().mockImplementation(() => ({
          range: vi.fn().mockImplementation(() => ({
            order: vi.fn().mockResolvedValue(mainQueryResult)
          }))
        })),
        ilike: vi.fn().mockImplementation(() => ({
          range: vi.fn().mockImplementation(() => ({
            order: vi.fn().mockResolvedValue(mainQueryResult)
          }))
        })),
      })),
      range: vi.fn().mockImplementation(() => ({
        order: vi.fn().mockResolvedValue(mainQueryResult)
      })),
      or: vi.fn().mockImplementation(() => ({
        range: vi.fn().mockImplementation(() => ({
          order: vi.fn().mockResolvedValue(mainQueryResult)
        }))
      })),
      ilike: vi.fn().mockImplementation(() => ({
        range: vi.fn().mockImplementation(() => ({
          order: vi.fn().mockResolvedValue(mainQueryResult)
        }))
      })),
    })),
    insert: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        single: mockSupabaseSingle
      }))
    })),
  }
}

// Mock @/lib/supabase/server
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve({
    from: vi.fn().mockImplementation(() => createChainableMock()),
    rpc: mockRpc,
    auth: {
      getUser: mockGetUser,
    },
  })),
}))

/**
 * Helper to setup authenticated user with org context
 */
function setupAuthenticatedUser(roleCode: string = 'prod_manager') {
  queryCallCount = 0
  currentRoleCode = roleCode

  mockGetUser.mockResolvedValue({
    data: { user: { id: 'test-user-id' } },
    error: null
  })
}

/**
 * Helper to setup unauthenticated user
 */
function setupUnauthenticatedUser() {
  mockGetUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Not authenticated' }
  })
}

/**
 * Helper to set main query result (for list queries)
 */
function setMainQueryResult(result: any) {
  mainQueryResult = result
}

/**
 * Helper to set insert result (for POST)
 */
function setInsertResult(result: any) {
  mockSupabaseSingle.mockResolvedValue(result)
}

/**
 * Mock routing data
 */
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

describe('Story 02.7: GET /api/v1/technical/routings - List Routings', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: authenticated prod_manager user
    setupAuthenticatedUser('prod_manager')
  })

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      // GIVEN no org context
      setupUnauthenticatedUser()

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/technical/routings')

      const response = await GET(request)

      // THEN returns 401
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should allow PROD_MANAGER to list routings (AC-30)', async () => {
      // GIVEN PROD_MANAGER user
      setupAuthenticatedUser('prod_manager')
      setMainQueryResult({
        data: mockRoutingList,
        count: 2,
        error: null
      })

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/technical/routings')

      const response = await GET(request)

      // THEN returns 200 with routings
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.routings).toHaveLength(2)
    })

    it('should allow VIEWER to list routings (read-only, AC-29)', async () => {
      // GIVEN VIEWER user
      setupAuthenticatedUser('viewer')
      setMainQueryResult({
        data: mockRoutingList,
        count: 2,
        error: null
      })

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/technical/routings')

      const response = await GET(request)

      // THEN returns 200 (can view list)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.routings).toHaveLength(2)
    })
  })

  describe('List Functionality', () => {
    it('should return all routings with default filters (AC-01)', async () => {
      // GIVEN org with 2 routings
      setMainQueryResult({
        data: mockRoutingList,
        count: 2,
        error: null
      })

      // WHEN GET request without filters
      const request = new NextRequest('http://localhost/api/v1/technical/routings')

      const response = await GET(request)

      // THEN returns all routings within 500ms
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.routings).toHaveLength(2)
      expect(data.total).toBe(2)
      expect(data.routings[0].code).toBe('RTG-BREAD-01')
    })

    it('should filter by status Active (AC-03)', async () => {
      // GIVEN routings filtered by is_active=true
      setMainQueryResult({
        data: mockRoutingList,
        count: 2,
        error: null
      })

      // WHEN GET request with is_active=true filter
      const request = new NextRequest('http://localhost/api/v1/technical/routings?is_active=true')

      const response = await GET(request)

      // THEN returns only active routings
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.routings.every((r: any) => r.is_active === true)).toBe(true)
    })

    it('should search by code and name (AC-02)', async () => {
      // GIVEN search query 'BREAD'
      setMainQueryResult({
        data: [mockRouting],
        count: 1,
        error: null
      })

      // WHEN GET request with search parameter
      const request = new NextRequest('http://localhost/api/v1/technical/routings?search=BREAD')

      const response = await GET(request)

      // THEN returns matching routings within 300ms
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.routings).toHaveLength(1)
      expect(data.routings[0].code).toContain('BREAD')
    })

    it('should paginate results (AC-01 performance)', async () => {
      // GIVEN 100 routings (performance requirement)
      const routings = Array.from({ length: 25 }, (_, i) => ({
        ...mockRouting,
        id: `routing-${i}`,
        code: `RTG-${i.toString().padStart(3, '0')}`,
      }))

      setMainQueryResult({
        data: routings,
        count: 100,
        error: null
      })

      // WHEN requesting page 2 with limit 25
      const request = new NextRequest('http://localhost/api/v1/technical/routings?page=2&limit=25')

      const response = await GET(request)

      // THEN returns page 2 results
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.routings).toHaveLength(25)
      expect(data.page).toBe(2)
      expect(data.total).toBe(100)
    })

    it('should sort by code ascending', async () => {
      // GIVEN sortBy=code, sortOrder=asc
      setMainQueryResult({
        data: mockRoutingList,
        count: 2,
        error: null
      })

      // WHEN GET request with sort parameters
      const request = new NextRequest('http://localhost/api/v1/technical/routings?sortBy=code&sortOrder=asc')

      const response = await GET(request)

      // THEN returns sorted routings
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.routings[0].code).toBe('RTG-BREAD-01')
    })

    it('should include operations_count and boms_count in response', async () => {
      // GIVEN routings with counts
      setMainQueryResult({
        data: mockRoutingList,
        count: 2,
        error: null
      })

      // WHEN GET request
      const request = new NextRequest('http://localhost/api/v1/technical/routings')

      const response = await GET(request)

      // THEN counts included in response
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.routings[0].operations_count).toBe(5)
      expect(data.routings[0].boms_count).toBe(3)
    })
  })

  describe('Empty State', () => {
    it('should return empty array when no routings exist (AC-04)', async () => {
      // GIVEN org with no routings
      setMainQueryResult({
        data: [],
        count: 0,
        error: null
      })

      // WHEN GET request
      const request = new NextRequest('http://localhost/api/v1/technical/routings')

      const response = await GET(request)

      // THEN returns empty array
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.routings).toHaveLength(0)
      expect(data.total).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      // GIVEN database error
      setMainQueryResult({
        data: null,
        error: { message: 'Database connection failed' }
      })

      // WHEN GET request
      const request = new NextRequest('http://localhost/api/v1/technical/routings')

      const response = await GET(request)

      // THEN returns 500
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })
})

describe('Story 02.7: POST /api/v1/technical/routings - Create Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: authenticated prod_manager user
    setupAuthenticatedUser('prod_manager')
  })

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      // GIVEN no org context
      setupUnauthenticatedUser()

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-TEST',
          name: 'Test Routing',
        }),
      })

      const response = await POST(request)

      // THEN returns 401
      expect(response.status).toBe(401)
    })

    it('should return 403 when VIEWER tries to create (AC-29)', async () => {
      // GIVEN VIEWER user (read-only)
      setupAuthenticatedUser('viewer')

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-TEST',
          name: 'Test Routing',
        }),
      })

      const response = await POST(request)

      // THEN returns 403 Forbidden
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('permission')
    })

    it('should allow PROD_MANAGER to create routing (AC-30)', async () => {
      // GIVEN PROD_MANAGER user
      setupAuthenticatedUser('prod_manager')
      setInsertResult({
        data: mockRouting,
        error: null
      })

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-BREAD-01',
          name: 'Standard Bread Line',
        }),
      })

      const response = await POST(request)

      // THEN returns 201 Created
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.code).toBe('RTG-BREAD-01')
    })
  })

  describe('Create Functionality', () => {
    it('should create routing with valid data (AC-06)', async () => {
      // GIVEN valid routing data
      setInsertResult({
        data: mockRouting,
        error: null
      })

      // WHEN POST request
      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-BREAD-01',
          name: 'Standard Bread Line',
          description: 'Mixing -> Proofing -> Baking -> Cooling',
          is_active: true,
          is_reusable: true,
          setup_cost: 50.0,
          working_cost_per_unit: 0.25,
          overhead_percent: 15.0,
          currency: 'PLN',
        }),
      })

      const response = await POST(request)

      // THEN routing created with version 1
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.code).toBe('RTG-BREAD-01')
      expect(data.version).toBe(1)
    })

    it('should create routing with cost fields (AC-15, AC-16)', async () => {
      // GIVEN routing with cost configuration (ADR-009)
      setInsertResult({
        data: mockRouting,
        error: null
      })

      // WHEN POST request with cost fields
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

      // THEN cost values stored correctly
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.setup_cost).toBe(50.0)
      expect(data.working_cost_per_unit).toBe(0.25)
      expect(data.overhead_percent).toBe(15.0)
      expect(data.currency).toBe('PLN')
    })

    it('should default cost fields to 0 and currency to PLN (AC-05)', async () => {
      // GIVEN routing without cost fields
      setInsertResult({
        data: { ...mockRouting, setup_cost: 0, working_cost_per_unit: 0, overhead_percent: 0 },
        error: null
      })

      // WHEN POST request without cost fields
      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-BREAD-01',
          name: 'Standard Bread Line',
        }),
      })

      const response = await POST(request)

      // THEN cost fields default to 0, currency to PLN
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.setup_cost).toBe(0)
      expect(data.currency).toBe('PLN')
    })

    it('should default is_reusable to true (AC-27)', async () => {
      // GIVEN routing without is_reusable
      setInsertResult({
        data: mockRouting,
        error: null
      })

      // WHEN POST request
      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-BREAD-01',
          name: 'Standard Bread Line',
        }),
      })

      const response = await POST(request)

      // THEN is_reusable defaults to true
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.is_reusable).toBe(true)
    })
  })

  describe('Validation Errors', () => {
    it('should return 409 for duplicate code (AC-07)', async () => {
      // GIVEN code already exists
      setInsertResult({
        data: null,
        error: { code: '23505', message: 'duplicate key value' }
      })

      // WHEN POST request with duplicate code
      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-BREAD-01',
          name: 'Duplicate Routing',
        }),
      })

      const response = await POST(request)

      // THEN returns 409 Conflict
      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error).toContain('already exists')
    })

    it('should return 400 for invalid code format (AC-08)', async () => {
      // GIVEN invalid code (lowercase with spaces)
      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'bread line 01',
          name: 'Test Routing',
        }),
      })

      const response = await POST(request)

      // THEN returns 400 Bad Request
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('uppercase')
    })

    it('should return 400 for code less than 2 characters (AC-09)', async () => {
      // GIVEN code too short
      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'R',
          name: 'Test Routing',
        }),
      })

      const response = await POST(request)

      // THEN returns 400
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('at least 2 characters')
    })

    it('should return 400 for empty name (AC-10)', async () => {
      // GIVEN empty name
      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-01',
          name: '',
        }),
      })

      const response = await POST(request)

      // THEN returns 400
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('required')
    })

    it('should return 400 for overhead_percent > 100 (AC-17)', async () => {
      // GIVEN invalid overhead percentage
      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-01',
          name: 'Test Routing',
          overhead_percent: 150,
        }),
      })

      const response = await POST(request)

      // THEN returns 400
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('100%')
    })

    it('should return 400 for negative setup_cost (AC-18)', async () => {
      // GIVEN negative setup cost
      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-01',
          name: 'Test Routing',
          setup_cost: -10,
        }),
      })

      const response = await POST(request)

      // THEN returns 400
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('negative')
    })
  })

  describe('Clone Functionality (AC-19, AC-20, AC-21)', () => {
    it('should clone routing with operations when cloneFrom provided', async () => {
      // GIVEN source routing with 5 operations
      setInsertResult({
        data: {
          ...mockRouting,
          id: 'routing-new-uuid',
          code: 'RTG-BREAD-01-COPY',
          name: 'Standard Bread Line - Copy',
        },
        error: null
      })

      // Operations cloned (via RPC)
      mockRpc.mockResolvedValueOnce({
        data: { operations_count: 5 },
        error: null
      })

      // WHEN POST request with cloneFrom parameter
      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-BREAD-01-COPY',
          name: 'Standard Bread Line - Copy',
          cloneFrom: 'routing-001-uuid',
        }),
      })

      const response = await POST(request)

      // THEN routing cloned with operations
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.code).toBe('RTG-BREAD-01-COPY')
      expect(data.operations_count).toBe(5)
    })

    it('should return 404 when cloneFrom routing does not exist', async () => {
      // GIVEN source routing does not exist
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Routing not found' }
      })

      // WHEN POST request with invalid cloneFrom
      const request = new NextRequest('http://localhost/api/v1/technical/routings', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RTG-NEW',
          name: 'New Routing',
          cloneFrom: 'non-existent-uuid',
        }),
      })

      const response = await POST(request)

      // THEN returns 404
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('not found')
    })
  })
})
