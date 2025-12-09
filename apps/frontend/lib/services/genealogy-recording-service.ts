/**
 * Genealogy Recording Service
 * Story 5.29: Automatic genealogy recording for all LP operations
 *
 * Provides high-level API for recording genealogy in LP operations:
 * - Split (1→many)
 * - Merge (many→1)
 * - Production (consumed→produced)
 * - Consumption (LP→WO)
 */

import { createAdminClient } from '../supabase/admin-client'

export interface GenealogyRecord {
  id: string
  org_id: string
  parent_lp_id: string
  child_lp_id: string | null
  relationship_type: string
  work_order_id?: string | null
  transfer_order_id?: string | null
  quantity_from_parent: number
  uom: string
  created_by: string
  created_at: string
}

/**
 * Record split genealogy (parent→children)
 * AC-5.29.2: Integrate into LP Split
 */
export async function recordSplit(
  orgId: string,
  parentLpId: string,
  childLpIds: string[],
  qtyPerChild: number[],
  uom: string,
  userId: string
): Promise<GenealogyRecord[]> {
  const supabase = createAdminClient()
  const records: GenealogyRecord[] = []

  // AC-5.29.4: Validate LP exists
  const { data: parentLp, error: parentError } = await supabase
    .from('license_plates')
    .select('id')
    .eq('id', parentLpId)
    .single()

  if (parentError || !parentLp) {
    throw new Error(`Parent LP ${parentLpId} not found`)
  }

  // Record each parent→child relationship
  for (let i = 0; i < childLpIds.length; i++) {
    const childId = childLpIds[i]
    const qty = qtyPerChild[i]

    // AC-5.29.4: Validate child LP exists
    const { data: childLp, error: childError } = await supabase
      .from('license_plates')
      .select('id')
      .eq('id', childId)
      .single()

    if (childError || !childLp) {
      console.warn(`Child LP ${childId} not found - skipping genealogy record`)
      continue
    }

    const { data, error } = await supabase
      .from('lp_genealogy')
      .insert({
        org_id: orgId,
        parent_lp_id: parentLpId,
        child_lp_id: childId,
        relationship_type: 'split',
        quantity_from_parent: qty,
        uom: uom,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error(`Failed to record split genealogy for child ${childId}:`, error)
      continue
    }

    records.push(data)
  }

  return records
}

/**
 * Record merge genealogy (parents→child)
 * AC-5.29.2: Integrate into LP Merge
 */
export async function recordMerge(
  orgId: string,
  parentLpIds: string[],
  childLpId: string,
  qtys: number[],
  uom: string,
  userId: string
): Promise<GenealogyRecord[]> {
  const supabase = createAdminClient()
  const records: GenealogyRecord[] = []

  // AC-5.29.4: Validate child LP exists
  const { data: childLp, error: childError } = await supabase
    .from('license_plates')
    .select('id')
    .eq('id', childLpId)
    .single()

  if (childError || !childLp) {
    throw new Error(`Child LP ${childLpId} not found`)
  }

  // Record each parent→child relationship
  for (let i = 0; i < parentLpIds.length; i++) {
    const parentId = parentLpIds[i]
    const qty = qtys[i]

    const { data, error } = await supabase
      .from('lp_genealogy')
      .insert({
        org_id: orgId,
        parent_lp_id: parentId,
        child_lp_id: childLpId,
        relationship_type: 'combine',
        quantity_from_parent: qty,
        uom: uom,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error(`Failed to record merge genealogy for parent ${parentId}:`, error)
      continue
    }

    records.push(data)
  }

  return records
}

/**
 * Record consumption genealogy (consumed LP→WO, no output LP yet)
 * AC-5.29.2: For manual consumption without output
 */
export async function recordConsumption(
  orgId: string,
  consumedLpId: string,
  woId: string,
  qty: number,
  uom: string,
  userId: string,
  reservationId?: string
): Promise<GenealogyRecord> {
  const supabase = createAdminClient()

  // AC-5.29.4: Validate LP exists
  const { data: lp, error: lpError } = await supabase
    .from('license_plates')
    .select('id')
    .eq('id', consumedLpId)
    .single()

  if (lpError || !lp) {
    throw new Error(`LP ${consumedLpId} not found`)
  }

  const { data, error } = await supabase
    .from('lp_genealogy')
    .insert({
      org_id: orgId,
      parent_lp_id: consumedLpId,
      child_lp_id: null, // No output LP yet
      relationship_type: 'production',
      work_order_id: woId,
      quantity_from_parent: qty,
      uom: uom,
      created_by: userId,
      wo_material_reservation_id: reservationId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to record consumption genealogy: ${error.message}`)
  }

  return data
}

/**
 * Record production genealogy (consumed LPs→produced LP)
 * AC-5.29.2: Integrate into production output registration
 */
export async function recordProduction(
  orgId: string,
  consumedLpIds: string[],
  producedLpId: string,
  woId: string,
  consumedQtys: number[],
  uom: string,
  userId: string,
  reservationIds?: string[]
): Promise<GenealogyRecord[]> {
  const supabase = createAdminClient()
  const records: GenealogyRecord[] = []

  // AC-5.29.4: Validate produced LP exists
  const { data: producedLp, error: producedError } = await supabase
    .from('license_plates')
    .select('id')
    .eq('id', producedLpId)
    .single()

  if (producedError || !producedLp) {
    throw new Error(`Produced LP ${producedLpId} not found`)
  }

  // AC-5.29.4: Prevent circular references
  if (consumedLpIds.includes(producedLpId)) {
    throw new Error('Circular reference detected: produced LP cannot be in consumed list')
  }

  // Record each consumed→produced relationship
  for (let i = 0; i < consumedLpIds.length; i++) {
    const consumedId = consumedLpIds[i]
    const qty = consumedQtys[i]
    const reservationId = reservationIds?.[i]

    const { data, error } = await supabase
      .from('lp_genealogy')
      .insert({
        org_id: orgId,
        parent_lp_id: consumedId,
        child_lp_id: producedLpId,
        relationship_type: 'production',
        work_order_id: woId,
        quantity_from_parent: qty,
        uom: uom,
        created_by: userId,
        wo_material_reservation_id: reservationId,
      })
      .select()
      .single()

    if (error) {
      console.error(`Failed to record production genealogy for consumed LP ${consumedId}:`, error)
      continue
    }

    records.push(data)
  }

  return records
}

/**
 * Validate no circular references in genealogy
 * AC-5.29.4: Prevent parent being descendant of child
 *
 * Uses recursive query to check if parentId is descendant of childId
 */
export async function validateNoCircularReference(
  parentLpId: string,
  childLpId: string
): Promise<boolean> {
  const supabase = createAdminClient()

  // Check if parent is a descendant of child (would create cycle)
  const { data, error } = await supabase.rpc('check_genealogy_cycle', {
    p_parent_lp_id: parentLpId,
    p_child_lp_id: childLpId,
  })

  if (error) {
    console.warn('Failed to check circular reference:', error)
    return true // Assume valid if check fails
  }

  return !data // Return true if no cycle found
}

/**
 * Get genealogy chain for an LP (all ancestors and descendants)
 */
export async function getGenealogyChain(lpId: string): Promise<{
  ancestors: GenealogyRecord[]
  descendants: GenealogyRecord[]
}> {
  const supabase = createAdminClient()

  const [ancestorsResult, descendantsResult] = await Promise.all([
    supabase
      .from('lp_genealogy')
      .select('*')
      .eq('child_lp_id', lpId)
      .order('created_at', { ascending: true }),
    supabase
      .from('lp_genealogy')
      .select('*')
      .eq('parent_lp_id', lpId)
      .order('created_at', { ascending: true }),
  ])

  return {
    ancestors: ancestorsResult.data || [],
    descendants: descendantsResult.data || [],
  }
}
