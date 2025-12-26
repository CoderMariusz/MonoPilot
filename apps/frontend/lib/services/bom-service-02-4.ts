/**
 * BOM Service (Story 02.4)
 * Handles CRUD operations for BOMs with validation, versioning, and date overlap checks
 *
 * Architecture: Service layer accepts Supabase client as parameter to support
 * both server-side (API routes) and client-side usage.
 *
 * Security: All queries enforce org_id isolation via RLS (ADR-013).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  BOM,
  BOMWithProduct,
  BOMsListResponse,
  BOMFilters,
  CreateBOMRequest,
  UpdateBOMRequest,
  BOMTimelineResponse,
  DateOverlapResult,
} from '@/lib/types/bom'
import { createBOMSchema, updateBOMSchema } from '@/lib/validation/bom-schema'

// ============================================
// CONSTANTS
// ============================================

/** Default page size for BOM list queries */
const DEFAULT_PAGE_SIZE = 50

/** Default sort field for BOM list queries */
const DEFAULT_SORT_BY = 'effective_from'

/** Default sort order for BOM list queries */
const DEFAULT_SORT_ORDER = 'desc'

/**
 * Select query string for BOM with product join.
 * Used across multiple functions to maintain DRY principle.
 */
const BOM_WITH_PRODUCT_SELECT = `
  *,
  product:products!product_id (
    id,
    code,
    name,
    type,
    uom
  )
`

/** Error code for "row not found" in Supabase/PostgREST */
const ROW_NOT_FOUND_ERROR_CODE = 'PGRST116'

// ============================================
// LIST OPERATIONS
// ============================================

/**
 * List BOMs with filters, pagination, and sorting
 *
 * @param supabase - Supabase client instance
 * @param filters - Optional filter, pagination, and sorting options
 * @returns Paginated list of BOMs with product details
 *
 * @example
 * // Get first page of active BOMs
 * const result = await listBOMs(supabase, { status: 'active', page: 1, limit: 50 })
 *
 * @see AC-01 to AC-07 List page and display
 */
