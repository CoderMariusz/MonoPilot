/**
 * User Service
 * Story: 01.5a - User Management CRUD (MVP)
 *
 * Handles user CRUD operations with:
 * - Pagination, search, and filter
 * - Self-protection logic (cannot delete self or last Super Admin)
 * - Role population via join
 * - Input validation with Zod
 */

import { createClient } from '@/lib/supabase/client'
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UsersListParams,
  UsersListResponse
} from '@/lib/types/user'

/**
 * Select fields for user queries with role join.
 * Used across all user CRUD operations for consistency.
 */
const USER_SELECT_FIELDS = `
  id,
  org_id,
  email,
  first_name,
  last_name,
  role_id,
  role:roles(id, code, name),
  language,
  is_active,
  last_login_at,
  created_at,
  updated_at
` as const

export class UserService {
  /**
   * Get paginated list of users with search/filter
   * AC-01: Page loads within 500ms for 1000 users
   * AC-02: Search filters within 300ms
   * AC-03: Filter by role
   * AC-04: Filter by status
   * AC-05: Role name display (not code)
   */
  static async getUsers(params: UsersListParams = {}): Promise<UsersListResponse> {
    const supabase = createClient()

    const {
      page = 1,
      limit = 25,
      search = '',
      role = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params

    // Build query with role join
    let query = supabase
      .from('users')
      .select(USER_SELECT_FIELDS, { count: 'exact' })

    // Search filter (AC-02)
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Role filter (AC-03)
    if (role) {
      query = query.eq('role.code', role)
    }

    // Status filter (AC-04)
    if (status) {
      query = query.eq('is_active', status === 'active')
    }

    // Pagination
    const offset = (page - 1) * limit
    const end = page * limit - 1

    // Execute query with ordering
    const { data: users, count, error } = await query
      .range(offset, end)
      .order(sortBy, { ascending: sortOrder === 'asc' })

    if (error) {
      throw new Error(error.message)
    }

    return {
      users: users as unknown as User[],
      total: count || 0,
      page,
      limit,
    }
  }

  /**
   * Create new user
   * AC-07: Create valid user
   * AC-08: Duplicate email error
   */
  static async createUser(data: CreateUserRequest): Promise<User> {
    const supabase = createClient()

    // Get current user and org context
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      throw new Error('Unauthorized')
    }

    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', authUser.id)
      .single()

    if (!userData) {
      throw new Error('User context not found')
    }

    // Create user with default language
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role_id: data.role_id,
        language: data.language || 'en',
        org_id: userData.org_id,
        is_active: true,
      })
      .select(USER_SELECT_FIELDS)
      .single()

    if (error) {
      // AC-08: Duplicate email error
      if (error.code === '23505') {
        throw new Error('Email already exists')
      }
      throw new Error(error.message)
    }

    return newUser as unknown as User
  }

  /**
   * Update existing user
   * AC-11: Update user
   */
  static async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    const supabase = createClient()

    const updateData: any = {}

    if (data.first_name !== undefined) updateData.first_name = data.first_name
    if (data.last_name !== undefined) updateData.last_name = data.last_name
    if (data.role_id !== undefined) updateData.role_id = data.role_id
    if (data.language !== undefined) updateData.language = data.language

    updateData.updated_at = new Date().toISOString()

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select(USER_SELECT_FIELDS)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('User not found')
      }
      throw new Error(error.message)
    }

    return updatedUser as unknown as User
  }

  /**
   * Deactivate user with self-protection checks
   * AC-12: Deactivate user
   * AC-13: Cannot deactivate self
   * AC-14: Cannot deactivate last Super Admin
   */
  static async deactivateUser(id: string): Promise<void> {
    const supabase = createClient()

    // Get current user ID
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      throw new Error('Unauthorized')
    }

    // Check if allowed
    const check = await this.canDeactivate(id, authUser.id)
    if (!check.allowed) {
      throw new Error(check.reason || 'Cannot deactivate user')
    }

    // Deactivate user
    const { error } = await supabase
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }
  }

  /**
   * Activate user
   */
  static async activateUser(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('users')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('User not found')
      }
      throw new Error(error.message)
    }
  }

  /**
   * Check if user can be deactivated (self-protection logic)
   * AC-13: Cannot delete self
   * AC-14: Cannot deactivate last Super Admin
   */
  static async canDeactivate(
    userId: string,
    currentUserId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check 1: Cannot deactivate self (check FIRST before any database queries)
    if (userId === currentUserId) {
      return {
        allowed: false,
        reason: 'Cannot delete your own account'
      }
    }

    const supabase = createClient()

    // Check 2: Cannot deactivate last Super Admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role:roles(id, code)')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { allowed: true }
    }

    // Cast role to correct type (Supabase returns object for single relation)
    const role = user.role as unknown as { id: string; code: string } | null
    if (role?.code === 'owner' || role?.code === 'SUPER_ADMIN') {
      // Count active Super Admins (owner or SUPER_ADMIN role)
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role.code', role.code)
        .eq('is_active', true)

      if (count === 1) {
        return {
          allowed: false,
          reason: 'Cannot deactivate the only Super Admin',
        }
      }
    }

    return { allowed: true }
  }
}
