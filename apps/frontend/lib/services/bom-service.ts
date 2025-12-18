import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import type { BOM, BOMWithProduct, BOMStatus, CreateBOMInput, UpdateBOMInput } from '../validation/bom-schemas'

/**
 * BOM Service
 * Story: 2.6 BOM CRUD
 *
 * Handles BOM (Bill of Materials) CRUD operations with:
 * - Version auto-assignment (AC-2.6.3)
 * - Date-based validity (effective_from/effective_to)
 * - RLS org_id isolation (AC-2.6.1)
 * - Cascade delete to bom_items (AC-2.6.6)
 * - Cache invalidation events
 */

/**
 * Get current user's org_id from users table
 * Used for RLS enforcement and multi-tenancy
 */
async function getCurrentUserOrgId(): Promise<{ userId: string; orgId: string } | null> {
  const supabase = await createServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return null

  // Get org_id from users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (error || !userData?.org_id) {
    console.error('Failed to get org_id for user:', user.id, error)
    return null
  }

  return { userId: user.id, orgId: userData.org_id }
}

export interface BOMFilters {
  product_id?: string
  status?: BOMStatus
  search?: string
  effective_date?: string // BOMs active on this date
  limit?: number
  offset?: number
}

/**
 * Version increment logic
 * 1.0 → 1.1, 1.9 → 2.0 (rollover at 9)
 */
export function incrementVersion(version: string): string {
  const [major, minor] = version.split('.').map(Number)

  if (minor >= 9) {
    // Rollover: 1.9 → 2.0
    return `${major + 1}.0`
  } else {
    // Normal increment: 1.0 → 1.1
    return `${major}.${minor + 1}`
  }
}

/**
 * Get max version for a product
 */
async function getMaxVersion(productId: string, orgId: string): Promise<string | null> {
  const supabase = createServerSupabaseAdmin()

  const { data, error } = await supabase
    .from('boms')
    .select('version')
    .eq('org_id', orgId)
    .eq('product_id', productId)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return data.version
}

/**
 * Get all BOMs with filters
 */
