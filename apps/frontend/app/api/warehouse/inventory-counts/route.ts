/**
 * API Route: Inventory Counts Collection
 * Story 5.35: Inventory Count
 * GET /api/warehouse/inventory-counts - List counts
 * POST /api/warehouse/inventory-counts - Initiate count
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  initiateCount,
  listCounts,
  type CountReason,
  type CountStatus,
} from '@/lib/services/inventory-count-service'

// GET /api/warehouse/inventory-counts - List inventory counts
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

    // Extract query parameters
    const filters = {
      status: searchParams.get('status') as CountStatus | undefined,
      location_id: searchParams.get('location_id') || undefined,
      reason: searchParams.get('reason') as CountReason | undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    }

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })

    const { data, count } = await listCounts(currentUser.org_id, filters)

    return NextResponse.json({
      data,
      total: count,
    })
  } catch (error) {
    console.error('Error in GET /api/warehouse/inventory-counts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/warehouse/inventory-counts - Initiate new count
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

    // Authorization: Warehouse, Manager, Admin
    if (!['warehouse', 'manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Warehouse role or higher required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { location_id, reason } = body

    // Validate required fields
    if (!location_id) {
      return NextResponse.json(
        { error: 'Missing required field: location_id' },
        { status: 400 }
      )
    }

    // Validate location belongs to org
    const { data: location, error: locError } = await supabase
      .from('locations')
      .select('id')
      .eq('id', location_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (locError || !location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    const data = await initiateCount(
      currentUser.org_id,
      location_id,
      session.user.id,
      reason
    )

    return NextResponse.json(
      {
        data,
        message: 'Inventory count initiated successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/warehouse/inventory-counts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
