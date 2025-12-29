/**
 * Single Attachment API Route - Story 02.8
 *
 * DELETE /api/v1/technical/routings/:id/operations/:opId/attachments/:attachId
 * Delete attachment from operation and storage
 *
 * Auth: Required
 * Roles: ADMIN, SUPER_ADMIN, PRODUCTION_MANAGER (technical role)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { deleteAttachment } from '@/lib/services/routing-operations-service'

/**
 * DELETE /api/v1/technical/routings/:id/operations/:opId/attachments/:attachId
 * Delete attachment from operation and storage
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; opId: string; attachId: string }> }
) {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role for permission check
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        org_id,
        role:roles (
          code,
          permissions
        )
      `)
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - need Technical write permission (D for delete)
    const techPerm = (userData.role as any)?.permissions?.technical || ''
    const roleCode = (userData.role as any)?.code || ''

    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin'
    const hasTechWrite = techPerm.includes('D')

    if (!isAdmin && !hasTechWrite) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: routingId, opId, attachId } = await params

    // Delete attachment
    const result = await deleteAttachment(routingId, opId, attachId)

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500
      return NextResponse.json(
        { error: result.code, message: result.error },
        { status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE attachment error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
