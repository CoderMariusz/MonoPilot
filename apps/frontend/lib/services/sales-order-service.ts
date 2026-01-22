/**
 * Sales Order Service
 * Story 07.2: Sales Orders Core
 *
 * Provides business logic for sales order operations:
 * - Line total calculations
 * - Order total calculations
 * - Date validation
 * - Status transitions
 * - Order number generation
 * - Line number management
 * - Inventory availability checks
 */

import { createClient } from '@/lib/supabase/client'

// =============================================================================
// Types
// =============================================================================

export type SOStatus =
  | 'draft'
  | 'confirmed'
  | 'on_hold'
  | 'cancelled'
  | 'allocated'
  | 'picking'
  | 'packing'
  | 'shipped'
  | 'delivered'

export interface SalesOrderLine {
  id?: string
  sales_order_id?: string
  line_number: number
  product_id: string
  quantity_ordered: number
  quantity_allocated?: number
  quantity_picked?: number
  quantity_packed?: number
  quantity_shipped?: number
  unit_price: number
  discount_type?: 'percent' | 'fixed' | null
  discount_value?: number | null
  line_total?: number
  notes?: string
  product?: {
    id: string
    code: string
    name: string
    std_price?: number
    available_qty?: number
  }
}

export interface SalesOrder {
  id: string
  org_id: string
  order_number: string
  customer_id: string
  customer_name?: string
  shipping_address_id?: string
  status: SOStatus
  order_date: string
  required_delivery_date: string
  customer_po?: string
  notes?: string
  total_amount: number
  line_count: number
  lines?: SalesOrderLine[]
  created_at: string
  updated_at?: string
}

export interface InventoryCheckResult {
  available: number
  requested: number
  sufficient: boolean
}

export interface OrderValidationResult {
  valid: boolean
  errors: string[]
}

// Valid status transitions map (Story 07.3)
const STATUS_TRANSITIONS: Record<SOStatus, SOStatus[]> = {
  draft: ['confirmed', 'on_hold', 'cancelled'],
  confirmed: ['on_hold', 'cancelled', 'allocated', 'shipped'],
  on_hold: ['confirmed', 'cancelled'],
  cancelled: [],
  allocated: ['picking', 'cancelled'],
  picking: ['packing'],
  packing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
}

// Statuses that can be put on hold
const HOLDABLE_STATUSES: SOStatus[] = ['draft', 'confirmed']

// Statuses that can be cancelled
const CANCELLABLE_STATUSES: SOStatus[] = ['draft', 'confirmed', 'on_hold', 'allocated']

// Statuses that cannot be modified (past picking)
const LOCKED_STATUSES: SOStatus[] = ['picking', 'packing', 'shipped', 'delivered']

// Statuses that can transition to confirmed
const CONFIRMABLE_STATUSES: SOStatus[] = ['draft', 'on_hold']

// =============================================================================
// Sales Order Service
// =============================================================================

export class SalesOrderService {
  /**
   * Calculate line total from quantity and unit price
   * AC-07: Calculate Line Total
   */
  static calculateLineTotal(quantity: number, unitPrice: number, discount?: { type: 'percent' | 'fixed'; value: number } | null): number {
    const subtotal = quantity * unitPrice

    if (!discount || !discount.value) {
      return Math.round(subtotal * 100) / 100
    }

    let total: number
    if (discount.type === 'percent') {
      total = subtotal * (1 - discount.value / 100)
    } else {
      total = subtotal - discount.value
    }

    return Math.round(Math.max(0, total) * 100) / 100
  }

  /**
   * Calculate order total from all lines
   * AC-08: Calculate Order Total
   */
  static calculateOrderTotal(lines: Array<{ quantity_ordered: number; unit_price: number; discount_type?: 'percent' | 'fixed' | null; discount_value?: number | null }>): number {
    if (!lines || lines.length === 0) return 0

    const total = lines.reduce((sum, line) => {
      const discount = line.discount_type && line.discount_value != null
        ? { type: line.discount_type, value: line.discount_value }
        : null
      return sum + this.calculateLineTotal(line.quantity_ordered, line.unit_price, discount)
    }, 0)

    return Math.round(total * 100) / 100
  }

  /**
   * Validate SO date relationship
   * AC-28: Validation - Date Relationship
   */
  static validateSODates(orderDate: string, deliveryDate: string): boolean {
    const order = new Date(orderDate)
    const delivery = new Date(deliveryDate)
    return delivery >= order
  }

