import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import { generatePONumber } from '../utils/po-number-generator'
import type { POStatus, POApprovalAction, POApprovalHistory } from '../validation/purchase-order'
import { getPlanningSettings } from './planning-settings-service'

/**
 * Purchase Order Service
 * Story 03.3: PO CRUD + Lines
 *
 * Handles purchase order operations with:
 * - PO number auto-generation (PO-YYYY-NNNNN format)
 * - Currency and tax_code inheritance from supplier
 * - Warehouse validation
 * - Multi-tenancy (org_id isolation)
 * - Status management and transitions
 * - Line operations with totals calculation
 */

// ============================================================================
// Types
// ============================================================================

export interface PurchaseOrder {
  id: string
  org_id: string
  po_number: string
  supplier_id: string
  warehouse_id: string
  status: POStatus
  expected_delivery_date: string
  actual_delivery_date: string | null
  payment_terms: string | null
  shipping_method: string | null
  notes: string | null
  internal_notes: string | null
  currency: string
  subtotal: number
  tax_amount: number
  total: number
  discount_total: number
  approval_status: string | null
  approved_by: string | null
  approved_at: string | null
  approval_notes: string | null
  rejection_reason: string | null
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
  tax_code_id: string | null
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
  tax_code?: {
    id: string
    code: string
    rate: number
  }
}

export interface POLine {
  id: string
  po_id: string
  line_number: number
  product_id: string
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
  product?: {
    id: string
    code: string
    name: string
    uom: string
  }
}

export interface PurchaseOrderWithLines extends PurchaseOrder {
  lines: POLine[]
}

export interface POListItem {
  id: string
  po_number: string
  supplier_name: string
  status: POStatus
  expected_delivery_date: string
  total: number
  currency: string
  line_count: number
  created_at: string
}

export interface POTotals {
  subtotal: number
  discount_total: number
  tax_amount: number
  total: number
}

export interface POStatusHistory {
  id: string
  po_id: string
  from_status: string | null
  to_status: string
  changed_by: string | null
  changed_at: string
  notes: string | null
  user?: {
    first_name: string
    last_name: string
  }
}

export interface SupplierDefaults {
  currency: string
  tax_code_id: string | null
  payment_terms: string | null
}

export interface ProductPriceInfo {
  price: number
  source: 'supplier' | 'standard' | 'fallback'
}

export interface POLineInput {
  quantity: number
  unit_price: number
  discount_percent?: number
}

export interface CreatePurchaseOrderInput {
  supplier_id: string
  warehouse_id: string
  expected_delivery_date: Date | string
  currency?: string
  tax_code_id?: string | null
  payment_terms?: string | null
  shipping_method?: string | null
  notes?: string | null
  internal_notes?: string | null
  lines?: CreatePOLineInput[]
}

export interface UpdatePurchaseOrderInput {
  expected_delivery_date?: Date | string
  warehouse_id?: string
  tax_code_id?: string | null
  payment_terms?: string | null
  shipping_method?: string | null
  notes?: string | null
  internal_notes?: string | null
  lines?: UpdatePOLineInput[]
}

export interface CreatePOLineInput {
  product_id: string
  quantity: number
  unit_price: number
  uom: string
  discount_percent?: number
  expected_delivery_date?: string | null
  notes?: string | null
}

export interface UpdatePOLineInput extends Partial<CreatePOLineInput> {
  id?: string
  _delete?: boolean
}

export interface PurchaseOrderFilters {
  search?: string
  status?: string
  supplier_id?: string
  warehouse_id?: string
  date_from?: string
  date_to?: string
  sort_by?: 'po_number' | 'expected_delivery_date' | 'total' | 'created_at'
  sort_direction?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ServiceResult<T = PurchaseOrder> {
  success: boolean
  data?: T
  error?: string
  code?: 'NOT_FOUND' | 'SUPPLIER_NOT_FOUND' | 'WAREHOUSE_NOT_FOUND' | 'INVALID_INPUT' | 'DATABASE_ERROR' | 'UNAUTHORIZED' | 'INVALID_STATUS' | 'NO_LINES' | 'HAS_RECEIPTS' | 'DUPLICATE_PRODUCT'
}

export interface ListResult {
  success: boolean
  data?: PurchaseOrder[]
  total?: number
  error?: string
}

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

// ============================================================================
// Status Transition Rules
// ============================================================================

/**
 * Valid status transitions map.
 * Key: current status, Value: array of valid target statuses
 *
 * Story 03.5b: Extended with approval workflow statuses
 * - draft -> pending_approval (if approval enabled)
 * - draft -> submitted (if approval disabled)
 * - pending_approval -> approved/rejected
 * - approved -> confirmed
 * - rejected -> draft (for re-editing)
 */
const VALID_STATUS_TRANSITIONS: Record<POStatus, POStatus[]> = {
  draft: ['submitted', 'pending_approval', 'cancelled'],
  submitted: ['pending_approval', 'confirmed', 'cancelled'],
  pending_approval: ['approved', 'rejected', 'cancelled'],
  approved: ['confirmed', 'cancelled'],
  rejected: ['draft'],  // Return to draft for editing
  confirmed: ['receiving', 'cancelled'],
  receiving: ['closed', 'cancelled'],
  closed: [],
  cancelled: [],
}

/**
 * Statuses that allow editing of lines
 */
const EDITABLE_LINE_STATUSES: POStatus[] = ['draft', 'submitted']

// ============================================================================
// PurchaseOrderService Class
// ============================================================================

/**
 * Purchase Order Service class with static methods.
 * Provides all PO operations including CRUD, status transitions, and line management.
 */
export class PurchaseOrderService {
  // ==========================================================================
  // Totals Calculation (Pure functions - no DB access)
  // ==========================================================================

