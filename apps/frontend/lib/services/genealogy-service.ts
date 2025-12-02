// Genealogy Service - Forward/Backward Traceability (Stories 2.18, 2.19)
import { createAdminClient } from '../supabase/admin-client'
import type { TraceNode, TraceResult } from '../types/traceability'

/**
 * Forward trace: Find all descendants (children) of an LP
 * Uses recursive CTE to traverse lp_genealogy table
 */
export async function traceForward(
  lpId: string,
  maxDepth: number = 20
): Promise<TraceResult> {
  const supabase = createAdminClient()

  // Recursive CTE query for forward trace
  const { data, error } = await supabase.rpc('trace_forward', {
    p_lp_id: lpId,
    p_max_depth: maxDepth
  })

  if (error) throw new Error(`Forward trace failed: ${error.message}`)

  // Transform flat result into tree structure
  const tree = buildTree(data)

  return {
    root_lp: data[0]?.lp,
    trace_tree: tree,
    summary: {
      total_descendants: data.length,
      max_depth: Math.max(...data.map((n: any) => n.depth))
    }
  }
}

/**
 * Backward trace: Find all ancestors (parents) of an LP
 */
export async function traceBackward(
  lpId: string,
  maxDepth: number = 20
): Promise<TraceResult> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('trace_backward', {
    p_lp_id: lpId,
    p_max_depth: maxDepth
  })

  if (error) throw new Error(`Backward trace failed: ${error.message}`)

  const tree = buildTree(data)

  return {
    root_lp: data[0]?.lp,
    trace_tree: tree,
    summary: {
      total_ancestors: data.length,
      max_depth: Math.max(...data.map((n: any) => n.depth))
    }
  }
}

function buildTree(flatData: any[]): TraceNode[] {
  // Simple tree builder - group by depth
  const byDepth = flatData.reduce((acc, node) => {
    if (!acc[node.depth]) acc[node.depth] = []
    acc[node.depth].push(node)
    return acc
  }, {} as Record<number, any[]>)

  return byDepth[1] || []
}

// ============================================
// Story 4.19: Genealogy Record Creation
// ============================================

export interface GenealogyEntry {
  id: string
  parent_lp_id: string
  child_lp_id: string | null
  relationship_type: string
  work_order_id: string | null
  quantity_from_parent: number
  uom: string
  created_by: string | null
  created_at: string
  wo_material_reservation_id: string | null
}

/**
 * Create genealogy records when output is registered (AC-4.19.1)
 * Links consumed parent LPs to the produced child LP
 */
export async function createOutputGenealogy(
  woId: string,
  outputLpId: string,
  consumedReservations: Array<{
    reservation_id: string
    lp_id: string
    consumed_qty: number
    uom: string
  }>,
  userId: string
): Promise<GenealogyEntry[]> {
  const supabase = createAdminClient()
  const entries: GenealogyEntry[] = []

  for (const consumed of consumedReservations) {
    const { data, error } = await supabase
      .from('lp_genealogy')
      .insert({
        parent_lp_id: consumed.lp_id,
        child_lp_id: outputLpId,
        relationship_type: 'production',
        work_order_id: woId,
        quantity_from_parent: consumed.consumed_qty,
        uom: consumed.uom,
        created_by: userId,
        wo_material_reservation_id: consumed.reservation_id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating genealogy entry:', error)
      throw new Error(`Failed to create genealogy: ${error.message}`)
    }

    entries.push(data)
  }

  return entries
}

/**
 * Create genealogy entry for partial LP consumption (AC-4.19.2)
 */
export async function createPartialConsumptionGenealogy(
  parentLpId: string,
  childLpId: string,
  woId: string,
  consumedQty: number,
  uom: string,
  userId: string,
  reservationId?: string
): Promise<GenealogyEntry> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('lp_genealogy')
    .insert({
      parent_lp_id: parentLpId,
      child_lp_id: childLpId,
      relationship_type: 'production',
      work_order_id: woId,
      quantity_from_parent: consumedQty,
      uom: uom,
      created_by: userId,
      wo_material_reservation_id: reservationId || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create genealogy: ${error.message}`)
  }

  return data
}

/**
 * Get all genealogy records for a work order
 */
export async function getWOGenealogy(woId: string): Promise<GenealogyEntry[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('lp_genealogy')
    .select('*')
    .eq('work_order_id', woId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching WO genealogy:', error)
    return []
  }

  return data || []
}

/**
 * Get genealogy records for an LP (both as parent and child)
 */
export async function getLPGenealogy(lpId: string): Promise<{
  asParent: GenealogyEntry[]
  asChild: GenealogyEntry[]
}> {
  const supabase = createAdminClient()

  const [parentResult, childResult] = await Promise.all([
    supabase
      .from('lp_genealogy')
      .select('*')
      .eq('parent_lp_id', lpId)
      .order('created_at', { ascending: true }),
    supabase
      .from('lp_genealogy')
      .select('*')
      .eq('child_lp_id', lpId)
      .order('created_at', { ascending: true }),
  ])

  return {
    asParent: parentResult.data || [],
    asChild: childResult.data || [],
  }
}
