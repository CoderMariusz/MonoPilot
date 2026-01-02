/**
 * Planning Settings Types
 * Story: 03.17 - Planning Settings (Module Configuration)
 *
 * TypeScript interfaces for planning settings (PO/TO/WO configuration).
 * Used by service layer, API routes, and frontend components.
 */

/**
 * Payment terms enum values
 * Used for default PO payment terms configuration
 */
export type PaymentTerms = 'Net 30' | 'Net 60' | 'Net 90' | '2/10 Net 30' | 'Due on Receipt';

/**
 * Currency enum values
 * Used for default PO currency configuration
 */
export type Currency = 'PLN' | 'EUR' | 'USD' | 'GBP';

/**
 * Planning Settings interface
 * Full database record structure for planning_settings table
 *
 * @property id - UUID primary key
 * @property org_id - Organization UUID (singleton per org)
 * @property po_* - Purchase Order settings (7 fields)
 * @property to_* - Transfer Order settings (5 fields)
 * @property wo_* - Work Order settings (9 fields)
 * @property created_at - Record creation timestamp
 * @property updated_at - Last update timestamp
 */
export interface PlanningSettings {
  id: string;
  org_id: string;

  // PO Settings (7 fields)
  po_require_approval: boolean;
  po_approval_threshold: number | null;
  po_approval_roles: string[];
  po_auto_number_prefix: string;
  po_auto_number_format: string;
  po_default_payment_terms: PaymentTerms;
  po_default_currency: Currency;

  // TO Settings (5 fields)
  to_allow_partial_shipments: boolean;
  to_require_lp_selection: boolean;
  to_auto_number_prefix: string;
  to_auto_number_format: string;
  to_default_transit_days: number;

  // WO Settings (9 fields)
  wo_material_check: boolean;
  wo_copy_routing: boolean;
  wo_auto_select_bom: boolean;
  wo_require_bom: boolean;
  wo_allow_overproduction: boolean;
  wo_overproduction_limit: number;
  wo_auto_number_prefix: string;
  wo_auto_number_format: string;
  wo_default_scheduling_buffer_hours: number;

  // Audit timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Planning Settings Response interface
 * Used for PATCH response with success message
 */
export interface PlanningSettingsResponse {
  success: boolean;
  message: string;
  settings: PlanningSettings;
}

/**
 * Planning Settings Update interface
 * Used for partial updates to planning settings (PO approval settings)
 * Story: 03.5a - PO Approval Setup
 */
export interface PlanningSettingsUpdate {
  po_require_approval?: boolean;
  po_approval_threshold?: number | null;
  po_approval_roles?: string[];
}

/**
 * Default values for planning settings
 */
export const PLANNING_SETTINGS_DEFAULTS: Omit<PlanningSettings, 'id' | 'org_id' | 'created_at' | 'updated_at'> = {
  // PO Settings
  po_require_approval: false,
  po_approval_threshold: null,
  po_approval_roles: ['admin', 'manager'],
  po_auto_number_prefix: 'PO-',
  po_auto_number_format: 'YYYY-NNNNN',
  po_default_payment_terms: 'Net 30',
  po_default_currency: 'PLN',

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
};

/**
 * Payment terms options
 */
export const PAYMENT_TERMS_OPTIONS = [
  { value: 'Net 30', label: 'Net 30' },
  { value: 'Net 60', label: 'Net 60' },
  { value: 'Net 90', label: 'Net 90' },
  { value: '2/10 Net 30', label: '2/10 Net 30' },
  { value: 'Due on Receipt', label: 'Due on Receipt' },
] as const;

/**
 * Currency options
 */
export const CURRENCY_OPTIONS = [
  { value: 'PLN', label: 'PLN' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
] as const;

/**
 * Approval roles options
 */
export const APPROVAL_ROLES_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Administrator' },
  { value: 'production_manager', label: 'Production Manager' },
  { value: 'quality_manager', label: 'Quality Manager' },
  { value: 'warehouse_manager', label: 'Warehouse Manager' },
  { value: 'planner', label: 'Planner' },
] as const;
