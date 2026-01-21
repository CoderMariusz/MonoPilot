/**
 * Over-Consumption Service (Story 04.6e)
 * Handles over-consumption detection, approval workflow, and variance tracking
 *
 * @module lib/services/over-consumption-service
 */

import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Types
 */
export interface OverConsumptionCheckResult {
  isOverConsumption: boolean
  overQty?: number
  variancePercent?: number
  requiredQty?: number
  currentConsumedQty?: number
}

export interface OverConsumptionRequestResult {
  request_id: string
  status: 'pending'
  wo_id: string
  wo_number: string
  wo_material_id: string
  product_code: string
  product_name: string
  lp_id: string
  lp_number: string
  required_qty: number
  current_consumed_qty: number
  requested_qty: number
  total_after_qty: number
  over_consumption_qty: number
  variance_percent: number
  requested_by: string
  requested_by_name: string
  requested_at: string
  message: string
}

export interface OverConsumptionApprovalResult {
  request_id: string
  status: 'approved'
  consumption_id: string
  approved_by: string
  approved_by_name: string
  approved_at: string
  reason: string | null
  lp_new_qty: number
  message: string
}

export interface OverConsumptionRejectionResult {
  request_id: string
  status: 'rejected'
  rejected_by: string
  rejected_by_name: string
  rejected_at: string
  reason: string
  message: string
}

export interface PendingRequest {
  id: string
  status: string
  wo_material_id: string
  requested_at: string
  requested_by: string
  requested_by_name: string
  requested_qty: number
  over_consumption_qty: number
  variance_percent: number
}

export interface HighVarianceWO {
  wo_id: string
  wo_number: string
  max_variance: number
  material_count: number
}

export interface VarianceStatus {
  status: 'exact' | 'acceptable' | 'high'
  color: 'green' | 'yellow' | 'red'
}

/**
 * Over-Consumption Service
 * Provides methods for over-consumption detection and approval workflow
 */
export class OverConsumptionService {
  /**
   * Check if a consumption would exceed the BOM requirement
   */
  static async checkOverConsumption(
    woMaterialId: string,
    requestedQty: number
  ): Promise<OverConsumptionCheckResult> {
    const supabase = await createServerSupabase()

    // Get material info
    const { data: material, error } = await supabase
      .from('wo_materials')
      .select('id, required_qty, consumed_qty, uom')
      .eq('id', woMaterialId)
      .single()

    if (error || !material) {
      throw new Error('Material not found')
    }

    const requiredQty = material.required_qty || 0
    const currentConsumedQty = material.consumed_qty || 0
    const totalAfter = currentConsumedQty + requestedQty

    // Check if this would exceed the BOM requirement
    if (totalAfter <= requiredQty) {
      return { isOverConsumption: false }
    }

    // Calculate over-consumption
    const overQty = totalAfter - requiredQty
    const variancePercent = requiredQty > 0 ? (overQty / requiredQty) * 100 : 0

    return {
      isOverConsumption: true,
      overQty,
      variancePercent,
      requiredQty,
      currentConsumedQty,
    }
  }

