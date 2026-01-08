/**
 * Material Availability Service - Story 03.13
 *
 * Service for calculating Work Order material availability.
 * Provides traffic light indicators (sufficient/low_stock/shortage/no_stock)
 * based on available LP quantities vs required quantities.
 *
 * Features:
 * - Coverage percentage calculation
 * - Expiry-aware filtering (excludes expired LPs)
 * - Reservation deduction from other WOs
 * - Caching with 30 second TTL
 * - Multi-tenant org isolation
 *
 * @module lib/services/material-availability-service
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// Types
// =============================================================================

export type AvailabilityStatus = 'sufficient' | 'low_stock' | 'shortage' | 'no_stock'

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

export interface AvailabilitySummary {
  total_materials: number
  sufficient_count: number
  low_stock_count: number
  shortage_count: number
}

export interface AvailabilityResponse {
  wo_id: string
  checked_at: string
  overall_status: AvailabilityStatus
  materials: MaterialAvailability[]
  summary: AvailabilitySummary
  enabled: boolean
  cached: boolean
  cache_expires_at?: string
}

export interface CheckOptions {
  skipCache?: boolean
  settingEnabled?: boolean
}

// =============================================================================
// Pure Functions (exported for unit testing)
// =============================================================================

/**
 * Calculate coverage percentage: (available / required) * 100
 * Returns 100 if required is 0 (no requirement = fully covered)
 */
export function calculateCoveragePercent(available: number, required: number): number {
  if (required === 0) {
    return 100
  }
  return Math.round((available / required) * 100 * 100) / 100 // Round to 2 decimals then floor
}

/**
 * Determine availability status based on coverage percentage
 * - sufficient: >= 100%
 * - low_stock: 50-99%
 * - shortage: 1-49%
 * - no_stock: 0%
 */
export function calculateAvailabilityStatus(coveragePercent: number): AvailabilityStatus {
  if (coveragePercent >= 100) {
    return 'sufficient'
  }
  if (coveragePercent >= 50) {
    return 'low_stock'
  }
  if (coveragePercent > 0) {
    return 'shortage'
  }
  return 'no_stock'
}

/**
 * Calculate shortage quantity: required - available
 * Positive = shortage, negative = surplus
 */
export function calculateShortageQty(required: number, available: number): number {
  return required - available
}

/**
 * Calculate overall status from array of statuses
 * Uses worst-case: no_stock > shortage > low_stock > sufficient
 */
export function calculateOverallStatus(statuses: AvailabilityStatus[]): AvailabilityStatus {
  if (statuses.length === 0) {
    return 'sufficient'
  }

  const priority: Record<AvailabilityStatus, number> = {
    no_stock: 4,
    shortage: 3,
    low_stock: 2,
    sufficient: 1,
  }

  let worstStatus: AvailabilityStatus = 'sufficient'
  let worstPriority = 1

  for (const status of statuses) {
    if (priority[status] > worstPriority) {
      worstPriority = priority[status]
      worstStatus = status
    }
  }

  return worstStatus
}

/**
 * Calculate summary statistics from materials array
 */
export function calculateSummary(materials: MaterialAvailability[]): AvailabilitySummary {
  const summary: AvailabilitySummary = {
    total_materials: materials.length,
    sufficient_count: 0,
    low_stock_count: 0,
    shortage_count: 0,
  }

  for (const material of materials) {
    switch (material.status) {
      case 'sufficient':
        summary.sufficient_count++
        break
      case 'low_stock':
        summary.low_stock_count++
        break
      case 'shortage':
      case 'no_stock':
        summary.shortage_count++
        break
    }
  }

  return summary
}

// =============================================================================
// UUID Validation Helper
// =============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

// =============================================================================
// Service Class
// =============================================================================

/**
 * MaterialAvailabilityService - Server-side service for WO material availability
 */
export class MaterialAvailabilityService {
  /** Cache TTL in seconds */
  static readonly CACHE_TTL = 30

  /** In-memory cache (for this service instance) */
  private static cache = new Map<string, { data: AvailabilityResponse; expires: number }>()