export async function getBOMs(filters: BOMFilters = {}): Promise<BOMWithProduct[]> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized or no organization found for user')
  }

  const supabase = await createServerSupabase()
  const org_id = userInfo.orgId

  let query = supabase
    .from('boms')
    .select(`
      *,
      product:products!product_id (
        id,
        code,
        name,
        type,
        uom
      ),
      created_by_user:users!created_by (
        id,
        first_name,
        last_name,
        email
      ),
      updated_by_user:users!updated_by (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('org_id', org_id)

  // Apply filters
  if (filters.product_id) {
    query = query.eq('product_id', filters.product_id)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.effective_date) {
    // BOMs active on specific date
    const date = filters.effective_date
    query = query.lte('effective_from', date)
    query = query.or(`effective_to.gte.${date},effective_to.is.null`)
  }

  // Pagination
  const limit = filters.limit || 50
  const offset = filters.offset || 0
  query = query.range(offset, offset + limit - 1)

  // Order by product, then version
  query = query.order('product_id')
  query = query.order('version', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching BOMs:', error)
    throw new Error(`Failed to fetch BOMs: ${error.message}`)
  }

  return (data || []) as unknown as BOMWithProduct[]
}

/**
 * Get single BOM by ID
 * AC-2.25.6: Include production_lines in response
 */
export async function getBOMById(id: string, include_items = false): Promise<BOMWithProduct | null> {
  const supabase = await createServerSupabase()

  const selectFields = include_items
    ? `
      *,
      product:products!product_id (
        id,
        code,
        name,
        type,
        uom
      ),
      items:bom_items (
        *,
        component:products!component_id (
          id,
          code,
          name,
          type,
          uom
        )
      ),
      production_lines:bom_production_lines (
        id,
        line_id,
        labor_cost_per_hour,
        line:production_lines (
          id,
          name
        )
      ),
      created_by_user:users!created_by (
        id,
        first_name,
        last_name,
        email
      ),
      updated_by_user:users!updated_by (
        id,
        first_name,
        last_name,
        email
      )
    `
    : `
      *,
      product:products!product_id (
        id,
        code,
        name,
        type,
        uom
      ),
      production_lines:bom_production_lines (
        id,
        line_id,
        labor_cost_per_hour,
        line:production_lines (
          id,
          name
        )
      ),
      created_by_user:users!created_by (
        id,
        first_name,
        last_name,
        email
      ),
      updated_by_user:users!updated_by (
        id,
        first_name,
        last_name,
        email
      )
    `

  const { data, error } = await supabase
    .from('boms')
    .select(selectFields)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching BOM:', error)
    return null
  }

  return data as unknown as BOMWithProduct
}

/**
 * Create new BOM (auto-assigns version)
 */
export async function createBOM(input: CreateBOMInput): Promise<BOM> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized or no organization found for user')
  }

  const supabase = await createServerSupabase()
  const org_id = userInfo.orgId

  // Get max version for this product
  const maxVersion = await getMaxVersion(input.product_id, org_id)
  const newVersion = maxVersion ? incrementVersion(maxVersion) : '1.0'

  // Convert dates to ISO string if they are Date objects
  const effective_from = input.effective_from instanceof Date
    ? input.effective_from.toISOString().split('T')[0]
    : input.effective_from

  const effective_to = input.effective_to
    ? (input.effective_to instanceof Date
      ? input.effective_to.toISOString().split('T')[0]
      : input.effective_to)
    : null

  // Insert BOM
  const { data, error } = await supabase
    .from('boms')
    .insert({
      org_id,
      product_id: input.product_id,
      version: newVersion,
      effective_from,
      effective_to,
      status: input.status || 'Draft',
      output_qty: input.output_qty || 1.0,
      output_uom: input.output_uom,
      notes: input.notes || null,
      routing_id: input.routing_id || null,
      units_per_box: input.units_per_box || null,
      boxes_per_pallet: input.boxes_per_pallet || null,
      yield_percent: input.yield_percent || 100,
      created_by: userInfo.userId,
      updated_by: userInfo.userId
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating BOM:', error)
    throw new Error(`Failed to create BOM: ${error.message}`)
  }

  return data as BOM
}

/**
 * Update existing BOM
 */
export async function updateBOM(id: string, input: UpdateBOMInput): Promise<BOM> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized or no organization found for user')
  }

  const supabase = await createServerSupabase()

  // Convert dates if needed
  const updates: any = {
    ...input,
    updated_by: userInfo.userId
  }

  if (input.effective_from instanceof Date) {
    updates.effective_from = input.effective_from.toISOString().split('T')[0]
  }

  if (input.effective_to instanceof Date) {
    updates.effective_to = input.effective_to.toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('boms')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating BOM:', error)
    throw new Error(`Failed to update BOM: ${error.message}`)
  }

  return data as BOM
}

/**
 * Delete BOM (cascades to bom_items)
 */
export async function deleteBOM(id: string): Promise<void> {
  const supabase = await createServerSupabase()

  const { error } = await supabase
    .from('boms')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting BOM:', error)
    throw new Error(`Failed to delete BOM: ${error.message}`)
  }
}

/**
 * Get active BOM for a product on a specific date
 * AC-3.10.3: Select active BOM based on scheduled_date
 * Query: effective_from <= date AND (effective_to IS NULL OR >= date) AND status = 'Active'
 */
export async function getActiveBOMForProduct(
  productId: string,
  targetDate: Date | string
): Promise<BOM | null> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized or no organization found for user')
  }

  const supabase = await createServerSupabase()
  const org_id = userInfo.orgId

  // Format date as YYYY-MM-DD
  const dateStr = targetDate instanceof Date
    ? targetDate.toISOString().split('T')[0]
    : targetDate

  // Find active BOM where:
  // - effective_from <= targetDate
  // - effective_to IS NULL OR effective_to >= targetDate
  // - status = 'Active'
  const { data, error } = await supabase
    .from('boms')
    .select('*')
    .eq('org_id', org_id)
    .eq('product_id', productId)
    .eq('status', 'Active')
    .lte('effective_from', dateStr)
    .or(`effective_to.gte.${dateStr},effective_to.is.null`)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching active BOM:', error)
    return null
  }

  return data as BOM | null
}

/**
 * Get BOM count for a product
 */
export async function getBOMCountForProduct(productId: string): Promise<number> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized or no organization found for user')
  }

  const supabase = await createServerSupabase()
  const org_id = userInfo.orgId

  const { count, error } = await supabase
    .from('boms')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org_id)
    .eq('product_id', productId)

  if (error) {
    console.error('Error counting BOMs:', error)
    return 0
  }

  return count || 0
}

// ============================================================================
// BOM PRODUCTION LINES - Story 2.25
// ============================================================================

export interface BomProductionLine {
  id: string
  bom_id: string
  line_id: string
  line?: {
    id: string
    name: string
    warehouse_id: string
    warehouse?: { id: string; name: string }
  }
  labor_cost_per_hour: number | null
  created_at: string
}

export interface SetBomLinesInput {
  lines: Array<{
    line_id: string
    labor_cost_per_hour?: number
  }>
}

/**
 * Get production lines assigned to a BOM
 * AC-2.25.3: GET /api/technical/boms/:id/lines
 */
export async function getProductionLines(bomId: string): Promise<BomProductionLine[]> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from('bom_production_lines')
    .select(`
      *,
      line:production_lines (
        id,
        name,
        warehouse_id,
        warehouse:warehouses (id, name)
      )
    `)
    .eq('bom_id', bomId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching BOM production lines:', error)
    throw new Error(`Failed to fetch production lines: ${error.message}`)
  }

  return (data || []) as unknown as BomProductionLine[]
}

/**
 * Set production lines for a BOM (bulk replace)
 * AC-2.25.4: PUT /api/technical/boms/:id/lines
 */
export async function setProductionLines(
  bomId: string,
  input: SetBomLinesInput
): Promise<BomProductionLine[]> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized or no organization found for user')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Validate BOM exists and belongs to user's org
  const { data: bom, error: bomError } = await supabaseAdmin
    .from('boms')
    .select('id, org_id')
    .eq('id', bomId)
    .single()

  if (bomError || !bom) {
    throw new Error('BOM_NOT_FOUND')
  }

  if (bom.org_id !== userInfo.orgId) {
    throw new Error('BOM_NOT_FOUND') // Security: don't reveal existence
  }

  // Validate all line_ids exist and belong to same org
  if (input.lines.length > 0) {
    const lineIds = input.lines.map(l => l.line_id)

    const { data: validLines, error: lineError } = await supabaseAdmin
      .from('production_lines')
      .select('id, org_id')
      .in('id', lineIds)

    if (lineError) {
      throw new Error(`Failed to validate lines: ${lineError.message}`)
    }

    // Check all lines exist
    const foundIds = new Set(validLines?.map(l => l.id) || [])
    for (const lineId of lineIds) {
      if (!foundIds.has(lineId)) {
        throw new Error(`INVALID_LINE:${lineId}`)
      }
    }

    // Check all lines belong to same org
    for (const line of validLines || []) {
      if (line.org_id !== userInfo.orgId) {
        throw new Error(`INVALID_LINE_ORG:${line.id}`)
      }
    }
  }

  // Delete existing assignments
  const { error: deleteError } = await supabaseAdmin
    .from('bom_production_lines')
    .delete()
    .eq('bom_id', bomId)

  if (deleteError) {
    throw new Error(`Failed to clear existing lines: ${deleteError.message}`)
  }

  // Insert new assignments
  if (input.lines.length > 0) {
    const insertData = input.lines.map(l => ({
      bom_id: bomId,
      line_id: l.line_id,
      labor_cost_per_hour: l.labor_cost_per_hour ?? null
    }))

    const { error: insertError } = await supabaseAdmin
      .from('bom_production_lines')
      .insert(insertData)

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error('DUPLICATE_LINE')
      }
      throw new Error(`Failed to insert lines: ${insertError.message}`)
    }
  }

  // Return updated list
  return getProductionLines(bomId)
}

/**
 * Get labor cost for specific line assignment
 * AC-2.25.7: Helper method
 */
export async function getLaborCostForLine(bomId: string, lineId: string): Promise<number | null> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from('bom_production_lines')
    .select('labor_cost_per_hour')
    .eq('bom_id', bomId)
    .eq('line_id', lineId)
    .single()

  if (error || !data) {
    return null
  }

  return data.labor_cost_per_hour
}

/**
 * Get all production lines available for BOM assignment (org-filtered)
 * AC-2.25.7: Helper method
 */
export async function getAvailableLines(): Promise<Array<{ id: string; name: string; warehouse_id: string }>> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized or no organization found for user')
  }

  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from('production_lines')
    .select('id, name, warehouse_id')
    .eq('org_id', userInfo.orgId)
    .eq('status', 'active')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch production lines: ${error.message}`)
  }

  return data || []
}

