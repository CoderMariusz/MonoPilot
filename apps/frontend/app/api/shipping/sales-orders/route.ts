/**
 * API Route: Sales Orders Management
 * Story 07.2: Sales Orders Core
 *
 * GET /api/shipping/sales-orders - List sales orders with filters and pagination
 * POST /api/shipping/sales-orders - Create new sales order with lines
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ZodError, z } from 'zod'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'
import { SalesOrderService } from '@/lib/services/sales-order-service'

// =============================================================================
// Validation Schemas
// =============================================================================

const salesOrderListParamsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(25),
  search: z.string().optional(),
  status: z.string().optional(),
  customer_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort: z.string().optional().default('order_date'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
})

const salesOrderLineSchema = z.object({
  product_id: z.string().uuid(),
  quantity_ordered: z.number().positive('Quantity must be greater than zero'),
  unit_price: z.number().nonnegative(),
  discount_type: z.enum(['percent', 'fixed']).nullable().optional(),
  discount_value: z.number().nullable().optional(),
  notes: z.string().optional(),
})

const createSalesOrderSchema = z.object({
  customer_id: z.string().uuid('Customer is required'),
  shipping_address_id: z.string().uuid().optional().nullable(),
  order_date: z.string(),
  required_delivery_date: z.string(),
  customer_po: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z.array(salesOrderLineSchema).optional(),
})

// =============================================================================
// GET /api/shipping/sales-orders
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      customer_id: searchParams.get('customer_id') ?? undefined,
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      order: searchParams.get('order') ?? undefined,
    }

    // Validate query parameters
    const validatedParams = salesOrderListParamsSchema.parse(queryParams)

    // Build query
    let query = supabase
      .from('sales_orders')
      .select(
        `
        id,
        org_id,
        order_number,
        customer_id,
        shipping_address_id,
        status,
        order_date,
        required_delivery_date,
        customer_po,
        notes,
        total_amount,
        line_count,
        allergen_validated,
        created_at,
        updated_at,
        confirmed_at,
        shipped_at,
        customer:customers!customer_id (
          id,
          name,
          code
        )
      `,
        { count: 'exact' }
      )
      .eq('org_id', authContext.orgId)

    // Apply search filter (order_number, customer name, customer PO)
    if (validatedParams.search) {
      const searchTerm = `%${validatedParams.search}%`
      query = query.or(
        `order_number.ilike.${searchTerm},customer_po.ilike.${searchTerm}`
      )
    }

    // Apply status filter
    if (validatedParams.status) {
      const statuses = validatedParams.status.split(',')
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0])
      } else {
        query = query.in('status', statuses)
      }
    }

    // Apply customer filter
    if (validatedParams.customer_id) {
      query = query.eq('customer_id', validatedParams.customer_id)
    }

    // Apply date range filters
    if (validatedParams.date_from) {
      query = query.gte('order_date', validatedParams.date_from)
    }
    if (validatedParams.date_to) {
      query = query.lte('order_date', validatedParams.date_to)
    }

    // Apply sorting
    const sortColumn = validatedParams.sort || 'order_date'
    const sortOrder = validatedParams.order === 'asc' ? true : false
    query = query.order(sortColumn, { ascending: sortOrder })

    // Apply pagination
    const page = validatedParams.page
    const limit = validatedParams.limit
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching sales orders:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch sales orders',
          },
          timestamp: new Date().toISOString(),
          path: '/api/shipping/sales-orders',
        },
        { status: 500 }
      )
    }

    // Transform data to match expected format
    const transformedData = (data || []).map((so: any) => ({
      ...so,
      customer_name: so.customer?.name || null,
      customer_code: so.customer?.code || null,
    }))

    return NextResponse.json({
      data: transformedData,
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/shipping/sales-orders:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: 'Invalid query parameters',
            details: error.errors,
          },
          timestamp: new Date().toISOString(),
          path: '/api/shipping/sales-orders',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        timestamp: new Date().toISOString(),
        path: '/api/shipping/sales-orders',
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/shipping/sales-orders
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    const originError = validateOrigin(request)
    if (originError) {
      return originError
    }

    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    // Check role permissions
    const allowedRoles = ['shipper', 'owner', 'admin', 'manager', 'sales', 'planner']
    const permissionError = checkPermission(authContext, allowedRoles)
    if (permissionError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
          timestamp: new Date().toISOString(),
          path: '/api/shipping/sales-orders',
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createSalesOrderSchema.parse(body)

    // Validate date relationship
    if (!SalesOrderService.validateSODates(validatedData.order_date, validatedData.required_delivery_date)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Delivery date must be >= order date',
          },
          timestamp: new Date().toISOString(),
          path: '/api/shipping/sales-orders',
        },
        { status: 400 }
      )
    }

    // Verify customer exists and belongs to org
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', validatedData.customer_id)
      .eq('org_id', authContext.orgId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found',
          },
          timestamp: new Date().toISOString(),
          path: '/api/shipping/sales-orders',
        },
        { status: 400 }
      )
    }

    // Generate order number
    const orderNumber = await SalesOrderService.generateNextNumber(authContext.orgId)

    // Calculate total from lines
    const lines = validatedData.lines || []
    const totalAmount = SalesOrderService.calculateOrderTotal(lines)

    // Create sales order
    const { data: salesOrder, error: createError } = await supabase
      .from('sales_orders')
      .insert({
        org_id: authContext.orgId,
        order_number: orderNumber,
        customer_id: validatedData.customer_id,
        shipping_address_id: validatedData.shipping_address_id || null,
        status: 'draft',
        order_date: validatedData.order_date,
        required_delivery_date: validatedData.required_delivery_date,
        customer_po: validatedData.customer_po || null,
        notes: validatedData.notes || null,
        total_amount: totalAmount,
        line_count: lines.length,
        allergen_validated: false,
      })
      .select()
      .single()

    if (createError || !salesOrder) {
      console.error('Error creating sales order:', createError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CREATE_FAILED',
            message: 'Failed to create sales order',
          },
          timestamp: new Date().toISOString(),
          path: '/api/shipping/sales-orders',
        },
        { status: 500 }
      )
    }

    // Create lines if provided
    const createdLines = []
    if (lines.length > 0) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const lineNumber = i + 1

        // Calculate line total
        const discount = line.discount_type && line.discount_value != null
          ? { type: line.discount_type, value: line.discount_value }
          : null
        const lineTotal = SalesOrderService.calculateLineTotal(
          line.quantity_ordered,
          line.unit_price,
          discount
        )

        const { data: createdLine, error: lineError } = await supabase
          .from('sales_order_lines')
          .insert({
            sales_order_id: salesOrder.id,
            line_number: lineNumber,
            product_id: line.product_id,
            quantity_ordered: line.quantity_ordered,
            quantity_allocated: 0,
            quantity_picked: 0,
            quantity_packed: 0,
            quantity_shipped: 0,
            unit_price: line.unit_price,
            discount_type: line.discount_type || null,
            discount_value: line.discount_value || null,
            line_total: lineTotal,
            notes: line.notes || null,
          })
          .select()
          .single()

        if (lineError) {
          console.error('Error creating sales order line:', lineError)
          // Continue with other lines, don't fail entire request
        } else if (createdLine) {
          createdLines.push(createdLine)
        }
      }
    }

    return NextResponse.json(
      {
        ...salesOrder,
        customer_name: customer.name,
        lines: createdLines,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/shipping/sales-orders:', error instanceof Error ? error.message : 'Unknown error')

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
          timestamp: new Date().toISOString(),
          path: '/api/shipping/sales-orders',
        },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('Organization not found') || errorMessage.includes('User not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized',
          },
          timestamp: new Date().toISOString(),
          path: '/api/shipping/sales-orders',
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        timestamp: new Date().toISOString(),
        path: '/api/shipping/sales-orders',
      },
      { status: 500 }
    )
  }
}
