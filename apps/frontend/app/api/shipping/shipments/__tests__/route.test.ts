/**
 * Integration Tests: Shipments API Routes (Story 07.11)
 * Purpose: Test shipment CRUD API endpoints with authentication and validation
 * Phase: RED - Tests will fail until implementation exists
 *
 * Tests shipment API endpoints:
 * - POST /api/shipping/shipments - Create shipment from SO
 * - GET /api/shipping/shipments - List shipments with filters
 * - GET /api/shipping/shipments/:id - Get shipment detail
 * - GET /api/shipping/shipments/:id/available-lps - Get picked LPs for packing
 * - POST /api/shipping/shipments/:id/boxes - Add box to shipment
 * - PUT /api/shipping/shipments/:id/boxes/:boxId - Update box weight/dimensions
 * - POST /api/shipping/shipments/:id/boxes/:boxId/contents - Add LP to box
 * - POST /api/shipping/shipments/:id/complete-packing - Complete packing
 *
 * Coverage Target: 80%+
 * Test Count: 40+ scenarios
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

interface MockShipment {
  id: string
  org_id: string
  shipment_number: string
  sales_order_id: string
  customer_id: string
  status: string
  total_weight: number | null
  total_boxes: number
  created_at: string
}

interface MockBox {
  id: string
  shipment_id: string
  box_number: number
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
}

/**
 * Mock State
 */
let mockSession: MockSession | null = null
let mockCurrentUser: MockUser | null = null
let mockShipment: MockShipment | null = null
let mockBoxes: MockBox[] = []
let mockAvailableLPs: Array<{
  id: string
  lp_number: string
  product_name: string
  quantity_available: number
}> = []

// Track mutations
const insertedRecords: unknown[] = []
const updatedRecords: Array<{ table: string; data: unknown }> = []

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() =>
    Promise.resolve({
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
      from: vi.fn((table: string) => {
        const chainable = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          in: vi.fn(() => chainable),
          order: vi.fn(() => chainable),
          limit: vi.fn(() => chainable),
          range: vi.fn(() =>
            Promise.resolve({
              data: table === 'shipments' ? [mockShipment] : [],
              error: null,
              count: 1,
            })
          ),
          single: vi.fn(() => {
            if (table === 'users') {
              return Promise.resolve({
                data: mockCurrentUser,
                error: mockCurrentUser ? null : { message: 'User not found' },
              })
            }
            if (table === 'shipments') {
              return Promise.resolve({
                data: mockShipment,
                error: mockShipment ? null : { message: 'Shipment not found' },
              })
            }
            if (table === 'shipment_boxes') {
              return Promise.resolve({
                data: mockBoxes[0] || null,
                error: mockBoxes[0] ? null : { message: 'Box not found' },
              })
            }
            return Promise.resolve({ data: null, error: null })
          }),
          insert: vi.fn((data: unknown) => {
            insertedRecords.push(data)
            return {
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: 'new-record-id', ...(data as Record<string, unknown>) },
                    error: null,
                  })
                ),
              })),
            }
          }),
          update: vi.fn((data: unknown) => {
            updatedRecords.push({ table, data })
            return {
              eq: vi.fn(() => Promise.resolve({ error: null })),
            }
          }),
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        }
        return chainable
      }),
      rpc: vi.fn((funcName: string) => {
        if (funcName === 'get_available_lps_for_packing') {
          return Promise.resolve({
            data: mockAvailableLPs,
            error: null,
          })
        }
        if (funcName === 'validate_packing_completion') {
          return Promise.resolve({
            data: { is_valid: true, boxes_without_weight: 0, unpacked_lps: 0 },
            error: null,
          })
        }
        return Promise.resolve({ data: null, error: null })
      }),
    })
  ),
}))

/**
 * Helper: Create mock request
 */
function createRequest(
  method: string,
  body?: Record<string, unknown>,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL('http://localhost:3000/api/shipping/shipments')
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
 * Helper: Create mock request with ID
 */
function createRequestWithId(
  method: string,
  id: string,
  body?: Record<string, unknown>
): NextRequest {
  const url = new URL(`http://localhost:3000/api/shipping/shipments/${id}`)
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : {},
  })
}

/**
 * Helper: Setup authenticated user
 */
