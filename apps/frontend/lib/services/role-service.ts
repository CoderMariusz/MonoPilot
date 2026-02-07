/**
 * Role Service
 * Story: TD-003 - Roles & Permissions Page
 *
 * Service layer for fetching system roles and permissions.
 * Roles are global reference data (no org_id filtering).
 */

import { createClient } from '@/lib/supabase/client'

export interface Role {
  id: string
  code: string
  name: string
  description: string | null
  permissions: Record<string, string>
  is_system: boolean
  display_order: number | null
  created_at: string
}

export interface Module {
  code: string
  name: string
  category: 'Core' | 'Premium'
}

export interface PermissionLevel {
  view: boolean
  create: boolean
  update: boolean
  delete: boolean
}

export class RoleService {
  /**
   * Get Supabase client instance (lazy initialization)
   */
  private static getSupabase() {
    return createClient()
  }

  /**
   * Fetch all roles for the organization
   * AC-ROL-01: Returns all system roles sorted by display_order
   */
  static async getRoles(): Promise<{ data: Role[] | null; error: any }> {
    const supabase = this.getSupabase()
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('is_system', true)
      .order('display_order', { ascending: true })

    return { data, error }
  }

  /**
   * Get role by code
   * AC-ROL-02: Returns single role by code
   */
  static async getRoleByCode(code: string): Promise<{ data: Role | null; error: any }> {
    const supabase = this.getSupabase()
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('code', code)
      .single()

    return { data, error }
  }

  /**
   * Convert permission object to string notation
   * Handles both string notation ("CRUD") and object notation ({read, create, update, delete})
   */
  static permissionToString(permission: any): string {
    // Already a string
    if (typeof permission === 'string') {
      return permission
    }

    // Null/undefined
    if (!permission) {
      return '-'
    }

    // Object notation {read, create, update, delete} or {view, create, update, delete}
    if (typeof permission === 'object') {
      const read = permission.read ?? permission.view ?? false
      const create = permission.create ?? false
      const update = permission.update ?? false
      const del = permission.delete ?? false

      if (!read && !create && !update && !del) {
        return '-'
      }

      let result = ''
      if (create) result += 'C'
      if (read) result += 'R'
      if (update) result += 'U'
      if (del) result += 'D'
      return result || '-'
    }

    return '-'
  }

  /**
   * Parse permission level string to boolean flags
   * Converts "CRUD" notation to object with view/create/update/delete flags
   *
   * Examples:
   * - "CRUD" → { view: true, create: true, update: true, delete: true }
   * - "CRU" → { view: true, create: true, update: true, delete: false }
   * - "RU" → { view: true, create: false, update: true, delete: false }
   * - "R" → { view: true, create: false, update: false, delete: false }
   * - "-" → { view: false, create: false, update: false, delete: false }
   */
  static parsePermissionLevel(level: string | any): PermissionLevel {
    // Convert to string if it's an object
    const levelStr = this.permissionToString(level)
    
    // Handle null/undefined/empty or "-"
    if (!levelStr || levelStr === '-') {
      return {
        view: false,
        create: false,
        update: false,
        delete: false,
      }
    }

    return {
      view: levelStr.includes('R'),
      create: levelStr.includes('C'),
      update: levelStr.includes('U'),
      delete: levelStr.includes('D'),
    }
  }

  /**
   * Get module definitions
   * AC-ROL-03: Returns all 12 modules organized by category
   */
  static getModules(): Module[] {
    return [
      // Core Modules (8) - matches seed data
      { code: 'settings', name: 'Settings', category: 'Core' },
      { code: 'users', name: 'Users', category: 'Core' },
      { code: 'technical', name: 'Technical', category: 'Core' },
      { code: 'planning', name: 'Planning', category: 'Core' },
      { code: 'production', name: 'Production', category: 'Core' },
      { code: 'warehouse', name: 'Warehouse', category: 'Core' },
      { code: 'quality', name: 'Quality', category: 'Core' },
      { code: 'shipping', name: 'Shipping', category: 'Core' },
      // Premium Modules (4) - matches seed data
      { code: 'npd', name: 'NPD', category: 'Premium' },
      { code: 'finance', name: 'Finance', category: 'Premium' },
      { code: 'oee', name: 'OEE', category: 'Premium' },
      { code: 'integrations', name: 'Integrations', category: 'Premium' },
    ]
  }

  /**
   * Generate CSV export of permission matrix
   * AC-ROL-04: Exports roles × modules matrix as CSV
   *
   * Format:
   * Role,Settings,Technical,Planning,...
   * Owner,CRUD,CRUD,CRUD,...
   * Admin,CRU,CRUD,CRUD,...
   */
  static generatePermissionCSV(roles: Role[]): string {
    const modules = this.getModules()
    const header = ['Role', ...modules.map((m) => m.name)].join(',')

    const rows = roles.map((role) => {
      const permissions = role.permissions as Record<string, string>
      const cells = [role.name, ...modules.map((m) => permissions[m.code] || '-')]
      return cells.join(',')
    })

    return [header, ...rows].join('\n')
  }

  /**
   * Get permission display label
   * AC-ROL-05: Returns human-readable permission label
   *
   * Examples:
   * - "CRUD" → "Full Access"
   * - "CRU" → "No Delete"
   * - "RU" → "Read & Update"
   * - "R" → "Read Only"
   * - "-" → "No Access"
   */
  static getPermissionLabel(level: string): string {
    // Handle null/undefined/non-string values
    if (!level || typeof level !== 'string') return 'No Access'
    
    if (level === 'CRUD') return 'Full Access'
    if (level === 'CRU') return 'No Delete'
    if (level === 'CR') return 'Create & Read'
    if (level === 'RU') return 'Read & Update'
    if (level === 'R') return 'Read Only'
    if (level === '-') return 'No Access'
    return level // Fallback to raw value
  }

  /**
   * Get permission display icon
   * AC-ROL-06: Returns icon for permission level
   */
  static getPermissionIcon(level: string): string {
    if (level === '-') return '✗'
    if (level.includes('R')) return '✓'
    return '✗'
  }
}
