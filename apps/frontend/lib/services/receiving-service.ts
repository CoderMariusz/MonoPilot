/**
 * Receiving Service
 * Story 5.32a: Shared Receiving Service - Technical Foundation
 *
 * Consolidated receiving logic for:
 * - Receive from PO (desktop)
 * - Receive from TO (desktop)
 * - Scanner receive workflow
 * - Manual receive without source document
 */

import { createServerSupabaseAdmin } from '@/lib/supabase/server'
import { createLP } from '@/lib/services/license-plate-service'
import { generateGRNNumber } from '@/lib/utils/grn-number-generator'
import type {
  UUID,
  ReceiveLineItem,
  ReceiveFromPOInput,
  ReceiveFromPOResult,
  ReceiveFromTOInput,
  ReceiveFromTOResult,
  ManualReceiveItem,
  ManualReceiveInput,
  ManualReceiveResult,
  ReceiveOperation,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SourceDocument,
  SourceDocumentLine,
  ReceivingSettings,
  ReceivingServiceResult,
} from '@/lib/types/receiving'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get warehouse settings for receiving validation
 */
async function getReceivingSettings(orgId: UUID): Promise<ReceivingSettings> {
  const supabase = createServerSupabaseAdmin()

  const { data } = await supabase
    .from('warehouse_settings')
    .select('allow_over_receipt, over_receipt_tolerance_pct')
    .eq('org_id', orgId)
    .single()

  return {
    allow_over_receipt: data?.allow_over_receipt ?? false,
    over_receipt_tolerance_pct: data?.over_receipt_tolerance_pct ?? 0,
    require_batch_number: true, // FDA compliance
    require_expiry_date: false,
    default_qa_status: 'pending',
  }
}

/**
 * Calculate new PO status based on line quantities
 */
function calculatePOStatus(
  lines: Array<{ ordered_qty: number; received_qty: number }>
): 'PartiallyReceived' | 'Closed' | null {
  const totalOrdered = lines.reduce((sum, l) => sum + l.ordered_qty, 0)
  const totalReceived = lines.reduce((sum, l) => sum + l.received_qty, 0)

  if (totalReceived >= totalOrdered) {
    return 'Closed'
  } else if (totalReceived > 0) {
    return 'PartiallyReceived'
  }
  return null
}

// ============================================================================
// Receive from PO
// ============================================================================

/**
 * Receive goods from Purchase Order - creates GRN + LPs
 */
