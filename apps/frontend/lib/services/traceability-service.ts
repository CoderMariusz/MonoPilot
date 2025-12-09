/**
 * Traceability Service
 * Story 5.28: Forward/Backward Traceability
 *
 * Provides LP genealogy tracing for QC Managers:
 * - getForwardTrace: Find all descendants (children/grandchildren)
 * - getBackwardTrace: Find all ancestors (parents/grandparents)
 * - validateNoCycle: Ensure no circular references
 */

import { createAdminClient } from '../supabase/admin-client'

// ============================================
// Types
// ============================================

export interface TraceNode {
  lp_id: string
  lp_number: string
  product_id: string
  product_code: string
  product_name: string
  current_qty: number
  uom: string
  status: string
  batch_number: string | null
  expiry_date: string | null
  operation_type: 'split' | 'combine' | 'transform' | 'production' | string
  wo_id: string | null
  wo_number: string | null
  grn_id: string | null
  grn_number: string | null
  quantity_used: number
  relationship_created_at: string
  depth: number
  path: string[]
}

export interface TraceTree {
  root: {
    lp_id: string
    lp_number: string
    product_code: string
    product_name: string
    current_qty: number
    status: string
  }
  nodes: TraceNode[]
  summary: {
    total_count: number
    max_depth: number
    by_operation_type: Record<string, number>
    by_status: Record<string, number>
  }
}

export interface TraceResult {
  success: boolean
  data?: TraceTree
  error?: string
  execution_time_ms?: number
}

// ============================================
// Forward Trace (Descendants)
// ============================================

/**
 * Get all descendants (children/grandchildren) of a License Plate
 * Uses recursive CTE via get_lp_descendants SQL function
 *
 * @param lpId - UUID of the LP to trace from
 * @param maxDepth - Maximum trace depth (default: 10)
 * @returns TraceResult with tree structure
 */
export async function getForwardTrace(
  lpId: string,
  maxDepth: number = 10
): Promise<TraceResult> {
  const startTime = Date.now()
  const supabase = createAdminClient()

  try {
    // Validate lpId
    if (!lpId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lpId)) {
      return { success: false, error: 'Invalid LP ID format' }
    }

    // Get root LP info
    const { data: rootLp, error: rootError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        current_qty,
        status,
        product:products(code, name)
      `)
      .eq('id', lpId)
      .single()

    if (rootError || !rootLp) {
      return { success: false, error: 'License plate not found' }
    }

    // Call RPC function for descendants
    const { data: descendants, error: traceError } = await supabase.rpc(
      'get_lp_descendants',
      {
        p_lp_id: lpId,
        p_max_depth: Math.min(maxDepth, 10) // Cap at 10
      }
    )

    if (traceError) {
      console.error('Forward trace error:', traceError)
      return { success: false, error: `Trace failed: ${traceError.message}` }
    }

    const nodes: TraceNode[] = (descendants || []).map((row: any) => ({
      lp_id: row.lp_id,
      lp_number: row.lp_number,
      product_id: row.product_id,
      product_code: row.product_code,
      product_name: row.product_name,
      current_qty: parseFloat(row.current_qty),
      uom: row.uom,
      status: row.status,
      batch_number: row.batch_number,
      expiry_date: row.expiry_date,
      operation_type: row.operation_type,
      wo_id: row.wo_id,
      wo_number: row.wo_number,
      grn_id: row.grn_id,
      grn_number: row.grn_number,
      quantity_used: parseFloat(row.quantity_used),
      relationship_created_at: row.relationship_created_at,
      depth: row.depth,
      path: row.path || []
    }))

    // Calculate summary
    const summary = calculateSummary(nodes)

    const result: TraceTree = {
      root: {
        lp_id: rootLp.id,
        lp_number: rootLp.lp_number,
        product_code: (rootLp.product as any)?.code || '',
        product_name: (rootLp.product as any)?.name || '',
        current_qty: rootLp.current_qty,
        status: rootLp.status
      },
      nodes,
      summary
    }

    return {
      success: true,
      data: result,
      execution_time_ms: Date.now() - startTime
    }
  } catch (error) {
    console.error('Forward trace exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      execution_time_ms: Date.now() - startTime
    }
  }
}

// ============================================
// Backward Trace (Ancestors)
// ============================================

/**
 * Get all ancestors (parents/grandparents) of a License Plate
 * Uses recursive CTE via get_lp_ancestors SQL function
 *
 * @param lpId - UUID of the LP to trace from
 * @param maxDepth - Maximum trace depth (default: 10)
 * @returns TraceResult with tree structure
 */
export async function getBackwardTrace(
  lpId: string,
  maxDepth: number = 10
): Promise<TraceResult> {
  const startTime = Date.now()
  const supabase = createAdminClient()

  try {
    // Validate lpId
    if (!lpId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lpId)) {
      return { success: false, error: 'Invalid LP ID format' }
    }

    // Get root LP info
    const { data: rootLp, error: rootError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        current_qty,
        status,
        product:products(code, name)
      `)
      .eq('id', lpId)
      .single()

    if (rootError || !rootLp) {
      return { success: false, error: 'License plate not found' }
    }

    // Call RPC function for ancestors
    const { data: ancestors, error: traceError } = await supabase.rpc(
      'get_lp_ancestors',
      {
        p_lp_id: lpId,
        p_max_depth: Math.min(maxDepth, 10) // Cap at 10
      }
    )

    if (traceError) {
      console.error('Backward trace error:', traceError)
      return { success: false, error: `Trace failed: ${traceError.message}` }
    }

    const nodes: TraceNode[] = (ancestors || []).map((row: any) => ({
      lp_id: row.lp_id,
      lp_number: row.lp_number,
      product_id: row.product_id,
      product_code: row.product_code,
      product_name: row.product_name,
      current_qty: parseFloat(row.current_qty),
      uom: row.uom,
      status: row.status,
      batch_number: row.batch_number,
      expiry_date: row.expiry_date,
      operation_type: row.operation_type,
      wo_id: row.wo_id,
      wo_number: row.wo_number,
      grn_id: row.grn_id,
      grn_number: row.grn_number,
      quantity_used: parseFloat(row.quantity_used),
      relationship_created_at: row.relationship_created_at,
      depth: row.depth,
      path: row.path || []
    }))

    // Calculate summary
    const summary = calculateSummary(nodes)

    const result: TraceTree = {
      root: {
        lp_id: rootLp.id,
        lp_number: rootLp.lp_number,
        product_code: (rootLp.product as any)?.code || '',
        product_name: (rootLp.product as any)?.name || '',
        current_qty: rootLp.current_qty,
        status: rootLp.status
      },
      nodes,
      summary
    }

    return {
      success: true,
      data: result,
      execution_time_ms: Date.now() - startTime
    }
  } catch (error) {
    console.error('Backward trace exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      execution_time_ms: Date.now() - startTime
    }
  }
}

