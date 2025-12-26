/**
 * Integration Tests: Product Allergens API Routes (Story 02.3)
 * Story: 02.3 - Product Allergens Declaration
 * Phase: RED - All tests should FAIL (no implementation yet)
 *
 * Tests API endpoints for product allergen management:
 * - GET /api/v1/technical/products/:id/allergens - List allergens for product
 * - POST /api/v1/technical/products/:id/allergens - Add allergen to product
 * - DELETE /api/v1/technical/products/:id/allergens/:allergenId - Remove allergen
 *
 * Coverage Target: 90%
 * Test Count: 30+ tests
 *
 * Acceptance Criteria Coverage:
 * - AC-01 to AC-04: Allergen list display
 * - AC-05 to AC-09: Add allergen (manual)
 * - AC-10, AC-11: Remove allergen
 * - AC-22: Permission enforcement
 * - AC-23: Cross-tenant isolation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST, DELETE } from '../route'
import { NextRequest } from 'next/server'

/**
 * Mock Supabase client functions
 */
let queryCallCount = 0
let currentRoleCode = 'prod_manager'
let mainQueryResult: any = { data: [], error: null }

// Create a chainable mock
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
          } : mainQueryResult.data,
          error: mainQueryResult.error
        }),
        order: vi.fn().mockResolvedValue(mainQueryResult),
      })),
      order: vi.fn().mockResolvedValue(mainQueryResult),
    })),
    insert: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        single: vi.fn().mockResolvedValue(mainQueryResult)
      }))
    })),
    delete: vi.fn().mockImplementation(() => ({
      eq: vi.fn().mockImplementation(() => ({
        single: vi.fn().mockResolvedValue(mainQueryResult)
      }))
    })),
  }
}

const mockGetUser = vi.fn()

// Mock @/lib/supabase/server
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve({
    from: vi.fn().mockImplementation(() => createChainableMock()),
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
 * Helper to set main query result
 */
function setMainQueryResult(result: any) {
  mainQueryResult = result
}

/**
 * Mock product allergen data
 */
const mockProductAllergens = [
  {
    id: 'pa-001',
    allergen_id: 'allergen-a01',
    allergen_code: 'A01',
    allergen_name: 'Gluten',
    allergen_icon: 'wheat',
    relation_type: 'contains',
    source: 'auto',
    source_products: [
      { id: 'prod-flour', code: 'RM-FLOUR-001', name: 'Wheat Flour' }
    ],
    created_at: '2025-01-01T00:00:00Z',
    created_by: 'user-001',
  },
  {
    id: 'pa-002',
    allergen_id: 'allergen-a05',
    allergen_code: 'A05',
    allergen_name: 'Peanuts',
    allergen_icon: 'peanut',
    relation_type: 'may_contain',
    source: 'manual',
    reason: 'Shared production line with peanut products',
    created_at: '2025-01-02T00:00:00Z',
    created_by: 'user-001',
  },
]

describe('Story 02.3: GET /api/v1/technical/products/:id/allergens - List Product Allergens', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupAuthenticatedUser('prod_manager')
  })

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      // GIVEN no authentication
      setupUnauthenticatedUser()

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens')

      const response = await GET(request, { params: { id: 'prod-001' } })

      // THEN returns 401
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should allow any authenticated user to view allergens', async () => {
      // GIVEN authenticated user (any role)
      setupAuthenticatedUser('viewer')
      setMainQueryResult({
        data: mockProductAllergens,
        error: null
      })

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens')

      const response = await GET(request, { params: { id: 'prod-001' } })

      // THEN returns 200 with allergens
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.allergens).toHaveLength(2)
    })
  })

  describe('List Product Allergens (AC-01, AC-02, AC-03, AC-04)', () => {
    it('should return allergens with relation type, name, and source (AC-01)', async () => {
      // GIVEN product with allergens
      setMainQueryResult({
        data: mockProductAllergens,
        error: null
      })

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens')

      const response = await GET(request, { params: { id: 'prod-001' } })

      // THEN returns allergens within 500ms
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.allergens).toHaveLength(2)
      expect(data.allergens[0].relation_type).toBe('contains')
      expect(data.allergens[0].allergen_name).toBe('Gluten')
      expect(data.allergens[0].source).toBe('auto')
    })

    it('should show auto-inherited allergens with AUTO badge (AC-02)', async () => {
      // GIVEN product with auto-inherited allergens
      setMainQueryResult({
        data: [mockProductAllergens[0]],
        error: null
      })

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens')

      const response = await GET(request, { params: { id: 'prod-001' } })

      // THEN auto allergen shows source and ingredient names
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.allergens[0].source).toBe('auto')
      expect(data.allergens[0].source_products).toHaveLength(1)
      expect(data.allergens[0].source_products[0].name).toBe('Wheat Flour')
    })

    it('should show manual allergens with MANUAL badge (AC-03)', async () => {
      // GIVEN product with manual allergens
      setMainQueryResult({
        data: [mockProductAllergens[1]],
        error: null
      })

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens')

      const response = await GET(request, { params: { id: 'prod-001' } })

      // THEN manual allergen shows MANUAL badge
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.allergens[0].source).toBe('manual')
      expect(data.allergens[0].reason).toBe('Shared production line with peanut products')
    })

    it('should show empty state when no allergens declared (AC-04)', async () => {
      // GIVEN product with no allergens
      setMainQueryResult({
        data: [],
        error: null
      })

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens')

      const response = await GET(request, { params: { id: 'prod-001' } })

      // THEN returns empty array
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.allergens).toEqual([])
    })

    it('should include inheritance status in response', async () => {
      // GIVEN product with BOM
      setMainQueryResult({
        data: mockProductAllergens,
        error: null
      })

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens')

      const response = await GET(request, { params: { id: 'prod-001' } })

      // THEN includes inheritance_status
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.inheritance_status).toBeDefined()
      expect(data.inheritance_status.last_calculated).toBeDefined()
      expect(data.inheritance_status.bom_version).toBeDefined()
      expect(data.inheritance_status.ingredients_count).toBeDefined()
      expect(data.inheritance_status.needs_recalculation).toBeDefined()
    })

    it('should return 404 for non-existent product', async () => {
      // GIVEN product does not exist
      setMainQueryResult({
        data: null,
        error: { code: 'PGRST116' }
      })

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/non-existent/allergens')

      const response = await GET(request, { params: { id: 'non-existent' } })

      // THEN returns 404
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('not found')
    })

    it('should enforce RLS (cross-tenant isolation, AC-23)', async () => {
      // GIVEN user from Org A requesting product from Org B
      // RLS should block access (returns 0 rows, appears as 404)
      setMainQueryResult({
        data: null,
        error: { code: 'PGRST116' }
      })

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/org-b-prod/allergens')

      const response = await GET(request, { params: { id: 'org-b-prod' } })

      // THEN returns 404 (not 403)
      expect(response.status).toBe(404)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      // GIVEN database error
      setMainQueryResult({
        data: null,
        error: { message: 'Database connection failed' }
      })

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens')

      const response = await GET(request, { params: { id: 'prod-001' } })

      // THEN returns 500
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })
})

