/**
 * Integration Tests: Output Registration API Routes
 * Stories: 4.12, 4.12a, 4.12b
 *
 * Tests output registration API endpoints with:
 * - POST /api/production/work-orders/[id]/outputs - Register output
 * - POST /api/production/work-orders/[id]/outputs/preview - Preview allocation
 * - GET /api/production/work-orders/[id]/outputs - List outputs
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
  uom: string
}

interface MockOutput {
  id: string
  wo_id: string
  lp_id: string
  quantity: number
  qa_status: string
  is_over_production: boolean
  produced_at: string
  license_plates?: {
    id: string
    lp_number: string
    status: string
  }
}

/**
 * Mock State
 */
let mockSession: MockSession | null = null
let mockCurrentUser: MockUser | null = null
let mockWorkOrder: MockWorkOrder | null = null
let mockOutputs: MockOutput[] = []
let mockReservations: Array<{
  id: string
  lp_id: string
  reserved_qty: number
  sequence_number: number
  status: string
}> = []
let mockLps: Array<{
  id: string
  lp_number: string
  current_qty: number
}> = []

// Track mutations
const insertedOutputs: unknown[] = []
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
          insert: vi.fn((data: unknown) => {
            insertedOutputs.push(data)
            return {
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: 'new-output-id', ...data as Record<string, unknown> },
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

        // Handle specific table queries
        if (table === 'wo_material_reservations') {
          chainable.order = vi.fn(() =>
            Promise.resolve({
              data: mockReservations,
              error: null,
            })
          )
        }
        if (table === 'license_plates') {
          chainable.in = vi.fn(() =>
            Promise.resolve({
              data: mockLps,
              error: null,
            })
          )
        }
        if (table === 'production_outputs') {
          chainable.order = vi.fn(() =>
            Promise.resolve({
              data: mockOutputs,
              error: null,
            })
          )
        }
        if (table === 'wo_consumption') {
          chainable.eq = vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
              })
            ),
          }))
        }

        return chainable
      }),
    })
  ),
}))

// Mock output registration service
vi.mock('@/lib/services/output-registration-service', () => ({
  calculateConsumptionAllocation: vi.fn(() =>
    Promise.resolve({
      allocations: [
        { lpId: 'lp-1', lpNumber: 'LP-001', qtyToConsume: 50 },
      ],
      isOverConsumption: false,
      cumulativeAfter: 50,
      remainingUnallocated: 0,
      totalReserved: 100,
    })
  ),
  registerOutput: vi.fn(() =>
    Promise.resolve({
      output: {
        id: 'output-1',
        lp_id: 'lp-new',
        lp_number: 'LP-WO001-ABC123',
        quantity: 50,
      },
      consumptionRecords: [{ id: 'cons-1', lpId: 'lp-1', qty: 50 }],
      genealogyRecords: 1,
      warnings: [],
    })
  ),
  OUTPUT_ERROR_CODES: {
    WO_NOT_IN_PROGRESS: 'WO_NOT_IN_PROGRESS',
    INVALID_QTY: 'INVALID_QTY',
    NO_RESERVATIONS: 'NO_RESERVATIONS',
    OVER_CONSUMPTION_DENIED: 'OVER_CONSUMPTION_DENIED',
    MISSING_PARENT_LP: 'MISSING_PARENT_LP',
    LP_CREATION_FAILED: 'LP_CREATION_FAILED',
  },
}))

/**
 * Helper: Create mock request
 */