export async function receiveFromPO(
  input: ReceiveFromPOInput,
  userId: UUID
): Promise<ReceivingServiceResult<ReceiveFromPOResult>> {
  const supabase = createServerSupabaseAdmin()
  const { org_id, po_id, items, notes } = input

  try {
    // 1. Validate PO exists and status
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        id, po_number, status, warehouse_id,
        po_lines (
          id, product_id, ordered_qty, received_qty, uom,
          products (id, code, name)
        )
      `)
      .eq('id', po_id)
      .eq('org_id', org_id)
      .single()

    if (poError || !po) {
      return { success: false, error: 'Purchase Order not found', code: 'NOT_FOUND' }
    }

    // Check PO status - must be Confirmed or PartiallyReceived
    const validStatuses = ['confirmed', 'partiallyreceived', 'partially_received']
    if (!validStatuses.includes(po.status.toLowerCase())) {
      return {
        success: false,
        error: `Cannot receive PO in status: ${po.status}. Must be Confirmed or PartiallyReceived.`,
        code: 'INVALID_STATUS',
      }
    }

    // 2. Validate receive operation
    const validation = await validateReceive(org_id, { type: 'po', data: input })
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_FAILED',
        validation,
      }
    }

    // 3. Get warehouse for default location
    const { data: warehouse } = await supabase
      .from('warehouses')
      .select('id, default_receiving_location_id')
      .eq('id', po.warehouse_id)
      .single()

    // 4. Generate GRN number
    const grn_number = await generateGRNNumber(org_id)

    // 5. Create GRN record
    const { data: grn, error: grnError } = await supabase
      .from('goods_receipt_notes')
      .insert({
        org_id,
        grn_number,
        po_id,
        warehouse_id: po.warehouse_id,
        receiving_location_id: warehouse?.default_receiving_location_id || null,
        status: 'completed',
        notes: notes || null,
        received_by: userId,
        received_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (grnError) {
      return { success: false, error: `Failed to create GRN: ${grnError.message}`, code: 'DATABASE_ERROR' }
    }

    // 6. Process each item - create LP and GRN item
    const lp_ids: UUID[] = []
    const lp_numbers: string[] = []
    let total_qty_received = 0

    for (const item of items) {
      // Find matching PO line
      const poLine = po.po_lines.find((l: any) => l.id === item.po_line_id)
      if (!poLine) continue

      // Create License Plate
      const lp = await createLP(
        {
          product_id: poLine.product_id,
          quantity: item.qty_received,
          uom: poLine.uom,
          warehouse_id: po.warehouse_id,
          location_id: item.location_id || warehouse?.default_receiving_location_id,
          batch_number: item.batch_number,
          manufacturing_date: item.manufacture_date
            ? typeof item.manufacture_date === 'string'
              ? item.manufacture_date
              : item.manufacture_date.toISOString().split('T')[0]
            : undefined,
          expiry_date: item.expiry_date
            ? typeof item.expiry_date === 'string'
              ? item.expiry_date
              : item.expiry_date.toISOString().split('T')[0]
            : undefined,
          status: 'available',
          qa_status: 'pending',
          source_type: 'receiving',
          source_grn_id: grn.id,
          source_po_id: po_id,
        },
        org_id,
        userId
      )

      lp_ids.push(lp.id)
      lp_numbers.push(lp.lp_number)
      total_qty_received += item.qty_received

      // Create GRN item
      await supabase.from('grn_items').insert({
        org_id,
        grn_id: grn.id,
        product_id: poLine.product_id,
        expected_qty: poLine.ordered_qty,
        received_qty: item.qty_received,
        uom: poLine.uom,
        lp_id: lp.id,
      })

      // Update PO line received_qty
      const newReceivedQty = (poLine.received_qty || 0) + item.qty_received
      await supabase
        .from('po_lines')
        .update({ received_qty: newReceivedQty })
        .eq('id', item.po_line_id)
    }

    // 7. Recalculate and update PO status
    const { data: updatedLines } = await supabase
      .from('po_lines')
      .select('ordered_qty, received_qty')
      .eq('po_id', po_id)

    const newPOStatus = calculatePOStatus(updatedLines || [])
    let po_status_changed = false

    if (newPOStatus && newPOStatus.toLowerCase() !== po.status.toLowerCase()) {
      await supabase.from('purchase_orders').update({ status: newPOStatus }).eq('id', po_id)
      po_status_changed = true
    }

    return {
      success: true,
      data: {
        grn_id: grn.id,
        grn_number,
        lp_ids,
        lp_numbers,
        po_status_changed,
        po_new_status: newPOStatus || undefined,
        items_received: items.length,
        total_qty_received,
      },
    }
  } catch (error) {
    console.error('Error in receiveFromPO:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}

// ============================================================================
// Receive from TO
// ============================================================================

/**
 * Receive goods from Transfer Order - updates LP locations and creates stock moves
 */
export async function receiveFromTO(
  input: ReceiveFromTOInput,
  userId: UUID
): Promise<ReceivingServiceResult<ReceiveFromTOResult>> {
  const supabase = createServerSupabaseAdmin()
  const { org_id, to_id, location_id, notes } = input

  try {
    // 1. Validate TO exists and status
    const { data: to, error: toError } = await supabase
      .from('transfer_orders')
      .select(`
        id, to_number, status, from_warehouse_id, to_warehouse_id,
        to_lines (
          id, product_id, quantity, shipped_qty, received_qty, uom,
          to_line_lps (
            id, lp_id, reserved_qty,
            license_plates:license_plates (
              id, lp_number, current_qty, location_id, warehouse_id
            )
          )
        )
      `)
      .eq('id', to_id)
      .eq('org_id', org_id)
      .single()

    if (toError || !to) {
      return { success: false, error: 'Transfer Order not found', code: 'NOT_FOUND' }
    }

    // Check TO status - must be Shipped
    if (to.status.toLowerCase() !== 'shipped') {
      return {
        success: false,
        error: `Cannot receive TO in status: ${to.status}. Must be Shipped.`,
        code: 'INVALID_STATUS',
      }
    }

    // 2. Validate location belongs to destination warehouse
    const { data: location } = await supabase
      .from('locations')
      .select('id, warehouse_id, type, is_active')
      .eq('id', location_id)
      .eq('org_id', org_id)
      .single()

    if (!location) {
      return { success: false, error: 'Location not found', code: 'LOCATION_NOT_FOUND' }
    }

    if (location.warehouse_id !== to.to_warehouse_id) {
      return {
        success: false,
        error: 'Location must be in destination warehouse',
        code: 'LOCATION_NOT_FOUND',
      }
    }

    if (!location.is_active) {
      return { success: false, error: 'Location is not active', code: 'LOCATION_NOT_FOUND' }
    }

    // 3. Process each line - update LP locations and create stock moves
    const lps_updated: UUID[] = []
    let stock_moves_created = 0

    for (const line of to.to_lines as any[]) {
      for (const lineLp of line.to_line_lps || []) {
        // Supabase returns single relation as object, not array
        const lp = lineLp.license_plates as {
          id: string
          lp_number: string
          current_qty: number
          location_id: string | null
          warehouse_id: string | null
        } | null
        if (!lp) continue

        const oldLocationId = lp.location_id
        const oldWarehouseId = lp.warehouse_id

        // Update LP location and warehouse
        await supabase
          .from('license_plates')
          .update({
            location_id,
            warehouse_id: to.to_warehouse_id,
            source_type: 'transfer',
            source_to_id: to_id,
            updated_by: userId,
          })
          .eq('id', lp.id)

        lps_updated.push(lp.id)

        // Create stock move record
        await supabase.from('lp_movements').insert({
          org_id,
          lp_id: lp.id,
          movement_type: 'transfer',
          from_location_id: oldLocationId,
          to_location_id: location_id,
          from_warehouse_id: oldWarehouseId,
          to_warehouse_id: to.to_warehouse_id,
          qty_change: 0,
          qty_before: lp.current_qty,
          qty_after: lp.current_qty,
          uom: line.uom,
          reference_type: 'transfer_order',
          reference_id: to_id,
          created_by_user_id: userId,
          notes: notes || `Received from TO ${to.to_number}`,
        })

        stock_moves_created++
      }

      // Update TO line received_qty
      await supabase
        .from('to_lines')
        .update({ received_qty: line.shipped_qty })
        .eq('id', line.id)
    }

    // 4. Update TO status to Received
    await supabase
      .from('transfer_orders')
      .update({
        status: 'received',
        actual_receive_date: new Date().toISOString().split('T')[0],
        updated_by: userId,
      })
      .eq('id', to_id)

    return {
      success: true,
      data: {
        lp_count: lps_updated.length,
        lps_updated,
        stock_moves_created,
        to_status: 'Received',
        to_id,
      },
    }
  } catch (error) {
    console.error('Error in receiveFromTO:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}

// ============================================================================
// Manual Receive
// ============================================================================

/**
 * Manual receive without source document - creates LP directly
 */
export async function manualReceive(
  input: ManualReceiveInput,
  userId: UUID
): Promise<ReceivingServiceResult<ManualReceiveResult>> {
  const { org_id, item } = input

  try {
    // Validate the receive operation
    const validation = await validateReceive(org_id, { type: 'manual', data: input })
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors[0]?.message || 'Validation failed',
        code: 'VALIDATION_FAILED',
        validation,
      }
    }

    // Create License Plate
    const lp = await createLP(
      {
        product_id: item.product_id,
        quantity: item.qty,
        uom: 'pcs', // Will be updated from product
        warehouse_id: item.warehouse_id,
        location_id: item.location_id,
        batch_number: item.batch_number,
        manufacturing_date: item.manufacture_date
          ? typeof item.manufacture_date === 'string'
            ? item.manufacture_date
            : item.manufacture_date.toISOString().split('T')[0]
          : undefined,
        expiry_date: item.expiry_date
          ? typeof item.expiry_date === 'string'
            ? item.expiry_date
            : item.expiry_date.toISOString().split('T')[0]
          : undefined,
        status: 'available',
        qa_status: 'pending',
        source_type: 'manual',
      },
      org_id,
      userId
    )

    return {
      success: true,
      data: {
        lp_id: lp.id,
        lp_number: lp.lp_number,
        qty_received: item.qty,
      },
    }
  } catch (error) {
    console.error('Error in manualReceive:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate receive operation before submission
 */
export async function validateReceive(
  orgId: UUID,
  operation: ReceiveOperation
): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const settings = await getReceivingSettings(orgId)
  const supabase = createServerSupabaseAdmin()

  if (operation.type === 'po') {
    const { po_id, items } = operation.data

    // Validate PO exists
    const { data: po } = await supabase
      .from('purchase_orders')
      .select(`
        id, status,
        po_lines (id, product_id, ordered_qty, received_qty)
      `)
      .eq('id', po_id)
      .eq('org_id', orgId)
      .single()

    if (!po) {
      errors.push({ code: 'NOT_FOUND', message: 'Purchase Order not found' })
      return { valid: false, errors, warnings }
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const poLine = po.po_lines.find((l: any) => l.id === item.po_line_id)

      if (!poLine) {
        errors.push({
          code: 'NOT_FOUND',
          message: `PO line not found for item ${i + 1}`,
          line_index: i,
        })
        continue
      }

      // Validate product match
      // (PO line product_id is already validated implicitly)

      // Validate quantity
      const remainingQty = poLine.ordered_qty - (poLine.received_qty || 0)
      if (item.qty_received > remainingQty) {
        const overReceiptPct = ((item.qty_received - remainingQty) / remainingQty) * 100

        if (!settings.allow_over_receipt) {
          errors.push({
            code: 'OVER_RECEIPT_NOT_ALLOWED',
            message: `Over-receipt not allowed. Qty: ${item.qty_received}, Remaining: ${remainingQty}`,
            line_index: i,
          })
        } else if (overReceiptPct > settings.over_receipt_tolerance_pct) {
          errors.push({
            code: 'OVER_RECEIPT_EXCEEDS_TOLERANCE',
            message: `Over-receipt exceeds tolerance (${settings.over_receipt_tolerance_pct}%). Excess: ${overReceiptPct.toFixed(1)}%`,
            line_index: i,
          })
        } else {
          warnings.push({
            code: 'OVER_RECEIPT',
            message: `Over-receipt within tolerance: ${overReceiptPct.toFixed(1)}%`,
            line_index: i,
          })
        }
      }

      // Validate batch number (FDA compliance)
      if (settings.require_batch_number && !item.batch_number) {
        errors.push({
          code: 'BATCH_NUMBER_REQUIRED',
          message: `Batch number required for item ${i + 1}`,
          line_index: i,
        })
      }

      // Validate location
      const { data: location } = await supabase
        .from('locations')
        .select('id, is_active, type')
        .eq('id', item.location_id)
        .eq('org_id', orgId)
        .single()

      if (!location) {
        errors.push({
          code: 'LOCATION_NOT_FOUND',
          message: `Location not found for item ${i + 1}`,
          line_index: i,
        })
      } else if (!location.is_active) {
        errors.push({
          code: 'LOCATION_NOT_FOUND',
          message: `Location is inactive for item ${i + 1}`,
          line_index: i,
        })
      }
    }
  } else if (operation.type === 'to') {
    const { to_id, location_id } = operation.data

    // Validate TO exists and status
    const { data: to } = await supabase
      .from('transfer_orders')
      .select('id, status, to_warehouse_id')
      .eq('id', to_id)
      .eq('org_id', orgId)
      .single()

    if (!to) {
      errors.push({ code: 'NOT_FOUND', message: 'Transfer Order not found' })
      return { valid: false, errors, warnings }
    }

    if (to.status.toLowerCase() !== 'shipped') {
      errors.push({
        code: 'INVALID_STATUS',
        message: `TO must be in Shipped status. Current: ${to.status}`,
      })
    }

    // Validate location
    const { data: location } = await supabase
      .from('locations')
      .select('id, warehouse_id, is_active')
      .eq('id', location_id)
      .eq('org_id', orgId)
      .single()

    if (!location) {
      errors.push({ code: 'LOCATION_NOT_FOUND', message: 'Location not found' })
    } else {
      if (location.warehouse_id !== to.to_warehouse_id) {
        errors.push({
          code: 'LOCATION_NOT_FOUND',
          message: 'Location must be in destination warehouse',
        })
      }
      if (!location.is_active) {
        errors.push({ code: 'LOCATION_NOT_FOUND', message: 'Location is inactive' })
      }
    }
  } else if (operation.type === 'manual') {
    const { item } = operation.data

    // Validate product exists
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', item.product_id)
      .eq('org_id', orgId)
      .single()

    if (!product) {
      errors.push({ code: 'NOT_FOUND', message: 'Product not found' })
    }

    // Validate batch number
    if (settings.require_batch_number && !item.batch_number) {
      errors.push({ code: 'BATCH_NUMBER_REQUIRED', message: 'Batch number required' })
    }

    // Validate location
    const { data: location } = await supabase
      .from('locations')
      .select('id, warehouse_id, is_active')
      .eq('id', item.location_id)
      .eq('org_id', orgId)
      .single()

    if (!location) {
      errors.push({ code: 'LOCATION_NOT_FOUND', message: 'Location not found' })
    } else {
      if (location.warehouse_id !== item.warehouse_id) {
        errors.push({
          code: 'LOCATION_NOT_FOUND',
          message: 'Location must be in specified warehouse',
        })
      }
      if (!location.is_active) {
        errors.push({ code: 'LOCATION_NOT_FOUND', message: 'Location is inactive' })
      }
    }

    // Validate quantity
    if (item.qty <= 0) {
      errors.push({ code: 'INVALID_QUANTITY', message: 'Quantity must be greater than 0' })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

// ============================================================================
// Source Document Queries
// ============================================================================

/**
 * Get source document by type and ID
 */
export async function getSourceDocument(
  orgId: UUID,
  docType: 'po' | 'to',
  docId: UUID
): Promise<ReceivingServiceResult<SourceDocument>> {
  const supabase = createServerSupabaseAdmin()

  try {
    if (docType === 'po') {
      const { data: po, error } = await supabase
        .from('purchase_orders')
        .select(`
          id, po_number, status, warehouse_id, expected_delivery_date, notes, created_at,
          warehouses (id, name),
          suppliers (id, name),
          po_lines (
            id, sequence, product_id, ordered_qty, received_qty, uom,
            products (id, code, name)
          )
        `)
        .eq('id', docId)
        .eq('org_id', orgId)
        .single()

      if (error || !po) {
        return { success: false, error: 'Purchase Order not found', code: 'NOT_FOUND' }
      }

      const lines: SourceDocumentLine[] = (po.po_lines || []).map((line: any, idx: number) => ({
        id: line.id,
        sequence: line.sequence || idx + 1,
        product_id: line.product_id,
        product_code: line.products?.code || '',
        product_name: line.products?.name || '',
        expected_qty: line.ordered_qty,
        received_qty: line.received_qty || 0,
        remaining_qty: line.ordered_qty - (line.received_qty || 0),
        uom: line.uom,
      }))

      return {
        success: true,
        data: {
          id: po.id,
          doc_number: po.po_number,
          doc_type: 'po',
          status: po.status,
          warehouse_id: po.warehouse_id,
          warehouse_name: (po.warehouses as any)?.name || '',
          supplier_id: (po.suppliers as any)?.id,
          supplier_name: (po.suppliers as any)?.name,
          expected_date: po.expected_delivery_date,
          lines,
          created_at: po.created_at,
          notes: po.notes,
        },
      }
    } else {
      const { data: to, error } = await supabase
        .from('transfer_orders')
        .select(`
          id, to_number, status, from_warehouse_id, to_warehouse_id,
          planned_receive_date, notes, created_at,
          to_lines (
            id, product_id, quantity, shipped_qty, received_qty, uom,
            products:products (id, code, name)
          )
        `)
        .eq('id', docId)
        .eq('org_id', orgId)
        .single()

      if (error || !to) {
        return { success: false, error: 'Transfer Order not found', code: 'NOT_FOUND' }
      }

      // Fetch warehouse names
      const { data: fromWh } = await supabase
        .from('warehouses')
        .select('name')
        .eq('id', to.from_warehouse_id)
        .single()

      const { data: toWh } = await supabase
        .from('warehouses')
        .select('name')
        .eq('id', to.to_warehouse_id)
        .single()

      const lines: SourceDocumentLine[] = (to.to_lines || []).map((line: any, idx: number) => ({
        id: line.id,
        sequence: idx + 1,
        product_id: line.product_id,
        product_code: (line.products as any)?.code || '',
        product_name: (line.products as any)?.name || '',
        expected_qty: line.quantity,
        received_qty: line.received_qty || 0,
        remaining_qty: (line.shipped_qty || 0) - (line.received_qty || 0),
        uom: line.uom,
      }))

      return {
        success: true,
        data: {
          id: to.id,
          doc_number: to.to_number,
          doc_type: 'to',
          status: to.status,
          warehouse_id: to.to_warehouse_id,
          warehouse_name: toWh?.name || '',
          from_warehouse_id: to.from_warehouse_id,
          from_warehouse_name: fromWh?.name || '',
          expected_date: to.planned_receive_date,
          lines,
          created_at: to.created_at,
          notes: to.notes,
        },
      }
    }
  } catch (error) {
    console.error('Error in getSourceDocument:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * List documents ready for receiving
 */
export async function listDocumentsForReceiving(
  orgId: UUID,
  docType: 'po' | 'to'
): Promise<ReceivingServiceResult<SourceDocument[]>> {
  const supabase = createServerSupabaseAdmin()

  try {
    if (docType === 'po') {
      // POs in Confirmed or PartiallyReceived status
      const { data: pos, error } = await supabase
        .from('purchase_orders')
        .select(`
          id, po_number, status, warehouse_id, expected_delivery_date, notes, created_at,
          warehouses (id, name),
          suppliers (id, name),
          po_lines (
            id, sequence, product_id, ordered_qty, received_qty, uom,
            products (id, code, name)
          )
        `)
        .eq('org_id', orgId)
        .in('status', ['Confirmed', 'confirmed', 'PartiallyReceived', 'partiallyreceived', 'partially_received'])
        .order('expected_delivery_date', { ascending: true })

      if (error) {
        return { success: false, error: error.message, code: 'DATABASE_ERROR' }
      }

      const documents: SourceDocument[] = (pos || []).map((po: any) => ({
        id: po.id,
        doc_number: po.po_number,
        doc_type: 'po' as const,
        status: po.status,
        warehouse_id: po.warehouse_id,
        warehouse_name: po.warehouses?.name || '',
        supplier_id: po.suppliers?.id,
        supplier_name: po.suppliers?.name,
        expected_date: po.expected_delivery_date,
        lines: (po.po_lines || []).map((line: any, idx: number) => ({
          id: line.id,
          sequence: line.sequence || idx + 1,
          product_id: line.product_id,
          product_code: line.products?.code || '',
          product_name: line.products?.name || '',
          expected_qty: line.ordered_qty,
          received_qty: line.received_qty || 0,
          remaining_qty: line.ordered_qty - (line.received_qty || 0),
          uom: line.uom,
        })),
        created_at: po.created_at,
        notes: po.notes,
      }))

      return { success: true, data: documents }
    } else {
      // TOs in Shipped status
      const { data: tos, error } = await supabase
        .from('transfer_orders')
        .select(`
          id, to_number, status, from_warehouse_id, to_warehouse_id,
          planned_receive_date, notes, created_at,
          to_lines (
            id, product_id, quantity, shipped_qty, received_qty, uom,
            products:products (id, code, name)
          )
        `)
        .eq('org_id', orgId)
        .in('status', ['shipped', 'Shipped'])
        .order('planned_receive_date', { ascending: true })

      if (error) {
        return { success: false, error: error.message, code: 'DATABASE_ERROR' }
      }

      // Fetch all warehouse names
      const warehouseIds = [
        ...new Set([
          ...(tos || []).map((t: any) => t.from_warehouse_id),
          ...(tos || []).map((t: any) => t.to_warehouse_id),
        ]),
      ].filter(Boolean)

      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id, name')
        .in('id', warehouseIds)

      const warehouseMap = new Map((warehouses || []).map((w: any) => [w.id, w.name]))

      const documents: SourceDocument[] = (tos || []).map((to: any) => ({
        id: to.id,
        doc_number: to.to_number,
        doc_type: 'to' as const,
        status: to.status,
        warehouse_id: to.to_warehouse_id,
        warehouse_name: warehouseMap.get(to.to_warehouse_id) || '',
        from_warehouse_id: to.from_warehouse_id,
        from_warehouse_name: warehouseMap.get(to.from_warehouse_id) || '',
        expected_date: to.planned_receive_date,
        lines: (to.to_lines || []).map((line: any, idx: number) => ({
          id: line.id,
          sequence: idx + 1,
          product_id: line.product_id,
          product_code: (line.products as any)?.code || '',
          product_name: (line.products as any)?.name || '',
          expected_qty: line.quantity,
          received_qty: line.received_qty || 0,
          remaining_qty: (line.shipped_qty || 0) - (line.received_qty || 0),
          uom: line.uom,
        })),
        created_at: to.created_at,
        notes: to.notes,
      }))

      return { success: true, data: documents }
    }
  } catch (error) {
    console.error('Error in listDocumentsForReceiving:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'DATABASE_ERROR',
    }
  }
}