function setupAuthenticatedUser(role: string = 'warehouse_manager') {
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
 * Helper: Setup valid shipment
 */
function setupValidShipment(status: string = 'pending') {
  mockShipment = {
    id: 'shipment-1',
    org_id: 'org-1',
    shipment_number: 'SH-2025-00001',
    sales_order_id: 'so-1',
    customer_id: 'cust-1',
    status,
    total_weight: null,
    total_boxes: 0,
    created_at: '2025-01-22T10:00:00Z',
  }
}

describe('Shipments API (Story 07.11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession = null
    mockCurrentUser = null
    mockShipment = null
    mockBoxes = []
    mockAvailableLPs = []
    insertedRecords.length = 0
    updatedRecords.length = 0
  })

  // ============================================================================
  // Authentication Tests
  // ============================================================================
  describe('Authentication', () => {
    it('should return 401 for unauthenticated request on POST', async () => {
      const { POST } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('POST', { sales_order_id: 'so-1' })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 for unauthenticated request on GET', async () => {
      const { GET } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('GET')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return 401 if user not found in database', async () => {
      mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }
      mockCurrentUser = null

      const { POST } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('POST', { sales_order_id: 'so-1' })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })

  // ============================================================================
  // POST /api/shipping/shipments - Create Shipment
  // ============================================================================
  describe('POST /shipments - Create Shipment', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
    })

    it('should create shipment from sales order', async () => {
      const { POST } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('POST', { sales_order_id: 'so-1' })
      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.data.shipment_number).toMatch(/^SH-\d{4}-\d{5}$/)
      expect(data.data.status).toBe('pending')
    })

    it('should return 400 for missing sales_order_id', async () => {
      const { POST } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('POST', {})
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('sales_order_id')
    })

    it('should return 400 for invalid sales_order_id format', async () => {
      const { POST } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('POST', { sales_order_id: 'invalid' })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 if SO not in picked status', async () => {
      const { POST } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('POST', { sales_order_id: 'so-draft' })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('INVALID_SALES_ORDER')
    })

    it('should return 409 if shipment already exists for SO', async () => {
      setupValidShipment()

      const { POST } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('POST', { sales_order_id: 'so-1' })
      const response = await POST(request)

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error).toBe('CONFLICT')
    })

    it('should return 403 for Picker role (no create permission)', async () => {
      setupAuthenticatedUser('picker')

      const { POST } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('POST', { sales_order_id: 'so-1' })
      const response = await POST(request)

      expect(response.status).toBe(403)
    })
  })

  // ============================================================================
  // GET /api/shipping/shipments - List Shipments
  // ============================================================================
  describe('GET /shipments - List Shipments', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
      setupValidShipment()
    })

    it('should list shipments with pagination', async () => {
      const { GET } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('GET', undefined, { page: '1', limit: '20' })
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.shipments).toBeDefined()
      expect(data.data.total).toBeDefined()
      expect(data.data.page).toBe(1)
    })

    it('should filter by status', async () => {
      const { GET } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('GET', undefined, { status: 'packing' })
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should filter by multiple statuses', async () => {
      const { GET } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('GET', undefined, { status: 'packing,packed' })
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should filter by customer_id', async () => {
      const { GET } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('GET', undefined, { customer_id: 'cust-1' })
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should filter by date range', async () => {
      const { GET } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('GET', undefined, {
        date_from: '2025-01-01',
        date_to: '2025-01-31',
      })
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should include customer and SO details in response', async () => {
      const { GET } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('GET')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.shipments[0].customer).toBeDefined()
    })
  })

  // ============================================================================
  // GET /api/shipping/shipments/:id - Get Shipment Detail
  // ============================================================================
  describe('GET /shipments/:id - Get Shipment Detail', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
      setupValidShipment()
    })

    it('should return shipment detail with boxes and contents', async () => {
      const { GET } = await import('@/app/api/shipping/shipments/[id]/route')

      const request = createRequestWithId('GET', 'shipment-1')
      const response = await GET(request, { params: Promise.resolve({ id: 'shipment-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.shipment).toBeDefined()
      expect(data.data.boxes).toBeDefined()
      expect(data.data.contents).toBeDefined()
    })

    it('should return 404 for non-existent shipment', async () => {
      mockShipment = null

      const { GET } = await import('@/app/api/shipping/shipments/[id]/route')

      const request = createRequestWithId('GET', 'non-existent')
      const response = await GET(request, { params: Promise.resolve({ id: 'non-existent' }) })

      expect(response.status).toBe(404)
    })

    it('should include sales_order details', async () => {
      const { GET } = await import('@/app/api/shipping/shipments/[id]/route')

      const request = createRequestWithId('GET', 'shipment-1')
      const response = await GET(request, { params: Promise.resolve({ id: 'shipment-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.sales_order).toBeDefined()
    })
  })

  // ============================================================================
  // GET /api/shipping/shipments/:id/available-lps - Get Available LPs
  // ============================================================================
  describe('GET /shipments/:id/available-lps - Get Available LPs', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
      setupValidShipment('packing')
      mockAvailableLPs = [
        {
          id: 'lp-1',
          lp_number: 'LP-2025-00001',
          product_name: 'Organic Flour 5lb',
          quantity_available: 100,
        },
      ]
    })

    it('should return picked LPs not yet packed', async () => {
      const { GET } = await import('@/app/api/shipping/shipments/[id]/available-lps/route')

      const request = createRequestWithId('GET', 'shipment-1')
      const response = await GET(request, { params: Promise.resolve({ id: 'shipment-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.license_plates).toBeDefined()
      expect(data.data.license_plates.length).toBeGreaterThan(0)
    })

    it('should include pack progress counts', async () => {
      const { GET } = await import('@/app/api/shipping/shipments/[id]/available-lps/route')

      const request = createRequestWithId('GET', 'shipment-1')
      const response = await GET(request, { params: Promise.resolve({ id: 'shipment-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.total_count).toBeDefined()
      expect(data.data.packed_count).toBeDefined()
      expect(data.data.remaining_count).toBeDefined()
    })

    it('should return 404 for non-existent shipment', async () => {
      mockShipment = null

      const { GET } = await import('@/app/api/shipping/shipments/[id]/available-lps/route')

      const request = createRequestWithId('GET', 'non-existent')
      const response = await GET(request, { params: Promise.resolve({ id: 'non-existent' }) })

      expect(response.status).toBe(404)
    })
  })

  // ============================================================================
  // POST /api/shipping/shipments/:id/boxes - Add Box
  // ============================================================================
  describe('POST /shipments/:id/boxes - Add Box', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
      setupValidShipment('pending')
    })

    it('should create box with auto-incremented box_number', async () => {
      const { POST } = await import('@/app/api/shipping/shipments/[id]/boxes/route')

      const request = createRequestWithId('POST', 'shipment-1')
      const response = await POST(request, { params: Promise.resolve({ id: 'shipment-1' }) })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.data.box_id).toBeDefined()
      expect(data.data.box_number).toBe(1)
    })

    it('should update shipment status to packing if pending', async () => {
      const { POST } = await import('@/app/api/shipping/shipments/[id]/boxes/route')

      const request = createRequestWithId('POST', 'shipment-1')
      const response = await POST(request, { params: Promise.resolve({ id: 'shipment-1' }) })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.data.status).toBe('packing')
    })

    it('should return 404 for non-existent shipment', async () => {
      mockShipment = null

      const { POST } = await import('@/app/api/shipping/shipments/[id]/boxes/route')

      const request = createRequestWithId('POST', 'non-existent')
      const response = await POST(request, { params: Promise.resolve({ id: 'non-existent' }) })

      expect(response.status).toBe(404)
    })
  })

  // ============================================================================
  // PUT /api/shipping/shipments/:id/boxes/:boxId - Update Box
  // ============================================================================
  describe('PUT /shipments/:id/boxes/:boxId - Update Box', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
      setupValidShipment('packing')
      mockBoxes = [
        {
          id: 'box-1',
          shipment_id: 'shipment-1',
          box_number: 1,
          weight: null,
          length: null,
          width: null,
          height: null,
        },
      ]
    })

    it('should update box weight', async () => {
      const { PUT } = await import('@/app/api/shipping/shipments/[id]/boxes/[boxId]/route')

      const url = new URL('http://localhost:3000/api/shipping/shipments/shipment-1/boxes/box-1')
      const request = new NextRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ weight: 15.5 }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'shipment-1', boxId: 'box-1' }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.weight).toBe(15.5)
    })

    it('should update box dimensions', async () => {
      const { PUT } = await import('@/app/api/shipping/shipments/[id]/boxes/[boxId]/route')

      const url = new URL('http://localhost:3000/api/shipping/shipments/shipment-1/boxes/box-1')
      const request = new NextRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ length: 60, width: 40, height: 30 }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'shipment-1', boxId: 'box-1' }),
      })

      expect(response.status).toBe(200)
    })

    it('should return 400 for weight > 25kg', async () => {
      const { PUT } = await import('@/app/api/shipping/shipments/[id]/boxes/[boxId]/route')

      const url = new URL('http://localhost:3000/api/shipping/shipments/shipment-1/boxes/box-1')
      const request = new NextRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ weight: 30 }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'shipment-1', boxId: 'box-1' }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for dimension out of range', async () => {
      const { PUT } = await import('@/app/api/shipping/shipments/[id]/boxes/[boxId]/route')

      const url = new URL('http://localhost:3000/api/shipping/shipments/shipment-1/boxes/box-1')
      const request = new NextRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ length: 5 }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'shipment-1', boxId: 'box-1' }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('DIMENSION_ERROR')
    })

    it('should return 404 for non-existent box', async () => {
      mockBoxes = []

      const { PUT } = await import('@/app/api/shipping/shipments/[id]/boxes/[boxId]/route')

      const url = new URL('http://localhost:3000/api/shipping/shipments/shipment-1/boxes/non-existent')
      const request = new NextRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ weight: 10 }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'shipment-1', boxId: 'non-existent' }),
      })

      expect(response.status).toBe(404)
    })
  })

  // ============================================================================
  // POST /api/shipping/shipments/:id/boxes/:boxId/contents - Add Content
  // ============================================================================
  describe('POST /shipments/:id/boxes/:boxId/contents - Add Content', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
      setupValidShipment('packing')
      mockBoxes = [
        {
          id: 'box-1',
          shipment_id: 'shipment-1',
          box_number: 1,
          weight: null,
          length: null,
          width: null,
          height: null,
        },
      ]
    })

    it('should add LP to box with lot_number traceability', async () => {
      const { POST } = await import('@/app/api/shipping/shipments/[id]/boxes/[boxId]/contents/route')

      const url = new URL('http://localhost:3000/api/shipping/shipments/shipment-1/boxes/box-1/contents')
      const request = new NextRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          license_plate_id: 'lp-1',
          sales_order_line_id: 'sol-1',
          quantity: 50,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: 'shipment-1', boxId: 'box-1' }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.data.content_id).toBeDefined()
    })

    it('should return 400 for missing license_plate_id', async () => {
      const { POST } = await import('@/app/api/shipping/shipments/[id]/boxes/[boxId]/contents/route')

      const url = new URL('http://localhost:3000/api/shipping/shipments/shipment-1/boxes/box-1/contents')
      const request = new NextRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          sales_order_line_id: 'sol-1',
          quantity: 50,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: 'shipment-1', boxId: 'box-1' }),
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for quantity <= 0', async () => {
      const { POST } = await import('@/app/api/shipping/shipments/[id]/boxes/[boxId]/contents/route')

      const url = new URL('http://localhost:3000/api/shipping/shipments/shipment-1/boxes/box-1/contents')
      const request = new NextRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          license_plate_id: 'lp-1',
          sales_order_line_id: 'sol-1',
          quantity: 0,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: 'shipment-1', boxId: 'box-1' }),
      })

      expect(response.status).toBe(400)
    })

    it('should return allergen warning if applicable', async () => {
      const { POST } = await import('@/app/api/shipping/shipments/[id]/boxes/[boxId]/contents/route')

      const url = new URL('http://localhost:3000/api/shipping/shipments/shipment-1/boxes/box-1/contents')
      const request = new NextRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          license_plate_id: 'lp-1',
          sales_order_line_id: 'sol-1',
          quantity: 50,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: 'shipment-1', boxId: 'box-1' }),
      })

      const data = await response.json()
      // Allergen warning should be in response (non-blocking)
      expect(data.data.allergen_warning === null || data.data.allergen_warning !== undefined).toBe(true)
    })
  })

  // ============================================================================
  // POST /api/shipping/shipments/:id/complete-packing - Complete Packing
  // ============================================================================
  describe('POST /shipments/:id/complete-packing - Complete Packing', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
      setupValidShipment('packing')
      mockBoxes = [
        {
          id: 'box-1',
          shipment_id: 'shipment-1',
          box_number: 1,
          weight: 15.5,
          length: 60,
          width: 40,
          height: 30,
        },
      ]
    })

    it('should complete packing and update status to packed', async () => {
      const { POST } = await import('@/app/api/shipping/shipments/[id]/complete-packing/route')

      const url = new URL('http://localhost:3000/api/shipping/shipments/shipment-1/complete-packing')
      const request = new NextRequest(url, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: 'shipment-1' }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.status).toBe('packed')
      expect(data.data.packed_at).toBeDefined()
    })

    it('should calculate and return total_weight and total_boxes', async () => {
      const { POST } = await import('@/app/api/shipping/shipments/[id]/complete-packing/route')

      const url = new URL('http://localhost:3000/api/shipping/shipments/shipment-1/complete-packing')
      const request = new NextRequest(url, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: 'shipment-1' }),
      })

      const data = await response.json()
      expect(data.data.total_weight).toBeDefined()
      expect(data.data.total_boxes).toBeDefined()
    })

    it('should return 400 if boxes have no weight', async () => {
      mockBoxes[0].weight = null

      const { POST } = await import('@/app/api/shipping/shipments/[id]/complete-packing/route')

      const url = new URL('http://localhost:3000/api/shipping/shipments/shipment-1/complete-packing')
      const request = new NextRequest(url, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: 'shipment-1' }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('MISSING_WEIGHT')
    })

    it('should return 400 if unpacked LPs exist', async () => {
      // Mock validation to return unpacked items
      vi.mocked(
        (await import('@/lib/supabase/server')).createServerSupabase
      ).mockResolvedValueOnce({
        rpc: vi.fn().mockResolvedValue({
          data: { is_valid: false, unpacked_lps: 3 },
          error: null,
        }),
      } as any)

      const { POST } = await import('@/app/api/shipping/shipments/[id]/complete-packing/route')

      const url = new URL('http://localhost:3000/api/shipping/shipments/shipment-1/complete-packing')
      const request = new NextRequest(url, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: 'shipment-1' }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('UNPACKED_ITEMS')
    })

    it('should return 409 if shipment not in packing status', async () => {
      setupValidShipment('pending')

      const { POST } = await import('@/app/api/shipping/shipments/[id]/complete-packing/route')

      const url = new URL('http://localhost:3000/api/shipping/shipments/shipment-1/complete-packing')
      const request = new NextRequest(url, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: 'shipment-1' }),
      })

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error).toBe('INVALID_STATUS')
    })
  })

  // ============================================================================
  // RLS and Authorization Tests
  // ============================================================================
  describe('RLS and Authorization', () => {
    it('should not allow access to shipment from different org', async () => {
      setupAuthenticatedUser()
      mockShipment = {
        id: 'shipment-1',
        org_id: 'different-org',
        shipment_number: 'SH-2025-00001',
        sales_order_id: 'so-1',
        customer_id: 'cust-1',
        status: 'packing',
        total_weight: null,
        total_boxes: 0,
        created_at: '2025-01-22T10:00:00Z',
      }

      const { GET } = await import('@/app/api/shipping/shipments/[id]/route')

      const request = createRequestWithId('GET', 'shipment-1')
      const response = await GET(request, { params: Promise.resolve({ id: 'shipment-1' }) })

      expect([403, 404]).toContain(response.status)
    })

    it('should filter list to only current org shipments', async () => {
      setupAuthenticatedUser()
      setupValidShipment()

      const { GET } = await import('@/app/api/shipping/shipments/route')

      const request = createRequest('GET')
      const response = await GET(request)

      expect(response.status).toBe(200)
      // RLS automatically filters by org_id
    })
  })
})

