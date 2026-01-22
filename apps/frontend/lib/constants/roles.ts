/**
 * Role Constants
 * Story: 01.1 - Org Context + Base RLS
 * ADR-012: 10 System Roles (seeded, immutable)
 */

/**
 * Admin roles that have full access to organization settings
 * Used for RLS policies and permission checks
 */
export const ADMIN_ROLES = ['owner', 'admin'] as const

/**
 * All system roles (10 roles per ADR-012)
 * These roles are seeded at database initialization and cannot be deleted
 */
export const SYSTEM_ROLES = [
  'owner',
  'admin',
  'production_manager',
  'quality_manager',
  'warehouse_manager',
  'production_operator',
  'warehouse_operator',
  'quality_inspector',
  'planner',
  'viewer',
] as const

/**
 * Warehouse elevated roles - can perform warehouse operations across the organization
 * Used for pick list management, inventory operations, and shipping workflows
 */
export const WAREHOUSE_ELEVATED_ROLES = [
  'warehouse',
  'warehouse_manager',
  'manager',
  'admin',
  'owner',
  'super_admin',
] as const

/**
 * Type helpers for role codes
 */
export type AdminRole = (typeof ADMIN_ROLES)[number]
export type SystemRole = (typeof SYSTEM_ROLES)[number]
export type WarehouseElevatedRole = (typeof WAREHOUSE_ELEVATED_ROLES)[number]
