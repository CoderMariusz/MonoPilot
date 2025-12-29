/**
 * Single Operation API Routes - Story 02.8
 *
 * PUT /api/v1/technical/routings/:id/operations/:opId - Update operation
 * DELETE /api/v1/technical/routings/:id/operations/:opId - Delete operation
 *
 * Auth: Required
 * Roles: ADMIN, SUPER_ADMIN, PRODUCTION_MANAGER (technical role)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  updateOperation,
  deleteOperation,
} from '@/lib/services/routing-operations-service'
import { operationFormSchema } from '@/lib/validation/operation-schemas'

/**
 * PUT /api/v1/technical/routings/:id/operations/:opId
 * Update an existing operation
 */
export async function PUT(
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

    // Parse request body (partial update allowed)
    const body = await request.json()

    // Validate only the fields that are provided
    const partialSchema = operationFormSchema.partial()
    const validationResult = partialSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Update operation
    const result = await updateOperation(routingId, opId, validationResult.data)

    if (!result.success) {
      const status = result.code === 'OPERATION_NOT_FOUND' ? 404 :
                     result.code === 'ROUTING_NOT_FOUND' ? 404 :
                     result.code === 'VALIDATION_ERROR' ? 400 : 500
      return NextResponse.json(
        { error: result.code, message: result.error },
        { status }
      )
    }

    return NextResponse.json({ operation: result.data })
  } catch (error) {
    console.error('PUT operation error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/technical/routings/:id/operations/:opId
 * Delete an operation (also deletes attachments from storage)
 */
export async function DELETE(
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

    const { id: routingId, opId } = await params

    // Delete operation
    const result = await deleteOperation(routingId, opId)

    if (!result.success) {
      const status = result.code === 'OPERATION_NOT_FOUND' ? 404 : 500
      return NextResponse.json(
        { error: result.code, message: result.error },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Operation deleted',
      attachments_deleted: result.data?.attachments_deleted || 0,
    })
  } catch (error) {
    console.error('DELETE operation error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
