import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { UpdateBOMItemSchema } from '@/lib/validation/bom-schemas'
import { updateBomItem, deleteBomItem } from '@/lib/services/bom-item-service'
import { ZodError } from 'zod'

/**
 * BOM Item API Routes - Story 2.26
 *
 * PUT /api/technical/boms/:id/items/:itemId - Update BOM item
 * DELETE /api/technical/boms/:id/items/:itemId - Delete BOM item
 */

// ============================================================================
// PUT /api/technical/boms/:id/items/:itemId - Update item (AC-2.26.5)
// ============================================================================

export async function PUT(
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
    const validatedData = UpdateBOMItemSchema.parse(body)

    // Update item via service
    const item = await updateBomItem(id, itemId, validatedData)

    return NextResponse.json(
      {
        data: item,
        message: 'BOM item updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/technical/boms/[id]/items/[itemId]:', error)

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

    if (message === 'INVALID_COMPONENT') {
      return NextResponse.json(
        { error: 'INVALID_COMPONENT', message: 'Component not found' },
        { status: 400 }
      )
    }

    if (message === 'SELF_REFERENCE') {
      return NextResponse.json(
        { error: 'SELF_REFERENCE', message: 'Input item cannot reference BOM product' },
        { status: 400 }
      )
    }

    if (message === 'OPERATION_NOT_FOUND') {
      return NextResponse.json(
        { error: 'INVALID_OPERATION_SEQ', message: 'Operation sequence not found in routing' },
        { status: 400 }
      )
    }

    if (message === 'LINE_NOT_IN_BOM') {
      return NextResponse.json(
        { error: 'LINE_NOT_IN_BOM', message: 'Line not assigned to BOM' },
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
// DELETE /api/technical/boms/:id/items/:itemId - Delete item (AC-2.26.6)
// ============================================================================

export async function DELETE(
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

    // Delete item via service
    await deleteBomItem(id, itemId)

    return NextResponse.json(
      { message: 'BOM item deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/technical/boms/[id]/items/[itemId]:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === 'BOM_NOT_FOUND') {
      return NextResponse.json({ error: 'BOM_NOT_FOUND' }, { status: 404 })
    }

    if (message === 'ITEM_NOT_FOUND') {
      return NextResponse.json({ error: 'ITEM_NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
