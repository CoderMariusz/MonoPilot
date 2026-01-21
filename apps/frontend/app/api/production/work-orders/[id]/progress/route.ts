/**
 * GET /api/production/work-orders/:id/progress
 * Story 04.7d: Multiple Outputs per WO
 *
 * Returns WO progress data:
 * - planned_qty, output_qty, progress_percent
 * - remaining_qty, outputs_count
 * - is_complete, auto_complete_enabled, status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getWOProgress } from '@/lib/services/output-aggregation-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's org_id
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not found' },
        { status: 401 }
      )
    }

    // Verify WO belongs to user's org
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, org_id')
      .eq('id', woId)
      .single()

    if (woError || !wo) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Work order not found' },
        { status: 404 }
      )
    }

    if (wo.org_id !== userRecord.org_id) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Work order not found' },
        { status: 404 }
      )
    }

    // Get progress data
    const progress = await getWOProgress(woId)

    return NextResponse.json({
      data: progress,
    })
  } catch (error) {
    console.error('Get WO progress error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
