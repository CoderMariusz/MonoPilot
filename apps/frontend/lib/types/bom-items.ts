/**
 * BOM Items Types - Story 02.5a + 02.5b
 *
 * Types for BOM line items (components/ingredients):
 * - BOMItem: Full item with product details (includes Phase 1B fields)
 * - CreateBOMItemRequest: Create payload (includes Phase 1B fields)
 * - UpdateBOMItemRequest: Update payload (partial, includes Phase 1B fields)
 * - BOMItemsListResponse: List response with summary
 * - BOMItemResponse: Single item response with warnings
 *
 * This file re-exports from bom.ts for backward compatibility.
 */

// Re-export from bom.ts for backward compatibility
export type {
  BOMItem,
  CreateBOMItemRequest,
  UpdateBOMItemRequest,
  BOMItemsListResponse,
  BOMItemResponse,
  ConditionFlags,
  ProductionLine,
  ConditionalFlag,
  BulkImportResponse,
} from './bom'

/**
 * Warning object returned when UoM doesn't match component's base UoM
 */
export interface BOMItemWarning {
  code: 'UOM_MISMATCH' | string
  message: string
  details?: string
}

/**
 * Summary statistics for BOM items
 */
export interface BOMItemSummary {
  total_items: number
  total_input_qty: number
}

/**
 * Response from DELETE /api/v1/technical/boms/:id/items/:itemId
 */
export interface DeleteBOMItemResponse {
  success: boolean
  message: string
}

/**
 * Response from GET /api/v1/technical/boms/:id/items/next-sequence
 */
export interface NextSequenceResponse {
  next_sequence: number
}
