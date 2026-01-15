import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CreateBOMSchema, CreateBOMItemSchema } from '@/lib/validation/bom-schemas'
import { z, ZodError } from 'zod'

/**
 * BOM with Items API - Single request creation
 *
 * POST /api/technical/boms/with-items
 * Creates BOM + all items in one request to avoid 500 errors
 * with the 2-step save process.
 */

// Schema for the combined request
const CreateBOMWithItemsSchema = CreateBOMSchema.extend({
  items: z.array(CreateBOMItemSchema).min(1, 'At least one item is required'),
})

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
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      console.error('User lookup error:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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
    const validatedData = CreateBOMWithItemsSchema.parse(body)
    const { items: itemsData, ...bomData } = validatedData

    // Validate items - no empty items array
    if (itemsData.length === 0) {
      return NextResponse.json(
        { error: 'At least one component is required' },
        { status: 400 }
      )
    }

    // Get next version for this product
    const { data: existingBoms } = await supabase
      .from('boms')
      .select('version')
      .eq('product_id', bomData.product_id)
      .eq('org_id', currentUser.org_id)
      .order('version', { ascending: false })
      .limit(1)

    const nextVersion = existingBoms && existingBoms.length > 0
      ? (existingBoms[0].version || 0) + 1
      : 1

    // Create BOM
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .insert({
        org_id: currentUser.org_id,
        product_id: bomData.product_id,
        version: nextVersion,
        effective_from: bomData.effective_from,
        effective_to: bomData.effective_to || null,
        status: bomData.status || 'draft',
        output_qty: bomData.output_qty || 1,
        output_uom: bomData.output_uom,
        yield_percent: bomData.yield_percent || 100,
        notes: bomData.notes || null,
        routing_id: bomData.routing_id || null,
        units_per_box: bomData.units_per_box || null,
        boxes_per_pallet: bomData.boxes_per_pallet || null,
        created_by: session.user.id,
        updated_by: session.user.id,
      })
      .select('*')
      .single()

    if (bomError || !bom) {
      console.error('BOM creation error:', bomError)
      throw new Error(bomError?.message || 'Failed to create BOM')
    }

    // Validate all components exist before inserting
    const componentIds = itemsData.map(item => item.component_id)
    const { data: validComponents, error: compError } = await supabase
      .from('products')
      .select('id, org_id')
      .in('id', componentIds)

    if (compError) {
      // Rollback BOM
      await supabase.from('boms').delete().eq('id', bom.id)
      throw new Error('Failed to validate components')
    }

    // Check all components exist and belong to same org
    const validComponentIds = new Set(
      (validComponents || [])
        .filter(c => c.org_id === currentUser.org_id)
        .map(c => c.id)
    )

    const invalidComponents = componentIds.filter(id => !validComponentIds.has(id))
    if (invalidComponents.length > 0) {
      // Rollback BOM
      await supabase.from('boms').delete().eq('id', bom.id)
      return NextResponse.json(
        { error: `Invalid components: ${invalidComponents.join(', ')}` },
        { status: 400 }
      )
    }

    // Check for self-reference in input items
    const selfReferenceItems = itemsData.filter(
      item => item.component_id === bomData.product_id && !item.is_output
    )
    if (selfReferenceItems.length > 0) {
      // Rollback BOM
      await supabase.from('boms').delete().eq('id', bom.id)
      return NextResponse.json(
        { error: 'Input items cannot reference the BOM product itself' },
        { status: 400 }
      )
    }

    // Prepare items for insertion
    const itemsToInsert = itemsData.map((item, index) => ({
      bom_id: bom.id,
      product_id: item.component_id,
      operation_seq: item.operation_seq || 1,
      is_output: item.is_output || false,
      quantity: item.quantity,
      uom: item.uom,
      scrap_percent: item.scrap_percent || 0,
      sequence: item.sequence || index + 1,
      consume_whole_lp: item.consume_whole_lp || false,
      notes: item.notes || null,
    }))

    // Insert all items
    const { data: insertedItems, error: itemsError } = await supabase
      .from('bom_items')
      .insert(itemsToInsert)
      .select(`
        *,
        component:products!product_id (
          id,
          code,
          name,
          base_uom,
          product_type:product_types(code, name)
        )
      `)

    if (itemsError) {
      console.error('Items insertion error:', itemsError)
      // Rollback BOM
      await supabase.from('boms').delete().eq('id', bom.id)
      throw new Error(`Failed to create BOM items: ${itemsError.message}`)
    }

    // Fetch the product info for the response
    const { data: product } = await supabase
      .from('products')
      .select('id, code, name, uom, product_type:product_types(code, name)')
      .eq('id', bom.product_id)
      .single()

    return NextResponse.json(
      {
        bom: {
          ...bom,
          product,
        },
        items: insertedItems,
        message: `BOM v${nextVersion} created with ${insertedItems?.length || 0} items`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/technical/boms/with-items:', error)

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
