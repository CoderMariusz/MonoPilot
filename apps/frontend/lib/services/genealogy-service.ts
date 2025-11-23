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
