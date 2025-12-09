/**
 * API Route: Sync Offline Queue
 * Story 5.36: Scanner Offline Queue - Core
 * POST /api/scanner/sync-offline-queue
 *
 * Bulk sync offline operations from scanner PWA
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

interface OfflineOperation {
  id: string
  operation_type: 'receive' | 'consume' | 'output' | 'move' | 'split' | 'count'
  payload: Record<string, unknown>
  performed_at: string
  synced_at?: string
  retry_count: number
  user_id: string
  org_id: string
}

interface SyncRequest {
  operations: OfflineOperation[]
}

interface FailedOperation {
  id: string
  error: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createServerSupabase()

    // Authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          synced_count: 0,
          failed_count: 0,
          failed_operations: [],
        },
        { status: 401 }
      )
    }

    // Get user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
          synced_count: 0,
          failed_count: 0,
          failed_operations: [],
        },
        { status: 404 }
      )
    }

    // Parse request
    const body: SyncRequest = await request.json()
    const { operations } = body

    if (!operations || !Array.isArray(operations)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request: operations array required',
          synced_count: 0,
          failed_count: 0,
          failed_operations: [],
        },
        { status: 400 }
      )
    }

    if (operations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No operations to sync',
        synced_count: 0,
        failed_count: 0,
        failed_operations: [],
      })
    }

    // Validate all operations belong to user's org
    const invalidOrg = operations.find((op) => op.org_id !== currentUser.org_id)
    if (invalidOrg) {
      return NextResponse.json(
        {
          success: false,
          message: 'Operation org_id mismatch',
          synced_count: 0,
          failed_count: operations.length,
          failed_operations: [{ id: invalidOrg.id, error: 'Organization mismatch' }],
        },
        { status: 403 }
      )
    }

    // Process operations
    let synced_count = 0
    const failed_operations: FailedOperation[] = []

    for (const operation of operations) {
      try {
        const result = await processOperation(supabase, operation, currentUser.org_id)
        if (result.success) {
          synced_count++
        } else {
          failed_operations.push({ id: operation.id, error: result.error })
        }
      } catch (err) {
        console.error(`[SyncOfflineQueue] Error processing operation ${operation.id}:`, err)
        failed_operations.push({
          id: operation.id,
          error: err instanceof Error ? err.message : 'Processing failed',
        })
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `[SyncOfflineQueue] Processed ${operations.length} operations in ${duration}ms: ${synced_count} synced, ${failed_operations.length} failed`
    )

    return NextResponse.json({
      success: failed_operations.length === 0,
      message:
        failed_operations.length === 0
          ? `Successfully synced ${synced_count} operations`
          : `Synced ${synced_count}, failed ${failed_operations.length}`,
      synced_count,
      failed_count: failed_operations.length,
      failed_operations,
    })
  } catch (error) {
    console.error('[SyncOfflineQueue] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        synced_count: 0,
        failed_count: 0,
        failed_operations: [],
      },
      { status: 500 }
    )
  }
}

/**
 * Process individual offline operation
 */
async function processOperation(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  operation: OfflineOperation,
  orgId: string
): Promise<{ success: boolean; error: string }> {
  const { operation_type, payload, performed_at } = operation

  switch (operation_type) {
    case 'receive':
      return processReceive(supabase, payload, orgId, performed_at)

    case 'move':
      return processMove(supabase, payload, orgId, performed_at)

    case 'consume':
      return processConsume(supabase, payload, orgId, performed_at)

    case 'output':
      return processOutput(supabase, payload, orgId, performed_at)

    case 'split':
      return processSplit(supabase, payload, orgId, performed_at)

    case 'count':
      return processCount(supabase, payload, orgId, performed_at)

    default:
      return { success: false, error: `Unknown operation type: ${operation_type}` }
  }
}

/**
 * Process receive operation
 */
async function processReceive(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  payload: Record<string, unknown>,
  orgId: string,
  performedAt: string
): Promise<{ success: boolean; error: string }> {
  const { asn_item_id, quantity, location_id, lp_number } = payload as {
    asn_item_id?: string
    quantity?: number
    location_id?: string
    lp_number?: string
  }

  if (!asn_item_id || !quantity || !location_id) {
    return { success: false, error: 'Missing required fields: asn_item_id, quantity, location_id' }
  }

  // Get ASN item details
  const { data: asnItem, error: asnError } = await supabase
    .from('asn_items')
    .select('id, asn_id, product_id, expected_qty, received_qty, uom')
    .eq('id', asn_item_id)
    .eq('org_id', orgId)
    .single()

  if (asnError || !asnItem) {
    return { success: false, error: 'ASN item not found' }
  }

  // Create license plate
  const { data: lp, error: lpError } = await supabase
    .from('license_plates')
    .insert({
      org_id: orgId,
      lp_number: lp_number || `LP-${Date.now()}`,
      product_id: asnItem.product_id,
      current_qty: quantity,
      location_id: location_id,
      status: 'available',
      created_at: performedAt,
    })
    .select('id')
    .single()

  if (lpError) {
    return { success: false, error: `Failed to create LP: ${lpError.message}` }
  }

  // Update ASN item received qty
  const newReceivedQty = (asnItem.received_qty || 0) + quantity
  const { error: updateError } = await supabase
    .from('asn_items')
    .update({ received_qty: newReceivedQty, updated_at: new Date().toISOString() })
    .eq('id', asn_item_id)

  if (updateError) {
    return { success: false, error: `Failed to update ASN item: ${updateError.message}` }
  }

  // Create movement record
  await supabase.from('lp_movements').insert({
    org_id: orgId,
    lp_id: lp.id,
    movement_type: 'receipt',
    qty_change: quantity,
    qty_before: 0,
    qty_after: quantity,
    from_location_id: null,
    to_location_id: location_id,
    created_at: performedAt,
  })

  return { success: true, error: '' }
}

