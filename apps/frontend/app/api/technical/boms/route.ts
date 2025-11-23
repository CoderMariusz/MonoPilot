import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CreateBOMSchema } from '@/lib/validation/bom-schemas'
import { createBOM, getBOMs } from '@/lib/services/bom-service'
import { ZodError } from 'zod'

/**
 * BOM API Routes
 * Story: 2.6 BOM CRUD
 *
 * GET /api/technical/boms - List BOMs with filters
 * POST /api/technical/boms - Create new BOM with auto-versioning
 */

// ============================================================================
// GET /api/technical/boms - List BOMs (AC-2.6.1)
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

    // Get current user to check org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const product_id = searchParams.get('product_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const effective_date = searchParams.get('effective_date')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build filters
    const filters: any = {}
    if (product_id) filters.product_id = product_id
    if (status) filters.status = status
    if (search) filters.search = search
    if (effective_date) filters.effective_date = effective_date
    filters.limit = limit
    filters.offset = offset

    // Call service method
    const boms = await getBOMs(filters)

    return NextResponse.json(
      {
        boms,
        total: boms.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/technical/boms:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/technical/boms - Create BOM (AC-2.6.2, AC-2.6.3)
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

    // Check authorization: Admin or Technical only
    if (!['admin', 'technical'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Technical role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = CreateBOMSchema.parse(body)

    // Call service method (auto-assigns version)
    const bom = await createBOM(validatedData)

    return NextResponse.json(
      {
        bom,
        message: `BOM v${bom.version} created successfully`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/technical/boms:', error)

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
