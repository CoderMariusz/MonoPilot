/**
 * BOM Alternative Types (Story 02.6)
 * Type definitions for BOM alternative ingredient operations
 */

/**
 * BOM Alternative entity
 */
export interface BOMAlternative {
  id: string
  bom_item_id: string
  alternative_product_id: string
  alternative_product_code: string
  alternative_product_name: string
  alternative_product_type: string
  quantity: number
  uom: string
  preference_order: number
  notes: string | null
  created_at: string
}

/**
 * Response for listing alternatives of a BOM item
 */
export interface AlternativesListResponse {
  alternatives: BOMAlternative[]
  primary_item: {
    id: string
    product_code: string
    product_name: string
    product_type: string
    quantity: number
    uom: string
  }
}

/**
 * Request body for creating an alternative
 */
export interface CreateAlternativeRequest {
  alternative_product_id: string
  quantity: number
  uom: string
  preference_order?: number
  notes?: string | null
}

/**
 * Request body for updating an alternative
 */
export interface UpdateAlternativeRequest {
  quantity?: number
  uom?: string
  preference_order?: number
  notes?: string | null
}

/**
 * Response for single alternative operations
 */
export interface AlternativeResponse {
  alternative: BOMAlternative
  message: string
}

/**
 * Delete response
 */
export interface DeleteAlternativeResponse {
  success: boolean
  message: string
}

/**
 * Validation result for alternative rules
 */
export interface AlternativeValidationResult {
  valid: boolean
  error?: string
  warning?: string
}
