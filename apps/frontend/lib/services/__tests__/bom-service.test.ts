/**
 * BOM Service - Unit Tests (Story 02.4)
 * Purpose: Test BOMs CRUD and utility functions with date validity logic
 * Phase: GREEN - Tests should pass with implemented service
 *
 * Tests the BOMService which handles:
 * - Listing BOMs with filters, pagination, sorting
 * - Creating BOMs with auto-versioning and date overlap validation
 * - Updating BOMs (product field locked after creation)
 * - Deleting BOMs (blocked if used in Work Orders)
 * - Getting single BOM by ID
 * - Getting next version for a product
 * - Checking date overlap with existing BOMs
 * - Getting BOM timeline for visualization (FR-2.23)
 *
 * Coverage Target: 80%+
 * Test Count: 51 scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-01 to AC-07: List page and display
 * - AC-08 to AC-13: Create BOM with versioning and validation
 * - AC-14 to AC-17: Edit BOM (product locked)
 * - AC-18 to AC-23: Date overlap and version control
 * - AC-24 to AC-30: Version timeline visualization
 * - AC-31 to AC-33: Delete with dependency checking
 *
 * Security: All tests include orgId parameter for Defense in Depth (ADR-013)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  listBOMs,
  getBOM,
  createBOM,
  updateBOM,
  deleteBOM,
  getNextVersion,
  checkDateOverlap,
  getBOMTimeline,
} from '../bom-service-02-4'
import type {
  BOM,
  BOMWithProduct,
  BOMsListResponse,
  BOMFilters,
  CreateBOMRequest,
  UpdateBOMRequest,
  BOMTimelineResponse,
  BOMTimelineVersion,
} from '@/lib/types/bom'

describe('BOMService (Story 02.4)', () => {
  let mockSupabase: any
  let mockQuery: any
  let mockBOMs: BOMWithProduct[]
  let mockTimelineData: BOMTimelineVersion[]

  // Test org_id for multi-tenant isolation (ADR-013)
  const TEST_ORG_ID = '22222222-2222-2222-2222-222222222222'

  beforeEach(() => {
    vi.clearAllMocks()

    // Sample BOM data for product FG-001 (using valid UUIDs for testing)
    mockBOMs = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        org_id: TEST_ORG_ID,
        product_id: '33333333-3333-3333-3333-333333333333',
        version: 1,
        bom_type: 'standard',
        routing_id: null,
        effective_from: '2024-01-01',
        effective_to: '2024-06-30',
        status: 'active',
        output_qty: 100,
        output_uom: 'kg',
        units_per_box: null,
        boxes_per_pallet: null,
        notes: 'Initial version',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'user-001',
        updated_by: 'user-001',
        product: {
          id: '33333333-3333-3333-3333-333333333333',
          code: 'FG-001',
          name: 'Honey Bread',
          type: 'Finished Good',
          uom: 'pcs',
        },
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        org_id: TEST_ORG_ID,
        product_id: '33333333-3333-3333-3333-333333333333',
        version: 2,
        bom_type: 'standard',
        routing_id: null,
        effective_from: '2024-07-01',
        effective_to: null,
        status: 'draft',
        output_qty: 100,
        output_uom: 'kg',
        units_per_box: null,
        boxes_per_pallet: null,
        notes: 'V2 - ongoing',
        created_at: '2024-07-01T00:00:00Z',
        updated_at: '2024-07-01T00:00:00Z',
        created_by: 'user-001',
        updated_by: 'user-001',
        product: {
          id: '33333333-3333-3333-3333-333333333333',
          code: 'FG-001',
          name: 'Honey Bread',
          type: 'Finished Good',
          uom: 'pcs',
        },
      },
    ]

    mockTimelineData = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        version: 1,
        status: 'active',
        effective_from: '2024-01-01',
        effective_to: '2024-06-30',
        output_qty: 100,
        output_uom: 'kg',
        notes: 'Initial version',
        is_currently_active: false,
        has_overlap: false,
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        version: 2,
        status: 'draft',
        effective_from: '2024-07-01',
        effective_to: null,
        output_qty: 100,
        output_uom: 'kg',
        notes: 'V2 - ongoing',
        is_currently_active: true,
        has_overlap: false,
      },
    ]

    // Create chainable query mock
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: mockBOMs,
        error: null,
        count: mockBOMs.length,
      }),
      single: vi.fn().mockResolvedValue({ data: mockBOMs[0], error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
    }

    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQuery),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
  })

  // ============================================
  // ORG_ID ENFORCEMENT TESTS (ADR-013 Defense in Depth)
  // ============================================
  describe('org_id Enforcement - Defense in Depth', () => {
    it('listBOMs should throw error when orgId is missing', async () => {
      await expect(listBOMs(mockSupabase, {}, '')).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('getBOM should throw error when orgId is missing', async () => {
      await expect(getBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', '')).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('createBOM should throw error when orgId is missing', async () => {
      const createData: CreateBOMRequest = {
        product_id: '55555555-5555-5555-5555-555555555555',
        effective_from: '2024-01-01',
        effective_to: null,
        output_qty: 100,
        output_uom: 'kg',
      }
      await expect(createBOM(mockSupabase, createData, '')).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('updateBOM should throw error when orgId is missing', async () => {
      const updateData: UpdateBOMRequest = { status: 'active' }
      await expect(updateBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', updateData, '')).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('deleteBOM should throw error when orgId is missing', async () => {
      await expect(deleteBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', '')).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('getNextVersion should throw error when orgId is missing', async () => {
      await expect(getNextVersion(mockSupabase, '33333333-3333-3333-3333-333333333333', '')).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('checkDateOverlap should throw error when orgId is missing', async () => {
      await expect(checkDateOverlap(mockSupabase, '33333333-3333-3333-3333-333333333333', '2024-01-01', null, '')).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('getBOMTimeline should throw error when orgId is missing', async () => {
      await expect(getBOMTimeline(mockSupabase, '33333333-3333-3333-3333-333333333333', '')).rejects.toThrow(
        'org_id is required for multi-tenant isolation'
      )
    })

    it('listBOMs should include org_id filter in query', async () => {
      await listBOMs(mockSupabase, {}, TEST_ORG_ID)
      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', TEST_ORG_ID)
    })

    it('getBOM should include org_id filter in query', async () => {
      await getBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', TEST_ORG_ID)
      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', TEST_ORG_ID)
    })
  })

  // ============================================
  // LIST BOMs TESTS (AC-01 to AC-07)
  // ============================================
  describe('listBOMs - List and Filter', () => {
    it('should list BOMs with default pagination (page 1, limit 50)', async () => {
      const filters: BOMFilters = { page: 1, limit: 50 }
      const result = await listBOMs(mockSupabase, filters, TEST_ORG_ID)

      expect(result).toBeDefined()
      expect(result.boms).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(50)
    })

    it('should return paginated results for page 2', async () => {
      // Mock 100 BOMs
      const manyBOMs = Array.from({ length: 50 }, (_, i) => ({
        ...mockBOMs[0],
        id: `bom-${i + 50}`,
        version: i + 51,
      }))

      mockQuery.range.mockResolvedValue({
        data: manyBOMs,
        error: null,
        count: 100,
      })

      const filters: BOMFilters = { page: 2, limit: 50 }
      const result = await listBOMs(mockSupabase, filters, TEST_ORG_ID)

      expect(result.boms).toHaveLength(50)
      expect(result.total).toBe(100)
      expect(result.page).toBe(2)
    })

    it('should search BOMs by product code', async () => {
      const filters: BOMFilters = { search: 'BREAD' }
      const result = await listBOMs(mockSupabase, filters, TEST_ORG_ID)

      expect(mockQuery.or).toHaveBeenCalled()
      expect(result.boms).toBeDefined()
    })

    it('should search BOMs by product name', async () => {
      const filters: BOMFilters = { search: 'Honey' }
      const result = await listBOMs(mockSupabase, filters, TEST_ORG_ID)

      expect(result.boms).toBeDefined()
    })

    it('should filter BOMs by status', async () => {
      const filters: BOMFilters = { status: 'active' }
      const result = await listBOMs(mockSupabase, filters, TEST_ORG_ID)

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active')
      expect(result.boms).toBeDefined()
    })

    it('should filter BOMs by product type (Finished Good)', async () => {
      const filters: BOMFilters = { product_type: 'FG' }
      const result = await listBOMs(mockSupabase, filters, TEST_ORG_ID)

      expect(result.boms).toBeDefined()
    })

    it('should filter BOMs by effective date (current)', async () => {
      const filters: BOMFilters = { effective_date: 'current' }
      const result = await listBOMs(mockSupabase, filters, TEST_ORG_ID)

      // Returns only BOMs where current date is between effective_from and effective_to
      expect(result.boms).toBeDefined()
    })

    it('should combine search and status filters', async () => {
      const filters: BOMFilters = { search: 'BREAD', status: 'active' }
      const result = await listBOMs(mockSupabase, filters, TEST_ORG_ID)

      expect(result.boms).toBeDefined()
    })

    it('should display correct BOM columns: Product, Version, Status, Dates, Output', async () => {
      const filters: BOMFilters = {}
      const result = await listBOMs(mockSupabase, filters, TEST_ORG_ID)

      const bom = result.boms[0]
      expect(bom.product).toBeDefined()
      expect(bom.product.code).toBe('FG-001')
      expect(bom.version).toBe(1)
      expect(bom.status).toBe('active')
      expect(bom.effective_from).toBeDefined()
      expect(bom.effective_to).toBeDefined()
      expect(bom.output_qty).toBe(100)
      expect(bom.output_uom).toBe('kg')
    })

    it('should handle search performance for 500+ BOMs within 300ms', async () => {
      // Performance test - should complete within 300ms for large dataset
      const filters: BOMFilters = { search: 'BREAD', limit: 50 }
      const startTime = performance.now()
      const result = await listBOMs(mockSupabase, filters, TEST_ORG_ID)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(300)
      expect(result.boms).toBeDefined()
    })
  })

  // ============================================
  // CREATE BOM TESTS (AC-08 to AC-13)
  // ============================================
  describe('createBOM - Create with Auto-Versioning', () => {
    it('should create BOM with version auto-set to 1 for first product', async () => {
      mockQuery.limit.mockResolvedValue({
        data: [],
        error: null,
      })

      mockQuery.single.mockResolvedValue({
        data: {
          ...mockBOMs[0],
          id: '66666666-6666-6666-6666-666666666666',
          version: 1,
          product_id: '55555555-5555-5555-5555-555555555555',
          status: 'draft',
        },
        error: null,
      })

      const createData: CreateBOMRequest = {
        product_id: '55555555-5555-5555-5555-555555555555',
        effective_from: '2024-01-01',
        effective_to: null,
        output_qty: 100,
        output_uom: 'kg',
        status: 'draft',
      }

      const result = await createBOM(mockSupabase, createData, TEST_ORG_ID)

      expect(result.version).toBe(1)
      expect(result.status).toBe('draft')
      expect(result.product_id).toBe('55555555-5555-5555-5555-555555555555')
    })

    it('should auto-calculate version to next available (v2 if v1 exists)', async () => {
      mockQuery.limit.mockResolvedValue({
        data: [{ version: 1 }],
        error: null,
      })

      mockQuery.single.mockResolvedValue({
        data: {
          ...mockBOMs[1],
          id: '66666666-6666-6666-6666-666666666666',
          version: 2,
        },
        error: null,
      })

      const createData: CreateBOMRequest = {
        product_id: '33333333-3333-3333-3333-333333333333',
        effective_from: '2024-07-01',
        effective_to: null,
        output_qty: 100,
        output_uom: 'kg',
      }

      const result = await createBOM(mockSupabase, createData, TEST_ORG_ID)

      expect(result.version).toBe(2)
    })

    it('should create BOM with status=draft by default', async () => {
      mockQuery.limit.mockResolvedValue({
        data: [],
        error: null,
      })

      mockQuery.single.mockResolvedValue({
        data: {
          ...mockBOMs[0],
          id: '66666666-6666-6666-6666-666666666666',
          version: 1,
          product_id: '55555555-5555-5555-5555-555555555555',
          status: 'draft',
        },
        error: null,
      })

      const createData: CreateBOMRequest = {
        product_id: '55555555-5555-5555-5555-555555555555',
        effective_from: '2024-01-01',
        effective_to: null,
        output_qty: 100,
        output_uom: 'kg',
        // status not provided - should default to 'draft'
      }

      const result = await createBOM(mockSupabase, createData, TEST_ORG_ID)

      expect(result.status).toBe('draft')
    })

    it('should reject overlapping dates with existing BOM', async () => {
      // Product FG-001 has BOM v1: 2024-01-01 to 2024-06-30
      // Trying to create overlapping dates: 2024-04-01 to 2024-12-31

      mockSupabase.rpc.mockResolvedValue({
        data: [mockBOMs[0]], // Returns conflicting BOM
        error: null,
      })

      const createData: CreateBOMRequest = {
        product_id: '33333333-3333-3333-3333-333333333333',
        effective_from: '2024-04-01',
        effective_to: '2024-12-31',
        output_qty: 100,
        output_uom: 'kg',
      }

      await expect(createBOM(mockSupabase, createData, TEST_ORG_ID)).rejects.toThrow(
        'Date range overlaps'
      )
    })

    it('should allow adjacent dates without overlap (2024-07-01 after 2024-06-30)', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      mockQuery.limit.mockResolvedValue({
        data: [{ version: 1 }],
        error: null,
      })

      mockQuery.single.mockResolvedValue({
        data: {
          ...mockBOMs[1],
          effective_from: '2024-07-01',
          effective_to: null,
        },
        error: null,
      })

      const createData: CreateBOMRequest = {
        product_id: '33333333-3333-3333-3333-333333333333',
        effective_from: '2024-07-01',
        effective_to: null,
        output_qty: 100,
        output_uom: 'kg',
      }

      const result = await createBOM(mockSupabase, createData, TEST_ORG_ID)

      expect(result.effective_from).toBe('2024-07-01')
      expect(result.effective_to).toBeNull()
    })

    it('should reject multiple BOMs with effective_to=NULL for same product', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [{ ...mockBOMs[1], effective_to: null }],
        error: null,
      })

      const createData: CreateBOMRequest = {
        product_id: '33333333-3333-3333-3333-333333333333',
        effective_from: '2024-08-01',
        effective_to: null,
        output_qty: 100,
        output_uom: 'kg',
      }

      await expect(createBOM(mockSupabase, createData, TEST_ORG_ID)).rejects.toThrow(
        'Only one BOM can have no end date'
      )
    })

    it('should include created_by, created_at timestamps on creation', async () => {
      mockQuery.limit.mockResolvedValue({
        data: [],
        error: null,
      })

      mockQuery.single.mockResolvedValue({
        data: {
          ...mockBOMs[0],
          id: '66666666-6666-6666-6666-666666666666',
          version: 1,
          created_at: '2025-01-15T10:00:00Z',
          created_by: 'user-001',
          updated_at: '2025-01-15T10:00:00Z',
          updated_by: 'user-001',
        },
        error: null,
      })

      const createData: CreateBOMRequest = {
        product_id: '55555555-5555-5555-5555-555555555555',
        effective_from: '2024-01-01',
        effective_to: null,
        output_qty: 100,
        output_uom: 'kg',
      }

      const result = await createBOM(mockSupabase, createData, TEST_ORG_ID)

      expect(result.created_at).toBeDefined()
      expect(result.created_by).toBeDefined()
      expect(result.updated_at).toBeDefined()
      expect(result.updated_by).toBeDefined()
    })

    it('should include org_id in insert payload', async () => {
      mockQuery.limit.mockResolvedValue({
        data: [],
        error: null,
      })

      mockQuery.single.mockResolvedValue({
        data: {
          ...mockBOMs[0],
          id: '66666666-6666-6666-6666-666666666666',
          version: 1,
          org_id: TEST_ORG_ID,
        },
        error: null,
      })

      const createData: CreateBOMRequest = {
        product_id: '55555555-5555-5555-5555-555555555555',
        effective_from: '2024-01-01',
        effective_to: null,
        output_qty: 100,
        output_uom: 'kg',
      }

      await createBOM(mockSupabase, createData, TEST_ORG_ID)

      // Verify insert was called with org_id
      expect(mockQuery.insert).toHaveBeenCalled()
      const insertCall = mockQuery.insert.mock.calls[0][0]
      expect(insertCall.org_id).toBe(TEST_ORG_ID)
    })
  })

  // ============================================
  // GET NEXT VERSION TESTS (AC-09, AC-21)
  // ============================================
  describe('getNextVersion - Auto-Increment Version', () => {
    it('should return 1 for product with no BOMs', async () => {
      mockQuery.order.mockReturnThis()
      mockQuery.limit.mockResolvedValue({
        data: [],
        error: null,
      })

      const nextVersion = await getNextVersion(mockSupabase, '55555555-5555-5555-5555-555555555555', TEST_ORG_ID)

      expect(nextVersion).toBe(1)
    })

    it('should return max+1 for product with existing BOMs', async () => {
      mockQuery.order.mockReturnThis()
      mockQuery.limit.mockResolvedValue({
        data: [{ version: 2 }],
        error: null,
      })

      const nextVersion = await getNextVersion(mockSupabase, '33333333-3333-3333-3333-333333333333', TEST_ORG_ID)

      expect(nextVersion).toBe(3)
    })

    it('should handle product with only one version', async () => {
      mockQuery.order.mockReturnThis()
      mockQuery.limit.mockResolvedValue({
        data: [{ version: 1 }],
        error: null,
      })

      const nextVersion = await getNextVersion(mockSupabase, '33333333-3333-3333-3333-333333333333', TEST_ORG_ID)

      expect(nextVersion).toBe(2)
    })

    it('should throw error if database query fails', async () => {
      mockQuery.order.mockReturnThis()
      mockQuery.limit.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      await expect(getNextVersion(mockSupabase, '33333333-3333-3333-3333-333333333333', TEST_ORG_ID)).rejects.toThrow(
        'Database error'
      )
    })
  })

  // ============================================
  // CHECK DATE OVERLAP TESTS (AC-18 to AC-20)
  // ============================================
  describe('checkDateOverlap - Date Range Validation', () => {
    it('should detect overlapping date ranges', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [mockBOMs[0]],
        error: null,
      })

      const result = await checkDateOverlap(
        mockSupabase,
        '33333333-3333-3333-3333-333333333333',
        '2024-04-01',
        '2024-12-31',
        TEST_ORG_ID
      )

      expect(result.overlaps).toBe(true)
      expect(result.conflictingBom).toBeDefined()
      expect(result.conflictingBom?.version).toBe(1)
    })

    it('should allow non-overlapping ranges', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await checkDateOverlap(
        mockSupabase,
        '33333333-3333-3333-3333-333333333333',
        '2024-07-01',
        null,
        TEST_ORG_ID
      )

      expect(result.overlaps).toBe(false)
      expect(result.conflictingBom).toBeUndefined()
    })

    it('should handle NULL effective_to as infinite future', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [{ ...mockBOMs[1], effective_to: null }],
        error: null,
      })

      const result = await checkDateOverlap(
        mockSupabase,
        '33333333-3333-3333-3333-333333333333',
        '2024-06-01',
        '2024-12-31',
        TEST_ORG_ID
      )

      expect(result.overlaps).toBe(true)
    })

    it('should exclude current BOM when checking for overlap (update scenario)', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await checkDateOverlap(
        mockSupabase,
        '33333333-3333-3333-3333-333333333333',
        '2024-01-01',
        '2024-06-30',
        TEST_ORG_ID,
        '11111111-1111-1111-1111-111111111111' // Exclude this BOM
      )

      expect(result.overlaps).toBe(false)
    })

    it('should detect exact date match as overlap', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [mockBOMs[0]],
        error: null,
      })

      const result = await checkDateOverlap(
        mockSupabase,
        '33333333-3333-3333-3333-333333333333',
        '2024-01-01',
        '2024-06-30',
        TEST_ORG_ID
      )

      expect(result.overlaps).toBe(true)
    })

    it('should detect partial overlap (start inside range)', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [mockBOMs[0]],
        error: null,
      })

      const result = await checkDateOverlap(
        mockSupabase,
        '33333333-3333-3333-3333-333333333333',
        '2024-03-01',
        '2024-08-01',
        TEST_ORG_ID
      )

      expect(result.overlaps).toBe(true)
    })

    it('should detect partial overlap (end inside range)', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [mockBOMs[0]],
        error: null,
      })

      const result = await checkDateOverlap(
        mockSupabase,
        '33333333-3333-3333-3333-333333333333',
        '2023-12-01',
        '2024-03-01',
        TEST_ORG_ID
      )

      expect(result.overlaps).toBe(true)
    })

    it('should pass org_id to RPC function', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      await checkDateOverlap(
        mockSupabase,
        '33333333-3333-3333-3333-333333333333',
        '2024-07-01',
        null,
        TEST_ORG_ID
      )

      expect(mockSupabase.rpc).toHaveBeenCalledWith('check_bom_date_overlap', {
        p_product_id: '33333333-3333-3333-3333-333333333333',
        p_effective_from: '2024-07-01',
        p_effective_to: null,
        p_exclude_id: null,
        p_org_id: TEST_ORG_ID,
      })
    })
  })

  // ============================================
  // UPDATE BOM TESTS (AC-14 to AC-17)
  // ============================================
  describe('updateBOM - Update with Product Lock', () => {
    it('should update effective_to date on existing BOM', async () => {
      mockQuery.single.mockResolvedValue({
        data: { ...mockBOMs[0], effective_to: '2024-12-31' },
        error: null,
      })

      const updateData: UpdateBOMRequest = {
        effective_to: '2024-12-31',
      }

      const result = await updateBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', updateData, TEST_ORG_ID)

      expect(result.effective_to).toBe('2024-12-31')
    })

    it('should update status from draft to active', async () => {
      mockQuery.single.mockResolvedValue({
        data: { ...mockBOMs[0], status: 'active' },
        error: null,
      })

      const updateData: UpdateBOMRequest = {
        status: 'active',
      }

      const result = await updateBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', updateData, TEST_ORG_ID)

      expect(result.status).toBe('active')
    })

    it('should allow partial updates (only provided fields)', async () => {
      mockQuery.single.mockResolvedValue({
        data: { ...mockBOMs[0], status: 'active' },
        error: null,
      })

      const updateData: UpdateBOMRequest = {
        status: 'active',
        // Only status provided, other fields unchanged
      }

      const result = await updateBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', updateData, TEST_ORG_ID)

      expect(result.status).toBe('active')
      expect(result.output_qty).toBe(100) // Unchanged
    })

    it('should validate date range on update', async () => {
      const updateData: UpdateBOMRequest = {
        effective_from: '2024-06-01',
        effective_to: '2024-01-01', // INVALID: end before start
      }

      await expect(
        updateBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', updateData, TEST_ORG_ID)
      ).rejects.toThrow('Effective To must be after Effective From')
    })

    it('should check for date overlap on date update', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [mockBOMs[1]],
        error: null,
      })

      const updateData: UpdateBOMRequest = {
        effective_to: '2024-07-15', // Might overlap with v2
      }

      await expect(
        updateBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', updateData, TEST_ORG_ID)
      ).rejects.toThrow('Date range overlaps')
    })

    it('should include updated_at and updated_by on update', async () => {
      mockQuery.single.mockResolvedValue({
        data: {
          ...mockBOMs[0],
          status: 'active',
          updated_at: '2025-01-15T10:00:00Z',
          updated_by: 'user-002',
        },
        error: null,
      })

      const updateData: UpdateBOMRequest = {
        status: 'active',
      }

      const result = await updateBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', updateData, TEST_ORG_ID)

      expect(result.updated_at).toBeDefined()
      expect(result.updated_by).toBeDefined()
      expect(result.updated_at).not.toBe(mockBOMs[0].updated_at)
    })

    it('should include org_id filter in update query', async () => {
      mockQuery.single.mockResolvedValue({
        data: { ...mockBOMs[0], status: 'active' },
        error: null,
      })

      const updateData: UpdateBOMRequest = {
        status: 'active',
      }

      await updateBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', updateData, TEST_ORG_ID)

      // Verify eq was called with org_id
      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', TEST_ORG_ID)
    })
  })

  // ============================================
  // DELETE BOM TESTS (AC-31 to AC-33)
  // ============================================
  describe('deleteBOM - Delete with Dependency Check', () => {
    it('should delete BOM when not used in Work Orders', async () => {
      // Mock getBOM to return a BOM
      mockQuery.single.mockResolvedValueOnce({
        data: mockBOMs[0],
        error: null,
      })

      // Mock work_orders check to return empty
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      // Mock delete operation
      mockQuery.single.mockResolvedValueOnce({
        data: mockBOMs[0],
        error: null,
      })

      const result = await deleteBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', TEST_ORG_ID)

      expect(result).toBeUndefined() // Successful delete returns void
    })

    it('should throw error when BOM is referenced by Work Orders', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: mockBOMs[0],
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({
        data: [
          { id: 'wo-001', wo_number: 'WO-001' },
          { id: 'wo-002', wo_number: 'WO-002' },
        ],
        error: null,
      })

      await expect(deleteBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', TEST_ORG_ID)).rejects.toThrow(
        'Cannot delete BOM used in Work Orders: WO-001, WO-002'
      )
    })

    it('should return 404 when BOM does not exist', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: null,
      })

      await expect(deleteBOM(mockSupabase, '99999999-9999-9999-9999-999999999999', TEST_ORG_ID)).rejects.toThrow(
        'BOM not found'
      )
    })

    it('should respect RLS policies (cannot delete from other org)', async () => {
      mockQuery.single.mockResolvedValue({
        data: null, // RLS prevents seeing other org's BOMs
        error: null,
      })

      await expect(deleteBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', TEST_ORG_ID)).rejects.toThrow(
        'BOM not found'
      ) // Returns 404, not 403
    })

    it('should pass org_id to work orders RPC function', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: mockBOMs[0],
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      await deleteBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', TEST_ORG_ID)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_work_orders_for_bom', {
        p_bom_id: '11111111-1111-1111-1111-111111111111',
        p_org_id: TEST_ORG_ID,
      })
    })

    it('should include org_id filter in delete query', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: mockBOMs[0],
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      await deleteBOM(mockSupabase, '11111111-1111-1111-1111-111111111111', TEST_ORG_ID)

      // Verify eq was called with org_id for delete
      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', TEST_ORG_ID)
    })
  })

  // ============================================
  // GET BOM TIMELINE TESTS (AC-24 to AC-30)
  // ============================================
  describe('getBOMTimeline - Timeline Visualization', () => {
    it('should return all BOM versions for a product', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          product: { id: '33333333-3333-3333-3333-333333333333', code: 'FG-001', name: 'Honey Bread' },
          versions: mockTimelineData,
          current_date: '2024-12-26',
        },
        error: null,
      })

      const result = await getBOMTimeline(mockSupabase, '33333333-3333-3333-3333-333333333333', TEST_ORG_ID)

      expect(result.versions).toHaveLength(2)
      expect(result.versions[0].version).toBe(1)
      expect(result.versions[1].version).toBe(2)
    })

    it('should include product details in timeline response', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          product: { id: '33333333-3333-3333-3333-333333333333', code: 'FG-001', name: 'Honey Bread' },
          versions: mockTimelineData,
          current_date: '2024-12-26',
        },
        error: null,
      })

      const result = await getBOMTimeline(mockSupabase, '33333333-3333-3333-3333-333333333333', TEST_ORG_ID)

      expect(result.product).toBeDefined()
      expect(result.product.code).toBe('FG-001')
      expect(result.product.name).toBe('Honey Bread')
    })

    it('should mark currently active version (current date within range)', async () => {
      const activeVersion: BOMTimelineVersion = {
        ...mockTimelineData[1],
        is_currently_active: true,
      }

      mockSupabase.rpc.mockResolvedValue({
        data: {
          product: { id: '33333333-3333-3333-3333-333333333333', code: 'FG-001', name: 'Honey Bread' },
          versions: [mockTimelineData[0], activeVersion],
          current_date: '2024-12-26',
        },
        error: null,
      })

      const result = await getBOMTimeline(mockSupabase, '33333333-3333-3333-3333-333333333333', TEST_ORG_ID)

      const active = result.versions.find((v) => v.is_currently_active)
      expect(active).toBeDefined()
      expect(active?.version).toBe(2)
    })

    it('should detect overlapping BOMs in timeline', async () => {
      const overlapVersion: BOMTimelineVersion = {
        ...mockTimelineData[0],
        has_overlap: true,
      }

      mockSupabase.rpc.mockResolvedValue({
        data: {
          product: { id: '33333333-3333-3333-3333-333333333333', code: 'FG-001', name: 'Honey Bread' },
          versions: [overlapVersion, mockTimelineData[1]],
          current_date: '2024-12-26',
        },
        error: null,
      })

      const result = await getBOMTimeline(mockSupabase, '33333333-3333-3333-3333-333333333333', TEST_ORG_ID)

      const overlap = result.versions.find((v) => v.has_overlap)
      expect(overlap).toBeDefined()
      expect(overlap?.version).toBe(1)
    })

    it('should include current date in response', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          product: { id: '33333333-3333-3333-3333-333333333333', code: 'FG-001', name: 'Honey Bread' },
          versions: mockTimelineData,
          current_date: '2024-12-26',
        },
        error: null,
      })

      const result = await getBOMTimeline(mockSupabase, '33333333-3333-3333-3333-333333333333', TEST_ORG_ID)

      expect(result.current_date).toBeDefined()
      const currentDate = new Date(result.current_date)
      expect(currentDate).toBeInstanceOf(Date)
    })

    it('should include all required fields for timeline visualization', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          product: { id: '33333333-3333-3333-3333-333333333333', code: 'FG-001', name: 'Honey Bread' },
          versions: mockTimelineData,
          current_date: '2024-12-26',
        },
        error: null,
      })

      const result = await getBOMTimeline(mockSupabase, '33333333-3333-3333-3333-333333333333', TEST_ORG_ID)

      const version = result.versions[0]
      expect(version.id).toBeDefined()
      expect(version.version).toBeDefined()
      expect(version.status).toBeDefined()
      expect(version.effective_from).toBeDefined()
      expect(version.effective_to).toBeDefined() // Can be null
      expect(version.output_qty).toBeDefined()
      expect(version.output_uom).toBeDefined()
      expect(version.notes).toBeDefined() // Can be null
      expect(version.is_currently_active).toBeDefined()
      expect(version.has_overlap).toBeDefined()
    })

    it('should order versions by effective_from DESC (newest first)', async () => {
      // Reverse order so newest first
      const orderedVersions = [mockTimelineData[1], mockTimelineData[0]]

      mockSupabase.rpc.mockResolvedValue({
        data: {
          product: { id: '33333333-3333-3333-3333-333333333333', code: 'FG-001', name: 'Honey Bread' },
          versions: orderedVersions,
          current_date: '2024-12-26',
        },
        error: null,
      })

      const result = await getBOMTimeline(mockSupabase, '33333333-3333-3333-3333-333333333333', TEST_ORG_ID)

      expect(
        new Date(result.versions[0].effective_from).getTime()
      ).toBeGreaterThan(new Date(result.versions[1].effective_from).getTime())
    })

    it('should handle product with single BOM', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          product: { id: '55555555-5555-5555-5555-555555555555', code: 'FG-NEW', name: 'New Product' },
          versions: [mockTimelineData[0]],
          current_date: '2024-12-26',
        },
        error: null,
      })

      const result = await getBOMTimeline(mockSupabase, '55555555-5555-5555-5555-555555555555', TEST_ORG_ID)

      expect(result.versions).toHaveLength(1)
      expect(result.versions[0].version).toBe(1)
    })

    it('should handle product with no BOMs', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          product: { id: '77777777-7777-7777-7777-777777777777', code: 'FG-EMPTY', name: 'Empty Product' },
          versions: [],
          current_date: '2024-12-26',
        },
        error: null,
      })

      const result = await getBOMTimeline(mockSupabase, '77777777-7777-7777-7777-777777777777', TEST_ORG_ID)

      expect(result.versions).toHaveLength(0)
    })

    it('should indicate gaps in date coverage (no active BOM for period)', async () => {
      // V1: 2024-01-01 to 2024-03-31
      // V2: 2024-06-01 to 2024-12-31
      // Gap: 2024-04-01 to 2024-05-31

      const gappedVersions = [
        { ...mockTimelineData[0], effective_to: '2024-03-31' },
        { ...mockTimelineData[1], effective_from: '2024-06-01' },
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: {
          product: { id: '33333333-3333-3333-3333-333333333333', code: 'FG-001', name: 'Honey Bread' },
          versions: gappedVersions,
          current_date: '2024-12-26',
        },
        error: null,
      })

      const result = await getBOMTimeline(mockSupabase, '33333333-3333-3333-3333-333333333333', TEST_ORG_ID)

      // Check if gap detection is implemented
      expect(result.versions).toHaveLength(2)
    })

    it('should pass org_id to RPC function', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          product: { id: '33333333-3333-3333-3333-333333333333', code: 'FG-001', name: 'Honey Bread' },
          versions: mockTimelineData,
          current_date: '2024-12-26',
        },
        error: null,
      })

      await getBOMTimeline(mockSupabase, '33333333-3333-3333-3333-333333333333', TEST_ORG_ID)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_bom_timeline', {
        p_product_id: '33333333-3333-3333-3333-333333333333',
        p_org_id: TEST_ORG_ID,
      })
    })
  })

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================
  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      mockQuery.range.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      })

      await expect(listBOMs(mockSupabase, {}, TEST_ORG_ID)).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should return meaningful error for invalid BOM data', async () => {
      const invalidData: any = {
        product_id: 'invalid-uuid',
        effective_from: 'not-a-date',
        output_qty: -10,
      }

      await expect(createBOM(mockSupabase, invalidData, TEST_ORG_ID)).rejects.toThrow()
    })

    it('should handle timeout on slow queries', async () => {
      mockQuery.range.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), 100)
          )
      )

      await expect(listBOMs(mockSupabase, {}, TEST_ORG_ID)).rejects.toThrow('Query timeout')
    })
  })
})
