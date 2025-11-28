// License Plate Service - CRUD and Operations (Batch 5A)
import { createAdminClient } from '../supabase/admin-client'

export type LPStatus = 'available' | 'reserved' | 'consumed' | 'quarantine' | 'shipped' | 'merged' | 'deleted'

export interface LicensePlate {
  id: string
  org_id: string
  lp_number: string
  product_id: string
  quantity: number
  uom: string
  status: LPStatus
  warehouse_id: string | null
  location_id: string | null
  supplier_batch_number: string | null
  manufacturing_date: string | null
  expiry_date: string | null
  received_date: string | null
  deleted_at: string | null
  merged_into_lp_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined fields
  product?: { code: string; name: string }
  location?: { code: string; name: string }
  warehouse?: { code: string; name: string }
}

export interface CreateLPInput {
  org_id: string
  product_id: string
  quantity: number
  uom: string
  warehouse_id: string
  location_id?: string
  supplier_batch_number?: string
  expiry_date?: string
  created_by?: string
}

export interface LPFilters {
  org_id: string
  status?: LPStatus | LPStatus[]
  warehouse_id?: string
  product_id?: string
  includeDeleted?: boolean
}

/**
 * Get all license plates with filters
 */
export async function getLicensePlates(filters: LPFilters): Promise<LicensePlate[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('license_plates')
    .select(`
      *,
      product:products(code, name),
      location:locations(code, name),
      warehouse:warehouses(code, name)
    `)
    .eq('org_id', filters.org_id)

  // Filter by status
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    } else {
      query = query.eq('status', filters.status)
    }
  }

  // Filter by warehouse
  if (filters.warehouse_id) {
    query = query.eq('warehouse_id', filters.warehouse_id)
  }

  // Filter by product
  if (filters.product_id) {
    query = query.eq('product_id', filters.product_id)
  }

  // Exclude soft-deleted by default
  if (!filters.includeDeleted) {
    query = query.is('deleted_at', null)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch LPs: ${error.message}`)
  return data as LicensePlate[]
}

/**
 * Get single LP by ID
 */
export async function getLicensePlateById(id: string): Promise<LicensePlate | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('license_plates')
    .select(`
      *,
      product:products(code, name),
      location:locations(code, name),
      warehouse:warehouses(code, name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch LP: ${error.message}`)
  }
  return data as LicensePlate
}

/**
 * Create new LP
 */
export async function createLicensePlate(input: CreateLPInput): Promise<LicensePlate> {
  const supabase = createAdminClient()

  // Generate LP number
  const { data: lpNumber } = await supabase.rpc('generate_lp_number')

  const { data, error } = await supabase
    .from('license_plates')
    .insert({
      ...input,
      lp_number: lpNumber,
      status: 'available',
      received_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create LP: ${error.message}`)
  return data as LicensePlate
}

/**
 * Update LP status
 */
export async function updateLPStatus(
  id: string,
  status: LPStatus
): Promise<LicensePlate> {
  const supabase = createAdminClient()

  // Validate status transition
  const current = await getLicensePlateById(id)
  if (!current) throw new Error('LP not found')

  // Immutable statuses
  if (['merged', 'deleted', 'consumed', 'shipped'].includes(current.status)) {
    throw new Error(`Cannot change status of ${current.status} LP`)
  }

  const { data, error } = await supabase
    .from('license_plates')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update LP status: ${error.message}`)
  return data as LicensePlate
}

/**
 * Soft delete LP (Story 5.2/5.3)
 */
export async function softDeleteLP(id: string): Promise<void> {
  const supabase = createAdminClient()

  const current = await getLicensePlateById(id)
  if (!current) throw new Error('LP not found')
  if (current.status !== 'available') {
    throw new Error(`Cannot delete LP with status: ${current.status}`)
  }

  const { error } = await supabase
    .from('license_plates')
    .update({
      status: 'deleted',
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw new Error(`Failed to delete LP: ${error.message}`)
}

/**
 * Merge multiple LPs into one (Story 5.6)
 */
export async function mergeLicensePlates(
  sourceLpIds: string[],
  targetLocationId: string,
  createdBy: string
): Promise<string> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('merge_license_plates', {
    p_source_lp_ids: sourceLpIds,
    p_target_location_id: targetLocationId,
    p_created_by: createdBy
  })

  if (error) throw new Error(`Merge failed: ${error.message}`)
  return data as string
}

/**
 * Find orphaned LPs (Story 5.7c)
 */
export async function findOrphanLPs(orgId: string): Promise<LicensePlate[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('find_orphan_lps', {
    p_org_id: orgId
  })

  if (error) throw new Error(`Failed to find orphan LPs: ${error.message}`)
  return data as LicensePlate[]
}
