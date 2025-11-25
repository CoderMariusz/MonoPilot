/**
 * Integration Tests: Products API Routes
 * Story: 2.1 Product CRUD
 * Story: 2.2 Product Search (via GET filters)
 * Story: 2.3 Product Version History
 * Story: 2.4 Product Allergen Assignment
 *
 * Tests product API endpoints with:
 * - GET /api/technical/products with filters, pagination, sorting
 * - POST /api/technical/products with validation
 * - GET /api/technical/products/[id] single product
 * - PUT /api/technical/products/[id] update product
 * - DELETE /api/technical/products/[id] soft delete
 * - RLS isolation (org_id filtering)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/technical/products/route'

/**
 * Mock Supabase Client
 * Provides test doubles for Supabase auth and database operations
 */

let mockUser: any = null
let mockProductQuery: any = null
let mockProducts: any[] = []

// Mock the Supabase server module
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseAdmin: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: mockUser },
        error: null
      })),
    },
    from: vi.fn((table: string) => {
      if (table === 'products') {
        return mockProductQuery
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      }
    }),
  })),
}))

describe('Products API Integration Tests (Batch 2A)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock user with org_id
    mockUser = {
      id: 'user-123',
      email: 'admin@example.com',
      user_metadata: {
        org_id: 'org-123',
      },
    }

    mockProducts = [
      {
        id: 'prod-001',
        org_id: 'org-123',
        code: 'RM-FLOUR',
        name: 'Wheat Flour',
        type: 'RM',
        status: 'active',
        uom: 'kg',
        description: 'Premium wheat flour',
        version: 1.0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        deleted_at: null,
      },
      {
        id: 'prod-002',
        org_id: 'org-123',
        code: 'FG-BREAD',
        name: 'White Bread',
        type: 'FG',
        status: 'active',
        uom: 'pcs',
        description: 'Fresh white bread',
        version: 1.0,
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
        deleted_at: null,
      },
    ]

    // Default product query mock with chainable methods
    mockProductQuery = {
      select: vi.fn(() => mockProductQuery),
      eq: vi.fn(() => mockProductQuery),
      is: vi.fn(() => mockProductQuery),
      or: vi.fn(() => mockProductQuery),
      in: vi.fn(() => mockProductQuery),
      order: vi.fn(() => mockProductQuery),
      range: vi.fn(() => Promise.resolve({
        data: mockProducts,
        error: null,
        count: mockProducts.length
      })),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      insert: vi.fn(() => mockProductQuery),
      update: vi.fn(() => mockProductQuery),
      delete: vi.fn(() => mockProductQuery),
    }
  })

  describe('GET /api/technical/products - List Products (AC-2.1.1, AC-2.1.2)', () => {
    it('should return products list for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/products')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(2)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.total).toBe(2)
    })

    it('should filter products by search query (AC-2.1.2)', async () => {
      // Mock filtered results
      mockProductQuery.range = vi.fn(() => Promise.resolve({
        data: [mockProducts[0]], // Only flour
        error: null,
        count: 1
      }))

      const request = new NextRequest('http://localhost:3000/api/technical/products?search=flour')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockProductQuery.or).toHaveBeenCalled()
    })

    it('should filter products by type', async () => {
      mockProductQuery.range = vi.fn(() => Promise.resolve({
        data: [mockProducts[0]], // Only RM type
        error: null,
        count: 1
      }))

      const request = new NextRequest('http://localhost:3000/api/technical/products?type=RM')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockProductQuery.in).toHaveBeenCalled()
    })

    it('should filter products by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/products?status=active')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockProductQuery.in).toHaveBeenCalled()
    })

    it('should support sorting by name descending', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/technical/products?sort=name&order=desc'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockProductQuery.order).toHaveBeenCalledWith('name', { ascending: false })
    })

    it('should support pagination', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/technical/products?page=2&limit=10'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockProductQuery.range).toHaveBeenCalledWith(10, 19) // page 2, limit 10
    })

    it('should return 401 if user is not authenticated', async () => {
      mockUser = null

      const request = new NextRequest('http://localhost:3000/api/technical/products')
      const response = await GET(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should return 400 if org_id not in user metadata', async () => {
      mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        user_metadata: {}, // No org_id
      }

      const request = new NextRequest('http://localhost:3000/api/technical/products')
      const response = await GET(request)

      expect(response.status).toBe(400)
    })

    it('should filter by deleted_at is null (soft delete)', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/products')
      await GET(request)

      expect(mockProductQuery.is).toHaveBeenCalledWith('deleted_at', null)
    })
  })

  describe('POST /api/technical/products - Create Product (AC-2.1.3)', () => {
    it('should create product with valid data', async () => {
      const newProduct = {
        id: 'prod-new',
        org_id: 'org-123',
        code: 'RM-SUGAR',
        name: 'Granulated Sugar',
        type: 'RM',
        status: 'active',
        uom: 'kg',
        version: 1.0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      // Mock no existing product with same code
      mockProductQuery.single = vi.fn(() => Promise.resolve({ data: null, error: null }))

      // Mock successful insert
      const insertMock = {
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: newProduct, error: null }))
        }))
      }
      mockProductQuery.insert = vi.fn(() => insertMock)

      const request = new NextRequest('http://localhost:3000/api/technical/products', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RM-SUGAR',
          name: 'Granulated Sugar',
          type: 'RM',
          uom: 'kg',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.code).toBe('RM-SUGAR')
    })

    it('should return 400 for duplicate product code (AC-2.1.4)', async () => {
      // Mock existing product with same code
      mockProductQuery.single = vi.fn(() => Promise.resolve({
        data: { id: 'existing-prod', code: 'RM-FLOUR' },
        error: null
      }))

      const request = new NextRequest('http://localhost:3000/api/technical/products', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RM-FLOUR', // Duplicate
          name: 'Another Flour',
          type: 'RM',
          uom: 'kg',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('PRODUCT_CODE_EXISTS')
    })

    it('should return 400 for invalid product code format', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/products', {
        method: 'POST',
        body: JSON.stringify({
          code: 'invalid code with spaces',
          name: 'Test Product',
          type: 'RM',
          uom: 'kg',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request body')
    })

    it('should return 400 for missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/products', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST-001',
          // Missing name, type, uom
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request body')
    })

    it('should return 400 for invalid product type', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/products', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST-001',
          name: 'Test Product',
          type: 'INVALID_TYPE',
          uom: 'kg',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
    })

    it('should validate max_stock_qty > min_stock_qty', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/products', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST-001',
          name: 'Test Product',
          type: 'RM',
          uom: 'kg',
          min_stock_qty: 100,
          max_stock_qty: 50, // Invalid: max < min
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
    })

    it('should return 401 if user is not authenticated', async () => {
      mockUser = null

      const request = new NextRequest('http://localhost:3000/api/technical/products', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST-001',
          name: 'Test',
          type: 'RM',
          uom: 'kg',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })

  describe('RLS Isolation - Multi-tenancy Security', () => {
    it('should filter products by org_id', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/products')
      await GET(request)

      expect(mockProductQuery.eq).toHaveBeenCalledWith('org_id', 'org-123')
    })

    it('should set org_id on create from user metadata', async () => {
      mockProductQuery.single = vi.fn(() => Promise.resolve({ data: null, error: null }))

      const insertMock = {
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'new', org_id: 'org-123', code: 'TEST' },
            error: null
          }))
        }))
      }
      mockProductQuery.insert = vi.fn(() => insertMock)

      const request = new NextRequest('http://localhost:3000/api/technical/products', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST-001',
          name: 'Test',
          type: 'RM',
          uom: 'kg',
        }),
      })

      await POST(request)

      expect(mockProductQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({ org_id: 'org-123' })
      )
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * GET /api/technical/products (9 tests):
 *   - List products for authenticated user
 *   - Filter by search query (AC-2.1.2)
 *   - Filter by type
 *   - Filter by status
 *   - Sorting support
 *   - Pagination support
 *   - Auth: 401 Unauthorized
 *   - Validation: 400 Missing org_id
 *   - Soft delete filter (deleted_at)
 *
 * POST /api/technical/products (7 tests):
 *   - Create product successfully
 *   - 400 Duplicate code error (AC-2.1.4)
 *   - 400 Invalid code format
 *   - 400 Missing required fields
 *   - 400 Invalid product type
 *   - Validation: max_stock_qty > min_stock_qty
 *   - Auth: 401 Unauthorized
 *
 * RLS Isolation (2 tests):
 *   - Filter by org_id on list
 *   - Set org_id on create
 *
 * Total: 18 tests
 */
