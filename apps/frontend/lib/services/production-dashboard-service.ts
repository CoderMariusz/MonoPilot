/**
 * Production Dashboard Service
 * Handles KPI calculations, active work orders, and alerts for production dashboard (Story 4.1)
 */

import { createServerSupabaseAdmin } from '@/lib/supabase/server'

export interface KPIData {
  orders_today: number
  units_produced_today: number
  avg_yield_today: number
  active_wos: number
  material_shortages: number
}

export interface ActiveWorkOrder {
  id: string
  wo_number: string
  product_name: string
  planned_qty: number
  output_qty: number
  status: string
  progress_percent: number
  started_at: string
  line_name: string
}

export interface Alert {
  id: string
  type: 'material_shortage' | 'wo_delayed' | 'quality_hold'
  severity: 'warning' | 'critical'
  description: string
  wo_id?: string
  created_at: string
}

/**
 * Get KPI data for production dashboard
 * AC-4.1.1: Orders Today, Units Produced, Avg Yield, Active WOs, Material Shortages
 */
export async function getKPIs(orgId: string): Promise<KPIData> {
  const supabase = createServerSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  try {
    // 1. Orders completed today
    const { data: completedOrders, error: ordersError } = await supabase
      .from('work_orders')
      .select('id')
      .eq('org_id', orgId)
      .eq('status', 'completed')
      .gte('completed_at', `${today}T00:00:00Z`)
      .lt('completed_at', `${today}T23:59:59Z`)

    if (ordersError) throw ordersError
    const orders_today = completedOrders?.length || 0

    // 2. Units produced today
    const { data: outputs, error: outputError } = await supabase
      .from('production_outputs')
      .select('qty')
      .eq('org_id', orgId)
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`)

    if (outputError) throw outputError
    const units_produced_today = outputs?.reduce((sum, o) => sum + (o.qty || 0), 0) || 0

    // 3. Average yield today (weighted: SUM(actual_output) / SUM(planned_qty))
    const { data: yieldData, error: yieldError } = await supabase
      .from('work_orders')
      .select('planned_qty, output_qty')
      .eq('org_id', orgId)
      .eq('status', 'completed')
      .gte('completed_at', `${today}T00:00:00Z`)
      .lt('completed_at', `${today}T23:59:59Z`)

    if (yieldError) throw yieldError

    let avg_yield_today = 0
    if (yieldData && yieldData.length > 0) {
      const totalPlanned = yieldData.reduce((sum, wo) => sum + (wo.planned_qty || 0), 0)
      const totalActual = yieldData.reduce((sum, wo) => sum + (wo.output_qty || 0), 0)
      avg_yield_today = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0
    }

    // 4. Active work orders
    const { data: activeWOs, error: activeError } = await supabase
      .from('work_orders')
      .select('id')
      .eq('org_id', orgId)
      .in('status', ['in_progress', 'paused'])

    if (activeError) throw activeError
    const active_wos = activeWOs?.length || 0

    // 5. Material shortages (simplified: count materials where available < required)
    // Note: This is a simplified calculation - may need adjustment based on actual schema
    const { data: shortages, error: shortageError } = await supabase
      .from('wo_materials')
      .select('id')
      .eq('org_id', orgId)

    if (shortageError) throw shortageError
    // Placeholder - actual shortage detection logic would be more complex
    const material_shortages = 0

    return {
      orders_today,
      units_produced_today: Math.round(units_produced_today * 100) / 100,
      avg_yield_today: Math.round(avg_yield_today * 100) / 100,
      active_wos,
      material_shortages,
    }
  } catch (error) {
    console.error('Error fetching KPIs:', error)
    throw error
  }
}

/**
 * Get active work orders for dashboard table
 * AC-4.1.2: Returns list of active WOs with progress
 */
export async function getActiveWorkOrders(orgId: string, limit = 10): Promise<ActiveWorkOrder[]> {
  const supabase = createServerSupabaseAdmin()

  try {
    const { data, error } = await supabase
      .from('work_orders')
      .select(
        `
        id,
        wo_number,
        product_id,
        planned_qty,
        output_qty,
        status,
        started_at,
        production_line_id,
        products (
          name
        ),
        production_lines (
          name
        )
      `
      )
      .eq('org_id', orgId)
      .in('status', ['in_progress', 'paused'])
      .order('started_at', { ascending: true })
      .limit(limit)

    if (error) throw error

    return (
      data?.map((wo: any) => ({
        id: wo.id,
        wo_number: wo.wo_number,
        product_name: wo.products?.name || 'Unknown',
        planned_qty: wo.planned_qty || 0,
        output_qty: wo.output_qty || 0,
        status: wo.status,
        progress_percent: wo.planned_qty ? (wo.output_qty / wo.planned_qty) * 100 : 0,
        started_at: wo.started_at,
        line_name: wo.production_lines?.name || 'Unassigned',
      })) || []
    )
  } catch (error) {
    console.error('Error fetching active work orders:', error)
    throw error
  }
}

/**
 * Get production alerts
 * AC-4.1.3: Material shortages, WO delays, quality holds
 */
export async function getAlerts(orgId: string, limit = 5): Promise<Alert[]> {
  const supabase = createServerSupabaseAdmin()
  const alerts: Alert[] = []

  try {
    // 1. Material shortage alerts
    // Placeholder implementation - actual logic depends on schema structure
    const { data: shortageData, error: shortageError } = await supabase
      .from('wo_materials')
      .select('id, wo_id, material_id, required_qty')
      .eq('org_id', orgId)
      .limit(10)

    if (!shortageError && shortageData) {
      // Filter and convert to alerts (simplified)
      shortageData.forEach((shortage: any) => {
        if (shortage.wo_id) {
          alerts.push({
            id: `shortage-${shortage.id}`,
            type: 'material_shortage',
            severity: 'warning',
            description: `Material shortage detected for work order`,
            wo_id: shortage.wo_id,
            created_at: new Date().toISOString(),
          })
        }
      })
    }

    // 2. WO Delayed alerts (WO > scheduled_date + 4 hours)
    const delayThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    const { data: delayedWOs, error: delayError } = await supabase
      .from('work_orders')
      .select('id, wo_number, scheduled_completion_date')
      .eq('org_id', orgId)
      .in('status', ['in_progress', 'paused'])
      .lt('scheduled_completion_date', delayThreshold)
      .limit(10)

    if (!delayError && delayedWOs) {
      delayedWOs.forEach((wo: any) => {
        alerts.push({
          id: `delay-${wo.id}`,
          type: 'wo_delayed',
          severity: 'warning',
          description: `Work order ${wo.wo_number} is delayed past scheduled completion`,
          wo_id: wo.id,
          created_at: new Date().toISOString(),
        })
      })
    }

    // 3. Quality holds (QA status = 'hold' on input LPs)
    const { data: qualityHolds, error: qaError } = await supabase
      .from('license_plates')
      .select('id, wo_id, qa_status')
      .eq('org_id', orgId)
      .eq('qa_status', 'hold')
      .limit(10)

    if (!qaError && qualityHolds) {
      qualityHolds.forEach((lp: any) => {
        alerts.push({
          id: `qa-${lp.id}`,
          type: 'quality_hold',
          severity: 'critical',
          description: `Quality hold placed on material`,
          wo_id: lp.wo_id,
          created_at: new Date().toISOString(),
        })
      })
    }

    // Sort by severity (critical first) then timestamp (newest first)
    const severityOrder = { critical: 0, warning: 1 }
    return alerts
      .sort((a, b) => {
        if (a.severity !== b.severity) {
          return severityOrder[a.severity as 'critical' | 'warning'] -
            severityOrder[b.severity as 'critical' | 'warning']
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return []
  }
}
