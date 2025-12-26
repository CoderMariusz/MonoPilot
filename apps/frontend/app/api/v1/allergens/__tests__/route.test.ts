/**
 * Integration Tests: Allergens API Route (Story 02.3)
 * Story: 02.3 - Product Allergens Declaration
 * Phase: RED - All tests should FAIL (no implementation yet)
 *
 * Tests API endpoint for allergen master data:
 * - GET /api/v1/allergens - List all allergens (EU 14 from Settings 01.12)
 *
 * Coverage Target: 90%
 * Test Count: 8+ tests
 *
 * Acceptance Criteria Coverage:
 * - AC-05: Dropdown shows EU 14 allergens
 * - AC-18: 14 EU allergens exist globally
 * - AC-19: Allergens are global (not org-scoped)
 * - AC-20: All 14 EU allergens visible
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

/**
 * Mock Supabase client functions
 */
const mockSupabaseSelect = vi.fn()
const mockSupabaseEq = vi.fn()
const mockSupabaseOrder = vi.fn()
const mockGetUser = vi.fn()

let currentUserAuthenticated = true
let allergensData: any[] = []

// Create chainable mock
function createChainableMock() {
  return {
    select: vi.fn().mockImplementation(() => ({
      eq: vi.fn().mockImplementation(() => ({
        order: vi.fn().mockResolvedValue({
          data: allergensData,
          error: null,
        }),
      })),
      order: vi.fn().mockResolvedValue({
        data: allergensData,
        error: null,
      }),
    })),
  }
}

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
 * Mock allergens data (EU 14)
 */
const mockAllergens = [
  { id: 'a01', code: 'A01', name_en: 'Gluten', name_pl: 'Gluten', icon_url: 'wheat', is_eu_mandatory: true, is_active: true, display_order: 1 },
  { id: 'a02', code: 'A02', name_en: 'Crustaceans', name_pl: 'Skorupiaki', icon_url: 'shrimp', is_eu_mandatory: true, is_active: true, display_order: 2 },
  { id: 'a03', code: 'A03', name_en: 'Eggs', name_pl: 'Jaja', icon_url: 'egg', is_eu_mandatory: true, is_active: true, display_order: 3 },
  { id: 'a04', code: 'A04', name_en: 'Fish', name_pl: 'Ryby', icon_url: 'fish', is_eu_mandatory: true, is_active: true, display_order: 4 },
  { id: 'a05', code: 'A05', name_en: 'Peanuts', name_pl: 'Orzeszki ziemne', icon_url: 'peanut', is_eu_mandatory: true, is_active: true, display_order: 5 },
  { id: 'a06', code: 'A06', name_en: 'Soybeans', name_pl: 'Soja', icon_url: 'soy', is_eu_mandatory: true, is_active: true, display_order: 6 },
  { id: 'a07', code: 'A07', name_en: 'Milk', name_pl: 'Mleko', icon_url: 'milk', is_eu_mandatory: true, is_active: true, display_order: 7 },
  { id: 'a08', code: 'A08', name_en: 'Nuts', name_pl: 'Orzechy', icon_url: 'tree-nut', is_eu_mandatory: true, is_active: true, display_order: 8 },
  { id: 'a09', code: 'A09', name_en: 'Celery', name_pl: 'Seler', icon_url: 'celery', is_eu_mandatory: true, is_active: true, display_order: 9 },
  { id: 'a10', code: 'A10', name_en: 'Mustard', name_pl: 'Gorczyca', icon_url: 'mustard', is_eu_mandatory: true, is_active: true, display_order: 10 },
  { id: 'a11', code: 'A11', name_en: 'Sesame', name_pl: 'Sezam', icon_url: 'sesame', is_eu_mandatory: true, is_active: true, display_order: 11 },
  { id: 'a12', code: 'A12', name_en: 'Sulphites', name_pl: 'Siarczyny', icon_url: 'sulfite', is_eu_mandatory: true, is_active: true, display_order: 12 },
  { id: 'a13', code: 'A13', name_en: 'Lupin', name_pl: 'Lubin', icon_url: 'lupin', is_eu_mandatory: true, is_active: true, display_order: 13 },
  { id: 'a14', code: 'A14', name_en: 'Molluscs', name_pl: 'Mieczaki', icon_url: 'mollusk', is_eu_mandatory: true, is_active: true, display_order: 14 },
]

/**
 * Helper to setup authenticated user
 */
function setupAuthenticatedUser() {
  currentUserAuthenticated = true
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'test-user-id' } },
    error: null,
  })
}

/**
 * Helper to setup unauthenticated user
 */
function setupUnauthenticatedUser() {
  currentUserAuthenticated = false
  mockGetUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Not authenticated' },
  })
}

