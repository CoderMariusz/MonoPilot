import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateRoutingSchema } from '@/lib/validation/routing-schemas'
import {
  getRoutingById,
  updateRouting,
  deleteRouting,
} from '@/lib/services/routing-service'
import { ZodError } from 'zod'

/**
 * Routing Detail API Routes
 * Story: 2.15 Routing CRUD
 *
 * GET /api/technical/routings/:id - Get routing details
 * PUT /api/technical/routings/:id - Update routing
 * DELETE /api/technical/routings/:id - Delete routing
 */

// ============================================================================
// GET /api/technical/routings/:id - Get Routing (AC-015.2)
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call service method
    const result = await getRoutingById(id)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Routing not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to fetch routing' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        routing: result.data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/technical/routings/:id:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/technical/routings/:id - Update Routing (AC-015.5)
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check authorization: Admin or Technical only (AC-015.5)
    if (!['admin', 'technical'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Technical role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateRoutingSchema.parse(body)

    // Call service method
    const result = await updateRouting(id, validatedData)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Routing not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to update routing' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        routing: result.data,
        message: 'Routing updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/technical/routings/:id:', error)

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
// DELETE /api/technical/routings/:id - Delete Routing (AC-015.5)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check authorization: Admin only (AC-015.5)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Call service method
    const result = await deleteRouting(id)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Routing not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to delete routing' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Routing deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/technical/routings/:id:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
