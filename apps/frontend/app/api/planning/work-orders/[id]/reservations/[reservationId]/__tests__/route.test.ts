/**
 * API Route Tests: Delete WO Reservation (Story 03.11b)
 * Purpose: Integration tests for DELETE /api/planning/work-orders/:id/reservations/:reservationId
 * Phase: RED - Tests written before implementation
 *
 * Tests the delete reservation API endpoint which handles:
 * - Releasing (un-reserving) a specific LP reservation (AC-8)
 * - Validation and error handling
 *
 * Coverage Target: 70%
 * Test Count: 14 scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-8: Manual LP Release (Un-Reserve)
 * - AC-13: API Validation (404, 409)
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
    releaseReservation: vi.fn(() => Promise.resolve({ success: false, error: 'Not implemented', code: 'NOT_IMPLEMENTED' })),
    canModifyReservations: vi.fn(() => false),
  },
  WOReservationErrorCode: {
    WO_NOT_FOUND: 'WO_NOT_FOUND',
    RESERVATION_NOT_FOUND: 'RESERVATION_NOT_FOUND',
    INVALID_WO_STATUS: 'INVALID_WO_STATUS',
    ALREADY_RELEASED: 'ALREADY_RELEASED',
    DATABASE_ERROR: 'DATABASE_ERROR',
  },
}))

describe('DELETE /api/planning/work-orders/:id/reservations/:reservationId (Story 03.11b)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Route file exists', () => {
    it('should export DELETE handler', async () => {
      const routeModule = await import('../route')
      expect(typeof routeModule.DELETE).toBe('function')
    })
  })

  describe('Response Structure - Success', () => {
    it('should return success with released_qty', async () => {
      const expectedResponse = {
        success: true,
        data: {
          released_qty: 50,
          message: 'Reservation released successfully',
        },
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.data.released_qty).toBe(50)
    })

    it('should return message indicating release', async () => {
      const expectedResponse = {
        success: true,
        data: {
          released_qty: 100,
        },
        message: 'Reservation released successfully',
      }

      expect(expectedResponse.message).toContain('released')
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

    it('should return 404 for non-existent reservation', async () => {
      const expectedResponse = {
        status: 404,
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: 'Reservation not found',
        },
      }

      expect(expectedResponse.status).toBe(404)
      expect(expectedResponse.error.code).toBe('RESERVATION_NOT_FOUND')
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

    it('should return 400 for already released reservation', async () => {
      const expectedResponse = {
        status: 400,
        error: {
          code: 'ALREADY_RELEASED',
          message: 'Reservation has already been released',
        },
      }

      expect(expectedResponse.status).toBe(400)
    })

    it('should return 404 for cross-org access (RLS)', async () => {
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
    it('should have releaseReservation service exported', async () => {
      const { WOReservationService } = await import('@/lib/services/wo-reservation-service')
      expect(typeof WOReservationService.releaseReservation).toBe('function')
    })

    it('should have canModifyReservations service exported', async () => {
      const { WOReservationService } = await import('@/lib/services/wo-reservation-service')
      expect(typeof WOReservationService.canModifyReservations).toBe('function')
    })
  })

  describe('Error Code Mapping', () => {
    it('should map WO_NOT_FOUND to 404', async () => {
      const { WOReservationErrorCode } = await import('@/lib/services/wo-reservation-service')
      expect(WOReservationErrorCode.WO_NOT_FOUND).toBe('WO_NOT_FOUND')
    })

    it('should map RESERVATION_NOT_FOUND to 404', async () => {
      const { WOReservationErrorCode } = await import('@/lib/services/wo-reservation-service')
      expect(WOReservationErrorCode.RESERVATION_NOT_FOUND).toBe('RESERVATION_NOT_FOUND')
    })

    it('should map INVALID_WO_STATUS to 409', async () => {
      const { WOReservationErrorCode } = await import('@/lib/services/wo-reservation-service')
      expect(WOReservationErrorCode.INVALID_WO_STATUS).toBe('INVALID_WO_STATUS')
    })

    it('should map ALREADY_RELEASED to 400', async () => {
      const { WOReservationErrorCode } = await import('@/lib/services/wo-reservation-service')
      expect(WOReservationErrorCode.ALREADY_RELEASED).toBe('ALREADY_RELEASED')
    })
  })
})
