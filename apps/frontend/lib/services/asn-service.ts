/**
 * ASN Service (Story 05.8)
 * Purpose: Business logic for ASN CRUD and workflow operations
 * Phase: GREEN - Minimal code to pass tests
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// Types
// =============================================================================

export type ASNStatus = 'pending' | 'partial' | 'received' | 'cancelled'

export interface ASN {
  id: string
  org_id: string
  asn_number: string
  po_id: string
  supplier_id: string
  expected_date: string
  actual_date?: string
  carrier?: string
  tracking_number?: string
  status: ASNStatus
  notes?: string
  created_at: string
  created_by: string
  updated_at: string
}

export interface ASNItem {
  id: string
  asn_id: string
  product_id: string
  po_line_id?: string
  expected_qty: number
  received_qty: number
  uom: string
  supplier_lp_number?: string
  supplier_batch_number?: string
  gtin?: string
  expiry_date?: string
  notes?: string
}

export interface ASNWithDetails extends ASN {
  items: ASNItem[]
  supplier_name: string
  po_number: string
}

export interface CreateASNInput {
  po_id: string
  expected_date: string
  carrier?: string
  tracking_number?: string
  notes?: string
  items: Array<{
    product_id: string
    expected_qty: number
    uom: string
    po_line_id?: string
    supplier_lp_number?: string
    supplier_batch_number?: string
    gtin?: string
    expiry_date?: string
    notes?: string
  }>
}

export interface UpdateASNInput {
  expected_date?: string
  carrier?: string
  tracking_number?: string
  notes?: string
}

export interface CreateASNItemInput {
  product_id: string
  expected_qty: number
  uom: string
  po_line_id?: string
  supplier_lp_number?: string
  supplier_batch_number?: string
  gtin?: string
  expiry_date?: string
  notes?: string
}

export interface UpdateASNItemInput {
  expected_qty?: number
  uom?: string
  supplier_lp_number?: string
  supplier_batch_number?: string
  gtin?: string
  expiry_date?: string
  notes?: string
}

export interface CreateASNFromPOInput {
  po_id: string
  expected_date: string
  carrier?: string
  tracking_number?: string
  notes?: string
  item_overrides?: Array<{
    po_line_id: string
    expected_qty?: number
    supplier_batch_number?: string
    gtin?: string
    expiry_date?: string
  }>
}

export interface ASNFilters {
  search?: string
  status?: ASNStatus
  supplier_id?: string
  po_id?: string
  date_from?: string
  date_to?: string
  sort?: string
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// =============================================================================
// Service
// =============================================================================

export class ASNService {
  /**
   * Generate ASN number in ASN-YYYY-NNNNN format
   */
  static async generateASNNumber(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `ASN-${year}-`

    const { data, error } = await supabase
      .from('asns')
      .select('asn_number')
      .eq('org_id', orgId)
      .ilike('asn_number', `${prefix}%`)
      .order('asn_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    let nextSeq = 1
    if (data?.asn_number) {
      const lastNum = data.asn_number.substring(prefix.length)
      nextSeq = parseInt(lastNum, 10) + 1
    }

    return `${prefix}${String(nextSeq).padStart(5, '0')}`
  }

  /**
   * Create ASN with header and items
   */
  static async createASN(
    supabase: SupabaseClient,
    input: CreateASNInput,
    createdBy: string
  ): Promise<ASNWithDetails> {
    // Validate required fields
    if (!input.po_id) {
      throw new Error('po_id is required')
    }

    // Get org_id and supplier_id from PO
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select('org_id, supplier_id, po_number')
      .eq('id', input.po_id)
      .single()

    if (poError || !po) throw new Error('Purchase order not found')

    // Generate ASN number
    const asnNumber = await this.generateASNNumber(supabase, po.org_id)

    // Create ASN header
    const { data: asn, error: asnError } = await supabase
      .from('asns')
      .insert({
        org_id: po.org_id,
        asn_number: asnNumber,
        po_id: input.po_id,
        supplier_id: po.supplier_id,
        expected_date: input.expected_date,
        carrier: input.carrier,
        tracking_number: input.tracking_number,
        notes: input.notes,
        status: 'pending',
        created_by: createdBy,
      })
      .select()
      .single()

    if (asnError || !asn) throw asnError || new Error('Failed to create ASN')

    // Create ASN items
    const itemsToInsert = input.items.map((item) => ({
      asn_id: asn.id,
      product_id: item.product_id,
      po_line_id: item.po_line_id,
      expected_qty: item.expected_qty,
      received_qty: 0,
      uom: item.uom,
      supplier_lp_number: item.supplier_lp_number,
      supplier_batch_number: item.supplier_batch_number,
      gtin: item.gtin,
      expiry_date: item.expiry_date,
      notes: item.notes,
    }))

    const { data: items, error: itemsError } = await supabase
      .from('asn_items')
      .insert(itemsToInsert)
      .select()

    if (itemsError) throw itemsError

    // Get supplier name
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('name')
      .eq('id', po.supplier_id)
      .single()

    return {
      ...asn,
      items: items || [],
      supplier_name: supplier?.name || '',
      po_number: po.po_number,
    }
  }

  /**
   * Create ASN from PO with auto-populated items
   */
  static async createASNFromPO(
    supabase: SupabaseClient,
    input: CreateASNFromPOInput,
    createdBy: string
  ): Promise<ASNWithDetails> {
    // Get PO lines with unreceived quantities
    const { data: poLines, error: linesError } = await supabase
      .from('purchase_order_lines')
      .select('id, product_id, quantity, received_qty, uom')
      .eq('po_id', input.po_id)

    if (linesError) throw linesError

    // Filter out fully received lines and calculate remaining quantities
    const unreceivedLines = (poLines || []).filter(
      (line: any) => line.received_qty < line.quantity
    )

    if (unreceivedLines.length === 0) {
      throw new Error('Cannot create ASN for fully received PO')
    }

    // Create items array
    const items = unreceivedLines.map((line: any) => {
      const override = input.item_overrides?.find(
        (o) => o.po_line_id === line.id
      )
      const remainingQty = line.quantity - (line.received_qty || 0)

      return {
        product_id: line.product_id,
        po_line_id: line.id,
        expected_qty: override?.expected_qty || remainingQty,
        uom: line.uom,
        supplier_batch_number: override?.supplier_batch_number,
        gtin: override?.gtin,
        expiry_date: override?.expiry_date,
      }
    })

    // Create ASN using createASN
    return this.createASN(supabase, {
      po_id: input.po_id,
      expected_date: input.expected_date,
      carrier: input.carrier,
      tracking_number: input.tracking_number,
      notes: input.notes,
      items,
    }, createdBy)
  }

  /**
   * Update ASN header
   */
  static async updateASN(
    supabase: SupabaseClient,
    id: string,
    input: UpdateASNInput
  ): Promise<ASN> {
    // Check if ASN exists and is pending
    const { data: existing, error: fetchError } = await supabase
      .from('asns')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !existing) throw new Error('ASN not found')

    if (existing.status !== 'pending') {
      throw new Error(`Cannot modify ASN in ${existing.status} status`)
    }

    const { data, error } = await supabase
      .from('asns')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete ASN
   */
  static async deleteASN(supabase: SupabaseClient, id: string): Promise<void> {
    // Check if ASN can be deleted
    const { data: asn, error: fetchError } = await supabase
      .from('asns')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !asn) throw new Error('ASN not found')

    // Check if any items have received_qty > 0
    const { data: items, error: itemsError } = await supabase
      .from('asn_items')
      .select('received_qty')
      .eq('asn_id', id)

    if (itemsError) throw itemsError

    const hasReceipts = (items || []).some((item: any) => item.received_qty > 0)
    if (hasReceipts) {
      throw new Error('Cannot delete ASN with received items')
    }

    const { error } = await supabase.from('asns').delete().eq('id', id)

    if (error) throw error
  }

  /**
   * Cancel ASN
   */
  static async cancelASN(supabase: SupabaseClient, id: string): Promise<ASN> {
    // Check if ASN can be cancelled
    const { data: existing, error: fetchError } = await supabase
      .from('asns')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !existing) throw new Error('ASN not found')

    if (existing.status !== 'pending') {
      throw new Error('Cannot cancel ASN with received items')
    }

    const { data, error } = await supabase
      .from('asns')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Add item to ASN
   */
  static async addASNItem(
    supabase: SupabaseClient,
    asnId: string,
    input: CreateASNItemInput
  ): Promise<ASNItem> {
    // Check if ASN is pending
    const { data: asn, error: asnError } = await supabase
      .from('asns')
      .select('status')
      .eq('id', asnId)
      .single()

    if (asnError || !asn) throw new Error('ASN not found')

    if (asn.status !== 'pending') {
      throw new Error(`Cannot modify ASN in ${asn.status} status`)
    }

    // Check for duplicate product
    const { data: existingItems, error: checkError } = await supabase
      .from('asn_items')
      .select('product_id')
      .eq('asn_id', asnId)

    if (checkError) throw checkError

    const isDuplicate = (existingItems || []).some(
      (item: any) => item.product_id === input.product_id
    )

    if (isDuplicate) {
      throw new Error('Product already exists in ASN items')
    }

    const { data, error } = await supabase
      .from('asn_items')
      .insert({
        asn_id: asnId,
        ...input,
        received_qty: 0,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update ASN item
   */
  static async updateASNItem(
    supabase: SupabaseClient,
    asnId: string,
    itemId: string,
    input: UpdateASNItemInput
  ): Promise<ASNItem> {
    // Check if ASN is pending
    const { data: asn, error: asnError } = await supabase
      .from('asns')
      .select('status')
      .eq('id', asnId)
      .single()

    if (asnError || !asn) throw new Error('ASN not found')

    if (asn.status !== 'pending') {
      throw new Error(`Cannot modify ASN in ${asn.status} status`)
    }

    const { data, error } = await supabase
      .from('asn_items')
      .update(input)
      .eq('id', itemId)
      .eq('asn_id', asnId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete ASN item
   */
  static async deleteASNItem(
    supabase: SupabaseClient,
    asnId: string,
    itemId: string
  ): Promise<void> {
    // Check if ASN is pending
    const { data: asn, error: asnError } = await supabase
      .from('asns')
      .select('status')
      .eq('id', asnId)
      .single()

    if (asnError || !asn) throw new Error('ASN not found')

    if (asn.status !== 'pending') {
      throw new Error(`Cannot modify ASN in ${asn.status} status`)
    }

    const { error } = await supabase
      .from('asn_items')
      .delete()
      .eq('id', itemId)
      .eq('asn_id', asnId)

    if (error) throw error
  }

  /**
   * Calculate ASN status based on items
   */
  static async calculateASNStatus(items: ASNItem[]): Promise<ASNStatus> {
    const totalItems = items.length
    const itemsWithReceipts = items.filter((item) => item.received_qty > 0).length
    const fullyReceivedItems = items.filter(
      (item) => item.received_qty >= item.expected_qty
    ).length

    if (itemsWithReceipts === 0) {
      return 'pending'
    } else if (fullyReceivedItems === totalItems) {
      return 'received'
    } else {
      return 'partial'
    }
  }

  /**
   * Get tracking URL for carrier
   */
  static getTrackingUrl(carrier: string, trackingNumber: string): string | null {
    if (!carrier || !trackingNumber) return null

    const carriers: Record<string, string> = {
      FedEx: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      DHL: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
      USPS: `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`,
      InPost: `https://inpost.pl/sledzenie-przesylek?number=${trackingNumber}`,
    }

    return carriers[carrier] || null
  }

  /**
   * Get ASNs expected today
   */
  static async getExpectedTodayASNs(supabase: SupabaseClient): Promise<ASN[]> {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('asns')
      .select('*')
      .eq('expected_date', today)
      .in('status', ['pending', 'partial'])
      .order('asn_number', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * List ASNs with filters - Optimized with joins for list view
   */
  static async listASNs(
    supabase: SupabaseClient,
    filters: ASNFilters
  ): Promise<any[]> {
    // Build query with joins for supplier and PO data
    let query = supabase
      .from('asns')
      .select(`
        *,
        supplier:suppliers!supplier_id(name),
        po:purchase_orders!po_id(po_number),
        items:asn_items(id)
      `)

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    // Optimized search: Search across asn_number only (main search field)
    // Note: PostgREST doesn't support OR across joined tables easily
    // We filter on asn_number with index support, frontend can expand if needed
    if (filters.search) {
      query = query.ilike('asn_number', `%${filters.search}%`)
    }

    if (filters.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id)
    }

    if (filters.po_id) {
      query = query.eq('po_id', filters.po_id)
    }

    if (filters.date_from) {
      query = query.gte('expected_date', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('expected_date', filters.date_to)
    }

    const sort = filters.sort || 'created_at'
    const order = filters.order || 'desc'
    query = query.order(sort, { ascending: order === 'asc' })

    const page = filters.page || 1
    const limit = filters.limit || 20
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error } = await query

    if (error) throw error

    // Transform response to include flattened joined data
    return (data || []).map((asn: any) => ({
      ...asn,
      supplier_name: asn.supplier?.name || '',
      po_number: asn.po?.po_number || '',
      items_count: asn.items?.length || 0,
    }))
  }

  /**
   * Get ASN by ID with details
   */
  static async getASNById(
    supabase: SupabaseClient,
    id: string
  ): Promise<ASNWithDetails | null> {
    const { data: asn, error: asnError } = await supabase
      .from('asns')
      .select('*')
      .eq('id', id)
      .single()

    if (asnError || !asn) return null

    const { data: items } = await supabase
      .from('asn_items')
      .select('*')
      .eq('asn_id', id)

    const { data: supplier } = await supabase
      .from('suppliers')
      .select('name')
      .eq('id', asn.supplier_id)
      .single()

    const { data: po } = await supabase
      .from('purchase_orders')
      .select('po_number')
      .eq('id', asn.po_id)
      .single()

    return {
      ...asn,
      items: items || [],
      supplier_name: supplier?.name || '',
      po_number: po?.po_number || '',
    }
  }

  /**
   * Initiate receiving from ASN (create GRN)
   */
  static async initiateReceivingFromASN(
    supabase: SupabaseClient,
    asnId: string
  ): Promise<{ grn_id: string }> {
    // This would create a GRN pre-filled with ASN data
    // For now, return placeholder
    return { grn_id: 'placeholder-grn-id' }
  }

  /**
   * Update ASN status (called after GRN receipts)
   */
  static async updateASNStatus(
    supabase: SupabaseClient,
    asnId: string
  ): Promise<void> {
    const { data: items, error } = await supabase
      .from('asn_items')
      .select('*')
      .eq('asn_id', asnId)

    if (error || !items) throw error || new Error('Items not found')

    const status = await this.calculateASNStatus(items)

    await supabase.from('asns').update({ status }).eq('id', asnId)
  }

  /**
   * Check if ASN can be deleted
   */
  static async canDeleteASN(
    supabase: SupabaseClient,
    asnId: string
  ): Promise<boolean> {
    const { data: asn } = await supabase
      .from('asns')
      .select('status')
      .eq('id', asnId)
      .single()

    if (!asn || asn.status !== 'pending') return false

    const { data: items } = await supabase
      .from('asn_items')
      .select('received_qty')
      .eq('asn_id', asnId)

    const hasReceipts = (items || []).some((item: any) => item.received_qty > 0)
    return !hasReceipts
  }

  /**
   * Check if ASN can be edited
   */
  static async canEditASN(
    supabase: SupabaseClient,
    asnId: string
  ): Promise<boolean> {
    const { data: asn } = await supabase
      .from('asns')
      .select('status')
      .eq('id', asnId)
      .single()

    return asn?.status === 'pending'
  }
}
