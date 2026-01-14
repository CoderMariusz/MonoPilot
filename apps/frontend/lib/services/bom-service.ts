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
 *
 * BUSINESS RULE: BOMs can only be created for:
 * - FG (Finished Goods) - final products
 * - WIP (Work in Progress) - intermediate/sub-assembly products
 *
 * NOT allowed for: RM (Raw Materials), PKG (Packaging), BP (Byproducts)
 * These are purchased/outputs, not manufactured.
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
        base_uom,
        product_type:product_types(id, code, name)
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
        base_uom,
        product_type:product_types(id, code, name)
      ),
      items:bom_items (
        *,
        component:products!component_id (
          id,
          code,
          name,
          base_uom,
          product_type:product_types(id, code, name)
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
        base_uom,
        product_type:product_types(id, code, name)
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

  // Validate product type - BOMs can only be created for FG and WIP products
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, code, product_type:product_types(id, code, name)')
    .eq('id', input.product_id)
    .eq('org_id', org_id)
    .single()

  if (productError || !product) {
    throw new Error('Product not found')
  }

  const productType = product.product_type as { id: string; code: string; name: string } | null
  const allowedTypes = ['FG', 'WIP']

  if (!productType || !allowedTypes.includes(productType.code)) {
    throw new Error(`BOMs can only be created for Finished Goods (FG) or Work in Progress (WIP) products. Product "${product.code}" is type "${productType?.name || 'Unknown'}".`)
  }

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

// ============================================================================
// BOM ADVANCED FEATURES - Story 02.14
// ============================================================================

import type {
  BomComparisonResponse,
  BomExplosionResponse,
  ScaleBomResponse,
  BomYieldResponse,
  BomItemSummary,
  ModifiedItem,
  ExplosionItem,
  ExplosionLevel,
  RawMaterialSummary,
  ScaledItem,
  LossFactor,
} from '../types/bom-advanced'
import type { ScaleBomRequest, UpdateYieldRequest } from '../validation/bom-advanced-schemas'

/**
 * Compare two BOM versions and return differences
 * FR-2.25: BOM version comparison (diff view)
 *
 * @param bomId1 - First BOM ID (typically older version)
 * @param bomId2 - Second BOM ID (typically newer version)
 * @returns Comparison result with added, removed, modified items
 */
export async function compareBOMVersions(
  bomId1: string,
  bomId2: string
): Promise<BomComparisonResponse> {
  // Validate not comparing same BOM
  if (bomId1 === bomId2) {
    throw new Error('SAME_VERSION')
  }

  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized')
  }

  const supabase = await createServerSupabase()
  const orgId = userInfo.orgId

  // Fetch both BOMs with items
  const [bom1Result, bom2Result] = await Promise.all([
    supabase
      .from('boms')
      .select(`
        id,
        product_id,
        version,
        effective_from,
        effective_to,
        output_qty,
        output_uom,
        status,
        org_id,
        items:bom_items (
          id,
          component_id,
          quantity,
          uom,
          sequence,
          operation_seq,
          scrap_percent,
          is_output,
          component:products!component_id (
            id,
            code,
            name
          )
        )
      `)
      .eq('id', bomId1)
      .eq('org_id', orgId)
      .single(),
    supabase
      .from('boms')
      .select(`
        id,
        product_id,
        version,
        effective_from,
        effective_to,
        output_qty,
        output_uom,
        status,
        org_id,
        items:bom_items (
          id,
          component_id,
          quantity,
          uom,
          sequence,
          operation_seq,
          scrap_percent,
          is_output,
          component:products!component_id (
            id,
            code,
            name
          )
        )
      `)
      .eq('id', bomId2)
      .eq('org_id', orgId)
      .single(),
  ])

  // Check if BOMs exist
  if (bom1Result.error || !bom1Result.data) {
    throw new Error('BOM_NOT_FOUND')
  }
  if (bom2Result.error || !bom2Result.data) {
    throw new Error('BOM_NOT_FOUND')
  }

  const bom1 = bom1Result.data
  const bom2 = bom2Result.data

  // Validate same product
  if (bom1.product_id !== bom2.product_id) {
    throw new Error('DIFFERENT_PRODUCTS')
  }

  // Map items to BomItemSummary format
  const mapToSummary = (item: any): BomItemSummary => ({
    id: item.id,
    component_id: item.component_id,
    component_code: item.component?.code || '',
    component_name: item.component?.name || '',
    quantity: item.quantity,
    uom: item.uom,
    sequence: item.sequence,
    operation_seq: item.operation_seq,
    scrap_percent: item.scrap_percent || 0,
    is_output: item.is_output || false,
  })

  const items1 = (bom1.items || []).filter((i: any) => !i.is_output).map(mapToSummary)
  const items2 = (bom2.items || []).filter((i: any) => !i.is_output).map(mapToSummary)

  // Build maps keyed by component_id
  const items1Map = new Map(items1.map(i => [i.component_id, i]))
  const items2Map = new Map(items2.map(i => [i.component_id, i]))

  // Find differences
  const added: BomItemSummary[] = []
  const removed: BomItemSummary[] = []
  const modified: ModifiedItem[] = []

  // Items in bom2 not in bom1 = added
  for (const [componentId, item] of items2Map) {
    if (!items1Map.has(componentId)) {
      added.push(item)
    }
  }

  // Items in bom1 not in bom2 = removed
  for (const [componentId, item] of items1Map) {
    if (!items2Map.has(componentId)) {
      removed.push(item)
    }
  }

  // Items in both = check for modifications
  const comparableFields: Array<'quantity' | 'uom' | 'scrap_percent' | 'sequence' | 'operation_seq'> = [
    'quantity', 'uom', 'scrap_percent', 'sequence', 'operation_seq'
  ]

  for (const [componentId, item1] of items1Map) {
    const item2 = items2Map.get(componentId)
    if (!item2) continue

    for (const field of comparableFields) {
      const val1 = item1[field]
      const val2 = item2[field]
      if (val1 !== val2) {
        let changePercent: number | null = null
        if (typeof val1 === 'number' && typeof val2 === 'number' && val1 !== 0) {
          changePercent = ((val2 - val1) / val1) * 100
        }
        modified.push({
          item_id: item1.id,
          component_id: componentId,
          component_code: item1.component_code,
          component_name: item1.component_name,
          field,
          old_value: val1 ?? 0,
          new_value: val2 ?? 0,
          change_percent: changePercent,
        })
      }
    }
  }

  // Calculate weight changes
  const totalWeight1 = items1.reduce((sum, i) => sum + i.quantity, 0)
  const totalWeight2 = items2.reduce((sum, i) => sum + i.quantity, 0)
  const weightChangeKg = totalWeight2 - totalWeight1
  const weightChangePercent = totalWeight1 !== 0 ? (weightChangeKg / totalWeight1) * 100 : 0

  return {
    bom_1: {
      id: bom1.id,
      version: bom1.version,
      effective_from: bom1.effective_from,
      effective_to: bom1.effective_to,
      output_qty: bom1.output_qty,
      output_uom: bom1.output_uom,
      status: bom1.status,
      items: items1,
    },
    bom_2: {
      id: bom2.id,
      version: bom2.version,
      effective_from: bom2.effective_from,
      effective_to: bom2.effective_to,
      output_qty: bom2.output_qty,
      output_uom: bom2.output_uom,
      status: bom2.status,
      items: items2,
    },
    differences: {
      added,
      removed,
      modified,
    },
    summary: {
      total_items_v1: items1.length,
      total_items_v2: items2.length,
      total_added: added.length,
      total_removed: removed.length,
      total_modified: modified.length,
      weight_change_kg: weightChangeKg,
      weight_change_percent: weightChangePercent,
    },
  }
}

/**
 * Multi-level BOM explosion with recursive traversal
 * FR-2.29: BOM multi-level explosion
 *
 * @param bomId - BOM ID to explode
 * @param maxDepth - Maximum depth to traverse (default 10, max 10)
 * @returns Multi-level explosion with raw materials summary
 */
export async function explodeBOM(
  bomId: string,
  maxDepth: number = 10
): Promise<BomExplosionResponse> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized')
  }

  // Clamp maxDepth to 1-10 range
  maxDepth = Math.max(1, Math.min(10, maxDepth))

  const supabase = await createServerSupabase()
  const orgId = userInfo.orgId

  // First get the root BOM
  const { data: rootBom, error: rootError } = await supabase
    .from('boms')
    .select(`
      id,
      product_id,
      output_qty,
      output_uom,
      org_id,
      product:products!product_id (
        id,
        code,
        name
      )
    `)
    .eq('id', bomId)
    .eq('org_id', orgId)
    .single()

  if (rootError || !rootBom) {
    throw new Error('BOM_NOT_FOUND')
  }

  const product = rootBom.product as any

  // Get all items with their components
  const { data: items, error: itemsError } = await supabase
    .from('bom_items')
    .select(`
      id,
      component_id,
      quantity,
      uom,
      sequence,
      scrap_percent,
      is_output,
      component:products!component_id (
        id,
        code,
        name,
        product_type:product_types (
          code
        )
      )
    `)
    .eq('bom_id', bomId)
    .eq('is_output', false)
    .order('sequence', { ascending: true })

  if (itemsError) {
    throw new Error(`Failed to fetch BOM items: ${itemsError.message}`)
  }

  // Helper to check if a component has a sub-BOM (is WIP or semi-finished)
  const getSubBOM = async (componentId: string): Promise<any | null> => {
    const { data: subBom } = await supabase
      .from('boms')
      .select(`
        id,
        output_qty,
        output_uom,
        product:products!product_id (
          product_type:product_types (
            code
          )
        )
      `)
      .eq('product_id', componentId)
      .eq('org_id', orgId)
      .eq('status', 'Active')
      .lte('effective_from', new Date().toISOString().split('T')[0])
      .or(`effective_to.gte.${new Date().toISOString().split('T')[0]},effective_to.is.null`)
      .limit(1)
      .maybeSingle()
    return subBom
  }

  // Recursive explosion
  const levels: ExplosionLevel[] = []
  const rawMaterialsMap = new Map<string, RawMaterialSummary>()
  const visitedPaths = new Set<string>()
  let totalItems = 0

  const explodeLevel = async (
    levelItems: any[],
    level: number,
    parentCumulativeQty: number,
    parentOutputQty: number,
    path: string[]
  ): Promise<void> => {
    if (level > maxDepth || levelItems.length === 0) return

    const levelExplosionItems: ExplosionItem[] = []

    for (const item of levelItems) {
      const component = item.component as any
      const componentType = component?.product_type?.code || 'raw'

      // Check for circular reference
      const itemPath = [...path, item.component_id]
      const pathKey = itemPath.join('->')
      if (visitedPaths.has(pathKey) || path.includes(item.component_id)) {
        throw new Error('CIRCULAR_REFERENCE')
      }
      visitedPaths.add(pathKey)

      // Calculate cumulative quantity
      const cumulativeQty = level === 1
        ? item.quantity
        : (parentCumulativeQty * item.quantity) / parentOutputQty

      // Check if this component has a sub-BOM (only for WIP/semi-finished)
      let hasSubBom = false
      let subBomItems: any[] = []
      let subBomOutputQty = 1

      if (componentType === 'wip' || componentType === 'semi_finished') {
        const subBom = await getSubBOM(item.component_id)
        if (subBom) {
          hasSubBom = true
          subBomOutputQty = subBom.output_qty

          // Get sub-BOM items
          const { data: subItems } = await supabase
            .from('bom_items')
            .select(`
              id,
              component_id,
              quantity,
              uom,
              sequence,
              scrap_percent,
              is_output,
              component:products!component_id (
                id,
                code,
                name,
                product_type:product_types (
                  code
                )
              )
            `)
            .eq('bom_id', subBom.id)
            .eq('is_output', false)
            .order('sequence', { ascending: true })

          subBomItems = subItems || []
        }
      }

      const explosionItem: ExplosionItem = {
        item_id: item.id,
        component_id: item.component_id,
        component_code: component?.code || '',
        component_name: component?.name || '',
        component_type: componentType,
        quantity: item.quantity,
        cumulative_qty: cumulativeQty,
        uom: item.uom,
        scrap_percent: item.scrap_percent || 0,
        has_sub_bom: hasSubBom,
        path: itemPath,
      }

      levelExplosionItems.push(explosionItem)
      totalItems++

      // Add raw materials to summary
      if (componentType === 'raw' || (!hasSubBom && componentType !== 'wip' && componentType !== 'semi_finished')) {
        const existing = rawMaterialsMap.get(item.component_id)
        if (existing) {
          existing.total_qty += cumulativeQty
        } else {
          rawMaterialsMap.set(item.component_id, {
            component_id: item.component_id,
            component_code: component?.code || '',
            component_name: component?.name || '',
            total_qty: cumulativeQty,
            uom: item.uom,
          })
        }
      }

      // Recursively explode sub-BOM
      if (hasSubBom && subBomItems.length > 0 && level < maxDepth) {
        await explodeLevel(subBomItems, level + 1, cumulativeQty, subBomOutputQty, itemPath)
      }
    }

    if (levelExplosionItems.length > 0) {
      // Check if level already exists
      const existingLevel = levels.find(l => l.level === level)
      if (existingLevel) {
        existingLevel.items.push(...levelExplosionItems)
      } else {
        levels.push({ level, items: levelExplosionItems })
      }
    }
  }

  // Start explosion from root BOM items
  await explodeLevel(items || [], 1, rootBom.output_qty, rootBom.output_qty, [])

  // Sort levels
  levels.sort((a, b) => a.level - b.level)

  return {
    bom_id: bomId,
    product_code: product?.code || '',
    product_name: product?.name || '',
    output_qty: rootBom.output_qty,
    output_uom: rootBom.output_uom,
    levels,
    total_levels: levels.length,
    total_items: totalItems,
    raw_materials_summary: Array.from(rawMaterialsMap.values()),
  }
}

