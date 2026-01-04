/**
 * ASN Receive Service (Story 05.9)
 * Purpose: ASN receive workflow business logic
 * Phase: GREEN - Minimal code to pass tests
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ASNReceivePreview,
  ASNReceiveRequest,
  ASNReceiveResult,
  VarianceResult,
  OverReceiptValidation,
  ASNStatusUpdate,
  ASNReceiveItemPreview,
  VarianceItem,
} from '@/lib/types/asn-receive'

// Export types for tests
export type {
  ASNReceivePreview,
  ASNReceiveRequest,
  ASNReceiveResult,
  VarianceResult,
  OverReceiptValidation,
  ASNStatusUpdate,
}

/**
 * ASN Receive Service
 * Handles ASN receiving workflow including variance calculation, status management, and GRN creation
 */
export class ASNReceiveService {
  /**
   * Calculate variance between expected and received quantities
   * @param expectedQty - Expected quantity
   * @param receivedQty - Received quantity
   * @returns VarianceResult with variance, percent, and indicator
   */
  static async calculateASNVariance(
    expectedQty: number,
    receivedQty: number
  ): Promise<VarianceResult> {
    // Validate inputs
    if (expectedQty === 0) {
      throw new Error('Expected quantity cannot be zero')
    }
    if (receivedQty < 0) {
      throw new Error('Received quantity cannot be negative')
    }

    const variance = receivedQty - expectedQty
    const variance_percent = (variance / expectedQty) * 100

    let indicator: 'under' | 'over' | 'exact'
    if (variance < 0) {
      indicator = 'under'
    } else if (variance > 0) {
      indicator = 'over'
    } else {
      indicator = 'exact'
    }

    return {
      variance: parseFloat(variance.toFixed(2)),
      variance_percent: parseFloat(variance_percent.toFixed(2)),
      indicator,
    }
  }

  /**
   * Validate over-receipt against warehouse settings tolerance
   * @param expectedQty - Expected quantity
   * @param cumulativeReceivedQty - Cumulative received quantity (including new receive)
   * @param warehouseSettings - Warehouse settings with tolerance
   * @param supabase - Supabase client
   * @returns OverReceiptValidation result
   */
  static async validateOverReceipt(
    expectedQty: number,
    cumulativeReceivedQty: number,
    warehouseSettings: { allow_over_receipt: boolean; over_receipt_tolerance_pct: number },
    supabase: SupabaseClient
  ): Promise<OverReceiptValidation> {
    // Exact match always allowed
    if (cumulativeReceivedQty === expectedQty) {
      return {
        allowed: true,
        max_allowed: expectedQty,
        exceeds_tolerance: false,
      }
    }

    // Under-receipt always allowed
    if (cumulativeReceivedQty < expectedQty) {
      return {
        allowed: true,
        max_allowed: expectedQty,
        exceeds_tolerance: false,
      }
    }

    // Over-receipt disabled
    if (!warehouseSettings.allow_over_receipt) {
      return {
        allowed: false,
        max_allowed: expectedQty,
        exceeds_tolerance: true,
      }
    }

    // Calculate max allowed with tolerance
    const max_allowed = expectedQty * (1 + warehouseSettings.over_receipt_tolerance_pct / 100)

    // Check if exceeds tolerance
    const exceeds_tolerance = cumulativeReceivedQty > max_allowed

    return {
      allowed: !exceeds_tolerance,
      max_allowed: parseFloat(max_allowed.toFixed(2)),
      exceeds_tolerance,
    }
  }

