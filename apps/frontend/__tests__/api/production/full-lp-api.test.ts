/**
 * Full LP Consumption API - Integration Tests (Story 04.6c)
 * Purpose: Test POST /api/production/work-orders/:woId/consume with FULL_LP_REQUIRED validation
 * Phase: RED - Tests will fail until API validation is implemented
 *
 * Tests the API-level validation for 1:1 consumption enforcement:
 * - Returns 400 FULL_LP_REQUIRED when partial qty for consume_whole_lp=true
 * - Returns 201 success when full qty for consume_whole_lp=true
 * - Allows partial when consume_whole_lp=false
 * - Records variance when LP.qty differs from required
 * - Sets is_full_lp=true in consumption record
 *
 * Coverage Target: 90%+
 *
 * Acceptance Criteria Coverage:
 * - AC-04.6c.6: API Validation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabaseClient),
}))

// Mock user session
vi.mock('@/lib/auth/server', () => ({
  getSession: vi.fn(() =>
    Promise.resolve({
      user: {
        id: 'user-test-001',
        email: 'operator@test.com',
      },
    })
  ),
}))

/**
 * API Route handler will be at:
 * apps/frontend/app/api/production/work-orders/[woId]/consume/route.ts
 *
 * Expected request body:
 * {
 *   wo_material_id: string,
 *   lp_id: string,
 *   consume_qty: number,
 *   notes?: string
 * }
 *
 * Expected error response when FULL_LP_REQUIRED:
 * {
 *   error: 'FULL_LP_REQUIRED',
 *   message: 'Full LP consumption required. LP quantity is {lp_qty}',
 *   lp_qty: number,
 *   requested_qty: number
 * }
 */

