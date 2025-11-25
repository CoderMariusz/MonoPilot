import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { assignProductsSchema } from '@/lib/validation/routing-schemas'
import { assignProductsToRouting } from '@/lib/services/routing-service'
import { ZodError } from 'zod'

/**
 * Routing-Product Assignment API Routes
 * Story: 2.17 Routing-Product Assignment
 *
 * GET /api/technical/routings/:id/products - List assigned products
 * PUT /api/technical/routings/:id/products - Assign products to routing
 */

// ============================================================================
// GET /api/technical/routings/:id/products - List Assigned Products (AC-017.4)
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

    // Get current user's org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch assigned products with product details
    const { data: assignments, error } = await supabase
      .from('product_routings')
      .select(`
        id,
        product_id,
        is_default,
        created_at,
        product:products(id, code, name, type)
      `)
      .eq('routing_id', id)

    if (error) {
      console.error('Error fetching product assignments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assigned products' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      products: assignments || [],
    })
  } catch (error) {
    console.error('Error in GET /api/technical/routings/:id/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/technical/routings/:id/products - Assign Products (AC-017)
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

    // Check authorization: Admin or Technical only (AC-017.6)
    if (!['admin', 'technical'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Technical role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = assignProductsSchema.parse(body)

    // Call service method
    const result = await assignProductsToRouting(
      id,
      validatedData.product_ids,
      validatedData.default_product_id
    )

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Routing not found' },
          { status: 404 }
        )
      }

      if (result.code === 'NOT_REUSABLE') {
        return NextResponse.json(
          { error: result.error || 'Routing is not reusable' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to assign products to routing' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Products assigned to routing successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/technical/routings/:id/products:', error)

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
