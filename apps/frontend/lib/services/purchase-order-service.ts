import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import { generatePONumber } from '../utils/po-number-generator'

/**
 * Purchase Order Service
 * Story 3.1: Purchase Order CRUD
 *
 * Handles purchase order CRUD operations with:
 * - PO number auto-generation (PO-YYYY-NNNN format)
 * - Currency and tax_code inheritance from supplier
 * - Warehouse validation
 * - Multi-tenancy (org_id isolation)
 * - Status management
 */

export interface PurchaseOrder {
  id: string
  org_id: string
  po_number: string
  supplier_id: string
  warehouse_id: string
  status: string
  expected_delivery_date: string
  actual_delivery_date: string | null
  payment_terms: string | null
  shipping_method: string | null
  notes: string | null
  currency: string
  subtotal: number
  tax_amount: number
  total: number
  approval_status: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
  // Populated data (JOIN results)
  suppliers?: {
    id: string
    code: string
    name: string
    currency: string
  }
  warehouses?: {
    id: string
    code: string
    name: string
  }
}

export interface CreatePurchaseOrderInput {
  supplier_id: string
  warehouse_id: string
  expected_delivery_date: Date | string
  payment_terms?: string | null
  shipping_method?: string | null
  notes?: string | null
}

export interface UpdatePurchaseOrderInput {
  expected_delivery_date?: Date | string
  actual_delivery_date?: Date | string | null
  payment_terms?: string | null
  shipping_method?: string | null
  notes?: string | null
  status?: string
}

export interface PurchaseOrderFilters {
  search?: string
  status?: string
  supplier_id?: string
  warehouse_id?: string
  date_from?: string
  date_to?: string
  sort_by?: 'po_number' | 'expected_delivery_date' | 'total'
  sort_direction?: 'asc' | 'desc'
}

export interface ServiceResult<T = PurchaseOrder> {
  success: boolean
  data?: T
  error?: string
  code?: 'NOT_FOUND' | 'SUPPLIER_NOT_FOUND' | 'WAREHOUSE_NOT_FOUND' | 'INVALID_INPUT' | 'DATABASE_ERROR' | 'UNAUTHORIZED'
}

export interface ListResult {
  success: boolean
  data?: PurchaseOrder[]
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
 * Get current user ID
 */
async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

/**
 * List purchase orders with filters
 * AC-3.1.1: Display PO list with filters
 */
export async function listPurchaseOrders(
  filters: PurchaseOrderFilters = {}
): Promise<ListResult> {
  try {
    const orgId = await getCurrentOrgId()
    if (!orgId) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    let query = supabaseAdmin
      .from('purchase_orders')
      .select(`
        *,
        suppliers(id, code, name, currency),
        warehouses(id, code, name)
      `)
      .eq('org_id', orgId)

    // Apply filters
    if (filters.search) {
      query = query.or(`po_number.ilike.%${filters.search}%,suppliers.name.ilike.%${filters.search}%`)
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id)
    }

    if (filters.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id)
    }

