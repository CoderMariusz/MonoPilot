/**
 * Audit Logs List API Route
 * Story: 01.17 - Audit Trail
 * Phase: P3b - Backend Implementation (GREEN)
 *
 * GET /api/settings/audit-logs - List audit logs with filters and pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { AuditService } from '@/lib/services/audit-service'
import { auditLogQuerySchema } from '@/lib/validation/audit'
import { ZodError } from 'zod'

export const dynamic = 'force-dynamic'

// ============================================================================
// GET /api/settings/audit-logs - List Audit Logs
// ============================================================================

export async function GET(request: NextRequest) {
  try {
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

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const rawParams = {
      search: searchParams.get('search') || undefined,
      user_id: searchParams.get('user_id') || undefined,
      action: searchParams.get('action') || undefined,
      entity_type: searchParams.get('entity_type') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    }

    const validated = auditLogQuerySchema.parse(rawParams)

    // Build filters for AuditService
    const filters = {
      search: validated.search,
      user_ids: validated.user_id,
      actions: validated.action,
      entity_types: validated.entity_type,
      date_from: validated.date_from ? new Date(validated.date_from) : undefined,
      date_to: validated.date_to ? new Date(validated.date_to) : undefined,
      limit: validated.limit,
      offset: validated.offset,
    }

    // Call AuditService to get logs
    const result = await AuditService.getAuditLogs(orgId, filters)

    return NextResponse.json({
      data: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    })
  } catch (error) {
    console.error('Error in GET /api/settings/audit-logs:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