  /**
   * Get ASN receive preview with items and remaining quantities
   * @param asnId - ASN ID
   * @param orgId - Organization ID
   * @param supabase - Supabase client
   * @returns ASNReceivePreview
   */
  static async getASNReceivePreview(
    asnId: string,
    orgId: string,
    supabase: SupabaseClient
  ): Promise<ASNReceivePreview> {
    // Fetch ASN header
    const { data: asn, error: asnError } = await supabase
      .from('asns')
      .select(`
        id,
        asn_number,
        status,
        expected_date,
        purchase_orders!inner(po_number),
        suppliers!inner(name)
      `)
      .eq('id', asnId)
      .eq('org_id', orgId)
      .single()

    if (asnError || !asn) {
      throw new Error('ASN not found')
    }

    // Check status
    if (asn.status === 'received' || asn.status === 'cancelled') {
      throw new Error('ASN already completed or cancelled')
    }

    // Fetch ASN items with product details
    const { data: items, error: itemsError } = await supabase
      .from('asn_items')
      .select(`
        id,
        product_id,
        expected_qty,
        received_qty,
        uom,
        supplier_batch_number,
        gtin,
        expiry_date,
        products!inner(name, code)
      `)
      .eq('asn_id', asnId)
      .order('id')

    if (itemsError) {
      throw new Error('Failed to fetch ASN items')
    }

    // Transform items
    const transformedItems: ASNReceiveItemPreview[] = (items || []).map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.products.name,
      product_sku: item.products.code,
      expected_qty: item.expected_qty,
      received_qty: item.received_qty,
      remaining_qty: item.expected_qty - item.received_qty,
      uom: item.uom,
      supplier_batch_number: item.supplier_batch_number,
      gtin: item.gtin,
      expiry_date: item.expiry_date,
    }))

    return {
      asn: {
        id: asn.id,
        asn_number: asn.asn_number,
        status: asn.status,
        po_number: (asn as any).purchase_orders.po_number,
        supplier_name: (asn as any).suppliers.name,
        expected_date: asn.expected_date,
      },
      items: transformedItems,
    }
  }

  /**
   * Update ASN status based on item received quantities
   * @param asnId - ASN ID
   * @param orgId - Organization ID
   * @param supabase - Supabase client
   * @returns ASNStatusUpdate
   */
  static async updateASNStatus(
    asnId: string,
    orgId: string,
    supabase: SupabaseClient
  ): Promise<ASNStatusUpdate> {
    // Fetch all items for this ASN
    const { data: items, error } = await supabase
      .from('asn_items')
      .select('expected_qty, received_qty')
      .eq('asn_id', asnId)

    if (error || !items) {
      throw new Error('Failed to fetch ASN items')
    }

    // Determine status
    const anyReceived = items.some((item) => item.received_qty > 0)
    const allReceived = items.every((item) => item.received_qty >= item.expected_qty)

    let status: 'pending' | 'partial' | 'received'
    let actual_date: string | null = null

    if (allReceived) {
      status = 'received'
      actual_date = new Date().toISOString()
    } else if (anyReceived) {
      status = 'partial'
    } else {
      status = 'pending'
      // Don't update if still pending
      return { status, actual_date }
    }

    // Update ASN status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (actual_date) {
      updateData.actual_date = actual_date
    }

    const { error: updateError } = await supabase
      .from('asns')
      .update(updateData)
      .eq('id', asnId)
      .eq('org_id', orgId)

    if (updateError) {
      throw new Error('Failed to update ASN status')
    }

    return { status, actual_date }
  }

  /**
   * Receive from ASN - Create GRN, LPs, and update ASN items
   * @param asnId - ASN ID
   * @param request - Receive request
   * @param orgId - Organization ID
   * @param userId - User ID
   * @param supabase - Supabase client
   * @returns ASNReceiveResult
   */
  static async receiveFromASN(
    asnId: string,
    request: ASNReceiveRequest,
    orgId: string,
    userId: string,
    supabase: SupabaseClient
  ): Promise<ASNReceiveResult> {
    // 1. Validate ASN exists and status
    const { data: asn, error: asnError } = await supabase
      .from('asns')
      .select('id, asn_number, status')
      .eq('id', asnId)
      .eq('org_id', orgId)
      .single()

    if (asnError || !asn) {
      throw new Error('ASN not found')
    }

    if (asn.status === 'received' || asn.status === 'cancelled') {
      throw new Error(`Cannot receive against ASN with status: ${asn.status}`)
    }

    // 2. Fetch ASN items
    const asnItemIds = request.items.map((item) => item.asn_item_id)
    const { data: asnItems, error: itemsError } = await supabase
      .from('asn_items')
      .select('id, expected_qty, received_qty, product_id')
      .eq('asn_id', asnId)
      .in('id', asnItemIds)

    if (itemsError || !asnItems || asnItems.length !== request.items.length) {
      throw new Error('ASN item not found')
    }

    // 3. Fetch warehouse settings
    const { data: settings, error: settingsError } = await supabase
      .from('warehouse_settings')
      .select('allow_over_receipt, over_receipt_tolerance_pct, require_batch_on_receipt, require_expiry_on_receipt')
      .eq('org_id', orgId)
      .single()

    if (settingsError || !settings) {
      throw new Error('Warehouse settings not found')
    }

    // 4. Validate items and over-receipt
    for (const receiveItem of request.items) {
      const asnItem = asnItems.find((item) => item.id === receiveItem.asn_item_id)
      if (!asnItem) {
        throw new Error(`ASN item ${receiveItem.asn_item_id} not found in this ASN`)
      }

      // Check cumulative over-receipt
      const cumulativeReceived = asnItem.received_qty + receiveItem.received_qty
      const validation = await this.validateOverReceipt(
        asnItem.expected_qty,
        cumulativeReceived,
        settings,
        supabase
      )

      if (!validation.allowed) {
        throw new Error(`Over-receipt exceeds tolerance (max: ${validation.max_allowed} units)`)
      }

      // Validate required fields
      if (settings.require_batch_on_receipt && !receiveItem.batch_number) {
        throw new Error('Batch number required')
      }

      if (settings.require_expiry_on_receipt && !receiveItem.expiry_date) {
        throw new Error('Expiry date required')
      }
    }

    // 5. Create GRN header
    const { data: grn, error: grnError } = await supabase
      .from('grns')
      .insert({
        org_id: orgId,
        grn_number: `GRN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
        source_type: 'asn',
        asn_id: asnId,
        warehouse_id: request.warehouse_id,
        location_id: request.location_id,
        status: 'completed',
        receipt_date: new Date().toISOString(),
        received_by: userId,
        notes: request.notes,
        created_by: userId,
      })
      .select('id, grn_number')
      .single()

    if (grnError || !grn) {
      throw new Error('Failed to create GRN')
    }

    // 6. Create GRN items and LPs
    const lpsCreated: string[] = []
    const variances: VarianceItem[] = []

    for (const receiveItem of request.items) {
      const asnItem = asnItems.find((item) => item.id === receiveItem.asn_item_id)!

      // Create GRN item
      const { error: grnItemError } = await supabase
        .from('grn_items')
        .insert({
          grn_id: grn.id,
          product_id: asnItem.product_id,
          asn_item_id: receiveItem.asn_item_id,
          received_qty: receiveItem.received_qty,
          batch_number: receiveItem.batch_number,
          supplier_batch_number: receiveItem.supplier_batch_number,
          expiry_date: receiveItem.expiry_date,
        })

      if (grnItemError) {
        throw new Error('Failed to create GRN item')
      }

      // Create LP
      const { data: lp, error: lpError } = await supabase
        .from('license_plates')
        .insert({
          org_id: orgId,
          lp_number: `LP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
          product_id: asnItem.product_id,
          batch_number: receiveItem.batch_number,
          lot_number: receiveItem.batch_number,
          quantity: receiveItem.received_qty,
          uom: 'units',
          warehouse_id: request.warehouse_id,
          location_id: request.location_id,
          status: 'available',
          source: 'receipt',
          grn_id: grn.id,
          asn_id: asnId,
          created_by: userId,
        })
        .select('id')
        .single()

      if (lpError || !lp) {
        throw new Error('Failed to create LP')
      }

      lpsCreated.push(lp.id)

      // Calculate variance
      const variance = await this.calculateASNVariance(asnItem.expected_qty, receiveItem.received_qty)

      // Fetch product name for variance report
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', asnItem.product_id)
        .single()

      variances.push({
        product_name: product?.name || 'Unknown',
        expected_qty: asnItem.expected_qty,
        received_qty: receiveItem.received_qty,
        variance: variance.variance,
        variance_percent: variance.variance_percent,
        variance_indicator: variance.indicator,
      })

      // Update ASN item
      const newReceivedQty = asnItem.received_qty + receiveItem.received_qty
      const updateData: any = {
        received_qty: newReceivedQty,
        last_received_at: new Date().toISOString(),
      }

      if (receiveItem.variance_reason) {
        updateData.variance_reason = receiveItem.variance_reason
      }
      if (receiveItem.variance_notes) {
        updateData.variance_notes = receiveItem.variance_notes
      }

      const { error: updateItemError } = await supabase
        .from('asn_items')
        .update(updateData)
        .eq('id', receiveItem.asn_item_id)

      if (updateItemError) {
        throw new Error('Failed to update ASN item')
      }
    }

    // 7. Update ASN status
    const statusUpdate = await this.updateASNStatus(asnId, orgId, supabase)

    // 8. Return result
    return {
      grn_id: grn.id,
      grn_number: grn.grn_number,
      status: 'completed',
      lps_created: lpsCreated.length,
      asn_status: statusUpdate.status as 'partial' | 'received',
      variances,
    }
  }
}