  /**
   * Calculate totals from an array of line items.
   * AC-04-1 to AC-04-3: Subtotal, tax, and grand total calculation.
   *
   * @param lines Array of line items with quantity, unit_price, and discount_percent
   * @param taxRate Tax rate as a percentage (e.g., 23 for 23%)
   * @returns POTotals object with subtotal, discount_total, tax_amount, and total
   */
  static calculateTotals(lines: POLineInput[], taxRate: number = 0): POTotals {
    let subtotal = 0
    let discountTotal = 0

    for (const line of lines) {
      const lineGross = line.quantity * line.unit_price
      const discountPercent = line.discount_percent ?? 0
      const discountAmount = lineGross * (discountPercent / 100)
      const lineNet = lineGross - discountAmount

      discountTotal += discountAmount
      subtotal += lineNet
    }

    // Round to 2 decimal places for currency
    subtotal = Math.round(subtotal * 100) / 100
    discountTotal = Math.round(discountTotal * 100) / 100

    const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100
    const total = Math.round((subtotal + taxAmount) * 100) / 100

    return {
      subtotal,
      discount_total: discountTotal,
      tax_amount: taxAmount,
      total,
    }
  }

  // ==========================================================================
  // Status Transition Validation (Pure functions - no DB access)
  // ==========================================================================

  /**
   * Validate if a status transition is allowed.
   * AC-05-2: Status transition rules enforcement.
   *
   * @param currentStatus Current PO status
   * @param newStatus Target status
   * @returns true if transition is valid, false otherwise
   */
  static validateStatusTransition(currentStatus: POStatus, newStatus: POStatus): boolean {
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus]
    return validTransitions?.includes(newStatus) ?? false
  }

  /**
   * Check if lines can be edited in the given status.
   * AC-05-1: Draft allows full editing.
   * AC-05-4: Confirmed PO restrictions.
   *
   * @param status PO status
   * @returns true if lines can be edited, false otherwise
   */
  static canEditLines(status: POStatus): boolean {
    return EDITABLE_LINE_STATUSES.includes(status)
  }

  /**
   * Check if a line can be deleted based on received quantity.
   *
   * @param line PO line with received_qty
   * @returns Object with allowed flag and optional reason
   */
  static async canDeleteLine(line: { received_qty: number }): Promise<{ allowed: boolean; reason?: string }> {
    if (line.received_qty > 0) {
      return {
        allowed: false,
        reason: 'Cannot delete line with received quantity',
      }
    }
    return { allowed: true }
  }

  // ==========================================================================
  // Supplier and Product Lookups (Async - requires DB access)
  // ==========================================================================

  /**
   * Get default values from a supplier.
   * AC-02-1: Supplier selection cascades defaults.
   *
   * @param supplierId Supplier UUID
   * @returns SupplierDefaults with currency, tax_code_id, and payment_terms
   */
  static async getDefaultsFromSupplier(supplierId: string): Promise<SupplierDefaults> {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data: supplier } = await supabaseAdmin
      .from('suppliers')
      .select('currency, tax_code_id, payment_terms')
      .eq('id', supplierId)
      .single()

