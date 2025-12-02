import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CreateBOMItemSchema } from '@/lib/validation/bom-schemas'
import { listBomItems, createBomItem } from '@/lib/services/bom-item-service'
import { ZodError } from 'zod'

/**
 * BOM Items API Routes - Story 2.26
 *
 * GET /api/technical/boms/:id/items - List BOM items
 * POST /api/technical/boms/:id/items - Add new item to BOM
 */

// ============================================================================
// GET /api/technical/boms/:id/items - List items (AC-2.26.3)
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for grouping option
    const { searchParams } = new URL(request.url)
    const groupByOperation = searchParams.get('group_by_operation') === 'true'

    const result = await listBomItems(id, { groupByOperation })

    // Check if grouped response
    if ('operations' in result) {
      return NextResponse.json({ data: result }, { status: 200 })
    }

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/technical/boms/[id]/items:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === 'BOM_NOT_FOUND') {
      return NextResponse.json({ error: 'BOM_NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/technical/boms/:id/items - Add item (AC-2.26.4)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const validatedData = CreateBOMItemSchema.parse(body)

    // Create item via service
    const item = await createBomItem(id, validatedData)

    return NextResponse.json(
      {
        data: item,
        message: 'BOM item added successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/technical/boms/[id]/items:', error)

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

    if (message === 'DUPLICATE_ITEM') {
      return NextResponse.json(
        { error: 'DUPLICATE_ITEM', message: 'Component already exists for this operation' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
