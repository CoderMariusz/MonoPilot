/**
 * BOM Clone Types (Story 02.6)
 * Type definitions for BOM clone operations
 */

/**
 * Request body for cloning a BOM
 */
export interface CloneBOMRequest {
  /** Target product ID (same as source or different) */
  target_product_id: string
  /** Effective start date for cloned BOM (defaults to today) */
  effective_from?: string
  /** Effective end date (null = no end date) */
  effective_to?: string | null
  /** Status of cloned BOM (always draft in MVP) */
  status?: 'draft' | 'active'
  /** Optional notes override */
  notes?: string | null
}

/**
 * Response from clone BOM operation
 */
export interface CloneBOMResponse {
  bom: {
    id: string
    product_id: string
    product_code: string
    product_name: string
    version: number
    status: string
    effective_from: string
    effective_to: string | null
    routing_id: string | null
    items_count: number
    created_at: string
  }
  message: string
}

/**
 * Result from clone target validation
 */
export interface CloneValidationResult {
  valid: boolean
  error?: string
}
