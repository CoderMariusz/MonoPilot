/**
 * Test Factories
 * Type-safe factory functions for creating mock test data
 *
 * Usage:
 * ```typescript
 * import { createMockGanttWO, createMockOrganization } from '@/lib/test/factories';
 *
 * const mockWO = createMockGanttWO({ status: 'draft', wo_number: 'WO-001' });
 * const mockOrg = createMockOrganization({ name: 'Test Org' });
 * ```
 */

import type {
  GanttWorkOrder,
  GanttProduct,
  WOStatus,
  MaterialStatus,
} from '@/lib/types/gantt';
import type { Organization, OrgContext } from '@/lib/types/organization';
import type { PlanningSettings, PaymentTerms, Currency } from '@/lib/types/planning-settings';

// ============================================================================
// GANTT FACTORIES
// ============================================================================

/**
 * Create a mock GanttProduct
 */
export function createMockGanttProduct(
  overrides?: Partial<GanttProduct>
): GanttProduct {
  return {
    id: 'prod-001',
    code: 'FG-TEST-001',
    name: 'Test Product',
    ...overrides,
  };
}

/**
 * Create a mock GanttWorkOrder with proper types
 */
export function createMockGanttWO(
  overrides?: Partial<GanttWorkOrder>
): GanttWorkOrder {
  return {
    id: 'wo-001',
    wo_number: 'WO-00001',
    product: createMockGanttProduct(),
    status: 'planned' as WOStatus,
    priority: 'normal',
    quantity: 1000,
    uom: 'pc',
    scheduled_date: '2024-12-17',
    scheduled_start_time: '08:00',
    scheduled_end_time: '16:00',
    duration_hours: 8,
    progress_percent: null,
    material_status: 'ok' as MaterialStatus,
    is_overdue: false,
    created_at: '2024-12-14T09:30:00Z',
    ...overrides,
  };
}

// ============================================================================
// ORGANIZATION FACTORIES
// ============================================================================

/**
 * Create a mock Organization with all required fields
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
    currency: 'PLN',
    logo_url: undefined,
    onboarding_step: 6,
    onboarding_started_at: undefined,
    onboarding_completed_at: new Date().toISOString(),
    onboarding_skipped: false,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock OrgContext organization (subset of Organization)
 * This is the Pick<Organization, ...> type used in OrgContext
 */
export function createMockOrgContextOrganization(
  overrides?: Partial<
    Pick<
      Organization,
      | 'id'
      | 'name'
      | 'slug'
      | 'timezone'
      | 'locale'
      | 'currency'
      | 'onboarding_step'
      | 'onboarding_completed_at'
      | 'onboarding_skipped'
      | 'is_active'
    >
  >
): Pick<
  Organization,
  | 'id'
  | 'name'
  | 'slug'
  | 'timezone'
  | 'locale'
  | 'currency'
  | 'onboarding_step'
  | 'onboarding_completed_at'
  | 'onboarding_skipped'
  | 'is_active'
> {
  return {
    id: 'org-123',
    name: 'Test Organization',
    slug: 'test-org',
    timezone: 'UTC',
    locale: 'en',
    currency: 'PLN',
    onboarding_step: 6,
    onboarding_completed_at: new Date().toISOString(),
    onboarding_skipped: false,
    is_active: true,
    ...overrides,
  };
}

/**
 * Create a mock OrgContext
 */
export function createMockOrgContext(
  overrides?: Partial<OrgContext>
): OrgContext {
  return {
    org_id: 'org-123',
    user_id: 'user-123',
    role_code: 'admin',
    role_name: 'Administrator',
    permissions: { settings: 'CRUD' },
    organization: createMockOrgContextOrganization(),
    ...overrides,
  };
}

// ============================================================================
// PLANNING SETTINGS FACTORIES
// ============================================================================

/**
 * Create a mock PlanningSettings with all required fields
 */
export function createMockPlanningSettings(
  overrides?: Partial<PlanningSettings>
): PlanningSettings {
  return {
    id: 'settings-id',
    org_id: 'org-id',

    // PO Settings
    po_require_approval: false,
    po_approval_threshold: null,
    po_approval_roles: ['admin', 'manager'],
    po_auto_number_prefix: 'PO-',
    po_auto_number_format: 'YYYY-NNNNN',
    po_default_payment_terms: 'Net 30' as PaymentTerms,
    po_default_currency: 'PLN' as Currency,

    // TO Settings
    to_allow_partial_shipments: true,
    to_require_lp_selection: false,
    to_auto_number_prefix: 'TO-',
    to_auto_number_format: 'YYYY-NNNNN',
    to_default_transit_days: 1,

    // WO Settings
    wo_material_check: true,
    wo_copy_routing: true,
    wo_auto_select_bom: true,
    wo_require_bom: true,
    wo_allow_overproduction: false,
    wo_overproduction_limit: 10,
    wo_auto_number_prefix: 'WO-',
    wo_auto_number_format: 'YYYY-NNNNN',
    wo_default_scheduling_buffer_hours: 2,

    // Audit timestamps
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

// ============================================================================
// PO STATUS HISTORY FACTORY
// ============================================================================

export interface POStatusHistory {
  id: string;
  po_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  changed_by_name: string;
  changed_at: string;
  notes?: string;
}

/**
 * Create a mock PO Status History entry
 */
export function createMockPOStatusHistory(
  overrides?: Partial<POStatusHistory>
): POStatusHistory {
  return {
    id: 'history-001',
    po_id: 'po-001',
    old_status: null,
    new_status: 'draft',
    changed_by: 'user-001',
    changed_by_name: 'Test User',
    changed_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}