/**
 * Process move operation
 */
async function processMove(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  payload: Record<string, unknown>,
  orgId: string,
  performedAt: string
): Promise<{ success: boolean; error: string }> {
  const { lp_id, to_location_id } = payload as {
    lp_id?: string
    to_location_id?: string
  }

  if (!lp_id || !to_location_id) {
    return { success: false, error: 'Missing required fields: lp_id, to_location_id' }
  }

  // Get current LP
  const { data: lp, error: lpError } = await supabase
    .from('license_plates')
    .select('id, current_qty, location_id')
    .eq('id', lp_id)
    .eq('org_id', orgId)
    .single()

  if (lpError || !lp) {
    return { success: false, error: 'License plate not found' }
  }

  const fromLocationId = lp.location_id

  // Update LP location
  const { error: updateError } = await supabase
    .from('license_plates')
    .update({ location_id: to_location_id, updated_at: performedAt })
    .eq('id', lp_id)

  if (updateError) {
    return { success: false, error: `Failed to move LP: ${updateError.message}` }
  }

  // Create movement record
  await supabase.from('lp_movements').insert({
    org_id: orgId,
    lp_id: lp_id,
    movement_type: 'transfer',
    qty_change: 0,
    qty_before: lp.current_qty,
    qty_after: lp.current_qty,
    from_location_id: fromLocationId,
    to_location_id: to_location_id,
    created_at: performedAt,
  })

  return { success: true, error: '' }
}

/**
 * Process consume operation
 */
async function processConsume(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  payload: Record<string, unknown>,
  orgId: string,
  performedAt: string
): Promise<{ success: boolean; error: string }> {
  const { lp_id, wo_id, material_id, quantity } = payload as {
    lp_id?: string
    wo_id?: string
    material_id?: string
    quantity?: number
  }

  if (!lp_id || !wo_id || !quantity) {
    return { success: false, error: 'Missing required fields: lp_id, wo_id, quantity' }
  }

  // Get LP
  const { data: lp, error: lpError } = await supabase
    .from('license_plates')
    .select('id, current_qty')
    .eq('id', lp_id)
    .eq('org_id', orgId)
    .single()

  if (lpError || !lp) {
    return { success: false, error: 'License plate not found' }
  }

  if (lp.current_qty < quantity) {
    return { success: false, error: 'Insufficient quantity on LP' }
  }

  const newQty = lp.current_qty - quantity

  // Update LP quantity
  const { error: updateError } = await supabase
    .from('license_plates')
    .update({
      current_qty: newQty,
      consumed_by_wo_id: newQty === 0 ? wo_id : null,
      consumed_at: newQty === 0 ? performedAt : null,
      updated_at: performedAt,
    })
    .eq('id', lp_id)

  if (updateError) {
    return { success: false, error: `Failed to consume: ${updateError.message}` }
  }

  // Create consumption record
  await supabase.from('wo_consumption').insert({
    org_id: orgId,
    wo_id: wo_id,
    material_id: material_id || null,
    lp_id: lp_id,
    consumed_qty: quantity,
    status: 'consumed',
    created_at: performedAt,
  })

  // Create movement record
  await supabase.from('lp_movements').insert({
    org_id: orgId,
    lp_id: lp_id,
    movement_type: 'consumption',
    qty_change: -quantity,
    qty_before: lp.current_qty,
    qty_after: newQty,
    created_at: performedAt,
  })

  return { success: true, error: '' }
}

/**
 * Process output operation
 */
