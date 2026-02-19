/**
 * Audit Log Detail API Route
 * Story: 01.17 - Audit Trail
 * Phase: P3b - Backend Implementation (GREEN)
 *
 * GET /api/settings/audit-logs/[id] - Get single audit log by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// ============================================================================
// GET /api/settings/audit-logs/[id] - Get Single Audit Log
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's org_id and role
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization: Manager/Admin only
    const roleData = currentUser.role as any
    const currentRole = (
      typeof roleData === 'string'
        ? roleData
        : Array.isArray(roleData)
          ? roleData[0]?.code
          : roleData?.code
    )?.toLowerCase()

    const allowedRoles = ['admin', 'owner', 'manager']
    if (!currentRole || !allowedRoles.includes(currentRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Manager or Admin role required' },
        { status: 403 }
      )
    }

    const orgId = currentUser.org_id

    // Query single audit log with user join
    const { data: auditLog, error: queryError } = await supabaseAdmin
      .from('audit_logs')
      .select('*, user:users(id, email, first_name, last_name)')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (queryError) {
      // RLS returns PGRST116 (not found) for cross-org access
      if (queryError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Audit log not found' }, { status: 404 })
      }
      console.error('Failed to fetch audit log:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch audit log' },
        { status: 500 }
      )
    }

    if (!auditLog) {
      return NextResponse.json({ error: 'Audit log not found' }, { status: 404 })
    }

    return NextResponse.json({ data: auditLog })
  } catch (error) {
    console.error('Error in GET /api/settings/audit-logs/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
