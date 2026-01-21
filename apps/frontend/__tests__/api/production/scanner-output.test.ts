/**
 * API Integration Tests: Scanner Output Endpoints
 * Story 04.7b: Output Registration Scanner
 *
 * Tests scanner-specific API endpoints:
 * - POST /api/production/output/validate-wo (500ms target)
 * - POST /api/production/output/register
 * - GET /api/production/output/by-products/:woId
 * - POST /api/production/output/register-by-product
 * - POST /api/production/output/generate-label
 * - POST /api/production/output/print-label (2s target)
 * - GET /api/production/output/printer-status
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Data Types
interface MockUser {
  id: string
  email: string
  role: string
  org_id: string
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

// Mock State
let mockSession: { user: { id: string; email: string } } | null = null
let mockCurrentUser: MockUser | null = null
let mockWorkOrder: MockWorkOrder | null = null

// Mock Supabase - both createClient and createServerSupabase
const createMockSupabase = () => ({
  auth: {
    getUser: vi.fn(() =>
      Promise.resolve({
        data: { user: mockSession?.user || null },
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
      gte: vi.fn(() => chainable),
      maybeSingle: vi.fn(() => {
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
        if (table === 'printer_configs') {
          return Promise.resolve({ data: null, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      }),
      single: vi.fn(() => {
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
        return Promise.resolve({ data: null, error: null })
      }),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { id: 'new-id', lp_number: 'LP-20250121-0001' },
              error: null,
            })
          ),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }
    return chainable
  }),
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(createMockSupabase())),
  createServerSupabase: vi.fn(() => Promise.resolve(createMockSupabase())),
}))

// Mock getOrgContext
vi.mock('@/lib/hooks/server/getOrgContext', () => ({
  getOrgContext: vi.fn(() => Promise.resolve({ org_id: 'org-1' })),
}))

// Helper: Create mock request
function createRequest(
  method: string,
  body?: Record<string, unknown>,
  path: string = '/api/production/output/validate-wo'
): NextRequest {
  const url = new URL(`http://localhost:3000${path}`)
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : {},
  })
}

// Helper: Setup authenticated user
function setupAuthenticatedUser(role: string = 'production_operator') {
  mockSession = {
    user: { id: 'user-1', email: 'operator@example.com' },
  }
  mockCurrentUser = {
    id: 'user-1',
    email: 'operator@example.com',
    role,
    org_id: 'org-1',
  }
}

// Helper: Setup valid WO
function setupValidWO(status: string = 'in_progress') {
  mockWorkOrder = {
    id: 'wo-1',
    org_id: 'org-1',
    wo_number: 'WO-2025-0156',
    status,
    product_id: 'prod-1',
    planned_qty: 1000,
    output_qty: 500,
  }
}

describe('Scanner Output API Routes (Story 04.7b)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession = null
    mockCurrentUser = null
    mockWorkOrder = null
  })

  // ============================================================================
  // POST /api/production/output/validate-wo
  // ============================================================================
  describe('POST /api/production/output/validate-wo', () => {
    it('should return WO data within 500ms', async () => {
      // Arrange
      setupAuthenticatedUser()
      setupValidWO()
      const startTime = Date.now()

      // Act
      const { POST } = await import('@/app/api/production/output/validate-wo/route')
      const request = createRequest('POST', { barcode: 'WO-2025-0156' })
      const response = await POST(request)

      // Assert - Response time
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(500)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.valid).toBe(true)
      expect(data.wo.wo_number).toBe('WO-2025-0156')
    })

    it('should return 401 for unauthenticated request', async () => {
      // Arrange - No session
      const { POST } = await import('@/app/api/production/output/validate-wo/route')
      const request = createRequest('POST', { barcode: 'WO-2025-0156' })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent WO', async () => {
      // Arrange
      setupAuthenticatedUser()
      mockWorkOrder = null

      const { POST } = await import('@/app/api/production/output/validate-wo/route')
      const request = createRequest('POST', { barcode: 'WO-NONEXISTENT' })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(404)
    })

    it('should return 409 for completed WO', async () => {
      // Arrange
      setupAuthenticatedUser()
      setupValidWO('completed')

      const { POST } = await import('@/app/api/production/output/validate-wo/route')
      const request = createRequest('POST', { barcode: 'WO-2025-0156' })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error).toBe('Work order is not in progress or paused')
    })

    it('should return by_products array from BOM', async () => {
      // Arrange
      setupAuthenticatedUser()
      setupValidWO()

      const { POST } = await import('@/app/api/production/output/validate-wo/route')
      const request = createRequest('POST', { barcode: 'WO-2025-0156' })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(data.by_products).toBeDefined()
      expect(Array.isArray(data.by_products)).toBe(true)
    })

    it('should return 400 for empty barcode', async () => {
      // Arrange
      setupAuthenticatedUser()

      const { POST } = await import('@/app/api/production/output/validate-wo/route')
      const request = createRequest('POST', { barcode: '' })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(400)
    })
  })

  // ============================================================================
  // POST /api/production/output/register
  // ============================================================================
  describe('POST /api/production/output/register', () => {
    it('should create LP and return LP data', async () => {
      // Arrange
      setupAuthenticatedUser()
      setupValidWO()

      const { POST } = await import('@/app/api/production/output/register/route')
      const request = createRequest(
        'POST',
        {
          wo_id: 'wo-1',
          quantity: 250,
          qa_status: 'approved',
          batch_number: 'B-2025-0156',
          expiry_date: '2025-02-14T00:00:00Z',
          location_id: 'loc-1',
        },
        '/api/production/output/register'
      )

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.lp).toBeDefined()
      expect(data.lp.lp_number).toBeDefined()
    })

    it('should return 400 for qty = 0', async () => {
      // Arrange
      setupAuthenticatedUser()
      setupValidWO()

      const { POST } = await import('@/app/api/production/output/register/route')
      const request = createRequest(
        'POST',
        {
          wo_id: 'wo-1',
          quantity: 0,
          qa_status: 'approved',
          batch_number: 'B-2025-0156',
          expiry_date: '2025-02-14T00:00:00Z',
          location_id: 'loc-1',
        },
        '/api/production/output/register'
      )

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Quantity')
    })

    it('should update WO output_qty', async () => {
      // Arrange
      setupAuthenticatedUser()
      setupValidWO()

      const { POST } = await import('@/app/api/production/output/register/route')
      const request = createRequest(
        'POST',
        {
          wo_id: 'wo-1',
          quantity: 250,
          qa_status: 'approved',
          batch_number: 'B-2025-0156',
          expiry_date: '2025-02-14T00:00:00Z',
          location_id: 'loc-1',
        },
        '/api/production/output/register'
      )

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(data.wo_progress).toBeDefined()
      expect(data.wo_progress.output_qty).toBeGreaterThan(500) // Was 500, now 750
    })

    it('should create genealogy records', async () => {
      // Arrange
      setupAuthenticatedUser()
      setupValidWO()

      const { POST } = await import('@/app/api/production/output/register/route')
      const request = createRequest(
        'POST',
        {
          wo_id: 'wo-1',
          quantity: 250,
          qa_status: 'approved',
          batch_number: 'B-2025-0156',
          expiry_date: '2025-02-14T00:00:00Z',
          location_id: 'loc-1',
        },
        '/api/production/output/register'
      )

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(data.genealogy).toBeDefined()
    })
  })

  // ============================================================================
  // GET /api/production/output/by-products/:woId
  // ============================================================================
  describe('GET /api/production/output/by-products/:woId', () => {
    it('should return by-products list with expected quantities', async () => {
      // Arrange
      setupAuthenticatedUser()
      setupValidWO()

      const { GET } = await import(
        '@/app/api/production/output/by-products/[woId]/route'
      )
      const request = createRequest(
        'GET',
        undefined,
        '/api/production/output/by-products/wo-1'
      )

      // Act
      const response = await GET(request, { params: Promise.resolve({ woId: 'wo-1' }) })

      // Assert
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data.by_products)).toBe(true)
    })

    it('should return empty array when no by-products', async () => {
      // Arrange
      setupAuthenticatedUser()
      setupValidWO()

      const { GET } = await import(
        '@/app/api/production/output/by-products/[woId]/route'
      )
      const request = createRequest(
        'GET',
        undefined,
        '/api/production/output/by-products/wo-no-bp'
      )

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ woId: 'wo-no-bp' }),
      })

      // Assert
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.by_products).toEqual([])
    })

    it('should return 404 for non-existent WO', async () => {
      // Arrange
      setupAuthenticatedUser()
      mockWorkOrder = null

      const { GET } = await import(
        '@/app/api/production/output/by-products/[woId]/route'
      )
      const request = createRequest(
        'GET',
        undefined,
        '/api/production/output/by-products/wo-invalid'
      )

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ woId: 'wo-invalid' }),
      })

      // Assert
      expect(response.status).toBe(404)
    })
  })

  // ============================================================================
  // POST /api/production/output/register-by-product
  // ============================================================================
  describe('POST /api/production/output/register-by-product', () => {
    it('should create by-product LP', async () => {
      // Arrange
      setupAuthenticatedUser()
      setupValidWO()

      const { POST } = await import(
        '@/app/api/production/output/register-by-product/route'
      )
      const request = createRequest(
        'POST',
        {
          wo_id: 'wo-1',
          main_output_lp_id: 'lp-main-1',
          by_product_id: 'bp-prod-1',
          quantity: 45,
          qa_status: 'approved',
          batch_number: 'B-2025-0156-BP1',
          expiry_date: '2025-02-14T00:00:00Z',
          location_id: 'loc-1',
        },
        '/api/production/output/register-by-product'
      )

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.lp).toBeDefined()
    })

    it('should allow qty = 0 with zero_qty_confirmed', async () => {
      // Arrange
      setupAuthenticatedUser()
      setupValidWO()

      const { POST } = await import(
        '@/app/api/production/output/register-by-product/route'
      )
      const request = createRequest(
        'POST',
        {
          wo_id: 'wo-1',
          main_output_lp_id: 'lp-main-1',
          by_product_id: 'bp-prod-1',
          quantity: 0,
          qa_status: 'pending',
          batch_number: 'B-2025-0156-BP1',
          expiry_date: '2025-02-14T00:00:00Z',
          location_id: 'loc-1',
          zero_qty_confirmed: true,
        },
        '/api/production/output/register-by-product'
      )

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
    })

    it('should return 400 for qty = 0 without confirmation', async () => {
      // Arrange
      setupAuthenticatedUser()
      setupValidWO()

      const { POST } = await import(
        '@/app/api/production/output/register-by-product/route'
      )
      const request = createRequest(
        'POST',
        {
          wo_id: 'wo-1',
          main_output_lp_id: 'lp-main-1',
          by_product_id: 'bp-prod-1',
          quantity: 0,
          qa_status: 'pending',
          batch_number: 'B-2025-0156-BP1',
          expiry_date: '2025-02-14T00:00:00Z',
          location_id: 'loc-1',
        },
        '/api/production/output/register-by-product'
      )

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(400)
    })
  })

  // ============================================================================
  // POST /api/production/output/print-label
  // ============================================================================
  describe('POST /api/production/output/print-label', () => {
    it('should send ZPL to printer within 2 seconds', async () => {
      // Arrange
      setupAuthenticatedUser()
      const startTime = Date.now()

      const { POST } = await import('@/app/api/production/output/print-label/route')
      const request = createRequest(
        'POST',
        {
          zpl_content: '^XA^FO50,50^BY3^BC,100,Y,N,N^FD123456^FS^XZ',
        },
        '/api/production/output/print-label'
      )

      // Act
      const response = await POST(request)

      // Assert - Response time
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(2000)
      expect(response.status).toBe(200)
    })

    it('should return 404 when no printer configured', async () => {
      // Arrange
      setupAuthenticatedUser()

      const { POST } = await import('@/app/api/production/output/print-label/route')
      const request = createRequest(
        'POST',
        {
          zpl_content: '^XA^XZ',
        },
        '/api/production/output/print-label'
      )

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('No printer configured')
    })

    it('should return 503 when printer offline', async () => {
      // Arrange
      setupAuthenticatedUser()

      const { POST } = await import('@/app/api/production/output/print-label/route')
      const request = createRequest(
        'POST',
        {
          zpl_content: '^XA^XZ',
          printer_id: 'printer-offline',
        },
        '/api/production/output/print-label'
      )

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(503)
    })

    it('should return 504 on print timeout', async () => {
      // Arrange
      setupAuthenticatedUser()

      const { POST } = await import('@/app/api/production/output/print-label/route')
      const request = createRequest(
        'POST',
        {
          zpl_content: '^XA^XZ',
          printer_id: 'printer-timeout',
        },
        '/api/production/output/print-label'
      )

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(504)
    })
  })

  // ============================================================================
  // GET /api/production/output/printer-status
  // ============================================================================
  describe('GET /api/production/output/printer-status', () => {
    it('should return printer status for location', async () => {
      // Arrange
      setupAuthenticatedUser()

      const { GET } = await import('@/app/api/production/output/printer-status/route')
      const request = createRequest(
        'GET',
        undefined,
        '/api/production/output/printer-status?location_id=loc-1'
      )

      // Act
      const response = await GET(request)

      // Assert
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.configured).toBeDefined()
    })

    it('should return configured=false when no printer', async () => {
      // Arrange
      setupAuthenticatedUser()

      const { GET } = await import('@/app/api/production/output/printer-status/route')
      const request = createRequest(
        'GET',
        undefined,
        '/api/production/output/printer-status?location_id=loc-no-printer'
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(data.configured).toBe(false)
    })
  })

  // ============================================================================
  // Multi-tenancy
  // ============================================================================
  describe('Multi-tenancy', () => {
    it('should only access own org WOs', async () => {
      // Arrange
      setupAuthenticatedUser()
      mockWorkOrder = {
        id: 'wo-other-org',
        org_id: 'different-org', // Different org
        wo_number: 'WO-OTHER',
        status: 'in_progress',
        product_id: 'prod-1',
        planned_qty: 1000,
        output_qty: 0,
      }

      const { POST } = await import('@/app/api/production/output/validate-wo/route')
      const request = createRequest('POST', { barcode: 'WO-OTHER' })

      // Act
      const response = await POST(request)

      // Assert - Should return 404, not 403
      expect(response.status).toBe(404)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * POST /validate-wo (6 tests):
 *   - 500ms response time
 *   - 401 unauthenticated
 *   - 404 non-existent WO
 *   - 409 completed WO
 *   - by_products array
 *   - 400 empty barcode
 *
 * POST /register (4 tests):
 *   - LP creation
 *   - 400 zero qty
 *   - WO output_qty update
 *   - Genealogy records
 *
 * GET /by-products/:woId (3 tests):
 *   - By-products list
 *   - Empty array
 *   - 404 non-existent WO
 *
 * POST /register-by-product (3 tests):
 *   - By-product LP creation
 *   - Zero qty with confirmation
 *   - 400 zero qty without confirmation
 *
 * POST /print-label (4 tests):
 *   - 2s response time
 *   - 404 no printer
 *   - 503 printer offline
 *   - 504 timeout
 *
 * GET /printer-status (2 tests):
 *   - Printer status
 *   - No printer configured
 *
 * Multi-tenancy (1 test):
 *   - Org isolation
 *
 * Total: 23 tests
 */