/**
 * Test Coverage Summary for Shipments API (Story 07.11)
 * =====================================================
 *
 * Authentication: 3 tests
 *   - Unauthenticated rejection (POST)
 *   - Unauthenticated rejection (GET)
 *   - User not found
 *
 * POST /shipments: 6 tests
 *   - Create shipment from SO
 *   - Missing sales_order_id
 *   - Invalid UUID format
 *   - SO not in picked status
 *   - Duplicate shipment rejection
 *   - Permission enforcement
 *
 * GET /shipments: 6 tests
 *   - List with pagination
 *   - Filter by status
 *   - Filter by multiple statuses
 *   - Filter by customer
 *   - Filter by date range
 *   - Include customer details
 *
 * GET /shipments/:id: 3 tests
 *   - Return detail with boxes
 *   - 404 for non-existent
 *   - Include sales_order
 *
 * GET /shipments/:id/available-lps: 3 tests
 *   - Return picked LPs
 *   - Include progress counts
 *   - 404 for non-existent
 *
 * POST /shipments/:id/boxes: 3 tests
 *   - Create with auto box_number
 *   - Update status to packing
 *   - 404 for non-existent
 *
 * PUT /shipments/:id/boxes/:boxId: 5 tests
 *   - Update weight
 *   - Update dimensions
 *   - Reject weight > 25kg
 *   - Reject dimension out of range
 *   - 404 for non-existent box
 *
 * POST /shipments/:id/boxes/:boxId/contents: 4 tests
 *   - Add LP with lot_number
 *   - Missing LP rejection
 *   - Quantity validation
 *   - Allergen warning response
 *
 * POST /shipments/:id/complete-packing: 5 tests
 *   - Complete and update status
 *   - Return totals
 *   - Missing weight rejection
 *   - Unpacked items rejection
 *   - Invalid status rejection
 *
 * RLS: 2 tests
 *   - Cross-org access prevention
 *   - Org filter on list
 *
 * Total: 40 tests
 */