// ============================================
// Cycle Validation
// ============================================

/**
 * Validate that adding a genealogy link would not create a cycle
 *
 * @param parentId - UUID of potential parent LP
 * @param childId - UUID of potential child LP
 * @returns true if NO cycle would be created (safe to add)
 */
export async function validateNoCycle(
  parentId: string,
  childId: string
): Promise<{ valid: boolean; error?: string }> {
  const supabase = createAdminClient()

  try {
    // Self-reference check
    if (parentId === childId) {
      return { valid: false, error: 'LP cannot be its own parent' }
    }

    // Call RPC function
    const { data, error } = await supabase.rpc('validate_no_cycle', {
      p_parent_id: parentId,
      p_child_id: childId
    })

    if (error) {
      console.error('Cycle validation error:', error)
      return { valid: false, error: `Validation failed: ${error.message}` }
    }

    return { valid: data === true }
  } catch (error) {
    console.error('Cycle validation exception:', error)
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================
// CSV Export
// ============================================

/**
 * Convert trace nodes to CSV format
 */
export function convertToCSV(nodes: TraceNode[], direction: 'forward' | 'backward'): string {
  const headers = [
    'LP Number',
    'Product Code',
    'Product Name',
    'Quantity',
    'UOM',
    'Status',
    'Batch Number',
    'Expiry Date',
    'Operation Type',
    'WO Number',
    'GRN Number',
    'Qty Used',
    'Relationship Date',
    'Depth'
  ]

  const rows = nodes.map(node => [
    node.lp_number,
    node.product_code,
    node.product_name,
    node.current_qty.toString(),
    node.uom,
    node.status,
    node.batch_number || '',
    node.expiry_date || '',
    node.operation_type,
    node.wo_number || '',
    node.grn_number || '',
    node.quantity_used.toString(),
    node.relationship_created_at,
    node.depth.toString()
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

// ============================================
// Helper Functions
// ============================================

function calculateSummary(nodes: TraceNode[]) {
  const byOperationType: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  let maxDepth = 0

  for (const node of nodes) {
    // Count by operation type
    byOperationType[node.operation_type] = (byOperationType[node.operation_type] || 0) + 1

    // Count by status
    byStatus[node.status] = (byStatus[node.status] || 0) + 1

    // Track max depth
    if (node.depth > maxDepth) {
      maxDepth = node.depth
    }
  }

  return {
    total_count: nodes.length,
    max_depth: maxDepth,
    by_operation_type: byOperationType,
    by_status: byStatus
  }
}
