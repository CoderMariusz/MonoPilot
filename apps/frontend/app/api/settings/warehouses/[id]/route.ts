import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  updateWarehouseSchema,
  type UpdateWarehouseInput,
} from '@/lib/validation/warehouse-schemas'
import {
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
} from '@/lib/services/warehouse-service'
import { ZodError } from 'zod'

/**
 * Warehouse By ID API Routes
 * Story: 1.5 Warehouse Configuration
 * Task 4: API Endpoints
 *
 * GET /api/settings/warehouses/[id] - Get warehouse by ID
 * PATCH /api/settings/warehouses/[id] - Update warehouse
 * DELETE /api/settings/warehouses/[id] - Delete warehouse
 */

// ============================================================================
// GET /api/settings/warehouses/[id] - Get Warehouse By ID
// ============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const params = await context.params
    const { id } = params

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
      .select('role')
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
    const result = await getWarehouseById(id)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Warehouse not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to fetch warehouse' },
        { status: 500 }
      )
    }

    return NextResponse.json({ warehouse: result.data }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/settings/warehouses/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH /api/settings/warehouses/[id] - Update Warehouse (AC-004.5)
// ============================================================================

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const params = await context.params
    const { id } = params

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
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization: Admin only (AC-004.5)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData: UpdateWarehouseInput = updateWarehouseSchema.parse(body)

    // Call service method
    const result = await updateWarehouse(id, validatedData)

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Warehouse not found' },
          { status: 404 }
        )
      }

      if (result.code === 'DUPLICATE_CODE') {
        return NextResponse.json(
          { error: result.error || 'Warehouse code already exists' },
          { status: 409 }
        )
      }

      if (result.code === 'FOREIGN_KEY_CONSTRAINT') {
        return NextResponse.json(
          { error: result.error || 'Invalid location reference' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to update warehouse' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        warehouse: result.data,
        message: 'Warehouse updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PATCH /api/settings/warehouses/[id]:', error)

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
// DELETE /api/settings/warehouses/[id] - Delete Warehouse (AC-004.4)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const params = await context.params
    const { id } = params

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
      .select('role')
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
    const result = await deleteWarehouse(id)

    if (!result.success) {
      // AC-004.4: Foreign key constraint error
      if (result.code === 'FOREIGN_KEY_CONSTRAINT') {
        return NextResponse.json(
          {
            error: result.error || 'Cannot delete warehouse with active entities',
            suggestion: 'Archive the warehouse instead',
          },
          { status: 409 }
        )
      }

      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Warehouse not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to delete warehouse' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Warehouse deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/settings/warehouses/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
