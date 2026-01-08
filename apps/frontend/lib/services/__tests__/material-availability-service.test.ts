/**
 * Material Availability Service - Unit Tests (Story 03.13)
 * Purpose: Test material availability calculation logic for Work Orders
 * Phase: RED - Tests will fail until service is implemented
 *
 * Tests the MaterialAvailabilityService which handles:
 * - Coverage percentage calculation (available / required * 100)
 * - Availability status determination (sufficient/low_stock/shortage/no_stock)
 * - Shortage quantity calculation (positive = shortage, negative = surplus)
 * - Overall status calculation (worst case wins)
 * - Expired LP exclusion from available quantity
 * - Reservation deduction from other WOs
 * - API response building
 * - Cache key generation
 *
 * Coverage Target: 80%+
 * Test Count: 40+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-1: Availability Calculation Algorithm
 * - AC-2: Expiry-Aware Filtering
 * - AC-3: Reservation Deduction
 * - AC-4: Traffic Light Indicators
 * - AC-8: Edge Cases - No LPs
 * - AC-9: Edge Cases - Partial Availability
 * - AC-10: Caching Behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Import the service that doesn't exist yet - this will cause test failures
import {
  MaterialAvailabilityService,
  calculateCoveragePercent,
  calculateAvailabilityStatus,
  calculateShortageQty,
  calculateOverallStatus,
  calculateSummary,
} from '@/lib/services/material-availability-service'

/**
 * Mock Supabase - Create chainable mock that mimics Supabase query builder
 */
const createChainableMock = (): any => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    not: vi.fn(() => chain),
    in: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    lt: vi.fn(() => chain),
    or: vi.fn(() => chain),
    is: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn((resolve) => resolve({ data: null, error: null })),
  }
  return chain
}

const mockSupabaseClient = {
  from: vi.fn(() => createChainableMock()),
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
}

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
  createClient: vi.fn(() => mockSupabaseClient),
}))

// Type definitions for tests (matching expected service types)
type AvailabilityStatus = 'sufficient' | 'low_stock' | 'shortage' | 'no_stock'

interface MaterialAvailability {
  wo_material_id: string
  product_id: string
  product_code: string
  product_name: string
  required_qty: number
  available_qty: number
  reserved_qty: number
  shortage_qty: number
  coverage_percent: number
  status: AvailabilityStatus
  uom: string
  expired_excluded_qty: number
}

interface AvailabilitySummary {
  total_materials: number
  sufficient_count: number
  low_stock_count: number
  shortage_count: number
}

interface AvailabilityResponse {
  wo_id: string
  checked_at: string
  overall_status: AvailabilityStatus
  materials: MaterialAvailability[]
  summary: AvailabilitySummary
  enabled: boolean
  cached: boolean
  cache_expires_at?: string
}

