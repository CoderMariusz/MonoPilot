/**
 * Transfer Order Service (Legacy Entry Point)
 * Epic 3 Batch 3B: Transfer Orders
 * Stories: 3.6, 3.7, 3.8, 3.9
 *
 * REFACTORED (Story 03.8 - PHASE 4):
 * This file now re-exports from modular service files for backward compatibility.
 * New code should import from '@/lib/services/transfer-order' instead.
 *
 * Architecture:
 * - /transfer-order/constants.ts: Error codes, roles, status constants
 * - /transfer-order/types.ts: Service-specific TypeScript types
 * - /transfer-order/helpers.ts: Reusable helper functions
 * - /transfer-order/core.ts: CRUD operations (Story 3.6)
 * - /transfer-order/lines.ts: Line operations (Story 3.7)
 * - /transfer-order/actions.ts: Ship and LP selection (Stories 3.8, 3.9)
 *
 * Benefits:
 * - Reduced file size (1,426 → ~200 lines per module)
 * - Eliminated code duplication (warehouse enrichment pattern)
 * - Better separation of concerns (one module per story)
 * - Extracted constants (magic strings → named constants)
 * - Easier testing and maintenance
 *
 * Breaking Changes: NONE
 * All existing imports continue to work via re-exports.
 */

// Re-export all types and functions from modular service
export * from './transfer-order'

// Legacy type aliases (deprecated, kept for backward compatibility)
export type { ServiceResult, ListResult } from './transfer-order/types'
