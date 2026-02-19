/**
 * Audit Log Types
 * Story: 01.17 - Audit Trail
 *
 * TypeScript types and interfaces for audit log management.
 * Includes database entity types, API input/output types, and constants.
 *
 * @module audit-log-types
 */

/**
 * Audit log action types
 * - CREATE: New entity created
 * - UPDATE: Entity updated
 * - DELETE: Entity deleted
 * - LOGIN: User login event
 */
export type AuditLogAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN'

/**
 * Action type labels (for UI display)
 */
export const AUDIT_LOG_ACTION_LABELS: Record<AuditLogAction, string> = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  LOGIN: 'Login',
}

/**
 * Action type colors (for UI badge styling)
 * CREATE=green, UPDATE=blue, DELETE=red, LOGIN=gray
 */
export const AUDIT_LOG_ACTION_COLORS: Record<AuditLogAction, { bg: string; text: string }> = {
  CREATE: { bg: 'bg-green-100', text: 'text-green-800' },
  UPDATE: { bg: 'bg-blue-100', text: 'text-blue-800' },
  DELETE: { bg: 'bg-red-100', text: 'text-red-800' },
  LOGIN: { bg: 'bg-gray-100', text: 'text-gray-800' },
}

/**
 * User reference (from users table)
 */
export interface AuditLogUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}

/**
 * Audit Log entity matching the database schema.
 * Represents a single audit log entry for entity changes.
 */
export interface AuditLog {
  /** UUID primary key */
  id: string
  /** Organization ID for multi-tenant isolation */
  org_id: string
  /** Type of entity that was changed (e.g., 'product', 'work_order') */
  entity_type: string
  /** ID of the entity that was changed */
  entity_id: string
  /** Action performed (CREATE, UPDATE, DELETE, LOGIN) */
  action: AuditLogAction
  /** User who performed the action */
  user_id: string
  /** User details (joined from users table) */
  user?: AuditLogUser | null
  /** Previous values (for UPDATE/DELETE) */
  old_value: Record<string, unknown> | null
  /** New values (for CREATE/UPDATE) */
  new_value: Record<string, unknown> | null
  /** Timestamp of the action */
  created_at: string
  /** IP address of the user (optional) */
  ip_address?: string | null
  /** User agent string (optional) */
  user_agent?: string | null
}

/**
 * Filters for audit log queries
 */
export interface AuditLogFilters {
  /** Full-text search across entity data */
  search?: string
  /** Filter by user ID(s) */
  user_id?: string[]
  /** Filter by action type(s) */
  action?: AuditLogAction[]
  /** Filter by entity type(s) */
  entity_type?: string[]
  /** Filter by start date (ISO 8601) */
  date_from?: string
  /** Filter by end date (ISO 8601) */
  date_to?: string
}

/**
 * Query parameters for audit log list
 */
export interface AuditLogListParams extends AuditLogFilters {
  /** Page number (1-based) */
  page?: number
  /** Number of items per page */
  limit?: number
  /** Offset for pagination (alternative to page) */
  offset?: number
}

/**
 * Paginated result for audit log queries
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

/**
 * CSV export options
 */
export interface AuditLogExportOptions {
  /** Filters to apply to export */
  filters?: AuditLogFilters
  /** Maximum number of records to export (0 = no limit) */
  maxRecords?: number
}

/**
 * Common entity types that appear in audit logs
 */
export const COMMON_ENTITY_TYPES = [
  'product',
  'bom',
  'routing',
  'work_order',
  'purchase_order',
  'sales_order',
  'transfer_order',
  'license_plate',
  'location',
  'warehouse',
  'machine',
  'production_line',
  'user',
  'role',
  'supplier',
  'customer',
  'quality_hold',
  'ncr',
  'specification',
] as const

export type CommonEntityType = typeof COMMON_ENTITY_TYPES[number]
