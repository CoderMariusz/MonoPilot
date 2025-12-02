/**
 * POST /api/production/work-orders/:id/complete
 * GET /api/production/work-orders/:id/complete (preview)
 * Story 4.6: Complete a work order
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  completeWorkOrder,
  getWOCompletionPreview,
  WOCompleteError,
} from '@/lib/services/wo-complete-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required' }, { status: 401 })
    }

    // Get user details
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, org_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json({ error: 'Unauthorized', message: 'User not found' }, { status: 401 })
    }

    // Get completion preview
    const preview = await getWOCompletionPreview(woId, userRecord.org_id)

    return NextResponse.json({ data: preview })
  } catch (error) {
    if (error instanceof WOCompleteError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      )
    }

    console.error('WO completion preview error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required' }, { status: 401 })
    }

    // Get user details with role and org_id
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, org_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json({ error: 'Unauthorized', message: 'User not found' }, { status: 401 })
    }

    // Complete the work order
    const result = await completeWorkOrder(woId, userRecord.id, userRecord.role, userRecord.org_id)

    return NextResponse.json({
      data: result,
      message: 'Work order completed successfully',
    })
  } catch (error) {
    if (error instanceof WOCompleteError) {
      return NextResponse.json(
        { error: error.code, message: error.message, details: error.details },
        { status: error.statusCode },
      )
    }

    console.error('Complete WO error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
