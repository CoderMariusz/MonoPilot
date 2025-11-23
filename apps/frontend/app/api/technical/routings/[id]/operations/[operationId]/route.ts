import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateOperationSchema } from '@/lib/validation/routing-schemas'
import {
  updateOperation,
  deleteOperation,
} from '@/lib/services/routing-service'
import { ZodError } from 'zod'

/**
 * Routing Operation Detail API Routes
 * Story: 2.16 Routing Operations
 *
 * PUT /api/technical/routings/:id/operations/:operationId - Update operation
 * DELETE /api/technical/routings/:id/operations/:operationId - Delete operation
 */

// ============================================================================
// PUT /api/technical/routings/:id/operations/:operationId - Update Operation (AC-016.4)
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; operationId: string }> }
) {
  try {
    const { id, operationId } = await params

    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization: Admin or Technical only
    if (!['admin', 'technical'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Technical role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateOperationSchema.parse(body)

    // Call service method
    const result = await updateOperation(operationId, validatedData)

    if (!result.success) {
      if (result.code === 'DUPLICATE_SEQUENCE') {
        return NextResponse.json(
          { error: result.error || 'Sequence already exists' },
          { status: 409 }
        )
      }

      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Operation not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to update operation' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        operation: result.data,
        message: 'Operation updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/technical/routings/:id/operations/:operationId:', error)

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

// ============================================================================
// DELETE /api/technical/routings/:id/operations/:operationId - Delete Operation (AC-016.4)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; operationId: string }> }
) {
  try {
    const { id, operationId } = await params

    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization: Admin only
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Call service method
    const result = await deleteOperation(operationId)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Operation not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to delete operation' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Operation deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/technical/routings/:id/operations/:operationId:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
