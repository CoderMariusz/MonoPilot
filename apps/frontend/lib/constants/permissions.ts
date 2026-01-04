/**
 * Permission Matrix & Role Definitions
 * Story: 01.6 - Role-Based Permissions (10 Roles)
 * ADR-014: Permission Matrix - 10 roles × 12 modules × 4 actions
 *
 * Permission Set Values:
 * - CRUD = Create, Read, Update, Delete (full access)
 * - CRU  = Create, Read, Update (no Delete)
 * - CR   = Create, Read (no Update/Delete)
 * - RU   = Read, Update (no Create/Delete)
 * - R    = Read only
 * - -    = No access
 */

import type { SystemRole } from './roles'

/**
 * Action types that can be granted in permissions
 */
export type Action = 'C' | 'R' | 'U' | 'D'

/**
 * All modules in the system
 */
export type Module =
  | 'settings'
  | 'users'
  | 'technical'
  | 'planning'
  | 'production'
  | 'quality'
  | 'warehouse'
  | 'shipping'
  | 'npd'
  | 'finance'
  | 'oee'
  | 'integrations'

/**
 * Permission set - combination of allowed actions or no access
 */
export type PermissionSet = 'CRUD' | 'CRU' | 'CR' | 'RU' | 'R' | '-'

/**
 * Role metadata
 */
export interface Role {
  name: string
  description: string
  display_order: number
  is_system: boolean
}

/**
 * Permissions for a single role
 */
export interface RolePermissions {
  modules: Record<Module, PermissionSet>
}

/**
 * Role definitions with metadata
 */
export const ROLES: Record<SystemRole, Role> = {
  owner: {
    name: 'Owner',
    description: 'Full access to all system features and settings',
    display_order: 1,
    is_system: true,
  },
  admin: {
    name: 'Administrator',
    description: 'Nearly full access; cannot delete settings',
    display_order: 2,
    is_system: true,
  },
  production_manager: {
    name: 'Production Manager',
    description: 'Manages production, planning, and quality; reads other modules',
    display_order: 3,
    is_system: true,
  },
  quality_manager: {
    name: 'Quality Manager',
    description: 'Manages quality; reads production and planning',
    display_order: 4,
    is_system: true,
  },
  warehouse_manager: {
    name: 'Warehouse Manager',
    description: 'Manages warehouse and shipping operations',
    display_order: 5,
    is_system: true,
  },
  production_operator: {
    name: 'Production Operator',
    description: 'Creates and updates work orders; limited quality access',
    display_order: 6,
    is_system: true,
  },
  quality_inspector: {
    name: 'Quality Inspector',
    description: 'Creates and updates inspections; reads production data',
    display_order: 7,
    is_system: true,
  },
  warehouse_operator: {
    name: 'Warehouse Operator',
    description: 'Manages warehouse inventory and shipping',
    display_order: 8,
    is_system: true,
  },
  planner: {
    name: 'Planner',
    description: 'Plans production; reads all operational data',
    display_order: 9,
    is_system: true,
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to all modules',
    display_order: 10,
    is_system: true,
  },
}

/**
 * Permission matrix: 10 roles × 12 modules
 * Defines what each role can do in each module
 */
