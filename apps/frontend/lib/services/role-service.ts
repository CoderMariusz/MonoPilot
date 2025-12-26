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
  private static supabase = createClient()

  /**
   * Fetch all roles for the organization
   * AC-ROL-01: Returns all system roles sorted by display_order
   */
  static async getRoles(): Promise<{ data: Role[] | null; error: any }> {
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
      .from('roles')
      .select('*')
      .eq('code', code)
      .single()

    return { data, error }
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
  static parsePermissionLevel(level: string): PermissionLevel {
    if (level === '-') {
      return {
        view: false,
        create: false,
        update: false,
        delete: false,
      }
    }

    return {
      view: level.includes('R'),
      create: level.includes('C'),
      update: level.includes('U'),
      delete: level.includes('D'),
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
