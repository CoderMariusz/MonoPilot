/**
 * BOM Item Single API Routes (Story 02.5a)
 *
 * PUT /api/v1/technical/boms/:id/items/:itemId - Update a BOM item
 * DELETE /api/v1/technical/boms/:id/items/:itemId - Delete a BOM item
 *
 * Auth: Required
 * PUT Roles: owner, admin, production_manager, quality_manager (technical.U)
 * DELETE Roles: owner, admin (technical.D)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateBOMItemSchema } from '@/lib/validation/bom-items'
import type { BOMItem, BOMItemResponse, BOMItemWarning } from '@/lib/types/bom-items'

/**
 * PUT /api/v1/technical/boms/:id/items/:itemId
 * Update an existing BOM item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: bomId, itemId } = await params
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role for permission check
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        org_id,
        role:roles (
          code,
          permissions
        )
      `)
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission - need technical.U (Update)
    const roleCode = (userData.role as any)?.code || ''
    const hasUpdatePerm = ['owner', 'admin', 'production_manager', 'quality_manager'].includes(roleCode)

    if (!hasUpdatePerm) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Verify BOM exists (RLS enforces org isolation)
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id, routing_id')
      .eq('id', bomId)
      .single()

    if (bomError || !bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    // Verify item exists and belongs to this BOM
    const { data: existingItem, error: itemError } = await supabase
      .from('bom_items')
      .select('id, product_id')
      .eq('id', itemId)
      .eq('bom_id', bomId)
      .single()

    if (itemError || !existingItem) {
      return NextResponse.json({ error: 'BOM item not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = updateBOMItemSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json(
        { error: firstError.message, details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Validate operation_seq if provided
    if (data.operation_seq !== undefined && data.operation_seq !== null) {
      if (!bom.routing_id) {
        return NextResponse.json(
          { error: 'Cannot assign operation: BOM has no routing assigned' },
          { status: 400 }
        )
      }

      const { data: op, error: opError } = await supabase
        .from('routing_operations')
        .select('sequence')
        .eq('routing_id', bom.routing_id)
        .eq('sequence', data.operation_seq)
        .single()

      if (opError || !op) {
        return NextResponse.json(
          { error: 'Operation does not exist in assigned routing' },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: Record<string, any> = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }

    if (data.quantity !== undefined) updateData.quantity = data.quantity
    if (data.uom !== undefined) updateData.uom = data.uom
    if (data.sequence !== undefined) updateData.sequence = data.sequence
    if (data.operation_seq !== undefined) updateData.operation_seq = data.operation_seq
    if (data.scrap_percent !== undefined) updateData.scrap_percent = data.scrap_percent
    if (data.notes !== undefined) updateData.notes = data.notes

    // Update item
    const { data: item, error: updateError } = await supabase
      .from('bom_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('bom_id', bomId)
      .select()
      .single()

    if (updateError) {
      // Check for constraint violations
      if (updateError.code === '23514') {
        return NextResponse.json(
          { error: 'Quantity must be greater than 0' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Get product details for response
    const { data: product } = await supabase
      .from('products')
      .select('id, code, name, type, base_uom')
      .eq('id', item.product_id)
      .single()

    // Get operation name if assigned
    let operationName: string | null = null
    if (item.operation_seq && bom.routing_id) {
      const { data: op } = await supabase
        .from('routing_operations')
        .select('operation_name')
        .eq('routing_id', bom.routing_id)
        .eq('sequence', item.operation_seq)
        .single()

      operationName = op?.operation_name || null
    }

    // Check for UoM mismatch warning
    const warnings: BOMItemWarning[] = []
    if (product && data.uom && product.base_uom !== data.uom) {
      warnings.push({
        code: 'UOM_MISMATCH',
        message: 'UoM does not match component base UoM',
        details: `Component base UoM is '${product.base_uom}', you entered '${data.uom}'`,
      })
    }

    // Build response item
    const responseItem: BOMItem = {
      id: item.id,
      bom_id: item.bom_id,
      product_id: item.product_id,
      product_code: product?.code || '',
      product_name: product?.name || '',
      product_type: product?.type || 'UNKNOWN',
      product_base_uom: product?.base_uom || '',
      quantity: item.quantity,
      uom: item.uom,
      sequence: item.sequence,
      operation_seq: item.operation_seq,
      operation_name: operationName,
      scrap_percent: item.scrap_percent || 0,
      notes: item.notes,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }

    const response: BOMItemResponse = {
      item: responseItem,
      warnings,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('PUT /api/v1/technical/boms/[id]/items/[itemId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/technical/boms/:id/items/:itemId
 * Delete a BOM item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: bomId, itemId } = await params
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role for permission check
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        org_id,
        role:roles (
          code,
          permissions
        )
      `)
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission - need technical.D (Delete)
    const roleCode = (userData.role as any)?.code || ''
    const hasDeletePerm = ['owner', 'admin'].includes(roleCode)

    if (!hasDeletePerm) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Verify BOM exists (RLS enforces org isolation)
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id')
      .eq('id', bomId)
      .single()

    if (bomError || !bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    // Verify item exists and belongs to this BOM
    const { data: existingItem, error: itemError } = await supabase
      .from('bom_items')
      .select('id')
      .eq('id', itemId)
      .eq('bom_id', bomId)
      .single()

    if (itemError || !existingItem) {
      return NextResponse.json({ error: 'BOM item not found' }, { status: 404 })
    }

    // Delete item
    const { error: deleteError } = await supabase
      .from('bom_items')
      .delete()
      .eq('id', itemId)
      .eq('bom_id', bomId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'BOM item deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/v1/technical/boms/[id]/items/[itemId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
