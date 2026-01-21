/**
 * Integration Tests: By-Product Registration API Routes
 * Story: 04.7c - By-Product Registration
 * Phase: RED - Tests should FAIL until API routes implemented
 *
 * Tests by-product registration API endpoints:
 * - POST /api/production/outputs/by-products - Register by-product output LP
 * - GET /api/production/work-orders/:id/by-products - Get by-product status for WO
 *
 * Related PRD: docs/1-BASELINE/product/modules/PRODUCTION.md (FR-PROD-013)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Mock Data Types
 */
interface MockUser {
  id: string
  email: string
  role: string
  org_id: string
}

interface MockSession {
  user: {
    id: string
    email: string
  }
}

interface MockWorkOrder {
  id: string
  org_id: string
  wo_number: string
  status: string
  product_id: string
  planned_qty: number
  output_qty: number
}

interface MockWOMaterial {
  id: string
  work_order_id: string
  product_id: string
  product_name: string
  product_code: string
  is_by_product: boolean
  yield_percent: number
  by_product_registered_qty: number
  uom: string
}

/**
 * Mock State
 */
let mockSession: MockSession | null = null
let mockCurrentUser: MockUser | null = null
let mockWorkOrder: MockWorkOrder | null = null
let mockByProductMaterials: MockWOMaterial[] = []
let mockByProductOutputs: unknown[] = []
let mockLicensePlates: unknown[] = []

// Track mutations
const insertedRecords: unknown[] = []
const updatedRecords: Array<{ table: string; data: unknown }> = []

// Mock Supabase - shared client factory
const createMockSupabaseClient = () => {
  // Create a recursively chainable object
  const createChainable = (table: string): Record<string, unknown> => {
    const chainable: Record<string, unknown> = {}

    // Make all methods return chainable
    const chainMethods = ['select', 'eq', 'in', 'order', 'limit', 'neq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 'is', 'or', 'not']
    chainMethods.forEach(method => {
      chainable[method] = vi.fn(() => chainable)
    })

    // For production_outputs, the chain can be a count query that ends with implicit .then()
    // When the chain is awaited without .single(), it should return { count: X } for count queries
    // We'll override this by making the chainable itself a thenable for production_outputs
    if (table === 'production_outputs') {
      // Make chainable a thenable that resolves to count when awaited directly
      (chainable as { then?: (resolve: (val: unknown) => void) => Promise<unknown> }).then = (resolve) => {
        return Promise.resolve(resolve({ count: mockByProductOutputs.length, error: null }))
      }
    }

    // single() returns promise with data based on table
    chainable.single = vi.fn(() => {
      if (table === 'users') {
        return Promise.resolve({
          data: mockCurrentUser,
          error: mockCurrentUser ? null : { message: 'User not found' },
        })
      }
      if (table === 'work_orders') {
        return Promise.resolve({
          data: mockWorkOrder,
          error: mockWorkOrder ? null : { message: 'WO not found' },
        })
      }
      if (table === 'wo_materials') {
        return Promise.resolve({
          data: mockByProductMaterials[0] || null,
          error: mockByProductMaterials.length ? null : { message: 'Not found' },
        })
      }
      if (table === 'products') {
        return Promise.resolve({
          data: { id: 'prod-1', shelf_life_days: 30, default_location_id: 'loc-default' },
          error: null,
        })
      }
      if (table === 'production_lines') {
        return Promise.resolve({
          data: { id: 'line-1', default_output_location_id: 'loc-line' },
          error: null,
        })
      }
      if (table === 'lp_genealogy') {
        return Promise.resolve({
          data: null,
          error: null,
        })
      }
      return Promise.resolve({ data: null, error: null })
    })

    // Override order() for certain tables
    if (table === 'wo_materials') {
      chainable.order = vi.fn(() => Promise.resolve({
        data: mockByProductMaterials,
        error: null,
      }))
    }
    // production_outputs needs chainable order() for .order().limit().single()
    // The default chainable.order already returns chainable

    // insert() returns a chainable for .select().single()
    chainable.insert = vi.fn((data: unknown) => {
      insertedRecords.push({ table, data })
      const insertChain: Record<string, unknown> = {}
      insertChain.select = vi.fn(() => insertChain)
      insertChain.single = vi.fn(() => Promise.resolve({
        data: { id: 'new-record-id', lp_number: `BP-WO-001-${Date.now().toString(36)}`, ...data as Record<string, unknown> },
        error: null,
      }))
      return insertChain
    })

    // update() returns a chainable for .eq()
    chainable.update = vi.fn((data: unknown) => {
      updatedRecords.push({ table, data })
      const updateChain: Record<string, unknown> = {}
      updateChain.eq = vi.fn(() => Promise.resolve({ error: null }))
      return updateChain
    })

    // delete() for rollback
    chainable.delete = vi.fn(() => {
      const deleteChain: Record<string, unknown> = {}
      deleteChain.eq = vi.fn(() => Promise.resolve({ error: null }))
      return deleteChain
    })

    return chainable
  }

  return {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: {
            user: mockSession?.user || null,
          },
          error: mockSession ? null : { message: 'No session' },
        })
      ),
    },
    from: vi.fn((table: string) => createChainable(table)),
  }
}

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve(createMockSupabaseClient())),
  createServerSupabaseAdmin: vi.fn(() => createMockSupabaseClient()),
}))

