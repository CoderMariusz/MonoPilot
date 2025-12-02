/**
 * GET /api/production/work-orders/:id/pause-history
 * Story 4.3: Get pause history for a work order
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getPauseHistory, getDowntimeSummary } from '@/lib/services/wo-pause-service'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Get user's org_id
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json({ error: 'Unauthorized', message: 'User not found' }, { status: 401 })
    }

    // Verify WO belongs to user's org
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, org_id')
      .eq('id', woId)
      .single()

    if (woError || !wo || wo.org_id !== userRecord.org_id) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Work order not found' }, { status: 404 })
    }

    // Get pause history and summary
    const [history, summary] = await Promise.all([
      getPauseHistory(woId, userRecord.org_id),
      getDowntimeSummary(woId, userRecord.org_id),
    ])

    return NextResponse.json({
      data: history,
      summary,
    })
  } catch (error) {
    console.error('Get pause history error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
