/**
 * Shipping Module Types
 * Story: 07.6 - SO Allergen Validation
 *
 * Type definitions for:
 * - Allergen conflict detection
 * - Validation response
 * - Manager override
 * - Customer order history
 */

// ============================================================================
// Allergen Conflict Types
// ============================================================================

/**
 * Represents a single allergen conflict between a product and customer restriction
 */
export interface AllergenConflict {
  /** Sales order line ID */
  line_id: string
  /** Line number in order (for UI display) */
  line_number: number
  /** Product ID */
  product_id: string
  /** Product SKU/code */
  product_code: string
  /** Product display name */
  product_name: string
  /** Allergen ID from allergens table */
  allergen_id: string
  /** Allergen code (e.g., PEANUT, A05) */
  allergen_code: string
  /** Allergen display name (e.g., Peanuts) */
  allergen_name: string
}

// ============================================================================
// Validation Response Types
// ============================================================================

/**
 * Response from allergen validation endpoint
 */
export interface ValidateAllergensResponse {
  /** True if no allergen conflicts detected */
  valid: boolean
  /** Array of allergen conflicts (empty if valid=true) */
  conflicts: AllergenConflict[]
  /** Array of allergen IDs customer is restricted from */
  customer_restrictions: string[]
  /** Validation timestamp (ISO 8601) */
  validated_at: string
  /** Name of user who performed validation */
  validated_by: string
}

// ============================================================================
// Override Request/Response Types
// ============================================================================

/**
 * Request body for allergen override
 */
export interface OverrideAllergenRequest {
  /** Reason for override (min 20, max 500 chars) */
  reason: string
  /** Must be true to confirm override */
  confirmed: boolean
}

/**
 * Response from allergen override endpoint
 */
export interface OverrideAllergenResponse {
  /** Whether override was successful */
  success: boolean
  /** Whether allergens are now validated */
  allergen_validated: boolean
  /** Whether override flag is set */
  allow_allergen_override: boolean
  /** Name of user who approved override */
  overridden_by: string
  /** Override timestamp (ISO 8601) */
  overridden_at: string
  /** ID of the audit log entry created */
  audit_log_id: string
}

// ============================================================================
// Customer Order History Types
// ============================================================================

/**
 * Customer order summary for order history list
 */
export interface CustomerOrder {
  /** Sales order ID (UUID) */
  id: string
  /** Sales order number (e.g., SO-2025-001) */
  order_number: string
  /** Order creation date (ISO 8601) */
  order_date: string
  /** Order status */
  status: string
  /** Order total amount */
  total_amount: number
  /** Currency code (ISO 4217) */
  currency: string
  /** Number of line items in order */
  line_count: number
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number
  /** Items per page */
  limit: number
  /** Total number of items */
  total: number
  /** Total number of pages */
  total_pages: number
}

/**
 * Response from customer orders endpoint
 */
export interface CustomerOrdersResponse {
  /** Array of customer orders */
  orders: CustomerOrder[]
  /** Pagination metadata */
  pagination: PaginationMeta
}

// ============================================================================
// Service Result Types
// ============================================================================

/**
 * Generic service result wrapper
 */
export interface AllergenValidationResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?:
    | 'SALES_ORDER_NOT_FOUND'
    | 'CUSTOMER_NOT_FOUND'
    | 'PERMISSION_DENIED'
    | 'INVALID_SO_STATUS'
    | 'INVALID_REASON'
    | 'UNCONFIRMED'
    | 'NO_CONFLICTS'
    | 'VALIDATION_ERROR'
    | 'DATABASE_ERROR'
    | 'INVALID_PAGE'
    | 'INVALID_LIMIT'
    | 'UNAUTHORIZED'
}

// ============================================================================
// Customer Order History Options
// ============================================================================

/**
 * Options for getCustomerOrderHistory
 */
export interface CustomerOrderHistoryOptions {
  /** Page number (1-indexed, default: 1) */
  page?: number
  /** Items per page (default: 20, max: 100) */
  limit?: number
  /** Filter by order status */
  status?: string
}
