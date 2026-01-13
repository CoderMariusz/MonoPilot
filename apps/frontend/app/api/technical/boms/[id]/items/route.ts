import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CreateBOMItemSchema } from '@/lib/validation/bom-schemas'
import { listBomItems } from '@/lib/services/bom-item-service'
import { ZodError } from 'zod'

/**
 * BOM Items API Routes - Story 2.26
 *
 * GET /api/technical/boms/:id/items - List BOM items
 * POST /api/technical/boms/:id/items - Create BOM item
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

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const groupByOperation = searchParams.get('groupByOperation') === 'true'

    // Get items via service
    const items = await listBomItems(id, { groupByOperation })

    return NextResponse.json({ data: items }, { status: 200 })
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
// POST /api/technical/boms/:id/items - Create item (AC-2.26.4)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('POST /api/technical/boms/[id]/items - BOM ID:', id)

    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      console.log('Auth error:', authError, 'Session:', session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('User ID:', session.user.id)

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      console.log('User error:', userError, 'Current user:', currentUser)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    console.log('User org_id:', currentUser.org_id, 'Role:', currentUser.role)

    // Extract role code from joined data
    const roleData = currentUser.role as unknown as { code: string } | null
    const userRole = roleData?.code?.toLowerCase() || ''

    // Check authorization: Admin or Technical only
    if (!['admin', 'technical'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Technical role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    console.log('Request body:', body)
    const validatedData = CreateBOMItemSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Verify BOM exists and belongs to user's org
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id, org_id, product_id, routing_id')
      .eq('id', id)
      .single()

    console.log('BOM lookup result:', { bom, bomError })

    if (bomError || !bom) {
      console.log('BOM not found for id:', id)
      return NextResponse.json({ error: 'BOM_NOT_FOUND' }, { status: 404 })
    }

    // Validate component exists and belongs to same org
    const { data: component, error: compError } = await supabase
      .from('products')
      .select('id, org_id')
      .eq('id', validatedData.component_id)
      .single()

    if (compError || !component) {
      return NextResponse.json(
        { error: 'INVALID_COMPONENT', message: 'Component not found' },
        { status: 400 }
      )
    }

    if (component.org_id !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'INVALID_COMPONENT', message: 'Component belongs to different organization' },
        { status: 400 }
      )
    }

    // Check self-reference (only allowed for outputs)
    if (validatedData.component_id === bom.product_id && !validatedData.is_output) {
      return NextResponse.json(
        { error: 'SELF_REFERENCE', message: 'Input item cannot reference BOM product' },
        { status: 400 }
      )
    }

    // Insert item directly
    const { data: newItem, error: insertError } = await supabase
      .from('bom_items')
      .insert({
        bom_id: id,
        component_id: validatedData.component_id,
        operation_seq: validatedData.operation_seq,
        is_output: validatedData.is_output ?? false,
        quantity: validatedData.quantity,
        uom: validatedData.uom,
        scrap_percent: validatedData.scrap_percent ?? 0,
        sequence: validatedData.sequence ?? 1,
        line_ids: validatedData.line_ids || null,
        consume_whole_lp: validatedData.consume_whole_lp ?? false,
        notes: validatedData.notes || null
      })
      .select(`
        *,
        component:products!component_id (
          id,
          code,
          name,
          uom,
          type
        )
      `)
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'DUPLICATE_ITEM', message: 'Duplicate item not allowed' },
          { status: 409 }
        )
      }
      throw new Error(`Failed to create BOM item: ${insertError.message}`)
    }

    return NextResponse.json(
      {
        data: newItem,
        message: 'BOM item created successfully',
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
        { error: 'DUPLICATE_ITEM', message: 'Duplicate item not allowed' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
