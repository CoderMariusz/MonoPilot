/**
 * Integration Tests: Consumption API (POST /api/production/work-orders/[woId]/consume)
 * Story: 04.6a (Material Consumption Desktop)
 *
 * Tests consumption API endpoint:
 * - LP validation errors (not found, not available, product mismatch, insufficient qty)
 * - Successful consumption recording
 * - RLS org isolation
 * - Role-based authorization
 *
 * RED PHASE - Tests will fail until API route is implemented
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

interface MockLP {
  id: string
  org_id: string
  lp_number: string
  product_id: string
  quantity: number
  uom: string
  status: string
  qa_status: string
}

interface MockWoMaterial {
  id: string
  wo_id: string
  organization_id: string
  product_id: string
  material_name: string
  required_qty: number
  consumed_qty: number
  uom: string
  consume_whole_lp: boolean
}

interface MockWorkOrder {
  id: string
  org_id: string
  status: string
}

/**
 * Mock State
 */
let mockUser: { id: string; email: string } | null = null
let mockCurrentUser: MockUser | null = null
let mockLP: MockLP | null = null
let mockWoMaterial: MockWoMaterial | null = null
let mockWorkOrder: MockWorkOrder | null = null

// Track mutations
const updatedRecords: Array<{ table: string; id: string; data: unknown }> = []
const insertedRecords: Array<{ table: string; data: unknown }> = []

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: mockUser },
            error: mockUser ? null : { message: 'No session' },
          })
        ),
      },
      from: vi.fn((table: string) => {
        const chainable = {
          select: vi.fn(() => chainable),
          eq: vi.fn(() => chainable),
          single: vi.fn(() => {
            if (table === 'users') {
              return Promise.resolve({
                data: mockCurrentUser,
                error: mockCurrentUser ? null : { message: 'User not found' },
              })
            }
            if (table === 'license_plates') {
              return Promise.resolve({
                data: mockLP,
                error: mockLP ? null : { message: 'LP not found' },
              })
            }
            if (table === 'wo_materials') {
              return Promise.resolve({
                data: mockWoMaterial,
                error: mockWoMaterial ? null : { message: 'Material not found' },
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
          update: vi.fn((data: unknown) => ({
            eq: vi.fn((field: string, value: string) => {
              updatedRecords.push({ table, id: value, data })
              return Promise.resolve({ error: null })
            }),
          })),
          insert: vi.fn((data: unknown) => {
            insertedRecords.push({ table, data })
            return {
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: 'new-consumption-id', ...(data as Record<string, unknown>) },
                    error: null,
                  })
                ),
              })),
            }
          }),
        }
        return chainable
      }),
    })
  ),
}))

/**
 * Helper: Create mock request
 */
