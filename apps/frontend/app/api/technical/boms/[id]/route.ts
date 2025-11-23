import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { UpdateBOMSchema } from '@/lib/validation/bom-schemas'
import { getBOMById, updateBOM, deleteBOM } from '@/lib/services/bom-service'
import { ZodError } from 'zod'

/**
 * Individual BOM API Routes
 * Story: 2.6 BOM CRUD
 *
 * GET /api/technical/boms/[id] - Get single BOM with details
 * PUT /api/technical/boms/[id] - Update BOM
 * DELETE /api/technical/boms/[id] - Delete BOM (cascades to items)
 */

// ============================================================================
// GET /api/technical/boms/[id] - Get single BOM (AC-2.6.1)
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Get current user to check org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if include_items query param is set
    const searchParams = request.nextUrl.searchParams
    const include_items = searchParams.get('include_items') === 'true'

    // Call service method
    const bom = await getBOMById(params.id, include_items)

    if (!bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    return NextResponse.json({ bom }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/technical/boms/[id]:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/technical/boms/[id] - Update BOM (AC-2.6.4)
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Check authorization: Admin or Technical only
    if (!['admin', 'technical'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Technical role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = UpdateBOMSchema.parse(body)

    // Call service method
    const bom = await updateBOM(params.id, validatedData)

    return NextResponse.json(
      {
        bom,
        message: 'BOM updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/technical/boms/[id]:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('date range overlaps')) {
        return NextResponse.json(
          {
            error: 'BOM_DATE_OVERLAP',
            message: 'Date range overlaps with existing BOM for this product',
          },
          { status: 400 }
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
// DELETE /api/technical/boms/[id] - Delete BOM (AC-2.6.6)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Check authorization: Admin or Technical only
    if (!['admin', 'technical'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Technical role required' },
        { status: 403 }
      )
    }

    // Verify BOM exists before deletion
    const bom = await getBOMById(params.id)
    if (!bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    // Call service method (cascades to bom_items)
    await deleteBOM(params.id)

    return NextResponse.json(
      {
        message: `BOM v${bom.version} deleted successfully`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/technical/boms/[id]:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
