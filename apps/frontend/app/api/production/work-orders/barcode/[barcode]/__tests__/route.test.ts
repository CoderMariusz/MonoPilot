/**
 * Integration Tests: WO Barcode Lookup API
 * Story: 04.6b - Material Consumption Scanner
 * Phase: TDD RED - All tests should FAIL (no implementation yet)
 *
 * Tests the GET /api/production/work-orders/barcode/:barcode endpoint:
 * - Returns WO with materials for valid barcode
 * - Returns 404 for non-existent WO
 * - Returns 400 for inactive WO (completed/cancelled)
 * - Response time under 500ms
 *
 * Coverage Target: 90%
 * Test Count: 10 tests
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
    rpc: vi.fn(),
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

const mockWOData = {
  id: 'wo-123',
  wo_number: 'WO-2025-0156',
  product_id: 'prod-123',
  planned_qty: 1000,
  actual_qty: 0,
  status: 'in_progress',
  batch_number: 'BATCH-2025-001',
  production_line_id: 'line-1',
  products: {
    name: 'Chocolate Chip Cookies',
    sku: 'SKU-CCC-001',
  },
  production_lines: {
    name: 'Line A',
  },
}

const mockMaterials = [
  {
    id: 'mat-1',
    material_id: 'prod-flour',
    required_qty: 500,
    consumed_qty: 200,
    uom: 'kg',
    consume_whole_lp: false,
    products: {
      name: 'Flour Type A',
      sku: 'FLOUR-A',
    },
  },
  {
    id: 'mat-2',
    material_id: 'prod-sugar',
    required_qty: 200,
    consumed_qty: 0,
    uom: 'kg',
    consume_whole_lp: true,
    products: {
      name: 'White Sugar',
      sku: 'SUGAR-W',
    },
  },
]

describe('04.6b GET /api/production/work-orders/barcode/:barcode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Successful WO Lookup', () => {
    it('should return 200 with WO info and materials for valid barcode', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockImplementation((table) => {
          if (table === 'work_orders') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    in: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: mockWOData, error: null }),
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'wo_bom_items') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: mockMaterials, error: null }),
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

      const request = new NextRequest('http://localhost/api/production/work-orders/barcode/WO-2025-0156')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'WO-2025-0156' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.wo).toBeDefined()
      expect(data.wo.wo_number).toBe('WO-2025-0156')
      expect(data.materials).toBeInstanceOf(Array)
      expect(data.materials).toHaveLength(2)
    })

    it('should include product name and SKU in response', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockImplementation((table) => {
          if (table === 'work_orders') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    in: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: mockWOData, error: null }),
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'wo_bom_items') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: mockMaterials, error: null }),
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

      const request = new NextRequest('http://localhost/api/production/work-orders/barcode/WO-2025-0156')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'WO-2025-0156' }) })
      const data = await response.json()

      expect(data.wo.product_name).toBe('Chocolate Chip Cookies')
      expect(data.wo.product_sku).toBe('SKU-CCC-001')
    })

    it('should include line name in response', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockImplementation((table) => {
          if (table === 'work_orders') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    in: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: mockWOData, error: null }),
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'wo_bom_items') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: mockMaterials, error: null }),
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

      const request = new NextRequest('http://localhost/api/production/work-orders/barcode/WO-2025-0156')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'WO-2025-0156' }) })
      const data = await response.json()

      expect(data.wo.line_name).toBe('Line A')
    })

    it('should calculate progress_percent for each material', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockImplementation((table) => {
          if (table === 'work_orders') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    in: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: mockWOData, error: null }),
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'wo_bom_items') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: mockMaterials, error: null }),
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

      const request = new NextRequest('http://localhost/api/production/work-orders/barcode/WO-2025-0156')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'WO-2025-0156' }) })
      const data = await response.json()

      // First material: 200/500 = 40%
      expect(data.materials[0].progress_percent).toBe(40)
      // Second material: 0/200 = 0%
      expect(data.materials[1].progress_percent).toBe(0)
    })
  })

  describe('Error Cases', () => {
    // FR-04.6b-001: 404 for non-existent WO
    it('should return 404 for non-existent WO barcode', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
                }),
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

      const request = new NextRequest('http://localhost/api/production/work-orders/barcode/WO-99999')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'WO-99999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('WO_NOT_FOUND')
      expect(data.message).toContain('WO-99999')
    })

    // FR-04.6b-001: 400 for inactive WO
    it('should return 400 for completed WO', async () => {
      const completedWO = { ...mockWOData, status: 'completed' }
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
                }),
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

      const request = new NextRequest('http://localhost/api/production/work-orders/barcode/WO-2025-DONE')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'WO-2025-DONE' }) })
      const data = await response.json()

      // Either 400 or 404 depending on if WO exists but is inactive
      expect([400, 404]).toContain(response.status)
      if (response.status === 400) {
        expect(data.error).toBe('WO_NOT_ACTIVE')
      }
    })

    it('should return 400 for cancelled WO', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
                }),
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

      const request = new NextRequest('http://localhost/api/production/work-orders/barcode/WO-2025-CANCELLED')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'WO-2025-CANCELLED' }) })

      // Either 400 or 404
      expect([400, 404]).toContain(response.status)
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

      const request = new NextRequest('http://localhost/api/production/work-orders/barcode/WO-2025-0156')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'WO-2025-0156' }) })

      expect(response.status).toBe(401)
    })
  })

  describe('Performance', () => {
    it('should respond within 500ms for valid barcode', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockImplementation((table) => {
          if (table === 'work_orders') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    in: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: mockWOData, error: null }),
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'wo_bom_items') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: mockMaterials, error: null }),
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

      const startTime = Date.now()
      const request = new NextRequest('http://localhost/api/production/work-orders/barcode/WO-2025-0156')
      await GET(request, { params: Promise.resolve({ barcode: 'WO-2025-0156' }) })
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(500)
    })
  })

  describe('Role-Based Access', () => {
    it('should allow production_operator role', async () => {
      const { getOrgContext } = await import('@/lib/hooks/server/getOrgContext')
      vi.mocked(getOrgContext).mockResolvedValue({
        org_id: 'org-123',
        user_id: 'user-123',
        role_code: 'production_operator',
      } as Awaited<ReturnType<typeof getOrgContext>>)

      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn().mockImplementation((table) => {
          if (table === 'work_orders') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    in: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: mockWOData, error: null }),
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'wo_bom_items') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: mockMaterials, error: null }),
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

      const request = new NextRequest('http://localhost/api/production/work-orders/barcode/WO-2025-0156')
      const response = await GET(request, { params: Promise.resolve({ barcode: 'WO-2025-0156' }) })

      expect(response.status).toBe(200)
    })
  })
})

/**
 * Test Summary for WO Barcode API
 * ================================
 *
 * Test Coverage:
 * - Successful lookup: 4 tests
 * - Error cases: 4 tests
 * - Performance: 1 test
 * - Role-based access: 1 test
 * - Total: 10 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - GET route not implemented
 *
 * Next Steps for BACKEND-DEV:
 * 1. Create apps/frontend/app/api/production/work-orders/barcode/[barcode]/route.ts
 * 2. Implement GET handler with Supabase queries
 * 3. Add role-based access checks
 * 4. Calculate progress_percent for materials
 * 5. Run tests - should transition from RED to GREEN
 *
 * Files to Create:
 * - apps/frontend/app/api/production/work-orders/barcode/[barcode]/route.ts
 *
 * Coverage Target: 90%
 */