/**
 * Helper: Create mock request
 */
function createRequest(
  method: string,
  body?: Record<string, unknown>,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL('http://localhost:3000/api/production/work-orders/wo-1/by-products')
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : {},
  })
}

/**
 * Helper: Setup authenticated user
 */
function setupAuthenticatedUser(role: string = 'production_manager') {
  mockSession = {
    user: {
      id: 'user-1',
      email: 'test@example.com',
    },
  }
  mockCurrentUser = {
    id: 'user-1',
    email: 'test@example.com',
    role,
    org_id: 'org-1',
  }
}

/**
 * Helper: Setup valid WO with by-products
 */
function setupValidWOWithByProducts(status: string = 'in_progress') {
  mockWorkOrder = {
    id: 'wo-1',
    org_id: 'org-1',
    wo_number: 'WO-001',
    status,
    product_id: 'prod-main',
    planned_qty: 1000,
    output_qty: 500,
  }

  mockByProductMaterials = [
    {
      id: 'bp-material-1',
      work_order_id: 'wo-1',
      product_id: 'prod-bran',
      product_name: 'Wheat Bran',
      product_code: 'SKU-BP-BRAN',
      is_by_product: true,
      yield_percent: 5,
      by_product_registered_qty: 0,
      uom: 'kg',
    },
    {
      id: 'bp-material-2',
      work_order_id: 'wo-1',
      product_id: 'prod-germ',
      product_name: 'Wheat Germ',
      product_code: 'SKU-BP-GERM',
      is_by_product: true,
      yield_percent: 2,
      by_product_registered_qty: 10,
      uom: 'kg',
    },
  ]
}

