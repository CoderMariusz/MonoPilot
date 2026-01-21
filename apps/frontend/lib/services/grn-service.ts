/**
 * GRN Service (Story 05.10)
 * Purpose: Business logic for GRN CRUD and workflow operations
 * Phase: GREEN - Minimal code to pass tests
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries via PostgREST.
 * - org_id Isolation: SAFE - RLS policies enforce org_id filtering at database level.
 * - XSS: SAFE - React auto-escapes all rendered values.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  GRNStatus,
  GRNSourceType,
  QAStatus,
  CreateGRNInput,
  UpdateGRNInput,
  CreateGRNItemInput,
  UpdateGRNItemInput,
  GRNQueryParams,
} from '@/lib/validation/grn-schemas'

// Re-export types
export type { GRNStatus, GRNSourceType, QAStatus }

// =============================================================================
// Types
// =============================================================================

export interface GRN {
  id: string
  org_id: string
  grn_number: string
  source_type: GRNSourceType
  po_id: string | null
  to_id: string | null
  asn_id: string | null
  supplier_id: string | null
  receipt_date: string
  warehouse_id: string
  location_id: string
  status: GRNStatus
  total_items: number
  total_qty: number
  notes: string | null
  created_at: string
  created_by: string | null
  completed_at: string | null
  completed_by: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  // Joined fields
  warehouse?: { name: string; code: string }
  location?: { full_path: string }
  supplier?: { name: string }
  items?: GRNItem[]
}

export interface GRNItem {
  id: string
  grn_id: string
  product_id: string
  po_line_id: string | null
  to_line_id: string | null
  ordered_qty: number
  received_qty: number
  uom: string
  lp_id: string | null
  batch_number: string | null
  supplier_batch_number: string | null
  gtin: string | null
  catch_weight_kg: number | null
  expiry_date: string | null
  manufacture_date: string | null
  location_id: string
  qa_status: QAStatus
  line_number: number
  notes: string | null
  // Over-receipt tracking (Story 05.13)
  over_receipt_flag: boolean
  over_receipt_percentage: number
  // Joined fields
  product?: { name: string; code: string; uom: string }
  location?: { full_path: string }
  lp?: { lp_number: string }
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface CompleteGRNResult {
  grn: GRN
  created_lps: Array<{
    id: string
    lp_number: string
    product_id: string
    quantity: number
  }>
}

// =============================================================================
// GRN Service Class
// =============================================================================

export class GRNService {
  // ===========================================================================
  // CRUD Operations
  // ===========================================================================

  /**
   * List GRNs with filtering, sorting, pagination
   */
  static async list(
    supabase: SupabaseClient,
    params: Partial<GRNQueryParams>
  ): Promise<PaginatedResult<GRN>> {
    const {
      search,
      status,
      source_type,
      warehouse_id,
      from_date,
      to_date,
      supplier_id,
      sort = 'created_at',
      order = 'desc',
      page = 1,
      limit = 50,
    } = params

    // Build count query
    let countQuery = supabase
      .from('grns')
      .select('*', { count: 'exact', head: true })

    // Build data query
    let query = supabase
      .from('grns')
      .select(`
        *,
        warehouse:warehouses(name, code),
        location:locations(full_path)
      `)

    // Apply filters to both queries
    if (search) {
      query = query.ilike('grn_number', `${search}%`)
      countQuery = countQuery.ilike('grn_number', `${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
      countQuery = countQuery.eq('status', status)
    }

    if (source_type) {
      query = query.eq('source_type', source_type)
      countQuery = countQuery.eq('source_type', source_type)
    }

    if (warehouse_id) {
      query = query.eq('warehouse_id', warehouse_id)
      countQuery = countQuery.eq('warehouse_id', warehouse_id)
    }

    if (from_date) {
      query = query.gte('receipt_date', from_date)
      countQuery = countQuery.gte('receipt_date', from_date)
    }

    if (to_date) {
      query = query.lte('receipt_date', to_date)
      countQuery = countQuery.lte('receipt_date', to_date)
    }

    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id)
      countQuery = countQuery.eq('supplier_id', supplier_id)
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Execute queries
    const [{ data, error }, { count }] = await Promise.all([
      query,
      countQuery,
    ])

    if (error) {
      throw new Error(`Failed to fetch GRNs: ${error.message}`)
    }

    const total = count || 0

    return {
      data: (data || []) as GRN[],
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get single GRN by ID with items
   */
  static async getById(
    supabase: SupabaseClient,
    id: string
  ): Promise<GRN | null> {
    const { data: grn, error: grnError } = await supabase
      .from('grns')
      .select(`
        *,
        warehouse:warehouses(name, code),
        location:locations(full_path)
      `)
      .eq('id', id)
      .single()

    if (grnError) {
      if (grnError.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch GRN: ${grnError.message}`)
    }

    // Fetch items
    const { data: items, error: itemsError } = await supabase
      .from('grn_items')
      .select(`
        *,
        product:products(name, code, base_uom),
        location:locations(full_path),
        lp:license_plates(lp_number)
      `)
      .eq('grn_id', id)
      .order('line_number', { ascending: true })

    if (itemsError) {
      throw new Error(`Failed to fetch GRN items: ${itemsError.message}`)
    }

    return {
      ...grn,
      items: items || [],
    } as GRN
  }

  /**
   * Generate next GRN number for org
   */
  static async generateGRNNumber(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `GRN-${year}-`

    const { data, error } = await supabase
      .from('grns')
      .select('grn_number')
      .eq('org_id', orgId)
      .ilike('grn_number', `${prefix}%`)
      .order('grn_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(`Failed to generate GRN number: ${error.message}`)

    let nextSeq = 1
    if (data?.grn_number) {
      const lastNum = data.grn_number.substring(prefix.length)
      nextSeq = parseInt(lastNum, 10) + 1
    }

    return `${prefix}${String(nextSeq).padStart(5, '0')}`
  }

  /**
   * Create new GRN with items
   */
  static async create(
    supabase: SupabaseClient,
    input: CreateGRNInput,
    createdBy: string
  ): Promise<GRN> {
    // Get user's org_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', createdBy)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    const orgId = user.org_id

    // Generate GRN number
    const grnNumber = await this.generateGRNNumber(supabase, orgId)

    // Create GRN header
    const { data: grn, error: grnError } = await supabase
      .from('grns')
      .insert({
        org_id: orgId,
        grn_number: grnNumber,
        source_type: input.source_type,
        po_id: input.po_id || null,
        to_id: input.to_id || null,
        asn_id: input.asn_id || null,
        supplier_id: input.supplier_id || null,
        warehouse_id: input.warehouse_id,
        location_id: input.location_id,
        receipt_date: input.receipt_date || new Date().toISOString(),
        status: 'draft',
        notes: input.notes || null,
        created_by: createdBy,
        total_items: input.items.length,
        total_qty: input.items.reduce((sum, item) => sum + item.received_qty, 0),
      })
      .select()
      .single()

    if (grnError || !grn) {
      throw new Error(`Failed to create GRN: ${grnError?.message || 'Unknown error'}`)
    }

    // Create items with line numbers
    const itemsToInsert = input.items.map((item, index) => ({
      grn_id: grn.id,
      product_id: item.product_id,
      po_line_id: item.po_line_id || null,
      to_line_id: item.to_line_id || null,
      ordered_qty: item.ordered_qty || 0,
      received_qty: item.received_qty,
      uom: item.uom,
      batch_number: item.batch_number || null,
      supplier_batch_number: item.supplier_batch_number || null,
      gtin: item.gtin || null,
      catch_weight_kg: item.catch_weight_kg || null,
      expiry_date: item.expiry_date || null,
      manufacture_date: item.manufacture_date || null,
      location_id: item.location_id || input.location_id,
      qa_status: item.qa_status || 'pending',
      line_number: index + 1,
      notes: item.notes || null,
    }))

    const { data: items, error: itemsError } = await supabase
      .from('grn_items')
      .insert(itemsToInsert)
      .select()

    if (itemsError) {
      // Rollback: delete GRN header
      await supabase.from('grns').delete().eq('id', grn.id)
      throw new Error(`Failed to create GRN items: ${itemsError.message}`)
    }

    return {
      ...grn,
      items: items || [],
    } as GRN
  }

  /**
   * Update GRN (draft only)
   */
  static async update(
    supabase: SupabaseClient,
    id: string,
    input: UpdateGRNInput
  ): Promise<GRN> {
    // Check if GRN exists and is draft
    const existing = await this.getById(supabase, id)
    if (!existing) {
      throw new Error('GRN not found')
    }

    if (existing.status !== 'draft') {
      throw new Error(`Cannot modify ${existing.status} GRN`)
    }

    const { data, error } = await supabase
      .from('grns')
      .update({
        location_id: input.location_id,
        notes: input.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update GRN: ${error.message}`)
    }

    return await this.getById(supabase, id) as GRN
  }

  // ===========================================================================
  // Item Operations
  // ===========================================================================

  /**
   * Add item to GRN (draft only)
   */
  static async addItem(
    supabase: SupabaseClient,
    grnId: string,
    input: CreateGRNItemInput
  ): Promise<GRNItem> {
    // Check if GRN exists and is draft
    const grn = await this.getById(supabase, grnId)
    if (!grn) {
      throw new Error('GRN not found')
    }

    if (grn.status !== 'draft') {
      throw new Error(`Cannot modify items on ${grn.status} GRN`)
    }

    // Get max line number
    const { data: maxLineData } = await supabase
      .from('grn_items')
      .select('line_number')
      .eq('grn_id', grnId)
      .order('line_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextLineNumber = (maxLineData?.line_number || 0) + 1

    // Create item
    const { data, error } = await supabase
      .from('grn_items')
      .insert({
        grn_id: grnId,
        product_id: input.product_id,
        po_line_id: input.po_line_id || null,
        to_line_id: input.to_line_id || null,
        ordered_qty: input.ordered_qty || 0,
        received_qty: input.received_qty,
        uom: input.uom,
        batch_number: input.batch_number || null,
        supplier_batch_number: input.supplier_batch_number || null,
        gtin: input.gtin || null,
        catch_weight_kg: input.catch_weight_kg || null,
        expiry_date: input.expiry_date || null,
        manufacture_date: input.manufacture_date || null,
        location_id: input.location_id || grn.location_id,
        qa_status: input.qa_status || 'pending',
        line_number: nextLineNumber,
        notes: input.notes || null,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add GRN item: ${error.message}`)
    }

    // Update GRN totals
    await this.updateTotals(supabase, grnId)

    return data as GRNItem
  }

  /**
   * Update GRN item (draft only)
   */
  static async updateItem(
    supabase: SupabaseClient,
    grnId: string,
    itemId: string,
    input: UpdateGRNItemInput
  ): Promise<GRNItem> {
    // Check if GRN exists and is draft
    const grn = await this.getById(supabase, grnId)
    if (!grn) {
      throw new Error('GRN not found')
    }

    if (grn.status !== 'draft') {
      throw new Error(`Cannot modify items on ${grn.status} GRN`)
    }

    const { data, error } = await supabase
      .from('grn_items')
      .update({
        received_qty: input.received_qty,
        batch_number: input.batch_number,
        supplier_batch_number: input.supplier_batch_number,
        expiry_date: input.expiry_date,
        manufacture_date: input.manufacture_date,
        location_id: input.location_id,
        qa_status: input.qa_status,
        notes: input.notes,
      })
      .eq('id', itemId)
      .eq('grn_id', grnId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('GRN item not found')
      }
      throw new Error(`Failed to update GRN item: ${error.message}`)
    }

    // Update GRN totals if quantity changed
    if (input.received_qty !== undefined) {
      await this.updateTotals(supabase, grnId)
    }

    return data as GRNItem
  }

  /**
   * Remove item from GRN (draft only)
   */
  static async removeItem(
    supabase: SupabaseClient,
    grnId: string,
    itemId: string
  ): Promise<void> {
    // Check if GRN exists and is draft
    const grn = await this.getById(supabase, grnId)
    if (!grn) {
      throw new Error('GRN not found')
    }

    if (grn.status !== 'draft') {
      throw new Error(`Cannot modify items on ${grn.status} GRN`)
    }

    const { error } = await supabase
      .from('grn_items')
      .delete()
      .eq('id', itemId)
      .eq('grn_id', grnId)

    if (error) {
      throw new Error(`Failed to remove GRN item: ${error.message}`)
    }

    // Update GRN totals
    await this.updateTotals(supabase, grnId)
  }

  // ===========================================================================
  // Workflow Operations
  // ===========================================================================

  /**
   * Complete GRN - Creates LPs for all items
   */
  static async complete(
    supabase: SupabaseClient,
    id: string,
    userId: string
  ): Promise<CompleteGRNResult> {
    // Get GRN with items
    const grn = await this.getById(supabase, id)
    if (!grn) {
      throw new Error('GRN not found')
    }

    if (grn.status !== 'draft') {
      throw new Error(`Cannot complete ${grn.status} GRN`)
    }

    if (!grn.items || grn.items.length === 0) {
      throw new Error('Cannot complete GRN with no items')
    }

    // Validate items for completion
    const validation = await this.validateForCompletion(supabase, grn)
    if (!validation.valid) {
      throw new Error(validation.errors.join('; '))
    }

    // Create LPs for each item
    const createdLPs: CompleteGRNResult['created_lps'] = []

    for (const item of grn.items) {
      // Generate LP number
      const { data: lpNumberData, error: lpNumError } = await supabase.rpc(
        'generate_lp_number',
        { p_org_id: grn.org_id }
      )

      if (lpNumError) {
        throw new Error(`Failed to generate LP number: ${lpNumError.message}`)
      }

      // Create LP
      const { data: lp, error: lpError } = await supabase
        .from('license_plates')
        .insert({
          org_id: grn.org_id,
          lp_number: lpNumberData,
          product_id: item.product_id,
          quantity: item.received_qty,
          uom: item.uom,
          location_id: item.location_id,
          warehouse_id: grn.warehouse_id,
          status: 'available',
          qa_status: item.qa_status,
          batch_number: item.batch_number,
          supplier_batch_number: item.supplier_batch_number,
          expiry_date: item.expiry_date,
          manufacture_date: item.manufacture_date,
          source: 'receipt',
          grn_id: grn.id,
          gtin: item.gtin,
          catch_weight_kg: item.catch_weight_kg,
          created_by: userId,
        })
        .select()
        .single()

      if (lpError) {
        throw new Error(`Failed to create LP: ${lpError.message}`)
      }

      // Update item with LP reference
      await supabase
        .from('grn_items')
        .update({ lp_id: lp.id })
        .eq('id', item.id)

      createdLPs.push({
        id: lp.id,
        lp_number: lp.lp_number,
        product_id: item.product_id,
        quantity: item.received_qty,
      })
    }

    // Update GRN status
    const { data: updatedGRN, error: updateError } = await supabase
      .from('grns')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: userId,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to complete GRN: ${updateError.message}`)
    }

    return {
      grn: { ...updatedGRN, items: grn.items } as GRN,
      created_lps: createdLPs,
    }
  }

  /**
   * Cancel GRN
   */
  static async cancel(
    supabase: SupabaseClient,
    id: string,
    reason: string,
    userId: string
  ): Promise<GRN> {
    // Get GRN with items
    const grn = await this.getById(supabase, id)
    if (!grn) {
      throw new Error('GRN not found')
    }

    if (grn.status === 'cancelled') {
      throw new Error('GRN is already cancelled')
    }

    // If completed, need to handle LPs
    if (grn.status === 'completed' && grn.items) {
      // Validate LPs can be cancelled
      const validation = await this.validateForCancellation(supabase, grn)
      if (!validation.valid) {
        throw new Error(validation.errors.join('; '))
      }

      // Mark LPs as consumed
      for (const item of grn.items) {
        if (item.lp_id) {
          await supabase
            .from('license_plates')
            .update({
              status: 'consumed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.lp_id)
        }
      }
    }

    // Update GRN status
    const { data, error } = await supabase
      .from('grns')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
        cancellation_reason: reason,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to cancel GRN: ${error.message}`)
    }

    return await this.getById(supabase, id) as GRN
  }

  // ===========================================================================
  // Validation Helpers
  // ===========================================================================

  /**
   * Validate GRN items for completion
   */
  static async validateForCompletion(
    supabase: SupabaseClient,
    grn: GRN
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    if (!grn.items || grn.items.length === 0) {
      errors.push('GRN has no items')
      return { valid: false, errors }
    }

    // Get warehouse settings for validation rules
    const { data: settings } = await supabase
      .from('warehouse_settings')
      .select('require_batch_on_receipt, require_expiry_on_receipt')
      .single()

    for (const item of grn.items) {
      // Check batch requirement
      if (settings?.require_batch_on_receipt && !item.batch_number) {
        // Get product name for better error message
        const { data: product } = await supabase
          .from('products')
          .select('name')
          .eq('id', item.product_id)
          .single()

        errors.push(`Batch number required for ${product?.name || 'product'}`)
      }

      // Check expiry requirement
      if (settings?.require_expiry_on_receipt && !item.expiry_date) {
        const { data: product } = await supabase
          .from('products')
          .select('name')
          .eq('id', item.product_id)
          .single()

        errors.push(`Expiry date required for ${product?.name || 'product'}`)
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate GRN can be cancelled
   */
  static async validateForCancellation(
    supabase: SupabaseClient,
    grn: GRN
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    if (!grn.items) {
      return { valid: true, errors: [] }
    }

    // Check if any LPs are in use
    for (const item of grn.items) {
      if (item.lp_id) {
        const { data: lp } = await supabase
          .from('license_plates')
          .select('lp_number, status')
          .eq('id', item.lp_id)
          .single()

        if (lp) {
          if (lp.status === 'reserved') {
            errors.push(`Cannot cancel GRN - LP ${lp.lp_number} is reserved`)
          }
          if (lp.status === 'consumed') {
            errors.push(`Cannot cancel GRN - LP ${lp.lp_number} has been consumed`)
          }
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  /**
   * Update GRN totals
   */
  private static async updateTotals(
    supabase: SupabaseClient,
    grnId: string
  ): Promise<void> {
    // Get current items
    const { data: items } = await supabase
      .from('grn_items')
      .select('received_qty')
      .eq('grn_id', grnId)

    const totalItems = items?.length || 0
    const totalQty = items?.reduce((sum, item) => sum + (item.received_qty || 0), 0) || 0

    await supabase
      .from('grns')
      .update({
        total_items: totalItems,
        total_qty: totalQty,
      })
      .eq('id', grnId)
  }

  /**
   * Check if GRN exists
   */
  static async exists(
    supabase: SupabaseClient,
    id: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('grns')
      .select('id')
      .eq('id', id)
      .single()

    return !!data && !error
  }

  /**
   * Get GRNs by PO ID
   */
  static async getByPOId(
    supabase: SupabaseClient,
    poId: string
  ): Promise<GRN[]> {
    const { data, error } = await supabase
      .from('grns')
      .select('*')
      .eq('po_id', poId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch GRNs for PO: ${error.message}`)
    }

    return data as GRN[]
  }

  /**
   * Get GRNs by TO ID
   */
  static async getByTOId(
    supabase: SupabaseClient,
    toId: string
  ): Promise<GRN[]> {
    const { data, error } = await supabase
      .from('grns')
      .select('*')
      .eq('to_id', toId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch GRNs for TO: ${error.message}`)
    }

    return data as GRN[]
  }
}
