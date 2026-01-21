import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'

/**
 * PO Line Service
 * Story 3.2: PO Line Management
 *
 * Handles PO line CRUD operations with:
 * - Parent PO validation
 * - Product UoM inheritance
 * - Line total calculations
 * - Automatic PO totals update (via database trigger)
 * - Multi-tenancy (org_id isolation)
 */

export interface POLine {
  id: string
  po_id: string
  product_id: string
  line_number: number
  quantity: number
  uom: string
  unit_price: number
  discount_percent: number
  discount_amount: number
  line_total: number
  expected_delivery_date: string | null
  confirmed_delivery_date: string | null
  received_qty: number
  notes: string | null
  created_at: string
  updated_at: string
  // Populated data (JOIN results)
  products?: {
    id: string
    code: string
    name: string
    base_uom: string
  }
}

export interface CreatePOLineInput {
  product_id: string
  quantity: number
  unit_price: number
  discount_percent?: number
  expected_delivery_date?: Date | string | null
}

export interface UpdatePOLineInput {
  quantity?: number
  unit_price?: number
  discount_percent?: number
  expected_delivery_date?: Date | string | null
}

export interface ServiceResult<T = POLine> {
  success: boolean
  data?: T
  error?: string
  code?: 'NOT_FOUND' | 'PO_NOT_FOUND' | 'PRODUCT_NOT_FOUND' | 'PO_LOCKED' | 'INVALID_INPUT' | 'DATABASE_ERROR' | 'UNAUTHORIZED'
}

export interface ListResult {
  success: boolean
  data?: POLine[]
  total?: number
  error?: string
}

/**
 * Get current user's org_id from JWT
 */
async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData, error } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (error || !userData) {
    console.error('Failed to get org_id for user:', user.id, error)
    return null
  }

  return userData.org_id
}

/**
 * List PO lines for a purchase order
 * AC-3.2.7: Display lines table
 */
