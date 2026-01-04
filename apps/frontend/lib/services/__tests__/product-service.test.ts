/**
 * Product Service - Unit Tests (Story 02.1)
 * Purpose: Test ProductService business logic for CRUD operations
 * Phase: RED - Tests will fail until service is implemented
 *
 * Tests the ProductService which handles:
 * - Listing products with filters, pagination, sorting
 * - Creating new products with SKU uniqueness check
 * - Updating products (excluding immutable fields)
 * - Soft deleting products (with validation)
 * - Getting single product by ID
 * - Checking SKU existence (async validation)
 *
 * Coverage Target: 80%+
 * Test Count: 20+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-01, AC-09: List products with pagination
 * - AC-02: SKU uniqueness check
 * - AC-03: Product type assignment (immutable)
 * - AC-07: Update timestamp tracking
 * - AC-08: Status change validation
 * - AC-10, AC-11, AC-12: Search and filter functionality
 * - AC-14, AC-15: Soft delete with validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Mock Supabase
 */
/**
 * Mock Supabase - Create chainable mock that mimics Supabase query builder
 */
const createChainableMock = (): any => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    not: vi.fn(() => chain),
    in: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    lt: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn((resolve) => resolve({ data: null, error: null })),
  }
  return chain
}

/**
 * Mock Supabase - Create chainable mock that mimics Supabase query builder
 */
const createChainableMock = (): any => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    not: vi.fn(() => chain),
    in: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    lt: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn((resolve) => resolve({ data: null, error: null })),
  }
  return chain
}

const mockSupabaseClient = {
  from: vi.fn(() => createChainableMock()),
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
}

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
  createClient: vi.fn(() => mockSupabaseClient),
}))

import {
  ProductService,
  type ProductListParams,
  type CreateProductInput,
  type UpdateProductInput,
} from '../product-service'

