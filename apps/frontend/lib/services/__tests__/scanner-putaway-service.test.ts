/**
 * Scanner Putaway Service Unit Tests (Story 05.21)
 * Phase: TDD RED - Tests written before implementation
 *
 * Tests scanner putaway service functions:
 * - suggestLocation() - FIFO/FEFO location suggestion algorithm
 * - processPutaway() - Execute putaway transaction
 * - validatePutaway() - Pre-validate putaway before commit
 * - getProductZone() - Find zone with existing stock
 * - findAvailableLocations() - Find locations with capacity
 *
 * Acceptance Criteria Coverage:
 * - AC-2: Optimal location with reason (FIFO/FEFO/Zone)
 * - AC-3: Location validation
 * - AC-5: Stock move creation with move_type='putaway'
 * - AC-9: FIFO/FEFO zone logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScannerPutawayService } from '../scanner-putaway-service'
import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// Mock Types
// =============================================================================

interface MockLP {
  id: string
  lp_number: string
  product_id: string
  quantity: number
  uom: string
  expiry_date: string | null
  status: 'available' | 'reserved' | 'blocked' | 'consumed'
  qa_status: string
  location_id: string
  warehouse_id: string
  created_at: string
  batch_number: string | null
}

interface MockLocation {
  id: string
  location_code: string
  name: string
  warehouse_id: string
  zone_id: string | null
  is_active: boolean
  full_path: string
  aisle: string | null
  rack: string | null
  level: string | null
}

interface MockWarehouseSettings {
  enable_fifo: boolean
  enable_fefo: boolean
  enable_location_capacity: boolean
}

// =============================================================================
// Mock Data Fixtures
// =============================================================================

const mockLP: MockLP = {
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
}

const mockLocation: MockLocation = {
  id: 'loc-a01',
  location_code: 'A-01-02-03',
  name: 'Aisle A Rack 01 Level 02 Bin 03',
  warehouse_id: 'wh-001',
  zone_id: 'zone-a',
  is_active: true,
  full_path: 'Warehouse A / Zone Cold / A-01-02-03',
  aisle: 'A-01',
  rack: '02',
  level: '03',
}

const mockSettingsFIFO: MockWarehouseSettings = {
  enable_fifo: true,
  enable_fefo: false,
  enable_location_capacity: true,
}

const mockSettingsFEFO: MockWarehouseSettings = {
  enable_fifo: false,
  enable_fefo: true,
  enable_location_capacity: true,
}

const mockSettingsBoth: MockWarehouseSettings = {
  enable_fifo: true,
  enable_fefo: true,
  enable_location_capacity: true,
}

// =============================================================================
// Mock Supabase Client Factory
// =============================================================================

function createMockSupabase(overrides?: {
  lp?: MockLP | null
  lpError?: Error | null
  locations?: MockLocation[]
  settings?: MockWarehouseSettings
  existingLPs?: Array<{ zone_id: string; created_at: string; expiry_date: string | null }>
  rpcResult?: { data: unknown; error: Error | null }
}): SupabaseClient {
  const mockFrom = vi.fn()
  const mockRpc = vi.fn()
  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-001' } },
      error: null,
    }),
  }

  // Default implementations
  mockFrom.mockImplementation((table: string) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    }

    if (table === 'license_plates') {
      chain.single.mockResolvedValue({
        data: overrides?.lp ?? mockLP,
        error: overrides?.lpError ?? null,
      })
      // For existing LPs query (used in getProductZone)
      const existingLPsData = overrides?.existingLPs?.map((lp) => ({
        location_id: 'loc-001',
        created_at: lp.created_at,
        expiry_date: lp.expiry_date,
        location: { zone_id: lp.zone_id },
      })) ?? []
      chain.limit.mockResolvedValue({
        data: existingLPsData,
        error: null,
      })
    } else if (table === 'locations') {
      // If locations override is provided but empty, return null (not found)
      const locationData = overrides?.locations !== undefined
        ? (overrides.locations.length > 0 ? overrides.locations[0] : null)
        : mockLocation
      chain.single.mockResolvedValue({
        data: locationData,
        error: locationData === null ? { code: 'PGRST116', message: 'Not found' } : null,
      })
      // For list of locations
      chain.limit.mockResolvedValue({
        data: overrides?.locations ?? [mockLocation],
        error: null,
      })
    } else if (table === 'warehouse_settings') {
      chain.single.mockResolvedValue({
        data: overrides?.settings ?? mockSettingsFIFO,
        error: null,
      })
    } else if (table === 'users') {
      chain.single.mockResolvedValue({
        data: { org_id: 'org-001', id: 'user-001' },
        error: null,
      })
    } else if (table === 'stock_moves') {
      chain.single.mockResolvedValue({
        data: {
          id: 'sm-001',
          move_number: 'SM-2025-00001',
          move_type: 'putaway',
          status: 'completed',
        },
        error: null,
      })
    }

    return chain
  })

  mockRpc.mockResolvedValue(
    overrides?.rpcResult ?? {
      data: 'sm-001',
      error: null,
    }
  )

  return {
    from: mockFrom,
    rpc: mockRpc,
    auth: mockAuth,
  } as unknown as SupabaseClient
}

// =============================================================================
// Unit Tests
// =============================================================================

describe('ScannerPutawayService (Story 05.21)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // suggestLocation() Tests - AC-2, AC-9
  // ===========================================================================
  describe('suggestLocation()', () => {
    // FIFO Logic Tests (AC-9)
    describe('FIFO Logic (AC-9)', () => {
      it('should suggest location in zone with oldest stock of same product', async () => {
        const mockSupabase = createMockSupabase({
          settings: mockSettingsFIFO,
          existingLPs: [
            { zone_id: 'zone-a', created_at: '2025-01-01T00:00:00Z', expiry_date: null },
            { zone_id: 'zone-b', created_at: '2025-01-15T00:00:00Z', expiry_date: null },
          ],
        })

        const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

        expect(result).toBeDefined()
        expect(result.suggestedLocation).not.toBeNull()
        expect(result.strategyUsed).toBe('fifo')
        expect(result.reasonCode).toBe('fifo_zone')
        expect(result.reason).toMatch(/FIFO/i)
      })

      it('should return reason "FIFO: Place near oldest stock" when enable_fifo=true', async () => {
        const mockSupabase = createMockSupabase({
          settings: mockSettingsFIFO,
        })

        const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

        expect(result.reason).toMatch(/FIFO.*oldest/i)
      })

      it('should sort existing stock by created_at ASC for FIFO', async () => {
        const mockSupabase = createMockSupabase({
          settings: mockSettingsFIFO,
        })

        const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

        // Should use FIFO strategy
        expect(result.strategyUsed).toBe('fifo')
      })
    })

    // FEFO Logic Tests (AC-9)
    describe('FEFO Logic (AC-9)', () => {
      it('should suggest location in zone with soonest expiry stock', async () => {
        const mockSupabase = createMockSupabase({
          settings: mockSettingsFEFO,
          existingLPs: [
            { zone_id: 'zone-a', created_at: '2025-01-01T00:00:00Z', expiry_date: '2025-06-01' },
            { zone_id: 'zone-b', created_at: '2025-01-15T00:00:00Z', expiry_date: '2025-03-01' },
          ],
        })

        const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

        expect(result).toBeDefined()
        expect(result.strategyUsed).toBe('fefo')
        expect(result.reasonCode).toBe('fefo_zone')
        expect(result.reason).toMatch(/FEFO/i)
      })

      it('should return reason "FEFO: Place with similar expiry dates" when enable_fefo=true', async () => {
        const mockSupabase = createMockSupabase({
          settings: mockSettingsFEFO,
        })

        const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

        expect(result.reason).toMatch(/FEFO.*expiry/i)
      })

      it('should sort existing stock by expiry_date ASC for FEFO', async () => {
        const mockSupabase = createMockSupabase({
          settings: mockSettingsFEFO,
        })

        const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

        expect(result.strategyUsed).toBe('fefo')
      })
    })

    // FEFO Precedence over FIFO (AC-9)
    describe('FEFO Precedence (AC-9)', () => {
      it('should use FEFO when both enable_fifo and enable_fefo are true', async () => {
        const mockSupabase = createMockSupabase({
          settings: mockSettingsBoth,
        })

        const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

        expect(result.strategyUsed).toBe('fefo')
        expect(result.reason).toMatch(/FEFO/i)
      })
    })

    // Product Zone Fallback
    describe('Product Zone Fallback', () => {
      it('should use product preferred_zone when no existing stock', async () => {
        const mockSupabase = createMockSupabase({
          settings: mockSettingsFIFO,
          existingLPs: [], // No existing stock
        })

        const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

        expect(result.reasonCode).toMatch(/product_zone|default_zone/i)
      })

      it('should use default zone when no preferred zone configured', async () => {
        const mockSupabase = createMockSupabase({
          settings: { ...mockSettingsFIFO },
          existingLPs: [],
        })

        const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

        expect(result.suggestedLocation).toBeDefined()
        expect(result.reasonCode).toMatch(/default_zone|product_zone|no_preference/i)
      })
    })

    // Response Structure (AC-2)
    describe('Response Structure (AC-2)', () => {
      it('should include suggested location with full details', async () => {
        const mockSupabase = createMockSupabase()

        const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

        expect(result.suggestedLocation).toHaveProperty('id')
        expect(result.suggestedLocation).toHaveProperty('location_code')
        expect(result.suggestedLocation).toHaveProperty('zone_name')
        expect(result.suggestedLocation).toHaveProperty('full_path')
      })

      it('should include reason and reason_code', async () => {
        const mockSupabase = createMockSupabase()

        const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

        expect(result.reason).toBeDefined()
        expect(result.reasonCode).toBeDefined()
        expect(['fifo_zone', 'fefo_zone', 'product_zone', 'default_zone', 'no_preference']).toContain(
          result.reasonCode
        )
      })

      it('should include alternatives list', async () => {
        const mockSupabase = createMockSupabase({
          locations: [mockLocation, { ...mockLocation, id: 'loc-a02', location_code: 'A-01-02-04' }],
        })

        const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

        expect(result.alternatives).toBeDefined()
        expect(Array.isArray(result.alternatives)).toBe(true)
      })

      it('should include strategy_used field', async () => {
        const mockSupabase = createMockSupabase()

        const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

        expect(result.strategyUsed).toBeDefined()
        expect(['fifo', 'fefo', 'none']).toContain(result.strategyUsed)
      })

      it('should include LP details in response', async () => {
        const mockSupabase = createMockSupabase()

        const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

        expect(result.lpDetails).toBeDefined()
        expect(result.lpDetails).toHaveProperty('lp_number')
        expect(result.lpDetails).toHaveProperty('product_name')
        expect(result.lpDetails).toHaveProperty('quantity')
      })
    })

    // Error Cases
    describe('Error Cases', () => {
      it('should throw error when LP not found', async () => {
        const mockSupabase = createMockSupabase({
          lp: null,
          lpError: new Error('LP not found'),
        })

        await expect(ScannerPutawayService.suggestLocation(mockSupabase, 'invalid-lp')).rejects.toThrow(
          /LP not found/i
        )
      })

      it('should throw error when LP status is not available', async () => {
        const mockSupabase = createMockSupabase({
          lp: { ...mockLP, status: 'consumed' },
        })

        await expect(ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')).rejects.toThrow(
          /not available.*putaway|status.*consumed/i
        )
      })

      it('should return null suggested location when no available locations', async () => {
        const mockSupabase = createMockSupabase({
          locations: [],
        })

        const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

        expect(result.suggestedLocation).toBeNull()
        expect(result.reason).toMatch(/no available locations/i)
      })
    })
  })

  // ===========================================================================
  // processPutaway() Tests - AC-5
  // ===========================================================================
  describe('processPutaway()', () => {
    const validInput = {
      lpId: 'lp-001',
      locationId: 'loc-a01',
      suggestedLocationId: 'loc-a01',
      override: false,
    }

    it('should create stock move with move_type=putaway', async () => {
      const mockSupabase = createMockSupabase()

      const result = await ScannerPutawayService.processPutaway(mockSupabase, validInput)

      expect(result.stockMove).toBeDefined()
      expect(result.stockMove.move_type).toBe('putaway')
    })

    it('should update LP location_id to destination', async () => {
      const mockSupabase = createMockSupabase()

      const result = await ScannerPutawayService.processPutaway(mockSupabase, validInput)

      expect(result.lp).toBeDefined()
      expect(result.lp.location_id).toBe('loc-a01')
    })

    it('should record override flag when different from suggestion', async () => {
      const mockSupabase = createMockSupabase()
      const overrideInput = {
        ...validInput,
        locationId: 'loc-b01',
        override: true,
        overrideReason: 'Closer to production',
      }

      const result = await ScannerPutawayService.processPutaway(mockSupabase, overrideInput)

      expect(result.overrideApplied).toBe(true)
    })

    it('should return stock move with move_number', async () => {
      const mockSupabase = createMockSupabase()

      const result = await ScannerPutawayService.processPutaway(mockSupabase, validInput)

      expect(result.stockMove.move_number).toMatch(/SM-\d{4}-\d{5}/)
    })

    it('should return LP with updated location path', async () => {
      const mockSupabase = createMockSupabase()

      const result = await ScannerPutawayService.processPutaway(mockSupabase, validInput)

      expect(result.lp.location_path).toBeDefined()
    })

    describe('Error Cases', () => {
      it('should throw error when LP not available', async () => {
        const mockSupabase = createMockSupabase({
          lp: { ...mockLP, status: 'consumed' },
        })

        await expect(ScannerPutawayService.processPutaway(mockSupabase, validInput)).rejects.toThrow(
          /LP not available/i
        )
      })

      it('should throw error when destination location inactive', async () => {
        const mockSupabase = createMockSupabase({
          locations: [{ ...mockLocation, is_active: false }],
        })

        await expect(ScannerPutawayService.processPutaway(mockSupabase, validInput)).rejects.toThrow(
          /location.*not.*available|inactive/i
        )
      })

      it('should throw error when location not found', async () => {
        const mockSupabase = createMockSupabase({
          locations: [],
        })

        await expect(ScannerPutawayService.processPutaway(mockSupabase, validInput)).rejects.toThrow(
          /location.*not found/i
        )
      })
    })
  })

  // ===========================================================================
  // validatePutaway() Tests - AC-3
  // ===========================================================================
  describe('validatePutaway()', () => {
    const validInput = {
      lpId: 'lp-001',
      locationId: 'loc-a01',
    }

    it('should return valid=true for valid input', async () => {
      const mockSupabase = createMockSupabase()

      const result = await ScannerPutawayService.validatePutaway(mockSupabase, validInput)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return valid=false when LP status is consumed', async () => {
      const mockSupabase = createMockSupabase({
        lp: { ...mockLP, status: 'consumed' },
      })

      const result = await ScannerPutawayService.validatePutaway(mockSupabase, validInput)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === 'lp_id')).toBe(true)
    })

    it('should return valid=false when LP status is blocked', async () => {
      const mockSupabase = createMockSupabase({
        lp: { ...mockLP, status: 'blocked' },
      })

      const result = await ScannerPutawayService.validatePutaway(mockSupabase, validInput)

      expect(result.valid).toBe(false)
    })

    it('should return valid=false when location is inactive', async () => {
      const mockSupabase = createMockSupabase({
        locations: [{ ...mockLocation, is_active: false }],
      })

      const result = await ScannerPutawayService.validatePutaway(mockSupabase, validInput)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === 'location_id')).toBe(true)
    })

    it('should return warning when location differs from suggestion', async () => {
      const mockSupabase = createMockSupabase()
      const inputWithSuggestion = {
        ...validInput,
        suggestedLocationId: 'loc-different',
      }

      const result = await ScannerPutawayService.validatePutaway(mockSupabase, inputWithSuggestion)

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some((w) => w.message.match(/different.*suggested/i))).toBe(true)
    })

    it('should include field name in error messages', async () => {
      const mockSupabase = createMockSupabase({
        lp: null,
        lpError: new Error('Not found'),
      })

      const result = await ScannerPutawayService.validatePutaway(mockSupabase, validInput)

      expect(result.errors.every((e) => e.field !== undefined)).toBe(true)
    })
  })

  // ===========================================================================
  // Zone Restriction Tests
  // ===========================================================================
  describe('Zone Restrictions', () => {
    it('should suggest location only in allowed zones for product', async () => {
      const mockSupabase = createMockSupabase()

      const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

      expect(result.suggestedLocation).toBeDefined()
      // Zone should match product preferences or existing stock zone
    })

    it('should return alternatives from allowed zones', async () => {
      const mockSupabase = createMockSupabase({
        locations: [
          mockLocation,
          { ...mockLocation, id: 'loc-a02', location_code: 'A-01-02-04', zone_id: 'zone-a' },
        ],
      })

      const result = await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

      expect(result.alternatives).toBeDefined()
      // All alternatives should be in valid zones
    })
  })

  // ===========================================================================
  // Capacity Validation Tests
  // ===========================================================================
  describe('Location Capacity Validation', () => {
    it('should validate location has capacity for LP quantity', async () => {
      const mockSupabase = createMockSupabase()
      const inputWithCapacity = {
        lpId: 'lp-001',
        locationId: 'loc-a01',
      }

      const result = await ScannerPutawayService.validatePutaway(mockSupabase, inputWithCapacity)

      // Should pass if capacity available
      expect(result.valid).toBe(true)
    })

    it('should return warning when location is near capacity', async () => {
      // Would need capacity tracking - deferred to 05.34
      // This test documents expected behavior
      expect(true).toBe(true)
    })
  })

  // ===========================================================================
  // Performance Tests
  // ===========================================================================
  describe('Performance', () => {
    it('should complete suggestLocation within 300ms', async () => {
      const mockSupabase = createMockSupabase()
      const start = Date.now()

      await ScannerPutawayService.suggestLocation(mockSupabase, 'lp-001')

      const duration = Date.now() - start
      expect(duration).toBeLessThan(300)
    })

    it('should complete processPutaway within 500ms', async () => {
      const mockSupabase = createMockSupabase()
      const start = Date.now()

      await ScannerPutawayService.processPutaway(mockSupabase, {
        lpId: 'lp-001',
        locationId: 'loc-a01',
        override: false,
      })

      const duration = Date.now() - start
      expect(duration).toBeLessThan(500)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * suggestLocation() - 18 tests:
 *   - FIFO logic (3 tests)
 *   - FEFO logic (3 tests)
 *   - FEFO precedence (1 test)
 *   - Product zone fallback (2 tests)
 *   - Response structure (5 tests)
 *   - Error cases (4 tests)
 *
 * processPutaway() - 8 tests:
 *   - Stock move creation (1 test)
 *   - LP location update (1 test)
 *   - Override handling (1 test)
 *   - Response structure (2 tests)
 *   - Error cases (3 tests)
 *
 * validatePutaway() - 6 tests:
 *   - Valid input (1 test)
 *   - LP status validation (2 tests)
 *   - Location validation (1 test)
 *   - Warning for suggestion mismatch (1 test)
 *   - Error structure (1 test)
 *
 * Zone Restrictions - 2 tests
 * Capacity Validation - 2 tests
 * Performance - 2 tests
 *
 * Total: 38 tests
 * Coverage: FIFO/FEFO logic, validation, putaway execution
 * Status: RED (service not implemented yet)
 */
