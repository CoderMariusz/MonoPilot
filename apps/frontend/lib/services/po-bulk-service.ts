/**
 * PO Bulk Service
 * Story: 03.6 - PO Bulk Operations
 *
 * Service for bulk PO operations including:
 * - Bulk PO creation from product list
 * - Import file parsing and validation
 * - Import execution with transaction safety
 * - Export to Excel with 3 sheets
 * - Bulk status updates
 *
 * Business Rules:
 * - Auto-grouping by default supplier (supplier_products.is_default = true)
 * - Pricing cascade: import price -> supplier_products.unit_price -> products.std_price
 * - Transaction per supplier group (partial success allowed)
 * - Limits: 500 rows import, 5MB file, 1000 POs export, 100 POs bulk update
 *
 * @module po-bulk-service
 */

import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import { generatePONumber } from '../utils/po-number-generator'
import {
  ExcelService,
  PO_IMPORT_HEADER_MAP,
  PO_IMPORT_REQUIRED_COLUMNS,
} from './excel-service'
import type {
  BulkPOImportRow,
  BulkCreatePORequest,
  BulkCreatePOResult,
  ImportValidationResult,
  BulkStatusUpdateResult,
  BulkAction,
  POExportFilters,
  ParsedImportData,
} from '../validation/po-bulk-schemas'

/**
 * Import options for bulk PO creation
 */
export interface ImportOptions {
  default_warehouse_id?: string | null
  default_expected_delivery?: string | null
}

/**
 * Result of grouping products by supplier
 */
interface SupplierGroup {
  supplier_id: string
  supplier_name: string
  supplier_code: string
  currency: string
  tax_code_id: string | null
  payment_terms: string | null
  products: Array<{
    product_id: string
    product_code: string
    product_name: string
    quantity: number
    uom: string
    unit_price: number
    expected_delivery: string | null
    notes: string | null
  }>
}

/**
 * Valid status transitions for bulk actions
 */
const BULK_ACTION_TRANSITIONS: Record<BulkAction, string[]> = {
  approve: ['pending_approval', 'submitted'],
  reject: ['pending_approval', 'submitted'],
  cancel: ['draft', 'submitted', 'pending_approval', 'approved', 'confirmed'],
  confirm: ['approved'],
}

/**
 * Target status for each bulk action
 */
const BULK_ACTION_TARGET_STATUS: Record<BulkAction, string> = {
  approve: 'approved',
  reject: 'cancelled',
  cancel: 'cancelled',
  confirm: 'confirmed',
}

/**
 * PO Bulk Service class
 * Handles all bulk PO operations
 */
export class POBulkService {
  /**
   * Get current user's org_id from JWT
   */
  private static async getCurrentOrgId(): Promise<string | null> {
    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    return userData?.org_id || null
  }

  /**
   * Get current user info
   */
  private static async getCurrentUser(): Promise<{
    id: string
    org_id: string
  } | null> {
    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!userData) return null

