// GRN Service - Goods Receipt Notes (Batch 5A - Story 5.11)
import { createAdminClient } from '../supabase/admin-client'

export type GRNStatus = 'draft' | 'completed' | 'cancelled'

export interface GRN {
  id: string
  org_id: string
  grn_number: string
  po_id: string | null
  asn_id: string | null
  warehouse_id: string
  status: GRNStatus
  received_by: string | null
  received_at: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined fields
  purchase_order?: { po_number: string }
  warehouse?: { code: string; name: string }
  items?: GRNItem[]
}

export interface GRNItem {
  id: string
  grn_id: string
  po_line_id: string | null
  product_id: string
  expected_qty: number
  received_qty: number
  uom: string
  lp_id: string | null
  location_id: string | null
  supplier_batch_number: string | null
  expiry_date: string | null
  notes: string | null
  created_at: string
  // Joined
  product?: { code: string; name: string }
  license_plate?: { lp_number: string }
}

export interface CreateGRNInput {
  org_id: string
  po_id: string
  warehouse_id: string
  location_id: string
  items: CreateGRNItemInput[]
  notes?: string
  created_by: string
}

export interface CreateGRNItemInput {
  product_id: string
  po_line_id?: string
  expected_qty?: number
  received_qty: number
  uom: string
  supplier_batch_number?: string
  expiry_date?: string
}

export interface GRNFilters {
  org_id: string
  status?: GRNStatus
  warehouse_id?: string
  po_id?: string
  from_date?: string
  to_date?: string
}

export interface CreateGRNResult {
  grn_id: string
  grn_number: string
  lps: { lp_id: string; lp_number: string }[]
}

/**
 * Get all GRNs with filters
 */
export async function getGRNs(filters: GRNFilters): Promise<GRN[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('grn')
    .select(`
      *,
      purchase_order:purchase_orders(po_number),
      warehouse:warehouses(code, name),
      items:grn_items(
        *,
        product:products(code, name),
        license_plate:license_plates(lp_number)
      )
    `)
    .eq('org_id', filters.org_id)

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.warehouse_id) {
    query = query.eq('warehouse_id', filters.warehouse_id)
  }
  if (filters.po_id) {
    query = query.eq('po_id', filters.po_id)
  }
  if (filters.from_date) {
    query = query.gte('created_at', filters.from_date)
  }
  if (filters.to_date) {
    query = query.lte('created_at', filters.to_date)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch GRNs: ${error.message}`)
  return data as GRN[]
}

/**
 * Get single GRN by ID
 */
export async function getGRNById(id: string): Promise<GRN | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('grn')
    .select(`
      *,
      purchase_order:purchase_orders(po_number),
      warehouse:warehouses(code, name),
      items:grn_items(
        *,
        product:products(code, name),
        license_plate:license_plates(lp_number)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch GRN: ${error.message}`)
  }
  return data as GRN
}

/**
 * Create GRN with LP creation (Story 5.11a/b/c - atomic transaction)
 */
export async function createGRNWithLP(input: CreateGRNInput): Promise<CreateGRNResult> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('create_grn_with_lp', {
    p_org_id: input.org_id,
    p_po_id: input.po_id,
    p_warehouse_id: input.warehouse_id,
    p_location_id: input.location_id,
    p_items: input.items,
    p_created_by: input.created_by,
    p_notes: input.notes || null
  })

  if (error) throw new Error(`Failed to create GRN: ${error.message}`)
  return data as CreateGRNResult
}

/**
 * Cancel GRN (only draft status)
 */
export async function cancelGRN(id: string): Promise<void> {
  const supabase = createAdminClient()

  const grn = await getGRNById(id)
  if (!grn) throw new Error('GRN not found')
  if (grn.status !== 'draft') {
    throw new Error(`Cannot cancel GRN with status: ${grn.status}`)
  }

  const { error } = await supabase
    .from('grn')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`Failed to cancel GRN: ${error.message}`)
}

/**
 * Get GRNs for a Purchase Order
 */
export async function getGRNsByPO(poId: string): Promise<GRN[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('grn')
    .select(`
      *,
      warehouse:warehouses(code, name),
      items:grn_items(
        *,
        product:products(code, name),
        license_plate:license_plates(lp_number)
      )
    `)
    .eq('po_id', poId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch GRNs for PO: ${error.message}`)
  return data as GRN[]
}
