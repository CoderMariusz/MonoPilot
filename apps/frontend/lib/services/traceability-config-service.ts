/**
 * Traceability Config Service - Story 02.10a
 * Purpose: Product-level traceability configuration management
 *
 * Handles:
 * - Get/update product traceability config (with defaults for unconfigured)
 * - Lot format validation and parsing
 * - Sample lot number generation for live preview
 * - Multi-tenancy via org_id isolation
 *
 * Coverage Target: 80%
 */

import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import type {
  TraceabilityConfig,
  TraceabilityConfigInput,
  LotFormatParts,
  LotFormatPlaceholder
} from '../types/traceability'

// Re-export types for test imports
export type { TraceabilityConfig, TraceabilityConfigInput }

// Valid lot format placeholders
const VALID_PLACEHOLDERS = ['YYYY', 'YY', 'MM', 'DD', 'JULIAN', 'PROD', 'LINE', 'YYMMDD']
const SEQ_PATTERN = /^SEQ:(\d+)$/

/**
 * Default traceability configuration values
 * Returned when product has no saved config
 */
const DEFAULT_CONFIG: Partial<TraceabilityConfig> = {
  lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
  lot_number_prefix: 'LOT-',
  lot_number_sequence_length: 6,
  traceability_level: 'lot',
  standard_batch_size: null,
  min_batch_size: null,
  max_batch_size: null,
  expiry_calculation_method: 'fixed_days',
  processing_buffer_days: 0,
  gs1_lot_encoding_enabled: false,
  gs1_expiry_encoding_enabled: false,
  gs1_sscc_enabled: false
}

/**
 * Get current user's org_id from users table
 * Used for RLS enforcement and multi-tenancy
 */
async function getCurrentUserOrgId(): Promise<{ userId: string; orgId: string } | null> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: userData, error } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (error || !userData?.org_id) {
    console.error('Failed to get org_id for user:', user.id, error)
    return null
  }

  return { userId: user.id, orgId: userData.org_id }
}

/**
 * Traceability Config Service Class
 * Static methods for config CRUD operations
 */
export class TraceabilityConfigService {
  /**
   * Get traceability configuration for a product
   * Returns saved config or default values if none exists
   *
   * @param productId - Product UUID
   * @returns TraceabilityConfig with _isDefault flag if defaults used
   */
  static async getProductTraceabilityConfig(productId: string): Promise<TraceabilityConfig> {
    const supabase = await createServerSupabase()

    const { data: config, error } = await supabase
      .from('product_traceability_config')
      .select('*')
      .eq('product_id', productId)
      .single()

    // Handle not found - return defaults
    if (error && error.code === 'PGRST116') {
      return {
        ...DEFAULT_CONFIG,
        product_id: productId,
        _isDefault: true
      } as TraceabilityConfig
    }

    // Handle other errors - return defaults with warning
    if (error) {
      console.error('Error fetching traceability config:', error)
      return {
        ...DEFAULT_CONFIG,
        product_id: productId,
        _isDefault: true
      } as TraceabilityConfig
    }

    return config as TraceabilityConfig
  }

  /**
   * Create or update traceability configuration for a product
   * Uses upsert with product_id as conflict key
   *
   * @param productId - Product UUID
   * @param input - Configuration input fields
   * @returns Updated TraceabilityConfig
   */
  static async updateProductTraceabilityConfig(
    productId: string,
    input: TraceabilityConfigInput
  ): Promise<TraceabilityConfig> {
    const userInfo = await getCurrentUserOrgId()
    if (!userInfo) {
      throw new Error('Unauthorized or no organization found for user')
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('product_traceability_config')
      .upsert(
        {
          product_id: productId,
          org_id: userInfo.orgId,
          ...input,
          updated_by: userInfo.userId
        },
        { onConflict: 'product_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Error upserting traceability config:', error)
      throw new Error(`Failed to save traceability config: ${error.message}`)
    }

    return data as TraceabilityConfig
  }
}

/**
 * Validate lot number format string
 * Checks for valid placeholders and correct syntax
 *
 * @param format - Lot format pattern string
 * @returns Validation result with valid flag and error messages
 *
 * @example
 * validateLotFormat("LOT-{YYYY}-{SEQ:6}") // { valid: true, errors: [] }
 * validateLotFormat("LOT-{INVALID}-001") // { valid: false, errors: ["Invalid placeholder: INVALID"] }
 */
export function validateLotFormat(format: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Extract all placeholders from format
  const placeholderPattern = /\{([^}]*)\}/g
  const placeholders: string[] = []
  let match

