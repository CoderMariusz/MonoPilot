/**
 * Operation Reorder API Route - Story 02.8
 *
 * PATCH /api/v1/technical/routings/:id/operations/:opId/reorder
 * Move operation up or down (swap sequences)
 *
 * Auth: Required
 * Roles: ADMIN, SUPER_ADMIN, PRODUCTION_MANAGER (technical role)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { reorderOperation } from '@/lib/services/routing-operations-service'
import { reorderSchema } from '@/lib/validation/operation-schemas'

/**
 * PATCH /api/v1/technical/routings/:id/operations/:opId/reorder
 * Move operation up or down (swap sequences)
 */
export async function PATCH(
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

    // Check permissions - need Technical write permission (U for update)
    const techPerm = (userData.role as any)?.permissions?.technical || ''
    const roleCode = (userData.role as any)?.code || ''

    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin'
    const hasTechWrite = techPerm.includes('U')

    if (!isAdmin && !hasTechWrite) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: routingId, opId } = await params

    // Parse and validate request body
    const body = await request.json()
    const validationResult = reorderSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'INVALID_DIRECTION', message: "Direction must be 'up' or 'down'" },
        { status: 400 }
      )
    }

    const { direction } = validationResult.data

    // Reorder operation
    const result = await reorderOperation(routingId, opId, direction)

    if (!result.success) {
      const status = result.code === 'OPERATION_NOT_FOUND' ? 404 :
                     result.code === 'CANNOT_MOVE' ? 400 : 500
      return NextResponse.json(
        { error: result.code, message: result.error },
        { status }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('PATCH reorder error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