    return {
      id: user.id,
      org_id: userData.org_id,
    }
  }

  /**
   * Bulk create POs from a list of products.
   * Groups products by default supplier and creates one PO per supplier.
   *
   * AC-01: Bulk PO Creation from Product List
   * AC-07: Service Layer Methods
   *
   * @param data - Bulk create request with products array
   * @returns Promise<BulkCreatePOResult>
   */
  static async bulkCreatePOs(data: BulkCreatePORequest): Promise<BulkCreatePOResult> {
    const user = await this.getCurrentUser()
    if (!user) {
      throw new Error('UNAUTHORIZED')
    }

    const supabase = createServerSupabaseAdmin()
    const errors: Array<{ product_code: string; error: string }> = []
    const posCreated: BulkCreatePOResult['pos_created'] = []

    // Step 1: Lookup all products and their default suppliers
    const productCodes = data.products.map((p) => p.product_code)

    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, code, name, base_uom, std_price')
      .eq('org_id', user.org_id)
      .in('code', productCodes)

    if (productError) {
      console.error('Error fetching products:', productError)
      throw new Error('DATABASE_ERROR')
    }

    // Create product lookup map
    const productMap = new Map<
      string,
      { id: string; code: string; name: string; uom: string; std_price: number }
    >()
    for (const p of products || []) {
      productMap.set(p.code, {
        id: p.id,
        code: p.code,
        name: p.name,
        uom: p.base_uom,
        std_price: p.std_price || 0,
      })
    }

    // Step 2: Get default suppliers for all products
    const productIds = (products || []).map((p) => p.id)

    const { data: supplierProducts } = await supabase
      .from('supplier_products')
      .select(
        `
        product_id,
        supplier_id,
        unit_price,
        suppliers (
          id,
          code,
          name,
          currency,
          tax_code_id,
          payment_terms
        )
      `
      )
      .in('product_id', productIds)
      .eq('is_default', true)

    // Create default supplier lookup map
    const defaultSupplierMap = new Map<
      string,
      {
        supplier_id: string
        supplier_code: string
        supplier_name: string
        currency: string
        tax_code_id: string | null
        payment_terms: string | null
        unit_price: number | null
      }
    >()

    for (const sp of supplierProducts || []) {
      const supplier = sp.suppliers as any
      if (supplier) {
        defaultSupplierMap.set(sp.product_id, {
          supplier_id: sp.supplier_id,
          supplier_code: supplier.code,
          supplier_name: supplier.name,
          currency: supplier.currency || 'PLN',
          tax_code_id: supplier.tax_code_id,
          payment_terms: supplier.payment_terms,
          unit_price: sp.unit_price,
        })
      }
    }

    // Step 3: Group products by supplier
    const supplierGroups = new Map<string, SupplierGroup>()

    for (const item of data.products) {
      const product = productMap.get(item.product_code)

      if (!product) {
        errors.push({
          product_code: item.product_code,
          error: `Product not found: ${item.product_code}`,
        })
        continue
      }

      const defaultSupplier = defaultSupplierMap.get(product.id)

      if (!defaultSupplier) {
        errors.push({
          product_code: item.product_code,
          error: `Product ${item.product_code} has no default supplier assigned`,
        })
        continue
      }

      // Pricing cascade: import price -> supplier_products.unit_price -> products.std_price
      const unitPrice =
        item.unit_price ?? defaultSupplier.unit_price ?? product.std_price

      // Get or create supplier group
      if (!supplierGroups.has(defaultSupplier.supplier_id)) {
        supplierGroups.set(defaultSupplier.supplier_id, {
          supplier_id: defaultSupplier.supplier_id,
          supplier_name: defaultSupplier.supplier_name,
          supplier_code: defaultSupplier.supplier_code,
          currency: defaultSupplier.currency,
          tax_code_id: defaultSupplier.tax_code_id,
          payment_terms: defaultSupplier.payment_terms,
          products: [],
        })
      }

      const group = supplierGroups.get(defaultSupplier.supplier_id)!
      group.products.push({
        product_id: product.id,
        product_code: product.code,
        product_name: product.name,
        quantity: item.quantity,
        uom: product.uom,
        unit_price: unitPrice,
        expected_delivery:
          item.expected_delivery || data.default_expected_delivery || null,
        notes: item.notes || null,
      })
    }

    // Step 4: Get default warehouse
    let warehouseId = data.default_warehouse_id
    if (!warehouseId) {
      // Get first active warehouse as default
      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id')
        .eq('org_id', user.org_id)
        .eq('is_active', true)
        .limit(1)

      warehouseId = warehouses?.[0]?.id
    }

    if (!warehouseId) {
      throw new Error('NO_WAREHOUSE')
    }

    // Step 5: Create POs for each supplier group (transaction per group)
    const supplierGroupValues = Array.from(supplierGroups.values())
    for (const group of supplierGroupValues) {
      try {
        // Generate PO number
        const poNumber = await generatePONumber(user.org_id)

        // Calculate totals
        let subtotal = 0
        for (const product of group.products) {
          subtotal += product.quantity * product.unit_price
        }

        // Get tax rate
        let taxRate = 0
        if (group.tax_code_id) {
          const { data: taxCode } = await supabase
            .from('tax_codes')
            .select('rate')
            .eq('id', group.tax_code_id)
            .single()
          taxRate = taxCode?.rate || 0
        }

        const taxAmount = subtotal * (taxRate / 100)
        const total = subtotal + taxAmount

        // Create PO header
        const { data: po, error: poError } = await supabase
          .from('purchase_orders')
          .insert({
            org_id: user.org_id,
            po_number: poNumber,
            supplier_id: group.supplier_id,
            warehouse_id: warehouseId,
            currency: group.currency,
            tax_code_id: group.tax_code_id,
            payment_terms: group.payment_terms,
            status: 'draft',
            subtotal: Number(subtotal.toFixed(2)),
            tax_amount: Number(taxAmount.toFixed(2)),
            total: Number(total.toFixed(2)),
            expected_delivery_date:
              group.products[0]?.expected_delivery ||
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0],
            created_by: user.id,
            updated_by: user.id,
          })
          .select()
          .single()

        if (poError) {
          console.error('Error creating PO:', poError)
          // Add all products from this group to errors
          for (const product of group.products) {
            errors.push({
              product_code: product.product_code,
              error: `Failed to create PO for supplier ${group.supplier_name}`,
            })
          }
          continue
        }

        // Create PO lines (no org_id - purchase_order_lines uses po_id FK for RLS)
        const poLines = group.products.map((product, index) => ({
          po_id: po.id,
          product_id: product.product_id,
          line_number: index + 1,
          quantity: product.quantity,
          uom: product.uom,
          unit_price: product.unit_price,
          discount_percent: 0,
          discount_amount: 0,
          line_total: Number((product.quantity * product.unit_price).toFixed(2)),
          expected_delivery_date: product.expected_delivery,
          notes: product.notes,
        }))

        const { error: linesError } = await supabase
          .from('purchase_order_lines')
          .insert(poLines)

        if (linesError) {
          console.error('Error creating PO lines:', linesError)
          // Rollback: delete the PO
          await supabase.from('purchase_orders').delete().eq('id', po.id)
          for (const product of group.products) {
            errors.push({
              product_code: product.product_code,
              error: `Failed to create PO lines for supplier ${group.supplier_name}`,
            })
          }
          continue
        }

        // Success!
        posCreated.push({
          po_id: po.id,
          po_number: poNumber,
          supplier_id: group.supplier_id,
          supplier_name: group.supplier_name,
          line_count: group.products.length,
          total: Number(total.toFixed(2)),
        })
      } catch (error) {
        console.error('Error in supplier group transaction:', error)
        for (const product of group.products) {
          errors.push({
            product_code: product.product_code,
            error: `Transaction failed for supplier ${group.supplier_name}`,
          })
        }
      }
    }

    // Calculate totals
    const totalLines = posCreated.reduce((sum, po) => sum + po.line_count, 0)
    const totalValue = posCreated.reduce((sum, po) => sum + po.total, 0)

    return {
      success: errors.length === 0,
      pos_created: posCreated,
      errors,
      total_lines: totalLines,
      total_value: Number(totalValue.toFixed(2)),
    }
  }

  /**
   * Parse an import file (Excel/CSV) into structured row data.
   *
   * AC-02: Excel/CSV Import with Validation
   *
   * @param file - File object to parse
   * @returns Promise<ParsedImportData>
   */
  static async parseImportFile(file: File): Promise<ParsedImportData> {
    const rawData = await ExcelService.parseFile(file)

    if (!rawData || rawData.length < 2) {
      throw new Error('EMPTY_FILE')
    }

    const headers = ExcelService.extractHeaders(rawData)

    // Validate required columns
    const validation = ExcelService.validateRequiredColumns(
      headers,
      PO_IMPORT_REQUIRED_COLUMNS
    )

    if (!validation.valid) {
      throw new Error(`MISSING_COLUMNS:${validation.missing.join(',')}`)
    }

    // Map to standard field names
    const mappedRows = rawData.slice(1).map((row) => {
      const obj: Record<string, unknown> = {}

      headers.forEach((header, index) => {
        const mappedKey = PO_IMPORT_HEADER_MAP[header] || header
        obj[mappedKey] = row[index] ?? null
      })

      return obj
    })

    // Convert to BulkPOImportRow format
    const rows: BulkPOImportRow[] = mappedRows.map((row) => ({
      product_code: String(row.product_code || ''),
      quantity: Number(row.quantity) || 0,
      expected_delivery: row.expected_delivery
        ? String(row.expected_delivery)
        : undefined,
      unit_price: row.unit_price ? Number(row.unit_price) : undefined,
      notes: row.notes ? String(row.notes) : undefined,
      warehouse_code: row.warehouse_code
        ? String(row.warehouse_code)
        : undefined,
    }))

    return {
      rows,
      headers,
      raw_data: rawData,
    }
  }

  /**
   * Parse import file from buffer (for API routes).
   *
   * @param buffer - File buffer
   * @param filename - Original filename
   * @returns ParsedImportData
   */
  static parseImportBuffer(
    buffer: ArrayBuffer | Buffer,
    filename: string
  ): ParsedImportData {
    const rawData = ExcelService.parseBuffer(buffer, filename)

    if (!rawData || rawData.length < 2) {
      throw new Error('EMPTY_FILE')
    }

    const headers = ExcelService.extractHeaders(rawData)

    const validation = ExcelService.validateRequiredColumns(
      headers,
      PO_IMPORT_REQUIRED_COLUMNS
    )

    if (!validation.valid) {
      throw new Error(`MISSING_COLUMNS:${validation.missing.join(',')}`)
    }

    const mappedRows = rawData.slice(1).map((row) => {
      const obj: Record<string, unknown> = {}

      headers.forEach((header, index) => {
        const mappedKey = PO_IMPORT_HEADER_MAP[header] || header
        obj[mappedKey] = row[index] ?? null
      })

      return obj
    })

    const rows: BulkPOImportRow[] = mappedRows.map((row) => ({
      product_code: String(row.product_code || ''),
      quantity: Number(row.quantity) || 0,
      expected_delivery: row.expected_delivery
        ? String(row.expected_delivery)
        : undefined,
      unit_price: row.unit_price ? Number(row.unit_price) : undefined,
      notes: row.notes ? String(row.notes) : undefined,
      warehouse_code: row.warehouse_code
        ? String(row.warehouse_code)
        : undefined,
    }))

    return {
      rows,
      headers,
      raw_data: rawData,
    }
  }

  /**
   * Validate import data against products and suppliers.
   *
   * AC-02: Excel/CSV Import with Validation
   *
   * @param rows - Parsed import rows
   * @returns Promise<ImportValidationResult>
   */
  static async validateImportData(
    rows: BulkPOImportRow[]
  ): Promise<ImportValidationResult> {
    const orgId = await this.getCurrentOrgId()
    if (!orgId) {
      throw new Error('UNAUTHORIZED')
    }

    const supabase = createServerSupabaseAdmin()
    const preview: ImportValidationResult['preview'] = []
    let validRows = 0
    let errorRows = 0

    // Get all product codes
    const productCodes = rows.map((r) => r.product_code)

    // Lookup products
    const { data: products } = await supabase
      .from('products')
      .select('id, code, name')
      .eq('org_id', orgId)
      .in('code', productCodes)

    const productMap = new Map<string, { id: string; code: string; name: string }>()
    for (const p of products || []) {
      productMap.set(p.code, p)
    }

    // Lookup default suppliers
    const productIds = (products || []).map((p) => p.id)
    const { data: supplierProducts } = await supabase
      .from('supplier_products')
      .select(
        `
        product_id,
        suppliers (name)
      `
      )
      .in('product_id', productIds)
      .eq('is_default', true)

    const supplierMap = new Map<string, string>()
    for (const sp of supplierProducts || []) {
      const supplier = sp.suppliers as any
      supplierMap.set(sp.product_id, supplier?.name || 'Unknown')
    }

    // Validate each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowErrors: string[] = []
      const rowWarnings: string[] = []

      // Check product exists
      const product = productMap.get(row.product_code)
      if (!product) {
        rowErrors.push(`Product not found: ${row.product_code}`)
      }

      // Check quantity
      if (!row.quantity || row.quantity <= 0) {
        rowErrors.push('Quantity must be positive')
      }
      if (row.quantity > 999999.99) {
        rowErrors.push('Quantity exceeds maximum (999,999.99)')
      }

      // Check default supplier
      let supplierName: string | null = null
      if (product) {
        supplierName = supplierMap.get(product.id) || null
        if (!supplierName) {
          rowErrors.push(`Product ${row.product_code} has no default supplier`)
        }
      }

      // Check unit price
      if (row.unit_price !== undefined && row.unit_price !== null && row.unit_price < 0) {
        rowErrors.push('Unit price cannot be negative')
      }

      // Check date format
      if (row.expected_delivery) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(row.expected_delivery)) {
          rowErrors.push('Invalid date format (expected YYYY-MM-DD)')
        }
      }

      if (rowErrors.length > 0) {
        errorRows++
      } else {
        validRows++
      }

      // Add to preview (limit to first 50)
      if (preview.length < 50) {
        preview.push({
          row_number: i + 2, // +2 for header row and 1-based indexing
          product_code: row.product_code,
          product_name: product?.name || null,
          quantity: row.quantity,
          supplier_name: supplierName,
          expected_delivery: row.expected_delivery || null,
          unit_price: row.unit_price || null,
          errors: rowErrors,
          warnings: rowWarnings,
        })
      }
    }

    return {
      valid_rows: validRows,
      error_rows: errorRows,
      preview,
    }
  }

  /**
   * Execute import by creating POs from validated rows.
   *
   * AC-02, AC-06: Import Execution with Transaction Safety
   *
   * @param rows - Validated import rows
   * @param options - Import options (default warehouse, etc.)
   * @returns Promise<BulkCreatePOResult>
   */
  static async executeImport(
    rows: BulkPOImportRow[],
    options?: ImportOptions
  ): Promise<BulkCreatePOResult> {
    return this.bulkCreatePOs({
      products: rows,
      default_warehouse_id: options?.default_warehouse_id,
      default_expected_delivery: options?.default_expected_delivery,
    })
  }

  /**
   * Export POs to Excel with 3 sheets.
   *
   * AC-04: Excel Export (3 Sheets)
   *
   * @param poIds - Optional array of PO IDs to export
   * @param filters - Optional filters if poIds not provided
   * @returns Promise<Buffer> - Excel file buffer
   */
  static async exportPOsToExcel(
    poIds?: string[],
    filters?: POExportFilters
  ): Promise<Buffer> {
    const orgId = await this.getCurrentOrgId()
    if (!orgId) {
      throw new Error('UNAUTHORIZED')
    }

    const supabase = createServerSupabaseAdmin()

    // Build query
    let query = supabase
      .from('purchase_orders')
      .select(
        `
        *,
        suppliers (id, code, name),
        warehouses (id, code, name),
        po_lines (
          id,
          sequence,
          quantity,
          uom,
          unit_price,
          discount_percent,
          line_total,
          expected_delivery_date,
          products (id, code, name)
        )
      `
      )
      .eq('org_id', orgId)
      .order('po_number', { ascending: false })
      .limit(1000)

    // Apply filters
    if (poIds && poIds.length > 0) {
      query = query.in('id', poIds)
    } else if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id)
      }
      if (filters.date_from) {
        query = query.gte('expected_delivery_date', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('expected_delivery_date', filters.date_to)
      }
    }

    const { data: pos, error } = await query

    if (error) {
      console.error('Error fetching POs for export:', error)
      throw new Error('DATABASE_ERROR')
    }

    if (!pos || pos.length === 0) {
      throw new Error('NO_DATA')
    }

    if (pos.length > 1000) {
      throw new Error('EXPORT_LIMIT_EXCEEDED')
    }

    // Create workbook with 3 sheets
    const workbook = ExcelService.createWorkbook()

    // Sheet 1: Summary
    const summaryData: Record<string, unknown>[] = pos.map((po) => ({
      'PO Number': po.po_number,
      'Status': po.status,
      'Supplier Code': (po.suppliers as any)?.code || '',
      'Supplier Name': (po.suppliers as any)?.name || '',
      'Warehouse': (po.warehouses as any)?.name || '',
      'Expected Delivery': po.expected_delivery_date,
      'Currency': po.currency,
      'Subtotal': po.subtotal,
      'Tax Amount': po.tax_amount,
      'Total': po.total,
      'Lines Count': (po.po_lines as any[])?.length || 0,
      'Payment Terms': po.payment_terms || '',
      'Created At': po.created_at,
    }))

    ExcelService.addSheetFromJSON(workbook, 'Summary', summaryData)

    // Sheet 2: Lines
    const linesData: Record<string, unknown>[] = []
    for (const po of pos) {
      const lines = po.po_lines as any[] || []
      for (const line of lines) {
        linesData.push({
          'PO Number': po.po_number,
          'Supplier': (po.suppliers as any)?.name || '',
          'Line #': line.sequence,
          'Product Code': line.products?.code || '',
          'Product Name': line.products?.name || '',
          'Quantity': line.quantity,
          'UOM': line.uom,
          'Unit Price': line.unit_price,
          'Discount %': line.discount_percent,
          'Line Total': line.line_total,
          'Expected Delivery': line.expected_delivery_date,
        })
      }
    }

    ExcelService.addSheetFromJSON(workbook, 'Lines', linesData)

    // Sheet 3: Metadata
    const metadataData = [
      { Field: 'Export Date', Value: new Date().toISOString() },
      { Field: 'Total POs', Value: pos.length },
      { Field: 'Total Lines', Value: linesData.length },
      {
        Field: 'Total Value',
        Value: pos.reduce((sum, po) => sum + (po.total || 0), 0).toFixed(2),
      },
      { Field: 'Filters Applied', Value: JSON.stringify(filters || {}) },
    ]

    ExcelService.addSheetFromJSON(workbook, 'Metadata', metadataData)

    return ExcelService.workbookToBuffer(workbook)
  }

  /**
   * Update status of multiple POs.
   *
   * AC-05: Bulk Status Update
   *
   * @param poIds - Array of PO IDs to update
   * @param action - Action to perform (approve, reject, cancel, confirm)
   * @param reason - Optional reason for the action
   * @returns Promise<BulkStatusUpdateResult>
   */
  static async bulkUpdateStatus(
    poIds: string[],
    action: BulkAction,
    reason?: string
  ): Promise<BulkStatusUpdateResult> {
    const user = await this.getCurrentUser()
    if (!user) {
      throw new Error('UNAUTHORIZED')
    }

    const supabase = createServerSupabaseAdmin()
    const results: BulkStatusUpdateResult['results'] = []
    let successCount = 0
    let errorCount = 0

    // Get all POs
    const { data: pos, error } = await supabase
      .from('purchase_orders')
      .select('id, po_number, status, org_id')
      .eq('org_id', user.org_id)
      .in('id', poIds)

    if (error) {
      console.error('Error fetching POs for bulk update:', error)
      throw new Error('DATABASE_ERROR')
    }

    const validFromStatuses = BULK_ACTION_TRANSITIONS[action]
    const targetStatus = BULK_ACTION_TARGET_STATUS[action]

    for (const po of pos || []) {
      // Check if status transition is valid
      if (!validFromStatuses.includes(po.status)) {
        results.push({
          po_id: po.id,
          po_number: po.po_number,
          error: `Cannot ${action} PO in status: ${po.status}`,
        })
        errorCount++
        continue
      }

      // For cancel action, check if PO has receipts
      if (action === 'cancel') {
        const { count } = await supabase
          .from('grn')
          .select('*', { count: 'exact', head: true })
          .eq('po_id', po.id)

        if (count && count > 0) {
          results.push({
            po_id: po.id,
            po_number: po.po_number,
            error: 'Cannot cancel PO with receipts',
          })
          errorCount++
          continue
        }
      }

      // Update status
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({
          status: targetStatus,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
          ...(reason && { notes: reason }),
        })
        .eq('id', po.id)

      if (updateError) {
        results.push({
          po_id: po.id,
          po_number: po.po_number,
          error: updateError.message,
        })
        errorCount++
      } else {
        results.push({
          po_id: po.id,
          po_number: po.po_number,
          status: targetStatus,
        })
        successCount++
      }
    }

    return {
      success_count: successCount,
      error_count: errorCount,
      results,
    }
  }

  /**
   * Validate which POs can transition to target status.
   *
   * @param poIds - Array of PO IDs to check
   * @param action - Action to validate
   * @returns Promise<{ valid: string[], invalid: Array<{id: string, reason: string}> }>
   */
  static async validateBulkStatusChange(
    poIds: string[],
    action: BulkAction
  ): Promise<{
    valid: string[]
    invalid: Array<{ id: string; po_number: string; reason: string }>
  }> {
    const orgId = await this.getCurrentOrgId()
    if (!orgId) {
      throw new Error('UNAUTHORIZED')
    }

    const supabase = createServerSupabaseAdmin()

    const { data: pos } = await supabase
      .from('purchase_orders')
      .select('id, po_number, status')
      .eq('org_id', orgId)
      .in('id', poIds)

    const validFromStatuses = BULK_ACTION_TRANSITIONS[action]
    const valid: string[] = []
    const invalid: Array<{ id: string; po_number: string; reason: string }> = []

    for (const po of pos || []) {
      if (!validFromStatuses.includes(po.status)) {
        invalid.push({
          id: po.id,
          po_number: po.po_number,
          reason: `Cannot ${action} PO in status: ${po.status}`,
        })
      } else {
        valid.push(po.id)
      }
    }

    return { valid, invalid }
  }
}
