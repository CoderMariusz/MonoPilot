/**
 * BOM Clone API Route (Story 02.6)
 *
 * POST /api/v1/technical/boms/:id/clone - Clone BOM to target product
 *
 * Auth: Required
 * Roles: ADMIN, SUPER_ADMIN, PRODUCTION_MANAGER (technical.C)
 *
 * Features:
 * - Clone to same product (version increment)
 * - Clone to different product (version 1 or next)
 * - Copy all non-byproduct items
 * - Preserve routing, output_qty, output_uom
 * - Set status to draft
 * - Validate effective date overlap
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { cloneBOMSchema } from '@/lib/validation/bom-clone'
import type { CloneBOMResponse } from '@/lib/types/bom-clone'

/**
 * POST /api/v1/technical/boms/:id/clone
 * Clone BOM to target product
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceBomId } = await params
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

    // Check permissions - need technical.C permission
    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin' || roleCode === 'owner'
    const hasTechCreate = techPerm.includes('C')

    if (!isAdmin && !hasTechCreate) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions to clone BOM' },
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
    const validation = cloneBOMSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Invalid request body',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { target_product_id, effective_from, effective_to, notes } = validation.data

    // Get source BOM with items (RLS enforces org isolation)
    const { data: sourceBom, error: bomError } = await supabase
      .from('boms')
      .select(`
        *,
        product:products!product_id (
          id,
          code,
          name
        )
      `)
      .eq('id', sourceBomId)
      .single()

    if (bomError || !sourceBom) {
      return NextResponse.json(
        { error: 'BOM_NOT_FOUND', message: 'Source BOM not found' },
        { status: 404 }
      )
    }

    // Verify target product exists and belongs to same org
    const { data: targetProduct, error: productError } = await supabase
      .from('products')
      .select('id, code, name, org_id')
      .eq('id', target_product_id)
      .single()

    if (productError || !targetProduct) {
      return NextResponse.json(
        { error: 'PRODUCT_NOT_FOUND', message: 'Target product not found' },
        { status: 404 }
      )
    }

    if (targetProduct.org_id !== orgId) {
      return NextResponse.json(
        { error: 'PRODUCT_NOT_FOUND', message: 'Target product not found' },
        { status: 404 }
      )
    }

    // Set effective_from to today if not provided
    const today = new Date().toISOString().split('T')[0]
    const cloneEffectiveFrom = effective_from || today

    // Check for date overlap with existing BOMs for target product
    const { data: existingBOMs, error: overlapError } = await supabase
      .from('boms')
      .select('id, version, effective_from, effective_to')
      .eq('product_id', target_product_id)
      .eq('org_id', orgId)

    if (!overlapError && existingBOMs && existingBOMs.length > 0) {
      const newFrom = new Date(cloneEffectiveFrom)
      const newTo = effective_to ? new Date(effective_to) : null

      for (const existing of existingBOMs) {
        const existingFrom = new Date(existing.effective_from)
        const existingTo = existing.effective_to ? new Date(existing.effective_to) : null

        // Check overlap
        const newEndsBeforeExisting = newTo && newTo < existingFrom
        const newStartsAfterExisting = existingTo && newFrom > existingTo

        if (!newEndsBeforeExisting && !newStartsAfterExisting) {
          return NextResponse.json(
            {
              error: 'DATE_OVERLAP',
              message: `Date range overlaps with existing BOM v${existing.version}`,
            },
            { status: 400 }
          )
        }
      }
    }

    // Get next version for target product
    const { data: versionBOMs } = await supabase
      .from('boms')
      .select('version')
      .eq('product_id', target_product_id)
      .eq('org_id', orgId)
      .order('version', { ascending: false })
      .limit(1)

    const nextVersion = versionBOMs && versionBOMs.length > 0
      ? versionBOMs[0].version + 1
      : 1

    // Get source BOM items (non-byproducts only)
    const { data: sourceItems, error: itemsError } = await supabase
      .from('bom_items')
      .select('*')
      .eq('bom_id', sourceBomId)

    // Filter out byproducts if the column exists
    const nonByproductItems = (sourceItems || []).filter(
      (item: any) => !item.is_by_product
    )

    // Create new BOM
    const { data: newBom, error: createError } = await supabase
      .from('boms')
      .insert({
        org_id: orgId,
        product_id: target_product_id,
        version: nextVersion,
        status: 'Draft', // Always draft for cloned BOM
        routing_id: sourceBom.routing_id,
        effective_from: cloneEffectiveFrom,
        effective_to: effective_to || null,
        output_qty: sourceBom.output_qty,
        output_uom: sourceBom.output_uom,
        units_per_box: sourceBom.units_per_box,
        boxes_per_pallet: sourceBom.boxes_per_pallet,
        notes: notes || `Cloned from BOM-${sourceBomId.substring(0, 8)}`,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (createError || !newBom) {
      console.error('Error creating cloned BOM:', createError)
      return NextResponse.json(
        { error: 'CLONE_FAILED', message: 'Failed to create cloned BOM' },
        { status: 500 }
      )
    }

    // Clone items if source has items
    let itemsCount = 0
    if (nonByproductItems.length > 0) {
      const itemsToInsert = nonByproductItems.map((item: any) => ({
        bom_id: newBom.id,
        product_id: item.product_id,
        quantity: item.quantity,
        uom: item.uom,
        sequence: item.sequence,
        operation_seq: item.operation_seq,
        scrap_percent: item.scrap_percent,
        notes: item.notes,
        created_by: user.id,
        updated_by: user.id,
      }))

      const { error: insertItemsError } = await supabase
        .from('bom_items')
        .insert(itemsToInsert)

      if (insertItemsError) {
        console.error('Error cloning BOM items:', insertItemsError)
        // Rollback: delete the created BOM
        await supabase.from('boms').delete().eq('id', newBom.id)
        return NextResponse.json(
          { error: 'CLONE_FAILED', message: 'Failed to clone BOM items' },
          { status: 500 }
        )
      }

      itemsCount = itemsToInsert.length
    }

    // Build response
    const response: CloneBOMResponse = {
      bom: {
        id: newBom.id,
        product_id: newBom.product_id,
        product_code: targetProduct.code,
        product_name: targetProduct.name,
        version: newBom.version,
        status: 'draft',
        effective_from: newBom.effective_from,
        effective_to: newBom.effective_to,
        routing_id: newBom.routing_id,
        items_count: itemsCount,
        created_at: newBom.created_at,
      },
      message: 'BOM cloned successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in BOM clone:', error)
    return NextResponse.json(
      { error: 'CLONE_FAILED', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
