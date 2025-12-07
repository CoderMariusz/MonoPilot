// API Route: License Plate Detail
// Epic 5 Batch 05A-1: LP Core (Stories 5.1-5.4)
// GET /api/warehouse/license-plates/[id] - Get single LP
// PATCH /api/warehouse/license-plates/[id] - Update LP
// DELETE /api/warehouse/license-plates/[id] - Soft delete LP

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  getLP,
  updateLP,
  updateLPStatus,
  type UpdateLPInput,
} from '@/lib/services/license-plate-service'

// GET /api/warehouse/license-plates/[id] - Get single LP
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const data = await getLP(id)

    if (!data) {
      return NextResponse.json({ error: 'License plate not found' }, { status: 404 })
    }

    // Check org access
    if (data.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/warehouse/license-plates/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/warehouse/license-plates/[id] - Update LP
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Get existing LP to check org
    const existingLP = await getLP(id)
    if (!existingLP) {
      return NextResponse.json({ error: 'License plate not found' }, { status: 404 })
    }

    if (existingLP.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const input: UpdateLPInput = {
      batch_number: body.batch_number,
      supplier_batch_number: body.supplier_batch_number,
      location_id: body.location_id,
      warehouse_id: body.warehouse_id,
      qa_status: body.qa_status,
      expiry_date: body.expiry_date,
      manufacturing_date: body.manufacturing_date,
    }

    // Remove undefined values
    Object.keys(input).forEach(key => input[key as keyof UpdateLPInput] === undefined && delete input[key as keyof UpdateLPInput])

    const data = await updateLP(id, input, session.user.id)

    return NextResponse.json({
      data,
      message: 'License plate updated successfully',
    })
  } catch (error) {
    console.error('Error in PATCH /api/warehouse/license-plates/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/warehouse/license-plates/[id] - Soft delete (recall)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Authorization: Manager, Admin only for recall
    if (!['manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Manager role or higher required' },
        { status: 403 }
      )
    }

    // Get existing LP to check org
    const existingLP = await getLP(id)
    if (!existingLP) {
      return NextResponse.json({ error: 'License plate not found' }, { status: 404 })
    }

    if (existingLP.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete by changing status to 'recalled'
    const data = await updateLPStatus(id, 'recalled', session.user.id, 'LP recalled via DELETE endpoint')

    return NextResponse.json({
      data,
      message: 'License plate recalled successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/warehouse/license-plates/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
