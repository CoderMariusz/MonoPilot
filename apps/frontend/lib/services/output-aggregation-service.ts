/**
 * Output Aggregation Service
 * Story: 04.7d - Multiple Outputs per WO
 *
 * Provides:
 * - calculateProgress: Progress calculation for WO outputs
 * - getOutputsForWO: Retrieve paginated outputs with filtering
 * - getOutputsSummary: Summary statistics by QA status
 * - getWOProgress: Full progress data for WO
 *
 * Related PRD: docs/1-BASELINE/product/modules/production.md (FR-PROD-015)
 */

import { createAdminClient } from '../supabase/admin-client'

// ============================================================================
// Types
// ============================================================================

export type QAStatus = 'approved' | 'pending' | 'rejected'

export interface OutputQueryOptions {
  page?: number
  limit?: number
  qa_status?: QAStatus
  location_id?: string
  sort?: 'created_at' | 'qty' | 'lp_number'
  order?: 'asc' | 'desc'
}

export interface OutputItem {
  id: string
  lp_id: string
  lp_number: string
  quantity: number
  uom: string
  batch_number: string
  qa_status: QAStatus | null
  location_id: string | null
  location_name: string | null
  expiry_date: string | null
  created_at: string
  created_by_name: string | null
  notes: string | null
  is_by_product: boolean
}

export interface OutputsSummary {
  total_outputs: number
  total_qty: number
  approved_count: number
  approved_qty: number
  pending_count: number
  pending_qty: number
  rejected_count: number
  rejected_qty: number
}

export interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface OutputsListResponse {
  outputs: OutputItem[]
  summary: OutputsSummary
  pagination: Pagination
}

export interface WOProgressResponse {
  wo_id: string
  wo_number: string
  planned_quantity: number
  produced_quantity: number
  progress_percent: number
  remaining_qty: number
  outputs_count: number
  is_complete: boolean
  auto_complete_enabled: boolean
  status: string
}

// ============================================================================
// Progress Calculation
// ============================================================================

/**
 * Calculate progress percentage
 *
 * @param outputQty - Current output quantity
 * @param plannedQty - Planned quantity
 * @returns Progress percentage (0-100+, allows over-production)
 */
export function calculateProgress(outputQty: number, plannedQty: number): number {
  if (plannedQty <= 0) return 0
  if (outputQty <= 0) return 0

  const progress = (outputQty / plannedQty) * 100
  // Round to 2 decimal places
  return Math.round(progress * 100) / 100
}

// ============================================================================
// Output Retrieval
// ============================================================================

/**
 * Get outputs for a work order with pagination and filtering
 *
 * @param woId - Work order ID
 * @param options - Query options (page, limit, qa_status, location_id, sort, order)
 * @returns Paginated outputs with summary
 */
