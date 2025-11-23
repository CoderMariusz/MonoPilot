import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  createOperationSchema,
  reorderOperationsSchema,
} from '@/lib/validation/routing-schemas'
import {
  createOperation,
  listOperations,
  reorderOperations,
} from '@/lib/services/routing-service'
import { ZodError } from 'zod'

/**
 * Routing Operations API Routes
 * Story: 2.16 Routing Operations
 *
 * GET /api/technical/routings/:id/operations - List operations for routing
 * POST /api/technical/routings/:id/operations - Create new operation
 * POST /api/technical/routings/:id/operations/reorder - Reorder operations
 */

// ============================================================================
// GET /api/technical/routings/:id/operations - List Operations (AC-016.2)
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
    const result = await listOperations(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch operations' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        operations: result.data || [],
        total: result.total || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/technical/routings/:id/operations:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/technical/routings/:id/operations - Create Operation (AC-016.1)
// ============================================================================

export async function POST(
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

    // Check authorization: Admin or Technical only
    if (!['admin', 'technical'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Technical role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()

    // Check if this is a reorder request
    if (body.operations && Array.isArray(body.operations)) {
      const validatedData = reorderOperationsSchema.parse(body)
      const result = await reorderOperations(validatedData.operations)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to reorder operations' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Operations reordered successfully',
        },
        { status: 200 }
      )
    }

    // Regular operation creation
    const validatedData = createOperationSchema.parse(body)

    // Call service method
    const result = await createOperation(id, validatedData)

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'DUPLICATE_SEQUENCE') {
        return NextResponse.json(
          { error: result.error || 'Sequence already exists' },
          { status: 409 }
        )
      }

      if (result.code === 'INVALID_INPUT') {
        return NextResponse.json(
          { error: result.error || 'Invalid input' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to create operation' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        operation: result.data,
        message: 'Operation created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/technical/routings/:id/operations:', error)

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