  while ((match = placeholderPattern.exec(format)) !== null) {
    placeholders.push(match[1])
  }

  // Must have at least one placeholder
  if (placeholders.length === 0) {
    errors.push('Format must contain at least one placeholder (e.g., {YYYY}, {SEQ:6})')
    return { valid: false, errors }
  }

  // Validate each placeholder
  for (const placeholder of placeholders) {
    // Check for empty placeholder
    if (!placeholder) {
      errors.push('Empty placeholder {} is not allowed')
      continue
    }

    // Check if standard placeholder
    if (VALID_PLACEHOLDERS.includes(placeholder)) {
      continue
    }

    // Check if SEQ with length
    if (SEQ_PATTERN.test(placeholder)) {
      continue
    }

    // Invalid placeholder
    errors.push(`Invalid placeholder: ${placeholder}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Parse lot format into component parts
 * Extracts prefix, placeholders, and separators
 *
 * @param format - Lot format pattern string
 * @returns Parsed format parts
 *
 * @example
 * parseLotFormat("LOT-{YYYY}-{SEQ:6}")
 * // { prefix: "LOT-", placeholders: [{type: "YYYY", position: 4}, {type: "SEQ", length: 6, position: 11}], separators: ["-"] }
 */
export function parseLotFormat(format: string): LotFormatParts {
  const placeholders: LotFormatPlaceholder[] = []
  const separators: string[] = []

  // Find prefix (text before first {)
  const firstBraceIndex = format.indexOf('{')
  const prefix = firstBraceIndex === -1 ? format : format.slice(0, firstBraceIndex)

  // Extract all placeholders with positions
  const placeholderPattern = /\{([^}]+)\}/g
  let match
  let lastIndex = firstBraceIndex

  while ((match = placeholderPattern.exec(format)) !== null) {
    const content = match[1]
    const position = match.index

    // Get separator between last placeholder and this one
    if (lastIndex !== -1 && lastIndex !== position) {
      const sep = format.slice(lastIndex + match[0].length - (match.index - lastIndex), position)
      if (sep && !sep.includes('{') && !sep.includes('}')) {
        separators.push(sep)
      }
    }

    // Parse placeholder type and optional length
    if (SEQ_PATTERN.test(content)) {
      const seqMatch = content.match(SEQ_PATTERN)
      placeholders.push({
        type: 'SEQ',
        length: parseInt(seqMatch![1], 10),
        position
      })
    } else if (VALID_PLACEHOLDERS.includes(content)) {
      placeholders.push({
        type: content as LotFormatPlaceholder['type'],
        position
      })
    }

    lastIndex = position
  }

  return { prefix, placeholders, separators }
}

/**
 * Generate sample lot number from format pattern
 * Replaces placeholders with actual values for preview
 *
 * @param format - Lot format pattern string
 * @param productCode - Optional product code for {PROD} placeholder
 * @param lineCode - Optional line code for {LINE} placeholder
 * @returns Generated sample lot number
 *
 * @example
 * generateSampleLotNumber("LOT-{YYYY}-{SEQ:6}") // "LOT-2025-000001"
 * generateSampleLotNumber("{PROD}-{YYMMDD}-{SEQ:4}", "BRD") // "BRD-250115-0001"
 */
export function generateSampleLotNumber(
  format: string,
  productCode?: string,
  lineCode?: string
): string {
  const now = new Date()

  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  // Calculate Julian day (day of year)
  const startOfYear = new Date(year, 0, 0)
  const diff = now.getTime() - startOfYear.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const julianDay = Math.floor(diff / oneDay)

  let result = format

  // Replace placeholders with values
  result = result.replace(/\{YYYY\}/g, String(year))
  result = result.replace(/\{YY\}/g, String(year).slice(-2))
  result = result.replace(/\{MM\}/g, String(month).padStart(2, '0'))
  result = result.replace(/\{DD\}/g, String(day).padStart(2, '0'))
  result = result.replace(
    /\{YYMMDD\}/g,
    `${String(year).slice(-2)}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`
  )
  result = result.replace(/\{JULIAN\}/g, String(julianDay).padStart(3, '0'))
  result = result.replace(/\{PROD\}/g, productCode || 'PRD')
  result = result.replace(/\{LINE\}/g, lineCode || '01')

  // Replace SEQ:N placeholders with sample sequence
  result = result.replace(/\{SEQ:(\d+)\}/g, (_, length) => {
    const len = parseInt(length, 10)
    return '1'.padStart(len, '0')
  })

  return result
}
