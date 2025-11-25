/**
 * Integration Tests: Product Types API Routes
 * Story: 2.5 Product Types Configuration
 *
 * Tests product types API endpoints with:
 * - GET /api/technical/product-types - List default + custom types
 * - POST /api/technical/product-types - Create custom type
 * - GET /api/technical/product-types/[id] - Get single type
 * - PUT /api/technical/product-types/[id] - Update custom type
 * - DELETE /api/technical/product-types/[id] - Delete/deactivate custom type
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/technical/product-types/route'
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from '@/app/api/technical/product-types/[id]/route'

/**
 * Mock Supabase Client
 */

let mockUser: any = null
let mockProductTypeQuery: any = null
let mockCustomTypes: any[] = []

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseAdmin: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: mockUser },
        error: null
      })),
    },
    from: vi.fn((table: string) => {
      if (table === 'product_type_config') {
        return mockProductTypeQuery
      }
      if (table === 'products') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(() => Promise.resolve({ count: 0, error: null }))
              }))
            }))
          }))
        }
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

describe('Product Types API Integration Tests (Story 2.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUser = {
      id: 'user-123',
      email: 'admin@example.com',
      user_metadata: {
        org_id: 'org-123',
      },
    }

    mockCustomTypes = [
      {
        id: 'type-001',
        org_id: 'org-123',
        code: 'SEMI',
        name: 'Semi-Finished',
        is_default: false,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'type-002',
        org_id: 'org-123',
        code: 'INT',
        name: 'Intermediate',
        is_default: false,
        is_active: true,
        created_at: '2025-01-02T00:00:00Z',
      },
    ]

    // Create a properly chainable mock query
    const createChainableMock = () => {
      const chainable: any = {
        select: vi.fn(() => chainable),
        eq: vi.fn(() => chainable),
        order: vi.fn(() => Promise.resolve({
          data: mockCustomTypes,
          error: null
        })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        insert: vi.fn(() => chainable),
        update: vi.fn(() => chainable),
        delete: vi.fn(() => Promise.resolve({ error: null })),
      }
      return chainable
    }

    mockProductTypeQuery = createChainableMock()
  })

  describe('GET /api/technical/product-types - List Types (AC-2.5.1, AC-2.5.5)', () => {
    it('should return default types + custom types', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/product-types')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.types).toBeDefined()
      // 5 default types + 2 custom types
      expect(data.types.length).toBeGreaterThanOrEqual(5)

      // Check default types are included
      const codes = data.types.map((t: any) => t.code)
      expect(codes).toContain('RM')
      expect(codes).toContain('WIP')
      expect(codes).toContain('FG')
      expect(codes).toContain('PKG')
      expect(codes).toContain('BP')
    })

    it('should mark default types as non-editable', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/product-types')
      const response = await GET(request)
      const data = await response.json()

      const defaultType = data.types.find((t: any) => t.code === 'RM')
      expect(defaultType.is_editable).toBe(false)
      expect(defaultType.is_default).toBe(true)
    })

    it('should filter by active status', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/product-types?active=true')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockProductTypeQuery.eq).toHaveBeenCalledWith('is_active', true)
    })

    it('should return 401 if not authenticated', async () => {
      mockUser = null

      const request = new NextRequest('http://localhost:3000/api/technical/product-types')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/technical/product-types - Create Custom Type (AC-2.5.2)', () => {
    it('should create custom type with valid data', async () => {
      const newType = {
        id: 'type-new',
        org_id: 'org-123',
        code: 'INGR',
        name: 'Ingredient',
        is_default: false,
        is_active: true,
      }

      // Mock no existing type with same code
      mockProductTypeQuery.single = vi.fn(() => Promise.resolve({ data: null, error: null }))

      // Mock successful insert
      const insertMock = {
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: newType, error: null }))
        }))
      }
      mockProductTypeQuery.insert = vi.fn(() => insertMock)

      const request = new NextRequest('http://localhost:3000/api/technical/product-types', {
        method: 'POST',
        body: JSON.stringify({
          code: 'INGR',
          name: 'Ingredient',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.code).toBe('INGR')
      expect(data.is_default).toBe(false)
    })

    it('should return 400 for duplicate code', async () => {
      mockProductTypeQuery.single = vi.fn(() => Promise.resolve({
        data: { id: 'existing', code: 'SEMI' },
        error: null
      }))

      const request = new NextRequest('http://localhost:3000/api/technical/product-types', {
        method: 'POST',
        body: JSON.stringify({
          code: 'SEMI',
          name: 'Duplicate',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('TYPE_CODE_EXISTS')
    })

    it('should return 400 for reserved default codes (AC-2.5.3)', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/product-types', {
        method: 'POST',
        body: JSON.stringify({
          code: 'RM', // Reserved
          name: 'Raw Material Override',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
    })

    it('should enforce uppercase code format', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/product-types', {
        method: 'POST',
        body: JSON.stringify({
          code: 'lowercase', // Invalid - must be uppercase
          name: 'Test',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should enforce code length 2-10 chars', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/product-types', {
        method: 'POST',
        body: JSON.stringify({
          code: 'X', // Too short
          name: 'Test',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/technical/product-types/[id] - Update Type (AC-2.5.4)', () => {
    it('should update custom type name', async () => {
      // Mock existing custom type
      mockProductTypeQuery.single = vi.fn()
        .mockResolvedValueOnce({
          data: { id: 'type-001', is_default: false },
          error: null
        })
        .mockResolvedValueOnce({
          data: { id: 'type-001', code: 'SEMI', name: 'Updated Name', is_default: false },
          error: null
        })

      const selectMock = {
        single: vi.fn(() => Promise.resolve({
          data: { id: 'type-001', code: 'SEMI', name: 'Updated Name' },
          error: null
        }))
      }
      mockProductTypeQuery.update = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => selectMock)
          }))
        }))
      }))

      const request = new NextRequest('http://localhost:3000/api/technical/product-types/type-001', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Name',
        }),
      })

      const context = { params: Promise.resolve({ id: 'type-001' }) }
      const response = await PUT(request, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Updated Name')
    })

    it('should return 400 when trying to edit default type', async () => {
      mockProductTypeQuery.single = vi.fn(() => Promise.resolve({
        data: { id: 'default-rm', is_default: true },
        error: null
      }))

      const request = new NextRequest('http://localhost:3000/api/technical/product-types/default-rm', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Cannot Edit',
        }),
      })

      const context = { params: Promise.resolve({ id: 'default-rm' }) }
      const response = await PUT(request, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('CANNOT_EDIT_DEFAULT')
    })

    it('should return 404 if type not found', async () => {
      mockProductTypeQuery.single = vi.fn(() => Promise.resolve({
        data: null,
        error: null
      }))

      const request = new NextRequest('http://localhost:3000/api/technical/product-types/non-existent', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Test',
        }),
      })

      const context = { params: Promise.resolve({ id: 'non-existent' }) }
      const response = await PUT(request, context)

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/technical/product-types/[id] - Delete Type', () => {
    it('should delete custom type with no products', async () => {
      mockProductTypeQuery.single = vi.fn(() => Promise.resolve({
        data: { id: 'type-001', code: 'SEMI', is_default: false },
        error: null
      }))

      const request = new NextRequest('http://localhost:3000/api/technical/product-types/type-001', {
        method: 'DELETE',
      })

      const context = { params: Promise.resolve({ id: 'type-001' }) }
      const response = await DELETE(request, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('deleted')
    })

    it('should return 400 when trying to delete default type', async () => {
      mockProductTypeQuery.single = vi.fn(() => Promise.resolve({
        data: { id: 'default-rm', code: 'RM', is_default: true },
        error: null
      }))

      const request = new NextRequest('http://localhost:3000/api/technical/product-types/default-rm', {
        method: 'DELETE',
      })

      const context = { params: Promise.resolve({ id: 'default-rm' }) }
      const response = await DELETE(request, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('CANNOT_DELETE_DEFAULT')
    })

    it('should return 404 if type not found', async () => {
      mockProductTypeQuery.single = vi.fn(() => Promise.resolve({
        data: null,
        error: null
      }))

      const request = new NextRequest('http://localhost:3000/api/technical/product-types/non-existent', {
        method: 'DELETE',
      })

      const context = { params: Promise.resolve({ id: 'non-existent' }) }
      const response = await DELETE(request, context)

      expect(response.status).toBe(404)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * GET /api/technical/product-types (4 tests):
 *   - List default + custom types
 *   - Mark default types as non-editable
 *   - Filter by active status
 *   - Auth: 401 Unauthorized
 *
 * POST /api/technical/product-types (5 tests):
 *   - Create custom type successfully
 *   - 400 Duplicate code error
 *   - 400 Reserved default code error (AC-2.5.3)
 *   - Validation: uppercase code format
 *   - Validation: code length 2-10 chars
 *
 * PUT /api/technical/product-types/[id] (3 tests):
 *   - Update custom type name
 *   - 400 Cannot edit default type
 *   - 404 Type not found
 *
 * DELETE /api/technical/product-types/[id] (3 tests):
 *   - Delete custom type successfully
 *   - 400 Cannot delete default type
 *   - 404 Type not found
 *
 * Total: 15 tests
 */
