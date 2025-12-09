/**
 * API Route: Validate Receive Operation
 * Story 5.32a: Shared Receiving Service
 * POST /api/warehouse/receiving/validate
 *
 * Validates receive operation before submission
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { validateReceive } from '@/lib/services/receiving-service'
import type { ReceiveOperation } from '@/lib/types/receiving'

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

    // Parse request body
    const body = await request.json()
    const { type, data } = body

    // Validate request structure
    if (!type || !['po', 'to', 'manual'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: po, to, manual' },
        { status: 400 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Missing required field: data' },
        { status: 400 }
      )
    }

    // Build operation object
    let operation: ReceiveOperation

    if (type === 'po') {
      operation = {
        type: 'po',
        data: {
          org_id: currentUser.org_id,
          po_id: data.po_id,
          items: data.items || [],
        },
      }
    } else if (type === 'to') {
      operation = {
        type: 'to',
        data: {
          org_id: currentUser.org_id,
          to_id: data.to_id,
          location_id: data.location_id,
        },
      }
    } else {
      operation = {
        type: 'manual',
        data: {
          org_id: currentUser.org_id,
          item: data.item || data,
        },
      }
    }

    // Execute validation
    const result = await validateReceive(currentUser.org_id, operation)

    return NextResponse.json(
      {
        valid: result.valid,
        errors: result.errors,
        warnings: result.warnings,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/warehouse/receiving/validate:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
