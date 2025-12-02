/**
 * POST /api/production/work-orders/:id/pause
 * Story 4.3: Pause a work order
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { pauseWorkOrder, WOPauseError } from '@/lib/services/wo-pause-service'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Parse request body
    let pauseReason: string | undefined
    let notes: string | undefined

    try {
      const body = await request.json()
      pauseReason = body.pause_reason
      notes = body.notes
    } catch {
      // Empty body is fine - reason and notes are optional
    }

    // Pause the work order
    const result = await pauseWorkOrder(
      woId,
      userRecord.id,
      userRecord.role,
      userRecord.org_id,
      pauseReason,
      notes,
    )

    return NextResponse.json({
      data: result,
      message: 'Work order paused successfully',
    })
  } catch (error) {
    if (error instanceof WOPauseError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      )
    }

    console.error('Pause WO error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
