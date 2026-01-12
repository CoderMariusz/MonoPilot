/**
 * API Route: GET /api/warehouse/receiving/pending-tos
 * Story: 05.12 - GRN from TO
 * Purpose: List Transfer Orders available for receiving (status = shipped or partial)
 *
 * Query Parameters:
 * - warehouse_id?: string (UUID) - filter by destination warehouse
 * - search?: string - search by TO number
 * - date_from?: string (YYYY-MM-DD) - filter by ship date
 * - date_to?: string (YYYY-MM-DD) - filter by ship date
 * - sort?: 'to_number' | 'actual_ship_date' | 'planned_receive_date' | 'created_at'
 * - order?: 'asc' | 'desc'
 * - page?: number
 * - limit?: number
 *
 * Response (200):
 * {
 *   data: [{
 *     id, to_number, status, from_warehouse_id, from_warehouse_name,
 *     to_warehouse_id, to_warehouse_name, actual_ship_date, planned_receive_date,
 *     lines_count, items_shipped, items_received
 *   }],
 *   pagination: { page, limit, total, total_pages }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { receivableTOsQuerySchema } from '@/lib/validation/grn'

export async function GET(request: NextRequest) {
  try {
    // 1. Create Supabase client
    const supabase = await createServerSupabase()

    // 2. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 3. Get user's org_id
    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!userData?.org_id) {
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 401 }
      )
    }

    // 4. Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryResult = receivableTOsQuerySchema.safeParse({
      search: searchParams.get('search') || undefined,
      warehouse_id: searchParams.get('warehouse_id') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      sort: searchParams.get('sort') || undefined,
      order: searchParams.get('order') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { search, warehouse_id, date_from, date_to, sort, order, page, limit } = queryResult.data

    // 5. Build query for count
    let countQuery = supabase
      .from('transfer_orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['shipped', 'partial'])

    // 6. Build query for data
    let dataQuery = supabase
      .from('transfer_orders')
      .select(`
        id,
        to_number,
        status,
        from_warehouse_id,
        from_warehouse:warehouses!transfer_orders_from_warehouse_id_fkey(name, code),
        to_warehouse_id,
        to_warehouse:warehouses!transfer_orders_to_warehouse_id_fkey(name, code),
        planned_ship_date,
        planned_receive_date,
        actual_ship_date,
        created_at
      `)
      .in('status', ['shipped', 'partial'])

    // Apply filters
    if (search) {
      dataQuery = dataQuery.ilike('to_number', `%${search}%`)
      countQuery = countQuery.ilike('to_number', `%${search}%`)
    }

    if (warehouse_id) {
      dataQuery = dataQuery.eq('to_warehouse_id', warehouse_id)
      countQuery = countQuery.eq('to_warehouse_id', warehouse_id)
    }

    if (date_from) {
      dataQuery = dataQuery.gte('actual_ship_date', date_from)
      countQuery = countQuery.gte('actual_ship_date', date_from)
    }

    if (date_to) {
      dataQuery = dataQuery.lte('actual_ship_date', date_to)
      countQuery = countQuery.lte('actual_ship_date', date_to)
    }

    // Apply sorting
    dataQuery = dataQuery.order(sort, { ascending: order === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    dataQuery = dataQuery.range(from, to)

    // 7. Execute queries
    const [{ data, error: dataError }, { count, error: countError }] = await Promise.all([
      dataQuery,
      countQuery,
    ])

    if (dataError || countError) {
      throw new Error(dataError?.message || countError?.message)
    }

    // 8. Transform response
    const tos = (data || []).map((to: any) => ({
      id: to.id,
      to_number: to.to_number,
      status: to.status,
      from_warehouse_id: to.from_warehouse_id,
      from_warehouse_name: to.from_warehouse?.name || '',
      from_warehouse_code: to.from_warehouse?.code || '',
      to_warehouse_id: to.to_warehouse_id,
      to_warehouse_name: to.to_warehouse?.name || '',
      to_warehouse_code: to.to_warehouse?.code || '',
      planned_ship_date: to.planned_ship_date,
      planned_receive_date: to.planned_receive_date,
      actual_ship_date: to.actual_ship_date,
      created_at: to.created_at,
    }))

    const total = count || 0

    return NextResponse.json({
      data: tos,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching pending TOs:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { error: 'Failed to fetch pending TOs', details: message },
      { status: 500 }
    )
  }
}
