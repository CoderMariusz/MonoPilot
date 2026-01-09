/**
 * Tests for wo-reservation-errors utilities
 * Story 03.11b: WO Material Reservations (LP Allocation)
 */

import { describe, it, expect } from 'vitest'
import { getWOReservationStatusCode } from '../wo-reservation-errors'
import { WOReservationErrorCode } from '@/lib/services/wo-reservation-service'

describe('getWOReservationStatusCode', () => {
  describe('404 Not Found errors', () => {
    it('should return 404 for WO_NOT_FOUND', () => {
      expect(getWOReservationStatusCode(WOReservationErrorCode.WO_NOT_FOUND)).toBe(404)
    })

    it('should return 404 for WO_MATERIAL_NOT_FOUND', () => {
      expect(getWOReservationStatusCode(WOReservationErrorCode.WO_MATERIAL_NOT_FOUND)).toBe(404)
    })

    it('should return 404 for LP_NOT_FOUND', () => {
      expect(getWOReservationStatusCode(WOReservationErrorCode.LP_NOT_FOUND)).toBe(404)
    })

    it('should return 404 for RESERVATION_NOT_FOUND', () => {
      expect(getWOReservationStatusCode(WOReservationErrorCode.RESERVATION_NOT_FOUND)).toBe(404)
    })
  })

  describe('409 Conflict errors', () => {
    it('should return 409 for INVALID_WO_STATUS', () => {
      expect(getWOReservationStatusCode(WOReservationErrorCode.INVALID_WO_STATUS)).toBe(409)
    })
  })

  describe('400 Bad Request errors', () => {
    it('should return 400 for LP_NOT_AVAILABLE', () => {
      expect(getWOReservationStatusCode(WOReservationErrorCode.LP_NOT_AVAILABLE)).toBe(400)
    })

    it('should return 400 for LP_PRODUCT_MISMATCH', () => {
      expect(getWOReservationStatusCode(WOReservationErrorCode.LP_PRODUCT_MISMATCH)).toBe(400)
    })

    it('should return 400 for LP_WAREHOUSE_MISMATCH', () => {
      expect(getWOReservationStatusCode(WOReservationErrorCode.LP_WAREHOUSE_MISMATCH)).toBe(400)
    })

    it('should return 400 for EXCEEDS_LP_QUANTITY', () => {
      expect(getWOReservationStatusCode(WOReservationErrorCode.EXCEEDS_LP_QUANTITY)).toBe(400)
    })

    it('should return 400 for ALREADY_RELEASED', () => {
      expect(getWOReservationStatusCode(WOReservationErrorCode.ALREADY_RELEASED)).toBe(400)
    })

    it('should return 400 for OVER_RESERVATION', () => {
      expect(getWOReservationStatusCode(WOReservationErrorCode.OVER_RESERVATION)).toBe(400)
    })

    it('should return 400 for NO_MATERIALS', () => {
      expect(getWOReservationStatusCode(WOReservationErrorCode.NO_MATERIALS)).toBe(400)
    })
  })

  describe('500 Server Error (default)', () => {
    it('should return 500 for DATABASE_ERROR', () => {
      expect(getWOReservationStatusCode(WOReservationErrorCode.DATABASE_ERROR)).toBe(500)
    })

    it('should return 500 for unknown error code', () => {
      expect(getWOReservationStatusCode('UNKNOWN_ERROR')).toBe(500)
    })

    it('should return 500 for undefined', () => {
      expect(getWOReservationStatusCode(undefined)).toBe(500)
    })
  })
})
