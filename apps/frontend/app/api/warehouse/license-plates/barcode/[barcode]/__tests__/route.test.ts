/**
 * Integration Tests: LP Barcode Lookup API
 * Story: 04.6b - Material Consumption Scanner
 * Phase: TDD RED - All tests should FAIL (no implementation yet)
 *
 * Tests the GET /api/warehouse/license-plates/barcode/:barcode endpoint:
 * - Returns LP with validation for valid barcode
 * - Validates product match when material_id provided
 * - Returns availability status
 * - Returns 404 for non-existent LP
 * - Response time under 300ms
 *
 * Coverage Target: 90%
 * Test Count: 12 tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'user-123' } },
        error: null,
      })),
    },
  })),
}))

// Mock org context
vi.mock('@/lib/hooks/server/getOrgContext', () => ({
  getOrgContext: vi.fn(() => ({
    org_id: 'org-123',
    user_id: 'user-123',
    role_code: 'production_operator',
  })),
}))

const mockLPData = {
  id: 'lp-123',
  lp_number: 'LP-2025-01234',
  product_id: 'prod-flour',
  quantity: 500,
  uom: 'kg',
  batch_number: 'BATCH-2025-001',
  expiry_date: '2025-12-31',
  status: 'available',
  location_id: 'loc-1',
  products: {
    id: 'prod-flour',
    name: 'Flour Type A',
    sku: 'FLOUR-A',
  },
  locations: {
    name: 'Zone A - Row 1 - Bin 5',
    code: 'A-01-05',
  },
}

const mockMaterial = {
  id: 'mat-1',
  product_id: 'prod-flour',
  uom: 'kg',
}

describe('04.6b GET /api/warehouse/license-plates/barcode/:barcode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Successful LP Lookup', () => {
    it('should return 200 with LP info for valid barcode', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockLPData, error: null }),
              }),
            }),
          }),
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>)

      const request = new NextRequest('http://localhost/api/warehouse/license-plates/barcode/LP-2025-01234')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'LP-2025-01234' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.lp).toBeDefined()
      expect(data.lp.lp_number).toBe('LP-2025-01234')
    })

    it('should include product name and batch number', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockLPData, error: null }),
              }),
            }),
          }),
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>)

      const request = new NextRequest('http://localhost/api/warehouse/license-plates/barcode/LP-2025-01234')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'LP-2025-01234' }) })
      const data = await response.json()

      expect(data.lp.product_name).toBe('Flour Type A')
      expect(data.lp.batch_number).toBe('BATCH-2025-001')
      expect(data.lp.expiry_date).toBe('2025-12-31')
    })

    it('should include location name in response', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockLPData, error: null }),
              }),
            }),
          }),
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>)

      const request = new NextRequest('http://localhost/api/warehouse/license-plates/barcode/LP-2025-01234')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'LP-2025-01234' }) })
      const data = await response.json()

      expect(data.lp.location_name).toBe('Zone A - Row 1 - Bin 5')
    })
  })

  describe('Product Validation', () => {
    // AC-04.6b-004: Product mismatch validation
    it('should return product_match = true when LP product matches material', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockImplementation((table) => {
          if (table === 'license_plates') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mockLPData, error: null }),
                  }),
                }),
              }),
            }
          }
          if (table === 'wo_bom_items') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockMaterial, error: null }),
                }),
              }),
            }
          }
          return { select: vi.fn() }
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>)

      const request = new NextRequest(
        'http://localhost/api/warehouse/license-plates/barcode/LP-2025-01234?material_id=mat-1'
      )
      const response = await GET(request, { params: Promise.resolve({ barcode: 'LP-2025-01234' }) })
      const data = await response.json()

      expect(data.validation.product_match).toBe(true)
      expect(data.validation.error_code).toBeNull()
    })

    it('should return product_match = false when LP product does not match', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const wrongMaterial = { ...mockMaterial, product_id: 'prod-sugar' }
      const mockSupabase = {
        from: vi.fn().mockImplementation((table) => {
          if (table === 'license_plates') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mockLPData, error: null }),
                  }),
                }),
              }),
            }
          }
          if (table === 'wo_bom_items') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: wrongMaterial, error: null }),
                }),
              }),
            }
          }
          return { select: vi.fn() }
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>)

      const request = new NextRequest(
        'http://localhost/api/warehouse/license-plates/barcode/LP-2025-01234?material_id=mat-1'
      )
      const response = await GET(request, { params: Promise.resolve({ barcode: 'LP-2025-01234' }) })
      const data = await response.json()

      expect(data.validation.product_match).toBe(false)
      expect(data.validation.error_code).toBe('PRODUCT_MISMATCH')
      expect(data.validation.error_message).toContain('mismatch')
    })

    it('should include product names in mismatch error message', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const wrongMaterial = {
        ...mockMaterial,
        product_id: 'prod-sugar',
        products: { name: 'White Sugar' },
      }
      const mockSupabase = {
        from: vi.fn().mockImplementation((table) => {
          if (table === 'license_plates') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mockLPData, error: null }),
                  }),
                }),
              }),
            }
          }
          if (table === 'wo_bom_items') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: wrongMaterial, error: null }),
                }),
              }),
            }
          }
          return { select: vi.fn() }
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>)

      const request = new NextRequest(
        'http://localhost/api/warehouse/license-plates/barcode/LP-2025-01234?material_id=mat-1'
      )
      const response = await GET(request, { params: Promise.resolve({ barcode: 'LP-2025-01234' }) })
      const data = await response.json()

      expect(data.validation.error_message).toContain('Flour Type A')
      expect(data.validation.error_message).toContain('White Sugar')
    })
  })

  describe('Availability Validation', () => {
    it('should return is_available = true for available LP', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockLPData, error: null }),
              }),
            }),
          }),
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>)

      const request = new NextRequest('http://localhost/api/warehouse/license-plates/barcode/LP-2025-01234')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'LP-2025-01234' }) })
      const data = await response.json()

      expect(data.validation.is_available).toBe(true)
    })

    it('should return is_available = false for consumed LP', async () => {
      const consumedLP = { ...mockLPData, status: 'consumed' }
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: consumedLP, error: null }),
              }),
            }),
          }),
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>)

      const request = new NextRequest('http://localhost/api/warehouse/license-plates/barcode/LP-2025-01234')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'LP-2025-01234' }) })
      const data = await response.json()

      expect(data.validation.is_available).toBe(false)
      expect(data.validation.error_code).toBe('LP_NOT_AVAILABLE')
    })

    it('should return is_available = false for reserved LP', async () => {
      const reservedLP = { ...mockLPData, status: 'reserved' }
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: reservedLP, error: null }),
              }),
            }),
          }),
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>)

      const request = new NextRequest('http://localhost/api/warehouse/license-plates/barcode/LP-2025-01234')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'LP-2025-01234' }) })
      const data = await response.json()

      expect(data.validation.is_available).toBe(false)
      expect(data.validation.error_code).toBe('LP_NOT_AVAILABLE')
    })
  })

  describe('Error Cases', () => {
    it('should return 404 for non-existent LP barcode', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>)

      const request = new NextRequest('http://localhost/api/warehouse/license-plates/barcode/LP-99999')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'LP-99999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('LP_NOT_FOUND')
      expect(data.message).toContain('LP-99999')
    })

    it('should return 401 for unauthenticated request', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn(),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      }
      vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>)

      const request = new NextRequest('http://localhost/api/warehouse/license-plates/barcode/LP-2025-01234')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'LP-2025-01234' }) })

      expect(response.status).toBe(401)
    })
  })

  describe('Performance', () => {
    it('should respond within 300ms for valid barcode', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockLPData, error: null }),
              }),
            }),
          }),
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>)

      const startTime = Date.now()
      const request = new NextRequest('http://localhost/api/warehouse/license-plates/barcode/LP-2025-01234')
      await GET(request, { params: Promise.resolve({ barcode: 'LP-2025-01234' }) })
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(300)
    })
  })
})

/**
 * Test Summary for LP Barcode API
 * ================================
 *
 * Test Coverage:
 * - Successful lookup: 3 tests
 * - Product validation: 3 tests
 * - Availability validation: 3 tests
 * - Error cases: 2 tests
 * - Performance: 1 test
 * - Total: 12 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - GET route not implemented
 *
 * Next Steps for BACKEND-DEV:
 * 1. Create apps/frontend/app/api/warehouse/license-plates/barcode/[barcode]/route.ts
 * 2. Implement GET handler with Supabase queries
 * 3. Add product match validation when material_id provided
 * 4. Add availability validation based on LP status
 * 5. Run tests - should transition from RED to GREEN
 *
 * Files to Create:
 * - apps/frontend/app/api/warehouse/license-plates/barcode/[barcode]/route.ts
 *
 * Coverage Target: 90%
 */
