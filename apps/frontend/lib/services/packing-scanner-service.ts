/**
 * Packing Scanner Service (Story 07.12)
 * Mobile packing workflow operations for scanner devices
 *
 * Provides:
 * - addItemToBox: Main packing transaction
 * - createBox: Create new box with auto-increment box_number
 * - closeBox: Close box with optional weight/dimensions
 * - getPendingShipments: Get packable shipments
 * - lookupShipment: Find shipment by SO or shipment number barcode
 * - lookupLP: Validate LP allocation to shipment
 * - getBoxDetails: Get box with contents
 * - removeItemFromBox: Undo pack operation
 * - checkAllergenConflict: Detect allergen conflicts
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  PackItemInput,
  PackItemResult,
  ShipmentBox,
  BoxDetails,
  PendingShipmentSummary,
  LPAllocationResult,
  ShipmentLookupResult,
  AllergenWarning,
} from '@/lib/validation/packing-scanner'

// =============================================================================
// Custom Error Class
// =============================================================================

export class PackingScannerError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message)
    this.name = 'PackingScannerError'
  }
}

// =============================================================================
// Service Implementation
// =============================================================================

export class PackingScannerService {
  /**
   * Add item to box - main packing transaction
   * FR-7.37: Pack item with LP validation and allergen check
   */
  static async addItemToBox(
    supabase: SupabaseClient,
    orgId: string,
    userId: string,
    input: PackItemInput
  ): Promise<PackItemResult> {
    // 1. Validate shipment exists and is packable
    const { data: shipment, error: shipError } = await supabase
      .from('shipments')
      .select(`
        id,
        status,
        sales_order_id,
        customer_id,
        customers(id, name, allergen_restrictions)
      `)
      .eq('id', input.shipment_id)
      .eq('org_id', orgId)
      .single()

    if (shipError || !shipment) {
      throw new PackingScannerError('Shipment not found', 'NOT_FOUND', 404)
    }

    // Check shipment status
    if (!['pending', 'packing'].includes(shipment.status)) {
      throw new PackingScannerError('Shipment not packable', 'SHIPMENT_NOT_PACKABLE', 400)
    }

    // 2. Validate box exists and is open
    const { data: box, error: boxError } = await supabase
      .from('shipment_boxes')
      .select('id, status, shipment_id')
      .eq('id', input.box_id)
      .eq('org_id', orgId)
      .single()

    if (boxError || !box) {
      throw new PackingScannerError('Box not found', 'NOT_FOUND', 404)
    }

    if (box.status === 'closed') {
      throw new PackingScannerError('Box already closed', 'BOX_CLOSED', 400)
    }

    if (box.shipment_id !== input.shipment_id) {
      throw new PackingScannerError('Box does not belong to shipment', 'BOX_MISMATCH', 400)
    }

    // 3. Validate LP allocation
    const lpAllocation = await this.lookupLP(supabase, orgId, input.license_plate_id, input.shipment_id)

    if (!lpAllocation) {
      throw new PackingScannerError('License plate not found', 'NOT_FOUND', 404)
    }

    if (!lpAllocation.allocated) {
      throw new PackingScannerError('LP not allocated to this shipment', 'LP_NOT_ALLOCATED', 400)
    }

    // 4. Validate quantity
    if (input.quantity > lpAllocation.available_qty) {
      throw new PackingScannerError(
        `Quantity (${input.quantity}) exceeds available (${lpAllocation.available_qty})`,
        'QUANTITY_EXCEEDS_AVAILABLE',
        400
      )
    }

    // 5. Get LP details for lot_number
    const { data: lpData } = await supabase
      .from('license_plates')
      .select('lot_number, product_id')
      .eq('id', input.license_plate_id)
      .eq('org_id', orgId)
      .single()

    // 6. Create box_content record
    const { data: boxContent, error: insertError } = await supabase
      .from('shipment_box_contents')
      .insert({
        org_id: orgId,
        shipment_box_id: input.box_id,
        sales_order_line_id: input.so_line_id,
        product_id: lpData?.product_id,
        license_plate_id: input.license_plate_id,
        lot_number: lpData?.lot_number || null,
        quantity: input.quantity,
      })
      .select('id, quantity')
      .single()

    if (insertError || !boxContent) {
      throw new PackingScannerError('Failed to add item to box', 'INTERNAL_ERROR', 500)
    }

    // 7. Update shipment status to 'packing' if 'pending'
    if (shipment.status === 'pending') {
      await supabase
        .from('shipments')
        .update({ status: 'packing' })
        .eq('id', input.shipment_id)
        .eq('org_id', orgId)
    }

    // 8. Get SO line status
    const { data: soLine } = await supabase
      .from('sales_order_lines')
      .select('quantity, packed_quantity')
      .eq('id', input.so_line_id)
      .single()

    const packedQty = (Number(soLine?.packed_quantity) || 0) + input.quantity
    const remainingQty = Math.max(0, (Number(soLine?.quantity) || 0) - packedQty)
    const lineStatus: 'partial' | 'complete' = remainingQty === 0 ? 'complete' : 'partial'

    // Update SO line packed_quantity
    await supabase
      .from('sales_order_lines')
      .update({ packed_quantity: packedQty })
      .eq('id', input.so_line_id)

    // 9. Get box summary
    const boxDetails = await this.getBoxDetails(supabase, orgId, input.box_id)

    // 10. Check allergen conflict
    let allergenWarning: AllergenWarning | null = null
    if (lpData?.product_id) {
      allergenWarning = await this.checkAllergenConflict(
        supabase,
        orgId,
        shipment.customer_id,
        lpData.product_id,
        input.box_id
      )
    }

    // 11. Get product name
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', lpData?.product_id)
      .single()

    return {
      box_content: {
        id: boxContent.id,
        quantity: boxContent.quantity,
        product_name: product?.name || '',
        lot_number: lpData?.lot_number || null,
      },
      box_summary: boxDetails.summary,
      so_line_status: {
        packed_qty: packedQty,
        remaining_qty: remainingQty,
        status: lineStatus,
      },
      allergen_warning: allergenWarning,
    }
  }

  /**
   * Create new box for shipment with auto-increment box_number
   * FR-7.37: Box creation for packing
   */
  static async createBox(
    supabase: SupabaseClient,
    orgId: string,
    shipmentId: string
  ): Promise<ShipmentBox> {
    // 1. Validate shipment exists and is packable
    const { data: shipment, error: shipError } = await supabase
      .from('shipments')
      .select('id, status')
      .eq('id', shipmentId)
      .eq('org_id', orgId)
      .single()

    if (shipError || !shipment) {
      throw new PackingScannerError('Shipment not found', 'SHIPMENT_NOT_FOUND', 404)
    }

    if (!['pending', 'packing'].includes(shipment.status)) {
      throw new PackingScannerError('Shipment not packable', 'SHIPMENT_NOT_PACKABLE', 400)
    }

    // 2. Get max box_number for this shipment
    const { data: boxes } = await supabase
      .from('shipment_boxes')
      .select('box_number')
      .eq('shipment_id', shipmentId)
      .eq('org_id', orgId)
      .order('box_number', { ascending: false })
      .limit(1)

    const nextBoxNumber = boxes && boxes.length > 0 ? boxes[0].box_number + 1 : 1

    // 3. Create new box
    const { data: newBox, error: insertError } = await supabase
      .from('shipment_boxes')
      .insert({
        org_id: orgId,
        shipment_id: shipmentId,
        box_number: nextBoxNumber,
        status: 'open',
      })
      .select('id, box_number, status, weight, length, width, height, org_id')
      .single()

    if (insertError || !newBox) {
      throw new PackingScannerError('Failed to create box', 'INTERNAL_ERROR', 500)
    }

    return {
      id: newBox.id,
      box_number: newBox.box_number,
      status: newBox.status,
      weight: newBox.weight,
      dimensions: {
        length: newBox.length,
        width: newBox.width,
        height: newBox.height,
      },
      org_id: newBox.org_id,
    }
  }

  /**
   * Close box with optional weight and dimensions
   * FR-7.37: Box closure validation
   */
  static async closeBox(
    supabase: SupabaseClient,
    orgId: string,
    boxId: string,
    weight?: number | null,
    dimensions?: { length?: number | null; width?: number | null; height?: number | null }
  ): Promise<ShipmentBox> {
    // 1. Validate weight if provided
    if (weight !== undefined && weight !== null && weight <= 0) {
      throw new PackingScannerError('Weight must be positive', 'INVALID_WEIGHT', 400)
    }

    // 2. Get box
    const { data: box, error: boxError } = await supabase
      .from('shipment_boxes')
      .select('id, status, box_number')
      .eq('id', boxId)
      .eq('org_id', orgId)
      .single()

    if (boxError || !box) {
      throw new PackingScannerError('Box not found', 'NOT_FOUND', 404)
    }

    if (box.status === 'closed') {
      throw new PackingScannerError('Box already closed', 'ALREADY_CLOSED', 400)
    }

    // 3. Check box has contents
    const { count } = await supabase
      .from('shipment_box_contents')
      .select('id', { count: 'exact', head: true })
      .eq('shipment_box_id', boxId)
      .eq('org_id', orgId)

    if (!count || count === 0) {
      throw new PackingScannerError('Cannot close empty box', 'EMPTY_BOX', 400)
    }

    // 4. Update box
    const updateData: Record<string, unknown> = {
      status: 'closed',
    }

    if (weight !== undefined) {
      updateData.weight = weight
    }

    if (dimensions) {
      if (dimensions.length !== undefined) updateData.length = dimensions.length
      if (dimensions.width !== undefined) updateData.width = dimensions.width
      if (dimensions.height !== undefined) updateData.height = dimensions.height
    }

    const { data: updatedBox, error: updateError } = await supabase
      .from('shipment_boxes')
      .update(updateData)
      .eq('id', boxId)
      .eq('org_id', orgId)
      .select('id, box_number, status, weight, length, width, height')
      .single()

    if (updateError || !updatedBox) {
      throw new PackingScannerError('Failed to close box', 'INTERNAL_ERROR', 500)
    }

    return {
      id: updatedBox.id,
      box_number: updatedBox.box_number,
      status: updatedBox.status,
      weight: updatedBox.weight,
      dimensions: {
        length: updatedBox.length,
        width: updatedBox.width,
        height: updatedBox.height,
      },
    }
  }

  /**
   * Get pending shipments for packing
   * FR-7.37: Shipment list for scanner selection
   */
  static async getPendingShipments(
    supabase: SupabaseClient,
    orgId: string,
    warehouseId?: string,
    search?: string,
    limit: number = 50
  ): Promise<PendingShipmentSummary[]> {
    let query = supabase
      .from('shipments')
      .select(`
        id,
        shipment_number,
        status,
        promised_ship_date,
        warehouse_id,
        org_id,
        sales_orders!inner(
          so_number,
          customers!inner(id, name, allergen_restrictions)
        )
      `)
      .eq('org_id', orgId)
      .in('status', ['pending', 'packing'])
      .order('promised_ship_date', { ascending: true, nullsFirst: false })
      .limit(limit)

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId)
    }

    const { data: shipments, error } = await query

    if (error) {
      throw new PackingScannerError('Failed to fetch shipments', 'INTERNAL_ERROR', 500)
    }

    // Process shipments with counts
    const results: PendingShipmentSummary[] = []

    for (const shipment of shipments || []) {
      const salesOrder = (shipment as any).sales_orders
      const customer = salesOrder?.customers

      // Filter by search if provided
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSO = salesOrder?.so_number?.toLowerCase().includes(searchLower)
        const matchesCustomer = customer?.name?.toLowerCase().includes(searchLower)
        const matchesShipment = shipment.shipment_number?.toLowerCase().includes(searchLower)
        if (!matchesSO && !matchesCustomer && !matchesShipment) {
          continue
        }
      }

      // Get lines count
      const { count: linesTotal } = await supabase
        .from('sales_order_lines')
        .select('id', { count: 'exact', head: true })
        .eq('sales_order_id', salesOrder?.id)

      // Get packed lines count (lines with packed_quantity > 0)
      const { count: linesPacked } = await supabase
        .from('sales_order_lines')
        .select('id', { count: 'exact', head: true })
        .eq('sales_order_id', salesOrder?.id)
        .gt('packed_quantity', 0)

      // Get boxes count
      const { count: boxesCount } = await supabase
        .from('shipment_boxes')
        .select('id', { count: 'exact', head: true })
        .eq('shipment_id', shipment.id)
        .eq('org_id', orgId)

      // Check allergen alert
      const allergenRestrictions = customer?.allergen_restrictions || []
      const allergenAlert = allergenRestrictions.length > 0

      results.push({
        id: shipment.id,
        shipment_number: shipment.shipment_number,
        so_number: salesOrder?.so_number || '',
        customer_name: customer?.name || '',
        status: shipment.status as 'pending' | 'packing',
        promised_ship_date: shipment.promised_ship_date,
        lines_total: linesTotal || 0,
        lines_packed: linesPacked || 0,
        boxes_count: boxesCount || 0,
        allergen_alert: allergenAlert,
        warehouse_id: shipment.warehouse_id,
        org_id: shipment.org_id,
      })
    }

    return results
  }

  /**
   * Lookup shipment by SO or shipment number barcode
   * FR-7.37: Barcode lookup for scanner
   */
  static async lookupShipment(
    supabase: SupabaseClient,
    orgId: string,
    barcode: string
  ): Promise<ShipmentLookupResult | null> {
    // Try to find by shipment_number or sales_order.so_number
    const { data: shipment } = await supabase
      .from('shipments')
      .select(`
        id,
        shipment_number,
        sales_orders!inner(
          so_number,
          customers!inner(id, name, allergen_restrictions)
        )
      `)
      .eq('org_id', orgId)
      .or(`shipment_number.eq.${barcode},sales_orders.so_number.eq.${barcode}`)
      .single()

    if (!shipment) {
      return null
    }

    const salesOrder = (shipment as any).sales_orders
    const customer = salesOrder?.customers

    // Get lines count
    const { count: linesTotal } = await supabase
      .from('sales_order_lines')
      .select('id', { count: 'exact', head: true })
      .eq('sales_order_id', salesOrder?.id)

    return {
      id: shipment.id,
      shipment_number: shipment.shipment_number,
      so_number: salesOrder?.so_number || '',
      customer_name: customer?.name || '',
      lines_total: linesTotal || 0,
      allergen_restrictions: customer?.allergen_restrictions || [],
    }
  }

  /**
   * Lookup LP and validate allocation to shipment
   * FR-7.37: LP validation for packing
   */
  static async lookupLP(
    supabase: SupabaseClient,
    orgId: string,
    lpBarcode: string,
    shipmentId: string
  ): Promise<LPAllocationResult | null> {
    // 1. Find LP
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        lot_number,
        products!inner(id, name)
      `)
      .eq('org_id', orgId)
      .or(`lp_number.eq.${lpBarcode},id.eq.${lpBarcode}`)
      .single()

    if (lpError || !lp) {
      return null
    }

    // 2. Get shipment's sales_order_id
    const { data: shipment } = await supabase
      .from('shipments')
      .select('sales_order_id')
      .eq('id', shipmentId)
      .eq('org_id', orgId)
      .single()

    if (!shipment) {
      return {
        lp: {
          id: lp.id,
          lp_number: lp.lp_number,
          product_id: lp.product_id,
          product_name: (lp as any).products?.name || '',
          quantity: Number(lp.quantity) || 0,
          lot_number: lp.lot_number,
        },
        allocated: false,
        so_line_id: null,
        available_qty: 0,
      }
    }

    // 3. Check if LP is allocated to this SO via pick_list_lines
    const { data: pickLine } = await supabase
      .from('pick_list_lines')
      .select(`
        id,
        sales_order_line_id,
        picked_license_plate_id,
        pick_lists!inner(sales_order_id, org_id)
      `)
      .eq('picked_license_plate_id', lp.id)
      .eq('pick_lists.sales_order_id', shipment.sales_order_id)
      .eq('pick_lists.org_id', orgId)
      .single()

    const allocated = !!pickLine

    // 4. Calculate available qty (LP qty minus already packed)
    const { data: packedContents } = await supabase
      .from('shipment_box_contents')
      .select('quantity')
      .eq('license_plate_id', lp.id)
      .eq('org_id', orgId)

    const alreadyPacked = (packedContents || []).reduce(
      (sum, c) => sum + (Number(c.quantity) || 0),
      0
    )
    const availableQty = Math.max(0, (Number(lp.quantity) || 0) - alreadyPacked)

    return {
      lp: {
        id: lp.id,
        lp_number: lp.lp_number,
        product_id: lp.product_id,
        product_name: (lp as any).products?.name || '',
        quantity: Number(lp.quantity) || 0,
        lot_number: lp.lot_number,
      },
      allocated,
      so_line_id: pickLine?.sales_order_line_id || null,
      available_qty: availableQty,
    }
  }

  /**
   * Get box details with contents
   * FR-7.37: Box summary for display
   */
  static async getBoxDetails(
    supabase: SupabaseClient,
    orgId: string,
    boxId: string
  ): Promise<BoxDetails> {
    // 1. Get box
    const { data: box, error: boxError } = await supabase
      .from('shipment_boxes')
      .select('id, box_number, status, weight, length, width, height')
      .eq('id', boxId)
      .eq('org_id', orgId)
      .single()

    if (boxError || !box) {
      throw new PackingScannerError('Box not found', 'NOT_FOUND', 404)
    }

    // 2. Get contents with product info
    const { data: contents, error: contentsError } = await supabase
      .from('shipment_box_contents')
      .select(`
        id,
        quantity,
        lot_number,
        license_plates!inner(lp_number),
        products!inner(name, unit_weight, base_uom)
      `)
      .eq('shipment_box_id', boxId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: true })

    if (contentsError) {
      throw new PackingScannerError('Failed to fetch box contents', 'INTERNAL_ERROR', 500)
    }

    const contentDetails = (contents || []).map((c: any) => ({
      id: c.id,
      product_name: c.products?.name || '',
      lot_number: c.lot_number,
      lp_number: c.license_plates?.lp_number || '',
      quantity: Number(c.quantity) || 0,
    }))

    // 3. Calculate summary
    const itemCount = contentDetails.length
    const totalWeightEst = (contents || []).reduce((sum: number, c: any) => {
      const qty = Number(c.quantity) || 0
      const unitWeight = Number(c.products?.unit_weight) || 0
      return sum + qty * unitWeight
    }, 0)

    const items = (contents || []).map((c: any) => ({
      product_name: c.products?.name || '',
      quantity: Number(c.quantity) || 0,
      uom: c.products?.base_uom || 'EA',
    }))

    return {
      box: {
        id: box.id,
        box_number: box.box_number,
        status: box.status as 'open' | 'closed',
        weight: box.weight,
        dimensions: {
          length: box.length,
          width: box.width,
          height: box.height,
        },
      },
      contents: contentDetails,
      summary: {
        item_count: itemCount,
        total_weight_est: totalWeightEst,
        items,
      },
    }
  }

  /**
   * Remove item from box (undo pack)
   * FR-7.37: Undo pack operation
   */
  static async removeItemFromBox(
    supabase: SupabaseClient,
    orgId: string,
    boxContentId: string
  ): Promise<void> {
    // 1. Get box content
    const { data: content, error: contentError } = await supabase
      .from('shipment_box_contents')
      .select(`
        id,
        quantity,
        sales_order_line_id,
        shipment_box_id,
        shipment_boxes!inner(status)
      `)
      .eq('id', boxContentId)
      .eq('org_id', orgId)
      .single()

    if (contentError || !content) {
      throw new PackingScannerError('Item not found', 'NOT_FOUND', 404)
    }

    // 2. Check box is not closed
    if ((content as any).shipment_boxes?.status === 'closed') {
      throw new PackingScannerError('Cannot modify closed box', 'BOX_CLOSED', 400)
    }

    // 3. Update SO line packed_quantity
    if (content.sales_order_line_id) {
      const { data: soLine } = await supabase
        .from('sales_order_lines')
        .select('packed_quantity')
        .eq('id', content.sales_order_line_id)
        .single()

      const newPackedQty = Math.max(0, (Number(soLine?.packed_quantity) || 0) - Number(content.quantity))

      await supabase
        .from('sales_order_lines')
        .update({ packed_quantity: newPackedQty })
        .eq('id', content.sales_order_line_id)
    }

    // 4. Delete box content
    const { error: deleteError } = await supabase
      .from('shipment_box_contents')
      .delete()
      .eq('id', boxContentId)
      .eq('org_id', orgId)

    if (deleteError) {
      throw new PackingScannerError('Failed to remove item', 'INTERNAL_ERROR', 500)
    }
  }

  /**
   * Check allergen conflict for customer/product
   * FR-7.37: Allergen warning detection
   */
  static async checkAllergenConflict(
    supabase: SupabaseClient,
    orgId: string,
    customerId: string,
    productId: string,
    boxId?: string
  ): Promise<AllergenWarning | null> {
    // 1. Get customer allergen restrictions
    const { data: customer } = await supabase
      .from('customers')
      .select('name, allergen_restrictions')
      .eq('id', customerId)
      .eq('org_id', orgId)
      .single()

    if (!customer || !customer.allergen_restrictions || customer.allergen_restrictions.length === 0) {
      return null
    }

    const restrictions = customer.allergen_restrictions as string[]

    // 2. Get product allergens
    const { data: product } = await supabase
      .from('products')
      .select(`
        name,
        product_allergens(allergen:allergens(name))
      `)
      .eq('id', productId)
      .eq('org_id', orgId)
      .single()

    const productAllergens: string[] = ((product as any)?.product_allergens || [])
      .map((pa: any) => pa?.allergen?.name)
      .filter(Boolean)

    // 3. Find matches with current product
    let matches = restrictions.filter((r) =>
      productAllergens.some((a) => a.toLowerCase() === r.toLowerCase())
    )

    // 4. If boxId provided, also check box contents
    if (boxId) {
      const { data: boxContents } = await supabase
        .from('shipment_box_contents')
        .select(`
          products!inner(
            product_allergens(allergen:allergens(name))
          )
        `)
        .eq('shipment_box_id', boxId)
        .eq('org_id', orgId)

      const boxAllergens = new Set<string>()
      for (const content of boxContents || []) {
        const contentAllergens = ((content as any).products?.product_allergens || [])
          .map((pa: any) => pa?.allergen?.name)
          .filter(Boolean)
        contentAllergens.forEach((a: string) => boxAllergens.add(a.toLowerCase()))
      }

      // Add box allergens that match restrictions
      const boxMatches = restrictions.filter((r) => boxAllergens.has(r.toLowerCase()))
      matches = [...new Set([...matches, ...boxMatches])]
    }

    if (matches.length === 0) {
      return null
    }

    return {
      matches,
      customer_name: customer.name,
      product_name: product?.name || '',
    }
  }
}

export default PackingScannerService
