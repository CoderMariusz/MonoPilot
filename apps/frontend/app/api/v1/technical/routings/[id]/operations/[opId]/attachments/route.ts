/**
 * Operation Attachments API Route - Story 02.8
 *
 * POST /api/v1/technical/routings/:id/operations/:opId/attachments
 * Upload attachment for operation work instructions
 *
 * Auth: Required
 * Roles: ADMIN, SUPER_ADMIN, PRODUCTION_MANAGER (technical role)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { uploadAttachment } from '@/lib/services/routing-operations-service'

/**
 * POST /api/v1/technical/routings/:id/operations/:opId/attachments
 * Upload attachment for operation work instructions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; opId: string }> }
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

    // Check permissions - need Technical write permission (C for create)
    const techPerm = (userData.role as any)?.permissions?.technical || ''
    const roleCode = (userData.role as any)?.code || ''

    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin'
    const hasTechWrite = techPerm.includes('C')

    if (!isAdmin && !hasTechWrite) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: routingId, opId } = await params

    // Get file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'File is required' },
        { status: 400 }
      )
    }

    // Upload attachment
    const result = await uploadAttachment(routingId, opId, file)

    if (!result.success) {
      const status = result.code === 'FILE_TOO_LARGE' ? 400 :
                     result.code === 'INVALID_FILE_TYPE' ? 400 :
                     result.code === 'MAX_ATTACHMENTS_REACHED' ? 400 :
                     result.code === 'OPERATION_NOT_FOUND' ? 404 : 500
      return NextResponse.json(
        { error: result.code, message: result.error },
        { status }
      )
    }

    return NextResponse.json({ attachment: result.data }, { status: 201 })
  } catch (error) {
    console.error('POST attachment error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