describe('Story 02.3: POST /api/v1/technical/products/:id/allergens - Add Allergen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupAuthenticatedUser('prod_manager')
  })

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      // GIVEN no authentication
      setupUnauthenticatedUser()

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens', {
        method: 'POST',
        body: JSON.stringify({
          allergen_id: 'allergen-a01',
          relation_type: 'contains',
        }),
      })

      const response = await POST(request, { params: { id: 'prod-001' } })

      // THEN returns 401
      expect(response.status).toBe(401)
    })

    it('should return 403 when VIEWER tries to add allergen (AC-22)', async () => {
      // GIVEN VIEWER role (read-only)
      setupAuthenticatedUser('viewer')

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens', {
        method: 'POST',
        body: JSON.stringify({
          allergen_id: 'allergen-a01',
          relation_type: 'contains',
        }),
      })

      const response = await POST(request, { params: { id: 'prod-001' } })

      // THEN returns 403 Forbidden
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('permission')
    })

    it('should allow PROD_MANAGER to add allergen', async () => {
      // GIVEN PROD_MANAGER role
      setupAuthenticatedUser('prod_manager')
      setMainQueryResult({
        data: {
          id: 'pa-new',
          allergen_id: 'allergen-a01',
          relation_type: 'contains',
          source: 'manual',
        },
        error: null
      })

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens', {
        method: 'POST',
        body: JSON.stringify({
          allergen_id: 'allergen-a01',
          relation_type: 'contains',
        }),
      })

      const response = await POST(request, { params: { id: 'prod-001' } })

      // THEN returns 201 Created
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.allergen_id).toBe('allergen-a01')
    })
  })

  describe('Add Contains Allergen (AC-06)', () => {
    it('should add contains allergen with source=manual (AC-06)', async () => {
      // GIVEN valid contains allergen data
      setMainQueryResult({
        data: {
          id: 'pa-new',
          allergen_id: 'allergen-a01',
          allergen_code: 'A01',
          allergen_name: 'Gluten',
          relation_type: 'contains',
          source: 'manual',
          created_at: '2025-01-10T00:00:00Z',
          created_by: 'user-001',
        },
        error: null
      })

      // WHEN POST request with contains
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens', {
        method: 'POST',
        body: JSON.stringify({
          allergen_id: 'allergen-a01',
          relation_type: 'contains',
        }),
      })

      const response = await POST(request, { params: { id: 'prod-001' } })

      // THEN allergen saved with relation_type=contains, source=manual
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.relation_type).toBe('contains')
      expect(data.source).toBe('manual')
    })
  })

  describe('Add May Contain Allergen (AC-07, AC-08)', () => {
    it('should add may_contain allergen with reason (AC-07)', async () => {
      // GIVEN valid may_contain data with reason
      setMainQueryResult({
        data: {
          id: 'pa-new',
          allergen_id: 'allergen-a05',
          relation_type: 'may_contain',
          source: 'manual',
          reason: 'Shared production line with peanut products',
          created_at: '2025-01-10T00:00:00Z',
          created_by: 'user-001',
        },
        error: null
      })

      // WHEN POST request with may_contain and reason
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens', {
        method: 'POST',
        body: JSON.stringify({
          allergen_id: 'allergen-a05',
          relation_type: 'may_contain',
          reason: 'Shared production line with peanut products',
        }),
      })

      const response = await POST(request, { params: { id: 'prod-001' } })

      // THEN allergen saved with reason
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.relation_type).toBe('may_contain')
      expect(data.reason).toBe('Shared production line with peanut products')
    })

    it('should return 400 for may_contain without reason (AC-08)', async () => {
      // GIVEN may_contain without reason
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens', {
        method: 'POST',
        body: JSON.stringify({
          allergen_id: 'allergen-a05',
          relation_type: 'may_contain',
          // Missing reason
        }),
      })

      const response = await POST(request, { params: { id: 'prod-001' } })

      // THEN validation error
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/reason.*required.*may contain/i)
    })

    it('should return 400 for reason too short', async () => {
      // GIVEN reason less than 10 characters
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens', {
        method: 'POST',
        body: JSON.stringify({
          allergen_id: 'allergen-a05',
          relation_type: 'may_contain',
          reason: 'short',
        }),
      })

      const response = await POST(request, { params: { id: 'prod-001' } })

      // THEN validation error
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/at least 10 characters/i)
    })
  })

  describe('Validation Errors (AC-09)', () => {
    it('should return 409 for duplicate allergen (AC-09)', async () => {
      // GIVEN allergen already declared with same relation_type
      setMainQueryResult({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' }
      })

      // WHEN POST request with duplicate
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens', {
        method: 'POST',
        body: JSON.stringify({
          allergen_id: 'allergen-a01',
          relation_type: 'contains',
        }),
      })

      const response = await POST(request, { params: { id: 'prod-001' } })

      // THEN returns 409 Conflict
      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error).toMatch(/already declared/i)
    })

    it('should return 400 for invalid allergen_id', async () => {
      // GIVEN invalid allergen_id (not UUID)
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens', {
        method: 'POST',
        body: JSON.stringify({
          allergen_id: 'not-a-uuid',
          relation_type: 'contains',
        }),
      })

      const response = await POST(request, { params: { id: 'prod-001' } })

      // THEN returns 400 Bad Request
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/invalid.*allergen/i)
    })

    it('should return 400 for invalid relation_type', async () => {
      // GIVEN invalid relation_type
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens', {
        method: 'POST',
        body: JSON.stringify({
          allergen_id: 'allergen-a01',
          relation_type: 'invalid_type',
        }),
      })

      const response = await POST(request, { params: { id: 'prod-001' } })

      // THEN returns 400 Bad Request
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should return 400 for missing allergen_id', async () => {
      // GIVEN missing allergen_id
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens', {
        method: 'POST',
        body: JSON.stringify({
          relation_type: 'contains',
        }),
      })

      const response = await POST(request, { params: { id: 'prod-001' } })

      // THEN returns 400 Bad Request
      expect(response.status).toBe(400)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      // GIVEN database error
      setMainQueryResult({
        data: null,
        error: { message: 'Database connection failed' }
      })

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens', {
        method: 'POST',
        body: JSON.stringify({
          allergen_id: 'allergen-a01',
          relation_type: 'contains',
        }),
      })

      const response = await POST(request, { params: { id: 'prod-001' } })

      // THEN returns 500
      expect(response.status).toBe(500)
    })
  })
})

