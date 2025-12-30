/**
 * Production Line Service
 * Story: 01.11 - Production Lines CRUD
 * Purpose: CRUD operations, machine assignment, capacity calculation, sequence management
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type {
  ProductionLine,
  CreateProductionLineInput,
  UpdateProductionLineInput,
  ProductionLineListParams,
  PaginatedProductionLineResult,
  CapacityResult,
  MachineOrder,
  LineMachine,
  Product,
} from '@/lib/types/production-line'

export class ProductionLineService {
  /**
   * List production lines with filters, search, and pagination
   */
  static async list(
    params: ProductionLineListParams = {},
    supabaseClient?: SupabaseClient
  ): Promise<{ success: boolean; data?: ProductionLine[]; total?: number; page?: number; limit?: number; error?: string }> {
    try {
      const supabase = supabaseClient || createClient()
      const {
        warehouse_id,
        status,
        search,
        page = 1,
        limit = 25,
      } = params

      // Build query
      let query = supabase
        .from('production_lines')
        .select(`
          *,
          warehouse:warehouses(id, code, name),
          machines:production_line_machines(
            machine:machines(
              id,
              code,
              name,
              status,
              units_per_hour
            ),
            sequence_order
          ),
          compatible_products:production_line_products(
            product:products(id, code, name)
          )
        `, { count: 'exact' })

      // Apply filters
      if (warehouse_id) {
        query = query.eq('warehouse_id', warehouse_id)
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (search) {
        query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
      }

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      // Order
      query = query.order('code', { ascending: true })

      const { data, error, count } = await query

      if (error) throw error

      // Transform data
      const lines = data?.map((line: any) => ({
        ...line,
        machines: line.machines
          ?.map((m: any) => ({
            ...m.machine,
            sequence_order: m.sequence_order,
          }))
          .sort((a: any, b: any) => a.sequence_order - b.sequence_order) || [],
        compatible_products: line.compatible_products?.map((p: any) => p.product) || [],
        ...this.calculateBottleneckCapacity(
          line.machines?.map((m: any) => ({
            ...m.machine,
            sequence_order: m.sequence_order,
          })) || []
        ),
      }))

      return {
        success: true,
        data: lines || [],
        total: count || 0,
        page,
        limit,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list production lines',
      }
    }
  }

  /**
   * Get production line by ID with machines and capacity
   */
  static async getById(id: string, supabaseClient?: SupabaseClient): Promise<{ success: boolean; data?: ProductionLine; error?: string }> {
    try {
      const supabase = supabaseClient || createClient()

      const { data, error } = await supabase
        .from('production_lines')
        .select(`
          *,
          warehouse:warehouses(id, code, name),
          machines:production_line_machines(
            machine:machines(
              id,
              code,
              name,
              status,
              units_per_hour
            ),
            sequence_order
          ),
          compatible_products:production_line_products(
            product:products(id, code, name)
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Line not found' }
        }
        throw error
      }

      // Transform data
      const machines = data.machines
        ?.map((m: any) => ({
          ...m.machine,
          sequence_order: m.sequence_order,
        }))
        .sort((a: any, b: any) => a.sequence_order - b.sequence_order) || []

      const capacityData = this.calculateBottleneckCapacity(machines)

      const line: ProductionLine = {
        ...data,
        machines,
        compatible_products: data.compatible_products?.map((p: any) => p.product) || [],
        calculated_capacity: capacityData.capacity,
        bottleneck_machine_id: capacityData.bottleneck_machine_id,
        bottleneck_machine_code: capacityData.bottleneck_machine_code,
      }

      return { success: true, data: line }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get production line',
      }
    }
  }

  /**
   * Create new production line with machines and products
   */
  static async create(
    input: CreateProductionLineInput,
    supabaseClient?: SupabaseClient
  ): Promise<{ success: boolean; data?: ProductionLine; error?: string }> {
    try {
      const supabase = supabaseClient || createClient()

      // Get current user's org_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const { data: userData } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single()

      if (!userData) throw new Error('User not found')

      const org_id = userData.org_id

      // Check code uniqueness
      const isUnique = await this.isCodeUnique(input.code.toUpperCase(), undefined, supabase)
      if (!isUnique) {
        throw new Error('Line code must be unique')
      }

      // Create line
      const { data: lineData, error: lineError } = await supabase
        .from('production_lines')
        .insert({
          org_id,
          code: input.code.toUpperCase(),
          name: input.name,
          description: input.description || null,
          warehouse_id: input.warehouse_id,
          default_output_location_id: input.default_output_location_id || null,
          status: input.status || 'active',
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single()

      if (lineError) throw lineError

      // Assign machines
      if (input.machine_ids && input.machine_ids.length > 0) {
        const machineAssignments = input.machine_ids.map((machine_id, index) => ({
          org_id,
          line_id: lineData.id,
          machine_id,
          sequence_order: index + 1,
        }))

        const { error: machineError } = await supabase
          .from('production_line_machines')
          .insert(machineAssignments)

        if (machineError) throw machineError
      }

      // Assign products
      if (input.product_ids && input.product_ids.length > 0) {
        const productAssignments = input.product_ids.map((product_id) => ({
          org_id,
          line_id: lineData.id,
          product_id,
        }))

        const { error: productError } = await supabase
          .from('production_line_products')
          .insert(productAssignments)

        if (productError) throw productError
      }

      // Fetch full line data
      return await this.getById(lineData.id)
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create production line',
      }
    }
  }

  /**
   * Update existing production line
   */
  static async update(
    id: string,
    input: UpdateProductionLineInput,
    supabaseClient?: SupabaseClient
  ): Promise<{ success: boolean; data?: ProductionLine; error?: string }> {
    try {
      const supabase = supabaseClient || createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Get current line
      const { data: currentLine } = await supabase
        .from('production_lines')
        .select('code, org_id')
        .eq('id', id)
        .single()

      if (!currentLine) throw new Error('Line not found')

      // Check code change with work orders
      if (input.code && input.code.toUpperCase() !== currentLine.code) {
        const hasWorkOrders = await this.hasWorkOrders(id, supabase)
        if (hasWorkOrders) {
          throw new Error('Code cannot be changed while work orders exist')
        }

        // Check uniqueness
        const isUnique = await this.isCodeUnique(input.code.toUpperCase(), id, supabase)
        if (!isUnique) {
          throw new Error('Line code must be unique')
        }
      }

      // Build update data
      const updateData: any = {
        updated_by: user.id,
      }

      if (input.code) updateData.code = input.code.toUpperCase()
      if (input.name) updateData.name = input.name
      if (input.description !== undefined) updateData.description = input.description
      if (input.warehouse_id) updateData.warehouse_id = input.warehouse_id
      if (input.default_output_location_id !== undefined) {
        updateData.default_output_location_id = input.default_output_location_id
      }
      if (input.status) updateData.status = input.status

      // Update line
      const { error: updateError } = await supabase
        .from('production_lines')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      // Update machines if provided
      if (input.machine_ids !== undefined) {
        // Delete existing assignments
        await supabase
          .from('production_line_machines')
          .delete()
          .eq('line_id', id)

        // Insert new assignments
        if (input.machine_ids.length > 0) {
          const machineAssignments = input.machine_ids.map((machine_id, index) => ({
            org_id: currentLine.org_id,
            line_id: id,
            machine_id,
            sequence_order: index + 1,
          }))

          await supabase
            .from('production_line_machines')
            .insert(machineAssignments)
        }
      }

      // Update products if provided
      if (input.product_ids !== undefined) {
        // Delete existing assignments
        await supabase
          .from('production_line_products')
          .delete()
          .eq('line_id', id)

        // Insert new assignments
        if (input.product_ids.length > 0) {
          const productAssignments = input.product_ids.map((product_id) => ({
            org_id: currentLine.org_id,
            line_id: id,
            product_id,
          }))

          await supabase
            .from('production_line_products')
            .insert(productAssignments)
        }
      }

      // Fetch updated line
      return await this.getById(id)
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update production line',
      }
    }
  }

  /**
   * Delete production line (blocked if work orders exist)
   */
  static async delete(id: string, supabaseClient?: SupabaseClient): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = supabaseClient || createClient()

      // Check work orders
      const hasWorkOrders = await this.hasWorkOrders(id, supabase)
      if (hasWorkOrders) {
        throw new Error('Line has active work orders')
      }

      // Delete line (CASCADE will handle junction tables)
      const { error } = await supabase
        .from('production_lines')
        .delete()
        .eq('id', id)

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Line not found')
        }
        throw error
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete production line',
      }
    }
  }

  /**
   * Reorder machines in production line
   */
  static async reorderMachines(
    lineId: string,
    machineOrders: MachineOrder[],
    supabaseClient?: SupabaseClient
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate sequences (no gaps, no duplicates)
      const sequences = machineOrders.map((m) => m.sequence_order).sort((a, b) => a - b)
      const expectedSequences = Array.from({ length: sequences.length }, (_, i) => i + 1)

      if (JSON.stringify(sequences) !== JSON.stringify(expectedSequences)) {
        throw new Error('Invalid sequence (gaps or duplicates)')
      }

      const supabase = supabaseClient || createClient()

      // Update each machine's sequence
      for (const order of machineOrders) {
        const { error } = await supabase
          .from('production_line_machines')
          .update({ sequence_order: order.sequence_order })
          .eq('line_id', lineId)
          .eq('machine_id', order.machine_id)

        if (error) throw error
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to reorder machines',
      }
    }
  }

  /**
   * Check if code is unique (org-scoped)
   */
  static async isCodeUnique(code: string, excludeId?: string, supabaseClient?: SupabaseClient): Promise<boolean> {
    try {
      const supabase = supabaseClient || createClient()

      let query = supabase
        .from('production_lines')
        .select('id')
        .eq('code', code.toUpperCase())

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data } = await query.single()

      return !data
    } catch (error) {
      // PGRST116 = no rows returned = code is unique
      return true
    }
  }

  /**
   * Calculate bottleneck capacity (MIN of all machine capacities)
   */
  static calculateBottleneckCapacity(machines: LineMachine[]): CapacityResult {
    const machinesWithCapacity = machines.filter(
      (m) => m.units_per_hour !== null && m.units_per_hour > 0
    )

    if (machinesWithCapacity.length === 0) {
      return {
        capacity: null,
        bottleneck_machine_id: null,
        bottleneck_machine_code: null,
        machines_without_capacity: machines.map((m) => m.code),
      }
    }

    const bottleneck = machinesWithCapacity.reduce((min, m) =>
      m.units_per_hour! < min.units_per_hour! ? m : min
    )

    return {
      capacity: bottleneck.units_per_hour,
      bottleneck_machine_id: bottleneck.id,
      bottleneck_machine_code: bottleneck.code,
      machines_without_capacity: machines
        .filter((m) => !m.units_per_hour || m.units_per_hour <= 0)
        .map((m) => m.code),
    }
  }

  /**
   * Renumber sequences (auto 1, 2, 3... no gaps)
   */
  static renumberSequences(machines: { id: string }[]): MachineOrder[] {
    return machines.map((machine, index) => ({
      machine_id: machine.id,
      sequence_order: index + 1,
    }))
  }

  /**
   * Check if production line has work orders
   * @private
   */
  private static async hasWorkOrders(lineId: string, supabaseClient?: SupabaseClient): Promise<boolean> {
    try {
      const supabase = supabaseClient || createClient()

      // Check work_orders table (will be created in Epic 04)
      // For now, return false (no work orders)
      // TODO: Implement when work_orders table exists
      const { data } = await supabase
        .from('work_orders')
        .select('id')
        .eq('production_line_id', lineId)
        .limit(1)
        .single()

      return !!data
    } catch (error) {
      // Table doesn't exist yet or no work orders
      return false
    }
  }
}

// Export individual functions for compatibility with existing tests
export const list = ProductionLineService.list.bind(ProductionLineService)
export const getById = ProductionLineService.getById.bind(ProductionLineService)
export const create = ProductionLineService.create.bind(ProductionLineService)
export const update = ProductionLineService.update.bind(ProductionLineService)
export const deleteProductionLine = ProductionLineService.delete.bind(ProductionLineService)
export const reorderMachines = ProductionLineService.reorderMachines.bind(ProductionLineService)
export const isCodeUnique = ProductionLineService.isCodeUnique.bind(ProductionLineService)
export const calculateBottleneckCapacity = ProductionLineService.calculateBottleneckCapacity.bind(ProductionLineService)
export const renumberSequences = ProductionLineService.renumberSequences.bind(ProductionLineService)

// Aliases for API routes
export const getProductionLineById = getById
export const updateProductionLine = update
export const createProductionLine = create
export const listProductionLines = list
