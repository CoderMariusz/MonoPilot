import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateAllergenSchema } from '@/lib/validation/allergen-schemas'
import {
  getAllergenById,
  updateAllergen,
  deleteAllergen,
} from '@/lib/services/allergen-service'
import { ZodError } from 'zod'

/**
 * Allergen API Routes - Single Resource
 * Story: 1.9 Allergen Management
 * Task 5: API Endpoints
 *
 * GET /api/settings/allergens/[id] - Get allergen by ID
 * PUT /api/settings/allergens/[id] - Update allergen (AC-008.4)
 * DELETE /api/settings/allergens/[id] - Delete custom allergen (AC-008.2, AC-008.4)
 */

interface RouteContext {
  params: Promise<{ id: string }>
}

// ============================================================================
// GET /api/settings/allergens/[id] - Get Allergen By ID
// ============================================================================

export async function GET(
  request: NextRequest,
  context: RouteContext
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

    // Get allergen ID from route params
    const { id } = await context.params

    // Call service method
    const result = await getAllergenById(id)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Allergen not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to fetch allergen' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { allergen: result.data },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/settings/allergens/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/settings/allergens/[id] - Update Allergen (AC-008.4)
// ============================================================================

export async function PUT(
  request: NextRequest,
  context: RouteContext
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

    // Check authorization: Admin only (AC-008.4)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required to update allergens' },
        { status: 403 }
      )
    }

    // Get allergen ID from route params
    const { id } = await context.params

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateAllergenSchema.parse(body)

    // Call service method
    const result = await updateAllergen(id, validatedData)

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Allergen not found' },
          { status: 404 }
        )
      }

      if (result.code === 'DUPLICATE_CODE') {
        return NextResponse.json(
          { error: result.error || 'Allergen code already exists' },
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
        { error: result.error || 'Failed to update allergen' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        allergen: result.data,
        message: 'Allergen updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/settings/allergens/[id]:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
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
// DELETE /api/settings/allergens/[id] - Delete Custom Allergen (AC-008.2, AC-008.4)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  context: RouteContext
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

    // Check authorization: Admin only (AC-008.4)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required to delete allergens' },
        { status: 403 }
      )
    }

    // Get allergen ID from route params
    const { id } = await context.params

    // Call service method
    const result = await deleteAllergen(id)

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Allergen not found' },
          { status: 404 }
        )
      }

      // AC-008.2: Cannot delete preloaded allergens
      if (result.code === 'PRELOADED_ALLERGEN') {
        return NextResponse.json(
          {
            error: 'Cannot delete EU major allergen',
            message: 'Only custom allergens can be deleted',
          },
          { status: 403 }
        )
      }

      // AC-008.4: Cannot delete allergen in use
      if (result.code === 'IN_USE') {
        return NextResponse.json(
          {
            error: 'Cannot delete allergen',
            message: 'This allergen is currently used by one or more products',
          },
          { status: 409 }
        )
      }

      if (result.code === 'FOREIGN_KEY_CONSTRAINT') {
        return NextResponse.json(
          {
            error: 'Cannot delete allergen',
            message: 'This allergen is currently in use',
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to delete allergen' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Allergen deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/settings/allergens/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
