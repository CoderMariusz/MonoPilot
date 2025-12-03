/**
 * BOM Item Service - Story 2.26
 * Handles BOM item operations with operation assignment and line-specific configs
 */

import { createServerSupabase } from '@/lib/supabase/server'
import { BOMItem, BOMItemsByOperation, CreateBOMItemInput, UpdateBOMItemInput } from '@/lib/validation/bom-schemas'

// Helper to get current user's org_id
async function getCurrentUserOrgId(): Promise<{ userId: string; orgId: string } | null> {
  const supabase = await createServerSupabase()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  console.log('getCurrentUserOrgId - session:', session?.user?.id, 'error:', sessionError)
  if (!session?.user?.id) return null

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', session.user.id)
    .single()

  console.log('getCurrentUserOrgId - user:', user, 'error:', userError)
  if (!user?.org_id) return null
  return { userId: session.user.id, orgId: user.org_id }
}

/**
 * List BOM items with optional grouping by operation
 * AC-2.26.3
 */
export async function listBomItems(
  bomId: string,
  options?: { groupByOperation?: boolean }
): Promise<BOMItem[] | { operations: BOMItemsByOperation[] }> {
  const supabase = await createServerSupabase()

  // Verify BOM exists
  const { data: bom, error: bomError } = await supabase
    .from('boms')
    .select('id, routing_id')
    .eq('id', bomId)
    .single()

  if (bomError || !bom) {
    throw new Error('BOM_NOT_FOUND')
  }

  // Get items with component join
  const { data: items, error } = await supabase
    .from('bom_items')
    .select(`
      *,
      component:products!component_id (
        id,
        code,
        name,
        uom,
        type
      )
    `)
    .eq('bom_id', bomId)
    .order('operation_seq', { ascending: true })
    .order('sequence', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch BOM items: ${error.message}`)
  }

  // Get routing operations if routing exists
  let operationsMap: Map<number, { sequence: number; name: string }> = new Map()
  if (bom.routing_id) {
    const { data: ops } = await supabase
      .from('routing_operations')
      .select('sequence, name')
      .eq('routing_id', bom.routing_id)

    if (ops) {
      ops.forEach(op => operationsMap.set(op.sequence, op))
    }
  }

  // Add operation details to items
  const enrichedItems = (items || []).map(item => ({
    ...item,
    operation: operationsMap.get(item.operation_seq) || undefined
  })) as BOMItem[]

  // If not grouping, return flat list
  if (!options?.groupByOperation) {
    return enrichedItems
  }

  // Group by operation
  const grouped = new Map<number, BOMItemsByOperation>()

  for (const item of enrichedItems) {
    if (!grouped.has(item.operation_seq)) {
      grouped.set(item.operation_seq, {
        operation_seq: item.operation_seq,
        operation_name: item.operation?.name || null,
        inputs: [],
        outputs: []
      })
    }

    const group = grouped.get(item.operation_seq)!
    if (item.is_output) {
      group.outputs.push(item)
    } else {
      group.inputs.push(item)
    }
  }

  return {
    operations: Array.from(grouped.values()).sort((a, b) => a.operation_seq - b.operation_seq)
  }
}

/**
 * Create a new BOM item
 * AC-2.26.4
 */
export async function createBomItem(
  bomId: string,
  input: CreateBOMItemInput
): Promise<BOMItem> {
  console.log('createBomItem called with bomId:', bomId, 'input:', input)

  const supabase = await createServerSupabase()

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Get user's org_id
  const { data: user } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', session.user.id)
    .single()

  if (!user?.org_id) {
    throw new Error('Unauthorized')
  }

  const orgId = user.org_id

  // Get BOM with routing (using user's session - RLS will filter by org)
  console.log('Fetching BOM with id:', bomId)
  const { data: bom, error: bomError } = await supabase
    .from('boms')
    .select('id, org_id, product_id, routing_id')
    .eq('id', bomId)
    .single()

  console.log('BOM query result:', { bom, bomError })

  if (bomError || !bom) {
    console.log('BOM not found or error:', bomError)
    throw new Error('BOM_NOT_FOUND')
  }

  // Validate component exists
  const { data: component, error: compError } = await supabase
    .from('products')
    .select('id, org_id')
    .eq('id', input.component_id)
    .single()

  if (compError || !component) {
    throw new Error('INVALID_COMPONENT')
  }

  if (component.org_id !== orgId) {
    throw new Error('INVALID_COMPONENT')
  }

  // Check self-reference (only allowed for outputs)
  if (input.component_id === bom.product_id && !input.is_output) {
    throw new Error('SELF_REFERENCE')
  }

  // Validate operation_seq if BOM has routing
  if (bom.routing_id) {
    const isValid = await validateOperationSeq(bom.routing_id, input.operation_seq)
    if (!isValid) {
      throw new Error('OPERATION_NOT_FOUND')
    }
  }

  // Validate line_ids if provided
  if (input.line_ids && input.line_ids.length > 0) {
    const isValid = await validateLineIds(bomId, input.line_ids)
    if (!isValid) {
      throw new Error('LINE_NOT_IN_BOM')
    }
  }

  // Insert item
  const { data: newItem, error: insertError } = await supabase
    .from('bom_items')
    .insert({
      bom_id: bomId,
      component_id: input.component_id,
      operation_seq: input.operation_seq,
      is_output: input.is_output ?? false,
      quantity: input.quantity,
      uom: input.uom,
      scrap_percent: input.scrap_percent ?? 0,
      sequence: input.sequence ?? 1,
      line_ids: input.line_ids || null,
      consume_whole_lp: input.consume_whole_lp ?? false,
      notes: input.notes || null
    })
    .select(`
      *,
      component:products!component_id (
        id,
        code,
        name,
        uom,
        type
      )
    `)
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('DUPLICATE_ITEM')
    }
    throw new Error(`Failed to create BOM item: ${insertError.message}`)
  }

  return newItem as BOMItem
}

/**
 * Update a BOM item
 * AC-2.26.5
 */
export async function updateBomItem(
  bomId: string,
  itemId: string,
  input: UpdateBOMItemInput
): Promise<BOMItem> {
  const supabase = await createServerSupabase()

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Get user's org_id
  const { data: user } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', session.user.id)
    .single()

  if (!user?.org_id) {
    throw new Error('Unauthorized')
  }

  const orgId = user.org_id

  // Get BOM (RLS filters by org)
  const { data: bom, error: bomError } = await supabase
    .from('boms')
    .select('id, org_id, product_id, routing_id')
    .eq('id', bomId)
    .single()

  if (bomError || !bom) {
    throw new Error('BOM_NOT_FOUND')
  }

  // Verify item exists
  const { data: existingItem, error: itemError } = await supabase
    .from('bom_items')
    .select('id, component_id, is_output')
    .eq('id', itemId)
    .eq('bom_id', bomId)
    .single()

  if (itemError || !existingItem) {
    throw new Error('ITEM_NOT_FOUND')
  }

  // Validate component if changing
  if (input.component_id) {
    const { data: component } = await supabase
      .from('products')
      .select('id, org_id')
      .eq('id', input.component_id)
      .single()

    if (!component || component.org_id !== orgId) {
      throw new Error('INVALID_COMPONENT')
    }

    // Check self-reference
    const isOutput = input.is_output ?? existingItem.is_output
    if (input.component_id === bom.product_id && !isOutput) {
      throw new Error('SELF_REFERENCE')
    }
  }

  // Validate operation_seq if changing and BOM has routing
  if (input.operation_seq !== undefined && bom.routing_id) {
    const isValid = await validateOperationSeq(bom.routing_id, input.operation_seq)
    if (!isValid) {
      throw new Error('OPERATION_NOT_FOUND')
    }
  }

  // Validate line_ids if changing
  if (input.line_ids !== undefined && input.line_ids !== null && input.line_ids.length > 0) {
    const isValid = await validateLineIds(bomId, input.line_ids)
    if (!isValid) {
      throw new Error('LINE_NOT_IN_BOM')
    }
  }

  // Build update object
  const updateData: Record<string, unknown> = {}
  if (input.component_id !== undefined) updateData.component_id = input.component_id
  if (input.operation_seq !== undefined) updateData.operation_seq = input.operation_seq
  if (input.is_output !== undefined) updateData.is_output = input.is_output
  if (input.quantity !== undefined) updateData.quantity = input.quantity
  if (input.uom !== undefined) updateData.uom = input.uom
  if (input.scrap_percent !== undefined) updateData.scrap_percent = input.scrap_percent
  if (input.sequence !== undefined) updateData.sequence = input.sequence
  if (input.line_ids !== undefined) updateData.line_ids = input.line_ids
  if (input.consume_whole_lp !== undefined) updateData.consume_whole_lp = input.consume_whole_lp
  if (input.notes !== undefined) updateData.notes = input.notes

  // Update
  const { data: updatedItem, error: updateError } = await supabase
    .from('bom_items')
    .update(updateData)
    .eq('id', itemId)
    .select(`
      *,
      component:products!component_id (
        id,
        code,
        name,
        uom,
        type
      )
    `)
    .single()

  if (updateError) {
    throw new Error(`Failed to update BOM item: ${updateError.message}`)
  }

  return updatedItem as BOMItem
}

/**
 * Delete a BOM item
 * AC-2.26.6
 */
export async function deleteBomItem(bomId: string, itemId: string): Promise<void> {
  const supabase = await createServerSupabase()

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Verify BOM exists (RLS filters by org)
  const { data: bom } = await supabase
    .from('boms')
    .select('id')
    .eq('id', bomId)
    .single()

  if (!bom) {
    throw new Error('BOM_NOT_FOUND')
  }

  // Delete item
  const { error } = await supabase
    .from('bom_items')
    .delete()
    .eq('id', itemId)
    .eq('bom_id', bomId)

  if (error) {
    throw new Error(`Failed to delete BOM item: ${error.message}`)
  }
}

/**
 * Get inputs for a specific operation
 * AC-2.26.10
 */
export async function getInputsForOperation(
  bomId: string,
  operationSeq: number
): Promise<BOMItem[]> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from('bom_items')
    .select(`
      *,
      component:products!component_id (id, code, name, uom, type)
    `)
    .eq('bom_id', bomId)
    .eq('operation_seq', operationSeq)
    .eq('is_output', false)
    .order('sequence', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch inputs: ${error.message}`)
  }

  return (data || []) as BOMItem[]
}