/**
 * Calculate total labor cost for BOM on specific line
 * AC-2.25.10: Labor cost calculation helper
 */
export async function calculateLaborCost(
  bomId: string,
  lineId: string,
  batchSize: number = 1
): Promise<{
  total_labor_cost: number
  breakdown: Array<{
    operation_seq: number
    operation_name: string
    duration_minutes: number
    cost_per_hour: number
    cost: number
  }>
}> {
  const supabase = await createServerSupabase()

  // Get BOM with routing
  const { data: bom, error: bomError } = await supabase
    .from('boms')
    .select('id, routing_id')
    .eq('id', bomId)
    .single()

  if (bomError || !bom || !bom.routing_id) {
    return { total_labor_cost: 0, breakdown: [] }
  }

  // Get line-specific labor cost override
  const lineLaborCost = await getLaborCostForLine(bomId, lineId)

  // Get routing operations
  const { data: operations, error: opsError } = await supabase
    .from('routing_operations')
    .select('sequence, name, estimated_duration_minutes, labor_cost_per_hour')
    .eq('routing_id', bom.routing_id)
    .order('sequence', { ascending: true })

  if (opsError || !operations) {
    return { total_labor_cost: 0, breakdown: [] }
  }

  const breakdown = operations.map(op => {
    const durationMinutes = op.estimated_duration_minutes || 0
    // Line override > operation default > 0
    const costPerHour = lineLaborCost ?? op.labor_cost_per_hour ?? 0
    const hours = durationMinutes / 60
    const cost = Math.round(hours * costPerHour * batchSize * 100) / 100

    return {
      operation_seq: op.sequence,
      operation_name: op.name,
      duration_minutes: durationMinutes,
      cost_per_hour: costPerHour,
      cost
    }
  })

  const total_labor_cost = breakdown.reduce((sum, op) => sum + op.cost, 0)

  return { total_labor_cost, breakdown }
}