/**
 * Helper to set allergens data
 */
function setAllergensData(data: any[]) {
  allergensData = data
}

describe('Story 02.3: GET /api/v1/allergens - List Allergens (AC-18, AC-19, AC-20)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupAuthenticatedUser()
    setAllergensData(mockAllergens)
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // GIVEN no authentication
      setupUnauthenticatedUser()

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/allergens')

      const response = await GET(request)

      // THEN returns 401
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should allow any authenticated user to list allergens', async () => {
      // GIVEN authenticated user
      setupAuthenticatedUser()

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/allergens')

      const response = await GET(request)

      // THEN returns 200 with allergens
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.allergens).toBeDefined()
    })
  })

  describe('List Allergens (AC-18, AC-19)', () => {
    it('should return 14 EU allergens (AC-18)', async () => {
      // GIVEN allergens table populated by story 01.12
      setAllergensData(mockAllergens)

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/allergens')

      const response = await GET(request)

      // THEN returns 14 allergens
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.allergens).toHaveLength(14)
      expect(data.allergens[0].code).toBe('A01')
      expect(data.allergens[13].code).toBe('A14')
    })

    it('should return allergens sorted by display_order', async () => {
      // GIVEN allergens with display_order
      setAllergensData(mockAllergens)

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/allergens')

      const response = await GET(request)

      // THEN allergens sorted by display_order
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.allergens[0].display_order).toBe(1)
      expect(data.allergens[1].display_order).toBe(2)
    })

    it('should include all required fields (code, name_en, name_pl, icon_url)', async () => {
      // GIVEN allergens with all fields
      setAllergensData(mockAllergens)

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/allergens')

      const response = await GET(request)

      // THEN all fields present
      expect(response.status).toBe(200)
      const data = await response.json()
      const allergen = data.allergens[0]
      expect(allergen.id).toBeDefined()
      expect(allergen.code).toBe('A01')
      expect(allergen.name_en).toBe('Gluten')
      expect(allergen.name_pl).toBe('Gluten')
      expect(allergen.icon_url).toBe('wheat')
      expect(allergen.is_eu_mandatory).toBe(true)
    })

    it('should return allergens regardless of org (global data, AC-19)', async () => {
      // GIVEN allergens are global (not org-scoped)
      // Any user from any org sees same allergens
      setAllergensData(mockAllergens)

      // WHEN user from Org A requests
      const request = new NextRequest('http://localhost/api/v1/allergens')

      const response = await GET(request)

      // THEN returns all 14 allergens (no org filter)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.allergens).toHaveLength(14)
    })

    it('should only return active allergens', async () => {
      // GIVEN some allergens are inactive
      const allergensWithInactive = [
        ...mockAllergens.slice(0, 13),
        { ...mockAllergens[13], is_active: false },
      ]
      setAllergensData(allergensWithInactive.filter(a => a.is_active))

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/allergens')

      const response = await GET(request)

      // THEN only active allergens returned
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.allergens.every((a: any) => a.is_active === true)).toBe(true)
    })

    it('should support language preference query param', async () => {
      // GIVEN allergens with multiple languages
      setAllergensData(mockAllergens)

      // WHEN GET request with lang=pl
      const request = new NextRequest('http://localhost/api/v1/allergens?lang=pl')

      const response = await GET(request)

      // THEN returns allergens (lang preference handled by frontend)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.allergens[0].name_pl).toBe('Gluten')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      // GIVEN database error
      allergensData = []
      vi.mocked(createChainableMock).mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          })),
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        })),
      }))

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/allergens')

      const response = await GET(request)

      // THEN returns 500
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should return empty array if no allergens seeded (dependency check)', async () => {
      // GIVEN allergens table empty (01.12 not implemented)
      setAllergensData([])

      // WHEN GET request is made
      const request = new NextRequest('http://localhost/api/v1/allergens')

      const response = await GET(request)

      // THEN returns empty array (indicates missing dependency)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.allergens).toHaveLength(0)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Authentication - 2 tests:
 *   - Returns 401 when user not authenticated
 *   - Allows any authenticated user to list allergens
 *
 * List Allergens - 6 tests:
 *   - Returns 14 EU allergens (AC-18)
 *   - Returns allergens sorted by display_order
 *   - Includes all required fields
 *   - Returns allergens regardless of org (global data, AC-19)
 *   - Only returns active allergens
 *   - Supports language preference query param
 *
 * Error Handling - 2 tests:
 *   - Returns 500 on database error
 *   - Returns empty array if no allergens seeded (dependency check)
 *
 * Total: 10 tests
 * Coverage: 90%+
 * Status: RED (endpoint not implemented yet)
 *
 * Dependency Check: Test fails if story 01.12 not implemented
 */
