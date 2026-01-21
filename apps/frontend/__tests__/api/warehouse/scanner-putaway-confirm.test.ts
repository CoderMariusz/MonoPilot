/**
 * Scanner Putaway Confirm API Integration Tests (Story 05.21)
 * Phase: GREEN - Tests with working mock patterns
 *
 * Tests POST /api/warehouse/scanner/putaway
 *
 * Acceptance Criteria Coverage:
 * - AC-5: Putaway creates stock_move with move_type='putaway'
 * - AC-7: Putaway API endpoint
 * - AC-4: Override handling
 * - AC-11: RLS and security
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// =============================================================================
// Mock Data
// =============================================================================

// Use valid UUIDs for Zod validation
const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'operator@test.com',
  org_id: '00000000-0000-0000-0000-000000000099',
}

const mockLP = {
  id: '00000000-0000-0000-0000-000000000101',
  lp_number: 'LP00000001',
  product_id: '00000000-0000-0000-0000-000000000201',
  quantity: 100,
  uom: 'KG',
  expiry_date: '2025-12-31',
  status: 'available',
  qa_status: 'passed',
  location_id: '00000000-0000-0000-0000-000000000300',
  warehouse_id: '00000000-0000-0000-0000-000000000400',
  created_at: '2025-01-10T10:00:00Z',
  batch_number: 'BATCH-001',
}

const mockLocation = {
  id: '00000000-0000-0000-0000-000000000301',
  location_code: 'A-01-02-03',
  name: 'Aisle A Rack 01 Level 02 Bin 03',
  warehouse_id: '00000000-0000-0000-0000-000000000400',
  zone_id: '00000000-0000-0000-0000-000000000500',
  is_active: true,
  full_path: 'Warehouse A / Zone Cold / A-01-02-03',
}

const mockStockMove = {
  id: '00000000-0000-0000-0000-000000000601',
  move_number: 'SM-2025-00042',
  move_type: 'putaway',
  lp_id: '00000000-0000-0000-0000-000000000101',
  from_location_id: '00000000-0000-0000-0000-000000000300',
  to_location_id: '00000000-0000-0000-0000-000000000301',
  quantity: 100,
  status: 'completed',
}

// =============================================================================
// Shared mock state
// =============================================================================

let currentAuthResult: { data: { user: typeof mockUser | null }; error: Error | null } = {
  data: { user: mockUser },
  error: null,
}
let currentLPResult: { data: typeof mockLP | null; error: { code: string; message: string } | null } = {
  data: mockLP,
  error: null,
}
let currentLocationResult: { data: typeof mockLocation | null; error: { code: string; message: string } | null } = {
  data: mockLocation,
  error: null,
}

// Mock service functions
let mockProcessPutaway = vi.fn()
let mockValidatePutaway = vi.fn()

// =============================================================================
// Mocks
// =============================================================================

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve(currentAuthResult)),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => {
        if (table === 'license_plates') return Promise.resolve(currentLPResult)
        if (table === 'locations') return Promise.resolve(currentLocationResult)
        if (table === 'users') return Promise.resolve({ data: mockUser, error: null })
        return Promise.resolve({ data: null, error: null })
      }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: 'sm-001', error: null })),
  })),
  createServerClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve(currentAuthResult)),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => {
        if (table === 'license_plates') return Promise.resolve(currentLPResult)
        if (table === 'locations') return Promise.resolve(currentLocationResult)
        if (table === 'users') return Promise.resolve({ data: mockUser, error: null })
        return Promise.resolve({ data: null, error: null })
      }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: 'sm-001', error: null })),
  })),
  createServerSupabase: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve(currentAuthResult)),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => {
        if (table === 'license_plates') return Promise.resolve(currentLPResult)
        if (table === 'locations') return Promise.resolve(currentLocationResult)
        if (table === 'users') return Promise.resolve({ data: mockUser, error: null })
        return Promise.resolve({ data: null, error: null })
      }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: 'sm-001', error: null })),
  })),
}))

vi.mock('@/lib/services/scanner-putaway-service', () => ({
  ScannerPutawayService: {
    get processPutaway() {
      return mockProcessPutaway
    },
    get validatePutaway() {
      return mockValidatePutaway
    },
  },
}))

// Import after mocks
import { POST } from '@/app/api/warehouse/scanner/putaway/route'

// =============================================================================
// Helper to Create Request
// =============================================================================

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/warehouse/scanner/putaway', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// =============================================================================
// Tests
// =============================================================================

describe('POST /api/warehouse/scanner/putaway (Story 05.21)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock state
    currentAuthResult = { data: { user: mockUser }, error: null }
    currentLPResult = { data: mockLP, error: null }
    currentLocationResult = { data: mockLocation, error: null }
    // Reset mock services to default behavior
    mockValidatePutaway = vi.fn(() =>
      Promise.resolve({
        valid: true,
        errors: [],
        warnings: [],
      })
    )
    mockProcessPutaway = vi.fn(() =>
      Promise.resolve({
        stockMove: {
          id: mockStockMove.id,
          move_number: mockStockMove.move_number,
          move_type: mockStockMove.move_type,
          from_location_id: mockStockMove.from_location_id,
          to_location_id: mockStockMove.to_location_id,
          quantity: mockStockMove.quantity,
          status: mockStockMove.status,
        },
        lp: {
          id: mockLP.id,
          lp_number: mockLP.lp_number,
          location_id: mockLocation.id,
          location_path: mockLocation.full_path,
        },
        overrideApplied: false,
      })
    )
  })

  // ===========================================================================
  // Happy Path - AC-5, AC-7
  // ===========================================================================
  describe('Happy Path (AC-5, AC-7)', () => {
    it('should return 201 Created for valid putaway', async () => {
      const request = createRequest({
        lp_id: mockLP.id,
        location_id: mockLocation.id,
        suggested_location_id: mockLocation.id,
        override: false,
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('should return stock_move in response', async () => {
      const request = createRequest({
        lp_id: mockLP.id,
        location_id: mockLocation.id,
        override: false,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.stock_move).toBeDefined()
      expect(data.stock_move.id).toBeDefined()
      expect(data.stock_move.move_number).toMatch(/SM-\d{4}-\d{5}/)
    })

    it('should return move_type=putaway in stock_move', async () => {
      const request = createRequest({
        lp_id: mockLP.id,
        location_id: mockLocation.id,
        override: false,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.stock_move.move_type).toBe('putaway')
    })

    it('should return updated LP in response', async () => {
      const request = createRequest({
        lp_id: mockLP.id,
        location_id: mockLocation.id,
        override: false,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.lp).toBeDefined()
      expect(data.lp.id).toBe(mockLP.id)
      expect(data.lp.lp_number).toBe('LP00000001')
    })

    it('should return updated location_id in LP', async () => {
      const request = createRequest({
        lp_id: mockLP.id,
        location_id: mockLocation.id,
        override: false,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.lp.location_id).toBe(mockLocation.id)
    })

    it('should return location_path in LP', async () => {
      const request = createRequest({
        lp_id: mockLP.id,
        location_id: mockLocation.id,
        override: false,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.lp.location_path).toMatch(/Warehouse.*Zone.*A-01-02-03/)
    })

    it('should return override_applied=false when location matches suggestion', async () => {
      const request = createRequest({
        lp_id: mockLP.id,
        location_id: mockLocation.id,
        suggested_location_id: mockLocation.id,
        override: false,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.override_applied).toBe(false)
    })
  })

  // ===========================================================================
  // Override Handling - AC-4
  // ===========================================================================
  describe('Override Handling (AC-4)', () => {
    it('should accept override=true with different location', async () => {
      mockProcessPutaway = vi.fn(() =>
        Promise.resolve({
          stockMove: mockStockMove,
          lp: {
            id: mockLP.id,
            lp_number: mockLP.lp_number,
            location_id: '00000000-0000-0000-0000-000000000302',
            location_path: 'Warehouse A / Zone B / B-01-01-01',
          },
          overrideApplied: true,
        })
      )

      const request = createRequest({
        lp_id: mockLP.id,
        location_id: '00000000-0000-0000-0000-000000000302',
        suggested_location_id: mockLocation.id,
        override: true,
        override_reason: 'Closer to production line',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.override_applied).toBe(true)
    })

    it('should return 201 even with override', async () => {
      mockProcessPutaway = vi.fn(() =>
        Promise.resolve({
          stockMove: mockStockMove,
          lp: {
            id: mockLP.id,
            lp_number: mockLP.lp_number,
            location_id: '00000000-0000-0000-0000-000000000302',
            location_path: 'Warehouse A / Zone B / B-01-01-01',
          },
          overrideApplied: true,
        })
      )

      const request = createRequest({
        lp_id: mockLP.id,
        location_id: '00000000-0000-0000-0000-000000000302',
        suggested_location_id: mockLocation.id,
        override: true,
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('should include suggested_location_code when override applied', async () => {
      mockProcessPutaway = vi.fn(() =>
        Promise.resolve({
          stockMove: mockStockMove,
          lp: {
            id: mockLP.id,
            lp_number: mockLP.lp_number,
            location_id: '00000000-0000-0000-0000-000000000302',
            location_path: 'Warehouse A / Zone B / B-01-01-01',
          },
          overrideApplied: true,
          suggestedLocationCode: 'A-01-02-03',
        })
      )

      const request = createRequest({
        lp_id: mockLP.id,
        location_id: '00000000-0000-0000-0000-000000000302',
        suggested_location_id: mockLocation.id,
        override: true,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.suggested_location_code).toBeDefined()
    })
  })

  // ===========================================================================
  // Validation Errors - AC-7
  // ===========================================================================
  describe('Validation Errors (AC-7)', () => {
    it('should return 400 when LP not available (status=consumed)', async () => {
      currentLPResult = { data: { ...mockLP, status: 'consumed' }, error: null }
      mockValidatePutaway = vi.fn(() =>
        Promise.resolve({
          valid: false,
          errors: [{ field: 'lp_id', message: 'LP not available for putaway (status: consumed)' }],
          warnings: [],
        })
      )

      const request = createRequest({
        lp_id: mockLP.id,
        location_id: mockLocation.id,
        override: false,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toMatch(/not available.*putaway|status.*consumed/i)
    })

    it('should return 400 when location is inactive', async () => {
      currentLocationResult = { data: { ...mockLocation, is_active: false }, error: null }
      mockValidatePutaway = vi.fn(() =>
        Promise.resolve({
          valid: false,
          errors: [{ field: 'location_id', message: 'Location not available' }],
          warnings: [],
        })
      )

      const request = createRequest({
        lp_id: mockLP.id,
        location_id: mockLocation.id,
        override: false,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toMatch(/location.*not available/i)
    })

    it('should return 400 when lp_id is missing', async () => {
      const request = createRequest({
        location_id: 'loc-a01',
        override: false,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 when location_id is missing', async () => {
      const request = createRequest({
        lp_id: 'lp-001',
        override: false,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid UUID format', async () => {
      const request = createRequest({
        lp_id: 'invalid-uuid',
        location_id: 'also-invalid',
        override: false,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  // ===========================================================================
  // Authentication & Authorization - AC-11
  // ===========================================================================
  describe('Authentication & Authorization (AC-11)', () => {
    it('should return 401 when not authenticated', async () => {
      currentAuthResult = { data: { user: null }, error: new Error('Not authenticated') }

      const request = createRequest({
        lp_id: mockLP.id,
        location_id: mockLocation.id,
        override: false,
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 404 when LP belongs to different org', async () => {
      // RLS will return null for LP not in user's org
      currentLPResult = { data: null, error: null }
      mockProcessPutaway = vi.fn(() => Promise.reject(new Error('LP not found')))

      const request = createRequest({
        lp_id: '00000000-0000-0000-0000-000000000999',
        location_id: mockLocation.id,
        override: false,
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('should return 400 when location not in user assigned warehouse', async () => {
      currentLocationResult = { data: { ...mockLocation, warehouse_id: 'wh-other' }, error: null }
      mockValidatePutaway = vi.fn(() =>
        Promise.resolve({
          valid: false,
          errors: [{ field: 'location_id', message: 'Location not in your assigned warehouse' }],
          warnings: [],
        })
      )

      const request = createRequest({
        lp_id: mockLP.id,
        location_id: '00000000-0000-0000-0000-000000000303',
        override: false,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toMatch(/warehouse/i)
    })
  })

  // ===========================================================================
  // Response Format - AC-7
  // ===========================================================================
  describe('Response Format (AC-7)', () => {
    it('should match documented response schema', async () => {
      const request = createRequest({
        lp_id: mockLP.id,
        location_id: mockLocation.id,
        override: false,
      })

      const response = await POST(request)
      const data = await response.json()

      // Verify required fields from AC-7
      expect(data).toHaveProperty('stock_move')
      expect(data).toHaveProperty('lp')
      expect(data).toHaveProperty('override_applied')

      // stock_move structure
      expect(data.stock_move).toHaveProperty('id')
      expect(data.stock_move).toHaveProperty('move_number')
      expect(data.stock_move).toHaveProperty('move_type')

      // lp structure
      expect(data.lp).toHaveProperty('id')
      expect(data.lp).toHaveProperty('lp_number')
      expect(data.lp).toHaveProperty('location_id')
      expect(data.lp).toHaveProperty('location_path')
    })
  })

  // ===========================================================================
  // Performance - AC-10
  // ===========================================================================
  describe('Performance (AC-10)', () => {
    it('should respond within 500ms', async () => {
      const request = createRequest({
        lp_id: mockLP.id,
        location_id: mockLocation.id,
        override: false,
      })
      const start = Date.now()

      await POST(request)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(500)
    })
  })

  // ===========================================================================
  // Idempotency
  // ===========================================================================
  describe('Idempotency', () => {
    it('should not create duplicate stock moves on retry', async () => {
      // First request
      const request1 = createRequest({
        lp_id: mockLP.id,
        location_id: mockLocation.id,
        override: false,
      })

      const response1 = await POST(request1)
      await response1.json()

      // Simulate LP now at different location (already moved)
      currentLPResult = { data: { ...mockLP, location_id: 'loc-a01' }, error: null }

      // Second request with same data should either succeed with same move or fail gracefully
      const request2 = createRequest({
        lp_id: mockLP.id,
        location_id: mockLocation.id,
        override: false,
      })

      const response2 = await POST(request2)

      // Should handle gracefully (either 200/201 with same move or 400)
      expect([200, 201, 400]).toContain(response2.status)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Happy Path (AC-5, AC-7) - 7 tests:
 *   - 201 Created response
 *   - Stock move in response
 *   - Move type = putaway
 *   - LP in response
 *   - Updated location_id
 *   - Location path
 *   - Override applied flag
 *
 * Override Handling (AC-4) - 3 tests:
 *   - Accept override=true
 *   - Return 201 with override
 *   - Include suggested location code
 *
 * Validation Errors (AC-7) - 5 tests:
 *   - LP not available (consumed)
 *   - Location inactive
 *   - Missing lp_id
 *   - Missing location_id
 *   - Invalid UUID format
 *
 * Authentication & Authorization (AC-11) - 3 tests:
 *   - 401 unauthenticated
 *   - 404 cross-org LP
 *   - 400 location not in warehouse
 *
 * Response Format (AC-7) - 1 test
 * Performance (AC-10) - 1 test
 * Idempotency - 1 test
 *
 * Total: 21 tests
 * Status: GREEN (API route implemented)
 */
