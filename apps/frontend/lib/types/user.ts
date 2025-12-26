/**
 * User and Role Types
 * Story: 01.1 - Org Context + Base RLS
 * Updated: Story 01.5a - Added role and warehouse_access_ids
 */

export interface User {
  id: string
  org_id: string
  email: string
  first_name: string
  last_name: string
  role_id: string
  role?: Role // Populated via join
  language: string
  is_active: boolean
  last_login_at?: string | null
  warehouse_access_ids?: string[] | null // NULL in MVP (Story 01.5b)
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

/**
 * CreateUserRequest: Payload for creating a new user (Story 01.5a)
 * Supports both role (code) and role_id (UUID) - API resolves code to UUID
 */
export interface CreateUserRequest {
  email: string
  first_name: string
  last_name: string
  role?: string    // Role code (e.g., 'admin', 'viewer')
  role_id?: string // Role UUID (alternative to role code)
  language?: string
}

/**
 * UpdateUserRequest: Payload for updating user (Story 01.5a)
 * Supports both role (code) and role_id (UUID) - API resolves code to UUID
 */
export interface UpdateUserRequest {
  first_name?: string
  last_name?: string
  role?: string    // Role code (e.g., 'admin', 'viewer')
  role_id?: string // Role UUID (alternative to role code)
  language?: string
}

/**
 * UsersListParams: Query params for user list (Story 01.5a)
 */
export interface UsersListParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: 'active' | 'inactive'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * UsersListResponse: Response for user list (Story 01.5a)
 */
export interface UsersListResponse {
  users: User[]
  total: number
  page: number
  limit: number
}

/**
 * UserFilters: Filter state for user list (Story 01.5a)
 */
export interface UserFilters {
  role?: string
  status?: 'active' | 'inactive'
}
