/**
 * API Route: Start Pick List
 * Story: 07.9 - Pick Confirmation Desktop
 *
 * POST /api/shipping/pick-lists/:id/start - Start picking workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, validateOrigin } from '@/lib/api/auth-helpers'
import { WAREHOUSE_ELEVATED_ROLES } from '@/lib/constants/roles'

/**
 * POST /api/shipping/pick-lists/:id/start
 * Start picking - transition pick list from 'assigned' to 'in_progress'
 *
 * AC-1: Start pick list workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CSRF protection
    const originError = validateOrigin(request)
    if (originError) {
      return originError
    }

    const { id } = await params

    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId, orgId, userRole } = authContext

    // Get pick list
    const { data: pickList, error: fetchError } = await supabase
      .from('pick_lists')
      .select('id, org_id, pick_list_number, status, assigned_to, started_at, completed_at, created_at, priority')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !pickList) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Pick list not found' } },
        { status: 404 }
      )
    }

    // Validate permission - user must be assigned or have elevated role
    const hasElevatedRole = WAREHOUSE_ELEVATED_ROLES.includes(userRole.toLowerCase() as typeof WAREHOUSE_ELEVATED_ROLES[number])
    if (pickList.assigned_to !== userId && !hasElevatedRole) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied - not assigned to this pick list' } },
        { status: 403 }
      )
    }

    // Validate status transition
    if (pickList.status !== 'assigned') {
      if (pickList.status === 'in_progress') {
        return NextResponse.json(
          { error: { code: 'CONFLICT', message: 'Pick list already in progress' } },
          { status: 409 }
        )
      }
      if (pickList.status === 'completed') {
        return NextResponse.json(
          { error: { code: 'CONFLICT', message: 'Pick list already completed' } },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Invalid status transition - pick list must be in assigned status' } },
        { status: 409 }
      )
    }

    // Update status
    const now = new Date().toISOString()
    const { data: updated, error: updateError } = await supabase
      .from('pick_lists')
      .update({
        status: 'in_progress',
        started_at: now,
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError || !updated) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to start pick list' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      started_at: now,
      pick_list: {
        id: updated.id,
        status: updated.status,
        started_at: updated.started_at,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/shipping/pick-lists/:id/start:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