/**
 * Scale BOM to new batch size with optional apply
 * FR-2.35: BOM scaling (batch size adjust)
 *
 * @param bomId - BOM ID to scale
 * @param request - Scaling request with target size or factor
 * @returns Scaled BOM with preview or applied result
 */
export async function applyBOMScaling(
  bomId: string,
  request: ScaleBomRequest
): Promise<ScaleBomResponse> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized')
  }

  const supabase = await createServerSupabase()
  const orgId = userInfo.orgId

  // Fetch BOM with items
  const { data: bom, error } = await supabase
    .from('boms')
    .select(`
      id,
      output_qty,
      output_uom,
      org_id,
      items:bom_items (
        id,
        component_id,
        quantity,
        uom,
        is_output,
        component:products!component_id (
          id,
          code,
          name
        )
      )
    `)
    .eq('id', bomId)
    .eq('org_id', orgId)
    .single()

  if (error || !bom) {
    throw new Error('BOM_NOT_FOUND')
  }

  // Calculate scale factor
  let scaleFactor: number
  let newBatchSize: number

  if (request.scale_factor !== undefined) {
    scaleFactor = request.scale_factor
    newBatchSize = bom.output_qty * scaleFactor
  } else if (request.target_batch_size !== undefined) {
    scaleFactor = request.target_batch_size / bom.output_qty
    newBatchSize = request.target_batch_size
  } else {
    throw new Error('MISSING_SCALE_PARAM')
  }

  if (scaleFactor <= 0) {
    throw new Error('INVALID_SCALE')
  }

  const roundDecimals = request.round_decimals ?? 3
  const previewOnly = request.preview_only ?? true

  const warnings: string[] = []
  const scaledItems: ScaledItem[] = []

  // Scale items (exclude outputs)
  const inputItems = (bom.items || []).filter((item: any) => !item.is_output)

  for (const item of inputItems) {
    const component = item.component as any
    const newQty = item.quantity * scaleFactor
    const roundedQty = parseFloat(newQty.toFixed(roundDecimals))
    const wasRounded = Math.abs(newQty - roundedQty) > Number.EPSILON

    if (wasRounded && roundedQty < 0.001) {
      warnings.push(`${component?.name || 'Item'} rounded from ${newQty.toFixed(6)} to ${roundedQty}`)
    }

    scaledItems.push({
      id: item.id,
      component_code: component?.code || '',
      component_name: component?.name || '',
      original_quantity: item.quantity,
      new_quantity: roundedQty,
      uom: item.uom,
      rounded: wasRounded,
    })
  }

  // Apply changes if not preview-only
  if (!previewOnly) {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Update BOM output_qty
    const { error: bomUpdateError } = await supabaseAdmin
      .from('boms')
      .update({
        output_qty: newBatchSize,
        updated_by: userInfo.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bomId)
      .eq('org_id', orgId)

    if (bomUpdateError) {
      throw new Error(`Failed to update BOM: ${bomUpdateError.message}`)
    }

    // Update all items
    for (const scaledItem of scaledItems) {
      const { error: itemUpdateError } = await supabaseAdmin
        .from('bom_items')
        .update({ quantity: scaledItem.new_quantity })
        .eq('id', scaledItem.id)

      if (itemUpdateError) {
        throw new Error(`Failed to update item: ${itemUpdateError.message}`)
      }
    }
  }

  return {
    original_batch_size: bom.output_qty,
    new_batch_size: newBatchSize,
    scale_factor: scaleFactor,
    items: scaledItems,
    warnings,
    applied: !previewOnly,
  }
}

