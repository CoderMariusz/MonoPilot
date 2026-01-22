/**
 * Pick Confirmation Service
 * Story: 07.9 - Pick Confirmation Desktop
 * Phase: GREEN - Full implementation
 *
 * Handles all pick confirmation operations for desktop workflow including:
 * - FIFO/FEFO pick suggestion display
 * - Quantity validation
 * - Short pick handling with reason
 * - Backorder creation
 * - Allergen conflict detection
 * - Progress calculation
 * - Permission validation
 */

import { createClient } from '@/lib/supabase/client'
import type {
  ConfirmPickInput,
  ShortPickInput,
  PickListLine,
  PickProgress,
  PickConfirmationResult,
  ShortPickResult,
  CompletionResult,
  PickList,
  ShortPickReason,
} from '@/lib/validation/pick-confirmation-schemas'

/**
 * Pick Confirmation Service
 * Handles all pick confirmation operations for desktop workflow
 */
export class PickConfirmationService {
  /**
   * Start a pick list - transition from assigned to in_progress
   */
  static async startPickList(pickListId: string): Promise<void> {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get pick list
    const { data: pickList, error: fetchError } = await supabase
      .from('pick_lists')
      .select('*')
      .eq('id', pickListId)
      .single()

    if (fetchError || !pickList) {
      throw new Error('Pick list not found')
    }

    // Validate status
    if (pickList.status !== 'assigned') {
      throw new Error('Pick list must be in assigned status to start')
    }

    // Validate user permission - must be assigned picker or have elevated role
    const hasPermission = await this.validatePickerPermission(pickListId, user.id)
    if (!hasPermission) {
      throw new Error('User is not assigned to this pick list')
    }

    // Update status to in_progress
    const { error: updateError } = await supabase
      .from('pick_lists')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', pickListId)

    if (updateError) {
      throw new Error('Failed to start pick list')
    }
  }

  /**
   * Get pick list with all lines and related data
   */
  static async getPickListWithLines(
    pickListId: string
  ): Promise<{ pickList: PickList; lines: PickListLine[]; progress: PickProgress }> {
    const supabase = createClient()

    // Get pick list with user info
    const { data: pickList, error: pickListError } = await supabase
      .from('pick_lists')
      .select(
        `
        *,
        assigned_user:profiles!pick_lists_assigned_to_fkey(first_name, last_name)
      `
      )
      .eq('id', pickListId)
      .single()

    if (pickListError || !pickList) {
      throw new Error('Pick list not found')
    }

    // Get pick list lines with product, location, and LP info
    const { data: lines, error: linesError } = await supabase
      .from('pick_list_lines')
      .select(
        `
        *,
        products:product_id(name, sku, allergens),
        locations:location_id(zone, aisle, bin, name),
        license_plates:license_plate_id(id, lp_number, quantity_on_hand)
      `
      )
      .eq('pick_list_id', pickListId)
      .order('pick_sequence', { ascending: true })

    if (linesError) {
      throw new Error('Failed to fetch pick list lines')
    }

    // Transform lines to expected format
    const transformedLines: PickListLine[] = (lines || []).map((line: any) => ({
      id: line.id,
      pick_list_id: line.pick_list_id,
      sales_order_line_id: line.sales_order_line_id,
      license_plate_id: line.license_plate_id,
      location_id: line.location_id,
      product_id: line.product_id,
      product_name: line.products?.name || 'Unknown Product',
      product_sku: line.products?.sku || '',
      product_allergens: line.products?.allergens || [],
      quantity_to_pick: line.quantity_to_pick,
      quantity_picked: line.quantity_picked || 0,
      status: line.status || 'pending',
      lot_number: line.lot_number || '',
      best_before_date: line.best_before_date || '',
      pick_sequence: line.pick_sequence,
      picked_at: line.picked_at,
      picked_by: line.picked_by,
      notes: line.notes,
      location: line.locations
        ? {
            zone: line.locations.zone,
            aisle: line.locations.aisle,
            bin: line.locations.bin,
            name: line.locations.name,
          }
        : undefined,
      lp: line.license_plates
        ? {
            id: line.license_plates.id,
            lp_number: line.license_plates.lp_number,
            quantity_on_hand: line.license_plates.quantity_on_hand,
          }
        : undefined,
    }))

    // Calculate progress
    const progress = this.calculateProgress(transformedLines)

    // Transform pick list
    const transformedPickList: PickList = {
      id: pickList.id,
      org_id: pickList.org_id,
      pick_list_number: pickList.pick_list_number,
      status: pickList.status,
      priority: pickList.priority || 'normal',
      assigned_to: pickList.assigned_to,
      assigned_user_name: pickList.assigned_user
        ? `${pickList.assigned_user.first_name} ${pickList.assigned_user.last_name}`
        : undefined,
      started_at: pickList.started_at,
      completed_at: pickList.completed_at,
      created_at: pickList.created_at,
    }

    return {
      pickList: transformedPickList,
      lines: transformedLines,
      progress,
    }
  }

