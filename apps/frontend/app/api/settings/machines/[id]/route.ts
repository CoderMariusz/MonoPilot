import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateMachineSchema } from '@/lib/validation/machine-schemas'
import {
  getMachineById,
  updateMachine,
  deleteMachine,
} from '@/lib/services/machine-service'
import { ZodError } from 'zod'

/**
 * Machine API Routes (Individual Machine)
 * Story: 1.7 Machine Configuration
 * Task 4: API Endpoints
 *
 * GET /api/settings/machines/[id] - Get machine by ID
 * PUT /api/settings/machines/[id] - Update machine
 * DELETE /api/settings/machines/[id] - Delete machine
 */

// ============================================================================
// GET /api/settings/machines/[id] - Get Machine by ID (AC-006.7)
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Call service method
    const result = await getMachineById(id)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Machine not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to fetch machine' },
        { status: 500 }
      )
    }

    return NextResponse.json({ machine: result.data }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/settings/machines/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/settings/machines/[id] - Update Machine (AC-006.6)
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Check authorization: Admin only (AC-006.6)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateMachineSchema.parse(body)

    // Call service method
    const result = await updateMachine(id, validatedData)

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Machine not found' },
          { status: 404 }
        )
      }

      if (result.code === 'DUPLICATE_CODE') {
        return NextResponse.json(
          { error: result.error || 'Machine code already exists' },
          { status: 409 }
        )
      }

      if (result.code === 'ACTIVE_WOS') {
        return NextResponse.json(
          {
            error: result.error || 'Cannot change status - machine has active work orders',
            warning: true
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to update machine' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        machine: result.data,
        message: 'Machine updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/settings/machines/[id]:', error)

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
// DELETE /api/settings/machines/[id] - Delete Machine (AC-006.5)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Check authorization: Admin only (AC-006.5)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Call service method
    const result = await deleteMachine(id)

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Machine not found' },
          { status: 404 }
        )
      }

      if (result.code === 'FOREIGN_KEY_CONSTRAINT') {
        return NextResponse.json(
          {
            error: result.error || 'Cannot delete machine - it has active work orders. Archive it instead.',
            code: 'HAS_DEPENDENCIES'
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to delete machine' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Machine deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/settings/machines/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