/**
 * Get yield analysis for a BOM
 * FR-2.34: BOM yield calculation
 *
 * @param bomId - BOM ID to analyze
 * @returns Yield analysis with theoretical yield, inputs, outputs
 */
export async function getBOMYield(bomId: string): Promise<BomYieldResponse> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized')
  }

  const supabase = await createServerSupabase()
  const orgId = userInfo.orgId

  // Fetch BOM with items
  const { data: bom, error } = await supabase
    .from('boms')
    .select(`
      id,
      output_qty,
      output_uom,
      yield_percent,
      org_id,
      items:bom_items (
        id,
        component_id,
        quantity,
        uom,
        scrap_percent,
        is_output,
        is_by_product
      )
    `)
    .eq('id', bomId)
    .eq('org_id', orgId)
    .single()

  if (error || !bom) {
    throw new Error('BOM_NOT_FOUND')
  }

  const items = bom.items || []

  // Calculate input total (non-output items with scrap)
  let inputTotalKg = 0
  for (const item of items) {
    if (!item.is_output && !item.is_by_product) {
      const scrapMultiplier = 1 + (item.scrap_percent || 0) / 100
      inputTotalKg += item.quantity * scrapMultiplier
    }
  }

  // Calculate output total (output and by-product items)
  let outputQtyKg = bom.output_qty
  for (const item of items) {
    if (item.is_by_product) {
      outputQtyKg += item.quantity
    }
  }

  // Calculate theoretical yield
  const theoreticalYieldPercent = inputTotalKg > 0
    ? (outputQtyKg / inputTotalKg) * 100
    : 0

  // Get expected yield from BOM
  const expectedYieldPercent = bom.yield_percent || null

  // Calculate variance
  let varianceFromExpected: number | null = null
  let varianceWarning = false
  const varianceThreshold = 5 // Default 5%

  if (expectedYieldPercent !== null) {
    varianceFromExpected = theoreticalYieldPercent - expectedYieldPercent
    varianceWarning = Math.abs(varianceFromExpected) > varianceThreshold
  }

  // Loss factors (empty for MVP - Phase 1 will add detailed breakdown)
  const lossFactors: LossFactor[] = []

  return {
    bom_id: bomId,
    theoretical_yield_percent: parseFloat(theoreticalYieldPercent.toFixed(2)),
    expected_yield_percent: expectedYieldPercent,
    input_total_kg: parseFloat(inputTotalKg.toFixed(3)),
    output_qty_kg: parseFloat(outputQtyKg.toFixed(3)),
    loss_factors: lossFactors,
    actual_yield_avg: null, // Phase 1 - from production data
    variance_from_expected: varianceFromExpected !== null ? parseFloat(varianceFromExpected.toFixed(2)) : null,
    variance_warning: varianceWarning,
  }
}