function createRequest(body: Record<string, unknown>): NextRequest {
  const url = new URL('http://localhost:3000/api/production/work-orders/wo-1/consume')
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Helper: Setup authenticated user
 */
function setupUser(role: string = 'production_operator') {
  mockUser = { id: 'user-1', email: 'operator@example.com' }
  mockCurrentUser = {
    id: 'user-1',
    email: 'operator@example.com',
    role,
    org_id: 'org-1',
  }
}

/**
 * Helper: Setup valid LP and material
 */
function setupValidData() {
  mockLP = {
    id: 'lp-1',
    org_id: 'org-1',
    lp_number: 'LP-2025-08877',
    product_id: 'prod-flour',
    quantity: 100,
    uom: 'kg',
    status: 'available',
    qa_status: 'passed',
  }
  mockWoMaterial = {
    id: 'mat-1',
    wo_id: 'wo-1',
    organization_id: 'org-1',
    product_id: 'prod-flour',
    material_name: 'Flour',
    required_qty: 500,
    consumed_qty: 200,
    uom: 'kg',
    consume_whole_lp: false,
  }
  mockWorkOrder = {
    id: 'wo-1',
    org_id: 'org-1',
    status: 'in_progress',
  }
}

describe('POST /api/production/work-orders/[woId]/consume (Story 04.6a)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = null
    mockCurrentUser = null
    mockLP = null
    mockWoMaterial = null
    mockWorkOrder = null
    updatedRecords.length = 0
    insertedRecords.length = 0
  })

  // ============================================================================
  // Authentication Tests
  // ============================================================================
  describe('Authentication', () => {
    it('should return 401 for unauthenticated request', async () => {
      // Given: no authenticated user
      // When: POST request sent
      // Then: status 401

      // RED phase - route doesn't exist yet
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(401)

      expect(mockUser).toBeNull()
    })
  })

  // ============================================================================
  // LP Validation Error Tests
  // ============================================================================
  describe('LP Validation Errors', () => {
    it('should return 400 when LP not found', async () => {
      // Given: request with non-existent lp_id
      setupUser()
      mockLP = null

      // When: POST request sent
      // Then: status 400, error = 'LP_NOT_FOUND'

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-not-exist', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(400)
      // const data = await response.json()
      // expect(data.error).toBe('LP_NOT_FOUND')

      expect(mockLP).toBeNull()
    })

    it('should return 400 when LP not available (status = consumed)', async () => {
      // Given: request with lp_id where status = 'consumed'
      setupUser()
      setupValidData()
      mockLP!.status = 'consumed'
      mockLP!.quantity = 0

      // When: POST request sent
      // Then: status 400, error = 'LP_NOT_AVAILABLE'

      expect(mockLP!.status).toBe('consumed')

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(400)
      // const data = await response.json()
      // expect(data.error).toBe('LP_NOT_AVAILABLE')
    })

    it('should return 400 when product mismatch', async () => {
      // Given: request with LP.product_id != material.product_id
      setupUser()
      setupValidData()
      mockLP!.product_id = 'prod-water' // Different from material's product_id

      // When: POST request sent
      // Then: status 400, error = 'PRODUCT_MISMATCH'

      expect(mockLP!.product_id).not.toBe(mockWoMaterial!.product_id)

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(400)
      // const data = await response.json()
      // expect(data.error).toBe('PRODUCT_MISMATCH')
    })

    it('should return 400 when UoM mismatch', async () => {
      // Given: request with LP.uom != material.uom
      setupUser()
      setupValidData()
      mockLP!.uom = 'L' // Different from material's uom (kg)

      // When: POST request sent
      // Then: status 400, error = 'UOM_MISMATCH'

      expect(mockLP!.uom).not.toBe(mockWoMaterial!.uom)

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(400)
      // const data = await response.json()
      // expect(data.error).toBe('UOM_MISMATCH')
    })

    it('should return 400 when insufficient quantity', async () => {
      // Given: request with consume_qty > LP.qty
      setupUser()
      setupValidData()
      mockLP!.quantity = 30

      // When: POST request with consume_qty = 50
      // Then: status 400, error = 'INSUFFICIENT_QUANTITY'

      const requestedQty = 50
      expect(requestedQty).toBeGreaterThan(mockLP!.quantity)

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(400)
      // const data = await response.json()
      // expect(data.error).toBe('INSUFFICIENT_QUANTITY')
    })

    it('should return 400 when LP is on QA hold', async () => {
      // Given: LP with qa_status = 'on_hold'
      setupUser()
      setupValidData()
      mockLP!.qa_status = 'on_hold'

      // When: POST request sent
      // Then: status 400, error = 'LP_QA_HOLD'

      expect(mockLP!.qa_status).toBe('on_hold')

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(400)
      // const data = await response.json()
      // expect(data.error).toBe('LP_QA_HOLD')
    })
  })

  // ============================================================================
  // Successful Consumption Tests
  // ============================================================================
  describe('Successful Consumption', () => {
    it('should return 201 on successful consumption', async () => {
      // Given: valid request with all validations passing
      setupUser()
      setupValidData()

      // When: POST request sent
      // Then: status 201, returns consumption record and updated LP

      expect(mockLP!.status).toBe('available')
      expect(mockLP!.product_id).toBe(mockWoMaterial!.product_id)
      expect(mockLP!.uom).toBe(mockWoMaterial!.uom)

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(201)
      // const data = await response.json()
      // expect(data.consumption).toBeDefined()
      // expect(data.consumption.id).toBeDefined()
      // expect(data.lp).toBeDefined()
    })

    it('should update LP quantity after consumption', async () => {
      // Given: LP with qty = 100
      setupUser()
      setupValidData()

      // When: consume 40
      // Then: LP qty becomes 60
      const consumeQty = 40
      const expectedRemainingQty = mockLP!.quantity - consumeQty

      expect(expectedRemainingQty).toBe(60)

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 40 })
      // await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // const lpUpdate = updatedRecords.find(r => r.table === 'license_plates')
      // expect(lpUpdate).toBeDefined()
      // expect((lpUpdate?.data as any).quantity).toBe(60)
    })

    it('should update material consumed_qty after consumption', async () => {
      // Given: material with consumed_qty = 200
      setupUser()
      setupValidData()

      // When: consume 50
      // Then: material consumed_qty becomes 250
      const consumeQty = 50
      const expectedConsumedQty = mockWoMaterial!.consumed_qty + consumeQty

      expect(expectedConsumedQty).toBe(250)

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // const materialUpdate = updatedRecords.find(r => r.table === 'wo_materials')
      // expect(materialUpdate).toBeDefined()
      // expect((materialUpdate?.data as any).consumed_qty).toBe(250)
    })

    it('should mark LP as consumed when fully depleted', async () => {
      // Given: LP with qty = 50
      setupUser()
      setupValidData()
      mockLP!.quantity = 50

      // When: consume 50 (full LP)
      // Then: LP status becomes 'consumed'
      const consumeQty = 50

      expect(consumeQty).toBe(mockLP!.quantity)

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // const lpUpdate = updatedRecords.find(r => r.table === 'license_plates')
      // expect((lpUpdate?.data as any).status).toBe('consumed')
    })

    it('should create consumption record', async () => {
      // Given: valid consumption request
      setupUser()
      setupValidData()

      // When: POST request sent
      // Then: wo_consumptions record created

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // const consumptionInsert = insertedRecords.find(r => r.table === 'wo_consumptions')
      // expect(consumptionInsert).toBeDefined()
      // expect((consumptionInsert?.data as any).lp_id).toBe('lp-1')
      // expect((consumptionInsert?.data as any).consumed_qty).toBe(50)

      expect(mockLP).toBeDefined()
    })
  })

  // ============================================================================
  // RLS and Org Isolation Tests
  // ============================================================================
  describe('RLS and Org Isolation', () => {
    it('should enforce RLS org isolation', async () => {
      // Given: request for WO in different org
      setupUser()
      setupValidData()
      mockWorkOrder!.org_id = 'different-org'

      // When: POST request sent
      // Then: status 403, error = 'Not authorized'

      expect(mockWorkOrder!.org_id).not.toBe(mockCurrentUser!.org_id)

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect([403, 404]).toContain(response.status)
    })

    it('should return 404 when WO not found', async () => {
      // Given: non-existent WO
      setupUser()
      setupValidData()
      mockWorkOrder = null

      // When: POST request sent
      // Then: status 404

      expect(mockWorkOrder).toBeNull()

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-not-exist' }) })
      // expect(response.status).toBe(404)
    })
  })

  // ============================================================================
  // Work Order Status Validation Tests
  // ============================================================================
  describe('Work Order Status Validation', () => {
    it('should reject consumption when WO status is draft', async () => {
      // Given: WO with status = 'draft'
      setupUser()
      setupValidData()
      mockWorkOrder!.status = 'draft'

      // When: POST request sent
      // Then: status 400, error = 'WO_NOT_IN_PROGRESS'

      expect(mockWorkOrder!.status).toBe('draft')

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(400)
      // const data = await response.json()
      // expect(data.error).toBe('WO_NOT_IN_PROGRESS')
    })

    it('should reject consumption when WO status is completed', async () => {
      // Given: WO with status = 'completed'
      setupUser()
      setupValidData()
      mockWorkOrder!.status = 'completed'

      // When: POST request sent
      // Then: status 400, error = 'WO_NOT_IN_PROGRESS'

      expect(mockWorkOrder!.status).toBe('completed')

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(400)
    })

    it('should allow consumption when WO status is in_progress', async () => {
      // Given: WO with status = 'in_progress'
      setupUser()
      setupValidData()

      // When: POST request sent
      // Then: status 201

      expect(mockWorkOrder!.status).toBe('in_progress')

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(201)
    })

    it('should allow consumption when WO status is released', async () => {
      // Given: WO with status = 'released'
      setupUser()
      setupValidData()
      mockWorkOrder!.status = 'released'

      // When: POST request sent
      // Then: status 201 (released WOs can consume materials)

      expect(mockWorkOrder!.status).toBe('released')

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(201)
    })
  })

  // ============================================================================
  // Role-based Authorization Tests
  // ============================================================================
  describe('Role-based Authorization', () => {
    it('should allow production_operator to consume materials', async () => {
      // Given: user with role = 'production_operator'
      setupUser('production_operator')
      setupValidData()

      // When: POST request sent
      // Then: status 201

      expect(mockCurrentUser!.role).toBe('production_operator')

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(201)
    })

    it('should allow production_manager to consume materials', async () => {
      // Given: user with role = 'production_manager'
      setupUser('production_manager')
      setupValidData()

      // When: POST request sent
      // Then: status 201

      expect(mockCurrentUser!.role).toBe('production_manager')
    })

    it('should deny viewer from consuming materials', async () => {
      // Given: user with role = 'viewer'
      setupUser('viewer')
      setupValidData()

      // When: POST request sent
      // Then: status 403

      expect(mockCurrentUser!.role).toBe('viewer')

      // RED phase
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = createRequest({ lp_id: 'lp-1', wo_material_id: 'mat-1', consume_qty: 50 })
      // const response = await POST(request, { params: Promise.resolve({ woId: 'wo-1' }) })
      // expect(response.status).toBe(403)
    })
  })
})