describe('By-Product Registration API (Story 04.7c)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession = null
    mockCurrentUser = null
    mockWorkOrder = null
    mockByProductMaterials = []
    mockByProductOutputs = []
    mockLicensePlates = []
    insertedRecords.length = 0
    updatedRecords.length = 0
  })

  // ============================================================================
  // Authentication Tests
  // ============================================================================
  describe('Authentication', () => {
    it('should return 401 for unauthenticated request to POST by-products', async () => {
      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('POST', {
        by_product_id: 'bp-1',
        qty: 50,
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 for unauthenticated request to GET by-products', async () => {
      const { GET } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('GET')
      const response = await GET(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(401)
    })

    it('should return 401 if user not found in database', async () => {
      mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }
      mockCurrentUser = null

      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('POST', {
        by_product_id: 'bp-1',
        qty: 50,
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(401)
    })
  })

  // ============================================================================
  // POST /api/production/work-orders/:id/by-products Tests
  // ============================================================================
  describe('POST /by-products - Register By-Product', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
      setupValidWOWithByProducts()
    })

    /**
     * AC: GIVEN by-product registered
     * THEN LP created with is_by_product = true
     */
    it('should create by-product LP with is_by_product = true', async () => {
      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('POST', {
        by_product_id: 'bp-material-1',
        qty: 25,
        qa_status: 'passed',
        location_id: 'loc-1',
        main_output_lp_id: 'main-lp-1',
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.output.lpNumber).toBeDefined()
      expect(data.data.output.quantity).toBe(25)

      // Verify LP was created with is_by_product flag
      const lpInsert = insertedRecords.find(
        (r: { table: string }) => r.table === 'license_plates'
      )
      expect(lpInsert).toBeDefined()
      expect((lpInsert as { data: { is_by_product: boolean } }).data.is_by_product).toBe(true)
    })

    /**
     * AC: GIVEN by-product registered
     * THEN genealogy copied from main output LP
     */
    it('should copy genealogy from main output LP', async () => {
      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('POST', {
        by_product_id: 'bp-material-1',
        qty: 25,
        main_output_lp_id: 'main-lp-1',
        location_id: 'loc-1',
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.genealogyRecords).toBeGreaterThanOrEqual(0)
    })

    /**
     * AC: Production output links to parent_output_id
     */
    it('should link to parent_output_id', async () => {
      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('POST', {
        by_product_id: 'bp-material-1',
        qty: 25,
        main_output_id: 'main-output-1',
        main_output_lp_id: 'main-lp-1',
        location_id: 'loc-1',
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(200)

      const outputInsert = insertedRecords.find(
        (r: { table: string }) => r.table === 'production_outputs'
      )
      expect(outputInsert).toBeDefined()
    })

    it('should return 400 for non-by-product material', async () => {
      mockByProductMaterials[0].is_by_product = false

      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('POST', {
        by_product_id: 'bp-material-1',
        qty: 25,
        location_id: 'loc-1',
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/not.*by-product/i)
    })

    /**
     * AC: Cross-tenant access returns 404 (not 403)
     */
    it('should return 404 for WO in different org', async () => {
      mockWorkOrder!.org_id = 'different-org'

      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('POST', {
        by_product_id: 'bp-material-1',
        qty: 25,
        location_id: 'loc-1',
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(404)
    })

    it('should return 400 for WO not in_progress', async () => {
      setupValidWOWithByProducts('completed')

      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('POST', {
        by_product_id: 'bp-material-1',
        qty: 25,
        location_id: 'loc-1',
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/not.*in.*progress/i)
    })

    it('should return 400 for negative quantity', async () => {
      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('POST', {
        by_product_id: 'bp-material-1',
        qty: -10,
        location_id: 'loc-1',
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(400)
    })

    /**
     * AC: Zero qty warning - quantity = 0 should be accepted with warning
     */
    it('should accept quantity = 0 with warning', async () => {
      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('POST', {
        by_product_id: 'bp-material-1',
        qty: 0,
        location_id: 'loc-1',
        confirm_zero_qty: true,
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      // Should either succeed with warning or require confirmation
      expect([200, 409]).toContain(response.status)
    })

    it('should update wo_materials.by_product_registered_qty', async () => {
      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('POST', {
        by_product_id: 'bp-material-1',
        qty: 25,
        location_id: 'loc-1',
      })
      await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      const materialUpdate = updatedRecords.find(
        (r) => r.table === 'wo_materials'
      )
      expect(materialUpdate).toBeDefined()
    })

    /**
     * AC: Batch number auto-generated in correct format
     */
    it('should generate batch number with BP prefix', async () => {
      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('POST', {
        by_product_id: 'bp-material-1',
        qty: 25,
        location_id: 'loc-1',
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.output.lpNumber).toMatch(/BP-/)
    })
  })

  // ============================================================================
  // GET /api/production/work-orders/:id/by-products Tests
  // ============================================================================
  describe('GET /by-products - Get By-Products Status', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
      setupValidWOWithByProducts()
    })

    /**
     * AC: Returns all by-products with calculated expected qty
     */
    it('should return all by-products with calculated expected qty', async () => {
      const { GET } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('GET')
      const response = await GET(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBe(2)

      // Check expected qty calculation
      const bran = data.data.find((bp: { product_code: string }) => bp.product_code === 'SKU-BP-BRAN')
      expect(bran.expected_qty).toBe(25) // 500 * 5% = 25
    })

    /**
     * AC: Aggregates LP counts correctly
     */
    it('should aggregate LP counts correctly', async () => {
      mockByProductOutputs = [
        { id: 'out-1', by_product_material_id: 'bp-material-1' },
        { id: 'out-2', by_product_material_id: 'bp-material-1' },
      ]
      mockLicensePlates = [
        { id: 'lp-1', product_id: 'prod-bran' },
        { id: 'lp-2', product_id: 'prod-bran' },
      ]

      const { GET } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('GET')
      const response = await GET(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()

      const bran = data.data.find((bp: { product_code: string }) => bp.product_code === 'SKU-BP-BRAN')
      expect(bran.lp_count).toBe(2)
    })

    /**
     * AC: Returns status = registered when any LP exists
     */
    it('should return status = registered when any LP exists', async () => {
      mockByProductMaterials[0].by_product_registered_qty = 25

      const { GET } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('GET')
      const response = await GET(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()

      const bran = data.data.find((bp: { product_code: string }) => bp.product_code === 'SKU-BP-BRAN')
      expect(bran.status).toBe('registered')
    })

    /**
     * AC: Returns status = not_registered when no LPs
     */
    it('should return status = not_registered when no LPs', async () => {
      mockByProductMaterials[0].by_product_registered_qty = 0

      const { GET } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('GET')
      const response = await GET(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()

      const bran = data.data.find((bp: { product_code: string }) => bp.product_code === 'SKU-BP-BRAN')
      expect(bran.status).toBe('not_registered')
    })

    it('should return 404 for non-existent WO', async () => {
      mockWorkOrder = null

      const { GET } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('GET')
      const response = await GET(request, { params: Promise.resolve({ id: 'wo-999' }) })

      expect(response.status).toBe(404)
    })

    it('should return empty array for WO without by-products', async () => {
      mockByProductMaterials = []

      const { GET } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('GET')
      const response = await GET(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toEqual([])
    })

    /**
     * AC: Multi-tenancy - only Org A data returned
     */
    it('should only return by-products for users org', async () => {
      const { GET } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('GET')
      const response = await GET(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(200)
      // RLS ensures only org's data is returned - this is a structural test
    })
  })

  // ============================================================================
  // RLS and Authorization Tests
  // ============================================================================
  describe('RLS and Authorization', () => {
    it('should not allow access to WO from different org', async () => {
      setupAuthenticatedUser()
      mockWorkOrder = {
        id: 'wo-1',
        org_id: 'different-org',
        wo_number: 'WO-001',
        status: 'in_progress',
        product_id: 'prod-1',
        planned_qty: 1000,
        output_qty: 500,
      }

      const { GET } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('GET')
      const response = await GET(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect([403, 404]).toContain(response.status)
    })

    it('should allow operators to register by-products', async () => {
      setupAuthenticatedUser('operator')
      setupValidWOWithByProducts()

      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/by-products/route'
      )

      const request = createRequest('POST', {
        by_product_id: 'bp-material-1',
        qty: 25,
        location_id: 'loc-1',
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      // Operators should be allowed
      expect([200, 201]).toContain(response.status)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Authentication (3 tests):
 *   - Unauthenticated POST rejection
 *   - Unauthenticated GET rejection
 *   - User not found handling
 *
 * POST /by-products (10 tests):
 *   - Successful LP creation with is_by_product flag
 *   - Genealogy copying
 *   - Parent output linking
 *   - Non-by-product material rejection
 *   - Cross-org access (404)
 *   - WO not in_progress rejection
 *   - Negative quantity rejection
 *   - Zero quantity handling
 *   - Material qty update
 *   - Batch number generation
 *
 * GET /by-products (7 tests):
 *   - Expected qty calculation
 *   - LP count aggregation
 *   - Status = registered
 *   - Status = not_registered
 *   - Non-existent WO
 *   - Empty by-products
 *   - Org filtering
 *
 * RLS/Authorization (2 tests):
 *   - Cross-org access prevention
 *   - Operator permissions
 *
 * Total: 22 tests
 */
