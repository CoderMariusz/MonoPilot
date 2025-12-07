// API Route: License Plates Collection
// Epic 5 Batch 05A-1: LP Core (Stories 5.1-5.4)
// GET /api/warehouse/license-plates - List LPs with filters
// POST /api/warehouse/license-plates - Create new LP

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  createLP,
  listLPs,
  type CreateLPInput,
  type LPFilter,
} from '@/lib/services/license-plate-service'

// GET /api/warehouse/license-plates - List license plates
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

    // Extract query parameters (AC-5.1.5: Filters)
    const filter: LPFilter = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as any || undefined,
      qa_status: searchParams.get('qa_status') as any || undefined,
      product_id: searchParams.get('product_id') || undefined,
      warehouse_id: searchParams.get('warehouse_id') || undefined,
      location_id: searchParams.get('location_id') || undefined,
      batch_number: searchParams.get('batch_number') || undefined,
      expiry_before: searchParams.get('expiry_before') || undefined,
      expiry_after: searchParams.get('expiry_after') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    }

    // Remove undefined values
    Object.keys(filter).forEach(key => filter[key as keyof LPFilter] === undefined && delete filter[key as keyof LPFilter])

    const { data, count } = await listLPs(currentUser.org_id, filter)

    return NextResponse.json({
      data,
      total: count,
    })
  } catch (error) {
    console.error('Error in GET /api/warehouse/license-plates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/warehouse/license-plates - Create new LP
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

    // Authorization: Warehouse, Production, Manager, Admin
    if (!['warehouse', 'production', 'manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Warehouse role or higher required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const input: CreateLPInput = {
      product_id: body.product_id,
      quantity: body.quantity,
      uom: body.uom,
      warehouse_id: body.warehouse_id,
      location_id: body.location_id || undefined,
      batch_number: body.batch_number || undefined,
      supplier_batch_number: body.supplier_batch_number || undefined,
      manufacturing_date: body.manufacturing_date || undefined,
      expiry_date: body.expiry_date || undefined,
      received_date: body.received_date || undefined,
      qa_status: body.qa_status || 'pending',
      status: body.status || 'available',
    }

    // Validate required fields
    if (!input.product_id || !input.quantity || !input.uom || !input.warehouse_id) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, quantity, uom, warehouse_id' },
        { status: 400 }
      )
    }

    const data = await createLP(input, currentUser.org_id, session.user.id)

    return NextResponse.json(
      {
        data,
        message: 'License plate created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/warehouse/license-plates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
