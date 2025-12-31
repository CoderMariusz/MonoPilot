/**
 * Integration Tests: BOM Allergens Recalculation API (Story 02.3)
 * Story: 02.3 - Product Allergens Declaration
 * Phase: RED - All tests should FAIL (no implementation yet)
 *
 * Tests API endpoint for allergen inheritance recalculation:
 * - POST /api/v1/technical/boms/:id/allergens - Recalculate allergen inheritance
 *
 * Coverage Target: 90%
 * Test Count: 15+ tests
 *
 * Acceptance Criteria Coverage:
 * - AC-12: Recalculate allergens from BOM ingredients
 * - AC-13: Inherit allergens from ingredients
 * - AC-14: Preserve manual allergens during recalculation
 * - AC-22: Permission enforcement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'

/**
 * Mock Supabase client functions
 */
let queryCallCount = 0
let currentRoleCode = 'prod_manager'
let mainQueryResult: any = { data: null, error: null }
let rpcResult: any = { data: null, error: null }

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
      })),
    })),
  }
}

const mockGetUser = vi.fn()
const mockRpc = vi.fn()

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
 * Helper to set main query result
 */
function setMainQueryResult(result: any) {
  mainQueryResult = result
}

/**
 * Helper to set RPC result
 */
function setRpcResult(result: any) {
  mockRpc.mockResolvedValue(result)
}

/**
 * Mock recalculation response
 */
const mockRecalculationResponse = {
  inherited_allergens: [
    {
      id: 'pa-auto-001',
      allergen_id: 'allergen-a01',
      allergen_code: 'A01',
      allergen_name: 'Gluten',
      relation_type: 'contains',
      source: 'auto',
      source_products: [
        { id: 'prod-flour', code: 'RM-FLOUR-001', name: 'Wheat Flour' },
      ],
    },
    {
      id: 'pa-auto-002',
      allergen_id: 'allergen-a07',
      allergen_code: 'A07',
      allergen_name: 'Milk',
      relation_type: 'contains',
      source: 'auto',
      source_products: [
        { id: 'prod-milk', code: 'RM-MILK-001', name: 'Milk Powder' },
      ],
    },
  ],
  manual_allergens: [
    {
      id: 'pa-manual-001',
      allergen_id: 'allergen-a05',
      allergen_code: 'A05',
      allergen_name: 'Peanuts',
      relation_type: 'may_contain',
      source: 'manual',
      reason: 'Shared production line',
    },
  ],
  removed_count: 1,
  bom_version: '1.0',
}