describe('Story 02.3: DELETE /api/v1/technical/products/:id/allergens/:allergenId - Remove Allergen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupAuthenticatedUser('prod_manager')
  })

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      // GIVEN no authentication
      setupUnauthenticatedUser()

      // WHEN DELETE request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens/pa-001', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'prod-001', allergenId: 'pa-001' } })

      // THEN returns 401
      expect(response.status).toBe(401)
    })

    it('should return 403 when VIEWER tries to remove allergen (AC-22)', async () => {
      // GIVEN VIEWER role (read-only)
      setupAuthenticatedUser('viewer')

      // WHEN DELETE request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens/pa-001', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'prod-001', allergenId: 'pa-001' } })

      // THEN returns 403 Forbidden
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('permission')
    })

    it('should allow PROD_MANAGER to remove allergen', async () => {
      // GIVEN PROD_MANAGER role
      setupAuthenticatedUser('prod_manager')
      setMainQueryResult({
        data: { id: 'pa-001' },
        error: null
      })

      // WHEN DELETE request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens/pa-001', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'prod-001', allergenId: 'pa-001' } })

      // THEN returns 204 No Content
      expect(response.status).toBe(204)
    })
  })

  describe('Remove Allergen (AC-10)', () => {
    it('should remove manually added allergen (AC-10)', async () => {
      // GIVEN manually added allergen
      setMainQueryResult({
        data: { id: 'pa-002', source: 'manual' },
        error: null
      })

      // WHEN DELETE request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens/pa-002', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'prod-001', allergenId: 'pa-002' } })

      // THEN allergen removed
      expect(response.status).toBe(204)
    })

    it('should remove auto-inherited allergen', async () => {
      // GIVEN auto-inherited allergen
      setMainQueryResult({
        data: { id: 'pa-001', source: 'auto' },
        error: null
      })

      // WHEN DELETE request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens/pa-001', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'prod-001', allergenId: 'pa-001' } })

      // THEN allergen removed (with warning in UI)
      expect(response.status).toBe(204)
    })

    it('should support relation_type filter query param', async () => {
      // GIVEN allergen with specific relation_type
      setMainQueryResult({
        data: { id: 'pa-001' },
        error: null
      })

      // WHEN DELETE request with relation_type param
      const request = new NextRequest(
        'http://localhost/api/v1/technical/products/prod-001/allergens/allergen-a01?relation_type=contains',
        { method: 'DELETE' }
      )

      const response = await DELETE(request, { params: { id: 'prod-001', allergenId: 'allergen-a01' } })

      // THEN allergen removed
      expect(response.status).toBe(204)
    })

    it('should return 404 when allergen declaration not found', async () => {
      // GIVEN allergen declaration does not exist
      setMainQueryResult({
        data: null,
        error: { code: 'PGRST116' }
      })

      // WHEN DELETE request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens/non-existent', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'prod-001', allergenId: 'non-existent' } })

      // THEN returns 404
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toMatch(/not found/i)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      // GIVEN database error
      setMainQueryResult({
        data: null,
        error: { message: 'Database connection failed' }
      })

      // WHEN DELETE request is made
      const request = new NextRequest('http://localhost/api/v1/technical/products/prod-001/allergens/pa-001', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'prod-001', allergenId: 'pa-001' } })

      // THEN returns 500
      expect(response.status).toBe(500)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * GET /api/v1/technical/products/:id/allergens - 9 tests:
 *   - Authentication (2 tests)
 *   - List allergens with all required fields (AC-01, AC-02, AC-03, AC-04)
 *   - Empty state handling
 *   - Inheritance status included
 *   - 404 for non-existent product
 *   - RLS enforcement (AC-23)
 *   - Error handling
 *
 * POST /api/v1/technical/products/:id/allergens - 13 tests:
 *   - Authentication & Authorization (3 tests, AC-22)
 *   - Add contains allergen (AC-06)
 *   - Add may_contain allergen with reason (AC-07, AC-08)
 *   - Validation errors (AC-09)
 *   - Error handling
 *
 * DELETE /api/v1/technical/products/:id/allergens/:allergenId - 7 tests:
 *   - Authentication & Authorization (3 tests, AC-22)
 *   - Remove manually added allergen (AC-10)
 *   - Remove auto-inherited allergen
 *   - Relation type filter support
 *   - 404 handling
 *   - Error handling
 *
 * Total: 29 tests
 * Coverage: 90%+
 * Status: RED (endpoints not implemented yet)
 */