async function processOutput(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  payload: Record<string, unknown>,
  orgId: string,
  performedAt: string
): Promise<{ success: boolean; error: string }> {
  const { wo_id, product_id, quantity, location_id, lp_number } = payload as {
    wo_id?: string
    product_id?: string
    quantity?: number
    location_id?: string
    lp_number?: string
  }

  if (!wo_id || !product_id || !quantity || !location_id) {
    return {
      success: false,
      error: 'Missing required fields: wo_id, product_id, quantity, location_id',
    }
  }

  // Create output LP
  const { data: lp, error: lpError } = await supabase
    .from('license_plates')
    .insert({
      org_id: orgId,
      lp_number: lp_number || `LP-${Date.now()}`,
      product_id: product_id,
      current_qty: quantity,
      location_id: location_id,
      status: 'available',
      created_at: performedAt,
    })
    .select('id')
    .single()

  if (lpError) {
    return { success: false, error: `Failed to create output LP: ${lpError.message}` }
  }

  // Get next output number
  const { count } = await supabase
    .from('production_outputs')
    .select('*', { count: 'exact', head: true })
    .eq('wo_id', wo_id)

  // Create production output record
  await supabase.from('production_outputs').insert({
    organization_id: orgId,
    wo_id: wo_id,
    lp_id: lp.id,
    output_number: (count || 0) + 1,
    quantity: quantity,
    qa_status: 'pending',
    created_at: performedAt,
  })

  // Create movement record
  await supabase.from('lp_movements').insert({
    org_id: orgId,
    lp_id: lp.id,
    movement_type: 'creation',
    qty_change: quantity,
    qty_before: 0,
    qty_after: quantity,
    to_location_id: location_id,
    created_at: performedAt,
  })

  // Update WO produced quantity
  const { data: wo } = await supabase
    .from('work_orders')
    .select('produced_quantity')
    .eq('id', wo_id)
    .single()

  if (wo) {
    await supabase
      .from('work_orders')
      .update({
        produced_quantity: (wo.produced_quantity || 0) + quantity,
        updated_at: performedAt,
      })
      .eq('id', wo_id)
  }

  return { success: true, error: '' }
}

/**
 * Process split operation
 */
async function processSplit(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  payload: Record<string, unknown>,
  orgId: string,
  performedAt: string
): Promise<{ success: boolean; error: string }> {
  const { source_lp_id, split_quantity, new_lp_number, to_location_id } = payload as {
    source_lp_id?: string
    split_quantity?: number
    new_lp_number?: string
    to_location_id?: string
  }

  if (!source_lp_id || !split_quantity) {
    return { success: false, error: 'Missing required fields: source_lp_id, split_quantity' }
  }

  // Get source LP
  const { data: sourceLp, error: lpError } = await supabase
    .from('license_plates')
    .select('id, product_id, current_qty, location_id')
    .eq('id', source_lp_id)
    .eq('org_id', orgId)
    .single()

  if (lpError || !sourceLp) {
    return { success: false, error: 'Source license plate not found' }
  }

  if (sourceLp.current_qty < split_quantity) {
    return { success: false, error: 'Insufficient quantity to split' }
  }

  const newSourceQty = sourceLp.current_qty - split_quantity

  // Update source LP
  const { error: updateError } = await supabase
    .from('license_plates')
    .update({ current_qty: newSourceQty, updated_at: performedAt })
    .eq('id', source_lp_id)

  if (updateError) {
    return { success: false, error: `Failed to update source LP: ${updateError.message}` }
  }

  // Create new LP
  const { data: newLp, error: newLpError } = await supabase
    .from('license_plates')
    .insert({
      org_id: orgId,
      lp_number: new_lp_number || `LP-${Date.now()}`,
      product_id: sourceLp.product_id,
      current_qty: split_quantity,
      location_id: to_location_id || sourceLp.location_id,
      status: 'available',
      created_at: performedAt,
    })
    .select('id')
    .single()

  if (newLpError) {
    return { success: false, error: `Failed to create new LP: ${newLpError.message}` }
  }

  // Create genealogy record
  await supabase.from('lp_genealogy').insert({
    org_id: orgId,
    parent_lp_id: source_lp_id,
    child_lp_id: newLp.id,
    relationship_type: 'split',
    quantity_from_parent: split_quantity,
    created_at: performedAt,
  })

  return { success: true, error: '' }
}

/**
 * Process count (inventory adjustment) operation
 */
async function processCount(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  payload: Record<string, unknown>,
  orgId: string,
  performedAt: string
): Promise<{ success: boolean; error: string }> {
  const { lp_id, counted_quantity, location_id } = payload as {
    lp_id?: string
    counted_quantity?: number
    location_id?: string
  }

  if (!lp_id || counted_quantity === undefined) {
    return { success: false, error: 'Missing required fields: lp_id, counted_quantity' }
  }

  // Get LP
  const { data: lp, error: lpError } = await supabase
    .from('license_plates')
    .select('id, current_qty, location_id')
    .eq('id', lp_id)
    .eq('org_id', orgId)
    .single()

  if (lpError || !lp) {
    return { success: false, error: 'License plate not found' }
  }

  const qtyDiff = counted_quantity - lp.current_qty

  // Update LP quantity
  const updateData: Record<string, unknown> = {
    current_qty: counted_quantity,
    updated_at: performedAt,
  }
  if (location_id) {
    updateData.location_id = location_id
  }

  const { error: updateError } = await supabase
    .from('license_plates')
    .update(updateData)
    .eq('id', lp_id)

  if (updateError) {
    return { success: false, error: `Failed to update count: ${updateError.message}` }
  }

  // Create movement record if quantity changed
  if (qtyDiff !== 0) {
    await supabase.from('lp_movements').insert({
      org_id: orgId,
      lp_id: lp_id,
      movement_type: 'adjustment',
      qty_change: qtyDiff,
      qty_before: lp.current_qty,
      qty_after: counted_quantity,
      created_at: performedAt,
    })
  }

  return { success: true, error: '' }
}
