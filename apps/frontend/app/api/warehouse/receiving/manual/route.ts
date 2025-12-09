/**
 * API Route: Manual Receive (without source document)
 * Story 5.32a: Shared Receiving Service
 * POST /api/warehouse/receiving/manual
 *
 * Creates LP directly without PO or TO reference
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { manualReceive } from '@/lib/services/receiving-service'
import type { ManualReceiveInput } from '@/lib/types/receiving'

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
    const {
      product_id,
      qty,
      batch_number,
      manufacture_date,
      expiry_date,
      location_id,
      warehouse_id,
      notes,
    } = body

    // Validate required fields
    if (!product_id) {
      return NextResponse.json(
        { error: 'Missing required field: product_id' },
        { status: 400 }
      )
    }

    if (!qty || qty <= 0) {
      return NextResponse.json(
        { error: 'qty must be greater than 0' },
        { status: 400 }
      )
    }

    if (!batch_number) {
      return NextResponse.json(
        { error: 'batch_number is required (FDA compliance)' },
        { status: 400 }
      )
    }

    if (!location_id) {
      return NextResponse.json(
        { error: 'Missing required field: location_id' },
        { status: 400 }
      )
    }

    if (!warehouse_id) {
      return NextResponse.json(
        { error: 'Missing required field: warehouse_id' },
        { status: 400 }
      )
    }

    // Build input
    const input: ManualReceiveInput = {
      org_id: currentUser.org_id,
      item: {
        product_id,
        qty,
        batch_number,
        manufacture_date,
        expiry_date,
        location_id,
        warehouse_id,
        notes,
      },
    }

    // Execute receive
    const result = await manualReceive(input, session.user.id)

    if (!result.success) {
      // Determine appropriate status code
      let statusCode = 500
      if (result.code === 'NOT_FOUND') statusCode = 404
      if (result.code === 'VALIDATION_FAILED') statusCode = 400
      if (result.code === 'LOCATION_NOT_FOUND') statusCode = 400
      if (result.code === 'BATCH_NUMBER_REQUIRED') statusCode = 400

      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          validation: result.validation,
        },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      {
        ...result.data,
        message: 'Manual receive completed successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/warehouse/receiving/manual:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