  /**
   * Create an over-consumption approval request
   */
  static async createOverConsumptionRequest(
    woId: string,
    woMaterialId: string,
    lpId: string,
    requestedQty: number
  ): Promise<OverConsumptionRequestResult> {
    const supabase = await createServerSupabase()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get user org_id
    const { data: userData } = await supabase
      .from('users')
      .select('id, org_id, full_name')
      .eq('id', user.id)
      .single()
    if (!userData) throw new Error('User not found')

    // Get material info with product details
    const { data: material, error: matError } = await supabase
      .from('wo_materials')
      .select(`
        id,
        wo_id,
        required_qty,
        consumed_qty,
        uom,
        material_name,
        products:product_id (id, code, name)
      `)
      .eq('id', woMaterialId)
      .single()

    if (matError || !material) {
      throw new Error('Material not found')
    }

    // Get WO info
    const { data: workOrder } = await supabase
      .from('work_orders')
      .select('id, wo_number')
      .eq('id', woId)
      .single()

    // Check if this is actually over-consumption
    const requiredQty = material.required_qty || 0
    const currentConsumedQty = material.consumed_qty || 0
    const totalAfterQty = currentConsumedQty + requestedQty

    if (totalAfterQty <= requiredQty) {
      throw new Error('This consumption does not exceed the BOM requirement')
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabase
      .from('over_consumption_approvals')
      .select('id, status')
      .eq('wo_material_id', woMaterialId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingRequest) {
      throw new Error('A pending approval request already exists')
    }

    // Calculate over-consumption
    const overConsumptionQty = totalAfterQty - requiredQty
    const variancePercent = requiredQty > 0 ? (overConsumptionQty / requiredQty) * 100 : 0

    // Create the request
    const { data: newRequest, error: insertError } = await supabase
      .from('over_consumption_approvals')
      .insert({
        org_id: userData.org_id,
        wo_id: woId,
        wo_material_id: woMaterialId,
        lp_id: lpId,
        requested_qty: requestedQty,
        current_consumed_qty: currentConsumedQty,
        required_qty: requiredQty,
        total_after_qty: totalAfterQty,
        over_consumption_qty: overConsumptionQty,
        variance_percent: variancePercent,
        requested_by: user.id,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError || !newRequest) {
      throw new Error('Failed to create approval request')
    }

    // Get LP info
    const { data: lpData } = await supabase
      .from('license_plates')
      .select('id, lp_number')
      .eq('id', lpId)
      .single()

    const product = Array.isArray(material.products)
      ? material.products[0]
      : material.products

    return {
      request_id: newRequest.id,
      status: 'pending',
      wo_id: woId,
      wo_number: workOrder?.wo_number || 'Unknown',
      wo_material_id: woMaterialId,
      product_code: product?.code || 'N/A',
      product_name: product?.name || material.material_name || 'Unknown',
      lp_id: lpId,
      lp_number: lpData?.lp_number || 'Unknown',
      required_qty: requiredQty,
      current_consumed_qty: currentConsumedQty,
      requested_qty: requestedQty,
      total_after_qty: totalAfterQty,
      over_consumption_qty: overConsumptionQty,
      variance_percent: variancePercent,
      requested_by: user.id,
      requested_by_name: userData.full_name || user.email || 'Unknown',
      requested_at: newRequest.created_at,
      message: 'Over-consumption approval request created successfully',
    }
  }

  /**
   * Approve an over-consumption request (Manager only)
   */
  static async approveOverConsumption(
    requestId: string,
    reason?: string
  ): Promise<OverConsumptionApprovalResult> {
    const supabase = await createServerSupabase()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('id, org_id, full_name')
      .eq('id', user.id)
      .single()
    if (!userData) throw new Error('User not found')

    // Get the request
    const { data: request, error: reqError } = await supabase
      .from('over_consumption_approvals')
      .select('*')
      .eq('id', requestId)
      .single()

    if (reqError || !request) {
      throw new Error('Approval request not found')
    }

    // Check if already decided
    if (request.status !== 'pending') {
      throw new Error('This request has already been approved or rejected')
    }

    const now = new Date().toISOString()

    // Update the request to approved
    const { error: updateError } = await supabase
      .from('over_consumption_approvals')
      .update({
        status: 'approved',
        decided_by: user.id,
        decided_at: now,
        approval_reason: reason || null,
      })
      .eq('id', requestId)

    if (updateError) {
      throw new Error('Failed to approve request')
    }

    // Create the consumption record
    const { data: consumption, error: consumptionError } = await supabase
      .from('material_consumptions')
      .insert({
        org_id: userData.org_id,
        wo_id: request.wo_id,
        wo_material_id: request.wo_material_id,
        lp_id: request.lp_id,
        consumed_qty: request.requested_qty,
        consumed_by: user.id,
        consumed_at: now,
      })
      .select()
      .single()

    // Link consumption to approval
    if (consumption) {
      await supabase
        .from('over_consumption_approvals')
        .update({ consumption_id: consumption.id })
        .eq('id', requestId)
    }

    // Update LP quantity
    const { data: lp } = await supabase
      .from('license_plates')
      .select('id, qty')
      .eq('id', request.lp_id)
      .single()

    let lpNewQty = 0
    if (lp) {
      lpNewQty = Math.max(0, (lp.qty || 0) - request.requested_qty)
      await supabase
        .from('license_plates')
        .update({ qty: lpNewQty })
        .eq('id', request.lp_id)
    }

    // Update WO material consumed qty
    const { data: woMaterial } = await supabase
      .from('wo_materials')
      .select('id, consumed_qty')
      .eq('id', request.wo_material_id)
      .single()

    if (woMaterial) {
      await supabase
        .from('wo_materials')
        .update({
          consumed_qty: (woMaterial.consumed_qty || 0) + request.requested_qty,
        })
        .eq('id', request.wo_material_id)
    }

    // Create audit log
    await supabase.from('activity_logs').insert({
      org_id: userData.org_id,
      entity_type: 'over_consumption_approval',
      entity_id: requestId,
      action: 'approved',
      performed_by: user.id,
      details: {
        wo_id: request.wo_id,
        wo_material_id: request.wo_material_id,
        requested_qty: request.requested_qty,
        reason: reason || null,
      },
    })

    return {
      request_id: requestId,
      status: 'approved',
      consumption_id: consumption?.id || '',
      approved_by: user.id,
      approved_by_name: userData.full_name || user.email || 'Unknown',
      approved_at: now,
      reason: reason || null,
      lp_new_qty: lpNewQty,
      message: 'Over-consumption approved and consumption created',
    }
  }

  /**
   * Reject an over-consumption request (Manager only)
   */
  static async rejectOverConsumption(
    requestId: string,
    reason: string
  ): Promise<OverConsumptionRejectionResult> {
    if (!reason || !reason.trim()) {
      throw new Error('Rejection reason is required')
    }

    const supabase = await createServerSupabase()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('id, org_id, full_name')
      .eq('id', user.id)
      .single()
    if (!userData) throw new Error('User not found')

    // Get the request
    const { data: request, error: reqError } = await supabase
      .from('over_consumption_approvals')
      .select('*')
      .eq('id', requestId)
      .single()

    if (reqError || !request) {
      throw new Error('Approval request not found')
    }

    // Check if already decided
    if (request.status !== 'pending') {
      throw new Error('This request has already been approved or rejected')
    }

    const now = new Date().toISOString()

    // Update the request to rejected
    const { error: updateError } = await supabase
      .from('over_consumption_approvals')
      .update({
        status: 'rejected',
        decided_by: user.id,
        decided_at: now,
        rejection_reason: reason,
      })
      .eq('id', requestId)

    if (updateError) {
      throw new Error('Failed to reject request')
    }

    // Create audit log
    await supabase.from('activity_logs').insert({
      org_id: userData.org_id,
      entity_type: 'over_consumption_approval',
      entity_id: requestId,
      action: 'rejected',
      performed_by: user.id,
      details: {
        wo_id: request.wo_id,
        wo_material_id: request.wo_material_id,
        requested_qty: request.requested_qty,
        reason,
      },
    })

    return {
      request_id: requestId,
      status: 'rejected',
      rejected_by: user.id,
      rejected_by_name: userData.full_name || user.email || 'Unknown',
      rejected_at: now,
      reason,
      message: 'Over-consumption request rejected',
    }
  }

  /**
   * Get pending approval requests for a work order
   */
  static async getPendingRequests(woId: string): Promise<PendingRequest[]> {
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from('over_consumption_approvals')
      .select(`
        id,
        status,
        wo_material_id,
        requested_at,
        requested_by,
        requested_qty,
        over_consumption_qty,
        variance_percent,
        users:requested_by (full_name)
      `)
      .eq('wo_id', woId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })

    if (error) {
      return []
    }

    return (data || []).map((r) => {
      const user = Array.isArray(r.users) ? r.users[0] : r.users
      return {
        id: r.id,
        status: r.status,
        wo_material_id: r.wo_material_id,
        requested_at: r.requested_at,
        requested_by: r.requested_by,
        requested_by_name: user?.full_name || 'Unknown',
        requested_qty: r.requested_qty,
        over_consumption_qty: r.over_consumption_qty,
        variance_percent: r.variance_percent,
      }
    })
  }

  /**
   * Get work orders with high variance (>10%) for dashboard alerts
   */
  static async getHighVarianceWOs(): Promise<HighVarianceWO[]> {
    const supabase = await createServerSupabase()

    // Get WOs with materials that have >10% variance
    const { data, error } = await supabase
      .from('wo_materials')
      .select(`
        wo_id,
        required_qty,
        consumed_qty,
        work_orders:wo_id (id, wo_number)
      `)
      .gt('consumed_qty', 0)

    if (error || !data) {
      return []
    }

    // Calculate variance and filter
    const woMap = new Map<string, { wo_number: string; max_variance: number; count: number }>()

    for (const mat of data) {
      if (!mat.required_qty || mat.required_qty <= 0) continue

      const variance = ((mat.consumed_qty - mat.required_qty) / mat.required_qty) * 100

      if (variance > 10) {
        const wo = Array.isArray(mat.work_orders) ? mat.work_orders[0] : mat.work_orders
        if (!wo) continue

        const existing = woMap.get(mat.wo_id)
        if (existing) {
          existing.max_variance = Math.max(existing.max_variance, variance)
          existing.count++
        } else {
          woMap.set(mat.wo_id, {
            wo_number: wo.wo_number,
            max_variance: variance,
            count: 1,
          })
        }
      }
    }

    // Convert to array and sort by variance
    return Array.from(woMap.entries())
      .map(([wo_id, data]) => ({
        wo_id,
        wo_number: data.wo_number,
        max_variance: data.max_variance,
        material_count: data.count,
      }))
      .sort((a, b) => b.max_variance - a.max_variance)
  }

  /**
   * Get variance status based on percentage
   * Helper method for UI display
   */
  static getVarianceStatus(variancePercent: number): VarianceStatus {
    if (variancePercent === 0) {
      return { status: 'exact', color: 'green' }
    }

    if (variancePercent > 0 && variancePercent <= 10) {
      return { status: 'acceptable', color: 'yellow' }
    }

    return { status: 'high', color: 'red' }
  }
}
