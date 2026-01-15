import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { UpdateBOMSchema, CreateBOMItemSchema } from '@/lib/validation/bom-schemas'
import { z, ZodError } from 'zod'

/**
 * BOM with Items API - Update BOM and items in one request
 *
 * PUT /api/technical/boms/[id]/with-items
 * Updates BOM + replaces all items in one request
 */

// Schema for the combined update request
const UpdateBOMWithItemsSchema = UpdateBOMSchema.extend({
  product_id: z.string().uuid().optional(), // Can include but won't be used
  items: z.array(CreateBOMItemSchema).min(1, 'At least one item is required'),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bomId } = await params
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

    // Check BOM exists and belongs to user's org
    const { data: existingBom, error: bomCheckError } = await supabase
      .from('boms')
      .select('id, org_id, product_id, version')
      .eq('id', bomId)
      .single()

    if (bomCheckError || !existingBom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    if (existingBom.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = UpdateBOMWithItemsSchema.parse(body)
    const { items: itemsData, product_id: _, ...bomData } = validatedData

    // Validate items - no empty items array
    if (itemsData.length === 0) {
      return NextResponse.json(
        { error: 'At least one component is required' },
        { status: 400 }
      )
    }

    // Validate all components exist before updating
    const componentIds = itemsData.map(item => item.component_id)
    const { data: validComponents, error: compError } = await supabase
      .from('products')
      .select('id, org_id')
      .in('id', componentIds)

    if (compError) {
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
      return NextResponse.json(
        { error: `Invalid components: ${invalidComponents.join(', ')}` },
        { status: 400 }
      )
    }

    // Check for self-reference in input items
    const selfReferenceItems = itemsData.filter(
      item => item.component_id === existingBom.product_id && !item.is_output
    )
    if (selfReferenceItems.length > 0) {
      return NextResponse.json(
        { error: 'Input items cannot reference the BOM product itself' },
        { status: 400 }
      )
    }

    // Update BOM header
    const updateData: Record<string, unknown> = {
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    }

    if (bomData.effective_from !== undefined) updateData.effective_from = bomData.effective_from
    if (bomData.effective_to !== undefined) updateData.effective_to = bomData.effective_to || null
    if (bomData.status !== undefined) updateData.status = bomData.status
    if (bomData.output_qty !== undefined) updateData.output_qty = bomData.output_qty
    if (bomData.output_uom !== undefined) updateData.output_uom = bomData.output_uom
    if (bomData.yield_percent !== undefined) updateData.yield_percent = bomData.yield_percent
    if (bomData.notes !== undefined) updateData.notes = bomData.notes || null
    if (bomData.routing_id !== undefined) updateData.routing_id = bomData.routing_id || null
    if (bomData.units_per_box !== undefined) updateData.units_per_box = bomData.units_per_box
    if (bomData.boxes_per_pallet !== undefined) updateData.boxes_per_pallet = bomData.boxes_per_pallet

    const { data: updatedBom, error: bomUpdateError } = await supabase
      .from('boms')
      .update(updateData)
      .eq('id', bomId)
      .select('*')
      .single()

    if (bomUpdateError || !updatedBom) {
      console.error('BOM update error:', bomUpdateError)
      throw new Error(bomUpdateError?.message || 'Failed to update BOM')
    }

    // Delete existing items
    const { error: deleteError } = await supabase
      .from('bom_items')
      .delete()
      .eq('bom_id', bomId)

    if (deleteError) {
      console.error('Items deletion error:', deleteError)
      throw new Error('Failed to update items')
    }

    // Prepare items for insertion
    const itemsToInsert = itemsData.map((item, index) => ({
      bom_id: bomId,
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
      throw new Error(`Failed to update BOM items: ${itemsError.message}`)
    }

    // Fetch the product info for the response
    const { data: product } = await supabase
      .from('products')
      .select('id, code, name, base_uom, product_type:product_types(code, name)')
      .eq('id', existingBom.product_id)
      .single()

    return NextResponse.json({
      bom: {
        ...updatedBom,
        product,
      },
      items: insertedItems,
      message: `BOM v${existingBom.version} updated with ${insertedItems?.length || 0} items`,
    })
  } catch (error) {
    console.error('Error in PUT /api/technical/boms/[id]/with-items:', error)

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
