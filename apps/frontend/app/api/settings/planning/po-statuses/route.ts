/**
 * API Routes: PO Statuses (Settings)
 * Story: 03.7 - PO Status Lifecycle (Configurable Statuses)
 *
 * GET /api/settings/planning/po-statuses - List all PO statuses
 * POST /api/settings/planning/po-statuses - Create new PO status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { POStatusService } from '@/lib/services/po-status-service'
import { createPOStatusSchema } from '@/lib/validation/po-status-schemas'

/**
 * GET /api/settings/planning/po-statuses
 * List all PO statuses for the organization
 *
 * Query params:
 * - include: 'usage_count' to include PO counts per status
 *
 * Auth: Admin only
 */
export async function GET(request: NextRequest) {
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const includeUsageCount = searchParams.get('include') === 'usage_count'

    // Get statuses
    const statuses = await POStatusService.listStatuses(
      userData.org_id,
      { includeUsageCount }
    )

    return NextResponse.json({
      statuses,
      total: statuses.length,
    })
  } catch (error) {
    console.error('Error in GET /api/settings/planning/po-statuses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/planning/po-statuses
 * Create a new custom PO status
 *
 * Body: { code, name, color?, display_order?, description? }
 *
 * Auth: Admin only
 */
export async function POST(request: NextRequest) {
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
    const validationResult = createPOStatusSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Create status
    const result = await POStatusService.createStatus(
      userData.org_id,
      validationResult.data
    )

    if (!result.success) {
      if (result.code === 'DUPLICATE_CODE') {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data, {
      status: 201,
      headers: {
        'Location': `/api/settings/planning/po-statuses/${result.data?.id}`,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/settings/planning/po-statuses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
