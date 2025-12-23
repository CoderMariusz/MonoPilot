/**
 * Machine Service
 * Story: 01.10 - Machines CRUD
 * Purpose: Business logic for machine management operations
 *
 * Handles:
 * - CRUD operations (list, getById, create, update, delete)
 * - Status updates (ACTIVE, MAINTENANCE, OFFLINE, DECOMMISSIONED)
 * - Delete validation (line assignments, soft delete for WO history)
 * - Code uniqueness validation
 * - Location path building
 */

import { createClient } from '@/lib/supabase/client'
import type {
  Machine,
  CreateMachineInput,
  UpdateMachineInput,
  MachineListParams,
  PaginatedMachineResult,
  MachineValidationResult,
  CanDeleteMachineResult,
  MachineStatus,
} from '@/lib/types/machine'

export class MachineService {
  /**
   * List machines with search, filters, pagination
   * AC-ML-01: Page loads within 300ms
   * AC-ML-02: Filter by type (9 types)
   * AC-ML-03: Filter by status (4 statuses)
   * AC-ML-04: Search by code and name (< 200ms)
   */
  static async list(params: MachineListParams = {}): Promise<PaginatedMachineResult> {
    const supabase = createClient()

    // Build query
    let query = supabase
      .from('machines')
      .select(
        `
        *,
        location:locations(
          id,
          code,
          name,
          full_path,
          warehouse_id
        )
      `,
        { count: 'exact' }
      )
      .eq('is_deleted', false)

    // Apply search filter
    if (params.search) {
      query = query.or(`code.ilike.%${params.search}%,name.ilike.%${params.search}%`)
    }

    // Apply type filter
    if (params.type) {
      query = query.eq('type', params.type)
    }

    // Apply status filter
    if (params.status) {
      query = query.eq('status', params.status)
    }

    // Apply location filter
    if (params.location_id) {
      query = query.eq('location_id', params.location_id)
    }

    // Apply sorting
    const sortBy = params.sortBy || 'code'
    const sortOrder = params.sortOrder || 'asc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const page = params.page || 1
    const limit = params.limit || 25
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) {
      console.error('Failed to list machines:', error)
      throw new Error('Failed to fetch machines')
    }

