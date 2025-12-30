import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateProductionLineSchema } from '@/lib/validation/production-line-schemas'
import {
  getProductionLineById,
  updateProductionLine,
  deleteProductionLine,
} from '@/lib/services/production-line-service'
import { ZodError } from 'zod'

/**
 * Production Line API Routes (Individual Line)
 * Story: 1.8 Production Line Configuration
 * Task 4: API Endpoints
 *
 * GET /api/settings/lines/[id] - Get production line by ID
 * PUT /api/settings/lines/[id] - Update production line
 * DELETE /api/settings/lines/[id] - Delete production line
 */

// ============================================================================
// GET /api/settings/lines/[id] - Get Production Line by ID (AC-007.7)
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
    const result = await getProductionLineById(id)

    if (!result.success) {
      if (result.error?.includes('not found') || result.error?.includes('Line not found')) {
        return NextResponse.json(
          { error: 'Production line not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to fetch production line' },
        { status: 500 }
      )
    }

    return NextResponse.json({ line: result.data }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/settings/lines/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/settings/lines/[id] - Update Production Line (AC-007.6)
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

    // Check authorization: Admin only (AC-007.6)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateProductionLineSchema.parse(body)

    // Call service method
    const result = await updateProductionLine(id, validatedData)

    if (!result.success) {
      // Handle specific error messages
      if (result.error?.includes('not found') || result.error?.includes('Line not found')) {
        return NextResponse.json(
          { error: 'Production line not found' },
          { status: 404 }
        )
      }

      if (result.error?.includes('unique') || result.error?.includes('already exists')) {
        return NextResponse.json(
          { error: result.error || 'Production line code already exists' },
          { status: 409 }
        )
      }

      if (result.error?.includes('warehouse') && result.error?.includes('location')) {
        return NextResponse.json(
          { error: result.error || 'Output location must be within the selected warehouse' },
          { status: 400 }
        )
      }

      if (result.error?.includes('work orders')) {
        return NextResponse.json(
          {
            error: result.error || 'Cannot change warehouse - line has active work orders',
            warning: true
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to update production line' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        line: result.data,
        message: 'Production line updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/settings/lines/[id]:', error)

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
// DELETE /api/settings/lines/[id] - Delete Production Line (AC-007.5)
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

    // Check authorization: Admin only (AC-007.5)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Call service method
    const result = await deleteProductionLine(id)

    if (!result.success) {
      // Handle specific error messages
      if (result.error?.includes('not found') || result.error?.includes('Line not found')) {
        return NextResponse.json(
          { error: 'Production line not found' },
          { status: 404 }
        )
      }

      if (result.error?.includes('work orders') || result.error?.includes('active')) {
        return NextResponse.json(
          {
            error: result.error || 'Cannot delete production line - it has active work orders. Archive it instead.',
            code: 'HAS_DEPENDENCIES'
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to delete production line' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Production line deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/settings/lines/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