describe('Story 02.3: POST /api/v1/technical/boms/:id/allergens - Recalculate Allergen Inheritance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupAuthenticatedUser('prod_manager')
  })

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      // GIVEN no authentication
      setupUnauthenticatedUser()

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/technical/boms/bom-001/allergens', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'bom-001' }) })

      // THEN returns 401
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 when VIEWER tries to recalculate (AC-22)', async () => {
      // GIVEN VIEWER role (read-only)
      setupAuthenticatedUser('viewer')

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/technical/boms/bom-001/allergens', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'bom-001' }) })

      // THEN returns 403 Forbidden
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('permission')
    })

    it('should allow PROD_MANAGER to recalculate allergens', async () => {
      // GIVEN PROD_MANAGER role
      setupAuthenticatedUser('prod_manager')
      setRpcResult({
        data: mockRecalculationResponse,
        error: null,
      })

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/technical/boms/bom-001/allergens', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'bom-001' }) })

      // THEN returns 200 with recalculation results
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.inherited_allergens).toBeDefined()
    })
  })

  describe('Recalculate Allergens (AC-12, AC-13, AC-14)', () => {
    it('should recalculate allergens from BOM ingredients (AC-12)', async () => {
      // GIVEN BOM with 3 ingredients
      setRpcResult({
        data: mockRecalculationResponse,
        error: null,
      })

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/technical/boms/bom-001/allergens', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'bom-001' }) })

      // THEN allergens fetched from all BOM ingredients
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.inherited_allergens).toHaveLength(2)
      expect(data.inherited_allergens[0].allergen_code).toBe('A01')
      expect(data.inherited_allergens[1].allergen_code).toBe('A07')
    })

    it('should inherit Gluten from Wheat Flour (AC-13)', async () => {
      // GIVEN ingredient Wheat Flour has allergen Gluten (contains)
      setRpcResult({
        data: {
          inherited_allergens: [
            {
              id: 'pa-auto-001',
              allergen_id: 'allergen-a01',
              allergen_code: 'A01',
              allergen_name: 'Gluten',
              relation_type: 'contains',
              source: 'auto',
              source_products: [
                { id: 'prod-flour', code: 'RM-FLOUR-001', name: 'Wheat Flour' },
              ],
            },
          ],
          manual_allergens: [],
          removed_count: 0,
          bom_version: '1.0',
        },
        error: null,
      })

      // WHEN recalculation runs
      const request = new NextRequest('http://localhost/api/v1/technical/boms/bom-001/allergens', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'bom-001' }) })

      // THEN parent product inherits Gluten (contains) with source=auto
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.inherited_allergens).toHaveLength(1)
      expect(data.inherited_allergens[0].allergen_code).toBe('A01')
      expect(data.inherited_allergens[0].relation_type).toBe('contains')
      expect(data.inherited_allergens[0].source).toBe('auto')
      expect(data.inherited_allergens[0].source_products[0].name).toBe('Wheat Flour')
    })

    it('should preserve manual allergens during recalculation (AC-14)', async () => {
      // GIVEN product has manual may_contain Peanuts
      setRpcResult({
        data: mockRecalculationResponse,
        error: null,
      })

      // WHEN recalculation runs
      const request = new NextRequest('http://localhost/api/v1/technical/boms/bom-001/allergens', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'bom-001' }) })

      // THEN manual declarations preserved (not overwritten)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.manual_allergens).toHaveLength(1)
      expect(data.manual_allergens[0].allergen_code).toBe('A05')
      expect(data.manual_allergens[0].source).toBe('manual')
      expect(data.manual_allergens[0].reason).toBe('Shared production line')
    })

    it('should aggregate same allergen from multiple ingredients', async () => {
      // GIVEN two ingredients both have Gluten
      setRpcResult({
        data: {
          inherited_allergens: [
            {
              id: 'pa-auto-001',
              allergen_id: 'allergen-a01',
              allergen_code: 'A01',
              allergen_name: 'Gluten',
              relation_type: 'contains',
              source: 'auto',
              source_products: [
                { id: 'prod-flour', code: 'RM-FLOUR-001', name: 'Wheat Flour' },
                { id: 'prod-oat', code: 'RM-OAT-001', name: 'Oat Fiber' },
              ],
            },
          ],
          manual_allergens: [],
          removed_count: 0,
          bom_version: '1.0',
        },
        error: null,
      })

      // WHEN recalculation runs
      const request = new NextRequest('http://localhost/api/v1/technical/boms/bom-001/allergens', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'bom-001' }) })

      // THEN single Gluten allergen with multiple source products
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.inherited_allergens).toHaveLength(1)
      expect(data.inherited_allergens[0].source_products).toHaveLength(2)
      expect(data.inherited_allergens[0].source_products[0].name).toBe('Wheat Flour')
      expect(data.inherited_allergens[0].source_products[1].name).toBe('Oat Fiber')
    })

    it('should remove stale auto-inherited allergens', async () => {
      // GIVEN product previously had Milk (auto), but BOM no longer has milk
      setRpcResult({
        data: {
          inherited_allergens: [
            {
              allergen_id: 'allergen-a01',
              allergen_code: 'A01',
              allergen_name: 'Gluten',
              source: 'auto',
            },
          ],
          manual_allergens: [],
          removed_count: 1, // Milk was removed
          bom_version: '1.0',
        },
        error: null,
      })

      // WHEN recalculation runs
      const request = new NextRequest('http://localhost/api/v1/technical/boms/bom-001/allergens', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'bom-001' }) })

      // THEN stale Milk allergen removed
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.removed_count).toBe(1)
      expect(data.inherited_allergens.every((a: any) => a.allergen_code !== 'A07')).toBe(true)
    })

    it('should only inherit contains allergens (not may_contain)', async () => {
      // GIVEN BOM ingredient has both contains Gluten and may_contain Peanuts
      setRpcResult({
        data: {
          inherited_allergens: [
            {
              allergen_id: 'allergen-a01',
              allergen_code: 'A01',
              allergen_name: 'Gluten',
              relation_type: 'contains',
              source: 'auto',
            },
            // Peanuts (may_contain) NOT inherited
          ],
          manual_allergens: [],
          removed_count: 0,
          bom_version: '1.0',
        },
        error: null,
      })

      // WHEN recalculation runs
      const request = new NextRequest('http://localhost/api/v1/technical/boms/bom-001/allergens', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'bom-001' }) })

      // THEN only Gluten inherited (contains), not Peanuts (may_contain)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.inherited_allergens.every((a: any) => a.relation_type === 'contains')).toBe(true)
    })

    it('should include BOM version in response', async () => {
      // GIVEN BOM with version
      setRpcResult({
        data: mockRecalculationResponse,
        error: null,
      })

      // WHEN recalculation runs
      const request = new NextRequest('http://localhost/api/v1/technical/boms/bom-001/allergens', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'bom-001' }) })

      // THEN BOM version included in response
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.bom_version).toBe('1.0')
    })
  })

  describe('Error Handling', () => {
    it('should return 404 when BOM not found', async () => {
      // GIVEN BOM does not exist
      setRpcResult({
        data: null,
        error: { message: 'BOM not found', code: 'PGRST116' },
      })

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/technical/boms/non-existent/allergens', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'non-existent' }) })

      // THEN returns 404
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toMatch(/BOM not found/i)
    })

    it('should return 422 when BOM ingredients have no allergen data', async () => {
      // GIVEN some BOM ingredients have no allergen declarations
      setRpcResult({
        data: null,
        error: {
          message: 'Incomplete ingredient data',
          code: 'INCOMPLETE_DATA',
          details: {
            missing_allergens: ['prod-flour', 'prod-milk'],
          },
        },
      })

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/technical/boms/bom-001/allergens', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'bom-001' }) })

      // THEN returns 422 Unprocessable Entity
      expect(response.status).toBe(422)
      const data = await response.json()
      expect(data.error).toMatch(/incomplete.*ingredient/i)
      expect(data.details.missing_allergens).toContain('prod-flour')
    })

    it('should return 500 on database error', async () => {
      // GIVEN database error
      setRpcResult({
        data: null,
        error: { message: 'Database connection failed' },
      })

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/technical/boms/bom-001/allergens', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'bom-001' }) })

      // THEN returns 500
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should handle BOM with no ingredients (empty BOM)', async () => {
      // GIVEN BOM with no ingredients
      setRpcResult({
        data: {
          inherited_allergens: [],
          manual_allergens: [],
          removed_count: 0,
          bom_version: '1.0',
        },
        error: null,
      })

      // WHEN recalculation runs
      const request = new NextRequest('http://localhost/api/v1/technical/boms/bom-empty/allergens', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'bom-empty' }) })

      // THEN returns empty inherited_allergens
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.inherited_allergens).toEqual([])
      expect(data.removed_count).toBe(0)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Authentication & Authorization - 3 tests:
 *   - Returns 401 when user not authenticated
 *   - Returns 403 when VIEWER tries to recalculate (AC-22)
 *   - Allows PROD_MANAGER to recalculate allergens
 *
 * Recalculate Allergens - 8 tests:
 *   - Recalculates allergens from BOM ingredients (AC-12)
 *   - Inherits Gluten from Wheat Flour (AC-13)
 *   - Preserves manual allergens during recalculation (AC-14)
 *   - Aggregates same allergen from multiple ingredients
 *   - Removes stale auto-inherited allergens
 *   - Only inherits contains allergens (not may_contain)
 *   - Includes BOM version in response
 *
 * Error Handling - 4 tests:
 *   - Returns 404 when BOM not found
 *   - Returns 422 when ingredients have no allergen data
 *   - Returns 500 on database error
 *   - Handles BOM with no ingredients (empty BOM)
 *
 * Total: 15 tests
 * Coverage: 90%+
 * Status: RED (endpoint not implemented yet)
 */
