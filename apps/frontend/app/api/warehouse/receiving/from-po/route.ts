/**
 * API Route: Receive from Purchase Order
 * Story 5.32a: Shared Receiving Service
 * POST /api/warehouse/receiving/from-po
 *
 * Creates GRN + LPs for received goods from PO
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { receiveFromPO } from '@/lib/services/receiving-service'
import type { ReceiveFromPOInput } from '@/lib/types/receiving'

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
    const { po_id, items, notes } = body

    // Validate required fields
    if (!po_id) {
      return NextResponse.json(
        { error: 'Missing required field: po_id' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: items (must be non-empty array)' },
        { status: 400 }
      )
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.po_line_id) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Missing po_line_id` },
          { status: 400 }
        )
      }
      if (!item.qty_received || item.qty_received <= 0) {
        return NextResponse.json(
          { error: `Item ${i + 1}: qty_received must be greater than 0` },
          { status: 400 }
        )
      }
      if (!item.batch_number) {
        return NextResponse.json(
          { error: `Item ${i + 1}: batch_number is required (FDA compliance)` },
          { status: 400 }
        )
      }
      if (!item.location_id) {
        return NextResponse.json(
          { error: `Item ${i + 1}: location_id is required` },
          { status: 400 }
        )
      }
    }

    // Build input
    const input: ReceiveFromPOInput = {
      org_id: currentUser.org_id,
      po_id,
      items,
      notes,
    }

    // Execute receive
    const result = await receiveFromPO(input, session.user.id)

    if (!result.success) {
      // Determine appropriate status code
      let statusCode = 500
      if (result.code === 'NOT_FOUND') statusCode = 404
      if (result.code === 'INVALID_STATUS') statusCode = 400
      if (result.code === 'VALIDATION_FAILED') statusCode = 400
      if (result.code === 'OVER_RECEIPT_NOT_ALLOWED') statusCode = 400
      if (result.code === 'OVER_RECEIPT_EXCEEDS_TOLERANCE') statusCode = 400

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
        message: 'Goods received successfully from PO',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/warehouse/receiving/from-po:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
