/**
 * Transfer Order Service Types
 * Story 03.8 - Refactor
 *
 * Extracted service-specific types
 */

import type { ErrorCodeType } from './constants'

// ============================================================================
// SERVICE RESULT TYPES
// ============================================================================

export interface ServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: ErrorCodeType
}

export interface ListResult<T> {
  success: boolean
  data?: T[]
  total?: number
  error?: string
}

// ============================================================================
// USER DATA
// ============================================================================

export interface UserData {
  orgId: string
  role: string
  userId: string
}

// ============================================================================
// WAREHOUSE INFO (for enrichment)
// ============================================================================

export interface WarehouseInfo {
  id: string
  code: string
  name: string
}
