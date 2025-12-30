import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { calculateBOMYield, getBOMYield, updateBOMYield } from '@/lib/services/bom-service'
import { updateYieldRequestSchema } from '@/lib/validation/bom-advanced-schemas'
import { ZodError } from 'zod'

/**
 * BOM Yield API
 * Story: 02.14 - BOM Advanced Features
 * FR-2.34: BOM yield calculation
 *
 * GET /api/technical/boms/:id/yield - Get yield analysis for BOM
 * PUT /api/technical/boms/:id/yield - Update yield configuration
 */

// ============================================================================
// GET - Get yield analysis (Story 02.14)
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
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check for legacy quantity parameter (backward compatibility)
    const searchParams = request.nextUrl.searchParams
    const quantityParam = searchParams.get('quantity')

    if (quantityParam) {
      // Legacy mode - use old calculateBOMYield function
      const quantity = parseFloat(quantityParam)
      if (isNaN(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: 'Invalid quantity parameter. Must be a positive number.' },
          { status: 400 }
        )
      }
      const result = await calculateBOMYield(id, quantity)
      return NextResponse.json(result)
    }

    // New advanced yield analysis (Story 02.14)
    const result = await getBOMYield(id)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/technical/boms/[id]/yield:', error)

    if (error instanceof Error) {
      switch (error.message) {
        case 'BOM_NOT_FOUND':
          return NextResponse.json(
            { error: 'BOM not found', code: 'BOM_NOT_FOUND' },
            { status: 404 }
          )
        case 'Unauthorized':
          return NextResponse.json(
            { error: 'Unauthorized', code: 'UNAUTHORIZED' },
            { status: 401 }
          )
      }

      if (error.message.includes('Failed to fetch BOM')) {
        return NextResponse.json(
          { error: 'BOM not found', code: 'BOM_NOT_FOUND' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT - Update yield configuration (Story 02.14)
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
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check write permission
    if (!['admin', 'technical', 'production_manager'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Cannot modify BOM', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateYieldRequestSchema.parse(body)

    // Call service method
    const result = await updateBOMYield(id, validatedData)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error in PUT /api/technical/boms/[id]/yield:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      switch (error.message) {
        case 'BOM_NOT_FOUND':
          return NextResponse.json(
            { error: 'BOM not found', code: 'BOM_NOT_FOUND' },
            { status: 404 }
          )
        case 'INVALID_YIELD':
          return NextResponse.json(
            { error: 'Yield percent must be between 0 and 100', code: 'INVALID_YIELD' },
            { status: 400 }
          )
        case 'Unauthorized':
          return NextResponse.json(
            { error: 'Unauthorized', code: 'UNAUTHORIZED' },
            { status: 401 }
          )
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