  /**
   * Generate cache key for availability check
   */
  static getCacheKey(orgId: string, woId: string): string {
    return `org:${orgId}:wo:${woId}:availability`
  }

  /**
   * Get available LP quantity for a product in an organization
   * Sums quantities from LPs with status 'available' and optionally excludes expired
   */
  static async getAvailableLPQuantity(
    supabase: SupabaseClient,
    productId: string,
    orgId: string,
    excludeExpired: boolean = true
  ): Promise<number> {
    let query = supabase
      .from('license_plates')
      .select('quantity')
      .eq('org_id', orgId)
      .eq('product_id', productId)
      .eq('status', 'available')

    if (excludeExpired) {
      // Exclude expired LPs (expiry_date < today)
      const today = new Date().toISOString().split('T')[0]
      query = query.or(`expiry_date.is.null,expiry_date.gte.${today}`)
    }

    const { data: lps, error } = await query

    if (error) {
      console.error('Error fetching LP quantities:', error)
      return 0
    }

    if (!lps || lps.length === 0) {
      return 0
    }

    return lps.reduce((sum, lp) => sum + (parseFloat(lp.quantity) || 0), 0)
  }

  /**
   * Get expired LP quantity for a product (excluded from availability)
   */
  static async getExpiredLPQuantity(
    supabase: SupabaseClient,
    productId: string,
    orgId: string
  ): Promise<number> {
    const today = new Date().toISOString().split('T')[0]

    const { data: lps, error } = await supabase
      .from('license_plates')
      .select('quantity')
      .eq('org_id', orgId)
      .eq('product_id', productId)
      .eq('status', 'available')
      .not('expiry_date', 'is', null)
      .lt('expiry_date', today)

    if (error || !lps) {
      return 0
    }

    return lps.reduce((sum, lp) => sum + (parseFloat(lp.quantity) || 0), 0)
  }

  /**
   * Get reserved quantity for a product from other active WOs
   * Excludes current WO if provided
   */
  static async getReservedQuantity(
    supabase: SupabaseClient,
    productId: string,
    orgId: string,
    excludeWoId?: string
  ): Promise<number> {
    // Get active reservations from lp_reservations joined with license_plates for product
    let query = supabase
      .from('lp_reservations')
      .select(`
        reserved_qty,
        consumed_qty,
        wo_id,
        license_plates!inner(product_id)
      `)
      .eq('org_id', orgId)
      .eq('status', 'active')
      .eq('license_plates.product_id', productId)

    if (excludeWoId) {
      query = query.neq('wo_id', excludeWoId)
    }

    const { data: reservations, error } = await query

    if (error || !reservations) {
      return 0
    }

    // Sum (reserved_qty - consumed_qty) for active reservations
    return reservations.reduce((sum, r) => {
      const net = (parseFloat(r.reserved_qty as any) || 0) - (parseFloat(r.consumed_qty as any) || 0)
      return sum + Math.max(0, net)
    }, 0)
  }

  /**
   * Calculate net available quantity for a product
   * net_available = LP_sum - other_reservations
   */
  static async calculateNetAvailable(
    supabase: SupabaseClient,
    productId: string,
    orgId: string,
    excludeWoId?: string
  ): Promise<number> {
    const [lpSum, otherReservations] = await Promise.all([
      this.getAvailableLPQuantity(supabase, productId, orgId, true),
      this.getReservedQuantity(supabase, productId, orgId, excludeWoId),
    ])

    return Math.max(0, lpSum - otherReservations)
  }

