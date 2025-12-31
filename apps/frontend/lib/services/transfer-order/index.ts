/**
 * Transfer Order Service - Public API
 * Story 03.8 - Refactor
 *
 * Barrel export for all transfer order service modules
 * Maintains backward compatibility with existing imports
 *
 * Architecture:
 * - constants.ts: Error codes, roles, status constants
 * - types.ts: Service-specific TypeScript types
 * - helpers.ts: Reusable helper functions (auth, warehouse enrichment, status calc)
 * - core.ts: CRUD operations for transfer orders (Story 3.6)
 * - lines.ts: CRUD operations for TO lines (Story 3.7)
 * - actions.ts: Ship and LP selection operations (Stories 3.8, 3.9)
 */

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

export * from './constants'
export * from './types'

// ============================================================================
// CORE CRUD OPERATIONS (Story 3.6)
// ============================================================================

export {
  listTransferOrders,
  getTransferOrder,
  createTransferOrder,
  updateTransferOrder,
  deleteTransferOrder,
  changeToStatus,
} from './core'

// ============================================================================
// LINE OPERATIONS (Story 3.7)
// ============================================================================

export {
  getToLines,
  createToLine,
  updateToLine,
  deleteToLine,
} from './lines'

// ============================================================================
// ACTION OPERATIONS (Stories 3.8, 3.9)
// ============================================================================

export {
  shipTransferOrder,
  getToLineLps,
  selectLpsForToLine,
  deleteToLineLp,
} from './actions'

// ============================================================================
// HELPERS (for advanced use cases)
// ============================================================================

export {
  getCurrentUserData,
  getCurrentOrgId,
  getCurrentUserId,
  validateRole,
  generateToNumber,
  calculateToStatus,
  enrichWithWarehouses,
} from './helpers'