    if (filters.date_from) {
      query = query.gte('expected_delivery_date', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('expected_delivery_date', filters.date_to)
    }

    // Sorting
    const sortBy = filters.sort_by || 'po_number'
    const sortDirection = filters.sort_direction === 'asc'
    query = query.order(sortBy, { ascending: sortDirection })

    const { data, error } = await query

    if (error) {
      console.error('Error listing purchase orders:', error)
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
    console.error('Error in listPurchaseOrders:', error)
    return {
      success: false,
      error: 'Failed to list purchase orders',
    }
  }
}

/**
 * Get purchase order by ID
 */
export async function getPurchaseOrderById(id: string): Promise<ServiceResult> {
  try {
    const orgId = await getCurrentOrgId()
    if (!orgId) {
      return { success: false, error: 'User not authenticated', code: 'UNAUTHORIZED' }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .select(`
        *,
        suppliers(id, code, name, currency),
        warehouses(id, code, name)
      `)
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error || !data) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error in getPurchaseOrderById:', error)
    return {
      success: false,
      error: 'Failed to get purchase order',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Create new purchase order
 * AC-3.1.2: Auto-generate PO number
 * AC-3.1.3: Validate supplier and warehouse
 * AC-3.1.4: Inherit currency and tax_code from supplier
 */
export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput
): Promise<ServiceResult> {
  try {
    const orgId = await getCurrentOrgId()
    const userId = await getCurrentUserId()

    if (!orgId || !userId) {
      return { success: false, error: 'User not authenticated', code: 'UNAUTHORIZED' }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // AC-3.1.6: Validate supplier exists and belongs to org
    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from('suppliers')
      .select('id, currency, tax_code_id, payment_terms')
      .eq('id', input.supplier_id)
      .eq('org_id', orgId)
      .single()

    if (supplierError || !supplier) {
      return {
        success: false,
        error: 'Supplier not found or does not belong to your organization',
        code: 'SUPPLIER_NOT_FOUND',
      }
    }

    // AC-3.1.6: Validate warehouse exists and belongs to org
    const { data: warehouse, error: warehouseError } = await supabaseAdmin
      .from('warehouses')
      .select('id')
      .eq('id', input.warehouse_id)
      .eq('org_id', orgId)
      .single()

    if (warehouseError || !warehouse) {
      return {
        success: false,
        error: 'Warehouse not found or does not belong to your organization',
        code: 'WAREHOUSE_NOT_FOUND',
      }
    }

    // Get default status from settings
    const { data: settings } = await supabaseAdmin
      .from('planning_settings')
      .select('po_default_status, po_require_approval, po_approval_threshold')
      .eq('org_id', orgId)
      .single()

    const defaultStatus = settings?.po_default_status || 'draft'

    // AC-3.1.2: Generate PO number
    const po_number = await generatePONumber(orgId)

    // Prepare PO data
    const expectedDeliveryDate = typeof input.expected_delivery_date === 'string'
      ? input.expected_delivery_date
      : input.expected_delivery_date.toISOString().split('T')[0]

    const poData = {
      org_id: orgId,
      po_number,
      supplier_id: input.supplier_id,
      warehouse_id: input.warehouse_id,
      expected_delivery_date: expectedDeliveryDate,
      payment_terms: input.payment_terms || supplier.payment_terms,
      shipping_method: input.shipping_method || null,
      notes: input.notes || null,
      currency: supplier.currency, // AC-3.1.4: Inherit from supplier
      status: defaultStatus,
      subtotal: 0,
      tax_amount: 0,
      total: 0,
      approval_status: null,
      created_by: userId,
      updated_by: userId,
    }

    // Insert PO
    const { data, error: insertError } = await supabaseAdmin
      .from('purchase_orders')
      .insert(poData)
      .select(`
        *,
        suppliers(id, code, name, currency),
        warehouses(id, code, name)
      `)
      .single()

    if (insertError) {
      console.error('Error creating purchase order:', insertError)
      return {
        success: false,
        error: insertError.message,
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error in createPurchaseOrder:', error)
    return {
      success: false,
      error: 'Failed to create purchase order',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Update purchase order
 */
export async function updatePurchaseOrder(
  id: string,
  input: UpdatePurchaseOrderInput
): Promise<ServiceResult> {
  try {
    const orgId = await getCurrentOrgId()
    const userId = await getCurrentUserId()

    if (!orgId || !userId) {
      return { success: false, error: 'User not authenticated', code: 'UNAUTHORIZED' }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if PO exists and belongs to org
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (checkError || !existing) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    // Prepare update data
    const updateData: any = {
      ...input,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }

    // Handle date fields
    if (input.expected_delivery_date) {
      updateData.expected_delivery_date = typeof input.expected_delivery_date === 'string'
        ? input.expected_delivery_date
        : input.expected_delivery_date.toISOString().split('T')[0]
    }

    if (input.actual_delivery_date) {
      updateData.actual_delivery_date = typeof input.actual_delivery_date === 'string'
        ? input.actual_delivery_date
        : input.actual_delivery_date.toISOString().split('T')[0]
    }

    // Update PO
    const { data, error: updateError } = await supabaseAdmin
      .from('purchase_orders')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', orgId)
      .select(`
        *,
        suppliers(id, code, name, currency),
        warehouses(id, code, name)
      `)
      .single()

    if (updateError) {
      console.error('Error updating purchase order:', updateError)
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
    console.error('Error in updatePurchaseOrder:', error)
    return {
      success: false,
      error: 'Failed to update purchase order',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Delete purchase order
 */
export async function deletePurchaseOrder(id: string): Promise<ServiceResult<null>> {
  try {
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'User not authenticated', code: 'UNAUTHORIZED' }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if PO exists and belongs to org
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (checkError || !existing) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    // Delete PO
    const { error: deleteError } = await supabaseAdmin
      .from('purchase_orders')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (deleteError) {
      console.error('Error deleting purchase order:', deleteError)
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
    console.error('Error in deletePurchaseOrder:', error)
    return {
      success: false,
      error: 'Failed to delete purchase order',
      code: 'DATABASE_ERROR',
    }
  }
}
