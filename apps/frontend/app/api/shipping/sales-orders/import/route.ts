/**
 * API Route: Import Sales Orders from CSV
 * Story: 07.5 - SO Clone/Import
 *
 * POST /api/shipping/sales-orders/import - Import SOs from CSV file
 *
 * Auth: Required
 * Roles: sales, manager, admin, super_admin
 * Content-Type: multipart/form-data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { SalesOrderService } from '@/lib/services/sales-order-service'

// ============================================================================
// Constants
// ============================================================================

const IMPORT_ALLOWED_ROLES = ['admin', 'owner', 'super_admin', 'superadmin', 'manager', 'sales']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

// ============================================================================
// Helper Functions
// ============================================================================

function normalizeRole(roleData: unknown): string | null {
  if (typeof roleData === 'string') {
    return roleData.toLowerCase()
  }
  if (Array.isArray(roleData) && roleData.length > 0) {
    const first = roleData[0]
    if (typeof first === 'string') return first.toLowerCase()
    if (first && typeof first === 'object' && 'code' in first) {
      return (first as { code: string }).code.toLowerCase()
    }
  }
  if (roleData && typeof roleData === 'object' && 'code' in roleData) {
    return ((roleData as { code: string }).code ?? '').toLowerCase()
  }
  return null
}

// ============================================================================
// POST Handler
// ============================================================================

/**
 * POST /api/shipping/sales-orders/import
 * Import sales orders from a CSV file
 *
 * Request: multipart/form-data with 'file' field containing CSV
 *
 * Response:
 * - 200: Success with import summary
 * - 400: Validation error (empty file, invalid format, etc.)
 * - 401: Not authenticated
 * - 403: Insufficient permissions
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabase()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not logged in' } },
        { status: 401 }
      )
    }

    // Get user's org and role
    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'User not found' } },
        { status: 403 }
      )
    }

    const role = normalizeRole(userData.role)

    // Check role-based authorization
    if (!role || !IMPORT_ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to import orders',
          },
        },
        { status: 403 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' } },
        { status: 400 }
      )
    }

    // Validate file type
    const isCSV =
      file.type === 'text/csv' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.csv')
    if (!isCSV) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Only CSV files (.csv) are supported',
          },
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size must be <= 5 MB',
          },
        },
        { status: 400 }
      )
    }

    // Read file content
    const csvContent = await file.text()

    // Parse and validate CSV using service
    const parseResult = await SalesOrderService.importSalesOrdersFromCSV(
      csvContent,
      userData.org_id
    )

    // If no valid rows, return error summary
    if (parseResult.validCount === 0) {
      return NextResponse.json(
        {
          success: false,
          summary: {
            orders_created: 0,
            lines_imported: 0,
            rows_processed: parseResult.validatedRows.length,
            errors_count: parseResult.errors.length,
          },
          created_orders: [],
          errors: parseResult.errors.map((e) => ({
            row: e.row,
            customer_code: e.customer_code || null,
            product_code: e.product_code || null,
            error: e.error,
          })),
        },
        { status: 200 }
      )
    }

    // Create SOs from valid rows
    const createdOrders: Array<{
      id: string
      order_number: string
      customer_code: string
      customer_id: string
      lines_count: number
    }> = []

    const today = new Date().toISOString().split('T')[0]

    // Process each customer group
    for (const [customerCode, rows] of Object.entries(parseResult.customerGroups)) {
      if (rows.length === 0) continue

      const firstRow = rows[0]
      const customerId = firstRow.resolvedCustomerId!
      const shippingAddressId = firstRow.resolvedShippingAddressId || null

      // Generate order number
      const orderNumber = await SalesOrderService.generateNextNumber(userData.org_id)

      // Calculate total from lines
      const totalAmount = rows.reduce(
        (sum, row) => sum + row.quantity * row.unit_price,
        0
      )

      // Create SO
      const { data: newOrder, error: orderError } = await supabaseAdmin
        .from('sales_orders')
        .insert({
          org_id: userData.org_id,
          order_number: orderNumber,
          customer_id: customerId,
          shipping_address_id: shippingAddressId,
          status: 'draft',
          order_date: today,
          required_delivery_date: firstRow.required_delivery_date || null,
          promised_ship_date: firstRow.promised_ship_date || null,
          customer_po: firstRow.customer_po || null,
          notes: firstRow.notes || null,
          total_amount: Math.round(totalAmount * 100) / 100,
          line_count: rows.length,
          allergen_validated: false,
        })
        .select()
        .single()

      if (orderError || !newOrder) {
        console.error('Error creating SO:', orderError)
        continue
      }

      // Create lines
      let lineNumber = 1
      for (const row of rows) {
        const { error: lineError } = await supabaseAdmin
          .from('sales_order_lines')
          .insert({
            sales_order_id: newOrder.id,
            line_number: lineNumber,
            product_id: row.resolvedProductId!,
            quantity_ordered: row.quantity,
            quantity_allocated: 0,
            quantity_picked: 0,
            quantity_packed: 0,
            quantity_shipped: 0,
            unit_price: row.unit_price,
            notes: row.notes || null,
          })

        if (lineError) {
          console.error('Error creating SO line:', lineError)
        }
        lineNumber++
      }

      createdOrders.push({
        id: newOrder.id,
        order_number: newOrder.order_number,
        customer_code: customerCode,
        customer_id: customerId,
        lines_count: rows.length,
      })
    }

    // Build response
    return NextResponse.json({
      success: true,
      summary: {
        orders_created: createdOrders.length,
        lines_imported: parseResult.linesToCreate,
        rows_processed: parseResult.validatedRows.length,
        errors_count: parseResult.errors.length,
      },
      created_orders: createdOrders,
      createdOrderNumbers: createdOrders.map((o) => o.order_number),
      ordersCreated: createdOrders.length,
      linesImported: parseResult.linesToCreate,
      errorsCount: parseResult.errors.length,
      errors: parseResult.errors.map((e) => ({
        row: e.row,
        rowNumber: e.row,
        customer_code: e.customer_code || null,
        product_code: e.product_code || null,
        error: e.error,
        message: e.error,
      })),
    })
  } catch (error) {
    console.error('Error in POST /api/shipping/sales-orders/import:', error)

    const message =
      error instanceof Error ? error.message : 'Internal server error'

    // Handle specific error messages
    if (message === 'CSV file is empty') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message } },
        { status: 400 }
      )
    }

    if (message === 'CSV must have header row') {
      return NextResponse.json(
        { error: { code: 'INVALID_CSV_FORMAT', message } },
        { status: 400 }
      )
    }

    if (message.startsWith('Missing required columns')) {
      return NextResponse.json(
        { error: { code: 'INVALID_CSV_FORMAT', message } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: 'IMPORT_FAILED', message } },
      { status: 500 }
    )
  }
}
