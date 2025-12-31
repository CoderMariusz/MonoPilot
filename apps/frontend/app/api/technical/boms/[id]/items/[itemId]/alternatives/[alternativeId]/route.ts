import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { UpdateBOMItemAlternativeSchema } from '@/lib/validation/bom-schemas'
import { updateBomItemAlternative, deleteBomItemAlternative } from '@/lib/services/bom-item-alternative-service'
import { ZodError } from 'zod'

/**
 * BOM Item Alternative API Routes - Story 2.27
 *
 * PUT /api/technical/boms/:id/items/:itemId/alternatives/:alternativeId - Update
 * DELETE /api/technical/boms/:id/items/:itemId/alternatives/:alternativeId - Delete
 */

// ============================================================================
// PUT - Update alternative (AC-2.27.5)
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; alternativeId: string }> }
) {
  try {
    const { id, itemId, alternativeId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
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
    const validatedData = UpdateBOMItemAlternativeSchema.parse(body)

    // Update alternative via service
    const alternative = await updateBomItemAlternative(id, itemId, alternativeId, validatedData)

    return NextResponse.json(
      {
        data: alternative,
        message: 'Alternative updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/technical/boms/[id]/items/[itemId]/alternatives/[alternativeId]:', error)

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

    if (message === 'ALTERNATIVE_NOT_FOUND') {
      return NextResponse.json({ error: 'ALTERNATIVE_NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Delete alternative (AC-2.27.6)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; alternativeId: string }> }
) {
  try {
    const { id, itemId, alternativeId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
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

    // Delete alternative via service
    await deleteBomItemAlternative(id, itemId, alternativeId)

    return NextResponse.json(
      { message: 'Alternative deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/technical/boms/[id]/items/[itemId]/alternatives/[alternativeId]:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === 'BOM_NOT_FOUND') {
      return NextResponse.json({ error: 'BOM_NOT_FOUND' }, { status: 404 })
    }

    if (message === 'ITEM_NOT_FOUND') {
      return NextResponse.json({ error: 'ITEM_NOT_FOUND' }, { status: 404 })
    }

    if (message === 'ALTERNATIVE_NOT_FOUND') {
      return NextResponse.json({ error: 'ALTERNATIVE_NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