    return {
      currency: supplier?.currency ?? 'PLN',
      tax_code_id: supplier?.tax_code_id ?? null,
      payment_terms: supplier?.payment_terms ?? null,
    }
  }

  /**
   * Get product price with supplier-product cascade.
   * AC-03-2: Supplier-product price when available.
   * AC-03-3: Fallback to product std_price.
   *
   * @param productId Product UUID
   * @param supplierId Supplier UUID
   * @returns ProductPriceInfo with price and source
   */
  static async getProductPrice(productId: string, supplierId: string): Promise<ProductPriceInfo> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // 1. Check supplier-product specific price
    const { data: supplierProduct } = await supabaseAdmin
      .from('supplier_products')
      .select('unit_price')
      .eq('product_id', productId)
      .eq('supplier_id', supplierId)
      .single()

    if (supplierProduct?.unit_price !== undefined && supplierProduct.unit_price !== null) {
      return {
        price: supplierProduct.unit_price,
        source: 'supplier',
      }
    }

    // 2. Fall back to product standard price
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('std_price')
      .eq('id', productId)
      .single()

    if (product?.std_price !== undefined && product?.std_price !== null) {
      return {
        price: product.std_price,
        source: 'standard',
      }
    }

    // 3. Default fallback
    return {
      price: 0,
      source: 'fallback',
    }
  }

  // ==========================================================================
  // PO Number Generation (Async - requires DB access)
  // ==========================================================================

  /**
   * Generate next PO number for an organization.
   * AC-02-2: PO number auto-generated as PO-YYYY-NNNNN.
   *
   * @param orgId Organization UUID
   * @returns Generated PO number string
   */
  static async generateNextNumber(orgId: string): Promise<string> {
    return await generatePONumber(orgId)
  }

  // ==========================================================================
  // Status History (Async - requires DB access)
  // ==========================================================================

  /**
   * Get status change history for a PO.
   *
   * @param poId Purchase Order UUID
   * @returns Array of status history entries
   */
  static async getStatusHistory(poId: string): Promise<POStatusHistory[]> {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('po_status_history')
      .select(`
        *,
        user:users(first_name, last_name)
      `)
      .eq('po_id', poId)
      .order('changed_at', { ascending: false })

    if (error) {
      console.error('Error fetching status history:', error)
      return []
    }

    return data || []
  }

  // ==========================================================================
  // CRUD Operations (Async - requires DB access)
  // ==========================================================================

  /**
   * List purchase orders with filters and pagination.
   * AC-01-1 to AC-01-4: List, search, filter, paginate.
   */
  static async list(
    params: PurchaseOrderFilters = {},
    orgId: string
  ): Promise<PaginatedResult<POListItem>> {
    const supabaseAdmin = createServerSupabaseAdmin()

    const page = params.page ?? 1
    const limit = Math.min(params.limit ?? 20, 100)
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('purchase_orders')
      .select(`
        id,
        po_number,
        status,
        expected_delivery_date,
        total,
        currency,
        created_at,
        suppliers!inner(name)
      `, { count: 'exact' })
      .eq('org_id', orgId)

    // Search filter
    if (params.search && params.search.length >= 2) {
      query = query.or(`po_number.ilike.%${params.search}%,suppliers.name.ilike.%${params.search}%`)
    }

    // Status filter (can be comma-separated)
    if (params.status && params.status !== 'all') {
      const statuses = params.status.split(',').map(s => s.trim())
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0])
      } else {
        query = query.in('status', statuses)
      }
    }

    // Other filters
    if (params.supplier_id) {
      query = query.eq('supplier_id', params.supplier_id)
    }
    if (params.warehouse_id) {
      query = query.eq('warehouse_id', params.warehouse_id)
    }
    if (params.date_from) {
      query = query.gte('expected_delivery_date', params.date_from)
    }
    if (params.date_to) {
      query = query.lte('expected_delivery_date', params.date_to)
    }

    // Sorting
    const sortField = params.sort_by ?? 'created_at'
    const sortAsc = params.sort_direction === 'asc'
    query = query.order(sortField, { ascending: sortAsc })

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error listing purchase orders:', error)
      return {
        data: [],
        meta: { total: 0, page, limit, pages: 0 },
      }
    }

    // Get line counts
    const poIds = (data || []).map(po => po.id)
    const { data: lineCounts } = await supabaseAdmin
      .from('purchase_order_lines')
      .select('po_id')
      .in('po_id', poIds)

    const lineCountMap = (lineCounts || []).reduce((acc, line) => {
      acc[line.po_id] = (acc[line.po_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const listItems: POListItem[] = (data || []).map(po => ({
      id: po.id,
      po_number: po.po_number,
      supplier_name: (po.suppliers as any)?.name ?? '',
      status: po.status as POStatus,
      expected_delivery_date: po.expected_delivery_date,
      total: po.total,
      currency: po.currency,
      line_count: lineCountMap[po.id] || 0,
      created_at: po.created_at,
    }))

    const total = count ?? 0

    return {
      data: listItems,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get purchase order by ID with lines.
   */
  static async getById(id: string, orgId: string): Promise<PurchaseOrderWithLines | null> {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .select(`
        *,
        suppliers(id, code, name, currency),
        warehouses(id, code, name),
        tax_code:tax_codes(id, code, rate)
      `)
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error || !data) {
      return null
    }

    // Fetch lines separately to avoid relationship detection issues
    const { data: lines, error: linesError } = await supabaseAdmin
      .from('purchase_order_lines')
      .select(`
        *,
        product:products(id, code, name, base_uom)
      `)
      .eq('po_id', id)
      .order('line_number', { ascending: true })

    if (linesError) {
      console.error('Error fetching PO lines:', linesError)
    }

    // Combine PO with lines
    return {
      ...data,
      lines: lines || []
    } as unknown as PurchaseOrderWithLines
  }

  /**
   * Create new purchase order with optional lines.
   * AC-02-1 to AC-02-4: Create PO with supplier defaults.
   * AC-10-1, AC-10-2: Transaction integrity - uses RPC for atomic operation.
   * MAJOR-05 Fix: Uses create_po_with_lines RPC for proper transaction handling.
   */
  static async create(
    input: CreatePurchaseOrderInput,
    orgId: string,
    userId: string
  ): Promise<ServiceResult<PurchaseOrderWithLines>> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get supplier defaults for currency/tax_code/payment_terms
    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from('suppliers')
      .select('id, currency, tax_code_id, payment_terms')
      .eq('id', input.supplier_id)
      .eq('org_id', orgId)
      .single()

    if (supplierError || !supplier) {
      return {
        success: false,
        error: 'Supplier not found',
        code: 'SUPPLIER_NOT_FOUND',
      }
    }

    // Prepare expected delivery date
    const expectedDeliveryDate = typeof input.expected_delivery_date === 'string'
      ? input.expected_delivery_date
      : input.expected_delivery_date.toISOString().split('T')[0]

    // Prepare lines for RPC (if any)
    const lines = input.lines || []
    const rpcLines = lines.map(line => ({
      product_id: line.product_id,
      quantity: line.quantity,
      uom: line.uom,
      unit_price: line.unit_price,
      discount_percent: line.discount_percent ?? 0,
      expected_delivery_date: line.expected_delivery_date ?? null,
      notes: line.notes ?? null,
    }))

    // Call atomic RPC function (MAJOR-05 Fix)
    const { data: rpcResult, error: rpcError } = await supabaseAdmin
      .rpc('create_po_with_lines', {
        p_org_id: orgId,
        p_supplier_id: input.supplier_id,
        p_warehouse_id: input.warehouse_id,
        p_expected_delivery_date: expectedDeliveryDate,
        p_currency: input.currency ?? supplier.currency ?? 'PLN',
        p_tax_code_id: input.tax_code_id ?? supplier.tax_code_id ?? null,
        p_payment_terms: input.payment_terms ?? supplier.payment_terms ?? null,
        p_shipping_method: input.shipping_method ?? null,
        p_notes: input.notes ?? null,
        p_internal_notes: input.internal_notes ?? null,
        p_created_by: userId,
        p_lines: rpcLines,
      })

    if (rpcError) {
      console.error('Error in create_po_with_lines RPC:', rpcError)
      return {
        success: false,
        error: rpcError.message,
        code: 'DATABASE_ERROR',
      }
    }

    // RPC returns array with single result row
    const result = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult

    if (!result?.success) {
      // Map RPC error codes to service error codes
      const errorCodeMap: Record<string, ServiceResult['code']> = {
        SUPPLIER_NOT_FOUND: 'SUPPLIER_NOT_FOUND',
        WAREHOUSE_NOT_FOUND: 'WAREHOUSE_NOT_FOUND',
        DATABASE_ERROR: 'DATABASE_ERROR',
      }
      return {
        success: false,
        error: result?.error_message ?? 'Failed to create purchase order',
        code: errorCodeMap[result?.error_code ?? ''] ?? 'DATABASE_ERROR',
      }
    }

    // Fetch complete PO with relations
    const po = await PurchaseOrderService.getById(result.po_id, orgId)

    return {
      success: true,
      data: po ?? undefined,
    }
  }

  /**
   * Update purchase order.
   */
  static async update(
    id: string,
    input: UpdatePurchaseOrderInput,
    orgId: string,
    userId: string
  ): Promise<ServiceResult<PurchaseOrderWithLines>> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check PO exists and get current status
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, status, org_id')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    // Verify org isolation - return 404 not 403
    if (existing.org_id !== orgId) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    // Check if editing is allowed
    if (!PurchaseOrderService.canEditLines(existing.status as POStatus)) {
      return {
        success: false,
        error: 'Cannot edit PO in current status',
        code: 'INVALID_STATUS',
      }
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }

    if (input.expected_delivery_date) {
      updateData.expected_delivery_date = typeof input.expected_delivery_date === 'string'
        ? input.expected_delivery_date
        : input.expected_delivery_date.toISOString().split('T')[0]
    }
    if (input.warehouse_id !== undefined) updateData.warehouse_id = input.warehouse_id
    if (input.tax_code_id !== undefined) updateData.tax_code_id = input.tax_code_id
    if (input.payment_terms !== undefined) updateData.payment_terms = input.payment_terms
    if (input.shipping_method !== undefined) updateData.shipping_method = input.shipping_method
    if (input.notes !== undefined) updateData.notes = input.notes
    if (input.internal_notes !== undefined) updateData.internal_notes = input.internal_notes

    const { error: updateError } = await supabaseAdmin
      .from('purchase_orders')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating purchase order:', updateError)
      return {
        success: false,
        error: updateError.message,
        code: 'DATABASE_ERROR',
      }
    }

    const result = await PurchaseOrderService.getById(id, orgId)

    return {
      success: true,
      data: result ?? undefined,
    }
  }

  /**
   * Delete purchase order (draft only).
   */
  static async delete(id: string, orgId: string): Promise<ServiceResult<null>> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check PO exists and get current status
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, status, org_id')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    // Verify org isolation
    if (existing.org_id !== orgId) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    // Only draft POs can be deleted
    if (existing.status !== 'draft') {
      return {
        success: false,
        error: 'Only draft POs can be deleted',
        code: 'INVALID_STATUS',
      }
    }

    // Delete lines first
    await supabaseAdmin
      .from('purchase_order_lines')
      .delete()
      .eq('po_id', id)

    // Delete PO
    const { error: deleteError } = await supabaseAdmin
      .from('purchase_orders')
      .delete()
      .eq('id', id)

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
  }

  // ==========================================================================
  // Status Transitions
  // ==========================================================================

  /**
   * Submit PO (draft -> submitted/confirmed).
   * AC-05-2: Submit PO.
   * AC-05-3: Cannot submit without lines.
   */
  static async submit(
    id: string,
    orgId: string,
    userId: string
  ): Promise<ServiceResult> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get PO
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, status, org_id')
      .eq('id', id)
      .single()

    if (poError || !po) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    if (po.org_id !== orgId) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    // Must be draft to submit
    if (po.status !== 'draft') {
      return {
        success: false,
        error: 'PO must be in draft status to submit',
        code: 'INVALID_STATUS',
      }
    }

    // Query lines separately to avoid relationship detection issues
    const { data: lines, error: linesError } = await supabaseAdmin
      .from('purchase_order_lines')
      .select('id')
      .eq('po_id', id)

    if (linesError) {
      console.error('Error fetching PO lines:', linesError)
      return {
        success: false,
        error: 'Error checking purchase order lines',
        code: 'DATABASE_ERROR',
      }
    }

    // Must have lines
    if (!lines || lines.length === 0) {
      return {
        success: false,
        error: 'Cannot submit PO without line items',
        code: 'NO_LINES',
      }
    }

    // Check if approval required (simplified - no approval workflow in MVP)
    const newStatus: POStatus = 'confirmed'

    // Update status
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('purchase_orders')
      .update({
        status: newStatus,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
        code: 'DATABASE_ERROR',
      }
    }

    // Record status history
    await supabaseAdmin.from('po_status_history').insert({
      po_id: id,
      from_status: 'draft',
      to_status: newStatus,
      changed_by: userId,
      changed_at: new Date().toISOString(),
    })

    return {
      success: true,
      data: updated,
    }
  }

  /**
   * Confirm PO (submitted/pending_approval -> confirmed).
   */
  static async confirm(
    id: string,
    orgId: string,
    userId: string
  ): Promise<ServiceResult> {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, status, org_id')
      .eq('id', id)
      .single()

    if (poError || !po) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    if (po.org_id !== orgId) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    // Validate transition
    if (!PurchaseOrderService.validateStatusTransition(po.status as POStatus, 'confirmed')) {
      return {
        success: false,
        error: 'PO cannot be confirmed from current status',
        code: 'INVALID_STATUS',
      }
    }

    const fromStatus = po.status

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('purchase_orders')
      .update({
        status: 'confirmed',
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
        code: 'DATABASE_ERROR',
      }
    }

    await supabaseAdmin.from('po_status_history').insert({
      po_id: id,
      from_status: fromStatus,
      to_status: 'confirmed',
      changed_by: userId,
      changed_at: new Date().toISOString(),
    })

    return {
      success: true,
      data: updated,
    }
  }

  /**
   * Cancel PO.
   * AC-05-5: Cancel PO.
   * AC-05-6: Cannot cancel with receipts.
   */
  static async cancel(
    id: string,
    orgId: string,
    userId: string,
    reason?: string
  ): Promise<ServiceResult> {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, status, org_id')
      .eq('id', id)
      .single()

    if (poError || !po) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    if (po.org_id !== orgId) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    // Validate transition
    if (!PurchaseOrderService.validateStatusTransition(po.status as POStatus, 'cancelled')) {
      return {
        success: false,
        error: 'PO cannot be cancelled from current status',
        code: 'INVALID_STATUS',
      }
    }

    // Query lines separately to check for receipts
    const { data: lines, error: linesError } = await supabaseAdmin
      .from('purchase_order_lines')
      .select('id, received_qty')
      .eq('po_id', id)

    if (linesError) {
      console.error('Error fetching PO lines:', linesError)
      return {
        success: false,
        error: 'Error checking purchase order lines',
        code: 'DATABASE_ERROR',
      }
    }

    // Check for receipts
    const hasReceipts = (lines || []).some((line: any) => line.received_qty > 0)
    if (hasReceipts) {
      return {
        success: false,
        error: 'Cannot cancel PO with recorded receipts',
        code: 'HAS_RECEIPTS',
      }
    }

    const fromStatus = po.status

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('purchase_orders')
      .update({
        status: 'cancelled',
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
        code: 'DATABASE_ERROR',
      }
    }

    await supabaseAdmin.from('po_status_history').insert({
      po_id: id,
      from_status: fromStatus,
      to_status: 'cancelled',
      changed_by: userId,
      changed_at: new Date().toISOString(),
      notes: reason,
    })

    return {
      success: true,
      data: updated,
    }
  }

  // ==========================================================================
  // Line Operations
  // ==========================================================================

  /**
   * Add line to PO.
   * AC-03-1: Add line item.
   * AC-03-6: Prevent duplicate product.
   */
  static async addLine(
    poId: string,
    line: CreatePOLineInput,
    orgId: string
  ): Promise<ServiceResult<POLine>> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check PO exists and is editable
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, status, org_id')
      .eq('id', poId)
      .single()

    if (poError || !po) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    if (po.org_id !== orgId) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    if (!PurchaseOrderService.canEditLines(po.status as POStatus)) {
      return {
        success: false,
        error: 'Cannot add lines to PO in current status',
        code: 'INVALID_STATUS',
      }
    }

    // Check for duplicate product
    const { data: existingLine } = await supabaseAdmin
      .from('purchase_order_lines')
      .select('id')
      .eq('po_id', poId)
      .eq('product_id', line.product_id)
      .single()

    if (existingLine) {
      return {
        success: false,
        error: 'Product already exists on this PO',
        code: 'DUPLICATE_PRODUCT',
      }
    }

    // Get next line number
    const { data: maxLine } = await supabaseAdmin
      .from('purchase_order_lines')
      .select('line_number')
      .eq('po_id', poId)
      .order('line_number', { ascending: false })
      .limit(1)
      .single()

    const nextLineNumber = (maxLine?.line_number ?? 0) + 1

    // Calculate line totals
    const lineGross = line.quantity * line.unit_price
    const discountPercent = line.discount_percent ?? 0
    const discountAmount = lineGross * (discountPercent / 100)
    const lineTotal = lineGross - discountAmount

    const lineData = {
      po_id: poId,
      line_number: nextLineNumber,
      product_id: line.product_id,
      quantity: line.quantity,
      unit_price: line.unit_price,
      uom: line.uom,
      discount_percent: discountPercent,
      discount_amount: Math.round(discountAmount * 100) / 100,
      line_total: Math.round(lineTotal * 100) / 100,
      expected_delivery_date: line.expected_delivery_date ?? null,
      notes: line.notes ?? null,
      received_qty: 0,
    }

    const { data: newLine, error: insertError } = await supabaseAdmin
      .from('purchase_order_lines')
      .insert(lineData)
      .select(`
        *,
        product:products(id, code, name, base_uom)
      `)
      .single()

    if (insertError) {
      return {
        success: false,
        error: insertError.message,
        code: 'DATABASE_ERROR',
      }
    }

    // Recalculate PO totals
    await PurchaseOrderService.recalculatePOTotals(poId)

    return {
      success: true,
      data: newLine as unknown as POLine,
    }
  }

  /**
   * Update PO line.
   */
  static async updateLine(
    poId: string,
    lineId: string,
    data: Partial<CreatePOLineInput>,
    orgId: string
  ): Promise<ServiceResult<POLine>> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check PO exists and is editable
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, status, org_id')
      .eq('id', poId)
      .single()

    if (poError || !po) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    if (po.org_id !== orgId) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    if (!PurchaseOrderService.canEditLines(po.status as POStatus)) {
      return {
        success: false,
        error: 'Cannot update lines on PO in current status',
        code: 'INVALID_STATUS',
      }
    }

    // Check line exists
    const { data: existingLine, error: lineError } = await supabaseAdmin
      .from('purchase_order_lines')
      .select('*')
      .eq('id', lineId)
      .eq('po_id', poId)
      .single()

    if (lineError || !existingLine) {
      return {
        success: false,
        error: 'PO line not found',
        code: 'NOT_FOUND',
      }
    }

    // Calculate new line totals
    const quantity = data.quantity ?? existingLine.quantity
    const unitPrice = data.unit_price ?? existingLine.unit_price
    const discountPercent = data.discount_percent ?? existingLine.discount_percent
    const lineGross = quantity * unitPrice
    const discountAmount = lineGross * (discountPercent / 100)
    const lineTotal = lineGross - discountAmount

    const updateData: Record<string, any> = {
      ...data,
      discount_amount: Math.round(discountAmount * 100) / 100,
      line_total: Math.round(lineTotal * 100) / 100,
      updated_at: new Date().toISOString(),
    }

    const { data: updatedLine, error: updateError } = await supabaseAdmin
      .from('purchase_order_lines')
      .update(updateData)
      .eq('id', lineId)
      .select(`
        *,
        product:products(id, code, name, base_uom)
      `)
      .single()

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
        code: 'DATABASE_ERROR',
      }
    }

    // Recalculate PO totals
    await PurchaseOrderService.recalculatePOTotals(poId)

    return {
      success: true,
      data: updatedLine as unknown as POLine,
    }
  }

  /**
   * Delete PO line.
   */
  static async deleteLine(
    poId: string,
    lineId: string,
    orgId: string
  ): Promise<ServiceResult<null>> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check PO exists and is editable
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, status, org_id')
      .eq('id', poId)
      .single()

    if (poError || !po) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    if (po.org_id !== orgId) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    if (!PurchaseOrderService.canEditLines(po.status as POStatus)) {
      return {
        success: false,
        error: 'Cannot delete lines from PO in current status',
        code: 'INVALID_STATUS',
      }
    }

    // Check line exists and has no receipts
    const { data: line, error: lineError } = await supabaseAdmin
      .from('purchase_order_lines')
      .select('id, received_qty')
      .eq('id', lineId)
      .eq('po_id', poId)
      .single()

    if (lineError || !line) {
      return {
        success: false,
        error: 'PO line not found',
        code: 'NOT_FOUND',
      }
    }

    const canDelete = await PurchaseOrderService.canDeleteLine(line)
    if (!canDelete.allowed) {
      return {
        success: false,
        error: canDelete.reason ?? 'Cannot delete line with received quantity',
        code: 'HAS_RECEIPTS',
      }
    }

    // Delete line
    const { error: deleteError } = await supabaseAdmin
      .from('purchase_order_lines')
      .delete()
      .eq('id', lineId)

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message,
        code: 'DATABASE_ERROR',
      }
    }

    // Re-sequence remaining lines
    await PurchaseOrderService.resequenceLines(poId)

    // Recalculate PO totals
    await PurchaseOrderService.recalculatePOTotals(poId)

    return {
      success: true,
      data: null,
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Recalculate and update PO totals from lines.
   */
  private static async recalculatePOTotals(poId: string): Promise<void> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get all lines
    const { data: lines } = await supabaseAdmin
      .from('purchase_order_lines')
      .select('line_total, discount_amount')
      .eq('po_id', poId)

    if (!lines || lines.length === 0) {
      await supabaseAdmin
        .from('purchase_orders')
        .update({
          subtotal: 0,
          discount_total: 0,
          tax_amount: 0,
          total: 0,
        })
        .eq('id', poId)
      return
    }

    const subtotal = lines.reduce((sum, line) => sum + (line.line_total || 0), 0)
    const discountTotal = lines.reduce((sum, line) => sum + (line.discount_amount || 0), 0)

    // Get PO tax rate
    const { data: po } = await supabaseAdmin
      .from('purchase_orders')
      .select('tax_code_id')
      .eq('id', poId)
      .single()

    let taxRate = 0
    if (po?.tax_code_id) {
      const { data: taxCode } = await supabaseAdmin
        .from('tax_codes')
        .select('rate')
        .eq('id', po.tax_code_id)
        .single()
      taxRate = taxCode?.rate ?? 0
    }

    const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100
    const total = Math.round((subtotal + taxAmount) * 100) / 100

    await supabaseAdmin
      .from('purchase_orders')
      .update({
        subtotal: Math.round(subtotal * 100) / 100,
        discount_total: Math.round(discountTotal * 100) / 100,
        tax_amount: taxAmount,
        total: total,
      })
      .eq('id', poId)
  }

  /**
   * Re-sequence line numbers after deletion.
   */
  private static async resequenceLines(poId: string): Promise<void> {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data: lines } = await supabaseAdmin
      .from('purchase_order_lines')
      .select('id')
      .eq('po_id', poId)
      .order('line_number', { ascending: true })

    if (!lines) return

    for (let i = 0; i < lines.length; i++) {
      await supabaseAdmin
        .from('purchase_order_lines')
        .update({ line_number: i + 1 })
        .eq('id', lines[i].id)
    }
  }
}