// ============================================================================
// BOM YIELD CALCULATION - FR-2.34
// ============================================================================

export interface YieldCalculation {
  plannedQuantity: number
  yieldPercent: number
  actualQuantity: number
  wasteQuantity: number
}

/**
 * Calculate actual output quantity accounting for yield percentage
 * FR-2.34 Simple scope: Basic yield calculation
 *
 * Formula: actualOutput = plannedOutput × (yield_percent / 100)
 *
 * @param bomId - BOM ID to get yield_percent from
 * @param plannedQuantity - Planned production quantity
 * @returns Yield calculation breakdown
 */
export async function calculateBOMYield(
  bomId: string,
  plannedQuantity: number
): Promise<YieldCalculation> {
  const supabase = await createServerSupabase()

  // Get BOM yield setting
  const { data: bom, error } = await supabase
    .from('boms')
    .select('yield_percent')
    .eq('id', bomId)
    .single()

  if (error) {
    console.error('Error fetching BOM for yield calculation:', error)
    throw new Error(`Failed to fetch BOM: ${error.message}`)
  }

  const yieldPercent = bom?.yield_percent || 100
  const actualQuantity = (plannedQuantity * yieldPercent) / 100
  const wasteQuantity = plannedQuantity - actualQuantity

  return {
    plannedQuantity,
    yieldPercent,
    actualQuantity,
    wasteQuantity
  }
}

// ============================================================================
// BOM SCALING - FR-2.35
// ============================================================================

export interface ScaledBOMItem {
  itemId: string
  productCode: string
  productName: string
  originalQty: number
  scaledQty: number
  uom: string
}

export interface BOMScaleResult {
  originalOutputQty: number
  newOutputQty: number
  multiplier: number
  scaledItems: ScaledBOMItem[]
}

/**
 * Scale BOM quantities by multiplier
 * FR-2.35 Simple scope: One-time batch adjustment
 *
 * Multiplies output_qty and all bom_items quantities by given multiplier.
 * Returns scaled results without saving (read-only calculation).
 *
 * @param bomId - BOM ID to scale
 * @param multiplier - Scaling factor (e.g., 2.5 for 2.5x batch)
 * @returns Scaled output and item quantities
 */
export async function scaleBOM(
  bomId: string,
  multiplier: number
): Promise<BOMScaleResult> {
  if (multiplier <= 0) {
    throw new Error('Multiplier must be positive')
  }

  const supabase = await createServerSupabase()

  // Get BOM with items
  const { data: bom, error } = await supabase
    .from('boms')
    .select(`
      output_qty,
      output_uom,
      items:bom_items(
        id,
        quantity,
        uom,
        product:products!component_id(id, code, name)
      )
    `)
    .eq('id', bomId)
    .single()

  if (error) {
    console.error('Error fetching BOM for scaling:', error)
    throw new Error(`Failed to fetch BOM: ${error.message}`)
  }

  if (!bom) {
    throw new Error('BOM not found')
  }

  // Scale output
  const newOutputQty = bom.output_qty * multiplier

  // Scale all items
  const scaledItems: ScaledBOMItem[] = (bom.items || []).map((item: any) => {
    const product = item.product
    return {
      itemId: item.id,
      productCode: product.code,
      productName: product.name,
      originalQty: item.quantity,
      scaledQty: item.quantity * multiplier,
      uom: item.uom
    }
  })

  return {
    originalOutputQty: bom.output_qty,
    newOutputQty,
    multiplier,
    scaledItems
  }
}
