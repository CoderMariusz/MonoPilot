// API Route: Pallets Collection
// Epic 5 Batch 05B-2: Pallets (Stories 5.19-5.22)
// GET /api/warehouse/pallets - List pallets with filters
// POST /api/warehouse/pallets - Create new pallet

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

// GET /api/warehouse/pallets - List pallets
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)

    // Build query
    let query = supabase
      .from('pallets')
      .select(`
        *,
        location:locations(id, code, name),
        warehouse:warehouses(id, code, name),
        created_by_user:users!pallets_created_by_fkey(id, email),
        pallet_lps(count)
      `, { count: 'exact' })
      .eq('org_id', currentUser.org_id)

    // Filters
    const status = searchParams.get('status')
    const warehouse_id = searchParams.get('warehouse_id')
    const location_id = searchParams.get('location_id')

    if (status) query = query.eq('status', status)
    if (warehouse_id) query = query.eq('warehouse_id', warehouse_id)
    if (location_id) query = query.eq('location_id', location_id)

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      data,
      total: count,
    })
  } catch (error) {
    console.error('Error in GET /api/warehouse/pallets:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/warehouse/pallets - Create new pallet
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization
    if (!['warehouse', 'production', 'manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Warehouse role or higher required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.warehouse_id) {
      return NextResponse.json(
        { error: 'Missing required field: warehouse_id' },
        { status: 400 }
      )
    }

    // Generate pallet number
    const { data: palletNumber, error: numberError } = await supabase.rpc(
      'generate_pallet_number',
      { org_uuid: currentUser.org_id }
    )

    if (numberError) throw numberError

    // Create pallet
    const { data, error } = await supabase
      .from('pallets')
      .insert({
        org_id: currentUser.org_id,
        pallet_number: palletNumber,
        warehouse_id: body.warehouse_id,
        location_id: body.location_id || null,
        notes: body.notes || null,
        created_by: session.user.id,
        status: 'open',
      })
      .select(`
        *,
        location:locations(id, code, name),
        warehouse:warehouses(id, code, name)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(
      {
        data,
        message: 'Pallet created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/warehouse/pallets:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