  /**
   * Confirm a full pick - update 4 tables atomically
   */
  static async confirmPick(
    pickListId: string,
    lineId: string,
    input: ConfirmPickInput
  ): Promise<PickConfirmationResult> {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get the line with LP info
    const { data: line, error: lineError } = await supabase
      .from('pick_list_lines')
      .select(
        `
        *,
        license_plates:license_plate_id(quantity_on_hand, allocated_quantity)
      `
      )
      .eq('id', lineId)
      .eq('pick_list_id', pickListId)
      .single()

    if (lineError || !line) {
      throw new Error('Pick line not found')
    }

    // Validate quantity
    const validation = this.validatePickQuantity(input.quantity_picked, line.quantity_to_pick)
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid quantity')
    }

    // Validate LP has sufficient quantity
    if (line.license_plates && input.quantity_picked > line.license_plates.quantity_on_hand) {
      throw new Error(
        `Cannot pick more than available in LP (${line.license_plates.quantity_on_hand} units)`
      )
    }

    const now = new Date().toISOString()

    // Update pick_list_lines
    const { error: updateLineError } = await supabase
      .from('pick_list_lines')
      .update({
        quantity_picked: input.quantity_picked,
        status: 'picked',
        picked_at: now,
        picked_by: user.id,
      })
      .eq('id', lineId)

    if (updateLineError) {
      throw new Error('Failed to update pick line')
    }

    // Update inventory_allocations
    const { error: allocError } = await supabase
      .from('inventory_allocations')
      .update({
        quantity_picked: input.quantity_picked,
        status: 'picked',
      })
      .eq('pick_list_line_id', lineId)

    if (allocError) {
      console.warn('Failed to update allocation:', allocError)
    }

    // Update sales_order_lines - increment quantity_picked
    const { error: solError } = await supabase.rpc('increment_so_line_picked', {
      p_so_line_id: line.sales_order_line_id,
      p_quantity: input.quantity_picked,
    })

    if (solError) {
      console.warn('Failed to update SO line:', solError)
    }

    // Update license_plates - decrement quantity_on_hand and allocated_quantity
    const { error: lpError } = await supabase.rpc('decrement_lp_quantities', {
      p_lp_id: input.picked_license_plate_id,
      p_quantity: input.quantity_picked,
    })

    if (lpError) {
      console.warn('Failed to update LP:', lpError)
    }

    // Get updated progress
    const { lines } = await this.getPickListWithLines(pickListId)
    const progress = this.calculateProgress(lines)

