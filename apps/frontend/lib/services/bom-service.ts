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
  const supabase = await createServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const org_id = user.user_metadata?.org_id
  if (!org_id) {
    throw new Error('No organization found for user')
  }

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
        product:products!product_id (
          id,
          code,
          name,
          type,
          uom
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
  const supabase = await createServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const org_id = user.user_metadata?.org_id
  if (!org_id) {
    throw new Error('No organization found for user')
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
      status: input.status || 'draft',
      output_qty: input.output_qty || 1.0,
      output_uom: input.output_uom,
      notes: input.notes || null,
      created_by: user.id,
      updated_by: user.id
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
  const supabase = await createServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Convert dates if needed
  const updates: any = {
    ...input,
    updated_by: user.id
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
 * Get BOM count for a product
 */
export async function getBOMCountForProduct(productId: string): Promise<number> {
  const supabase = await createServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const org_id = user.user_metadata?.org_id
  if (!org_id) {
    throw new Error('No organization found for user')
  }

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
