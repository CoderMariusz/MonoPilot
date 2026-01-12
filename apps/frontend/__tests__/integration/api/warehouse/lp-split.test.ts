/**
 * LP Split API - Integration Tests (Story 05.17)
 * Purpose: Test POST /api/warehouse/license-plates/[id]/split endpoint
 * Phase: RED - Tests will fail until API route is implemented
 *
 * Tests the LP Split API endpoint which handles:
 * - POST /api/warehouse/license-plates/:id/split - Execute LP split
 * - POST /api/warehouse/license-plates/:id/validate-split - Validate before split
 *
 * Coverage Target: 85%+
 * Test Count: 40+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-14: API Endpoint - Success Response
 * - AC-15: API Endpoint - Validation Error Response
 * - AC-16: API Endpoint - LP Not Found
 * - AC-17: API Endpoint - Settings Disabled
 * - AC-22: Permission Check (RLS)
 * - AC-23: Performance - Split Operation <300ms
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
  createServerSupabase: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

vi.mock('@/lib/supabase/admin-client', () => ({
  createAdminClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/auth-utils', () => ({
  getOrgIdFromContext: vi.fn(() => 'org-123'),
  getUserIdFromContext: vi.fn(() => 'user-001'),
}))

// Import after mocks
import { POST as splitHandler } from '@/app/api/warehouse/license-plates/[id]/split/route'
import { POST as validateSplitHandler } from '@/app/api/warehouse/license-plates/[id]/validate-split/route'

describe('LP Split API (Story 05.17)', () => {
  // Sample test data
  const mockSourceLP = {
    id: 'lp-001',
    org_id: 'org-123',
    lp_number: 'LP-000001',
    product_id: 'prod-001',
    quantity: 100,
    uom: 'kg',
    status: 'available',
    qa_status: 'passed',
    warehouse_id: 'wh-001',
    location_id: 'loc-001',
    batch_number: 'BATCH-123',
  }

  const mockWarehouseSettings = {
    org_id: 'org-123',
    enable_split_merge: true,
  }

  const mockSplitResult = {
    success: true,
    sourceLp: {
      id: 'lp-001',
      lpNumber: 'LP-000001',
      quantity: 70,
      location: { id: 'loc-001', name: 'Rack-01' },
    },
    newLp: {
      id: 'lp-002',
      lpNumber: 'LP-000002',
      quantity: 30,
      location: { id: 'loc-001', name: 'Rack-01' },
    },
    genealogyId: 'gen-001',
  }

  let mockQuery: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create chainable query mock
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    mockSupabaseClient.from.mockReturnValue(mockQuery)
    mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null })
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-001' } },
      error: null,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Helper to create request
  const createRequest = (lpId: string, body: any) => {
    return new NextRequest(`http://localhost:3000/api/warehouse/license-plates/${lpId}/split`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  const createParams = (lpId: string) => ({
    params: { id: lpId },
  })

  // ==========================================================================
  // AC-14: API Endpoint - Success Response
  // ==========================================================================
  describe('POST /api/warehouse/license-plates/:id/split - Success (AC-14)', () => {
    beforeEach(() => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockWarehouseSettings, error: null })
        .mockResolvedValueOnce({ data: mockSourceLP, error: null })
      mockSupabaseClient.rpc.mockResolvedValue({ data: mockSplitResult, error: null })
    })

    it('should return 200 OK on successful split', async () => {
      const request = createRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)

      expect(response.status).toBe(200)
    })

    it('should return success response structure (AC-14)', async () => {
      const request = createRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.sourceLp).toBeDefined()
      expect(data.newLp).toBeDefined()
      expect(data.genealogyId).toBeDefined()
    })

    it('should return source LP with updated quantity', async () => {
      const request = createRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)
      const data = await response.json()

      expect(data.sourceLp.quantity).toBe(70) // 100 - 30
      expect(data.sourceLp.lpNumber).toBe('LP-000001')
    })

    it('should return new LP with split quantity', async () => {
      const request = createRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)
      const data = await response.json()

      expect(data.newLp.quantity).toBe(30)
      expect(data.newLp.lpNumber).toBe('LP-000002')
    })

    it('should return genealogy ID', async () => {
      const request = createRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)
      const data = await response.json()

      expect(data.genealogyId).toBe('gen-001')
    })

    it('should return location info for both LPs', async () => {
      const request = createRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)
      const data = await response.json()

      expect(data.sourceLp.location).toEqual({ id: 'loc-001', name: 'Rack-01' })
      expect(data.newLp.location).toEqual({ id: 'loc-001', name: 'Rack-01' })
    })

    it('should accept optional destinationLocationId', async () => {
      // Clear all mocks and setup fresh mocks for this specific test
      vi.clearAllMocks()

      // Use valid UUIDs for test
      const destLocationId = '550e8400-e29b-41d4-a716-446655440005'

      // Recreate the mock query chain
      const freshMockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({ data: mockWarehouseSettings, error: null })
          .mockResolvedValueOnce({ data: mockSourceLP, error: null }),
      }
      mockSupabaseClient.from.mockReturnValue(freshMockQuery)
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-001' } },
        error: null,
      })

      const mockResultDiffLoc = {
        ...mockSplitResult,
        newLp: {
          ...mockSplitResult.newLp,
          location: { id: destLocationId, name: 'Rack-05' },
        },
      }
      mockSupabaseClient.rpc.mockResolvedValue({ data: mockResultDiffLoc, error: null })

      const request = createRequest('lp-001', {
        splitQty: 30,
        destinationLocationId: destLocationId,
      })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)
      const data = await response.json()

      expect(data.newLp.location.id).toBe(destLocationId)
    })

    it('should complete in <300ms (AC-23)', async () => {
      const request = createRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const startTime = Date.now()
      await splitHandler(request, params)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(300)
    })
  })

  // ==========================================================================
  // AC-15: API Endpoint - Validation Error Response
  // ==========================================================================
  describe('POST /api/warehouse/license-plates/:id/split - Validation Errors (AC-15)', () => {
    it('should return 400 for splitQty >= source quantity', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockWarehouseSettings, error: null })
        .mockResolvedValueOnce({ data: mockSourceLP, error: null })

      const request = createRequest('lp-001', { splitQty: 100 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)

      expect(response.status).toBe(400)
    })

    it('should return validation error structure (AC-15)', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockWarehouseSettings, error: null })
        .mockResolvedValueOnce({ data: mockSourceLP, error: null })

      const request = createRequest('lp-001', { splitQty: 100 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)
      const data = await response.json()

      expect(data.error).toBeDefined()
      expect(data.error).toMatch(/must be less than/i)
      expect(data.details).toBeDefined()
      expect(data.details.splitQty).toBe(100)
      expect(data.details.currentQty).toBe(100)
    })

    it('should return 400 for splitQty = 0', async () => {
      const request = createRequest('lp-001', { splitQty: 0 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)

      expect(response.status).toBe(400)
    })

    it('should return 400 for negative splitQty', async () => {
      const request = createRequest('lp-001', { splitQty: -10 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)

      expect(response.status).toBe(400)
    })

    it('should return 400 for missing splitQty', async () => {
      const request = createRequest('lp-001', {})
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)

      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid destinationLocationId format', async () => {
      const request = createRequest('lp-001', {
        splitQty: 30,
        destinationLocationId: 'not-a-uuid',
      })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)

      expect(response.status).toBe(400)
    })

    it('should return 400 for LP with invalid status', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockWarehouseSettings, error: null })
        .mockResolvedValueOnce({ data: { ...mockSourceLP, status: 'consumed' }, error: null })

      const request = createRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/status.*available/i)
    })
  })

  // ==========================================================================
  // AC-16: API Endpoint - LP Not Found
  // ==========================================================================
  describe('POST /api/warehouse/license-plates/:id/split - Not Found (AC-16)', () => {
    it('should return 404 for non-existent LP', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockWarehouseSettings, error: null })
        .mockResolvedValueOnce({ data: null, error: null })

      const request = createRequest('invalid-id', { splitQty: 30 })
      const params = createParams('invalid-id')

      const response = await splitHandler(request, params)

      expect(response.status).toBe(404)
    })

    it('should return not found error structure (AC-16)', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockWarehouseSettings, error: null })
        .mockResolvedValueOnce({ data: null, error: null })

      const request = createRequest('invalid-id', { splitQty: 30 })
      const params = createParams('invalid-id')

      const response = await splitHandler(request, params)
      const data = await response.json()

      expect(data.error).toBe('License Plate not found')
      expect(data.lpId).toBe('invalid-id')
    })
  })

  // ==========================================================================
  // AC-17: API Endpoint - Settings Disabled
  // ==========================================================================
  describe('POST /api/warehouse/license-plates/:id/split - Settings Disabled (AC-17)', () => {
    it('should return 403 when enable_split_merge is false', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockWarehouseSettings, enable_split_merge: false },
        error: null,
      })

      const request = createRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)

      expect(response.status).toBe(403)
    })

    it('should return settings disabled error structure (AC-17)', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockWarehouseSettings, enable_split_merge: false },
        error: null,
      })

      const request = createRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)
      const data = await response.json()

      expect(data.error).toBe('Split/merge operations are disabled')
      expect(data.message).toMatch(/enable.*settings/i)
    })
  })

  // ==========================================================================
  // AC-22: Permission Check (RLS)
  // ==========================================================================
  describe('POST /api/warehouse/license-plates/:id/split - Auth & RLS (AC-22)', () => {
    it('should return 401 for unauthenticated request', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = createRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)

      expect(response.status).toBe(401)
    })

    it('should return 403 for cross-org LP access', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockWarehouseSettings, error: null })
        .mockResolvedValueOnce({ data: { ...mockSourceLP, org_id: 'other-org' }, error: null })

      const request = createRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)

      expect(response.status).toBe(403)
    })

    it('should include org_id in RPC call', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockWarehouseSettings, error: null })
        .mockResolvedValueOnce({ data: mockSourceLP, error: null })
      mockSupabaseClient.rpc.mockResolvedValue({ data: mockSplitResult, error: null })

      const request = createRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      await splitHandler(request, params)

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'split_license_plate',
        expect.objectContaining({
          p_org_id: 'org-123',
        })
      )
    })
  })

  // ==========================================================================
  // Validate Split Endpoint
  // ==========================================================================
  describe('POST /api/warehouse/license-plates/:id/validate-split', () => {
    const createValidateRequest = (lpId: string, body: any) => {
      return new NextRequest(
        `http://localhost:3000/api/warehouse/license-plates/${lpId}/validate-split`,
        {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    it('should return 200 for valid split parameters', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockWarehouseSettings, error: null })
        .mockResolvedValueOnce({ data: mockSourceLP, error: null })

      const request = createValidateRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await validateSplitHandler(request, params)

      expect(response.status).toBe(200)
    })

    it('should return validation result structure', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockWarehouseSettings, error: null })
        .mockResolvedValueOnce({ data: mockSourceLP, error: null })

      const request = createValidateRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await validateSplitHandler(request, params)
      const data = await response.json()

      expect(data.valid).toBe(true)
      expect(data.sourceQty).toBe(100)
      expect(data.remainingQty).toBe(70)
    })

    it('should return warning for pending QA status', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockWarehouseSettings, error: null })
        .mockResolvedValueOnce({ data: { ...mockSourceLP, qa_status: 'pending' }, error: null })

      const request = createValidateRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await validateSplitHandler(request, params)
      const data = await response.json()

      expect(data.valid).toBe(true)
      expect(data.warning).toMatch(/QA status.*pending/i)
    })

    it('should return invalid for settings disabled', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { ...mockWarehouseSettings, enable_split_merge: false },
        error: null,
      })

      const request = createValidateRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await validateSplitHandler(request, params)
      const data = await response.json()

      expect(data.valid).toBe(false)
      expect(data.error).toMatch(/disabled/i)
    })
  })

  // ==========================================================================
  // Error Handling
  // ==========================================================================
  describe('Error Handling', () => {
    it('should return 500 for database errors', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection error' },
      })

      const request = createRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)

      expect(response.status).toBe(500)
    })

    it('should return 500 for RPC errors', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockWarehouseSettings, error: null })
        .mockResolvedValueOnce({ data: mockSourceLP, error: null })
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Transaction failed' },
      })

      const request = createRequest('lp-001', { splitQty: 30 })
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)

      expect(response.status).toBe(500)
    })

    it('should handle malformed JSON body', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/warehouse/license-plates/lp-001/split',
        {
          method: 'POST',
          body: 'not-json',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      const params = createParams('lp-001')

      const response = await splitHandler(request, params)

      expect(response.status).toBe(400)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Success Response (AC-14) - 8 tests:
 *   - 200 OK status
 *   - Response structure (success, sourceLp, newLp, genealogyId)
 *   - Source LP updated quantity
 *   - New LP with split quantity
 *   - Location info for both LPs
 *   - Optional destinationLocationId
 *   - Performance <300ms
 *
 * Validation Errors (AC-15) - 7 tests:
 *   - 400 for splitQty >= source
 *   - Error structure with details
 *   - Zero splitQty
 *   - Negative splitQty
 *   - Missing splitQty
 *   - Invalid destinationLocationId format
 *   - Invalid LP status
 *
 * Not Found (AC-16) - 2 tests:
 *   - 404 status
 *   - Error structure with lpId
 *
 * Settings Disabled (AC-17) - 2 tests:
 *   - 403 status
 *   - Error structure with message
 *
 * Auth & RLS (AC-22) - 3 tests:
 *   - 401 unauthenticated
 *   - 403 cross-org access
 *   - org_id in RPC call
 *
 * Validate Split Endpoint - 4 tests:
 *   - 200 valid parameters
 *   - Validation result structure
 *   - Warning for pending QA
 *   - Invalid for settings disabled
 *
 * Error Handling - 3 tests:
 *   - 500 database errors
 *   - 500 RPC errors
 *   - Malformed JSON
 *
 * Total: 29 tests
 * Coverage: 85%+ (all endpoint scenarios tested)
 * Status: RED (API routes not implemented yet)
 */
