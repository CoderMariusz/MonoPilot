/**
 * API Route: Backward Traceability
 * Story 5.28: Forward/Backward Traceability
 *
 * GET /api/warehouse/license-plates/[id]/trace/backward
 * Returns all ancestors (parents/grandparents) of an LP
 *
 * Query params:
 * - depth: max depth (default: 10, max: 10)
 * - format: 'json' | 'csv' (default: json)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getBackwardTrace, convertToCSV } from '@/lib/services/traceability-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()

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

    // Get current user and org
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify LP exists and belongs to user's org
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('id, org_id')
      .eq('id', id)
      .single()

    if (lpError || !lp) {
      return NextResponse.json({ error: 'License plate not found' }, { status: 404 })
    }

    if (lp.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const depth = Math.min(parseInt(searchParams.get('depth') || '10', 10), 10)
    const format = searchParams.get('format') || 'json'

    // Execute backward trace
    const result = await getBackwardTrace(id, depth)

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Trace failed' },
        { status: 500 }
      )
    }

    // Check performance requirement (<8 seconds)
    const executionTime = Date.now() - startTime
    if (executionTime > 8000) {
      console.warn(`Backward trace exceeded 8s limit: ${executionTime}ms for LP ${id}`)
    }

    // Return CSV if requested
    if (format === 'csv') {
      const csv = convertToCSV(result.data.nodes, 'backward')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="backward-trace-${result.data.root.lp_number}.csv"`,
        },
      })
    }

    // Return JSON
    return NextResponse.json({
      data: result.data,
      meta: {
        execution_time_ms: executionTime,
        depth_requested: depth,
        lp_id: id,
        trace_direction: 'backward',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/warehouse/license-plates/[id]/trace/backward:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