    return {
      machines: data || [],
      total: count || 0,
      page,
      limit,
    }
  }

  /**
   * Get machine by ID
   * AC-09: Cross-tenant access returns 404 (not 403)
   */
  static async getById(id: string): Promise<Machine | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('machines')
      .select(
        `
        *,
        location:locations(
          id,
          code,
          name,
          full_path,
          warehouse_id
        )
      `
      )
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      console.error('Failed to fetch machine:', error)
      throw new Error('Failed to fetch machine')
    }

      return data
  }

  /**
   * Create new machine
   * AC-MC-02: Machine created with default status ACTIVE within 500ms
   * AC-MC-03: Duplicate code error displayed inline
   * AC-MC-04: All capacity values stored
   */
  static async create(data: CreateMachineInput): Promise<Machine> {
    const supabase = createClient()

    // Get current user for org_id and created_by
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      throw new Error('Failed to get user organization')
    }

    // Check code uniqueness
    const isUnique = await this.isCodeUnique(data.code)
    if (!isUnique) {
      throw new Error('Machine code must be unique')
    }

    // Insert machine
    const { data: machine, error } = await supabase
      .from('machines')
      .insert({
        ...data,
        org_id: userData.org_id,
        status: data.status || 'ACTIVE',
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create machine:', error)
      if (error.code === '23505') {
        throw new Error('Machine code must be unique')
      }
      throw new Error('Failed to create machine')
    }

    return machine
  }

  /**
   * Update existing machine
   * AC-ME-02: Updated name displays immediately in list
   */
  static async update(id: string, data: UpdateMachineInput): Promise<Machine> {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Check if machine exists
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error('Machine not found')
    }

    // Check code uniqueness if code is being changed
    if (data.code && data.code !== existing.code) {
      const isUnique = await this.isCodeUnique(data.code, id)
      if (!isUnique) {
        throw new Error('Machine code must be unique')
      }
    }

    // Update machine
    const { data: machine, error } = await supabase
      .from('machines')
      .update({
        ...data,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update machine:', error)
      if (error.code === '23505') {
        throw new Error('Machine code must be unique')
      }
      throw new Error('Failed to update machine')
    }

    return machine
  }

  /**
   * Update machine status only
   * Quick status change without full update
   */
  static async updateStatus(id: string, status: MachineStatus): Promise<Machine> {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Update status
    const { data: machine, error } = await supabase
      .from('machines')
      .update({
        status,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update machine status:', error)
      throw new Error('Failed to update machine status')
    }

    return machine
  }

  /**
   * Delete machine (with business rules)
   * AC-MD-01: Machine removed within 500ms (no line assignments)
   * AC-MD-02: Error if assigned to line: "Machine is assigned to line [LINE-001]. Remove from line first."
   * AC-MD-03: Soft-delete for historical WO references
   *
   * Business Rules:
   * - Cannot delete if assigned to production line
   * - Soft delete if has historical work order references
   * - Hard delete if no history and no assignments (prefer soft delete)
   */
  static async delete(id: string): Promise<void> {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Check if machine exists
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error('Machine not found')
    }

    // Check if can delete (line assignments)
    const deleteCheck = await this.canDelete(id)
    if (!deleteCheck.canDelete) {
      throw new Error(deleteCheck.reason || 'Cannot delete machine')
    }

    // Perform soft delete (always soft delete to preserve audit trail)
    const { error } = await supabase
      .from('machines')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', id)

    if (error) {
      console.error('Failed to delete machine:', error)
      throw new Error('Failed to delete machine')
    }
  }

  /**
   * Validate machine code uniqueness
   * Used for real-time validation in forms
   */
  static async isCodeUnique(code: string, excludeId?: string): Promise<boolean> {
    const supabase = createClient()

    // Get current user's org_id
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!userData) return false

    let query = supabase
      .from('machines')
      .select('id')
      .eq('org_id', userData.org_id)
      .eq('code', code.toUpperCase())
      .eq('is_deleted', false)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to check code uniqueness:', error)
      return false
    }

    return !data || data.length === 0
  }

  /**
   * Check if machine can be deleted
   * Business Rules:
   * - Cannot delete if assigned to production line
   * Returns { canDelete: boolean, reason?: string, lineCodes?: string[] }
   */
  static async canDelete(id: string): Promise<CanDeleteMachineResult> {
    const supabase = createClient()

    // Check for production line assignments
    // Note: production_line_machines table will be created in Story 01.11
    // For now, we'll do a simple check that always allows deletion
    // TODO: Implement line assignment check in Story 01.11

    // Check if production_line_machines table exists
    const { data: lineAssignments, error } = await supabase
      .from('production_line_machines')
      .select(
        `
        production_line:production_lines(code)
      `
      )
      .eq('machine_id', id)
      .limit(10)

    if (error) {
      // Table doesn't exist yet (Story 01.11), allow deletion
      if (error.code === '42P01') {
        return {
          canDelete: true,
        }
      }
      console.error('Failed to check line assignments:', error)
      return {
        canDelete: true,
      }
    }

    if (lineAssignments && lineAssignments.length > 0) {
      const lineCodes = lineAssignments
        .map((la: any) => la.production_line?.code)
        .filter(Boolean)

      const lineList = lineCodes.join(', ')
      const reason =
        lineCodes.length === 1
          ? `Machine is assigned to line [${lineList}]. Remove from line first.`
          : `Machine is assigned to lines [${lineList}]. Remove from lines first.`

      return {
        canDelete: false,
        reason,
        lineCodes,
      }
    }

    return {
      canDelete: true,
    }
  }

  /**
   * Get location path for machine
   * Builds hierarchical path from location full_path
   * Returns empty string if no location
   */
  static getLocationPath(machine: Machine): string {
    if (!machine.location || !machine.location.full_path) {
      return ''
    }
    return machine.location.full_path
  }
}