/**
 * Update yield configuration for a BOM
 * FR-2.34: BOM yield configuration
 *
 * @param bomId - BOM ID to update
 * @param request - Yield configuration update
 * @returns Updated yield analysis
 */
export async function updateBOMYield(
  bomId: string,
  request: UpdateYieldRequest
): Promise<BomYieldResponse> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized')
  }

  const supabaseAdmin = createServerSupabaseAdmin()
  const orgId = userInfo.orgId

  // Validate BOM exists
  const { data: bom, error: checkError } = await supabaseAdmin
    .from('boms')
    .select('id, org_id')
    .eq('id', bomId)
    .single()

  if (checkError || !bom) {
    throw new Error('BOM_NOT_FOUND')
  }

  if (bom.org_id !== orgId) {
    throw new Error('BOM_NOT_FOUND') // Security: don't reveal cross-org existence
  }

  // Validate yield percent range
  if (request.expected_yield_percent < 0 || request.expected_yield_percent > 100) {
    throw new Error('INVALID_YIELD')
  }

  // Update BOM yield_percent
  const { error: updateError } = await supabaseAdmin
    .from('boms')
    .update({
      yield_percent: request.expected_yield_percent,
      updated_by: userInfo.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bomId)
    .eq('org_id', orgId)

  if (updateError) {
    throw new Error(`Failed to update yield: ${updateError.message}`)
  }

  // Return updated yield analysis
  return getBOMYield(bomId)
}

/**
 * Get all BOM versions for a product (for version selector)
 *
 * @param productId - Product ID to get BOM versions for
 * @returns Array of BOM versions
 */
export async function getBOMVersionsForProduct(productId: string): Promise<Array<{
  id: string
  version: string
  effective_from: string
  effective_to: string | null
  status: string
}>> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized')
  }

  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from('boms')
    .select('id, version, effective_from, effective_to, status')
    .eq('product_id', productId)
    .eq('org_id', userInfo.orgId)
    .order('version', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch BOM versions: ${error.message}`)
  }

  return data || []
}
