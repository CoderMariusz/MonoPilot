/**
 * Test Factories for Type-Safe Mock Data
 *
 * Provides factory functions to create properly-typed test data.
 * All factories accept an optional overrides parameter to customize
 * specific fields while providing sensible defaults.
 *
 * Usage:
 * ```ts
 * import { createMockGanttWO, createMockOrganization } from '@/lib/test-utils/factories'
 *
 * // Use defaults
 * const wo = createMockGanttWO()
 *
 * // Override specific fields
 * const releasedWO = createMockGanttWO({
 *   status: 'released',
 *   quantity: 500,
 *   material_status: 'low',
 * })
 * ```
 */

import type {
  GanttWorkOrder,
  GanttProduct,
  WOStatus,
  MaterialStatus,
} from '@/lib/types/gantt'

import type { Organization } from '@/lib/types/organization'

import type { POStatusHistory, POStatus } from '@/lib/types/purchase-order'

import type { WOPriority } from '@/lib/types/work-order'

// ============================================================================
// GANTT TYPES FACTORIES
// ============================================================================

/**
 * Creates a mock Gantt product for testing
 * @param overrides - Partial properties to override defaults
 * @returns Fully typed GanttProduct
 * @example
 * const product = createMockGanttProduct({ name: 'Chocolate Bar' })
 */
export function createMockGanttProduct(
  overrides?: Partial<GanttProduct>
): GanttProduct {
  return {
    id: 'prod-123',
    code: 'TEST-PROD',
    name: 'Test Product',
    ...overrides,
  }
}

/**
 * Creates a mock Gantt work order for testing
 * @param overrides - Partial properties to override defaults
 * @returns Fully typed GanttWorkOrder
 * @example
 * const wo = createMockGanttWO({ status: 'released', quantity: 500 })
 */
export function createMockGanttWO(
  overrides?: Partial<GanttWorkOrder>
): GanttWorkOrder {
  // Handle product separately to support nested overrides
  const product = overrides?.product
    ? createMockGanttProduct(overrides.product)
    : createMockGanttProduct()

  // Destructure product from overrides to avoid spreading it
  const { product: _productOverride, ...restOverrides } = overrides || {}

  return {
    id: 'wo-123',
    wo_number: 'WO-2024-001',
    product,
    status: 'draft' as WOStatus,
    material_status: 'ok' as MaterialStatus,
    priority: 'normal',
    quantity: 100,
    uom: 'kg',
    scheduled_date: '2024-12-01',
    scheduled_start_time: '08:00',
    scheduled_end_time: '16:00',
    duration_hours: 8,
    progress_percent: 0,
    is_overdue: false,
    created_at: '2024-11-01T10:00:00Z',
    ...restOverrides,
  }
}

// ============================================================================
// ORGANIZATION FACTORY
// ============================================================================

/**
 * Creates a mock Organization for testing
 * @param overrides - Partial properties to override defaults
 * @returns Fully typed Organization
 * @example
 * const org = createMockOrganization({ onboarding_step: 3 })
 */
export function createMockOrganization(
  overrides?: Partial<Organization>
): Organization {
  return {
    id: 'org-123',
    name: 'Test Organization',
    slug: 'test-org',
    timezone: 'UTC',
    locale: 'en',
    currency: 'USD',
    onboarding_step: 5,
    onboarding_started_at: '2024-01-01T00:00:00Z',
    onboarding_completed_at: '2024-01-01T00:00:00Z',
    onboarding_skipped: false,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ============================================================================
// PURCHASE ORDER FACTORY
// ============================================================================

/**
 * Creates a mock PO Status History entry for testing
 * @param overrides - Partial properties to override defaults
 * @returns Fully typed POStatusHistory
 * @example
 * const history = createMockPOStatusHistory({
 *   event_type: 'po_approved',
 *   details: { from_status: 'pending_approval', to_status: 'approved' },
 * })
 */
export function createMockPOStatusHistory(
  overrides?: Partial<POStatusHistory>
): POStatusHistory {
  return {
    id: 'history-123',
    purchase_order_id: 'po-123',
    event_type: 'status_change',
    event_date: new Date().toISOString(),
    user_id: 'user-123',
    user_name: 'Test User',
    details: {
      from_status: 'draft' as POStatus,
      to_status: 'submitted' as POStatus,
    },
    ...overrides,
  }
}

// ============================================================================
// WORK ORDER FACTORY
// ============================================================================

/**
 * Creates a mock Work Order status for testing
 * Returns a properly typed WOStatus
 * @param status - Optional status to return, defaults to 'draft'
 * @returns WOStatus typed string
 * @example
 * const status = createMockWOStatus('in_progress')
 */
export function createMockWOStatus(
  status:
    | 'draft'
    | 'planned'
    | 'released'
    | 'in_progress'
    | 'on_hold'
    | 'completed'
    | 'closed' = 'draft'
): WOStatus {
  return status as WOStatus
}

/**
 * Creates a mock Work Order priority for testing
 * Returns a properly typed WOPriority
 * @param priority - Optional priority to return, defaults to 'normal'
 * @returns WOPriority typed string
 * @example
 * const priority = createMockWOPriority('high')
 */
export function createMockWOPriority(
  priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
): WOPriority {
  return priority as WOPriority
}

/**
 * Creates a mock Material status for testing
 * Returns a properly typed MaterialStatus
 * @param status - Optional status to return, defaults to 'ok'
 * @returns MaterialStatus typed string
 * @example
 * const matStatus = createMockMaterialStatus('low')
 */
export function createMockMaterialStatus(
  status: 'ok' | 'low' | 'insufficient' = 'ok'
): MaterialStatus {
  return status as MaterialStatus
}

// ============================================================================
// BATCH FACTORIES
// ============================================================================

/**
 * Creates multiple mock Gantt work orders for testing
 * @param count - Number of work orders to create
 * @param baseOverrides - Base overrides to apply to all work orders
 * @returns Array of GanttWorkOrder
 * @example
 * const workOrders = createMockGanttWOBatch(5, { status: 'planned' })
 */
export function createMockGanttWOBatch(
  count: number,
  baseOverrides?: Partial<GanttWorkOrder>
): GanttWorkOrder[] {
  return Array.from({ length: count }, (_, index) =>
    createMockGanttWO({
      id: `wo-${index + 1}`,
      wo_number: `WO-2024-${String(index + 1).padStart(3, '0')}`,
      ...baseOverrides,
    })
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Re-export types for convenience
  type GanttWorkOrder,
  type GanttProduct,
  type WOStatus,
  type MaterialStatus,
  type Organization,
  type POStatusHistory,
  type WOPriority,
}