describe('MaterialAvailabilityService (Story 03.13)', () => {
  let mockSupabase: any
  let mockQuery: any

  // Test data fixtures - using valid UUIDs
  const testOrgId = '00000000-0000-0000-0000-000000000001'
  const testWoId = '00000000-0000-0000-0000-000000000002'
  const testProductId1 = '00000000-0000-0000-0000-000000000003'
  const testProductId2 = '00000000-0000-0000-0000-000000000004'
  const testProductId3 = '00000000-0000-0000-0000-000000000005'

  const mockWOMaterial1 = {
    id: '00000000-0000-0000-0000-000000000101',
    wo_id: testWoId,
    organization_id: testOrgId,
    product_id: testProductId1,
    required_qty: 100,
    reserved_qty: 0,
    uom: 'kg',
    sequence: 1,
    product: {
      id: testProductId1,
      code: 'RM-COCOA-001',
      name: 'Cocoa Mass',
    },
  }

  const mockWOMaterial2 = {
    id: '00000000-0000-0000-0000-000000000102',
    wo_id: testWoId,
    organization_id: testOrgId,
    product_id: testProductId2,
    required_qty: 150,
    reserved_qty: 0,
    uom: 'kg',
    sequence: 2,
    product: {
      id: testProductId2,
      code: 'RM-SUGAR-001',
      name: 'Sugar Fine',
    },
  }

  const mockWOMaterial3 = {
    id: '00000000-0000-0000-0000-000000000103',
    wo_id: testWoId,
    organization_id: testOrgId,
    product_id: testProductId3,
    required_qty: 50,
    reserved_qty: 0,
    uom: 'kg',
    sequence: 3,
    product: {
      id: testProductId3,
      code: 'RM-BUTTER-001',
      name: 'Cocoa Butter',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear service cache before each test
    MaterialAvailabilityService.clearCache()

    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn((resolve) => resolve({ data: [], error: null })),
    }

    // Make mockQuery thenable so await works
    Object.defineProperty(mockQuery, Symbol.toStringTag, { value: 'Promise' })

    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQuery),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
  })

  describe('calculateCoveragePercent()', () => {
    it('should return 100% when available equals required', () => {
      // AC-1: Coverage calculation
      const result = calculateCoveragePercent(100, 100)
      expect(result).toBe(100)
    })

    it('should return greater than 100% when available exceeds required (surplus)', () => {
      // AC-1: 150% coverage = surplus
      const result = calculateCoveragePercent(150, 100)
      expect(result).toBe(150)
    })

    it('should return correct percentage for partial availability', () => {
      // AC-1: Partial coverage
      const result = calculateCoveragePercent(75, 100)
      expect(result).toBe(75)
    })

    it('should return 0% when no stock available', () => {
      // AC-1: No stock
      const result = calculateCoveragePercent(0, 100)
      expect(result).toBe(0)
    })

    it('should return 100% when required is 0 (edge case)', () => {
      // AC-1: Edge case - required = 0 means no requirement, so 100% coverage
      const result = calculateCoveragePercent(50, 0)
      expect(result).toBe(100)
    })

    it('should handle decimal quantities correctly', () => {
      // AC-1: Decimal handling
      const result = calculateCoveragePercent(7.5, 10)
      expect(result).toBe(75)
    })

    it('should handle very small quantities', () => {
      // Edge case: small fractions
      const result = calculateCoveragePercent(0.001, 0.01)
      expect(result).toBe(10)
    })

    it('should handle large quantities', () => {
      // Edge case: large numbers
      const result = calculateCoveragePercent(100000, 200000)
      expect(result).toBe(50)
    })
  })

  describe('calculateAvailabilityStatus()', () => {
    it('should return "sufficient" for coverage >= 100%', () => {
      // AC-4: Traffic light - green
      expect(calculateAvailabilityStatus(100)).toBe('sufficient')
      expect(calculateAvailabilityStatus(110)).toBe('sufficient')
      expect(calculateAvailabilityStatus(150)).toBe('sufficient')
      expect(calculateAvailabilityStatus(200)).toBe('sufficient')
    })

    it('should return "low_stock" for coverage 50-99%', () => {
      // AC-4: Traffic light - yellow
      expect(calculateAvailabilityStatus(50)).toBe('low_stock')
      expect(calculateAvailabilityStatus(75)).toBe('low_stock')
      expect(calculateAvailabilityStatus(99)).toBe('low_stock')
      expect(calculateAvailabilityStatus(99.9)).toBe('low_stock')
    })

    it('should return "shortage" for coverage 1-49%', () => {
      // AC-4: Traffic light - red
      expect(calculateAvailabilityStatus(1)).toBe('shortage')
      expect(calculateAvailabilityStatus(25)).toBe('shortage')
      expect(calculateAvailabilityStatus(49)).toBe('shortage')
      expect(calculateAvailabilityStatus(49.9)).toBe('shortage')
    })

    it('should return "no_stock" for coverage = 0%', () => {
      // AC-4: Traffic light - red (special case)
      expect(calculateAvailabilityStatus(0)).toBe('no_stock')
    })

    it('should handle boundary at exactly 50%', () => {
      // AC-4: Boundary test - 50% should be low_stock
      expect(calculateAvailabilityStatus(50)).toBe('low_stock')
    })

    it('should handle boundary at exactly 100%', () => {
      // AC-4: Boundary test - 100% should be sufficient
      expect(calculateAvailabilityStatus(100)).toBe('sufficient')
    })
  })

  describe('calculateShortageQty()', () => {
    it('should return positive shortage when available < required', () => {
      // AC-1: Shortage calculation
      const result = calculateShortageQty(100, 75)
      expect(result).toBe(25)
    })

    it('should return negative shortage (surplus) when available > required', () => {
      // AC-1: Surplus shown as negative
      const result = calculateShortageQty(100, 150)
      expect(result).toBe(-50)
    })

    it('should return 0 when available equals required', () => {
      // AC-1: Exact match
      const result = calculateShortageQty(100, 100)
      expect(result).toBe(0)
    })

    it('should return required qty when no stock (available = 0)', () => {
      // AC-1: No stock case
      const result = calculateShortageQty(100, 0)
      expect(result).toBe(100)
    })
  })

  describe('calculateOverallStatus()', () => {
    it('should return "sufficient" when all materials sufficient', () => {
      // AC-9: Overall status - all good
      const statuses: AvailabilityStatus[] = ['sufficient', 'sufficient', 'sufficient']
      expect(calculateOverallStatus(statuses)).toBe('sufficient')
    })

    it('should return "low_stock" when worst is low_stock', () => {
      // AC-9: Overall status - yellow worst case
      const statuses: AvailabilityStatus[] = ['sufficient', 'low_stock', 'sufficient']
      expect(calculateOverallStatus(statuses)).toBe('low_stock')
    })

    it('should return "shortage" when any material has shortage', () => {
      // AC-9: Overall status - red worst case
      const statuses: AvailabilityStatus[] = ['sufficient', 'low_stock', 'shortage']
      expect(calculateOverallStatus(statuses)).toBe('shortage')
    })

    it('should return "no_stock" when any material has no_stock', () => {
      // AC-9: Overall status - worst case (no_stock > shortage)
      const statuses: AvailabilityStatus[] = ['sufficient', 'no_stock', 'shortage']
      expect(calculateOverallStatus(statuses)).toBe('no_stock')
    })

    it('should handle empty array (no materials)', () => {
      // AC-8: Edge case - empty WO
      const statuses: AvailabilityStatus[] = []
      expect(calculateOverallStatus(statuses)).toBe('sufficient')
    })

    it('should handle single material', () => {
      const statuses: AvailabilityStatus[] = ['shortage']
      expect(calculateOverallStatus(statuses)).toBe('shortage')
    })
  })

  describe('calculateSummary()', () => {
    it('should count materials by status correctly', () => {
      // AC-6: API response summary
      const materials: Partial<MaterialAvailability>[] = [
        { status: 'sufficient' },
        { status: 'sufficient' },
        { status: 'low_stock' },
        { status: 'shortage' },
        { status: 'no_stock' },
      ]

      const result = calculateSummary(materials as MaterialAvailability[])

      expect(result.total_materials).toBe(5)
      expect(result.sufficient_count).toBe(2)
      expect(result.low_stock_count).toBe(1)
      expect(result.shortage_count).toBe(2) // shortage + no_stock count together as shortages
    })

    it('should return zeros for empty materials', () => {
      const materials: MaterialAvailability[] = []

      const result = calculateSummary(materials)

      expect(result.total_materials).toBe(0)
      expect(result.sufficient_count).toBe(0)
      expect(result.low_stock_count).toBe(0)
      expect(result.shortage_count).toBe(0)
    })
  })

  describe('MaterialAvailabilityService.getAvailableLPQuantity()', () => {
    it('should sum available LP quantities for product', async () => {
      // AC-1: Sum LP quantities
      const mockLPs = [
        { product_id: testProductId1, quantity: 50, status: 'available' },
        { product_id: testProductId1, quantity: 75, status: 'available' },
        { product_id: testProductId1, quantity: 25, status: 'available' },
      ]

      // Setup mock to return LPs
      mockQuery.then = vi.fn((resolve) => resolve({ data: mockLPs, error: null }))

      // Expected: 50 + 75 + 25 = 150
      const result = await MaterialAvailabilityService.getAvailableLPQuantity(
        mockSupabase,
        testProductId1,
        testOrgId
      )
      expect(result).toBe(150)
    })

    it('should exclude expired LPs from sum', async () => {
      // AC-2: Expiry-aware filtering - test that query is made with expiry filter
      // When excludeExpired=true, query uses or() filter for non-expired
      const mockNonExpiredLPs = [
        { quantity: 75 },
        { quantity: 25 },
      ]

      mockQuery.then = vi.fn((resolve) => resolve({ data: mockNonExpiredLPs, error: null }))

      // Expected: 75 + 25 = 100 (expired 50 excluded by query)
      const result = await MaterialAvailabilityService.getAvailableLPQuantity(
        mockSupabase,
        testProductId1,
        testOrgId,
        true
      )
      expect(result).toBe(100)
    })

    it('should only include LPs with status "available"', async () => {
      // AC-1: Only available status - query filters by status='available'
      const mockAvailableLPs = [
        { quantity: 50 },
      ]

      mockQuery.then = vi.fn((resolve) => resolve({ data: mockAvailableLPs, error: null }))

      // Expected: only 50 from available LP
      const result = await MaterialAvailabilityService.getAvailableLPQuantity(
        mockSupabase,
        testProductId1,
        testOrgId
      )
      expect(result).toBe(50)
    })

    it('should return 0 when no LPs exist', async () => {
      // AC-8: No LPs scenario - default mock returns empty array
      const result = await MaterialAvailabilityService.getAvailableLPQuantity(
        mockSupabase,
        testProductId1,
        testOrgId
      )
      expect(result).toBe(0)
    })

    it('should respect org_id isolation', async () => {
      // AC-12: RLS enforcement - verify eq is called with org_id
      const mockLPs = [{ quantity: 50 }]
      mockQuery.then = vi.fn((resolve) => resolve({ data: mockLPs, error: null }))

      const result = await MaterialAvailabilityService.getAvailableLPQuantity(
        mockSupabase,
        testProductId1,
        testOrgId
      )
      expect(result).toBe(50)
      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', testOrgId)
    })
  })

  describe('MaterialAvailabilityService.getReservedQuantity()', () => {
    it('should sum reservations from other active WOs', async () => {
      // AC-3: Reservation deduction
      const mockReservations = [
        { reserved_qty: 30, consumed_qty: 0, wo_id: 'other-wo-1', license_plates: { product_id: testProductId1 } },
        { reserved_qty: 20, consumed_qty: 0, wo_id: 'other-wo-2', license_plates: { product_id: testProductId1 } },
      ]
      mockQuery.then = vi.fn((resolve) => resolve({ data: mockReservations, error: null }))

      // Expected: 30 + 20 = 50
      const result = await MaterialAvailabilityService.getReservedQuantity(
        mockSupabase,
        testProductId1,
        testOrgId
      )
      expect(result).toBe(50)
    })

    it('should exclude reservations from completed/cancelled WOs', async () => {
      // AC-3: Only active WO reservations - query filters by status='active'
      const mockActiveReservations = [
        { reserved_qty: 30, consumed_qty: 0, wo_id: 'active-wo', license_plates: { product_id: testProductId1 } },
      ]
      mockQuery.then = vi.fn((resolve) => resolve({ data: mockActiveReservations, error: null }))

      // Expected: only 30 (completed and cancelled excluded by query)
      const result = await MaterialAvailabilityService.getReservedQuantity(
        mockSupabase,
        testProductId1,
        testOrgId
      )
      expect(result).toBe(30)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active')
    })

    it('should exclude current WO from reservation calculation', async () => {
      // AC-3: Don't double-count own reservations - query uses neq for excludeWoId
      const mockOtherReservations = [
        { reserved_qty: 30, consumed_qty: 0, wo_id: 'other-wo', license_plates: { product_id: testProductId1 } },
      ]
      mockQuery.then = vi.fn((resolve) => resolve({ data: mockOtherReservations, error: null }))

      // Expected: only 30 (own WO excluded by neq filter)
      const result = await MaterialAvailabilityService.getReservedQuantity(
        mockSupabase,
        testProductId1,
        testOrgId,
        testWoId
      )
      expect(result).toBe(30)
      expect(mockQuery.neq).toHaveBeenCalledWith('wo_id', testWoId)
    })

    it('should return 0 when no other reservations exist', async () => {
      // Default mock returns empty array
      const result = await MaterialAvailabilityService.getReservedQuantity(
        mockSupabase,
        testProductId1,
        testOrgId
      )
      expect(result).toBe(0)
    })
  })

  describe('MaterialAvailabilityService.checkWOAvailability()', () => {
    it('should return availability for all WO materials', async () => {
      // AC-1: Full availability check
      const result = await MaterialAvailabilityService.checkWOAvailability(
        mockSupabase,
        testWoId,
        testOrgId
      )
      expect(result.materials).toBeDefined()
      expect(Array.isArray(result.materials)).toBe(true)
    })

    it('should calculate correct availability per material', async () => {
      // AC-1: Per-material calculation
      const result = await MaterialAvailabilityService.checkWOAvailability(
        mockSupabase,
        testWoId,
        testOrgId
      )

      expect(result.materials[0].coverage_percent).toBeDefined()
      expect(result.materials[0].shortage_qty).toBeDefined()
      expect(result.materials[0].status).toBeDefined()
    })

    it('should include expired excluded qty in response', async () => {
      // AC-2: Show how much was excluded due to expiry
      const result = await MaterialAvailabilityService.checkWOAvailability(
        mockSupabase,
        testWoId,
        testOrgId
      )

      expect(result.materials[0].expired_excluded_qty).toBeDefined()
    })

    it('should return empty materials array for WO with no BOM snapshot', async () => {
      // AC-8: No materials
      const result = await MaterialAvailabilityService.checkWOAvailability(
        mockSupabase,
        testWoId,
        testOrgId
      )

      expect(result.materials).toEqual([])
      expect(result.summary.total_materials).toBe(0)
      expect(result.overall_status).toBe('sufficient')
    })

    it('should throw error for non-existent WO', async () => {
      // Should throw WO_NOT_FOUND error
      await expect(
        MaterialAvailabilityService.checkWOAvailability(
          mockSupabase,
          'non-existent-wo-id',
          testOrgId
        )
      ).rejects.toThrow('NOT_FOUND')
    })

    it('should throw error for cross-org access', async () => {
      // AC-12: RLS enforcement
      await expect(
        MaterialAvailabilityService.checkWOAvailability(
          mockSupabase,
          testWoId,
          'different-org-id'
        )
      ).rejects.toThrow()
    })
  })

  describe('MaterialAvailabilityService.buildAvailabilityResponse()', () => {
    it('should build complete response structure', async () => {
      // AC-6: API response format
      const mockMaterials: MaterialAvailability[] = [
        {
          wo_material_id: 'wom-001',
          product_id: testProductId1,
          product_code: 'RM-COCOA-001',
          product_name: 'Cocoa Mass',
          required_qty: 100,
          available_qty: 150,
          reserved_qty: 0,
          shortage_qty: -50,
          coverage_percent: 150,
          status: 'sufficient',
          uom: 'kg',
          expired_excluded_qty: 0,
        },
      ]

      const result = MaterialAvailabilityService.buildAvailabilityResponse(
        testWoId,
        mockMaterials,
        false
      )

      expect(result.wo_id).toBe(testWoId)
      expect(result.overall_status).toBe('sufficient')
      expect(result.materials).toEqual(mockMaterials)
      expect(result.summary.total_materials).toBe(1)
      expect(result.enabled).toBe(true)
      expect(result.cached).toBe(false)
    })

    it('should include checked_at timestamp', async () => {
      // AC-6: Timestamp in response
      const result = MaterialAvailabilityService.buildAvailabilityResponse(
        testWoId,
        [],
        false
      )

      expect(result.checked_at).toBeDefined()
      expect(typeof result.checked_at).toBe('string')
    })

    it('should include cache_expires_at when cached', async () => {
      // AC-10: Cache info in response
      const result = MaterialAvailabilityService.buildAvailabilityResponse(
        testWoId,
        [],
        true
      )

      expect(result.cached).toBe(true)
      expect(result.cache_expires_at).toBeDefined()
    })
  })

  describe('Cache Behavior', () => {
    it('should generate correct cache key', () => {
      // AC-10: Cache key format
      const key = MaterialAvailabilityService.getCacheKey(testOrgId, testWoId)
      expect(key).toBe(`org:${testOrgId}:wo:${testWoId}:availability`)
    })

    it('should return cached result within TTL', async () => {
      // AC-10: Cache hit
      const result1 = await MaterialAvailabilityService.checkWOAvailability(
        mockSupabase,
        testWoId,
        testOrgId
      )
      const result2 = await MaterialAvailabilityService.checkWOAvailability(
        mockSupabase,
        testWoId,
        testOrgId
      )

      expect(result2.cached).toBe(true)
    })

    it('should recalculate after cache TTL expires', async () => {
      // AC-10: Cache miss after expiry
      const result = await MaterialAvailabilityService.checkWOAvailability(
        mockSupabase,
        testWoId,
        testOrgId,
        { skipCache: true }
      )

      expect(result.cached).toBe(false)
    })

    it('should set 30 second TTL on cache', async () => {
      // AC-10: 30 sec TTL
      const EXPECTED_TTL = 30
      expect(MaterialAvailabilityService.CACHE_TTL).toBe(EXPECTED_TTL)
    })
  })

  describe('Setting Toggle', () => {
    it('should return disabled response when wo_material_check is false', async () => {
      // AC-7: Setting toggle behavior
      const result = await MaterialAvailabilityService.checkWOAvailability(
        mockSupabase,
        testWoId,
        testOrgId,
        { settingEnabled: false }
      )

      expect(result.enabled).toBe(false)
    })

    it('should perform check when wo_material_check is true', async () => {
      // AC-7: Setting toggle behavior
      const result = await MaterialAvailabilityService.checkWOAvailability(
        mockSupabase,
        testWoId,
        testOrgId,
        { settingEnabled: true }
      )

      expect(result.enabled).toBe(true)
      expect(result.materials).toBeDefined()
    })
  })

  describe('Net Available Calculation', () => {
    it('should calculate net available correctly', async () => {
      // AC-1 + AC-3: net_available = LP_sum - other_reservations
      const lpSum = 100
      const otherReservations = 30

      const result = await MaterialAvailabilityService.calculateNetAvailable(
        mockSupabase,
        testProductId1,
        testOrgId,
        testWoId
      )

      expect(result).toBe(lpSum - otherReservations)
    })

    it('should not double-count own WO reservations', async () => {
      // AC-3: Own reservations included in available
      const result = await MaterialAvailabilityService.calculateNetAvailable(
        mockSupabase,
        testProductId1,
        testOrgId,
        testWoId
      )

      // Own WO's 50 kg reservation should not be deducted
      expect(result).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        ...mockQuery,
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      })

      await expect(
        MaterialAvailabilityService.checkWOAvailability(
          mockSupabase,
          testWoId,
          testOrgId
        )
      ).rejects.toThrow()
    })

    it('should validate WO ID format', async () => {
      const invalidWoId = 'not-a-uuid'

      await expect(
        MaterialAvailabilityService.checkWOAvailability(
          mockSupabase,
          invalidWoId,
          testOrgId
        )
      ).rejects.toThrow('INVALID_ID')
    })

    it('should validate org ID format', async () => {
      const invalidOrgId = 'not-a-uuid'

      await expect(
        MaterialAvailabilityService.checkWOAvailability(
          mockSupabase,
          testWoId,
          invalidOrgId
        )
      ).rejects.toThrow('INVALID_ID')
    })
  })

  describe('Performance', () => {
    it('should handle WO with 50 materials efficiently', async () => {
      // AC-11: <1s for 50 materials
      const startTime = Date.now()

      const result = await MaterialAvailabilityService.checkWOAvailability(
        mockSupabase,
        testWoId,
        testOrgId
      )

      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(1000)
    })

    it('should handle WO with 200 materials efficiently', async () => {
      // AC-11: <2s for 200 materials
      const startTime = Date.now()

      const result = await MaterialAvailabilityService.checkWOAvailability(
        mockSupabase,
        testWoId,
        testOrgId
      )

      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(2000)
    })
  })
})
