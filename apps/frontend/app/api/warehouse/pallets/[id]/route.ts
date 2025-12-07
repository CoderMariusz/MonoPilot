// API Route: Individual Pallet
// Epic 5 Batch 05B-2: Pallets (Stories 5.19-5.22)
// GET /api/warehouse/pallets/[id] - Get pallet with all LPs
// PUT /api/warehouse/pallets/[id] - Update pallet
// DELETE /api/warehouse/pallets/[id] - Delete pallet

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await params

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pallet with LPs
    const { data, error } = await supabase
      .from('pallets')
      .select(`
        *,
        location:locations(id, code, name),
        warehouse:warehouses(id, code, name),
        created_by_user:users!pallets_created_by_fkey(id, email),
        pallet_lps(
          id,
          added_at,
          added_by,
          license_plate:license_plates(
            id,
            lp_number,
            product_id,
            current_qty,
            uom,
            batch_number,
            expiry_date,
            product:products(id, code, name)
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pallet not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/warehouse/pallets/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await params

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

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.location_id !== undefined) updateData.location_id = body.location_id
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.status !== undefined) {
      updateData.status = body.status
      if (body.status === 'closed') {
        updateData.closed_at = new Date().toISOString()
      }
    }

    // Update pallet
    const { data, error } = await supabase
      .from('pallets')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        location:locations(id, code, name),
        warehouse:warehouses(id, code, name)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pallet not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({
      data,
      message: 'Pallet updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT /api/warehouse/pallets/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await params

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
    if (!['manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Manager role or higher required' },
        { status: 403 }
      )
    }

    // Check if pallet has LPs
    const { count } = await supabase
      .from('pallet_lps')
      .select('*', { count: 'exact', head: true })
      .eq('pallet_id', id)

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete pallet with license plates' },
        { status: 400 }
      )
    }

    // Delete pallet
    const { error } = await supabase.from('pallets').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Pallet deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/warehouse/pallets/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