export async function getOutputsForWO(
  woId: string,
  options: OutputQueryOptions = {}
): Promise<OutputsListResponse> {
  const supabase = createAdminClient()

  const {
    page = 1,
    limit = 20,
    qa_status,
    location_id,
    sort = 'created_at',
    order = 'desc',
  } = options

  // Build query
  let query = supabase
    .from('production_outputs')
    .select(`
      id,
      quantity,
      uom,
      qa_status,
      location_id,
      is_by_product,
      produced_at,
      notes,
      lp_id,
      license_plates!inner(
        id,
        lp_number,
        batch_number,
        expiry_date
      ),
      locations(
        id,
        name
      ),
      users:produced_by_user_id(
        full_name
      )
    `, { count: 'exact' })
    .eq('wo_id', woId)
    .eq('is_by_product', false) // Always exclude by-products

  // Apply filters
  if (qa_status) {
    query = query.eq('qa_status', qa_status)
  }

  if (location_id) {
    query = query.eq('location_id', location_id)
  }

  // Apply sorting
  const sortColumn = sort === 'lp_number' ? 'license_plates(lp_number)' :
                     sort === 'qty' ? 'quantity' : 'produced_at'
  const ascending = order === 'asc'
  query = query.order(sortColumn === 'produced_at' ? 'produced_at' : sortColumn, { ascending })

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch outputs: ${error.message}`)
  }

  // Transform data
  const outputs: OutputItem[] = (data || []).map((o) => {
    const lp = o.license_plates as unknown as { id: string; lp_number: string; batch_number: string; expiry_date: string | null }
    const loc = o.locations as unknown as { id: string; name: string } | null
    const user = o.users as unknown as { full_name: string } | null

    return {
      id: o.id,
      lp_id: lp.id,
      lp_number: lp.lp_number,
      quantity: Number(o.quantity),
      uom: o.uom,
      batch_number: lp.batch_number || '',
      qa_status: o.qa_status as QAStatus | null,
      location_id: o.location_id,
      location_name: loc?.name || null,
      expiry_date: lp.expiry_date,
      created_at: o.produced_at,
      created_by_name: user?.full_name || null,
      notes: o.notes,
      is_by_product: o.is_by_product || false,
    }
  })

  // Calculate summary
  const summary = await getOutputsSummary(woId)

  // Build pagination
  const total = count || 0
  const pagination: Pagination = {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit),
  }

  return {
    outputs,
    summary,
    pagination,
  }
}

// ============================================================================
// Summary Calculation
// ============================================================================

/**
 * Get summary statistics for WO outputs
 *
 * @param woId - Work order ID
 * @returns Summary with counts and quantities by QA status
 */
export async function getOutputsSummary(woId: string): Promise<OutputsSummary> {
  const supabase = createAdminClient()

  // Get all non-by-product outputs
  const { data, error } = await supabase
    .from('production_outputs')
    .select('id, quantity, qa_status')
    .eq('wo_id', woId)
    .eq('is_by_product', false)

  if (error) {
    throw new Error(`Failed to fetch outputs summary: ${error.message}`)
  }

  const outputs = data || []

  // Calculate summary
  const summary: OutputsSummary = {
    total_outputs: outputs.length,
    total_qty: 0,
    approved_count: 0,
    approved_qty: 0,
    pending_count: 0,
    pending_qty: 0,
    rejected_count: 0,
    rejected_qty: 0,
  }

  for (const output of outputs) {
    const qty = Number(output.quantity)
    summary.total_qty += qty

    switch (output.qa_status) {
      case 'approved':
        summary.approved_count++
        summary.approved_qty += qty
        break
      case 'pending':
        summary.pending_count++
        summary.pending_qty += qty
        break
      case 'rejected':
        summary.rejected_count++
        summary.rejected_qty += qty
        break
    }
  }

  return summary
}

// ============================================================================
// WO Progress
// ============================================================================

/**
 * Get WO progress data
 *
 * @param woId - Work order ID
 * @returns Full progress response
 */
export async function getWOProgress(woId: string): Promise<WOProgressResponse> {
  const supabase = createAdminClient()

  // Get work order
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select(`
      id,
      wo_number,
      planned_quantity,
      produced_quantity,
      status,
      org_id
    `)
    .eq('id', woId)
    .single()

  if (woError || !wo) {
    throw new Error('Work order not found')
  }

  const plannedQty = Number(wo.planned_quantity) || 0
  const outputQty = Number(wo.produced_quantity) || 0
  const progressPercent = calculateProgress(outputQty, plannedQty)
  const remainingQty = Math.max(0, plannedQty - outputQty)

  // Get outputs count
  const { count: outputsCount } = await supabase
    .from('production_outputs')
    .select('id', { count: 'exact', head: true })
    .eq('wo_id', woId)
    .eq('is_by_product', false)

  // Get production settings for auto_complete flag
  const { data: settings } = await supabase
    .from('production_settings')
    .select('auto_complete_wo')
    .eq('organization_id', wo.org_id)
    .single()

  const autoCompleteEnabled = settings?.auto_complete_wo ?? false
  const isComplete = wo.status === 'completed'

  return {
    wo_id: wo.id,
    wo_number: wo.wo_number,
    planned_quantity: plannedQty,
    produced_quantity: outputQty,
    progress_percent: progressPercent,
    remaining_qty: remainingQty,
    outputs_count: outputsCount || 0,
    is_complete: isComplete,
    auto_complete_enabled: autoCompleteEnabled,
    status: wo.status,
  }
}

// ============================================================================
// Service Class (for compatibility)
// ============================================================================

export const OutputAggregationService = {
  calculateProgress,
  getOutputsForWO,
  getOutputsSummary,
  getWOProgress,
}

export default OutputAggregationService
