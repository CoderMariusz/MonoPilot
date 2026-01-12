/**
 * Scanner Receive Service (Story 05.19)
 * Purpose: Business logic for scanner-based receiving operations
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries via PostgREST.
 * - org_id Isolation: SAFE - RLS policies enforce org_id filtering at database level.
 * - XSS: SAFE - React auto-escapes all rendered values.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ScannerReceiveResult,
  PendingReceiptSummary,
  BarcodeLookupResult,
  ValidationResult,
  POLineForScanner,
} from '@/lib/validation/scanner-receive'

// =============================================================================
// Types
// =============================================================================

export interface ScannerReceiveInput {
  poId: string
  poLineId: string
  warehouseId: string
  locationId: string
  receivedQty: number
  batchNumber?: string
  supplierBatchNumber?: string
  expiryDate?: string
  manufactureDate?: string
  notes?: string
}

interface PurchaseOrder {
  id: string
  po_number: string
  status: string
  expected_date: string
  org_id: string
  warehouse_id: string
  supplier?: { id: string; name: string }
  lines?: POLine[]
}

interface POLine {
  id: string
  po_id: string
  product_id: string
  ordered_qty: number
  received_qty: number
  uom: string
  product?: { name: string; code: string; require_batch?: boolean }
}

interface Product {
  id: string
  code: string
  name: string
  gtin: string | null
  uom: string
  require_batch: boolean
  shelf_life_days: number | null
}

interface Location {
  id: string
  code: string
  name: string
  warehouse_id: string
  full_path: string
  is_active: boolean
  warehouse?: { name: string }
}

interface WarehouseSettings {
  require_batch_on_receipt: boolean
  require_expiry_on_receipt: boolean
  allow_over_receipt: boolean
  over_receipt_tolerance_pct: number
  scanner_sound_feedback: boolean
  print_label_on_receipt: boolean
  label_copies_default: number
}

// Receivable PO statuses
const RECEIVABLE_STATUSES = ['approved', 'confirmed', 'partial']

// =============================================================================
// Scanner Receive Service Class
// =============================================================================

export class ScannerReceiveService {
  /**
   * Process scanner receipt - main transaction handler
   * - Validates all inputs
   * - Creates GRN via GRNService
   * - Creates LP via LicensePlateService
   * - Updates PO line and status
   * - Queues label print job
   */
  static async processReceipt(
    supabase: SupabaseClient,
    input: ScannerReceiveInput
  ): Promise<ScannerReceiveResult> {
    const { poId, poLineId, warehouseId, locationId, receivedQty, batchNumber, supplierBatchNumber, expiryDate, manufactureDate, notes } = input

    // 1. Validate PO exists and is receivable
    const po = await this.lookupPO(supabase, poId)
    if (!po) {
      throw new Error('Purchase Order not found')
    }

    if (!RECEIVABLE_STATUSES.includes(po.status)) {
      throw new Error(`PO cannot be received (status: ${po.status})`)
    }

    // 2. Get PO line
    const { data: poLine, error: lineError } = await supabase
      .from('po_lines')
      .select('*, product:products(name, code, require_batch)')
      .eq('id', poLineId)
      .eq('po_id', poId)
      .single()

    if (lineError || !poLine) {
      throw new Error('PO line not found')
    }

    // 3. Get warehouse settings
    const { data: settings } = await supabase
      .from('warehouse_settings')
      .select('*')
      .single()

    const warehouseSettings = settings as WarehouseSettings | null

    // 4. Validate batch requirement
    if (warehouseSettings?.require_batch_on_receipt && !batchNumber) {
      throw new Error('Batch number required for receipt')
    }

    // 5. Validate expiry requirement
    if (warehouseSettings?.require_expiry_on_receipt && !expiryDate) {
      throw new Error('Expiry date required for receipt')
    }

    // 6. Validate over-receipt
    const remainingQty = poLine.ordered_qty - poLine.received_qty
    if (receivedQty > remainingQty) {
      if (!warehouseSettings?.allow_over_receipt) {
        throw new Error(`Over-receipt not allowed. Remaining: ${remainingQty}, Attempted: ${receivedQty}`)
      }

      const tolerancePct = warehouseSettings?.over_receipt_tolerance_pct || 0
      const maxAllowed = poLine.ordered_qty * (1 + tolerancePct / 100)
      const totalReceived = poLine.received_qty + receivedQty

      if (totalReceived > maxAllowed) {
        throw new Error(`Over-receipt exceeds tolerance (${tolerancePct}%). Max allowed: ${maxAllowed}`)
      }
    }

    // 7. Get user info
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id

    // Get user's org_id
    const { data: userRecord } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', userId)
      .single()

    const orgId = userRecord?.org_id

    // 8. Generate GRN number
    const year = new Date().getFullYear()
    const grnPrefix = `GRN-${year}-`

    const { data: lastGrn } = await supabase
      .from('grns')
      .select('grn_number')
      .eq('org_id', orgId)
      .ilike('grn_number', `${grnPrefix}%`)
      .order('grn_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    let nextSeq = 1
    if (lastGrn?.grn_number) {
      const lastNum = lastGrn.grn_number.substring(grnPrefix.length)
      nextSeq = parseInt(lastNum, 10) + 1
    }
    const grnNumber = `${grnPrefix}${String(nextSeq).padStart(5, '0')}`

    // 9. Create GRN
    const { data: grn, error: grnError } = await supabase
      .from('grns')
      .insert({
        org_id: orgId,
        grn_number: grnNumber,
        source_type: 'po',
        po_id: poId,
        supplier_id: po.supplier?.id || null,
        warehouse_id: warehouseId,
        location_id: locationId,
        receipt_date: new Date().toISOString(),
        status: 'completed',
        total_items: 1,
        total_qty: receivedQty,
        notes: notes || null,
        created_by: userId,
        completed_at: new Date().toISOString(),
        completed_by: userId,
      })
      .select()
      .single()

    if (grnError || !grn) {
      throw new Error(`Failed to create GRN: ${grnError?.message || 'Unknown error'}`)
    }

    // 10. Generate LP number
    const { data: lpNumber, error: lpNumError } = await supabase.rpc('generate_lp_number', {
      p_org_id: orgId,
    })

    if (lpNumError) {
      throw new Error(`Failed to generate LP number: ${lpNumError.message}`)
    }

    // 11. Create LP
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .insert({
        org_id: orgId,
        lp_number: lpNumber,
        product_id: poLine.product_id,
        quantity: receivedQty,
        uom: poLine.uom,
        location_id: locationId,
        warehouse_id: warehouseId,
        status: 'available',
        qa_status: 'pending',
        batch_number: batchNumber || null,
        supplier_batch_number: supplierBatchNumber || null,
        expiry_date: expiryDate || null,
        manufacture_date: manufactureDate || null,
        source: 'receipt',
        grn_id: grn.id,
        created_by: userId,
      })
      .select()
      .single()

    if (lpError || !lp) {
      throw new Error(`Failed to create LP: ${lpError?.message || 'Unknown error'}`)
    }

    // 12. Create GRN item
    await supabase.from('grn_items').insert({
      grn_id: grn.id,
      product_id: poLine.product_id,
      po_line_id: poLineId,
      ordered_qty: poLine.ordered_qty,
      received_qty: receivedQty,
      uom: poLine.uom,
      lp_id: lp.id,
      batch_number: batchNumber || null,
      supplier_batch_number: supplierBatchNumber || null,
      expiry_date: expiryDate || null,
      manufacture_date: manufactureDate || null,
      location_id: locationId,
      qa_status: 'pending',
      line_number: 1,
    })

    // 13. Update PO line received_qty
    const newReceivedQty = poLine.received_qty + receivedQty
    await supabase
      .from('po_lines')
      .update({ received_qty: newReceivedQty })
      .eq('id', poLineId)

    // 14. Determine line and PO status
    const poLineStatus: 'partial' | 'complete' = newReceivedQty >= poLine.ordered_qty ? 'complete' : 'partial'

    // Check if all PO lines are complete
    const { data: allLines } = await supabase
      .from('po_lines')
      .select('ordered_qty, received_qty')
      .eq('po_id', poId)

    const allComplete = allLines?.every((line) => line.received_qty >= line.ordered_qty)
    const poStatus: 'partial' | 'closed' = allComplete ? 'closed' : 'partial'

    // Update PO status if needed
    if (poStatus === 'closed' || po.status !== 'partial') {
      await supabase.from('purchase_orders').update({ status: poStatus }).eq('id', poId)
    }

    // 15. Queue label print if enabled
    let printJobId: string | null = null
    if (warehouseSettings?.print_label_on_receipt) {
      printJobId = await this.queueLabelPrint(supabase, lp.id, warehouseSettings.label_copies_default)
    }

    // 16. Get location path for response
    const { data: location } = await supabase
      .from('locations')
      .select('full_path')
      .eq('id', locationId)
      .single()

    return {
      grn: {
        id: grn.id,
        grn_number: grn.grn_number,
        receipt_date: grn.receipt_date,
        status: 'completed',
      },
      lp: {
        id: lp.id,
        lp_number: lp.lp_number,
        product_name: poLine.product?.name || '',
        quantity: receivedQty,
        uom: poLine.uom,
        batch_number: batchNumber || null,
        expiry_date: expiryDate || null,
        location_path: location?.full_path || '',
      },
      poLineStatus,
      poStatus,
      printJobId,
    }
  }

  /**
   * Validate receipt data before commit
   * Returns validation errors without creating records
   */
  static async validateReceipt(
    supabase: SupabaseClient,
    input: Partial<ScannerReceiveInput>
  ): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string }> = []
    const warnings: Array<{ field: string; message: string }> = []

    // Get warehouse settings
    const { data: settings } = await supabase.from('warehouse_settings').select('*').single()

    const warehouseSettings = settings as WarehouseSettings | null

    // Check batch requirement
    if (warehouseSettings?.require_batch_on_receipt && !input.batchNumber) {
      errors.push({ field: 'batch_number', message: 'Batch number is required' })
    }

    // Check expiry requirement
    if (warehouseSettings?.require_expiry_on_receipt && !input.expiryDate) {
      errors.push({ field: 'expiry_date', message: 'Expiry date is required' })
    }

    // Check quantity vs ordered
    if (input.poLineId && input.receivedQty) {
      const { data: poLine } = await supabase
        .from('po_lines')
        .select('ordered_qty, received_qty')
        .eq('id', input.poLineId)
        .single()

      if (poLine) {
        const remainingQty = poLine.ordered_qty - poLine.received_qty
        if (input.receivedQty > remainingQty) {
          if (!warehouseSettings?.allow_over_receipt) {
            errors.push({
              field: 'received_qty',
              message: `Over-receipt not allowed. Remaining: ${remainingQty}`,
            })
          } else {
            const overPct = ((input.receivedQty - remainingQty) / poLine.ordered_qty) * 100
            warnings.push({
              field: 'received_qty',
              message: `Over-receipt by ${overPct.toFixed(1)}%`,
            })
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Get pending receipts for user's warehouse
   * Returns POs with status in [approved, confirmed, partial]
   */
  static async getPendingReceipts(
    supabase: SupabaseClient,
    warehouseId?: string
  ): Promise<PendingReceiptSummary[]> {
    let query = supabase
      .from('purchase_orders')
      .select(`
        id,
        po_number,
        expected_date,
        status,
        supplier:suppliers(name),
        lines:po_lines(ordered_qty, received_qty)
      `)
      .in('status', RECEIVABLE_STATUSES)

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId)
    }

    query = query.order('expected_date', { ascending: true })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch pending receipts: ${error.message}`)
    }

    return (data || []).map((po) => {
      const lines = po.lines || []
      const linesTotal = lines.length
      const linesPending = lines.filter(
        (l: { ordered_qty: number; received_qty: number }) => l.received_qty < l.ordered_qty
      ).length
      const totalQtyOrdered = lines.reduce(
        (sum: number, l: { ordered_qty: number }) => sum + l.ordered_qty,
        0
      )
      const totalQtyReceived = lines.reduce(
        (sum: number, l: { received_qty: number }) => sum + l.received_qty,
        0
      )

      return {
        id: po.id,
        po_number: po.po_number,
        supplier_name: (po.supplier as { name: string } | null)?.name || 'Unknown',
        expected_date: po.expected_date,
        lines_total: linesTotal,
        lines_pending: linesPending,
        total_qty_ordered: totalQtyOrdered,
        total_qty_received: totalQtyReceived,
      }
    })
  }

  /**
   * Lookup PO by barcode (PO number)
   */
  static async lookupPO(supabase: SupabaseClient, barcode: string): Promise<PurchaseOrder | null> {
    // Try exact match on po_number or id
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(id, name),
        lines:po_lines(
          id,
          product_id,
          ordered_qty,
          received_qty,
          uom,
          product:products(name, code)
        )
      `)
      .or(`po_number.eq.${barcode},id.eq.${barcode}`)
      .single()

    if (error || !data) {
      return null
    }

    return data as PurchaseOrder
  }

  /**
   * Lookup product by barcode (internal code or GTIN)
   */
  static async lookupProduct(supabase: SupabaseClient, barcode: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('id, code, name, gtin, uom, require_batch, shelf_life_days')
      .or(`code.eq.${barcode},gtin.eq.${barcode}`)
      .single()

    if (error || !data) {
      return null
    }

    return data as Product
  }

  /**
   * Lookup location by barcode
   */
  static async lookupLocation(supabase: SupabaseClient, barcode: string): Promise<Location | null> {
    const { data, error } = await supabase
      .from('locations')
      .select('id, code, name, warehouse_id, full_path, is_active, warehouse:warehouses(name)')
      .eq('code', barcode)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return null
    }

    return data as Location
  }

  /**
   * Universal barcode lookup - determines type and looks up
   */
  static async lookupBarcode(supabase: SupabaseClient, barcode: string): Promise<BarcodeLookupResult> {
    // Try PO first (if starts with PO- or looks like UUID)
    if (barcode.startsWith('PO-') || barcode.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/i)) {
      const po = await this.lookupPO(supabase, barcode)
      if (po) {
        return { type: 'po', found: true, data: po }
      }
    }

    // Try product (could be code or GTIN)
    const product = await this.lookupProduct(supabase, barcode)
    if (product) {
      return { type: 'product', found: true, data: product }
    }

    // Try location
    const location = await this.lookupLocation(supabase, barcode)
    if (location) {
      return { type: 'location', found: true, data: location }
    }

    return {
      type: 'po',
      found: false,
      error: `Barcode not found: ${barcode}`,
    }
  }

  /**
   * Queue label print job for LP
   */
  static async queueLabelPrint(
    supabase: SupabaseClient,
    lpId: string,
    copies: number = 1
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('print_jobs')
      .insert({
        lp_id: lpId,
        copies,
        status: 'pending',
        label_type: 'lp',
      })
      .select()
      .single()

    if (error || !data) {
      console.error('Failed to queue print job:', error)
      return null
    }

    return data.id
  }
}

export type { ScannerReceiveInput, PurchaseOrder, POLine, Product, Location, WarehouseSettings }
