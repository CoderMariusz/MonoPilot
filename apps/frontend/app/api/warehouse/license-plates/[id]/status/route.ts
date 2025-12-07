// API Route: License Plate Status Update
// Epic 5 Batch 05A-1: LP Core (Story 5.2)
// PATCH /api/warehouse/license-plates/[id]/status - Update LP status with validation

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  getLP,
  updateLPStatus,
  type LPStatus,
} from '@/lib/services/license-plate-service'

// PATCH /api/warehouse/license-plates/[id]/status - Update LP status
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
    const { status, reason } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Missing required field: status' },
        { status: 400 }
      )
    }

    // Validate status value
    const validStatuses: LPStatus[] = ['available', 'reserved', 'consumed', 'shipped', 'quarantine', 'recalled', 'merged']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Update status (service will validate transition)
    const data = await updateLPStatus(id, status, session.user.id, reason)

    return NextResponse.json({
      data,
      message: 'License plate status updated successfully',
    })
  } catch (error) {
    console.error('Error in PATCH /api/warehouse/license-plates/[id]/status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