/**
 * Get outputs for a specific operation
 * AC-2.26.10
 */
export async function getOutputsForOperation(
  bomId: string,
  operationSeq: number
): Promise<BOMItem[]> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from('bom_items')
    .select(`
      *,
      component:products!component_id (id, code, name, uom, type)
    `)
    .eq('bom_id', bomId)
    .eq('operation_seq', operationSeq)
    .eq('is_output', true)
    .order('sequence', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch outputs: ${error.message}`)
  }

  return (data || []) as BOMItem[]
}

/**
 * Get items for a specific production line
 * AC-2.26.10
 */
export async function getItemsForLine(
  bomId: string,
  lineId: string
): Promise<BOMItem[]> {
  const supabase = await createServerSupabase()

  // Items where line_ids is NULL (all lines) OR contains lineId
  const { data, error } = await supabase
    .from('bom_items')
    .select(`
      *,
      component:products!component_id (id, code, name, uom, type)
    `)
    .eq('bom_id', bomId)
    .or(`line_ids.is.null,line_ids.cs.{${lineId}}`)
    .order('operation_seq', { ascending: true })
    .order('sequence', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch items for line: ${error.message}`)
  }

  return (data || []) as BOMItem[]
}

/**
 * Validate operation sequence exists in routing
 * AC-2.26.8
 */
export async function validateOperationSeq(
  routingId: string,
  operationSeq: number
): Promise<boolean> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from('routing_operations')
    .select('sequence')
    .eq('routing_id', routingId)
    .eq('sequence', operationSeq)
    .single()

  return !error && !!data
}

/**
 * Validate line_ids are assigned to BOM
 * AC-2.26.9
 */
export async function validateLineIds(
  bomId: string,
  lineIds: string[]
): Promise<boolean> {
  const supabase = await createServerSupabase()

  // Get BOM's assigned production lines
  const { data: bomLines, error } = await supabase
    .from('bom_production_lines')
    .select('line_id')
    .eq('bom_id', bomId)

  if (error || !bomLines) {
    return false
  }

  const bomLineIds = new Set(bomLines.map(l => l.line_id))

  // All provided lineIds must be in BOM's assigned lines
  for (const lineId of lineIds) {
    if (!bomLineIds.has(lineId)) {
      return false
    }
  }

  return true
}

/**
 * Calculate scrap quantity
 * AC-2.26.10
 */
export function calculateScrapQuantity(quantity: number, scrapPercent: number): number {
  return Math.round(quantity * (scrapPercent / 100) * 10000) / 10000
}