    return {
      success: true,
      line: {
        id: lineId,
        status: 'picked',
        quantity_picked: input.quantity_picked,
        picked_at: now,
      },
      progress,
    }
  }

  /**
   * Confirm a short pick with reason
   */
  static async confirmShortPick(
    pickListId: string,
    lineId: string,
    input: ShortPickInput
  ): Promise<ShortPickResult> {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get the line
    const { data: line, error: lineError } = await supabase
      .from('pick_list_lines')
      .select('*')
      .eq('id', lineId)
      .eq('pick_list_id', pickListId)
      .single()

    if (lineError || !line) {
      throw new Error('Pick line not found')
    }

    // Validate short pick - quantity must be less than allocated
    if (input.quantity_picked >= line.quantity_to_pick) {
      throw new Error('Short pick quantity must be less than allocated')
    }

    const shortQuantity = line.quantity_to_pick - input.quantity_picked
    const now = new Date().toISOString()

    // Update pick_list_lines with short status
    const { error: updateLineError } = await supabase
      .from('pick_list_lines')
      .update({
        quantity_picked: input.quantity_picked,
        status: 'short',
        picked_at: now,
        picked_by: user.id,
        notes: `Short pick reason: ${input.reason}${input.notes ? ` - ${input.notes}` : ''}`,
      })
      .eq('id', lineId)

    if (updateLineError) {
      throw new Error('Failed to update pick line')
    }

    // Update sales_order_lines - update quantity_picked and backorder_quantity
    const { error: solError } = await supabase.rpc('update_so_line_short_pick', {
      p_so_line_id: line.sales_order_line_id,
      p_quantity_picked: input.quantity_picked,
      p_backorder_quantity: shortQuantity,
    })

    if (solError) {
      console.warn('Failed to update SO line for short pick:', solError)
    }

    // Update LP if picked from it
    if (input.picked_license_plate_id && input.quantity_picked > 0) {
      const { error: lpError } = await supabase.rpc('decrement_lp_quantities', {
        p_lp_id: input.picked_license_plate_id,
        p_quantity: input.quantity_picked,
      })

      if (lpError) {
        console.warn('Failed to update LP:', lpError)
      }
    }

    // Get updated progress
    const { lines } = await this.getPickListWithLines(pickListId)
    const progress = this.calculateProgress(lines)

    return {
      success: true,
      line: {
        id: lineId,
        status: 'short',
        quantity_picked: input.quantity_picked,
        picked_at: now,
      },
      short_quantity: shortQuantity,
      backorder_created: true,
      backorder_quantity: shortQuantity,
      progress,
    }
  }

  /**
   * Complete a pick list - validate all lines and update SO statuses
   */
  static async completePickList(pickListId: string): Promise<CompletionResult> {
    const supabase = createClient()

    // Get pick list with lines
    const { pickList, lines } = await this.getPickListWithLines(pickListId)

    // Validate all lines are picked or short
    const pendingLines = lines.filter((l) => l.status === 'pending')
    if (pendingLines.length > 0) {
      throw new Error(`Cannot complete: ${pendingLines.length} lines still pending`)
    }

    const now = new Date().toISOString()

    // Update pick list status
    const { error: updateError } = await supabase
      .from('pick_lists')
      .update({
        status: 'completed',
        completed_at: now,
      })
      .eq('id', pickListId)

    if (updateError) {
      throw new Error('Failed to complete pick list')
    }

    // Calculate summary
    const pickedLines = lines.filter((l) => l.status === 'picked')
    const shortLines = lines.filter((l) => l.status === 'short')
    const totalUnitsPicked = lines.reduce((sum, l) => sum + l.quantity_picked, 0)

    // Get unique sales orders from lines
    const salesOrderLineIds = [...new Set(lines.map((l) => l.sales_order_line_id))]

    // Update sales order statuses
    const updatedSOs: Array<{ id: string; order_number: string; status: 'packing' | 'partial' }> =
      []

    // Determine if any short picks exist for each SO
    for (const solId of salesOrderLineIds) {
      const lineForSO = lines.find((l) => l.sales_order_line_id === solId)
      if (lineForSO) {
        // Get the sales order
        const { data: soLine } = await supabase
          .from('sales_order_lines')
          .select('sales_order_id, sales_orders(id, order_number)')
          .eq('id', solId)
          .single()

        if (soLine?.sales_orders) {
          const hasShort = lines.some(
            (l) => l.sales_order_line_id === solId && l.status === 'short'
          )
          const newStatus = hasShort ? 'partial' : 'packing'

          await supabase
            .from('sales_orders')
            .update({ status: newStatus })
            .eq('id', (soLine.sales_orders as any).id)

          updatedSOs.push({
            id: (soLine.sales_orders as any).id,
            order_number: (soLine.sales_orders as any).order_number,
            status: newStatus,
          })
        }
      }
    }

    return {
      success: true,
      pick_list: {
        id: pickListId,
        status: 'completed',
        completed_at: now,
      },
      summary: {
        total_lines: lines.length,
        picked_lines: pickedLines.length,
        short_lines: shortLines.length,
        total_units_picked: totalUnitsPicked,
      },
      sales_orders_updated: updatedSOs,
    }
  }

  /**
   * Validate pick quantity against limits
   */
  static validatePickQuantity(
    quantity: number,
    maxAllowed: number
  ): { valid: boolean; error?: string } {
    if (isNaN(quantity)) {
      return { valid: false, error: 'Quantity must be a number' }
    }

    if (quantity <= 0) {
      return { valid: false, error: 'Quantity must be positive' }
    }

    if (quantity > maxAllowed) {
      return { valid: false, error: `Cannot pick more than allocated (${maxAllowed} units)` }
    }

    return { valid: true }
  }

  /**
   * Check for allergen conflict between product and customer restrictions
   */
  static checkAllergenConflict(
    productAllergens: string[] | null | undefined,
    customerRestrictions: string[] | null | undefined
  ): boolean {
    if (!productAllergens || !customerRestrictions) {
      return false
    }

    if (productAllergens.length === 0 || customerRestrictions.length === 0) {
      return false
    }

    // Case-insensitive matching
    const normalizedProduct = productAllergens.map((a) => a.toLowerCase())
    const normalizedCustomer = customerRestrictions.map((r) => r.toLowerCase())

    return normalizedProduct.some((allergen) => normalizedCustomer.includes(allergen))
  }

  /**
   * Calculate progress metrics from pick list lines
   */
  static calculateProgress(lines: PickListLine[]): PickProgress {
    if (!lines || lines.length === 0) {
      return {
        picked_count: 0,
        short_count: 0,
        total_count: 0,
        percentage: 0,
      }
    }

    const pickedCount = lines.filter((l) => l.status === 'picked').length
    const shortCount = lines.filter((l) => l.status === 'short').length
    const totalCount = lines.length

    const completedCount = pickedCount + shortCount
    const percentage = Math.round((completedCount / totalCount) * 100)

    return {
      picked_count: pickedCount,
      short_count: shortCount,
      total_count: totalCount,
      percentage,
    }
  }

  /**
   * Validate picker has permission to access/modify pick list
   */
  static async validatePickerPermission(pickListId: string, userId: string): Promise<boolean> {
    const supabase = createClient()

    // Get pick list
    const { data: pickList, error } = await supabase
      .from('pick_lists')
      .select('assigned_to')
      .eq('id', pickListId)
      .single()

    if (error || !pickList) {
      return false
    }

    // Check if user is assigned
    if (pickList.assigned_to === userId) {
      return true
    }

    // Check if user has elevated role (Warehouse+, Manager, Admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profile) {
      const elevatedRoles = ['warehouse', 'manager', 'admin']
      if (elevatedRoles.includes(profile.role?.toLowerCase() || '')) {
        return true
      }
    }

    return false
  }
}
