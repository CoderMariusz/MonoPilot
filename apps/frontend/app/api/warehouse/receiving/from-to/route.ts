/**
 * API Route: Receive from Transfer Order
 * Story 5.32a: Shared Receiving Service
 * POST /api/warehouse/receiving/from-to
 *
 * Updates LP locations and creates stock moves for TO receive
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { receiveFromTO } from '@/lib/services/receiving-service'
import type { ReceiveFromTOInput } from '@/lib/types/receiving'

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
      .select('role, org_id')
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
    const { to_id, location_id, notes } = body

    // Validate required fields
    if (!to_id) {
      return NextResponse.json(
        { error: 'Missing required field: to_id' },
        { status: 400 }
      )
    }

    if (!location_id) {
      return NextResponse.json(
        { error: 'Missing required field: location_id' },
        { status: 400 }
      )
    }

    // Build input
    const input: ReceiveFromTOInput = {
      org_id: currentUser.org_id,
      to_id,
      location_id,
      notes,
    }

    // Execute receive
    const result = await receiveFromTO(input, session.user.id)

    if (!result.success) {
      // Determine appropriate status code
      let statusCode = 500
      if (result.code === 'NOT_FOUND') statusCode = 404
      if (result.code === 'INVALID_STATUS') statusCode = 400
      if (result.code === 'LOCATION_NOT_FOUND') statusCode = 400

      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
        },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      {
        ...result.data,
        message: 'Transfer Order received successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/warehouse/receiving/from-to:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
