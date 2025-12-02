import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CreateBOMItemAlternativeSchema } from '@/lib/validation/bom-schemas'
import { listBomItemAlternatives, createBomItemAlternative } from '@/lib/services/bom-item-alternative-service'
import { ZodError } from 'zod'

/**
 * BOM Item Alternatives API Routes - Story 2.27
 *
 * GET /api/technical/boms/:id/items/:itemId/alternatives - List alternatives
 * POST /api/technical/boms/:id/items/:itemId/alternatives - Add alternative
 */

// ============================================================================
// GET - List alternatives (AC-2.27.3)
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const alternatives = await listBomItemAlternatives(id, itemId)

    return NextResponse.json({ data: alternatives }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/technical/boms/[id]/items/[itemId]/alternatives:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === 'ITEM_NOT_FOUND') {
      return NextResponse.json({ error: 'ITEM_NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Add alternative (AC-2.27.4)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()

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
    const validatedData = CreateBOMItemAlternativeSchema.parse(body)

    // Create alternative via service
    const alternative = await createBomItemAlternative(id, itemId, validatedData)

    return NextResponse.json(
      {
        data: alternative,
        message: 'Alternative added successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/technical/boms/[id]/items/[itemId]/alternatives:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === 'BOM_NOT_FOUND') {
      return NextResponse.json({ error: 'BOM_NOT_FOUND' }, { status: 404 })
    }

    if (message === 'ITEM_NOT_FOUND') {
      return NextResponse.json({ error: 'ITEM_NOT_FOUND' }, { status: 404 })
    }

    if (message === 'INVALID_ALTERNATIVE_COMPONENT') {
      return NextResponse.json(
        { error: 'INVALID_ALTERNATIVE_COMPONENT', message: 'Alternative component not found' },
        { status: 400 }
      )
    }

    if (message === 'SELF_REFERENCE') {
      return NextResponse.json(
        { error: 'SELF_REFERENCE', message: 'Alternative cannot be same as primary component' },
        { status: 400 }
      )
    }

    if (message === 'DUPLICATE_ALTERNATIVE') {
      return NextResponse.json(
        { error: 'DUPLICATE_ALTERNATIVE', message: 'This alternative already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
