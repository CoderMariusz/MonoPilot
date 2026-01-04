/**
 * LP Status Audit Trail API Route (Story 05.4)
 * GET /api/warehouse/license-plates/:id/status-audit
 *
 * Get status audit trail for an LP
 *
 * Query Parameters: (none)
 *
 * Response:
 * - audit_entries: Array of audit entries sorted by changed_at DESC
 *
 * Business Rules:
 * - Returns all status and qa_status changes for the LP
 * - Sorted by newest first (changed_at DESC)
 * - Performance: Must complete in <200ms (AC-17)
 * - RLS enforces org_id isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { LPStatusService } from '@/lib/services/lp-status-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lpId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify LP exists and belongs to user's org (RLS)
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('id')
      .eq('id', lpId)
      .single()

    if (lpError || !lp) {
      return NextResponse.json(
        { error: 'License plate not found', code: 'LP_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Get audit trail (sorted by changed_at DESC)
    const auditEntries = await LPStatusService.getStatusAuditTrail(lpId)

    return NextResponse.json({
      audit_entries: auditEntries,
      count: auditEntries.length,
    })
  } catch (error) {
    console.error('Error in GET /api/warehouse/license-plates/:id/status-audit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
