/**
 * GET /api/production/work-orders/:woId/operations/:opId/logs
 * Story 04.3: Get operation audit trail logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; opId: string }> }
) {
  try {
    const { id: woId, opId: operationId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user details with org_id
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not found' },
        { status: 401 }
      )
    }

    // Verify operation exists and belongs to user's org
    const { data: operation, error: opError } = await supabase
      .from('wo_operations')
      .select('id, wo_id, organization_id')
      .eq('id', operationId)
      .eq('wo_id', woId)
      .single()

    if (opError || !operation) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Operation not found' },
        { status: 404 }
      )
    }

    // Check org isolation (RLS pattern - return 404 for security)
    if (operation.organization_id !== userRecord.org_id) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Operation not found' },
        { status: 404 }
      )
    }

    // Get query params for filtering
    const searchParams = request.nextUrl.searchParams
    const eventType = searchParams.get('event_type')

    // Build query for operation logs
    let query = supabase
      .from('operation_logs')
      .select(`
        id,
        operation_id,
        event_type,
        old_status,
        new_status,
        user_id,
        changed_by_user:user_id(id, first_name, last_name),
        metadata,
        notes,
        created_at
      `)
      .eq('operation_id', operationId)

    // Apply event_type filter if provided
    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    // Order by created_at descending (most recent first)
    const { data: logs, error: logsError } = await query.order('created_at', { ascending: false })

    if (logsError) {
      console.error('Error fetching operation logs:', logsError)
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Failed to fetch operation logs' },
        { status: 500 }
      )
    }

    // Format response
    const formattedLogs = (logs || []).map((log) => ({
      id: log.id,
      operation_id: log.operation_id,
      event_type: log.event_type,
      old_status: log.old_status,
      new_status: log.new_status,
      user_id: log.user_id,
      changed_by_user: log.changed_by_user,
      metadata: log.metadata || {},
      notes: log.notes,
      created_at: log.created_at,
    }))

    return NextResponse.json({
      logs: formattedLogs,
      total: formattedLogs.length,
    })
  } catch (error) {
    console.error('Get operation logs error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
