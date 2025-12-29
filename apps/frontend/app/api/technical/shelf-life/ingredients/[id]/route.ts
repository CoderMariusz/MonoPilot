/**
 * API Route: Ingredient Shelf Life Configuration
 * Story: 02.11 - Shelf Life Calculation + Expiry Management
 *
 * Endpoints:
 * - GET /api/technical/shelf-life/ingredients/:id - Get ingredient shelf life
 * - POST /api/technical/shelf-life/ingredients/:id - Update ingredient (triggers recalc)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  getIngredientShelfLife,
  updateIngredientShelfLife,
} from '@/lib/services/shelf-life-service'
import { ingredientShelfLifeSchema } from '@/lib/validation/shelf-life-schemas'

/**
 * GET /api/technical/shelf-life/ingredients/:id
 * Get shelf life configuration for an ingredient
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: ingredientId } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(ingredientId)) {
      return NextResponse.json(
        { error: 'INVALID_UUID', message: 'Invalid ingredient ID format' },
        { status: 400 }
      )
    }

    const ingredient = await getIngredientShelfLife(ingredientId)

    if (!ingredient) {
      return NextResponse.json(
        { error: 'INGREDIENT_NOT_FOUND', message: 'Ingredient not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(ingredient)
  } catch (error) {
    console.error('Error getting ingredient shelf life:', error)

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/technical/shelf-life/ingredients/:id
 * Update ingredient shelf life (triggers recalculation for dependent products)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: ingredientId } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(ingredientId)) {
      return NextResponse.json(
        { error: 'INVALID_UUID', message: 'Invalid ingredient ID format' },
        { status: 400 }
      )
    }

    // Check role permissions
    const { data: userData } = await supabase
      .from('users')
      .select('role:roles!role_id(code)')
      .eq('id', user.id)
      .single()

    // Handle potential array or single object from Supabase join
    const roleData = userData?.role as unknown as { code: string } | { code: string }[] | null
    const roleCode = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code
    const allowedRoles = ['admin', 'production_manager', 'quality_manager']

    if (!roleCode || !allowedRoles.includes(roleCode)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = ingredientShelfLifeSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors
      const firstError = errors[0]

      // Map validation errors to API error codes
      if (firstError?.path?.includes('quarantine_duration')) {
        return NextResponse.json(
          { error: 'QUARANTINE_DURATION_REQUIRED', message: firstError.message },
          { status: 400 }
        )
      }

      if (firstError?.path?.includes('storage_temp')) {
        return NextResponse.json(
          { error: 'INVALID_TEMP_RANGE', message: firstError.message },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: firstError.message, errors },
        { status: 400 }
      )
    }

    // Check if ingredient exists
    const existing = await getIngredientShelfLife(ingredientId)
    if (!existing) {
      return NextResponse.json(
        { error: 'INGREDIENT_NOT_FOUND', message: 'Ingredient not found' },
        { status: 404 }
      )
    }

    // Update ingredient shelf life
    const result = await updateIngredientShelfLife(ingredientId, validationResult.data)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating ingredient shelf life:', error)

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
