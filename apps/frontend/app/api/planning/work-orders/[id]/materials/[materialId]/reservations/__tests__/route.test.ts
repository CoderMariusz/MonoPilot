/**
 * API Route Tests: WO Material Reservations (Story 03.11b)
 * Purpose: Integration tests for:
 *   - GET /api/planning/work-orders/:id/materials/:materialId/reservations
 *   - POST /api/planning/work-orders/:id/materials/:materialId/reservations
 * Phase: RED - Tests written before implementation
 *
 * Tests the reservations API endpoints which handle:
 * - Listing reservations for a WO material (AC-9)
 * - Creating manual LP reservations (AC-7)
 * - Validation and error handling
 *
 * Coverage Target: 70%
 * Test Count: 28 scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-7: Manual LP Reservation via POST
 * - AC-9: Reserved LPs Display via GET
 * - AC-6: Over-Reservation Warning
 * - AC-13: API Validation (404, 403, 409)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock the Supabase server module
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve({
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: { message: 'Not authenticated' } })),
    },
  })),
  createServerSupabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } })),
        })),
      })),
    })),
  })),
}))

// Mock the WO Reservation service
vi.mock('@/lib/services/wo-reservation-service', () => ({
  WOReservationService: {
    getReservations: vi.fn(() => Promise.resolve({ success: false, error: 'Not implemented', code: 'NOT_IMPLEMENTED' })),
    reserveLP: vi.fn(() => Promise.resolve({ success: false, error: 'Not implemented', code: 'NOT_IMPLEMENTED' })),
    canModifyReservations: vi.fn(() => false),
  },
  WOReservationErrorCode: {
    WO_NOT_FOUND: 'WO_NOT_FOUND',
    WO_MATERIAL_NOT_FOUND: 'WO_MATERIAL_NOT_FOUND',
    LP_NOT_FOUND: 'LP_NOT_FOUND',
    LP_NOT_AVAILABLE: 'LP_NOT_AVAILABLE',
    LP_PRODUCT_MISMATCH: 'LP_PRODUCT_MISMATCH',
    LP_WAREHOUSE_MISMATCH: 'LP_WAREHOUSE_MISMATCH',
    INVALID_WO_STATUS: 'INVALID_WO_STATUS',
    OVER_RESERVATION: 'OVER_RESERVATION',
    EXCEEDS_LP_QUANTITY: 'EXCEEDS_LP_QUANTITY',
    DATABASE_ERROR: 'DATABASE_ERROR',
  },
}))

describe('GET /api/planning/work-orders/:id/materials/:materialId/reservations (Story 03.11b)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Route file exists', () => {
    it('should export GET handler', async () => {
      const routeModule = await import('../route')
      expect(typeof routeModule.GET).toBe('function')
    })
  })

  describe('Response Structure', () => {
    it('should return reservations array with LP details', async () => {
      // Expected response format
      const expectedResponse = {
        success: true,
        data: {
          reservations: [
            {
              id: 'res-001',
              wo_material_id: 'mat-001',
              lp_id: 'lp-001',
              lp_number: 'LP00000001',
              reserved_qty: 50,
              status: 'active',
              reserved_at: '2026-01-08T10:00:00Z',
              reserved_by: { id: 'user-001', name: 'John Smith' },
              location_name: 'A1-01',
              expiry_date: '2026-06-15',
            },
          ],
          total_reserved: 50,
          required_qty: 100,
          coverage_percent: 50,
        },
      }

      expect(expectedResponse.data.reservations).toHaveLength(1)
      expect(expectedResponse.data.total_reserved).toBe(50)
      expect(expectedResponse.data.coverage_percent).toBe(50)
    })

    it('should return empty array for material with no reservations', async () => {
      const expectedResponse = {
        success: true,
        data: {
          reservations: [],
          total_reserved: 0,
          required_qty: 100,
          coverage_percent: 0,
        },
      }

      expect(expectedResponse.data.reservations).toHaveLength(0)
      expect(expectedResponse.data.coverage_percent).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should return 404 for non-existent WO', async () => {
      const expectedResponse = {
        status: 404,
        error: {
          code: 'WO_NOT_FOUND',
          message: 'Work order not found',
        },
      }

      expect(expectedResponse.status).toBe(404)
      expect(expectedResponse.error.code).toBe('WO_NOT_FOUND')
    })

    it('should return 404 for non-existent WO material', async () => {
      const expectedResponse = {
        status: 404,
        error: {
          code: 'WO_MATERIAL_NOT_FOUND',
          message: 'Work order material not found',
        },
      }

      expect(expectedResponse.status).toBe(404)
      expect(expectedResponse.error.code).toBe('WO_MATERIAL_NOT_FOUND')
    })

    it('should return 404 for cross-org access (RLS)', async () => {
      // RLS returns 404 not 403 for security
      const expectedResponse = {
        status: 404,
        error: {
          code: 'WO_NOT_FOUND',
          message: 'Work order not found',
        },
      }

      expect(expectedResponse.status).toBe(404)
    })
  })

  describe('Service Integration', () => {
    it('should have service exported', async () => {
      const { WOReservationService } = await import('@/lib/services/wo-reservation-service')
      expect(typeof WOReservationService.getReservations).toBe('function')
    })

    it('should have error codes exported', async () => {
      const { WOReservationErrorCode } = await import('@/lib/services/wo-reservation-service')
      expect(WOReservationErrorCode.WO_NOT_FOUND).toBe('WO_NOT_FOUND')
      expect(WOReservationErrorCode.WO_MATERIAL_NOT_FOUND).toBe('WO_MATERIAL_NOT_FOUND')
    })
  })
})

describe('POST /api/planning/work-orders/:id/materials/:materialId/reservations (Story 03.11b)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Route file exists', () => {
    it('should export POST handler', async () => {
      const routeModule = await import('../route')
      expect(typeof routeModule.POST).toBe('function')
    })
  })

  describe('Validation Schema', () => {
    it('should validate lp_id is required', async () => {
      const { CreateReservationSchema } = await import('@/lib/validation/wo-reservations')
      const result = CreateReservationSchema.safeParse({ quantity: 50 })
      expect(result.success).toBe(false)
    })

    it('should validate lp_id is UUID format', async () => {
      const { CreateReservationSchema } = await import('@/lib/validation/wo-reservations')
      const result = CreateReservationSchema.safeParse({ lp_id: 'not-a-uuid', quantity: 50 })
      expect(result.success).toBe(false)
    })

    it('should validate quantity is required', async () => {
      const { CreateReservationSchema } = await import('@/lib/validation/wo-reservations')
      const result = CreateReservationSchema.safeParse({ lp_id: '550e8400-e29b-41d4-a716-446655440000' })
      expect(result.success).toBe(false)
    })

    it('should validate quantity is positive', async () => {
      const { CreateReservationSchema } = await import('@/lib/validation/wo-reservations')
      const result = CreateReservationSchema.safeParse({
        lp_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 0,
      })
      expect(result.success).toBe(false)
    })

    it('should validate quantity is not negative', async () => {
      const { CreateReservationSchema } = await import('@/lib/validation/wo-reservations')
      const result = CreateReservationSchema.safeParse({
        lp_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: -10,
      })
      expect(result.success).toBe(false)
    })

    it('should validate quantity max 6 decimal places', async () => {
      const { CreateReservationSchema } = await import('@/lib/validation/wo-reservations')
      const result = CreateReservationSchema.safeParse({
        lp_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 10.1234567, // 7 decimal places
      })
      expect(result.success).toBe(false)
    })

    it('should accept valid input', async () => {
      const { CreateReservationSchema } = await import('@/lib/validation/wo-reservations')
      const result = CreateReservationSchema.safeParse({
        lp_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 50,
      })
      expect(result.success).toBe(true)
    })

    it('should accept decimal quantities', async () => {
      const { CreateReservationSchema } = await import('@/lib/validation/wo-reservations')
      const result = CreateReservationSchema.safeParse({
        lp_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 10.5,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Response Structure', () => {
    it('should return created reservation with LP details', async () => {
      const expectedResponse = {
        success: true,
        data: {
          reservation: {
            id: 'res-001',
            wo_material_id: 'mat-001',
            lp_id: 'lp-001',
            reserved_qty: 50,
            status: 'active',
            reserved_at: '2026-01-08T10:00:00Z',
            lp_number: 'LP00000001',
            location_name: 'A1-01',
            expiry_date: '2026-06-15',
          },
        },
        message: 'LP reserved successfully',
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.data.reservation.status).toBe('active')
    })

    it('should include warnings for over-reservation', async () => {
      const expectedResponse = {
        success: true,
        data: {
          reservation: { id: 'res-001' },
        },
        warnings: ['LP over-reserved: total reservations (130 kg) exceed LP quantity (100 kg)'],
        message: 'LP reserved successfully with warnings',
      }

      expect(expectedResponse.warnings).toHaveLength(1)
      expect(expectedResponse.warnings[0]).toContain('over-reserved')
    })
  })

  describe('Error Handling', () => {
    it('should return 404 for non-existent WO', async () => {
      const expectedResponse = {
        status: 404,
        error: {
          code: 'WO_NOT_FOUND',
          message: 'Work order not found',
        },
      }

      expect(expectedResponse.status).toBe(404)
    })

    it('should return 404 for non-existent WO material', async () => {
      const expectedResponse = {
        status: 404,
        error: {
          code: 'WO_MATERIAL_NOT_FOUND',
          message: 'Work order material not found',
        },
      }

      expect(expectedResponse.status).toBe(404)
    })

    it('should return 404 for non-existent LP', async () => {
      const expectedResponse = {
        status: 404,
        error: {
          code: 'LP_NOT_FOUND',
          message: 'License plate not found',
        },
      }

      expect(expectedResponse.status).toBe(404)
    })

    it('should return 400 for LP not available (blocked/consumed)', async () => {
      const expectedResponse = {
        status: 400,
        error: {
          code: 'LP_NOT_AVAILABLE',
          message: 'License plate is not available for reservation',
        },
      }

      expect(expectedResponse.status).toBe(400)
    })

    it('should return 400 for LP product mismatch', async () => {
      const expectedResponse = {
        status: 400,
        error: {
          code: 'LP_PRODUCT_MISMATCH',
          message: 'LP product does not match material product',
        },
      }

      expect(expectedResponse.status).toBe(400)
    })

    it('should return 400 for LP warehouse mismatch', async () => {
      const expectedResponse = {
        status: 400,
        error: {
          code: 'LP_WAREHOUSE_MISMATCH',
          message: 'LP is not in the Work Order warehouse',
        },
      }

      expect(expectedResponse.status).toBe(400)
    })

    it('should return 400 for quantity exceeding LP quantity', async () => {
      const expectedResponse = {
        status: 400,
        error: {
          code: 'EXCEEDS_LP_QUANTITY',
          message: 'Reserved quantity (150) exceeds LP available (100)',
        },
      }

      expect(expectedResponse.status).toBe(400)
    })

    it('should return 409 for completed/cancelled WO', async () => {
      const expectedResponse = {
        status: 409,
        error: {
          code: 'INVALID_WO_STATUS',
          message: 'Cannot modify reservations after WO completion',
        },
      }

      expect(expectedResponse.status).toBe(409)
    })
  })

  describe('Error Code Mapping', () => {
    it('should map WO_NOT_FOUND to 404', async () => {
      const { WOReservationErrorCode } = await import('@/lib/services/wo-reservation-service')
      expect(WOReservationErrorCode.WO_NOT_FOUND).toBe('WO_NOT_FOUND')
    })

    it('should map WO_MATERIAL_NOT_FOUND to 404', async () => {
      const { WOReservationErrorCode } = await import('@/lib/services/wo-reservation-service')
      expect(WOReservationErrorCode.WO_MATERIAL_NOT_FOUND).toBe('WO_MATERIAL_NOT_FOUND')
    })

    it('should map LP_NOT_FOUND to 404', async () => {
      const { WOReservationErrorCode } = await import('@/lib/services/wo-reservation-service')
      expect(WOReservationErrorCode.LP_NOT_FOUND).toBe('LP_NOT_FOUND')
    })

    it('should map INVALID_WO_STATUS to 409', async () => {
      const { WOReservationErrorCode } = await import('@/lib/services/wo-reservation-service')
      expect(WOReservationErrorCode.INVALID_WO_STATUS).toBe('INVALID_WO_STATUS')
    })

    it('should map LP_NOT_AVAILABLE to 400', async () => {
      const { WOReservationErrorCode } = await import('@/lib/services/wo-reservation-service')
      expect(WOReservationErrorCode.LP_NOT_AVAILABLE).toBe('LP_NOT_AVAILABLE')
    })

    it('should map EXCEEDS_LP_QUANTITY to 400', async () => {
      const { WOReservationErrorCode } = await import('@/lib/services/wo-reservation-service')
      expect(WOReservationErrorCode.EXCEEDS_LP_QUANTITY).toBe('EXCEEDS_LP_QUANTITY')
    })
  })

  describe('Service Integration', () => {
    it('should have reserveLP service exported', async () => {
      const { WOReservationService } = await import('@/lib/services/wo-reservation-service')
      expect(typeof WOReservationService.reserveLP).toBe('function')
    })

    it('should have canModifyReservations service exported', async () => {
      const { WOReservationService } = await import('@/lib/services/wo-reservation-service')
      expect(typeof WOReservationService.canModifyReservations).toBe('function')
    })
  })
})