  /**
   * Validate status transition
   * AC-10, AC-12: Status transitions
   */
  static validateStatusTransition(currentStatus: SOStatus, newStatus: SOStatus): boolean {
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus]
    return allowedTransitions.includes(newStatus)
  }

  /**
   * Check if order can be edited
   * AC-11, AC-12: Edit permissions
   */
  static canEditOrder(status: SOStatus): boolean {
    return status === 'draft'
  }

  /**
   * Check if order can be deleted
   * AC-13, AC-14: Delete permissions
   */
  static canDeleteOrder(status: SOStatus): boolean {
    return status === 'draft'
  }

  /**
   * Generate next SO number
   * AC-15, AC-16, AC-17: Order number generation
   */
  static async generateNextNumber(orgId: string): Promise<string> {
    const supabase = createClient()
    const year = new Date().getFullYear()

    // Get the latest order number for this org and year
    const { data, error } = await supabase
      .from('sales_orders')
      .select('order_number')
      .eq('org_id', orgId)
      .ilike('order_number', `SO-${year}-%`)
      .order('order_number', { ascending: false })
      .limit(1)
      .single()

    let nextSequence = 1
    if (data && !error) {
      const match = data.order_number.match(/SO-\d{4}-(\d{5})/)
      if (match) {
        nextSequence = parseInt(match[1], 10) + 1
      }
    }

    return `SO-${year}-${nextSequence.toString().padStart(5, '0')}`
  }

  /**
   * Get next line number for an order
   * AC-18, AC-19: Line number management
   */
  static getNextLineNumber(existingLines: Array<{ line_number: number }>): number {
    if (!existingLines || existingLines.length === 0) return 1
    const maxLineNumber = Math.max(...existingLines.map((l) => l.line_number))
    return maxLineNumber + 1
  }

  /**
   * Check inventory availability for a product
   * AC-20: Inventory Warning
   */
  static async checkInventoryAvailability(productId: string, requestedQty: number): Promise<InventoryCheckResult> {
    const supabase = createClient()

    // Get available inventory from license plates (unreserved, in available status)
    const { data, error } = await supabase
      .from('license_plates')
      .select('quantity')
      .eq('product_id', productId)
      .eq('status', 'available')
      .eq('qa_status', 'released')

    let available = 0
    if (data && !error) {
      available = data.reduce((sum, lp) => sum + (lp.quantity || 0), 0)
    }

    return {
      available,
      requested: requestedQty,
      sufficient: available >= requestedQty,
    }
  }

  /**
   * Validate order for confirmation
   * AC-25, AC-26, AC-27: Validation rules
   */
  static async validateOrderForConfirmation(order: SalesOrder): Promise<OrderValidationResult> {
    const errors: string[] = []

    // AC-25: Customer required
    if (!order.customer_id) {
      errors.push('Customer is required')
    }

    // AC-26: At least one line required
    if (!order.lines || order.lines.length === 0) {
      errors.push('At least one line is required')
    } else {
      // AC-27: Positive quantities
      for (const line of order.lines) {
        if (line.quantity_ordered <= 0) {
          errors.push('Quantity must be greater than zero')
          break
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Format currency value
   */
  static formatCurrency(value: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value)
  }

  /**
   * Format date for display
   */
  static formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // ===========================================================================
  // Story 07.3: Status Workflow Methods
  // ===========================================================================

  /**
   * Validate if a status transition is allowed
   * AC-4: Status state machine validation
   */
  static validateTransition(currentStatus: SOStatus, newStatus: SOStatus): boolean {
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus]
    return allowedTransitions.includes(newStatus)
  }

  /**
   * Check if status can be put on hold
   */
  static canHold(status: SOStatus): boolean {
    return HOLDABLE_STATUSES.includes(status)
  }

  /**
   * Check if status can be cancelled
   */
  static canCancel(status: SOStatus): boolean {
    return CANCELLABLE_STATUSES.includes(status)
  }

  /**
   * Check if status can be confirmed/released from hold
   */
  static canConfirm(status: SOStatus): boolean {
    return CONFIRMABLE_STATUSES.includes(status)
  }

  /**
   * Get error message for invalid hold attempt
   */
  static getHoldErrorMessage(status: SOStatus): string {
    if (status === 'cancelled') {
      return 'Cannot hold a cancelled order'
    }
    if (status === 'on_hold') {
      return 'Order is already on hold'
    }
    if (LOCKED_STATUSES.includes(status)) {
      return 'Cannot hold order after allocation has started'
    }
    return `Cannot hold order with status: ${status}`
  }

  /**
   * Get error message for invalid cancel attempt
   */
  static getCancelErrorMessage(status: SOStatus): string {
    if (status === 'cancelled') {
      return 'Order is already cancelled'
    }
    if (LOCKED_STATUSES.includes(status)) {
      return 'Cannot cancel order after picking has started. Please contact warehouse manager.'
    }
    return `Cannot cancel order with status: ${status}`
  }

  /**
   * Get error message for invalid confirm attempt
   */
  static getConfirmErrorMessage(status: SOStatus): string {
    if (status === 'cancelled') {
      return 'Cannot confirm a cancelled order'
    }
    if (!CONFIRMABLE_STATUSES.includes(status)) {
      return 'Order has already progressed beyond confirmed status'
    }
    return `Cannot confirm order with status: ${status}`
  }

  /**
   * Append status note to existing notes with timestamp
   * AC-8: Audit trail tracking
   * Format: [ACTION - timestamp] reason
   */
  static appendStatusNote(
    existingNotes: string | null,
    action: 'HOLD' | 'CANCELLED' | 'CONFIRMED',
    reason?: string
  ): string {
    if (!reason) {
      return existingNotes || ''
    }

    const timestamp = new Date().toISOString()
    const newNote = `[${action} - ${timestamp}] ${reason}`

    if (!existingNotes || existingNotes.trim() === '') {
      return newNote
    }

    return `${existingNotes}\n${newNote}`
  }

  /**
   * Hold sales order
   * AC-2: Put sales order on hold from draft/confirmed
   */
  static async holdOrder(
    orderId: string,
    input?: { reason?: string }
  ): Promise<SalesOrder> {
    const supabase = createClient()

    // Fetch current order
    const { data: order, error: fetchError } = await supabase
      .from('sales_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      throw new Error('Sales order not found')
    }

    const currentStatus = order.status as SOStatus

    // Validate transition
    if (!this.canHold(currentStatus)) {
      throw new Error(this.getHoldErrorMessage(currentStatus))
    }

    // Prepare update
    const updateData: {
      status: SOStatus
      updated_at: string
      notes?: string
    } = {
      status: 'on_hold',
      updated_at: new Date().toISOString(),
    }

    // Append reason to notes if provided
    if (input?.reason) {
      updateData.notes = this.appendStatusNote(order.notes, 'HOLD', input.reason)
    }

    // Update order
    const { data: updated, error: updateError } = await supabase
      .from('sales_orders')
      .update(updateData)
      .eq('id', orderId)
      .select('*')
      .single()

    if (updateError || !updated) {
      throw new Error('Failed to hold sales order')
    }

    return updated as SalesOrder
  }

  /**
   * Cancel sales order
   * AC-3: Cancel sales order with required reason
   */
  static async cancelOrder(
    orderId: string,
    input: { reason: string }
  ): Promise<SalesOrder> {
    const supabase = createClient()

    // Validate reason
    const reason = input.reason?.trim()
    if (!reason) {
      throw new Error('Cancel reason is required')
    }
    if (reason.length < 10) {
      throw new Error('Reason must be at least 10 characters')
    }

    // Fetch current order
    const { data: order, error: fetchError } = await supabase
      .from('sales_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      throw new Error('Sales order not found')
    }

    const currentStatus = order.status as SOStatus

    // Validate transition
    if (!this.canCancel(currentStatus)) {
      throw new Error(this.getCancelErrorMessage(currentStatus))
    }

    // Prepare update
    const updateData = {
      status: 'cancelled' as SOStatus,
      updated_at: new Date().toISOString(),
      notes: this.appendStatusNote(order.notes, 'CANCELLED', reason),
    }

    // Update order
    const { data: updated, error: updateError } = await supabase
      .from('sales_orders')
      .update(updateData)
      .eq('id', orderId)
      .select('*')
      .single()

    if (updateError || !updated) {
      throw new Error('Failed to cancel sales order')
    }

    return updated as SalesOrder
  }

  /**
   * Confirm sales order (or release from hold)
   * AC-4: Transition to confirmed status
   */
  static async confirmOrder(orderId: string): Promise<SalesOrder> {
    const supabase = createClient()

    // Fetch current order
    const { data: order, error: fetchError } = await supabase
      .from('sales_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      throw new Error('Sales order not found')
    }

    const currentStatus = order.status as SOStatus

    // Validate transition
    if (!this.canConfirm(currentStatus)) {
      throw new Error(this.getConfirmErrorMessage(currentStatus))
    }

    // Prepare update
    const now = new Date().toISOString()
    const updateData = {
      status: 'confirmed' as SOStatus,
      updated_at: now,
      confirmed_at: order.confirmed_at || now,
    }

    // Update order
    const { data: updated, error: updateError } = await supabase
      .from('sales_orders')
      .update(updateData)
      .eq('id', orderId)
      .select('*')
      .single()

    if (updateError || !updated) {
      throw new Error('Failed to confirm sales order')
    }

    return updated as SalesOrder
  }

  // ===========================================================================
  // Story 07.5: Clone and Import Methods
  // ===========================================================================

  /**
   * Clone a sales order with all its lines
   * Creates new SO with:
   * - New id and order_number
   * - Same customer_id, shipping_address_id
   * - order_date = today
   * - status = draft
   * - cleared customer_po, promised_ship_date, required_delivery_date
   * - allergen_validated = false
   * - lines renumbered sequentially (1, 2, 3...)
   * - all quantity fields reset to 0
   */
  static async cloneSalesOrder(soId: string): Promise<ClonedSalesOrder> {
    const supabase = createClient()

    // Fetch original SO
    const { data: sourceOrder, error: soError } = await supabase
      .from('sales_orders')
      .select(
        `
        id, org_id, order_number, customer_id, shipping_address_id,
        status, order_date, required_delivery_date, promised_ship_date,
        customer_po, notes, total_amount, allergen_validated, line_count,
        confirmed_at, shipped_at
      `
      )
      .eq('id', soId)
      .single()

    if (soError || !sourceOrder) {
      throw new Error('Sales order not found')
    }

    // Fetch original lines ordered by line_number
    const { data: sourceLines, error: linesError } = await supabase
      .from('sales_order_lines')
      .select(
        `
        id, line_number, product_id, quantity_ordered,
        quantity_allocated, quantity_picked, quantity_packed, quantity_shipped,
        unit_price, notes, requested_lot
      `
      )
      .eq('sales_order_id', soId)
      .order('line_number', { ascending: true })

    if (linesError) {
      throw new Error('Failed to fetch sales order lines')
    }

    // Generate new order number
    const newOrderNumber = await this.generateNextNumber(sourceOrder.org_id)

    // Calculate today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Calculate total from lines
    const lines = sourceLines || []
    const totalAmount = lines.reduce(
      (sum, line) => sum + line.quantity_ordered * line.unit_price,
      0
    )

    // Create cloned SO
    const { data: clonedOrder, error: createError } = await supabase
      .from('sales_orders')
      .insert({
        org_id: sourceOrder.org_id,
        order_number: newOrderNumber,
        customer_id: sourceOrder.customer_id,
        shipping_address_id: sourceOrder.shipping_address_id,
        status: 'draft',
        order_date: today,
        required_delivery_date: null,
        promised_ship_date: null,
        customer_po: null,
        notes: sourceOrder.notes,
        total_amount: Math.round(totalAmount * 100) / 100,
        line_count: lines.length,
        allergen_validated: false,
        confirmed_at: null,
        shipped_at: null,
      })
      .select()
      .single()

    if (createError || !clonedOrder) {
      throw new Error('Failed to clone sales order')
    }

    // Clone lines with renumbered line_numbers and reset quantities
    const clonedLines: ClonedSalesOrderLine[] = []

    for (let i = 0; i < lines.length; i++) {
      const sourceLine = lines[i]
      const newLineNumber = i + 1

      const { data: clonedLine, error: lineError } = await supabase
        .from('sales_order_lines')
        .insert({
          sales_order_id: clonedOrder.id,
          line_number: newLineNumber,
          product_id: sourceLine.product_id,
          quantity_ordered: sourceLine.quantity_ordered,
          quantity_allocated: 0,
          quantity_picked: 0,
          quantity_packed: 0,
          quantity_shipped: 0,
          unit_price: sourceLine.unit_price,
          notes: sourceLine.notes,
          requested_lot: sourceLine.requested_lot,
        })
        .select()
        .single()

      if (lineError || !clonedLine) {
        // Rollback: delete the cloned order if line creation fails
        await supabase.from('sales_orders').delete().eq('id', clonedOrder.id)
        throw new Error('Failed to clone sales order lines')
      }

      clonedLines.push({
        id: clonedLine.id,
        line_number: clonedLine.line_number,
        product_id: clonedLine.product_id,
        quantity_ordered: clonedLine.quantity_ordered,
        quantity_allocated: clonedLine.quantity_allocated,
        quantity_picked: clonedLine.quantity_picked,
        quantity_packed: clonedLine.quantity_packed,
        quantity_shipped: clonedLine.quantity_shipped,
        unit_price: clonedLine.unit_price,
        notes: clonedLine.notes,
        requested_lot: clonedLine.requested_lot,
      })
    }

    return {
      id: clonedOrder.id,
      org_id: clonedOrder.org_id,
      order_number: clonedOrder.order_number,
      customer_id: clonedOrder.customer_id,
      shipping_address_id: clonedOrder.shipping_address_id,
      status: clonedOrder.status,
      order_date: clonedOrder.order_date,
      required_delivery_date: clonedOrder.required_delivery_date,
      promised_ship_date: clonedOrder.promised_ship_date,
      customer_po: clonedOrder.customer_po,
      notes: clonedOrder.notes,
      total_amount: clonedOrder.total_amount,
      line_count: clonedOrder.line_count,
      allergen_validated: clonedOrder.allergen_validated,
      confirmed_at: clonedOrder.confirmed_at,
      shipped_at: clonedOrder.shipped_at,
      lines: clonedLines,
    }
  }

  /**
   * Import sales orders from CSV content
   * Parses CSV, validates rows, groups by customer, and prepares for creation
   */
  static async importSalesOrdersFromCSV(
    csvContent: string,
    orgId: string
  ): Promise<ImportCSVResult> {
    // Validate empty content
    if (!csvContent || csvContent.trim() === '') {
      throw new Error('CSV file is empty')
    }

    // Parse CSV
    const lines = csvContent.trim().split('\n')

    if (lines.length === 0) {
      throw new Error('CSV file is empty')
    }

    // Parse header
    const headerLine = lines[0].trim()
    const headers = headerLine.split(',').map((h) => h.trim().toLowerCase())

    // Check for required columns
    const requiredColumns = ['customer_code', 'product_code', 'quantity']
    const missingColumns = requiredColumns.filter((col) => !headers.includes(col))

    if (missingColumns.length > 0) {
      // Check if there's no header at all (first line looks like data)
      if (
        !headers.includes('customer_code') &&
        !headers.includes('product_code')
      ) {
        throw new Error('CSV must have header row')
      }
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`)
    }

    // Get column indices
    const colIndex = {
      customer_code: headers.indexOf('customer_code'),
      product_code: headers.indexOf('product_code'),
      quantity: headers.indexOf('quantity'),
      unit_price: headers.indexOf('unit_price'),
      customer_po: headers.indexOf('customer_po'),
      promised_ship_date: headers.indexOf('promised_ship_date'),
      required_delivery_date: headers.indexOf('required_delivery_date'),
      notes: headers.indexOf('notes'),
    }

    // Lookup caches
    const customerCache = new Map<string, { id: string; default_shipping_address_id: string | null }>()
    const productCache = new Map<string, { id: string; standard_price: number }>()

    const supabase = createClient()

    // Parse data rows
    const validatedRows: ValidatedCSVRow[] = []
    const errors: ImportError[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const rowNumber = i // 1-based, relative to data rows (header is row 0)
      const values = this.parseCSVLine(line)

      const row: RawCSVRow = {
        customer_code: values[colIndex.customer_code]?.trim() || '',
        product_code: values[colIndex.product_code]?.trim() || '',
        quantity: values[colIndex.quantity]?.trim() || '',
        unit_price: colIndex.unit_price >= 0 ? values[colIndex.unit_price]?.trim() || '' : '',
        customer_po:
          colIndex.customer_po >= 0
            ? values[colIndex.customer_po]?.trim() || null
            : null,
        promised_ship_date:
          colIndex.promised_ship_date >= 0
            ? values[colIndex.promised_ship_date]?.trim() || null
            : null,
        required_delivery_date:
          colIndex.required_delivery_date >= 0
            ? values[colIndex.required_delivery_date]?.trim() || null
            : null,
        notes:
          colIndex.notes >= 0 ? values[colIndex.notes]?.trim() || null : null,
      }

      // Validate required fields
      if (!row.customer_code) {
        validatedRows.push({
          rowNumber,
          valid: false,
          error: 'Customer code is required',
          ...row,
          quantity: 0,
          unit_price: 0,
        })
        errors.push({ row: rowNumber, error: 'Customer code is required' })
        continue
      }

      if (!row.product_code) {
        validatedRows.push({
          rowNumber,
          valid: false,
          error: 'Product code is required',
          ...row,
          quantity: 0,
          unit_price: 0,
        })
        errors.push({ row: rowNumber, error: 'Product code is required' })
        continue
      }

      // Parse and validate quantity
      const parsedQty = parseFloat(row.quantity)
      if (isNaN(parsedQty)) {
        validatedRows.push({
          rowNumber,
          valid: false,
          error: 'Quantity must be a number',
          ...row,
          quantity: 0,
          unit_price: 0,
        })
        errors.push({ row: rowNumber, error: 'Quantity must be a number' })
        continue
      }

      if (parsedQty <= 0) {
        validatedRows.push({
          rowNumber,
          valid: false,
          error: 'Quantity must be greater than zero',
          ...row,
          quantity: parsedQty,
          unit_price: 0,
        })
        errors.push({ row: rowNumber, error: 'Quantity must be greater than zero' })
        continue
      }

      // Parse and validate unit_price (if provided)
      let parsedPrice = 0
      if (row.unit_price) {
        parsedPrice = parseFloat(row.unit_price)
        if (isNaN(parsedPrice)) {
          validatedRows.push({
            rowNumber,
            valid: false,
            error: 'Unit price must be a number',
            ...row,
            quantity: parsedQty,
            unit_price: 0,
          })
          errors.push({ row: rowNumber, error: 'Unit price must be a number' })
          continue
        }
        if (parsedPrice < 0) {
          validatedRows.push({
            rowNumber,
            valid: false,
            error: 'Unit price cannot be negative',
            ...row,
            quantity: parsedQty,
            unit_price: parsedPrice,
          })
          errors.push({ row: rowNumber, error: 'Unit price cannot be negative' })
          continue
        }
      }

      // Validate date formats
      if (row.promised_ship_date && !this.isValidISODate(row.promised_ship_date)) {
        validatedRows.push({
          rowNumber,
          valid: false,
          error: 'Invalid date format (use YYYY-MM-DD)',
          ...row,
          quantity: parsedQty,
          unit_price: parsedPrice,
        })
        errors.push({ row: rowNumber, error: 'Invalid date format (use YYYY-MM-DD)' })
        continue
      }

      if (
        row.required_delivery_date &&
        !this.isValidISODate(row.required_delivery_date)
      ) {
        validatedRows.push({
          rowNumber,
          valid: false,
          error: 'Invalid date format (use YYYY-MM-DD)',
          ...row,
          quantity: parsedQty,
          unit_price: parsedPrice,
        })
        errors.push({
          row: rowNumber,
          error: 'Invalid date format (use YYYY-MM-DD)',
        })
        continue
      }

      // Lookup customer (with cache)
      let customer = customerCache.get(row.customer_code)
      if (!customer) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('id, default_shipping_address_id')
          .eq('code', row.customer_code)
          .eq('org_id', orgId)
          .single()

        if (!customerData) {
          validatedRows.push({
            rowNumber,
            valid: false,
            error: `Customer ${row.customer_code} not found`,
            ...row,
            quantity: parsedQty,
            unit_price: parsedPrice,
          })
          errors.push({
            row: rowNumber,
            customer_code: row.customer_code,
            error: `Customer ${row.customer_code} not found`,
          })
          continue
        }
        customer = {
          id: customerData.id,
          default_shipping_address_id: customerData.default_shipping_address_id,
        }
        customerCache.set(row.customer_code, customer)
      }

      // Lookup product (with cache)
      let product = productCache.get(row.product_code)
      if (!product) {
        const { data: productData } = await supabase
          .from('products')
          .select('id, std_price')
          .eq('code', row.product_code)
          .eq('org_id', orgId)
          .eq('is_finished_good', true)
          .single()

        if (!productData) {
          validatedRows.push({
            rowNumber,
            valid: false,
            error: `Product ${row.product_code} not found`,
            ...row,
            quantity: parsedQty,
            unit_price: parsedPrice,
          })
          errors.push({
            row: rowNumber,
            product_code: row.product_code,
            error: `Product ${row.product_code} not found`,
          })
          continue
        }
        product = {
          id: productData.id,
          standard_price: productData.std_price || 0,
        }
        productCache.set(row.product_code, product)
      }

      // Use product standard_price if unit_price not provided (empty string)
      // If unit_price is explicitly 0, keep it as 0 (free items)
      const finalPrice = row.unit_price !== '' ? parsedPrice : product.standard_price

      // Valid row
      validatedRows.push({
        rowNumber,
        valid: true,
        customer_code: row.customer_code,
        product_code: row.product_code,
        quantity: parsedQty,
        unit_price: finalPrice,
        customer_po: row.customer_po || null,
        promised_ship_date: row.promised_ship_date || null,
        required_delivery_date: row.required_delivery_date || null,
        notes: row.notes || null,
        resolvedCustomerId: customer.id,
        resolvedProductId: product.id,
        resolvedShippingAddressId: customer.default_shipping_address_id,
      })
    }

    // Group by customer_code
    const customerGroups: Record<string, ValidatedCSVRow[]> = {}
    const validRows = validatedRows.filter((r) => r.valid)

    for (const row of validRows) {
      if (!customerGroups[row.customer_code]) {
        customerGroups[row.customer_code] = []
      }
      customerGroups[row.customer_code].push(row)
    }

    const ordersToCreate = Object.keys(customerGroups).length
    const linesToCreate = validRows.length

    return {
      validatedRows,
      customerGroups,
      ordersToCreate,
      linesToCreate,
      validCount: validRows.length,
      invalidCount: validatedRows.filter((r) => !r.valid).length,
      errors,
      defaultValues: {
        status: 'draft' as const,
        allergen_validated: false,
        order_date: new Date().toISOString().split('T')[0],
      },
    }
  }

  /**
   * Parse a single CSV line, handling quoted fields with commas
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())

    return result
  }

  /**
   * Validate ISO date format YYYY-MM-DD
   */
  private static isValidISODate(dateStr: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(dateStr)) return false

    const date = new Date(dateStr)
    return !isNaN(date.getTime())
  }
}

// =============================================================================
// Types for Clone and Import (Story 07.5)
// =============================================================================

export interface ClonedSalesOrderLine {
  id: string
  line_number: number
  product_id: string
  quantity_ordered: number
  quantity_allocated: number
  quantity_picked: number
  quantity_packed: number
  quantity_shipped: number
  unit_price: number
  notes: string | null
  requested_lot?: string | null
}

export interface ClonedSalesOrder {
  id: string
  org_id: string
  order_number: string
  customer_id: string
  shipping_address_id: string | null
  status: string
  order_date: string
  required_delivery_date: string | null
  promised_ship_date: string | null
  customer_po: string | null
  notes: string | null
  total_amount: number
  line_count: number
  allergen_validated: boolean
  confirmed_at: string | null
  shipped_at: string | null
  lines: ClonedSalesOrderLine[]
}

interface RawCSVRow {
  customer_code: string
  product_code: string
  quantity: string
  unit_price: string
  customer_po: string | null
  promised_ship_date: string | null
  required_delivery_date: string | null
  notes: string | null
}

export interface ValidatedCSVRow {
  rowNumber: number
  valid: boolean
  error?: string
  customer_code: string
  product_code: string
  quantity: number
  unit_price: number
  customer_po: string | null
  promised_ship_date: string | null
  required_delivery_date?: string | null
  notes: string | null
  resolvedCustomerId?: string
  resolvedProductId?: string
  resolvedShippingAddressId?: string | null
}

export interface ImportError {
  row: number
  customer_code?: string
  product_code?: string
  error: string
}

export interface ImportCSVResult {
  validatedRows: ValidatedCSVRow[]
  customerGroups: Record<string, ValidatedCSVRow[]>
  ordersToCreate: number
  linesToCreate: number
  validCount: number
  invalidCount: number
  errors: ImportError[]
  defaultValues: {
    status: 'draft'
    allergen_validated: boolean
    order_date: string
  }
}

export default SalesOrderService
