/**
 * User and Role Types
 * Story: 01.1 - Org Context + Base RLS
 */

export interface User {
  id: string
  org_id: string
  email: string
  first_name: string
  last_name: string
  role_id: string
  language: string
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

/**
 * Role: System role with JSONB permissions (ADR-012)
 */
export interface Role {
  id: string
  code: string
  name: string
  description?: string
  permissions: Record<string, string>
  is_system: boolean
  display_order?: number
  created_at: string
}
