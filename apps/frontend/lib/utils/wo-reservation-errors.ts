/**
 * WO Reservation Error Utilities (Story 03.11b)
 * Purpose: Shared error code to HTTP status code mapping for reservation API routes
 * Pattern: DRY - eliminates duplicated getStatusCode function across routes
 */

import { WOReservationErrorCode, WOReservationErrorCodeType } from '@/lib/services/wo-reservation-service'

/**
 * Map WO reservation error codes to HTTP status codes
 * @param code - Error code from WOReservationService
 * @returns HTTP status code
 */
export function getWOReservationStatusCode(code: WOReservationErrorCodeType | string | undefined): number {
  switch (code) {
    // Not Found (404)
    case WOReservationErrorCode.WO_NOT_FOUND:
    case WOReservationErrorCode.WO_MATERIAL_NOT_FOUND:
    case WOReservationErrorCode.LP_NOT_FOUND:
    case WOReservationErrorCode.RESERVATION_NOT_FOUND:
      return 404

    // Conflict (409)
    case WOReservationErrorCode.INVALID_WO_STATUS:
      return 409

    // Bad Request (400)
    case WOReservationErrorCode.LP_NOT_AVAILABLE:
    case WOReservationErrorCode.LP_PRODUCT_MISMATCH:
    case WOReservationErrorCode.LP_WAREHOUSE_MISMATCH:
    case WOReservationErrorCode.EXCEEDS_LP_QUANTITY:
    case WOReservationErrorCode.ALREADY_RELEASED:
    case WOReservationErrorCode.OVER_RESERVATION:
    case WOReservationErrorCode.NO_MATERIALS:
      return 400

    // Server Error (500) - default
    case WOReservationErrorCode.DATABASE_ERROR:
    default:
      return 500
  }
}