export async function listPOLines(poId: string): Promise<ListResult> {
  try {
    const orgId = await getCurrentOrgId()
    if (!orgId) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Verify PO exists and belongs to org
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id')
      .eq('id', poId)
      .eq('org_id', orgId)
      .single()

    if (poError || !po) {
      return {
        success: false,
        error: 'Purchase order not found',
      }
    }

    // Fetch lines with product details (no org_id filter - purchase_order_lines doesn't have it)
    const { data, error } = await supabaseAdmin
      .from('purchase_order_lines')
      .select(`
        *,
        products(id, code, name, base_uom)
      `)
      .eq('po_id', poId)
      .order('line_number', { ascending: true })

    if (error) {
      console.error('Error listing PO lines:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: data || [],
      total: data?.length || 0,
    }
  } catch (error) {
    console.error('Error in listPOLines:', error)
    return {
      success: false,
      error: 'Failed to list PO lines',
    }
  }
}

/**
 * Get PO line by ID
 */
export async function getPOLineById(lineId: string): Promise<ServiceResult> {
  try {
    const orgId = await getCurrentOrgId()
    if (!orgId) {
      return { success: false, error: 'User not authenticated', code: 'UNAUTHORIZED' }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Note: purchase_order_lines doesn't have org_id, isolation is via po_id FK
    const { data, error } = await supabaseAdmin
      .from('purchase_order_lines')
      .select(`
        *,
        products(id, code, name, base_uom)
      `)
      .eq('id', lineId)
      .single()

    if (error || !data) {
      return {
        success: false,
        error: 'PO line not found',
        code: 'NOT_FOUND',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error in getPOLineById:', error)
    return {
      success: false,
      error: 'Failed to get PO line',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Add new PO line
 * AC-3.2.2: Calculate line totals
 * AC-3.2.3: Inherit UoM from product
 * AC-3.2.4: Validate parent PO
 * AC-3.2.5: Auto-update PO totals (via trigger)
 */
export async function addPOLine(
  poId: string,
  input: CreatePOLineInput
): Promise<ServiceResult> {
  try {
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'User not authenticated', code: 'UNAUTHORIZED' }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // AC-3.2.4: Verify PO exists and belongs to org
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, status, supplier_id, org_id')
      .eq('id', poId)
      .eq('org_id', orgId)
      .single()

    if (poError || !po) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'PO_NOT_FOUND',
      }
    }

    // Check if PO is locked (closed or receiving)
    if (['closed', 'receiving'].includes(po.status.toLowerCase())) {
      return {
        success: false,
        error: 'Cannot add lines to PO in Closed or Receiving status',
        code: 'PO_LOCKED',
      }
    }

    // AC-3.2.4: Verify product exists and belongs to org
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, uom')
      .eq('id', input.product_id)
      .eq('org_id', orgId)
      .single()

    if (productError || !product) {
      return {
        success: false,
        error: 'Product not found or does not belong to your organization',
        code: 'PRODUCT_NOT_FOUND',
      }
    }

    // Get tax rate from supplier's tax code
    const { data: supplier } = await supabaseAdmin
      .from('suppliers')
      .select('tax_code_id, tax_codes(rate)')
      .eq('id', po.supplier_id)
      .single()

    const tax_rate = (supplier?.tax_codes as any)?.rate || 0

    // Get next line_number
    const { count } = await supabaseAdmin
      .from('purchase_order_lines')
      .select('*', { count: 'exact', head: true })
      .eq('po_id', poId)

    const line_number = (count || 0) + 1

    // AC-3.2.2: Calculate line amounts
    const line_subtotal = Number(input.quantity) * Number(input.unit_price)
    const discount_amount = line_subtotal * (Number(input.discount_percent || 0) / 100)
    const line_total = line_subtotal - discount_amount

    // Prepare line data
    const expectedDeliveryDate = input.expected_delivery_date
      ? (typeof input.expected_delivery_date === 'string'
          ? input.expected_delivery_date
          : input.expected_delivery_date.toISOString().split('T')[0])
      : null

    // Note: purchase_order_lines doesn't have org_id - isolation is via po_id FK
    const lineData = {
      po_id: poId,
      product_id: input.product_id,
      line_number,
      quantity: input.quantity,
      uom: product.uom, // AC-3.2.3: Inherit UoM from product
      unit_price: input.unit_price,
      discount_percent: input.discount_percent || 0,
      discount_amount: Number(discount_amount.toFixed(2)),
      line_total: Number(line_total.toFixed(2)),
      expected_delivery_date: expectedDeliveryDate,
    }

    // Insert line
    const { data, error: insertError } = await supabaseAdmin
      .from('purchase_order_lines')
      .insert(lineData)
      .select(`
        *,
        products(id, code, name, base_uom)
      `)
      .single()

    if (insertError) {
      console.error('Error adding PO line:', insertError)
      return {
        success: false,
        error: insertError.message,
        code: 'DATABASE_ERROR',
      }
    }

    // AC-3.2.5: PO totals are automatically updated by database trigger

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error in addPOLine:', error)
    return {
      success: false,
      error: 'Failed to add PO line',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Update PO line
 * AC-3.2.2: Recalculate line totals
 * AC-3.2.5: Auto-update PO totals (via trigger)
 */
export async function updatePOLine(
  lineId: string,
  input: UpdatePOLineInput
): Promise<ServiceResult> {
  try {
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'User not authenticated', code: 'UNAUTHORIZED' }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Fetch current line (purchase_order_lines doesn't have org_id)
    const { data: currentLine, error: lineError } = await supabaseAdmin
      .from('purchase_order_lines')
      .select('po_id, product_id, quantity, unit_price, discount_percent')
      .eq('id', lineId)
      .single()

    if (lineError || !currentLine) {
      return {
        success: false,
        error: 'PO line not found',
        code: 'NOT_FOUND',
      }
    }

    // Check PO status and verify org isolation via the parent PO
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('status, supplier_id, org_id')
      .eq('id', currentLine.po_id)
      .single()

    if (poError || !po) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'PO_NOT_FOUND',
      }
    }

    // Verify org_id isolation via the parent PO
    if (po.org_id !== orgId) {
      return {
        success: false,
        error: 'PO line not found',
        code: 'NOT_FOUND',
      }
    }

    if (['closed', 'receiving'].includes(po.status.toLowerCase())) {
      return {
        success: false,
        error: 'Cannot update lines for PO in Closed or Receiving status',
        code: 'PO_LOCKED',
      }
    }

    // Get tax rate
    const { data: supplier } = await supabaseAdmin
      .from('suppliers')
      .select('tax_code_id, tax_codes(rate)')
      .eq('id', po.supplier_id)
      .single()

    const tax_rate = (supplier?.tax_codes as any)?.rate || 0

    // Use updated values or keep current
    const quantity = input.quantity !== undefined ? input.quantity : currentLine.quantity
    const unit_price = input.unit_price !== undefined ? input.unit_price : currentLine.unit_price
    const discount_percent = input.discount_percent !== undefined ? input.discount_percent : currentLine.discount_percent

    // Recalculate totals
    const line_subtotal = Number(quantity) * Number(unit_price)
    const discount_amount = line_subtotal * (Number(discount_percent) / 100)
    const line_total = line_subtotal - discount_amount
    const tax_amount = line_total * (tax_rate / 100)
    const line_total_with_tax = line_total + tax_amount

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (input.quantity !== undefined) {
      updateData.quantity = input.quantity
    }

    if (input.unit_price !== undefined) {
      updateData.unit_price = input.unit_price
    }

    if (input.discount_percent !== undefined) {
      updateData.discount_percent = input.discount_percent
    }

    if (input.expected_delivery_date !== undefined) {
      updateData.expected_delivery_date = input.expected_delivery_date
        ? (typeof input.expected_delivery_date === 'string'
            ? input.expected_delivery_date
            : input.expected_delivery_date.toISOString().split('T')[0])
        : null
    }

    // Always update calculated fields (purchase_order_lines table schema)
    updateData.discount_amount = Number(discount_amount.toFixed(2))
    updateData.line_total = Number(line_total.toFixed(2))

    // Update line (no org_id filter - purchase_order_lines doesn't have it)
    const { data, error: updateError } = await supabaseAdmin
      .from('purchase_order_lines')
      .update(updateData)
      .eq('id', lineId)
      .select(`
        *,
        products(id, code, name, base_uom)
      `)
      .single()

    if (updateError) {
      console.error('Error updating PO line:', updateError)
      return {
        success: false,
        error: updateError.message,
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error in updatePOLine:', error)
    return {
      success: false,
      error: 'Failed to update PO line',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Delete PO line
 * AC-3.2.5: Auto-update PO totals (via trigger)
 */
export async function deletePOLine(lineId: string): Promise<ServiceResult<null>> {
  try {
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'User not authenticated', code: 'UNAUTHORIZED' }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Fetch current line (purchase_order_lines doesn't have org_id)
    const { data: currentLine, error: lineError } = await supabaseAdmin
      .from('purchase_order_lines')
      .select('po_id')
      .eq('id', lineId)
      .single()

    if (lineError || !currentLine) {
      return {
        success: false,
        error: 'PO line not found',
        code: 'NOT_FOUND',
      }
    }

    // Check PO status and verify org isolation via the parent PO
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('status, org_id')
      .eq('id', currentLine.po_id)
      .single()

    if (poError || !po) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'PO_NOT_FOUND',
      }
    }

    // Verify org_id isolation via the parent PO
    if (po.org_id !== orgId) {
      return {
        success: false,
        error: 'PO line not found',
        code: 'NOT_FOUND',
      }
    }

    if (['closed', 'receiving'].includes(po.status.toLowerCase())) {
      return {
        success: false,
        error: 'Cannot delete lines from PO in Closed or Receiving status',
        code: 'PO_LOCKED',
      }
    }

    // Delete line (no org_id filter - purchase_order_lines doesn't have it)
    const { error: deleteError } = await supabaseAdmin
      .from('purchase_order_lines')
      .delete()
      .eq('id', lineId)

    if (deleteError) {
      console.error('Error deleting PO line:', deleteError)
      return {
        success: false,
        error: deleteError.message,
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data: null,
    }
  } catch (error) {
    console.error('Error in deletePOLine:', error)
    return {
      success: false,
      error: 'Failed to delete PO line',
      code: 'DATABASE_ERROR',
    }
  }
}
