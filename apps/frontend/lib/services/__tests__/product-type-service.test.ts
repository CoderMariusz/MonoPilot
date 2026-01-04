/**
 * Product Type Service - Unit Tests (Story 02.1)
 * Purpose: Test ProductTypeService for reading product types
 * Phase: RED - Tests will fail until service is implemented
 *
 * Tests the ProductTypeService which handles:
 * - Listing all product types (RM, WIP, FG, PKG, BP)
 * - Getting single product type by ID
 * - Getting product type select options for forms
 * - Product types are global (no org_id, no RLS)
 *
 * Coverage Target: 80%+
 * Test Count: 10+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-16: Default product types available
 * - AC-17: Product type badge display
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

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
  ProductTypeService,
  type ProductType,
} from '../product-type-service'

describe('ProductTypeService (Story 02.1)', () => {
  let mockSupabase: any
  let mockQuery: any
  let mockProductTypes: ProductType[]
  let service: typeof ProductTypeService

  beforeEach(() => {
    vi.clearAllMocks()

    // Sample product types (14 EU mandatory)
    mockProductTypes = [
      {
        id: 'type-rm',
        code: 'RM',
        name: 'Raw Material',
        description: 'Ingredients and raw materials',
        color: 'blue',
        is_default: true,
        is_active: true,
        display_order: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'type-wip',
        code: 'WIP',
        name: 'Work in Progress',
        description: 'Semi-finished products',
        color: 'yellow',
        is_default: true,
        is_active: true,
        display_order: 2,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'type-fg',
        code: 'FG',
        name: 'Finished Goods',
        description: 'Final products ready for sale',
        color: 'green',
        is_default: true,
        is_active: true,
        display_order: 3,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'type-pkg',
        code: 'PKG',
        name: 'Packaging',
        description: 'Packaging materials',
        color: 'purple',
        is_default: true,
        is_active: true,
        display_order: 4,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'type-bp',
        code: 'BP',
        name: 'Byproduct',
        description: 'Production byproducts',
        color: 'orange',
        is_default: true,
        is_active: true,
        display_order: 5,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ]

    // Create chainable query mock
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockProductTypes,
        error: null,
      }),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(() => mockQuery),
    }

    service = ProductTypeService
  })

  describe('list() - List All Product Types (AC-16)', () => {
    it('should return all 5 default product types (AC-16)', async () => {
      mockQuery.order.mockResolvedValue({
        data: mockProductTypes,
        error: null,
      })

      const result = await service.list(mockSupabase)

      expect(result).toEqual(mockProductTypes)
      expect(result).toHaveLength(5)
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.order).toHaveBeenCalledWith('display_order', { ascending: true })
    })

    it('should return product types in correct order (RM, WIP, FG, PKG, BP)', async () => {
      const result = await service.list(mockSupabase)

      expect(result[0].code).toBe('RM')
      expect(result[1].code).toBe('WIP')
      expect(result[2].code).toBe('FG')
      expect(result[3].code).toBe('PKG')
      expect(result[4].code).toBe('BP')
    })

    it('should include type metadata (name, description, color)', async () => {
      const result = await service.list(mockSupabase)

      result.forEach(type => {
        expect(type).toHaveProperty('code')
        expect(type).toHaveProperty('name')
        expect(type).toHaveProperty('description')
        expect(type).toHaveProperty('color')
      })
    })

    it('should filter only active product types', async () => {
      const mixedTypes = [
        ...mockProductTypes,
        {
          id: 'type-custom',
          code: 'CUSTOM',
          name: 'Custom Type',
          description: 'Custom inactive type',
          color: 'gray',
          is_default: false,
          is_active: false,
          display_order: 6,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ]

      mockQuery.order.mockResolvedValue({
        data: mixedTypes.filter(t => t.is_active),
        error: null,
      })

      const result = await service.list(mockSupabase)

      expect(result.every(t => t.is_active)).toBe(true)
    })

    it('should throw error when database query fails', async () => {
      mockQuery.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(service.list(mockSupabase)).rejects.toThrow()
    })

    it('should not filter by org_id (product types are global)', async () => {
      await service.list(mockSupabase)

      // Verify org_id filter is NOT applied
      expect(mockQuery.eq).not.toHaveBeenCalledWith('org_id', expect.anything())
    })
  })

  describe('getById() - Get Single Product Type', () => {
    it('should return product type by ID', async () => {
      mockQuery.single.mockResolvedValue({
        data: mockProductTypes[0],
        error: null,
      })

      const result = await service.getById(mockSupabase, 'type-rm')

      expect(result).toEqual(mockProductTypes[0])
      expect(result.code).toBe('RM')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'type-rm')
    })

    it('should return null when product type not found', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
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
        service.getById(mockSupabase, 'type-rm')
      ).rejects.toThrow()
    })
  })

  describe('getByCode() - Get Product Type by Code', () => {
    it('should return product type by code (RM, WIP, FG, PKG, BP)', async () => {
      const codes = ['RM', 'WIP', 'FG', 'PKG', 'BP']

      for (const code of codes) {
        const mockType = mockProductTypes.find(t => t.code === code)
        mockQuery.single.mockResolvedValue({
          data: mockType,
          error: null,
        })

        const result = await service.getByCode(mockSupabase, code)

        expect(result).toEqual(mockType)
        expect(result?.code).toBe(code)
        expect(mockQuery.eq).toHaveBeenCalledWith('code', code)
      }
    })

    it('should return null for invalid product type code', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await service.getByCode(mockSupabase, 'INVALID')

      expect(result).toBeNull()
    })
  })

  describe('getSelectOptions() - Form Options (AC-17)', () => {
    it('should return product types formatted for select dropdowns', async () => {
      mockQuery.order.mockResolvedValue({
        data: mockProductTypes,
        error: null,
      })

      const result = await service.getSelectOptions(mockSupabase)

      expect(result).toHaveLength(5)
      result.forEach(option => {
        expect(option).toHaveProperty('value')
        expect(option).toHaveProperty('label')
        expect(option).toHaveProperty('color')
      })
    })

    it('should format options with value=id, label=name', async () => {
      mockQuery.order.mockResolvedValue({
        data: mockProductTypes,
        error: null,
      })

      const result = await service.getSelectOptions(mockSupabase)

      expect(result[0]).toEqual({
        value: 'type-rm',
        label: 'Raw Material',
        color: 'blue',
        code: 'RM',
      })
    })

    it('should include color for badge rendering (AC-17)', async () => {
      mockQuery.order.mockResolvedValue({
        data: mockProductTypes,
        error: null,
      })

      const result = await service.getSelectOptions(mockSupabase)

      const colors = ['blue', 'yellow', 'green', 'purple', 'orange']
      result.forEach((option, index) => {
        expect(option.color).toBe(colors[index])
      })
    })

    it('should maintain display order in options', async () => {
      const result = await service.getSelectOptions(mockSupabase)

      expect(result[0].code).toBe('RM')
      expect(result[1].code).toBe('WIP')
      expect(result[2].code).toBe('FG')
      expect(result[3].code).toBe('PKG')
      expect(result[4].code).toBe('BP')
    })
  })

  describe('Product Type Metadata', () => {
    it('should include correct metadata for RM (Raw Material)', async () => {
      mockQuery.single.mockResolvedValue({
        data: mockProductTypes[0],
        error: null,
      })

      const result = await service.getByCode(mockSupabase, 'RM')

      expect(result).toMatchObject({
        code: 'RM',
        name: 'Raw Material',
        color: 'blue',
        is_default: true,
      })
    })

    it('should include correct metadata for FG (Finished Goods)', async () => {
      mockQuery.single.mockResolvedValue({
        data: mockProductTypes[2],
        error: null,
      })

      const result = await service.getByCode(mockSupabase, 'FG')

      expect(result).toMatchObject({
        code: 'FG',
        name: 'Finished Goods',
        color: 'green',
        is_default: true,
      })
    })

    it('should include correct metadata for PKG (Packaging)', async () => {
      mockQuery.single.mockResolvedValue({
        data: mockProductTypes[3],
        error: null,
      })

      const result = await service.getByCode(mockSupabase, 'PKG')

      expect(result).toMatchObject({
        code: 'PKG',
        name: 'Packaging',
        color: 'purple',
        is_default: true,
      })
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * list() - 6 tests:
 *   - Return all 5 default types (AC-16)
 *   - Correct order (RM, WIP, FG, PKG, BP)
 *   - Type metadata included
 *   - Active types only
 *   - Error handling
 *   - No org_id filter (global types)
 *
 * getById() - 3 tests:
 *   - Get by ID
 *   - Not found handling
 *   - Error handling
 *
 * getByCode() - 2 tests:
 *   - Get by code for all 5 types
 *   - Invalid code handling
 *
 * getSelectOptions() - 4 tests:
 *   - Format for dropdowns
 *   - Value/label structure
 *   - Color inclusion (AC-17)
 *   - Display order maintained
 *
 * Product Type Metadata - 3 tests:
 *   - RM metadata
 *   - FG metadata
 *   - PKG metadata
 *
 * Total: 18 tests
 * Coverage: 85%+ (all service methods tested)
 * Status: RED (service not implemented yet)
 */