// ============================================================================
// Approval Workflow Functions (Story 03.5b)
// ============================================================================

/**
 * Submit result interface
 */
export interface SubmitPOResult {
  status: POStatus
  approvalRequired: boolean
  notificationSent: boolean
  notificationCount: number
}

/**
 * Approval history pagination options
 */
export interface ApprovalHistoryOptions {
  page?: number
  limit?: number
}

/**
 * Approval history result with pagination
 */
export interface ApprovalHistoryResult {
  history: POApprovalHistory[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

/**
 * Check if approval is required based on settings and PO total.
 *
 * Business Rules:
 * - BR-01: If po_require_approval=false, return false
 * - BR-02: If po_approval_threshold=null (and approval enabled), return true
 * - BR-03: If total >= threshold, return true
 *
 * @param total - PO total amount (including tax)
 * @param approvalEnabled - Whether approval is enabled in settings
 * @param options - Optional threshold value
 * @returns boolean indicating if approval is required
 */
export function checkApprovalRequired(
  total: number | null,
  approvalEnabled: boolean,
  options?: { threshold?: number | null }
): boolean {
  // BR-01: If approval disabled, not required
  if (!approvalEnabled) {
    return false
  }

  // BR-02: If threshold is null (all POs need approval when enabled)
  if (options?.threshold === undefined || options?.threshold === null) {
    return true
  }

  // BR-03: If total >= threshold, approval required
  if (total !== null && total >= options.threshold) {
    return true
  }

  return false
}

/**
 * Validate PO status transition.
 *
 * @param currentStatus - Current PO status
 * @param nextStatus - Target status
 * @param approvalEnabled - Whether approval is enabled
 * @throws Error if transition is invalid
 */
export function validateStatusTransition(
  currentStatus: POStatus,
  nextStatus: POStatus,
  approvalEnabled: boolean
): void {
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || []

  // Special handling: when approval is enabled, draft cannot go directly to submitted
  if (currentStatus === 'draft' && nextStatus === 'submitted' && approvalEnabled) {
    throw new Error('Approval is enabled. PO must go through pending_approval.')
  }

  if (!allowed.includes(nextStatus)) {
    throw new Error(`Invalid status transition: ${currentStatus} -> ${nextStatus}`)
  }
}

/**
 * Get approval roles from planning settings.
 * Returns a Promise that resolves to the roles array.
 *
 * @param orgId - Organization ID
 * @returns Promise<string[]> - Array of role codes that can approve POs
 */
export async function getApprovalRoles(orgId: string): Promise<string[]> {
  try {
    const settings = await getPlanningSettings(orgId)
    return settings.po_approval_roles || []
  } catch {
    // Default to admin and manager if settings fetch fails
    return ['admin', 'manager']
  }
}

/**
 * Check if a user can approve POs based on their role and org settings.
 *
 * @param userId - User ID
 * @param orgId - Organization ID
 * @param userRole - Optional user role (if already known)
 * @returns Promise<boolean> - Whether user can approve
 */
export async function canUserApprove(
  userId: string,
  orgId: string,
  userRole?: string
): Promise<boolean> {
  const supabaseAdmin = createServerSupabaseAdmin()

  // Get user role if not provided
  let role = userRole
  if (!role) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role:roles(code)')
      .eq('id', userId)
      .eq('org_id', orgId)
      .single()

    role = (user?.role as any)?.code
  }

  if (!role) {
    return false
  }

  // Get approval roles from settings
  const approvalRoles = await getApprovalRoles(orgId)

  // Case-insensitive comparison
  return approvalRoles.some(r => r.toLowerCase() === role!.toLowerCase())
}

/**
 * Submit PO for approval or direct submission based on settings.
 *
 * @param poId - Purchase Order ID
 * @param orgId - Organization ID
 * @param userId - User ID performing the action
 * @returns Promise with status, approval info, and notification count
 */
export async function submitPO(
  poId: string,
  orgId: string,
  userId: string
): Promise<SubmitPOResult> {
  const supabaseAdmin = createServerSupabaseAdmin()

  // Get PO
  const { data: po, error: poError } = await supabaseAdmin
    .from('purchase_orders')
    .select(`
      id, status, total, org_id, created_by, po_number,
      suppliers(name)
    `)
    .eq('id', poId)
    .eq('org_id', orgId)
    .single()

  if (poError || !po) {
    throw new Error('Purchase order not found')
  }

  // Verify org isolation
  if (po.org_id !== orgId) {
    throw new Error('Purchase order not found')
  }

  // Must be in draft status to submit
  if (po.status !== 'draft') {
    throw new Error('Cannot submit: PO must be in draft status')
  }

  // Query lines separately to avoid relationship detection issues
  const { data: lines, error: linesError } = await supabaseAdmin
    .from('purchase_order_lines')
    .select('id')
    .eq('po_id', poId)

  if (linesError) {
    console.error('Error fetching PO lines:', linesError)
    throw new Error('Error checking purchase order lines')
  }

  // Must have at least one line
  if (!lines || lines.length === 0) {
    throw new Error('Cannot submit PO: Purchase order must have at least one line item')
  }

  // Get planning settings
  const settings = await getPlanningSettings(orgId)

  // Check if approval is required
  const approvalRequired = checkApprovalRequired(
    po.total,
    settings.po_require_approval,
    { threshold: settings.po_approval_threshold }
  )

  // Determine new status
  const newStatus: POStatus = approvalRequired ? 'pending_approval' : 'submitted'
  const newApprovalStatus = approvalRequired ? 'pending' : null

  // Validate transition
  validateStatusTransition(po.status as POStatus, newStatus, settings.po_require_approval)

  // Get user info for history
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('first_name, last_name, role:roles(code)')
    .eq('id', userId)
    .single()

  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Unknown'
  const userRole = (user?.role as any)?.code || 'unknown'

  // Update PO status
  const { error: updateError } = await supabaseAdmin
    .from('purchase_orders')
    .update({
      status: newStatus,
      approval_status: newApprovalStatus,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', poId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  // Create approval history record
  await supabaseAdmin.from('po_approval_history').insert({
    org_id: orgId,
    po_id: poId,
    action: 'submitted',
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    notes: null,
  })

  // Record status change in po_status_history
  await supabaseAdmin.from('po_status_history').insert({
    po_id: poId,
    from_status: 'draft',
    to_status: newStatus,
    changed_by: userId,
    changed_at: new Date().toISOString(),
  })

  // Send notifications if approval required (async, non-blocking)
  let notificationCount = 0
  if (approvalRequired) {
    // Notification would be sent here (async)
    // For now, just count potential approvers
    const approvalRoles = settings.po_approval_roles || []
    const { count } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .in('role', approvalRoles)

    notificationCount = count || 0
  }

  return {
    status: newStatus,
    approvalRequired,
    notificationSent: approvalRequired && notificationCount > 0,
    notificationCount,
  }
}

/**
 * Approve a PO.
 *
 * @param poId - Purchase Order ID
 * @param orgId - Organization ID
 * @param userId - User ID performing the approval
 * @param userRole - Role of the user
 * @param notes - Optional approval notes
 * @returns Promise<void>
 */
export async function approvePO(
  poId: string,
  orgId: string,
  userId: string,
  userRole: string,
  notes?: string
): Promise<void> {
  const supabaseAdmin = createServerSupabaseAdmin()

  // Validate notes length
  if (notes && notes.length > 1000) {
    throw new Error('Notes cannot exceed 1000 characters')
  }

  // Check if user can approve
  const canApprove = await canUserApprove(userId, orgId, userRole)
  if (!canApprove) {
    throw new Error('Access denied: You do not have permission to approve purchase orders')
  }

  // Get PO
  const { data: po, error: poError } = await supabaseAdmin
    .from('purchase_orders')
    .select('id, status, approval_status, org_id, created_by, approved_by')
    .eq('id', poId)
    .eq('org_id', orgId)
    .single()

  if (poError || !po) {
    throw new Error('Purchase order not found')
  }

  if (po.org_id !== orgId) {
    throw new Error('Purchase order not found')
  }

  // Check if already processed (concurrent approval detection)
  if (po.approval_status === 'approved') {
    // Get approver name
    const { data: approver } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name')
      .eq('id', po.approved_by)
      .single()

    const approverName = approver ? `${approver.first_name || ''} ${approver.last_name || ''}`.trim() : 'another user'
    throw new Error(`This PO has already been approved by ${approverName}`)
  }

  // Must be in pending_approval status
  if (po.status !== 'pending_approval') {
    throw new Error('Cannot approve: PO must be in pending approval status')
  }

  // Get user info for history
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('first_name, last_name')
    .eq('id', userId)
    .single()

  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Unknown'
  const now = new Date().toISOString()

  // Update PO
  const { error: updateError } = await supabaseAdmin
    .from('purchase_orders')
    .update({
      status: 'approved',
      approval_status: 'approved',
      approved_by: userId,
      approved_at: now,
      approval_notes: notes || null,
      updated_by: userId,
      updated_at: now,
    })
    .eq('id', poId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  // Create approval history record
  await supabaseAdmin.from('po_approval_history').insert({
    org_id: orgId,
    po_id: poId,
    action: 'approved',
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    notes: notes || null,
  })

  // Record status change
  await supabaseAdmin.from('po_status_history').insert({
    po_id: poId,
    from_status: 'pending_approval',
    to_status: 'approved',
    changed_by: userId,
    changed_at: now,
    notes: notes || null,
  })

  // Notify PO creator (async, non-blocking)
  // Notification service would be called here
}

/**
 * Reject a PO.
 *
 * @param poId - Purchase Order ID
 * @param orgId - Organization ID
 * @param userId - User ID performing the rejection
 * @param userRole - Role of the user
 * @param rejectionReason - Required rejection reason (min 10 chars)
 * @returns Promise<void>
 */
export async function rejectPO(
  poId: string,
  orgId: string,
  userId: string,
  userRole: string,
  rejectionReason: string
): Promise<void> {
  const supabaseAdmin = createServerSupabaseAdmin()

  // Validate rejection reason
  if (!rejectionReason || rejectionReason.trim().length === 0) {
    throw new Error('Rejection reason is required')
  }

  const trimmedReason = rejectionReason.trim()
  if (trimmedReason.length < 10) {
    throw new Error('Rejection reason must be at least 10 characters')
  }

  if (trimmedReason.length > 1000) {
    throw new Error('Rejection reason must not exceed 1000 characters')
  }

  // Check if user can approve/reject
  const canApprove = await canUserApprove(userId, orgId, userRole)
  if (!canApprove) {
    throw new Error('Access denied: You do not have permission to reject purchase orders')
  }

  // Get PO
  const { data: po, error: poError } = await supabaseAdmin
    .from('purchase_orders')
    .select('id, status, approval_status, org_id, created_by')
    .eq('id', poId)
    .eq('org_id', orgId)
    .single()

  if (poError || !po) {
    throw new Error('Purchase order not found')
  }

  if (po.org_id !== orgId) {
    throw new Error('Purchase order not found')
  }

  // Must be in pending_approval status
  if (po.status !== 'pending_approval') {
    throw new Error('Cannot reject: PO must be in pending approval status')
  }

  // Get user info for history
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('first_name, last_name')
    .eq('id', userId)
    .single()

  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Unknown'
  const now = new Date().toISOString()

  // Update PO
  const { error: updateError } = await supabaseAdmin
    .from('purchase_orders')
    .update({
      status: 'rejected',
      approval_status: 'rejected',
      approved_by: userId,
      approved_at: now,
      approval_notes: trimmedReason,
      rejection_reason: trimmedReason,
      updated_by: userId,
      updated_at: now,
    })
    .eq('id', poId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  // Create approval history record
  await supabaseAdmin.from('po_approval_history').insert({
    org_id: orgId,
    po_id: poId,
    action: 'rejected',
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    notes: trimmedReason,
  })

  // Record status change
  await supabaseAdmin.from('po_status_history').insert({
    po_id: poId,
    from_status: 'pending_approval',
    to_status: 'rejected',
    changed_by: userId,
    changed_at: now,
    notes: trimmedReason,
  })

  // Notify PO creator (async, non-blocking)
  // Notification service would be called here
}

/**
 * Get PO approval history.
 *
 * @param poId - Purchase Order ID
 * @param orgId - Organization ID
 * @param options - Pagination options
 * @returns Promise with history and pagination
 */
export async function getPOApprovalHistory(
  poId: string,
  orgId: string,
  options?: ApprovalHistoryOptions
): Promise<ApprovalHistoryResult> {
  const supabaseAdmin = createServerSupabaseAdmin()

  const page = options?.page || 1
  const limit = Math.min(options?.limit || 10, 50) // Max 50 per page
  const offset = (page - 1) * limit

  // Verify PO exists and belongs to org
  const { data: po, error: poError } = await supabaseAdmin
    .from('purchase_orders')
    .select('id')
    .eq('id', poId)
    .eq('org_id', orgId)
    .single()

  if (poError || !po) {
    throw new Error('Purchase order not found')
  }

  // Get history with count
  const { data, error, count } = await supabaseAdmin
    .from('po_approval_history')
    .select('*', { count: 'exact' })
    .eq('po_id', poId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(error.message)
  }

  const total = count || 0

  return {
    history: (data as POApprovalHistory[]) || [],
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  }
}
