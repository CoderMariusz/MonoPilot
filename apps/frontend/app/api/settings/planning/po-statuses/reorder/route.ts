/**
 * API Route: Reorder PO Statuses
 * Story: 03.7 - PO Status Lifecycle (Configurable Statuses)
 *
 * PUT /api/settings/planning/po-statuses/reorder - Reorder statuses
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { POStatusService } from '@/lib/services/po-status-service'
import { reorderStatusesSchema } from '@/lib/validation/po-status-schemas'

/**
 * PUT /api/settings/planning/po-statuses/reorder
 * Reorder PO statuses by updating display_order
 *
 * Body: { status_ids: string[] }
 *
 * Auth: Admin only
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's org and role
    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 403 }
      )
    }

    const roleData = userData.role as any
    const role = (
      typeof roleData === 'string'
        ? roleData
        : Array.isArray(roleData)
          ? roleData[0]?.code
          : roleData?.code
    )?.toLowerCase()

    const allowedRoles = ['admin', 'owner', 'super_admin', 'superadmin']
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = reorderStatusesSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Reorder statuses
    const result = await POStatusService.reorderStatuses(
      userData.org_id,
      validationResult.data.status_ids
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.code === 'NOT_FOUND' ? 400 : 500 }
      )
    }

    return NextResponse.json({
      statuses: result.data,
      total: result.data?.length || 0,
    })
  } catch (error) {
    console.error('Error in PUT /api/settings/planning/po-statuses/reorder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