export const PERMISSION_MATRIX: Record<SystemRole, RolePermissions> = {
  // Owner: Full access (CRUD) to all modules
  owner: {
    modules: {
      settings: 'CRUD',
      users: 'CRUD',
      technical: 'CRUD',
      planning: 'CRUD',
      production: 'CRUD',
      quality: 'CRUD',
      warehouse: 'CRUD',
      shipping: 'CRUD',
      npd: 'CRUD',
      finance: 'CRUD',
      oee: 'CRUD',
      integrations: 'CRUD',
    },
  },

  // Admin: CRU (no Delete) on settings, CRUD on everything else
  admin: {
    modules: {
      settings: 'CRU', // No Delete on settings
      users: 'CRUD',
      technical: 'CRUD',
      planning: 'CRUD',
      production: 'CRUD',
      quality: 'CRUD',
      warehouse: 'CRUD',
      shipping: 'CRUD',
      npd: 'CRUD',
      finance: 'CRUD',
      oee: 'CRUD',
      integrations: 'CRUD',
    },
  },

  // Production Manager: CRUD on production/planning/quality/oee, limited read on others
  production_manager: {
    modules: {
      settings: 'R',
      users: 'R',
      technical: 'RU',
      planning: 'CRUD',
      production: 'CRUD',
      quality: 'CRUD',
      warehouse: 'RU',
      shipping: 'R',
      npd: 'R',
      finance: 'R',
      oee: 'CRUD',
      integrations: 'R',
    },
  },

  // Quality Manager: CRUD on quality, RU on production/npd, read on rest
  quality_manager: {
    modules: {
      settings: 'R',
      users: 'R',
      technical: 'R',
      planning: 'R',
      production: 'RU',
      quality: 'CRUD',
      warehouse: 'R',
      shipping: 'R',
      npd: 'RU',
      finance: '-',
      oee: 'R',
      integrations: '-',
    },
  },

  // Warehouse Manager: CRUD on warehouse/shipping, read on most others, no finance/npd/oee/integrations
  warehouse_manager: {
    modules: {
      settings: 'R',
      users: 'R',
      technical: 'R',
      planning: 'R',
      production: 'R',
      quality: 'R',
      warehouse: 'CRUD',
      shipping: 'CRUD',
      npd: '-',
      finance: '-',
      oee: '-',
      integrations: '-',
    },
  },

  // Production Operator: RU on production, CR on quality, read on technical/planning/warehouse/oee
  production_operator: {
    modules: {
      settings: '-',
      users: '-',
      technical: 'R',
      planning: 'R',
      production: 'RU',
      quality: 'CR',
      warehouse: 'R',
      shipping: '-',
      npd: '-',
      finance: '-',
      oee: 'R',
      integrations: '-',
    },
  },

  // Quality Inspector: CRU on quality, read production, no access to settings/planning/shipping/premium
  quality_inspector: {
    modules: {
      settings: '-',
      users: '-',
      technical: 'R',
      planning: '-',
      production: 'R',
      quality: 'CRU',
      warehouse: 'R',
      shipping: 'R',
      npd: '-',
      finance: '-',
      oee: '-',
      integrations: '-',
    },
  },

  // Warehouse Operator: CRU on warehouse, RU on shipping, read technical/quality
  warehouse_operator: {
    modules: {
      settings: '-',
      users: '-',
      technical: 'R',
      planning: '-',
      production: '-',
      quality: 'R',
      warehouse: 'CRU',
      shipping: 'RU',
      npd: '-',
      finance: '-',
      oee: '-',
      integrations: '-',
    },
  },

  // Planner: CRUD on planning, read most others except integrations
  planner: {
    modules: {
      settings: 'R',
      users: 'R',
      technical: 'R',
      planning: 'CRUD',
      production: 'R',
      quality: 'R',
      warehouse: 'R',
      shipping: 'R',
      npd: 'R',
      finance: 'R',
      oee: 'R',
      integrations: '-',
    },
  },

  // Viewer: Read-only (R) on all modules
  viewer: {
    modules: {
      settings: 'R',
      users: 'R',
      technical: 'R',
      planning: 'R',
      production: 'R',
      quality: 'R',
      warehouse: 'R',
      shipping: 'R',
      npd: 'R',
      finance: 'R',
      oee: 'R',
      integrations: 'R',
    },
  },
}

/**
 * Check if a permission set includes a specific action
 */
export function hasAction(permissionSet: PermissionSet, action: Action): boolean {
  if (permissionSet === '-') return false
  return permissionSet.includes(action)
}

/**
 * Get all actions in a permission set
 */
export function getActions(permissionSet: PermissionSet): Action[] {
  if (permissionSet === '-') return []
  if (permissionSet === 'CRUD') return ['C', 'R', 'U', 'D']
  if (permissionSet === 'CRU') return ['C', 'R', 'U']
  if (permissionSet === 'CR') return ['C', 'R']
  if (permissionSet === 'RU') return ['R', 'U']
  if (permissionSet === 'R') return ['R']
  return []
}

/**
 * Check if user with role has permission for module/action
 */
export function canAccess(
  role: SystemRole,
  module: Module,
  action: Action
): boolean {
  const rolePerms = PERMISSION_MATRIX[role]
  if (!rolePerms) return false

  const permSet = rolePerms.modules[module]
  if (!permSet) return false

  return hasAction(permSet, action)
}

/**
 * Get human-readable action name
 */
export function getActionName(action: Action): string {
  switch (action) {
    case 'C':
      return 'Create'
    case 'R':
      return 'Read'
    case 'U':
      return 'Update'
    case 'D':
      return 'Delete'
    default:
      return 'Unknown'
  }
}

/**
 * Get human-readable module name
 */
export function getModuleName(module: Module): string {
  const names: Record<Module, string> = {
    settings: 'Settings',
    users: 'Users',
    technical: 'Technical',
    planning: 'Planning',
    production: 'Production',
    quality: 'Quality',
    warehouse: 'Warehouse',
    shipping: 'Shipping',
    npd: 'New Product Development',
    finance: 'Finance',
    oee: 'Overall Equipment Effectiveness',
    integrations: 'Integrations',
  }
  return names[module]
}