export async function listBOMs(
  supabase: SupabaseClient,
  filters: BOMFilters = {}
): Promise<BOMsListResponse> {
  const {
    page = 1,
    limit = 50,
    search,
    status,
    product_type,
    effective_date,
    product_id,
    sortBy = 'effective_from',
    sortOrder = 'desc',
  } = filters

  // Build query with product join
  let query = supabase.from('boms').select(
    `
      *,
      product:products!product_id (
        id,
        code,
        name,
        type,
        uom
      )
    `,
    { count: 'exact' }
  )

  // Apply filters
  if (search) {
    // Search by product code or name via nested filter
    query = query.or(
      `product.code.ilike.%${search}%,product.name.ilike.%${search}%`
    )
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (product_id) {
    query = query.eq('product_id', product_id)
  }

  if (product_type) {
    // Product type filter would require joining product_types
    // For now, we filter client-side or via product.type
  }

  if (effective_date) {
    const today = new Date().toISOString().split('T')[0]
    if (effective_date === 'current') {
      // BOMs where today is between effective_from and effective_to
      query = query.lte('effective_from', today)
      query = query.or(`effective_to.gte.${today},effective_to.is.null`)
    } else if (effective_date === 'future') {
      // BOMs where effective_from is in the future
      query = query.gt('effective_from', today)
    } else if (effective_date === 'expired') {
      // BOMs where effective_to is in the past
      query = query.lt('effective_to', today)
    }
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Apply pagination
  const start = (page - 1) * limit
  const end = start + limit - 1
  const { data, error, count } = await query.range(start, end)

  if (error) {
    throw new Error(error.message)
  }

  return {
    boms: (data || []) as BOMWithProduct[],
    total: count || 0,
    page,
    limit,
  }
}

/**
 * Get single BOM by ID
 */
export async function getBOM(
  supabase: SupabaseClient,
  id: string
): Promise<BOMWithProduct | null> {
  const { data, error } = await supabase
    .from('boms')
    .select(
      `
      *,
      product:products!product_id (
        id,
        code,
        name,
        type,
        uom
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === ROW_NOT_FOUND_ERROR_CODE) {
      return null
    }
    throw new Error(error.message)
  }

  return data as BOMWithProduct
}

/**
 * Get next available version number for a product
 * AC-09, AC-21: Auto-version
 */
export async function getNextVersion(
  supabase: SupabaseClient,
  productId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('boms')
    .select('version')
    .eq('product_id', productId)
    .order('version', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    return 1
  }

  return data[0].version + 1
}

/**
 * Check if date range overlaps with existing BOMs for the same product
 * AC-18 to AC-20: Date range validation
 */
export async function checkDateOverlap(
  supabase: SupabaseClient,
  productId: string,
  effectiveFrom: string,
  effectiveTo: string | null,
  excludeId?: string
): Promise<DateOverlapResult> {
  // Use RPC function for date overlap check
  const { data, error } = await supabase.rpc('check_bom_date_overlap', {
    p_product_id: productId,
    p_effective_from: effectiveFrom,
    p_effective_to: effectiveTo,
    p_exclude_id: excludeId || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  // If data is empty array, no overlap
  if (!data || data.length === 0) {
    return { overlaps: false }
  }

  // Return first conflicting BOM
  return {
    overlaps: true,
    conflictingBom: data[0] as BOM,
  }
}

/**
 * Create new BOM with auto-versioning and date overlap validation
 * AC-08 to AC-13: Create BOM with versioning and validation
 */
export async function createBOM(
  supabase: SupabaseClient,
  input: CreateBOMRequest
): Promise<BOMWithProduct> {
  // Validate input
  const validation = createBOMSchema.safeParse(input)
  if (!validation.success) {
    throw new Error(validation.error.issues[0].message)
  }

  const data = validation.data

  // Check for date overlap
  const overlapCheck = await checkDateOverlap(
    supabase,
    data.product_id,
    data.effective_from,
    data.effective_to || null
  )

  if (overlapCheck.overlaps) {
    // Check if it's a "multiple ongoing BOMs" issue
    if (data.effective_to === null && overlapCheck.conflictingBom?.effective_to === null) {
      throw new Error('Only one BOM can have no end date per product')
    }
    throw new Error(
      `Date range overlaps with existing BOM v${overlapCheck.conflictingBom?.version}`
    )
  }

  // Get next version
  const nextVersion = await getNextVersion(supabase, data.product_id)

  // Insert BOM
  const { data: created, error } = await supabase
    .from('boms')
    .insert({
      product_id: data.product_id,
      version: nextVersion,
      effective_from: data.effective_from,
      effective_to: data.effective_to || null,
      status: data.status || 'draft',
      output_qty: data.output_qty,
      output_uom: data.output_uom,
      notes: data.notes || null,
      bom_type: 'standard',
    })
    .select(
      `
      *,
      product:products!product_id (
        id,
        code,
        name,
        type,
        uom
      )
    `
    )
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return created as BOMWithProduct
}

/**
 * Update existing BOM
 * AC-14 to AC-17: Edit BOM (product locked)
 */
export async function updateBOM(
  supabase: SupabaseClient,
  id: string,
  input: UpdateBOMRequest
): Promise<BOMWithProduct> {
  // Validate input
  const validation = updateBOMSchema.safeParse(input)
  if (!validation.success) {
    throw new Error(validation.error.issues[0].message)
  }

  const data = validation.data

  // Check date range validity if both dates provided
  if (data.effective_from && data.effective_to) {
    if (new Date(data.effective_to) < new Date(data.effective_from)) {
      throw new Error('Effective To must be after Effective From')
    }
  }

  // If updating dates, check for overlap
  if (data.effective_from !== undefined || data.effective_to !== undefined) {
    // Get current BOM to know product_id and current dates
    const currentBOM = await getBOM(supabase, id)
    if (!currentBOM) {
      throw new Error('BOM not found')
    }

    const effectiveFrom = data.effective_from || currentBOM.effective_from
    const effectiveTo =
      data.effective_to !== undefined
        ? data.effective_to
        : currentBOM.effective_to

    const overlapCheck = await checkDateOverlap(
      supabase,
      currentBOM.product_id,
      effectiveFrom,
      effectiveTo,
      id // Exclude current BOM from overlap check
    )

    if (overlapCheck.overlaps) {
      throw new Error(
        `Date range overlaps with existing BOM v${overlapCheck.conflictingBom?.version}`
      )
    }
  }

  // Update BOM
  const { data: updated, error } = await supabase
    .from('boms')
    .update({
      ...data,
    })
    .eq('id', id)
    .select(
      `
      *,
      product:products!product_id (
        id,
        code,
        name,
        type,
        uom
      )
    `
    )
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updated as BOMWithProduct
}

/**
 * Delete BOM (blocked if used in Work Orders)
 * AC-31 to AC-33: Delete with dependency checking
 */
export async function deleteBOM(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  // First, check if BOM exists
  const bom = await getBOM(supabase, id)
  if (!bom) {
    throw new Error('BOM not found')
  }

  // Check for Work Order references
  const { data: workOrders, error: woError } = await supabase.rpc(
    'get_work_orders_for_bom',
    {
      p_bom_id: id,
    }
  )

  if (woError) {
    throw new Error(woError.message)
  }

  if (workOrders && workOrders.length > 0) {
    const woNumbers = workOrders.map((wo: any) => wo.wo_number).join(', ')
    throw new Error(`Cannot delete BOM used in Work Orders: ${woNumbers}`)
  }

  // Delete BOM
  const { error: deleteError } = await supabase
    .from('boms')
    .delete()
    .eq('id', id)

  if (deleteError) {
    throw new Error(deleteError.message)
  }
}

/**
 * Get BOM timeline for a product (all versions)
 * AC-24 to AC-30: Version timeline visualization (FR-2.23)
 */
export async function getBOMTimeline(
  supabase: SupabaseClient,
  productId: string
): Promise<BOMTimelineResponse> {
  // Use RPC function for timeline data
  const { data, error } = await supabase.rpc('get_bom_timeline', {
    p_product_id: productId,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data as BOMTimelineResponse
}

// Export service as default object for easier testing
export const BOMService024 = {
  listBOMs,
  getBOM,
  createBOM,
  updateBOM,
  deleteBOM,
  getNextVersion,
  checkDateOverlap,
  getBOMTimeline,
}
