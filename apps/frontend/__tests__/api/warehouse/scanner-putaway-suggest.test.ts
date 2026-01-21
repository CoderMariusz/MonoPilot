/**
 * Scanner Putaway Suggest API Integration Tests (Story 05.21)
 * Phase: GREEN - Tests with working mock patterns
 *
 * Tests GET /api/warehouse/scanner/putaway/suggest/[lpId]
 *
 * Acceptance Criteria Coverage:
 * - AC-6: Location suggestion API returns suggestion with reason
 * - AC-2: Optimal location with reason (FIFO/FEFO/Zone)
 * - AC-9: FIFO/FEFO zone logic
 * - AC-11: RLS and security
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// =============================================================================
// Mock Data
// =============================================================================

const mockUser = {
  id: 'user-001',
  email: 'operator@test.com',
  org_id: 'org-001',
}

const mockLP = {
  id: 'lp-001',
  lp_number: 'LP00000001',
  product_id: 'prod-001',
  quantity: 100,
  uom: 'KG',
  expiry_date: '2025-12-31',
  status: 'available',
  qa_status: 'passed',
  location_id: 'loc-receiving',
  warehouse_id: 'wh-001',
  created_at: '2025-01-10T10:00:00Z',
  batch_number: 'BATCH-001',
  product: {
    name: 'Test Product',
    code: 'PROD-001',
    preferred_zone_id: 'zone-a',
  },
  location: {
    location_code: 'RECEIVING-01',
    full_path: 'Warehouse A / Receiving / RECEIVING-01',
  },
}

const mockSuggestedLocation = {
  id: 'loc-a01',
  location_code: 'A-01-02-03',
  name: 'Aisle A Rack 01 Level 02 Bin 03',
  zone_id: 'zone-a',
  zone_name: 'Cold Storage',
  full_path: 'Warehouse A / Zone Cold / A-01-02-03',
  aisle: 'A-01',
  rack: '02',
  level: '03',
}

const mockAlternatives = [
  { id: 'loc-a02', location_code: 'A-01-02-04', reason: 'Same zone, next available' },
  { id: 'loc-b01', location_code: 'B-01-01-01', reason: 'Alternative zone' },
]

// =============================================================================
// Shared mock state - exported to be accessible in module scope
// =============================================================================

let currentAuthResult: { data: { user: typeof mockUser | null }; error: Error | null } = {
  data: { user: mockUser },
  error: null,
}
let currentLPResult: { data: typeof mockLP | null; error: { code: string; message: string } | null } = {
  data: mockLP,
  error: null,
}

// Mock service function that can be reconfigured
let mockSuggestLocation = vi.fn()

// =============================================================================
// Mocks - Must be defined before imports
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
        if (table === 'users') return Promise.resolve({ data: { id: 'user-001', org_id: 'org-001' }, error: null })
        return Promise.resolve({ data: null, error: null })
      }),
    })),
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
        if (table === 'users') return Promise.resolve({ data: { id: 'user-001', org_id: 'org-001' }, error: null })
        return Promise.resolve({ data: null, error: null })
      }),
    })),
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
        if (table === 'users') return Promise.resolve({ data: { id: 'user-001', org_id: 'org-001' }, error: null })
        return Promise.resolve({ data: null, error: null })
      }),
    })),
  })),
}))

vi.mock('@/lib/services/scanner-putaway-service', () => ({
  ScannerPutawayService: {
    get suggestLocation() {
      return mockSuggestLocation
    },
  },
}))

// Import after mocks
import { GET } from '@/app/api/warehouse/scanner/putaway/suggest/[lpId]/route'

// =============================================================================
// Helper to Create Request
// =============================================================================

function createRequest(lpId: string): NextRequest {
  const url = new URL(`http://localhost:3000/api/warehouse/scanner/putaway/suggest/${lpId}`)
  return new NextRequest(url)
}

// =============================================================================
// Tests
// =============================================================================

describe('GET /api/warehouse/scanner/putaway/suggest/[lpId] (Story 05.21)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock state
    currentAuthResult = { data: { user: mockUser }, error: null }
    currentLPResult = { data: mockLP, error: null }
    // Reset mock service to default behavior
    mockSuggestLocation = vi.fn(() =>
      Promise.resolve({
        suggestedLocation: mockSuggestedLocation,
        reason: 'FIFO: Place near oldest stock of same product',
        reasonCode: 'fifo_zone',
        alternatives: mockAlternatives,
        strategyUsed: 'fifo',
        lpDetails: {
          lp_number: mockLP.lp_number,
          product_name: mockLP.product.name,
          quantity: mockLP.quantity,
          uom: mockLP.uom,
          expiry_date: mockLP.expiry_date,
          current_location: mockLP.location.full_path,
        },
      })
    )
  })

  // ===========================================================================
  // Happy Path - AC-6
  // ===========================================================================
  describe('Happy Path (AC-6)', () => {
    it('should return 200 OK with suggestion for valid LP', async () => {
      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.suggested_location).toBeDefined()
    })

    it('should include location code in response', async () => {
      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(data.suggested_location.location_code).toBe('A-01-02-03')
    })

    it('should include full_path in response', async () => {
      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(data.suggested_location.full_path).toMatch(/Warehouse.*Zone.*A-01-02-03/)
    })

    it('should include zone_name in response', async () => {
      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(data.suggested_location.zone_name).toBe('Cold Storage')
    })

    it('should include reason in response', async () => {
      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(data.reason).toMatch(/FIFO.*oldest/i)
    })

    it('should include reason_code in response', async () => {
      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(data.reason_code).toBe('fifo_zone')
    })

    it('should include alternatives in response', async () => {
      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(data.alternatives).toBeDefined()
      expect(Array.isArray(data.alternatives)).toBe(true)
      expect(data.alternatives.length).toBeGreaterThan(0)
    })

    it('should include strategy_used in response', async () => {
      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(data.strategy_used).toBe('fifo')
    })

    it('should include lp_details in response', async () => {
      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(data.lp_details).toBeDefined()
      expect(data.lp_details.lp_number).toBe('LP00000001')
      expect(data.lp_details.product_name).toBe('Test Product')
      expect(data.lp_details.quantity).toBe(100)
    })
  })

  // ===========================================================================
  // FIFO/FEFO Reasons - AC-2, AC-9
  // ===========================================================================
  describe('FIFO/FEFO Reasons (AC-2, AC-9)', () => {
    it('should return FIFO reason when enable_fifo=true', async () => {
      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(data.reason).toMatch(/FIFO/i)
      expect(data.strategy_used).toBe('fifo')
    })

    it('should return FEFO reason when enable_fefo=true', async () => {
      // Configure mock to return FEFO suggestion
      mockSuggestLocation = vi.fn(() =>
        Promise.resolve({
          suggestedLocation: mockSuggestedLocation,
          reason: 'FEFO: Place with similar expiry dates',
          reasonCode: 'fefo_zone',
          alternatives: mockAlternatives,
          strategyUsed: 'fefo',
          lpDetails: {
            lp_number: mockLP.lp_number,
            product_name: mockLP.product.name,
            quantity: mockLP.quantity,
            uom: mockLP.uom,
            expiry_date: mockLP.expiry_date,
            current_location: mockLP.location.full_path,
          },
        })
      )

      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(data.reason).toMatch(/FEFO/i)
      expect(data.strategy_used).toBe('fefo')
    })

    it('should return product zone reason when no existing stock', async () => {
      mockSuggestLocation = vi.fn(() =>
        Promise.resolve({
          suggestedLocation: mockSuggestedLocation,
          reason: 'Product preferred zone: Cold Storage',
          reasonCode: 'product_zone',
          alternatives: mockAlternatives,
          strategyUsed: 'fifo',
          lpDetails: {
            lp_number: mockLP.lp_number,
            product_name: mockLP.product.name,
            quantity: mockLP.quantity,
            uom: mockLP.uom,
            expiry_date: mockLP.expiry_date,
            current_location: mockLP.location.full_path,
          },
        })
      )

      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(data.reason_code).toBe('product_zone')
    })
  })

  // ===========================================================================
  // No Available Locations - AC-6
  // ===========================================================================
  describe('No Available Locations (AC-6)', () => {
    it('should return 200 with null suggested_location when no locations available', async () => {
      mockSuggestLocation = vi.fn(() =>
        Promise.resolve({
          suggestedLocation: null,
          reason: 'No available locations in preferred zone',
          reasonCode: 'no_preference',
          alternatives: mockAlternatives,
          strategyUsed: 'fifo',
          lpDetails: {
            lp_number: mockLP.lp_number,
            product_name: mockLP.product.name,
            quantity: mockLP.quantity,
            uom: mockLP.uom,
            expiry_date: mockLP.expiry_date,
            current_location: mockLP.location.full_path,
          },
        })
      )

      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.suggested_location).toBeNull()
      expect(data.reason).toMatch(/No available locations/i)
      expect(data.alternatives.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // Error Cases
  // ===========================================================================
  describe('Error Cases', () => {
    it('should return 401 when not authenticated', async () => {
      currentAuthResult = { data: { user: null }, error: new Error('Not authenticated') }

      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }

      const response = await GET(request, { params })

      expect(response.status).toBe(401)
    })

    it('should return 404 when LP not found', async () => {
      currentLPResult = { data: null, error: { code: 'PGRST116', message: 'LP not found' } }

      const request = createRequest('invalid-lp')
      const params = { lpId: 'invalid-lp' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toMatch(/LP not found/i)
    })

    it('should return 400 when LP status is not available', async () => {
      currentLPResult = { data: { ...mockLP, status: 'consumed' }, error: null }

      mockSuggestLocation = vi.fn(() =>
        Promise.reject(new Error('LP not available for putaway (status: consumed)'))
      )

      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toMatch(/not available/i)
    })

    it('should return 400 for invalid LP ID format', async () => {
      const request = createRequest('')
      const params = { lpId: '' }

      const response = await GET(request, { params })

      expect(response.status).toBe(400)
    })
  })

  // ===========================================================================
  // RLS and Security - AC-11
  // ===========================================================================
  describe('RLS and Security (AC-11)', () => {
    it('should return 404 when LP belongs to different org', async () => {
      // RLS will return null for LP not in user's org
      currentLPResult = { data: null, error: null }

      const request = createRequest('lp-other-org')
      const params = { lpId: 'lp-other-org' }

      const response = await GET(request, { params })

      expect(response.status).toBe(404)
    })

    it('should not expose any LP data for cross-org access', async () => {
      currentLPResult = { data: null, error: null }

      const request = createRequest('lp-other-org')
      const params = { lpId: 'lp-other-org' }

      const response = await GET(request, { params })
      const data = await response.json()

      // Should only return generic error, not LP details
      expect(data.lp_details).toBeUndefined()
      expect(data.suggested_location).toBeUndefined()
    })
  })

  // ===========================================================================
  // Performance - AC-10
  // ===========================================================================
  describe('Performance (AC-10)', () => {
    it('should respond within 300ms', async () => {
      const request = createRequest('lp-001')
      const params = { lpId: 'lp-001' }
      const start = Date.now()

      await GET(request, { params })

      const duration = Date.now() - start
      expect(duration).toBeLessThan(300)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Happy Path (AC-6) - 9 tests:
 *   - 200 OK response
 *   - Location code
 *   - Full path
 *   - Zone name
 *   - Reason
 *   - Reason code
 *   - Alternatives
 *   - Strategy used
 *   - LP details
 *
 * FIFO/FEFO Reasons (AC-2, AC-9) - 3 tests:
 *   - FIFO reason
 *   - FEFO reason
 *   - Product zone reason
 *
 * No Available Locations (AC-6) - 1 test
 *
 * Error Cases - 4 tests:
 *   - 401 unauthenticated
 *   - 404 LP not found
 *   - 400 LP not available
 *   - 400 invalid format
 *
 * RLS and Security (AC-11) - 2 tests
 * Performance (AC-10) - 1 test
 *
 * Total: 20 tests
 * Status: GREEN (API route implemented)
 */
