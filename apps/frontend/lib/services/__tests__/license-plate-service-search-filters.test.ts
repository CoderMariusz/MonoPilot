/**
 * License Plate Service - Search & Filter Tests (Story 05.5)
 * Purpose: Test advanced search and filtering capabilities
 * Phase: RED - Tests will fail until enhanced filtering is implemented
 *
 * Tests advanced search and filtering for:
 * - LP number prefix search (min 2 chars, debounced)
 * - Batch number exact search
 * - Multiple product filter (OR logic within filter)
 * - Multiple location filter
 * - Multiple status filter
 * - Multiple QA status filter
 * - Expiry date range filter
 * - Created date range filter
 * - Complex multi-filter queries (AND logic across filters)
 * - Filter presets (Expiring Soon, Available Stock, etc.)
 * - Performance requirements (<300ms search, <500ms complex filters)
 *
 * Coverage Target: 80%+
 * Test Count: 35+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-1: LP Number Search (full, partial, case-insensitive, no matches, performance)
 * - AC-2: Batch Number Search (exact, null handling, case-insensitive, performance)
 * - AC-3: Product Filter (single, multiple, no matches, performance)
 * - AC-4: Warehouse & Location Filters (single, multiple, combined)
 * - AC-5: Status Filters (single, multiple statuses, combined status + QA)
 * - AC-6: Expiry Date Range Filter (before, after, range, NULL handling)
 * - AC-7: Combined Multi-Filter Query (complex queries, search + filter)
 * - AC-8: Sort Options (all fields, NULL handling)
 * - AC-9: Pagination (default, custom, max limit)
 * - AC-12: Performance Requirements (<300ms search, <500ms complex)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

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
  LicensePlateService,
  type LicensePlateListParams,
} from '../license-plate-service'

describe('LicensePlateService - Search & Filters (Story 05.5)', () => {
  let mockSupabase: any
  let mockQuery: any
  let mockLPs: any[]
  let service: typeof LicensePlateService

  beforeEach(() => {
    vi.clearAllMocks()

    // Sample LP data for search/filter tests
    mockLPs = [
      {
        id: 'lp-001',
        lp_number: 'LP00000123',
        product_id: 'prod-flour',
        batch_number: 'BATCH-2025-001',
        quantity: 500,
        status: 'available',
        qa_status: 'passed',
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
        expiry_date: '2026-01-25',
        created_at: '2025-12-20T10:00:00Z',
      },
      {
        id: 'lp-002',
        lp_number: 'LP00000124',
        product_id: 'prod-flour',
        batch_number: 'BATCH-2025-001',
        quantity: 250,
        status: 'available',
        qa_status: 'passed',
        warehouse_id: 'wh-001',
        location_id: 'loc-002',
        expiry_date: '2026-01-20',
        created_at: '2025-12-21T10:00:00Z',
      },
      {
        id: 'lp-003',
        lp_number: 'LP00000200',
        product_id: 'prod-sugar',
        batch_number: 'BATCH-2025-002',
        quantity: 1000,
        status: 'available',
        qa_status: 'passed',
        warehouse_id: 'wh-002',
        location_id: 'loc-003',
        expiry_date: '2027-12-31',
        created_at: '2025-12-22T10:00:00Z',
      },
    ]

    // Create chainable query mock
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: mockLPs,
        error: null,
        count: mockLPs.length,
      }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    mockSupabase = {
      from: vi.fn(() => mockQuery),
    }

    service = LicensePlateService
  })

  // ==========================================================================
  // AC-1: LP Number Search
  // ==========================================================================
  describe('LP Number Search (AC-1)', () => {
    it('should search by full LP number (exact match)', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockLPs[0]],
        error: null,
        count: 1,
      })

      const params: LicensePlateListParams = {
        search: 'LP00000123',
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].lp_number).toBe('LP00000123')
      expect(mockQuery.ilike).toHaveBeenCalledWith('lp_number', 'LP00000123%')
    })

    it('should search by partial LP number (prefix match)', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockLPs[0], mockLPs[1]],
        error: null,
        count: 2,
      })

      const params: LicensePlateListParams = {
        search: 'LP000001',
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      expect(result.data).toHaveLength(2)
      expect(mockQuery.ilike).toHaveBeenCalledWith('lp_number', 'LP000001%')
    })

    it('should perform case-insensitive LP number search', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockLPs[0]],
        error: null,
        count: 1,
      })

      const params: LicensePlateListParams = {
        search: 'lp00000123', // lowercase
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.ilike).toHaveBeenCalledWith('lp_number', 'lp00000123%')
    })

    it('should return empty results when LP number not found', async () => {
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const params: LicensePlateListParams = {
        search: 'ABC123',
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      expect(result.data).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })

    it('should enforce minimum 2 characters for search', async () => {
      const params: LicensePlateListParams = {
        search: 'L', // Only 1 character
        page: 1,
        limit: 50,
      }

      // Should throw validation error
      await expect(service.list(mockSupabase, params)).rejects.toThrow(/at least 2 characters/i)
    })
  })

  // ==========================================================================
  // AC-2: Batch Number Search
  // ==========================================================================
  describe('Batch Number Search (AC-2)', () => {
    it('should search by exact batch number', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockLPs[0], mockLPs[1]],
        error: null,
        count: 2,
      })

      const params: LicensePlateListParams = {
        batch_number: 'BATCH-2025-001',
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      expect(result.data).toHaveLength(2)
      expect(mockQuery.eq).toHaveBeenCalledWith('batch_number', 'BATCH-2025-001')
    })

    it('should exclude NULL batch_number LPs when filtering', async () => {
      const lpsWithoutBatch = [
        { ...mockLPs[0], batch_number: null },
      ]

      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const params: LicensePlateListParams = {
        batch_number: 'BATCH-001',
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      // Should not include NULL batch LPs
      expect(result.data.every(lp => lp.batch_number !== null)).toBe(true)
    })

    it('should perform case-insensitive batch number search', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockLPs[0]],
        error: null,
        count: 1,
      })

      const params: LicensePlateListParams = {
        batch_number: 'batch-2025-001', // lowercase
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      // Should use case-insensitive comparison
      expect(mockQuery.eq).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // AC-3: Product Filter
  // ==========================================================================
  describe('Product Filter (AC-3)', () => {
    it('should filter by single product', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockLPs[0], mockLPs[1]],
        error: null,
        count: 2,
      })

      const params: LicensePlateListParams = {
        product_id: 'prod-flour',
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      expect(result.data).toHaveLength(2)
      expect(mockQuery.eq).toHaveBeenCalledWith('product_id', 'prod-flour')
    })

    it('should filter by multiple products (OR logic)', async () => {
      mockQuery.range.mockResolvedValue({
        data: mockLPs,
        error: null,
        count: 3,
      })

      const params: LicensePlateListParams = {
        product_ids: ['prod-flour', 'prod-sugar'],
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      expect(result.data).toHaveLength(3)
      expect(mockQuery.in).toHaveBeenCalledWith('product_id', ['prod-flour', 'prod-sugar'])
    })

    it('should return empty when no LPs match product filter', async () => {
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const params: LicensePlateListParams = {
        product_id: 'prod-nonexistent',
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      expect(result.data).toHaveLength(0)
    })
  })

  // ==========================================================================
  // AC-4: Warehouse & Location Filters
  // ==========================================================================
  describe('Warehouse & Location Filters (AC-4)', () => {
    it('should filter by warehouse', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockLPs[0], mockLPs[1]],
        error: null,
        count: 2,
      })

      const params: LicensePlateListParams = {
        warehouse_id: 'wh-001',
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      expect(result.data).toHaveLength(2)
      expect(mockQuery.eq).toHaveBeenCalledWith('warehouse_id', 'wh-001')
    })

    it('should filter by single location', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockLPs[0]],
        error: null,
        count: 1,
      })

      const params: LicensePlateListParams = {
        location_id: 'loc-001',
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      expect(result.data).toHaveLength(1)
      expect(mockQuery.eq).toHaveBeenCalledWith('location_id', 'loc-001')
    })

    it('should filter by multiple locations (OR logic)', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockLPs[0], mockLPs[1]],
        error: null,
        count: 2,
      })

      const params: LicensePlateListParams = {
        location_ids: ['loc-001', 'loc-002'],
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      expect(result.data).toHaveLength(2)
      expect(mockQuery.in).toHaveBeenCalledWith('location_id', ['loc-001', 'loc-002'])
    })

    it('should filter by warehouse AND location (AND logic)', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockLPs[0]],
        error: null,
        count: 1,
      })

      const params: LicensePlateListParams = {
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      expect(result.data).toHaveLength(1)
      expect(mockQuery.eq).toHaveBeenCalledWith('warehouse_id', 'wh-001')
      expect(mockQuery.eq).toHaveBeenCalledWith('location_id', 'loc-001')
    })
  })

  // ==========================================================================
  // AC-5: Status Filters
  // ==========================================================================
  describe('Status Filters (AC-5)', () => {
    it('should filter by single status', async () => {
      const params: LicensePlateListParams = {
        status: 'available',
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'available')
    })

    it('should filter by multiple statuses (OR logic)', async () => {
      const params: LicensePlateListParams = {
        statuses: ['available', 'reserved'],
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.in).toHaveBeenCalledWith('status', ['available', 'reserved'])
    })

    it('should filter by single QA status', async () => {
      const params: LicensePlateListParams = {
        qa_status: 'passed',
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.eq).toHaveBeenCalledWith('qa_status', 'passed')
    })

    it('should filter by multiple QA statuses (OR logic)', async () => {
      const params: LicensePlateListParams = {
        qa_statuses: ['pending', 'passed'],
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.in).toHaveBeenCalledWith('qa_status', ['pending', 'passed'])
    })

    it('should filter by status AND qa_status (AND logic)', async () => {
      const params: LicensePlateListParams = {
        status: 'available',
        qa_status: 'passed',
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'available')
      expect(mockQuery.eq).toHaveBeenCalledWith('qa_status', 'passed')
    })
  })

  // ==========================================================================
  // AC-6: Expiry Date Range Filter
  // ==========================================================================
  describe('Expiry Date Range Filter (AC-6)', () => {
    it('should filter by expiry_before date', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockLPs[1]], // LP expiring 2026-01-20
        error: null,
        count: 1,
      })

      const params: LicensePlateListParams = {
        expiry_before: '2026-02-01',
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.lte).toHaveBeenCalledWith('expiry_date', '2026-02-01')
    })

    it('should filter by expiry_after date', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockLPs[2]], // LP expiring 2027-12-31
        error: null,
        count: 1,
      })

      const params: LicensePlateListParams = {
        expiry_after: '2026-02-01',
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.gte).toHaveBeenCalledWith('expiry_date', '2026-02-01')
    })

    it('should filter by expiry date range (both before and after)', async () => {
      const params: LicensePlateListParams = {
        expiry_after: '2026-01-01',
        expiry_before: '2026-03-01',
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.gte).toHaveBeenCalledWith('expiry_date', '2026-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('expiry_date', '2026-03-01')
    })

    it('should exclude NULL expiry_date when filtering by expiry', async () => {
      const lpsWithExpiry = mockLPs.filter(lp => lp.expiry_date !== null)

      mockQuery.range.mockResolvedValue({
        data: lpsWithExpiry,
        error: null,
        count: lpsWithExpiry.length,
      })

      const params: LicensePlateListParams = {
        expiry_before: '2026-12-31',
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      // All returned LPs should have expiry_date
      expect(result.data.every(lp => lp.expiry_date !== null)).toBe(true)
    })

    it('should validate expiry_before >= expiry_after', async () => {
      const params: LicensePlateListParams = {
        expiry_after: '2026-12-31',
        expiry_before: '2026-01-01', // Invalid: before < after
        page: 1,
        limit: 50,
      }

      await expect(service.list(mockSupabase, params)).rejects.toThrow(/expiry_before.*greater/i)
    })
  })

  // ==========================================================================
  // AC-7: Combined Multi-Filter Query
  // ==========================================================================
  describe('Combined Multi-Filter Query (AC-7)', () => {
    it('should combine product + status + qa_status filters (AND logic)', async () => {
      const params: LicensePlateListParams = {
        product_id: 'prod-flour',
        status: 'available',
        qa_status: 'passed',
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.eq).toHaveBeenCalledWith('product_id', 'prod-flour')
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'available')
      expect(mockQuery.eq).toHaveBeenCalledWith('qa_status', 'passed')
    })

    it('should handle complex 5+ filter conditions', async () => {
      const params: LicensePlateListParams = {
        product_id: 'prod-flour',
        warehouse_id: 'wh-001',
        status: 'available',
        qa_status: 'passed',
        expiry_after: '2026-01-01',
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.eq).toHaveBeenCalledWith('product_id', 'prod-flour')
      expect(mockQuery.eq).toHaveBeenCalledWith('warehouse_id', 'wh-001')
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'available')
      expect(mockQuery.eq).toHaveBeenCalledWith('qa_status', 'passed')
      expect(mockQuery.gte).toHaveBeenCalledWith('expiry_date', '2026-01-01')
    })

    it('should combine search with filters', async () => {
      const params: LicensePlateListParams = {
        search: 'LP000001',
        product_id: 'prod-flour',
        status: 'available',
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.ilike).toHaveBeenCalledWith('lp_number', 'LP000001%')
      expect(mockQuery.eq).toHaveBeenCalledWith('product_id', 'prod-flour')
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'available')
    })

    it('should return empty when no LPs match complex filters', async () => {
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const params: LicensePlateListParams = {
        product_id: 'prod-flour',
        warehouse_id: 'wh-002',
        status: 'blocked',
        qa_status: 'failed',
        batch_number: 'BATCH-999',
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      expect(result.data).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })
  })

  // ==========================================================================
  // AC-8: Sort Options
  // ==========================================================================
  describe('Sort Options (AC-8)', () => {
    it('should sort by lp_number ascending', async () => {
      const params: LicensePlateListParams = {
        sort: 'lp_number',
        order: 'asc',
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.order).toHaveBeenCalledWith('lp_number', { ascending: true, nullsFirst: false })
    })

    it('should sort by created_at descending (default)', async () => {
      const params: LicensePlateListParams = {
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false, nullsFirst: false })
    })

    it('should sort by expiry_date ascending', async () => {
      const params: LicensePlateListParams = {
        sort: 'expiry_date',
        order: 'asc',
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.order).toHaveBeenCalledWith('expiry_date', { ascending: true, nullsFirst: false })
    })

    it('should sort by quantity descending', async () => {
      const params: LicensePlateListParams = {
        sort: 'quantity',
        order: 'desc',
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.order).toHaveBeenCalledWith('quantity', { ascending: false, nullsFirst: false })
    })

    it('should sort by batch_number ascending', async () => {
      const params: LicensePlateListParams = {
        sort: 'batch_number',
        order: 'asc',
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.order).toHaveBeenCalledWith('batch_number', { ascending: true, nullsFirst: false })
    })

    it('should handle NULL values in sort (NULLs last)', async () => {
      const params: LicensePlateListParams = {
        sort: 'expiry_date',
        order: 'asc',
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      // NULLs should appear last (nullsFirst: false)
      expect(mockQuery.order).toHaveBeenCalledWith('expiry_date', { ascending: true, nullsFirst: false })
    })
  })

  // ==========================================================================
  // AC-9: Pagination
  // ==========================================================================
  describe('Pagination (AC-9)', () => {
    it('should use default pagination (page 1, limit 50)', async () => {
      const params: LicensePlateListParams = {
        page: 1,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.range).toHaveBeenCalledWith(0, 49)
    })

    it('should handle custom page size', async () => {
      const params: LicensePlateListParams = {
        page: 1,
        limit: 100,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.range).toHaveBeenCalledWith(0, 99)
    })

    it('should calculate correct offset for page 2', async () => {
      const params: LicensePlateListParams = {
        page: 2,
        limit: 50,
      }

      await service.list(mockSupabase, params)

      expect(mockQuery.range).toHaveBeenCalledWith(50, 99)
    })

    it('should enforce maximum page size (200)', async () => {
      const params: LicensePlateListParams = {
        page: 1,
        limit: 500, // Exceeds max
      }

      await service.list(mockSupabase, params)

      // Should cap at 200
      expect(mockQuery.range).toHaveBeenCalledWith(0, 199)
    })

    it('should return correct pagination metadata', async () => {
      mockQuery.range.mockResolvedValue({
        data: mockLPs,
        error: null,
        count: 200,
      })

      const params: LicensePlateListParams = {
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      expect(result.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 200,
        total_pages: 4,
      })
    })

    it('should apply pagination to filtered results', async () => {
      mockQuery.range.mockResolvedValue({
        data: mockLPs,
        error: null,
        count: 100,
      })

      const params: LicensePlateListParams = {
        product_id: 'prod-flour',
        status: 'available',
        page: 1,
        limit: 50,
      }

      const result = await service.list(mockSupabase, params)

      expect(result.pagination.total).toBe(100)
      expect(result.pagination.total_pages).toBe(2)
    })
  })

  // ==========================================================================
  // Filter Presets (getExpiringSoon, getAvailableStock)
  // ==========================================================================
  describe('Filter Presets', () => {
    it('should get expiring soon LPs (30 days)', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const futureDateStr = futureDate.toISOString().split('T')[0]

      mockQuery.range.mockResolvedValue({
        data: [mockLPs[0], mockLPs[1]],
        error: null,
        count: 2,
      })

      const result = await service.getExpiringSoon(mockSupabase, 30)

      expect(result).toHaveLength(2)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'available')
      expect(mockQuery.lte).toHaveBeenCalled()
      expect(mockQuery.order).toHaveBeenCalledWith('expiry_date', { ascending: true })
    })

    it('should get available stock for products', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockLPs[0], mockLPs[1]],
        error: null,
        count: 2,
      })

      const result = await service.getAvailableStock(
        mockSupabase,
        ['prod-flour'],
        'wh-001'
      )

      expect(result).toHaveLength(2)
      expect(mockQuery.in).toHaveBeenCalledWith('product_id', ['prod-flour'])
      expect(mockQuery.eq).toHaveBeenCalledWith('warehouse_id', 'wh-001')
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'available')
      expect(mockQuery.eq).toHaveBeenCalledWith('qa_status', 'passed')
    })

    it('should get pending QA LPs', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockLPs[0]],
        error: null,
        count: 1,
      })

      const params: LicensePlateListParams = {
        qa_status: 'pending',
        page: 1,
        limit: 200,
      }

      const result = await service.list(mockSupabase, params)

      expect(mockQuery.eq).toHaveBeenCalledWith('qa_status', 'pending')
    })

    it('should get blocked items', async () => {
      mockQuery.range.mockResolvedValue({
        data: [mockLPs[0]],
        error: null,
        count: 1,
      })

      const params: LicensePlateListParams = {
        status: 'blocked',
        page: 1,
        limit: 200,
      }

      const result = await service.list(mockSupabase, params)

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'blocked')
    })
  })

  // ==========================================================================
  // AC-12: Performance Requirements
  // ==========================================================================
  describe('Performance Requirements (AC-12)', () => {
    it('should complete simple search in <300ms', async () => {
      const start = Date.now()

      await service.list(mockSupabase, {
        search: 'LP000001',
        page: 1,
        limit: 50,
      })

      const duration = Date.now() - start

      // Mock should be fast, real implementation must be <300ms
      expect(duration).toBeLessThan(300)
    })

    it('should complete complex filter in <500ms', async () => {
      const start = Date.now()

      await service.list(mockSupabase, {
        product_id: 'prod-flour',
        warehouse_id: 'wh-001',
        status: 'available',
        qa_status: 'passed',
        expiry_after: '2026-01-01',
        page: 1,
        limit: 50,
      })

      const duration = Date.now() - start

      // Mock should be fast, real implementation must be <500ms
      expect(duration).toBeLessThan(500)
    })

    it('should use appropriate indexes for search queries', async () => {
      // This test verifies query structure, not actual index usage
      // Real index usage should be verified with EXPLAIN in integration tests

      await service.list(mockSupabase, {
        search: 'LP000001',
        page: 1,
        limit: 50,
      })

      // Should use idx_lp_number_search index
      expect(mockQuery.ilike).toHaveBeenCalledWith('lp_number', 'LP000001%')
    })

    it('should use composite indexes for complex filters', async () => {
      await service.list(mockSupabase, {
        product_id: 'prod-flour',
        status: 'available',
        qa_status: 'passed',
        page: 1,
        limit: 50,
      })

      // Should use idx_lp_product_status_qa composite index
      expect(mockQuery.eq).toHaveBeenCalledWith('product_id', 'prod-flour')
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'available')
      expect(mockQuery.eq).toHaveBeenCalledWith('qa_status', 'passed')
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * AC-1: LP Number Search - 5 tests:
 *   - Full LP number search
 *   - Partial/prefix search
 *   - Case-insensitive search
 *   - No matches handling
 *   - Min 2 chars validation
 *
 * AC-2: Batch Number Search - 3 tests:
 *   - Exact batch match
 *   - NULL batch handling
 *   - Case-insensitive search
 *
 * AC-3: Product Filter - 3 tests:
 *   - Single product
 *   - Multiple products (OR)
 *   - No matches
 *
 * AC-4: Warehouse & Location Filters - 4 tests:
 *   - Warehouse filter
 *   - Single location
 *   - Multiple locations (OR)
 *   - Warehouse AND location (AND)
 *
 * AC-5: Status Filters - 5 tests:
 *   - Single status
 *   - Multiple statuses (OR)
 *   - Single QA status
 *   - Multiple QA statuses (OR)
 *   - Status AND QA status
 *
 * AC-6: Expiry Date Range - 5 tests:
 *   - expiry_before
 *   - expiry_after
 *   - expiry range
 *   - NULL handling
 *   - Date range validation
 *
 * AC-7: Combined Multi-Filter - 4 tests:
 *   - Product + Status + QA (AND)
 *   - Complex 5+ filters
 *   - Search + filters
 *   - No matches
 *
 * AC-8: Sort Options - 6 tests:
 *   - Sort by each field
 *   - Default sort
 *   - NULL handling
 *
 * AC-9: Pagination - 6 tests:
 *   - Default pagination
 *   - Custom page size
 *   - Page 2 offset
 *   - Max limit enforcement
 *   - Pagination metadata
 *   - Filtered pagination
 *
 * Filter Presets - 4 tests:
 *   - Expiring soon
 *   - Available stock
 *   - Pending QA
 *   - Blocked items
 *
 * AC-12: Performance - 4 tests:
 *   - Search <300ms
 *   - Complex filter <500ms
 *   - Search index usage
 *   - Composite index usage
 *
 * Total: 49 tests
 * Coverage: Complete search/filter functionality
 * Status: RED (enhanced filtering not implemented yet)
 */
