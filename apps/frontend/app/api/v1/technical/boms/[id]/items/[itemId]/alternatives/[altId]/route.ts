/**
 * BOM Alternative Single Item API Route (Story 02.6)
 *
 * PUT /api/v1/technical/boms/:id/items/:itemId/alternatives/:altId - Update alternative
 * DELETE /api/v1/technical/boms/:id/items/:itemId/alternatives/:altId - Delete alternative
 *
 * Auth: Required
 * PUT Roles: ADMIN, SUPER_ADMIN, PRODUCTION_MANAGER (technical.U)
 * DELETE Roles: ADMIN, SUPER_ADMIN (technical.D)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateAlternativeSchema } from '@/lib/validation/bom-alternative'
import type { AlternativeResponse, DeleteAlternativeResponse } from '@/lib/types/bom-alternative'

interface RouteParams {
  id: string
  itemId: string
  altId: string
}

/**
 * PUT /api/v1/technical/boms/:id/items/:itemId/alternatives/:altId
 * Update an alternative
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id: bomId, itemId, altId } = await params
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user org_id and role
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
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orgId = userData.org_id
    const roleCode = (userData.role as any)?.code || ''
    const techPerm = (userData.role as any)?.permissions?.technical || ''

    // Check permissions - need technical.U
    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin' || roleCode === 'owner'
    const hasTechUpdate = techPerm.includes('U')

    if (!isAdmin && !hasTechUpdate) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Validate request body
    const validation = updateAlternativeSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      const errorCode = getErrorCode(firstError)
      return NextResponse.json(
        {
          error: errorCode,
          message: firstError.message,
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { quantity, uom, preference_order, notes } = validation.data

    // Verify BOM exists and belongs to user's org
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id, org_id')
      .eq('id', bomId)
      .single()

    if (bomError || !bom) {
      return NextResponse.json(
        { error: 'BOM_NOT_FOUND', message: 'BOM not found' },
        { status: 404 }
      )
    }

    if (bom.org_id !== orgId) {
      return NextResponse.json(
        { error: 'BOM_NOT_FOUND', message: 'BOM not found' },
        { status: 404 }
      )
    }

    // Verify BOM item exists
    const { data: item, error: itemError } = await supabase
      .from('bom_items')
      .select('id')
      .eq('id', itemId)
      .eq('bom_id', bomId)
      .single()

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'ITEM_NOT_FOUND', message: 'BOM item not found' },
        { status: 404 }
      )
    }

    // Verify alternative exists
    const { data: existingAlt, error: altError } = await supabase
      .from('bom_alternatives')
      .select(`
        *,
        product:products!alternative_product_id (
          id,
          code,
          name,
          type
        )
      `)
      .eq('id', altId)
      .eq('bom_item_id', itemId)
      .eq('org_id', orgId)
      .single()

    if (altError || !existingAlt) {
      return NextResponse.json(
        { error: 'ALTERNATIVE_NOT_FOUND', message: 'Alternative not found' },
        { status: 404 }
      )
    }

    // Build update object
    const updateData: Record<string, any> = {}
    if (quantity !== undefined) updateData.quantity = quantity
    if (uom !== undefined) updateData.uom = uom
    if (preference_order !== undefined) updateData.preference_order = preference_order
    if (notes !== undefined) updateData.notes = notes

    // Update alternative
    const { data: updatedAlt, error: updateError } = await supabase
      .from('bom_alternatives')
      .update(updateData)
      .eq('id', altId)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating alternative:', updateError)
      return NextResponse.json(
        { error: 'UPDATE_FAILED', message: 'Failed to update alternative' },
        { status: 500 }
      )
    }

    const response: AlternativeResponse = {
      alternative: {
        id: updatedAlt.id,
        bom_item_id: updatedAlt.bom_item_id,
        alternative_product_id: updatedAlt.alternative_product_id,
        alternative_product_code: (existingAlt.product as any)?.code || '',
        alternative_product_name: (existingAlt.product as any)?.name || '',
        alternative_product_type: (existingAlt.product as any)?.type || '',
        quantity: updatedAlt.quantity,
        uom: updatedAlt.uom,
        preference_order: updatedAlt.preference_order,
        notes: updatedAlt.notes,
        created_at: updatedAlt.created_at,
      },
      message: 'Alternative updated successfully',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unexpected error in PUT alternative:', error)
    return NextResponse.json(
      { error: 'UPDATE_FAILED', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/technical/boms/:id/items/:itemId/alternatives/:altId
 * Delete an alternative
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id: bomId, itemId, altId } = await params
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user org_id and role
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
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orgId = userData.org_id
    const roleCode = (userData.role as any)?.code || ''
    const techPerm = (userData.role as any)?.permissions?.technical || ''

    // Check permissions - need technical.D
    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin' || roleCode === 'owner'
    const hasTechDelete = techPerm.includes('D')

    if (!isAdmin && !hasTechDelete) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Verify BOM exists and belongs to user's org
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id, org_id')
      .eq('id', bomId)
      .single()

    if (bomError || !bom) {
      return NextResponse.json(
        { error: 'BOM_NOT_FOUND', message: 'BOM not found' },
        { status: 404 }
      )
    }

    if (bom.org_id !== orgId) {
      return NextResponse.json(
        { error: 'BOM_NOT_FOUND', message: 'BOM not found' },
        { status: 404 }
      )
    }

    // Verify BOM item exists
    const { data: item, error: itemError } = await supabase
      .from('bom_items')
      .select('id')
      .eq('id', itemId)
      .eq('bom_id', bomId)
      .single()

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'ITEM_NOT_FOUND', message: 'BOM item not found' },
        { status: 404 }
      )
    }

    // Verify alternative exists
    const { data: existingAlt, error: altError } = await supabase
      .from('bom_alternatives')
      .select('id')
      .eq('id', altId)
      .eq('bom_item_id', itemId)
      .eq('org_id', orgId)
      .single()

    if (altError || !existingAlt) {
      return NextResponse.json(
        { error: 'ALTERNATIVE_NOT_FOUND', message: 'Alternative not found' },
        { status: 404 }
      )
    }

    // Delete alternative
    const { error: deleteError } = await supabase
      .from('bom_alternatives')
      .delete()
      .eq('id', altId)
      .eq('org_id', orgId)

    if (deleteError) {
      console.error('Error deleting alternative:', deleteError)
      return NextResponse.json(
        { error: 'DELETE_FAILED', message: 'Failed to delete alternative' },
        { status: 500 }
      )
    }

    const response: DeleteAlternativeResponse = {
      success: true,
      message: 'Alternative deleted successfully',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unexpected error in DELETE alternative:', error)
    return NextResponse.json(
      { error: 'DELETE_FAILED', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Map validation error to error code
 */
function getErrorCode(error: any): string {
  const path = error.path?.[0]
  const message = error.message?.toLowerCase() || ''

  if (path === 'quantity') {
    if (message.includes('greater than 0') || message.includes('positive')) {
      return 'INVALID_QUANTITY'
    }
    if (message.includes('decimal')) {
      return 'INVALID_QUANTITY'
    }
  }

  if (path === 'preference_order') {
    if (message.includes('2 or higher') || message.includes('reserved')) {
      return 'PREFERENCE_TOO_LOW'
    }
  }

  return 'INVALID_REQUEST'
}