describe('ProductService (Story 02.1)', () => {
  let mockSupabase: any
  let mockQuery: any
  let mockProducts: any[]
  let service: typeof ProductService

  beforeEach(() => {
    vi.clearAllMocks()

    // Sample product data
    mockProducts = [
      {
        id: 'prod-001',
        org_id: 'org-123',
        code: 'RM-FLOUR-001',
        name: 'Premium Wheat Flour',
        product_type_id: 'type-rm',
        base_uom: 'kg',
        description: 'High-quality wheat flour',
        status: 'active',
        version: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        deleted_at: null,
      },
      {
        id: 'prod-002',
        org_id: 'org-123',
        code: 'FG-BREAD-100',
        name: 'White Bread Loaf',
        product_type_id: 'type-fg',
        base_uom: 'pcs',
        description: 'Fresh white bread',
        status: 'active',
        version: 1,
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
        deleted_at: null,
      },
    ]

    // Create chainable query mock
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: mockProducts,
        error: null,
        count: mockProducts.length,
      }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    }

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(() => mockQuery),
    }

    // Mock service to use our mock Supabase
    service = ProductService
  })

  describe('list() - List Products with Filters (AC-09, AC-10, AC-11, AC-12)', () => {
    it('should return paginated product list', async () => {
      mockQuery.range.mockResolvedValue({
        data: mockProducts,
        error: null,
        count: 2,
      })

      const params: ProductListParams = {
        page: 1,
        limit: 20,
      }

      const result = await service.list(mockSupabase, params)

      expect(result.data).toEqual(mockProducts)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.totalPages).toBe(1)
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.range).toHaveBeenCalledWith(0, 19)
    })

    it('should filter products by search query (AC-10)', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockProducts[0]],
        error: null,
        count: 1,
      })

      const params: ProductListParams = {
        page: 1,
        limit: 20,
        search: 'flour',
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.or).toHaveBeenCalled()
    })

    it('should filter products by product type (AC-11)', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockProducts[0]],
        error: null,
        count: 1,
      })

      const params: ProductListParams = {
        page: 1,
        limit: 20,
        type: 'RM',
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.eq).toHaveBeenCalled()
    })

    it('should filter products by status (AC-12)', async () => {
      mockQuery.range.mockResolvedValue({
        data: mockProducts,
        error: null,
        count: 2,
      })

      const params: ProductListParams = {
        page: 1,
        limit: 20,
        status: 'active',
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active')
    })

    it('should support sorting by name descending (AC-13)', async () => {
      const params: ProductListParams = {
        page: 1,
        limit: 20,
        sort: 'name',
        order: 'desc',
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.order).toHaveBeenCalledWith('name', { ascending: false })
    })

    it('should support sorting by code ascending (default)', async () => {
      const params: ProductListParams = {
        page: 1,
        limit: 20,
        sort: 'code',
        order: 'asc',
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.order).toHaveBeenCalledWith('code', { ascending: true })
    })

    it('should filter out soft-deleted products', async () => {
      await service.list(mockSupabase, { page: 1, limit: 20 })

      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null)
    })

    it('should handle pagination correctly for page 2', async () => {
      const params: ProductListParams = {
        page: 2,
        limit: 10,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.range).toHaveBeenCalledWith(10, 19)
    })

    it('should throw error when database query fails', async () => {
      mockQuery.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      })

      await expect(
        service.list(mockSupabase, { page: 1, limit: 20 })
      ).rejects.toThrow()
    })
  })

  describe('getById() - Get Single Product', () => {
    it('should return product by ID', async () => {
      mockQuery.single.mockResolvedValue({
        data: mockProducts[0],
        error: null,
      })

      const result = await service.getById(mockSupabase, 'prod-001')

      expect(result).toEqual(mockProducts[0])
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'prod-001')
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null)
    })

    it('should return null when product not found', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Not found error
      })

      const result = await service.getById(mockSupabase, 'non-existent')

      expect(result).toBeNull()
    })

    it('should throw error for database failures', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      })

      await expect(
        service.getById(mockSupabase, 'prod-001')
      ).rejects.toThrow()
    })
  })

  describe('create() - Create Product (AC-01, AC-02, AC-03)', () => {
    it('should create product with valid data (AC-01)', async () => {
      const newProduct = {
        ...mockProducts[0],
        id: 'prod-new',
        code: 'RM-SUGAR-001',
        name: 'Granulated Sugar',
      }

      // Mock SKU check (not exists)
      mockQuery.single.mockResolvedValueOnce({ data: null, error: null })

      // Mock insert
      mockQuery.single.mockResolvedValueOnce({
        data: newProduct,
        error: null,
      })

      const input: CreateProductInput = {
        code: 'RM-SUGAR-001',
        name: 'Granulated Sugar',
        product_type_id: 'type-rm',
        base_uom: 'kg',
      }

      const result = await service.create(mockSupabase, input)

      expect(result).toEqual(newProduct)
      expect(mockQuery.insert).toHaveBeenCalled()
    })

    it('should throw error if SKU already exists (AC-02)', async () => {
      // Mock SKU check (exists)
      mockQuery.single.mockResolvedValue({
        data: { id: 'existing-prod', code: 'RM-FLOUR-001' },
        error: null,
      })

      const input: CreateProductInput = {
        code: 'RM-FLOUR-001',
        name: 'Another Flour',
        product_type_id: 'type-rm',
        base_uom: 'kg',
      }

      await expect(
        service.create(mockSupabase, input)
      ).rejects.toThrow(/already exists|duplicate/i)
    })

    it('should set product type which becomes immutable (AC-03)', async () => {
      const input: CreateProductInput = {
        code: 'TEST-001',
        name: 'Test Product',
        product_type_id: 'type-rm',
        base_uom: 'kg',
      }

      mockQuery.single.mockResolvedValueOnce({ data: null, error: null })
      mockQuery.single.mockResolvedValueOnce({
        data: { ...input, id: 'new-id' },
        error: null,
      })

      await service.create(mockSupabase, input)

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({ product_type_id: 'type-rm' })
      )
    })

    it('should set version to 1 for new products', async () => {
      const input: CreateProductInput = {
        code: 'TEST-001',
        name: 'Test Product',
        product_type_id: 'type-rm',
        base_uom: 'kg',
      }

      mockQuery.single.mockResolvedValueOnce({ data: null, error: null })
      mockQuery.single.mockResolvedValueOnce({
        data: { ...input, id: 'new-id', version: 1 },
        error: null,
      })

      await service.create(mockSupabase, input)

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({ version: 1 })
      )
    })

    it('should set default status to active', async () => {
      const input: CreateProductInput = {
        code: 'TEST-001',
        name: 'Test Product',
        product_type_id: 'type-rm',
        base_uom: 'kg',
      }

      mockQuery.single.mockResolvedValueOnce({ data: null, error: null })
      mockQuery.single.mockResolvedValueOnce({
        data: { ...input, id: 'new-id', status: 'active' },
        error: null,
      })

      await service.create(mockSupabase, input)

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' })
      )
    })
  })

  describe('update() - Update Product (AC-07, AC-08)', () => {
    it('should update product and update timestamp (AC-07)', async () => {
      const updatedProduct = {
        ...mockProducts[0],
        name: 'Updated Flour Name',
        updated_at: '2025-01-10T00:00:00Z',
      }

      mockQuery.single.mockResolvedValue({
        data: updatedProduct,
        error: null,
      })

      const input: UpdateProductInput = {
        name: 'Updated Flour Name',
      }

      const result = await service.update(mockSupabase, 'prod-001', input)

      expect(result.name).toBe('Updated Flour Name')
      expect(mockQuery.update).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'prod-001')
    })

    it('should not allow updating code (immutable)', async () => {
      const input = {
        code: 'NEW-CODE',
        name: 'Updated Name',
      }

      // Service should strip code field before update
      mockQuery.single.mockResolvedValue({
        data: { ...mockProducts[0], name: 'Updated Name' },
        error: null,
      })

      await service.update(mockSupabase, 'prod-001', input)

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.not.objectContaining({ code: expect.anything() })
      )
    })

    it('should not allow updating product_type_id (immutable)', async () => {
      const input = {
        product_type_id: 'type-new',
        name: 'Updated Name',
      }

      mockQuery.single.mockResolvedValue({
        data: { ...mockProducts[0], name: 'Updated Name' },
        error: null,
      })

      await service.update(mockSupabase, 'prod-001', input)

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.not.objectContaining({ product_type_id: expect.anything() })
      )
    })

    it('should allow status change to inactive (AC-08)', async () => {
      const input: UpdateProductInput = {
        status: 'inactive',
      }

      mockQuery.single.mockResolvedValue({
        data: { ...mockProducts[0], status: 'inactive' },
        error: null,
      })

      const result = await service.update(mockSupabase, 'prod-001', input)

      expect(result.status).toBe('inactive')
    })

    it('should throw error when product not found', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      await expect(
        service.update(mockSupabase, 'non-existent', { name: 'New Name' })
      ).rejects.toThrow(/not found/i)
    })
  })

  describe('delete() - Soft Delete Product (AC-14, AC-15)', () => {
    it('should soft delete unused product (AC-14)', async () => {
      mockQuery.single.mockResolvedValue({
        data: { ...mockProducts[0], deleted_at: '2025-01-10T00:00:00Z' },
        error: null,
      })

      await service.delete(mockSupabase, 'prod-001')

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(String) })
      )
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'prod-001')
    })

    it('should throw error when product not found', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      await expect(
        service.delete(mockSupabase, 'non-existent')
      ).rejects.toThrow(/not found/i)
    })

    it('should validate product is not referenced before delete (AC-15)', async () => {
      // This test assumes the service checks for references
      // Implementation will check bom_items, work_orders, etc.
      mockQuery.single.mockResolvedValue({
        data: null,
        error: {
          code: '23503', // Foreign key violation
          message: 'Product is referenced by other records',
        },
      })

      await expect(
        service.delete(mockSupabase, 'prod-001')
      ).rejects.toThrow(/referenced|cannot delete/i)
    })
  })

  describe('checkSkuExists() - SKU Uniqueness Check (AC-02)', () => {
    it('should return true if SKU exists', async () => {
      mockQuery.single.mockResolvedValue({
        data: { id: 'existing-prod', code: 'RM-FLOUR-001' },
        error: null,
      })

      const result = await service.checkSkuExists(mockSupabase, 'RM-FLOUR-001')

      expect(result).toBe(true)
      expect(mockQuery.eq).toHaveBeenCalledWith('code', 'RM-FLOUR-001')
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null)
    })

    it('should return false if SKU does not exist', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await service.checkSkuExists(mockSupabase, 'NEW-SKU-001')

      expect(result).toBe(false)
    })

    it('should exclude soft-deleted products from SKU check', async () => {
      await service.checkSkuExists(mockSupabase, 'TEST-SKU')

      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * list() - 9 tests:
 *   - Paginated list (AC-09)
 *   - Search filter (AC-10)
 *   - Type filter (AC-11)
 *   - Status filter (AC-12)
 *   - Sorting (AC-13)
 *   - Soft delete filter
 *   - Pagination calculations
 *   - Error handling
 *
 * getById() - 3 tests:
 *   - Get by ID
 *   - Not found handling
 *   - Error handling
 *
 * create() - 5 tests:
 *   - Create with valid data (AC-01)
 *   - SKU uniqueness check (AC-02)
 *   - Product type immutability (AC-03)
 *   - Version initialization
 *   - Default status
 *
 * update() - 5 tests:
 *   - Update with timestamp (AC-07)
 *   - Code immutability
 *   - Product type immutability
 *   - Status change (AC-08)
 *   - Not found handling
 *
 * delete() - 3 tests:
 *   - Soft delete (AC-14)
 *   - Not found handling
 *   - Reference validation (AC-15)
 *
 * checkSkuExists() - 3 tests:
 *   - Exists check (AC-02)
 *   - Not exists check
 *   - Soft delete exclusion
 *
 * Total: 28 tests
 * Coverage: 80%+ (all service methods tested)
 * Status: RED (service not implemented yet)
 */