  /**
   * Check availability for all materials in a Work Order
   */
  static async checkWOAvailability(
    supabase: SupabaseClient,
    woId: string,
    orgId: string,
    options: CheckOptions = {}
  ): Promise<AvailabilityResponse> {
    const { skipCache = false, settingEnabled = true } = options

    // Validate IDs
    if (!isValidUUID(woId)) {
      throw new Error('INVALID_ID')
    }
    if (!isValidUUID(orgId)) {
      throw new Error('INVALID_ID')
    }

    // Check cache first (unless skipCache)
    const cacheKey = this.getCacheKey(orgId, woId)
    if (!skipCache) {
      const cached = this.cache.get(cacheKey)
      if (cached && cached.expires > Date.now()) {
        return { ...cached.data, cached: true }
      }
    }

    // If setting is disabled, return minimal response
    if (!settingEnabled) {
      return this.buildAvailabilityResponse(woId, [], false, false)
    }

    // Verify WO exists and belongs to org
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, organization_id')
      .eq('id', woId)
      .single()

    if (woError || !wo) {
      throw new Error('NOT_FOUND')
    }

    // Get WO materials
    const { data: materials, error: materialsError } = await supabase
      .from('wo_materials')
      .select(`
        id,
        wo_id,
        product_id,
        required_qty,
        reserved_qty,
        uom,
        sequence,
        product:products(id, code, name)
      `)
      .eq('wo_id', woId)
      .eq('organization_id', orgId)
      .order('sequence')

    if (materialsError) {
      throw new Error('DATABASE_ERROR')
    }

    // If no materials, return empty response
    if (!materials || materials.length === 0) {
      const response = this.buildAvailabilityResponse(woId, [], false)
      this.cacheResponse(cacheKey, response)
      return response
    }

    // Calculate availability for each material
    const materialAvailability: MaterialAvailability[] = await Promise.all(
      materials.map(async (mat) => {
        const product = mat.product as any
        const productCode = product?.code || ''
        const productName = product?.name || mat.product_id

        // Get available and reserved quantities
        const [availableQty, expiredQty] = await Promise.all([
          this.calculateNetAvailable(supabase, mat.product_id, orgId, woId),
          this.getExpiredLPQuantity(supabase, mat.product_id, orgId),
        ])

        const requiredQty = parseFloat(mat.required_qty as any) || 0
        const reservedQty = parseFloat(mat.reserved_qty as any) || 0
        const coveragePercent = calculateCoveragePercent(availableQty, requiredQty)
        const status = calculateAvailabilityStatus(coveragePercent)
        const shortageQty = calculateShortageQty(requiredQty, availableQty)

        return {
          wo_material_id: mat.id,
          product_id: mat.product_id,
          product_code: productCode,
          product_name: productName,
          required_qty: requiredQty,
          available_qty: availableQty,
          reserved_qty: reservedQty,
          shortage_qty: shortageQty,
          coverage_percent: coveragePercent,
          status,
          uom: mat.uom,
          expired_excluded_qty: expiredQty,
        }
      })
    )

    const response = this.buildAvailabilityResponse(woId, materialAvailability, false)
    this.cacheResponse(cacheKey, response)
    return response
  }

  /**
   * Build the availability response object
   */
  static buildAvailabilityResponse(
    woId: string,
    materials: MaterialAvailability[],
    cached: boolean,
    enabled: boolean = true
  ): AvailabilityResponse {
    const statuses = materials.map((m) => m.status)
    const overallStatus = calculateOverallStatus(statuses)
    const summary = calculateSummary(materials)

    const response: AvailabilityResponse = {
      wo_id: woId,
      checked_at: new Date().toISOString(),
      overall_status: overallStatus,
      materials,
      summary,
      enabled,
      cached,
    }

    if (cached) {
      const expiresAt = new Date(Date.now() + this.CACHE_TTL * 1000)
      response.cache_expires_at = expiresAt.toISOString()
    }

    return response
  }

  /**
   * Cache response with TTL
   */
  private static cacheResponse(key: string, response: AvailabilityResponse): void {
    this.cache.set(key, {
      data: response,
      expires: Date.now() + this.CACHE_TTL * 1000,
    })
  }

  /**
   * Clear cache for a specific WO or all
   */
  static clearCache(orgId?: string, woId?: string): void {
    if (orgId && woId) {
      this.cache.delete(this.getCacheKey(orgId, woId))
    } else {
      this.cache.clear()
    }
  }
}
