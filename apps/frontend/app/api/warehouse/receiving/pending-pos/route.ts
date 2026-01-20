/**
 * API Route: GET /api/warehouse/receiving/pending-pos
 * Story: 05.11 - GRN from PO
 * Purpose: List Purchase Orders that can be received (status: approved, confirmed, partial)
 *
 * Query Parameters:
 * - search: string (PO number or supplier name)
 * - supplier_id: UUID
 * - warehouse_id: UUID
 * - date_from: string (YYYY-MM-DD)
 * - date_to: string (YYYY-MM-DD)
 * - sort: 'po_number' | 'expected_date' | 'created_at' | 'supplier_name'
 * - order: 'asc' | 'desc'
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 *
 * Response:
 * {
 *   purchase_orders: [{
 *     id, po_number, status, supplier_id, supplier_name,
 *     expected_date, warehouse_id, lines_count, total_value, created_at
 *   }]
 *   pagination: { page, limit, total, total_pages }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { receivablePOsQuerySchema } from '@/lib/validation/grn'

const RECEIVABLE_STATUSES = ['approved', 'confirmed', 'partial']

export async function GET(request: NextRequest) {
  try {
    // 1. Create Supabase client
    const supabase = await createClient()

    // 2. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 3. Parse query params
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = receivablePOsQuerySchema.safeParse(queryParams)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const {
      search,
      supplier_id,
      warehouse_id,
      date_from,
      date_to,
      sort,
      order,
      page,
      limit,
    } = validationResult.data

    // 4. Build query
    let query = supabase
      .from('purchase_orders')
      .select(`
        id,
        po_number,
        status,
        supplier_id,
        suppliers:supplier_id(name),
        expected_delivery_date,
        warehouse_id,
        warehouses:warehouse_id(name, code),
        created_at
      `, { count: 'exact' })
      .in('status', RECEIVABLE_STATUSES)

    // Apply filters
    if (search) {
      query = query.or(`po_number.ilike.%${search}%,suppliers.name.ilike.%${search}%`)
    }

    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id)
    }

    if (warehouse_id) {
      query = query.eq('warehouse_id', warehouse_id)
    }

    if (date_from) {
      query = query.gte('expected_delivery_date', date_from)
    }

    if (date_to) {
      query = query.lte('expected_delivery_date', date_to)
    }

    // Apply sorting
    const sortColumn = sort === 'supplier_name' ? 'suppliers(name)' : sort
    query = query.order(sortColumn, { ascending: order === 'asc' })

    // Apply pagination
    const start = (page - 1) * limit
    const end = start + limit - 1
    query = query.range(start, end)

    // 5. Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching pending POs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pending POs' },
        { status: 500 }
      )
    }

    // 6. Get line counts for each PO
    const poIds = (data || []).map((po: any) => po.id)
    let lineCounts: Record<string, number> = {}

    if (poIds.length > 0) {
      const { data: lineData } = await supabase
        .from('purchase_order_lines')
        .select('po_id')
        .in('po_id', poIds)

      if (lineData) {
        lineCounts = lineData.reduce((acc: Record<string, number>, line: any) => {
          acc[line.po_id] = (acc[line.po_id] || 0) + 1
          return acc
        }, {})
      }
    }

    // 7. Transform response
    const purchaseOrders = (data || []).map((po: any) => ({
      id: po.id,
      po_number: po.po_number,
      status: po.status,
      supplier_id: po.supplier_id,
      supplier_name: po.suppliers?.name || '',
      expected_date: po.expected_delivery_date,
      warehouse_id: po.warehouse_id,
      warehouse_name: po.warehouses?.name || '',
      warehouse_code: po.warehouses?.code || '',
      lines_count: lineCounts[po.id] || 0,
      created_at: po.created_at,
    }))

    return NextResponse.json({
      purchase_orders: purchaseOrders,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in pending POs endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
