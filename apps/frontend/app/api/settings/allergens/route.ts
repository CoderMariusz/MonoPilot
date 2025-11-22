import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  createAllergenSchema,
  allergenFiltersSchema,
  type AllergenFilters,
} from '@/lib/validation/allergen-schemas'
import {
  createAllergen,
  listAllergens,
} from '@/lib/services/allergen-service'
import { ZodError } from 'zod'

/**
 * Allergen API Routes
 * Story: 1.9 Allergen Management
 * Task 5: API Endpoints
 *
 * GET /api/settings/allergens - List allergens with filters (AC-008.5)
 * POST /api/settings/allergens - Create new custom allergen (AC-008.3)
 */

// ============================================================================
// GET /api/settings/allergens - List Allergens (AC-008.5)
// ============================================================================

export async function GET(request: NextRequest) {
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

    // Get current user to verify org_id (RLS enforced at database level)
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Note: GET is allowed for all authenticated users
    // They can view allergens for their organization

    // Parse query parameters for filtering and sorting (AC-008.5)
    const searchParams = request.nextUrl.searchParams
    const isMajorParam = searchParams.get('is_major')
    const isCustomParam = searchParams.get('is_custom')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sort_by')
    const sortDirection = searchParams.get('sort_direction')

    // Convert string params to boolean or 'all'
    const isMajor =
      isMajorParam === 'true' ? true :
      isMajorParam === 'false' ? false :
      isMajorParam === 'all' ? 'all' as const :
      undefined

    const isCustom =
      isCustomParam === 'true' ? true :
      isCustomParam === 'false' ? false :
      isCustomParam === 'all' ? 'all' as const :
      undefined

    // Validate filters
    const filters: AllergenFilters = allergenFiltersSchema.parse({
      is_major: isMajor,
      is_custom: isCustom,
      search: search || undefined,
      sort_by: sortBy || undefined,
      sort_direction: sortDirection || undefined,
    })

    // Call service method
    const result = await listAllergens(filters)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch allergens' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        allergens: result.data || [],
        total: result.total || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/settings/allergens:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
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
// POST /api/settings/allergens - Create Custom Allergen (AC-008.3)
// ============================================================================

export async function POST(request: NextRequest) {
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

    // Check authorization: Admin only (AC-008.3)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required to create allergens' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createAllergenSchema.parse(body)

    // Call service method
    const result = await createAllergen(validatedData)

    if (!result.success) {
      // Handle specific error codes
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
        { error: result.error || 'Failed to create allergen' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        allergen: result.data,
        message: 'Allergen created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/settings/allergens:', error)

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
