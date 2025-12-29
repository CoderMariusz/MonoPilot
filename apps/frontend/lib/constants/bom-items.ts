/**
 * BOM Items Constants (Story 02.5b)
 *
 * Centralized constants for BOM items:
 * - Default values for Phase 1B fields
 * - CSV template configuration
 * - Validation limits
 * - Default conditional flags
 */

/**
 * Default values for Phase 1B fields
 */
export const BOM_ITEM_DEFAULTS = {
  /** Consume whole license plate flag (default: false) */
  CONSUME_WHOLE_LP: false,
  /** Production line IDs (default: null = all lines) */
  LINE_IDS: null,
  /** By-product flag (default: false) */
  IS_BY_PRODUCT: false,
  /** Output flag (default: false) */
  IS_OUTPUT: false,
  /** Yield percentage (default: null) */
  YIELD_PERCENT: null,
  /** Conditional flags (default: null) */
  CONDITION_FLAGS: null,
  /** Sequence increment (default: 10) */
  SEQUENCE_INCREMENT: 10,
  /** Default sequence for first item */
  FIRST_SEQUENCE: 10,
  /** Scrap percentage (default: 0) */
  SCRAP_PERCENT: 0,
} as const

/**
 * Validation limits
 */
export const BOM_ITEM_LIMITS = {
  /** Maximum items per bulk import */
  MAX_BULK_IMPORT: 500,
  /** Maximum decimal places for quantity */
  MAX_QUANTITY_DECIMALS: 6,
  /** Maximum decimal places for yield_percent */
  MAX_YIELD_DECIMALS: 2,
  /** Maximum decimal places for scrap_percent */
  MAX_SCRAP_DECIMALS: 2,
  /** Maximum characters for notes */
  MAX_NOTES_LENGTH: 500,
  /** Minimum yield_percent value */
  MIN_YIELD_PERCENT: 0,
  /** Maximum yield_percent value */
  MAX_YIELD_PERCENT: 100,
  /** Minimum scrap_percent value */
  MIN_SCRAP_PERCENT: 0,
  /** Maximum scrap_percent value */
  MAX_SCRAP_PERCENT: 100,
} as const

/**
 * CSV template configuration
 */
export const CSV_TEMPLATE = {
  /** CSV column headers */
  HEADERS: [
    'product_code',
    'quantity',
    'uom',
    'sequence',
    'scrap_percent',
    'operation_seq',
    'consume_whole_lp',
    'line_ids',
    'is_by_product',
    'yield_percent',
    'condition_flags',
    'notes',
  ],
  /** Example rows for template */
  EXAMPLES: [
    'RM-001,50,kg,10,2,,false,,false,,,Premium ingredient',
    'BP-001,2,kg,100,0,,false,,true,2.0,,"Byproduct output"',
  ],
  /** Template filename */
  FILENAME: 'bom-items-import-template.csv',
  /** Error report filename */
  ERROR_FILENAME: 'import-errors.csv',
} as const

/**
 * Default conditional flags
 */
export const DEFAULT_CONDITIONAL_FLAGS = [
  { id: 'f-1', code: 'organic', name: 'Organic', is_active: true },
  { id: 'f-2', code: 'vegan', name: 'Vegan', is_active: true },
  { id: 'f-3', code: 'gluten_free', name: 'Gluten-Free', is_active: true },
  { id: 'f-4', code: 'kosher', name: 'Kosher', is_active: true },
  { id: 'f-5', code: 'halal', name: 'Halal', is_active: true },
] as const

/**
 * Conditional flag colors for UI
 */
export const FLAG_COLORS: Record<string, string> = {
  organic: 'bg-green-100 text-green-800 border-green-200',
  vegan: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  gluten_free: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  kosher: 'bg-blue-100 text-blue-800 border-blue-200',
  halal: 'bg-purple-100 text-purple-800 border-purple-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200',
} as const

/**
 * Helper to get flag color class
 * @param code - Flag code (e.g., 'organic')
 * @returns Tailwind CSS classes
 */
export function getFlagColor(code: string): string {
  return FLAG_COLORS[code] || FLAG_COLORS.default
}

/**
 * Helper to normalize empty array to null for line_ids
 * @param lineIds - Array of line IDs or null
 * @returns Normalized value (null if empty)
 */
export function normalizeLineIds(lineIds: string[] | null | undefined): string[] | null {
  if (lineIds === null || lineIds === undefined) return null
  return lineIds.length === 0 ? null : lineIds
}

/**
 * Helper to normalize empty flags object to null
 * @param flags - Condition flags object or null
 * @returns Normalized value (null if no flags)
 */
export function normalizeConditionFlags(
  flags: Record<string, boolean> | null | undefined
): Record<string, boolean> | null {
  if (flags === null || flags === undefined) return null
  const hasFlags = Object.keys(flags).some((key) => flags[key] === true)
  return hasFlags ? flags : null
}
