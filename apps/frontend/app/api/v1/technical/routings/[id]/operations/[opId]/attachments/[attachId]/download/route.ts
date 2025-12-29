/**
 * Attachment Download API Route - Story 02.8
 *
 * GET /api/v1/technical/routings/:id/operations/:opId/attachments/:attachId/download
 * Get signed URL for attachment download
 *
 * Auth: Required
 * Roles: All authenticated users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAttachmentDownloadUrl } from '@/lib/services/routing-operations-service'

/**
 * GET /api/v1/technical/routings/:id/operations/:opId/attachments/:attachId/download
 * Get signed URL for attachment download
 */
export async function GET(
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

    const { id: routingId, opId, attachId } = await params

    // Get download URL
    const result = await getAttachmentDownloadUrl(routingId, opId, attachId)

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500
      return NextResponse.json(
        { error: result.code, message: result.error },
        { status }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('GET download URL error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
