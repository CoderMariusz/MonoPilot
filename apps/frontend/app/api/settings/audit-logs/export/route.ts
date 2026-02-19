/**
 * Audit Logs Export API Route
 * Story: 01.17 - Audit Trail
 * Phase: P3b - Backend Implementation (GREEN)
 *
 * POST /api/settings/audit-logs/export - Export audit logs as CSV
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { AuditService } from '@/lib/services/audit-service'
import { auditExportSchema } from '@/lib/validation/audit'
import { ZodError } from 'zod'

export const dynamic = 'force-dynamic'

// ============================================================================
// POST /api/settings/audit-logs/export - Export as CSV
// ============================================================================

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const validated = auditExportSchema.parse(body)

    // Build filters for AuditService
    const filters = {
      search: validated.search,
      user_ids: validated.user_id,
      actions: validated.action,
      entity_types: validated.entity_type,
      date_from: validated.date_from ? new Date(validated.date_from) : undefined,
      date_to: validated.date_to ? new Date(validated.date_to) : undefined,
    }

    // Call AuditService to generate CSV buffer
    const csvBuffer = await AuditService.exportToCsv(orgId, filters)

    // Generate filename with current date
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `audit-logs-${timestamp}.csv`

    // Return CSV with proper headers
    return new NextResponse(csvBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/settings/audit-logs/export:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
