// API Route: Warehouse Settings
// Epic 5 Batch 05A-1: LP Core (Story 5.4)
// GET /api/warehouse/settings - Get warehouse settings
// PUT /api/warehouse/settings - Update warehouse settings

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  getWarehouseSettings,
  updateWarehouseSettings,
} from '@/lib/services/license-plate-service'

// GET /api/warehouse/settings - Get warehouse settings
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
    const warehouse_id = searchParams.get('warehouse_id')

    if (!warehouse_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: warehouse_id' },
        { status: 400 }
      )
    }

    // Verify warehouse belongs to user's org
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .select('id, org_id')
      .eq('id', warehouse_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (warehouseError || !warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    const data = await getWarehouseSettings(warehouse_id)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/warehouse/settings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/warehouse/settings - Update warehouse settings
export async function PUT(request: NextRequest) {
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

    // Authorization: Manager, Admin only
    if (!['manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Manager role or higher required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { warehouse_id, ...settings } = body

    if (!warehouse_id) {
      return NextResponse.json(
        { error: 'Missing required field: warehouse_id' },
        { status: 400 }
      )
    }

    // Verify warehouse belongs to user's org
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .select('id, org_id')
      .eq('id', warehouse_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (warehouseError || !warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    const data = await updateWarehouseSettings(warehouse_id, currentUser.org_id, settings)

    return NextResponse.json({
      data,
      message: 'Warehouse settings updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT /api/warehouse/settings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