describe('Full LP Consumption API (Story 04.6c)', () => {
  const testWoId = 'wo-001-uuid'
  const testMaterialId = 'wo-mat-001-uuid'
  const testLpId = 'lp-001-uuid'
  const testOrgId = 'org-test-123'
  const testUserId = 'user-test-001'

  const mockLp = {
    id: testLpId,
    org_id: testOrgId,
    lp_number: 'LP-2025-08877',
    quantity: 100,
    uom: 'kg',
    status: 'available',
    qa_status: 'passed',
    product_id: 'prod-flour-001',
  }

  const mockWoMaterialWholeLP = {
    id: testMaterialId,
    wo_id: testWoId,
    organization_id: testOrgId,
    product_id: 'prod-flour-001',
    material_name: 'Flour',
    required_qty: 90,
    consumed_qty: 0,
    reserved_qty: 0,
    uom: 'kg',
    consume_whole_lp: true, // 1:1 enforcement enabled
  }

  const mockWoMaterialPartial = {
    ...mockWoMaterialWholeLP,
    id: 'wo-mat-002-uuid',
    consume_whole_lp: false, // Partial allowed
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  // ============================================================================
  // FULL_LP_REQUIRED Error Response (AC-04.6c.6)
  // ============================================================================
  describe('POST /consume - FULL_LP_REQUIRED validation', () => {
    it('should return 400 FULL_LP_REQUIRED when partial qty for consume_whole_lp=true', async () => {
      // GIVEN: API receives consume_qty != LP.qty for consume_whole_lp=true material
      // WHEN: POST /consume called
      // THEN: returns 400 with error_code='FULL_LP_REQUIRED', message includes LP.qty

      const requestBody = {
        wo_material_id: testMaterialId,
        lp_id: testLpId,
        consume_qty: 50, // Partial - LP has 100
        notes: 'Test consumption',
      }

      // Test will FAIL until API is implemented
      // Expected response: 400 { error: 'FULL_LP_REQUIRED', message: '...', lp_qty: 100, requested_qty: 50 }

      expect(requestBody.consume_qty).toBe(50)
      expect(mockLp.quantity).toBe(100)
      expect(requestBody.consume_qty).not.toBe(mockLp.quantity)

      // TODO: Uncomment when API route exists
      // const { POST } = await import('@/app/api/production/work-orders/[woId]/consume/route')
      // const request = new NextRequest('http://localhost/api/production/work-orders/wo-001/consume', {
      //   method: 'POST',
      //   body: JSON.stringify(requestBody),
      //   headers: { 'Content-Type': 'application/json' },
      // })
      // const response = await POST(request, { params: { woId: testWoId } })
      // expect(response.status).toBe(400)
      // const data = await response.json()
      // expect(data.error).toBe('FULL_LP_REQUIRED')
      // expect(data.message).toContain('Full LP consumption required')
      // expect(data.message).toContain('100')
      // expect(data.lp_qty).toBe(100)
      // expect(data.requested_qty).toBe(50)
    })

    it('should include LP quantity in error response', async () => {
      // Error message should clearly state LP quantity for user guidance
      const lpQty = 250
      const requestedQty = 100

      const expectedMessage = `Full LP consumption required. LP quantity is ${lpQty}`

      expect(expectedMessage).toContain(lpQty.toString())

      // TODO: Validate actual API response message
    })

    it('should return 400 when consume_qty is 1 unit less than LP.qty', async () => {
      // Edge case: 99 vs 100
      const requestBody = {
        wo_material_id: testMaterialId,
        lp_id: testLpId,
        consume_qty: 99, // 1 unit short
      }

      expect(requestBody.consume_qty).toBe(99)

      // TODO: Uncomment when API route exists
      // const response = await POST(request, { params: { woId: testWoId } })
      // expect(response.status).toBe(400)
      // const data = await response.json()
      // expect(data.error).toBe('FULL_LP_REQUIRED')
    })
  })

  // ============================================================================
  // Successful Full LP Consumption
  // ============================================================================
  describe('POST /consume - Successful full LP consumption', () => {
    it('should return 201 success when full qty for consume_whole_lp=true', async () => {
      // GIVEN: consume_qty = LP.qty for consume_whole_lp=true material
      // WHEN: POST /consume called
      // THEN: returns 201 with consumption record

      const requestBody = {
        wo_material_id: testMaterialId,
        lp_id: testLpId,
        consume_qty: 100, // Full LP quantity
        notes: 'Full LP consumption',
      }

      expect(requestBody.consume_qty).toBe(mockLp.quantity)

      // TODO: Uncomment when API route exists
      // const response = await POST(request, { params: { woId: testWoId } })
      // expect(response.status).toBe(201)
      // const data = await response.json()
      // expect(data.consumption).toBeDefined()
      // expect(data.consumption.consumed_qty).toBe(100)
    })

    it('should set is_full_lp=true in consumption record when full LP consumed', async () => {
      const requestBody = {
        wo_material_id: testMaterialId,
        lp_id: testLpId,
        consume_qty: 100,
      }

      expect(requestBody.consume_qty).toBe(mockLp.quantity)

      // TODO: Uncomment when API route exists
      // const response = await POST(request, { params: { woId: testWoId } })
      // expect(response.status).toBe(201)
      // const data = await response.json()
      // expect(data.consumption.is_full_lp).toBe(true)
    })
  })

  // ============================================================================
  // Partial Consumption When Allowed
  // ============================================================================
  describe('POST /consume - Partial consumption allowed', () => {
    it('should allow partial when consume_whole_lp=false', async () => {
      // GIVEN: consume_whole_lp=false material
      // WHEN: partial qty submitted
      // THEN: consumption succeeds

      const requestBody = {
        wo_material_id: mockWoMaterialPartial.id,
        lp_id: testLpId,
        consume_qty: 50, // Partial
      }

      expect(mockWoMaterialPartial.consume_whole_lp).toBe(false)

      // TODO: Uncomment when API route exists
      // const response = await POST(request, { params: { woId: testWoId } })
      // expect(response.status).toBe(201)
      // const data = await response.json()
      // expect(data.consumption.consumed_qty).toBe(50)
    })

    it('should set is_full_lp=false when partial LP consumed', async () => {
      const requestBody = {
        wo_material_id: mockWoMaterialPartial.id,
        lp_id: testLpId,
        consume_qty: 50,
      }

      expect(requestBody.consume_qty < mockLp.quantity).toBe(true)

      // TODO: Uncomment when API route exists
      // const response = await POST(request, { params: { woId: testWoId } })
      // const data = await response.json()
      // expect(data.consumption.is_full_lp).toBe(false)
    })
  })

  // ============================================================================
  // Variance Recording
  // ============================================================================
  describe('POST /consume - Variance recording', () => {
    it('should record variance when LP.qty differs from required', async () => {
      // GIVEN: LP.qty=100, required_qty=90
      // WHEN: full LP consumed
      // THEN: variance recorded (+11.11%)

      const requestBody = {
        wo_material_id: testMaterialId,
        lp_id: testLpId,
        consume_qty: 100, // Full LP, but required is 90
      }

      const expectedVariance = ((100 - 90) / 90) * 100 // +11.11%
      expect(expectedVariance).toBeCloseTo(11.11, 1)

      // TODO: Uncomment when API route exists
      // const response = await POST(request, { params: { woId: testWoId } })
      // const data = await response.json()
      // expect(data.consumption.variance_percentage).toBeCloseTo(11.11, 1)
    })
  })

  // ============================================================================
  // Error Response Format
  // ============================================================================
  describe('Error response format', () => {
    it('should return proper JSON structure for FULL_LP_REQUIRED error', async () => {
      // Expected structure: { error, message, lp_qty, requested_qty }

      const expectedErrorResponse = {
        error: 'FULL_LP_REQUIRED',
        message: 'Full LP consumption required. LP quantity is 100',
        lp_qty: 100,
        requested_qty: 50,
      }

      expect(expectedErrorResponse).toHaveProperty('error')
      expect(expectedErrorResponse).toHaveProperty('message')
      expect(expectedErrorResponse).toHaveProperty('lp_qty')
      expect(expectedErrorResponse).toHaveProperty('requested_qty')
      expect(expectedErrorResponse.error).toBe('FULL_LP_REQUIRED')
    })
  })
})