function createRequest(
  method: string,
  body?: Record<string, unknown>,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL('http://localhost:3000/api/production/work-orders/wo-1/outputs')
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
 * Helper: Setup valid WO
 */
function setupValidWO(status: string = 'in_progress') {
  mockWorkOrder = {
    id: 'wo-1',
    org_id: 'org-1',
    wo_number: 'WO-001',
    status,
    product_id: 'prod-1',
    planned_qty: 100,
    output_qty: 0,
    uom: 'kg',
  }
}

describe('Output Registration API (Stories 4.12, 4.12a, 4.12b)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession = null
    mockCurrentUser = null
    mockWorkOrder = null
    mockOutputs = []
    mockReservations = []
    mockLps = []
    insertedOutputs.length = 0
    updatedRecords.length = 0
  })

  // ============================================================================
  // Authentication Tests
  // ============================================================================
  describe('Authentication', () => {
    it('should return 401 for unauthenticated request', async () => {
      // Import handler dynamically to apply mocks
      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/outputs/route'
      )

      const request = createRequest('POST', { qty: 50 })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 if user not found in database', async () => {
      mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }
      mockCurrentUser = null

      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/outputs/route'
      )

      const request = createRequest('POST', { qty: 50 })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(401)
    })
  })

  // ============================================================================
  // POST /api/production/work-orders/[id]/outputs Tests
  // ============================================================================
  describe('POST /outputs - Register Output (Story 4.12)', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
      setupValidWO()
    })

    it('AC-4.12.2: should create output LP successfully', async () => {
      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/outputs/route'
      )

      const request = createRequest('POST', { qty: 50, qa_status: 'passed' })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.output.lp_number).toBeDefined()
      expect(data.data.output.quantity).toBe(50)
    })

    it('AC-4.12.8: should return 400 for invalid quantity', async () => {
      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/outputs/route'
      )

      const request = createRequest('POST', { qty: 0 })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('INVALID_QTY')
    })

    it('AC-4.12.8: should return 404 for non-existent WO', async () => {
      mockWorkOrder = null

      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/outputs/route'
      )

      const request = createRequest('POST', { qty: 50 })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-999' }) })

      expect(response.status).toBe(404)
    })

    it('AC-4.12.8: should return 400 for WO not in_progress', async () => {
      setupValidWO('pending')

      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/outputs/route'
      )

      const request = createRequest('POST', { qty: 50 })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(400)
    })
  })

  // ============================================================================
  // POST /api/production/work-orders/[id]/outputs/preview Tests
  // ============================================================================
  describe('POST /outputs/preview - Allocation Preview (Story 4.12a)', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
      setupValidWO()
    })

    it('AC-4.12a.1: should return allocation preview', async () => {
      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/outputs/preview/route'
      )

      const request = createRequest('POST', { qty: 50 })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.allocations).toBeDefined()
      expect(data.data.is_over_consumption).toBeDefined()
    })

    it('should return 400 for invalid qty in preview', async () => {
      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/outputs/preview/route'
      )

      const request = createRequest('POST', { qty: -10 })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('INVALID_QTY')
    })
  })

  // ============================================================================
  // Over-production Tests (Story 4.12b)
  // ============================================================================
  describe('Over-production handling (Story 4.12b)', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
      setupValidWO()
    })

    it('AC-4.12b.9: should reject over-production without parent LP', async () => {
      // Mock service to throw missing parent LP error
      const { registerOutput } = await import(
        '@/lib/services/output-registration-service'
      )
      vi.mocked(registerOutput).mockRejectedValueOnce({
        code: 'MISSING_PARENT_LP',
        message: 'Must select parent LP for over-production',
      })

      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/outputs/route'
      )

      const request = createRequest('POST', {
        qty: 150,
        is_over_production: true,
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('MISSING_PARENT_LP')
    })

    it('AC-4.12b.2: should accept over-production with parent LP', async () => {
      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/outputs/route'
      )

      const request = createRequest('POST', {
        qty: 150,
        is_over_production: true,
        over_production_parent_lp_id: 'lp-parent',
      })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(200)
    })
  })

  // ============================================================================
  // Over-consumption Tests (Story 4.12a)
  // ============================================================================
  describe('Over-consumption handling (Story 4.12a)', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
      setupValidWO()
    })

    it('AC-4.12a.4: should return 409 for over-consumption', async () => {
      // Mock service to throw over-consumption error
      const { registerOutput } = await import(
        '@/lib/services/output-registration-service'
      )
      vi.mocked(registerOutput).mockRejectedValueOnce({
        code: 'OVER_CONSUMPTION_DENIED',
        message: 'Over-consumption detected - requires confirmation',
        details: {
          totalReserved: 100,
          cumulativeAfter: 150,
          remainingUnallocated: 50,
        },
      })

      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/outputs/route'
      )

      const request = createRequest('POST', { qty: 150 })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.requires_confirmation).toBe(true)
    })
  })

  // ============================================================================
  // GET /api/production/work-orders/[id]/outputs Tests
  // ============================================================================
  describe('GET /outputs - List Outputs', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
      setupValidWO()
      mockOutputs = [
        {
          id: 'output-1',
          wo_id: 'wo-1',
          lp_id: 'lp-1',
          quantity: 50,
          qa_status: 'passed',
          is_over_production: false,
          produced_at: '2025-01-15T10:00:00Z',
          license_plates: {
            id: 'lp-1',
            lp_number: 'LP-001',
            status: 'available',
          },
        },
      ]
    })

    it('should return list of outputs for WO', async () => {
      const { GET } = await import(
        '@/app/api/production/work-orders/[id]/outputs/route'
      )

      const request = createRequest('GET')
      const response = await GET(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data.data.outputs || data.data)).toBe(true)
    })

    it('should return empty array for WO with no outputs', async () => {
      mockOutputs = []

      const { GET } = await import(
        '@/app/api/production/work-orders/[id]/outputs/route'
      )

      const request = createRequest('GET')
      const response = await GET(request, { params: Promise.resolve({ id: 'wo-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.outputs || data.data).toHaveLength(0)
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
        org_id: 'different-org', // Different from user's org
        wo_number: 'WO-001',
        status: 'in_progress',
        product_id: 'prod-1',
        planned_qty: 100,
        output_qty: 0,
        uom: 'kg',
      }

      const { POST } = await import(
        '@/app/api/production/work-orders/[id]/outputs/route'
      )

      const request = createRequest('POST', { qty: 50 })
      const response = await POST(request, { params: Promise.resolve({ id: 'wo-1' }) })

      // Should return 404 (WO not found for this org) or 403
      expect([403, 404]).toContain(response.status)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Authentication (2 tests):
 *   - Unauthenticated request rejection
 *   - User not found in database
 *
 * POST /outputs (4 tests):
 *   - Successful output creation (AC-4.12.2)
 *   - Invalid quantity rejection (AC-4.12.8)
 *   - Non-existent WO handling (AC-4.12.8)
 *   - WO not in_progress rejection (AC-4.12.8)
 *
 * POST /outputs/preview (2 tests):
 *   - Allocation preview (AC-4.12a.1)
 *   - Invalid qty rejection
 *
 * Over-production (2 tests):
 *   - Missing parent LP rejection (AC-4.12b.9)
 *   - Acceptance with parent LP (AC-4.12b.2)
 *
 * Over-consumption (1 test):
 *   - 409 response for confirmation (AC-4.12a.4)
 *
 * GET /outputs (2 tests):
 *   - List outputs
 *   - Empty array handling
 *
 * RLS (1 test):
 *   - Cross-org access prevention
 *
 * Total: 14 tests
 */
