/**
 * WO Material Availability Types (Story 03.13)
 * Type definitions for material availability checking
 */

// ============================================================================
// ENUMS
// ============================================================================

export type AvailabilityStatus = 'sufficient' | 'low_stock' | 'shortage' | 'no_stock'

export type OverallStatus = 'sufficient' | 'low_stock' | 'shortage' | 'no_stock'

// ============================================================================
// STATUS THRESHOLDS
// ============================================================================

/**
 * Coverage thresholds for determining availability status
 * sufficient: >= 100%
 * low_stock: 50-99%
 * shortage: 1-49%
 * no_stock: 0%
 */
export const AVAILABILITY_THRESHOLDS = {
  sufficient: 100,
  low_stock: 50,
  shortage: 1,
  no_stock: 0,
} as const

/**
 * Traffic light colors per status
 */
export const AVAILABILITY_COLORS = {
  sufficient: '#22c55e', // green-500
  low_stock: '#eab308',  // yellow-500
  shortage: '#ef4444',   // red-500
  no_stock: '#ef4444',   // red-500 (outline)
} as const

// ============================================================================
// MATERIAL AVAILABILITY
// ============================================================================

export interface MaterialAvailability {
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

// ============================================================================
// SUMMARY
// ============================================================================

export interface AvailabilitySummary {
  total_materials: number
  sufficient_count: number
  low_stock_count: number
  shortage_count: number
}

// ============================================================================
// API RESPONSE
// ============================================================================

export interface WOAvailabilityResponse {
  wo_id: string
  checked_at: string
  overall_status: OverallStatus
  materials: MaterialAvailability[]
  summary: AvailabilitySummary
  enabled: boolean
  cached: boolean
  cache_expires_at?: string
  message?: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get availability status based on coverage percentage
 */
export function getAvailabilityStatus(coveragePercent: number): AvailabilityStatus {
  if (coveragePercent >= AVAILABILITY_THRESHOLDS.sufficient) {
    return 'sufficient'
  }
  if (coveragePercent >= AVAILABILITY_THRESHOLDS.low_stock) {
    return 'low_stock'
  }
  if (coveragePercent >= AVAILABILITY_THRESHOLDS.shortage) {
    return 'shortage'
  }
  return 'no_stock'
}

/**
 * Get status label for display
 */
export function getStatusLabel(status: AvailabilityStatus): string {
  switch (status) {
    case 'sufficient':
      return 'Sufficient'
    case 'low_stock':
      return 'Low Stock'
    case 'shortage':
      return 'Shortage'
    case 'no_stock':
      return 'No Stock'
    default:
      return status
  }
}

/**
 * Get overall status from summary (worst case wins)
 */
export function getOverallStatus(summary: AvailabilitySummary): OverallStatus {
  if (summary.shortage_count > 0) {
    return 'shortage'
  }
  if (summary.low_stock_count > 0) {
    return 'low_stock'
  }
  return 'sufficient'
}

/**
 * Check if status indicates insufficient materials
 */
export function hasInsufficientMaterials(materials: MaterialAvailability[]): boolean {
  return materials.some(m => m.status === 'shortage' || m.status === 'no_stock' || m.status === 'low_stock')
}

/**
 * Get materials with issues (non-sufficient)
 */
export function getMaterialsWithIssues(materials: MaterialAvailability[]): MaterialAvailability[] {
  return materials.filter(m => m.status !== 'sufficient')
}

/**
 * Format coverage percentage for display
 */
export function formatCoverage(percent: number): string {
  return `${Math.round(percent)}%`
}

/**
 * Format shortage quantity (negative = surplus)
 */
export function formatShortage(qty: number): { text: string; isSurplus: boolean } {
  if (qty < 0) {
    return { text: `${Math.abs(qty).toFixed(2)} surplus`, isSurplus: true }
  }
  return { text: qty.toFixed(2), isSurplus: false }
}
