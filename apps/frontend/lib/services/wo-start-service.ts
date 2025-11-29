/**
 * Work Order Start Service
 * Handles WO status transitions from 'released' to 'in_progress' (Story 4.2)
 */

import { createServerSupabaseAdmin } from '@/lib/supabase/server'

export interface StartedWorkOrder {
  id: string
  wo_number: string
  status: string
  started_at: string
  started_by_user_id: string
  started_by_user: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
}

export interface MaterialAvailability {
  id: string
  material_name: string
  product_id: string
  required_qty: number
  available_qty: number
  available_pct: number
  uom: string
  has_shortage: boolean
}

export interface WOStartModalData {
  id: string
  wo_number: string
  product_name: string
  planned_qty: number
  uom: string
  scheduled_date?: string
  production_line_id?: string
  line_name?: string
  materials: MaterialAvailability[]
}

export class WOStartError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'WOStartError'
  }
}

/**
 * Get WO data for start modal (AC-4.2.1)
 * Returns WO summary + material availability check
 */
export async function getWOForStartModal(woId: string, orgId: string): Promise<WOStartModalData> {
  const supabase = createServerSupabaseAdmin()

  try {
    // Fetch WO with product and line
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select(
        `
        id,
        wo_number,
        status,
        planned_quantity,
        uom,
        scheduled_date,
        production_line_id,
        product_id,
        products!work_orders_product_id_fkey(name),
        machines!work_orders_production_line_id_fkey(name)
      `,
      )
      .eq('id', woId)
      .eq('org_id', orgId)
      .single()

    if (woError || !wo) {
      throw new WOStartError('NOT_FOUND', 404, 'Work Order not found.')
    }

    // Fetch materials for this WO
    const { data: woMaterials, error: materialsError } = await supabase
      .from('wo_materials')
      .select('id, product_id, material_name, required_qty, uom')
      .eq('wo_id', woId)
      .order('sequence', { ascending: true })

    if (materialsError) {
      throw new WOStartError('DATABASE_ERROR', 500, 'Failed to fetch materials.')
    }

    // For each material, calculate available qty from license_plates
    const materials: MaterialAvailability[] = []

    if (woMaterials && woMaterials.length > 0) {
      for (const material of woMaterials) {
        const { data: lps, error: lpsError } = await supabase
          .from('license_plates')
          .select('quantity')
          .eq('product_id', material.product_id)
          .eq('org_id', orgId)
          .in('status', ['available', 'reserved'])

        if (!lpsError && lps) {
          const availableQty = lps.reduce((sum, lp) => sum + Number(lp.quantity), 0)
          const availablePct = (availableQty / material.required_qty) * 100

          materials.push({
            id: material.id,
            material_name: material.material_name,
            product_id: material.product_id,
            required_qty: material.required_qty,
            available_qty: availableQty,
            available_pct: availablePct,
            uom: material.uom,
            has_shortage: availablePct < 100,
          })
        }
      }
    }

    // Handle Supabase join results (may be arrays)
    type ProductData = { name: string } | { name: string }[] | null
    type MachineData = { name: string } | { name: string }[] | null
    const productData = wo.products as unknown as ProductData
    const machineData = wo.machines as unknown as MachineData
    const productName = Array.isArray(productData) ? productData[0]?.name : productData?.name
    const lineName = Array.isArray(machineData) ? machineData[0]?.name : machineData?.name

    return {
      id: wo.id,
      wo_number: wo.wo_number,
      product_name: productName || 'Unknown',
      planned_qty: wo.planned_quantity,
      uom: wo.uom,
      scheduled_date: wo.scheduled_date,
      production_line_id: wo.production_line_id,
      line_name: lineName,
      materials,
    }
  } catch (error) {
    if (error instanceof WOStartError) {
      throw error
    }
    throw new WOStartError('DATABASE_ERROR', 500, 'Failed to fetch WO data.')
  }
}

/**
 * Start a work order (AC-4.2.2)
 * Transitions status from 'released' → 'in_progress'
 * Records started_at timestamp and started_by_user_id
 */
export async function startWorkOrder(
  woId: string,
  userId: string,
  orgId: string,
): Promise<StartedWorkOrder> {
  const supabase = createServerSupabaseAdmin()

  try {
    // 1. Fetch current WO to validate status
    const { data: currentWO, error: fetchError } = await supabase
      .from('work_orders')
      .select('id, status, wo_number')
      .eq('id', woId)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !currentWO) {
      throw new WOStartError('NOT_FOUND', 404, 'Work Order not found.')
    }

    // 2. Validate status = 'released'
    if (currentWO.status === 'in_progress') {
      throw new WOStartError(
        'INVALID_STATUS',
        400,
        'Cannot start WO: Work Order is already in progress.',
      )
    }

    if (currentWO.status !== 'released') {
      throw new WOStartError(
        'INVALID_STATUS',
        400,
        `Cannot start WO: Work Order is in ${currentWO.status} status. Release first.`,
      )
    }

    // 3. Update WO atomically
    const now = new Date().toISOString()
    const { data: updatedWO, error: updateError } = await supabase
      .from('work_orders')
      .update({
        status: 'in_progress',
        started_at: now,
        started_by_user_id: userId,
        updated_at: now,
        updated_by: userId,
      })
      .eq('id', woId)
      .eq('org_id', orgId)
      .select(
        `
        id,
        wo_number,
        status,
        started_at,
        started_by_user_id,
        users!work_orders_started_by_user_id_fkey(id, email, first_name, last_name)
      `,
      )
      .single()

    if (updateError || !updatedWO) {
      throw new WOStartError('DATABASE_ERROR', 500, 'Failed to update WO status.')
    }

    // 4. Create activity log (optional - if audit table exists)
    try {
      await supabase.from('activity_logs').insert({
        org_id: orgId,
        user_id: userId,
        activity_type: 'wo_started',
        entity_type: 'work_order',
        entity_id: woId,
        entity_code: currentWO.wo_number,
        description: `Work order ${currentWO.wo_number} started`,
      })
    } catch (logError) {
      // Silently fail activity log - not critical
      console.error('Error creating activity log:', logError)
    }

    // Handle Supabase join results (may be arrays)
    type UserData = { id: string; email: string; first_name?: string; last_name?: string }
    const userData = updatedWO.users as unknown as UserData | UserData[] | null
    const user = Array.isArray(userData) ? userData[0] : userData

    return {
      id: updatedWO.id,
      wo_number: updatedWO.wo_number,
      status: updatedWO.status,
      started_at: updatedWO.started_at,
      started_by_user_id: updatedWO.started_by_user_id,
      started_by_user: {
        id: user?.id || userId,
        email: user?.email || '',
        first_name: user?.first_name,
        last_name: user?.last_name,
      },
    }
  } catch (error) {
    if (error instanceof WOStartError) {
      throw error
    }
    console.error('Error in startWorkOrder:', error)
    throw new WOStartError('DATABASE_ERROR', 500, 'Failed to start WO. Please try again.')
  }
}
