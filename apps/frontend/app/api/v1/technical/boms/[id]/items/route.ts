/**
 * BOM Items API Routes (Story 02.5a)
 *
 * GET /api/v1/technical/boms/:id/items - List all items for a BOM
 * POST /api/v1/technical/boms/:id/items - Create a new BOM item
 *
 * Auth: Required
 * GET Roles: All authenticated users (technical.R)
 * POST Roles: owner, admin, production_manager (technical.C)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createBOMItemSchema } from '@/lib/validation/bom-items'
import type { BOMItem, BOMItemsListResponse, BOMItemResponse, BOMItemWarning } from '@/lib/types/bom-items'

/**
 * GET /api/v1/technical/boms/:id/items
 * List all items for a BOM with product details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bomId } = await params
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify BOM exists and get its details (RLS enforces org isolation)
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id, output_qty, output_uom, routing_id')
      .eq('id', bomId)
      .single()

    if (bomError || !bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    // Fetch items with product join
    const { data: items, error: itemsError } = await supabase
      .from('bom_items')
      .select(`
        id,
        bom_id,
        product_id,
        quantity,
        uom,
        sequence,
        operation_seq,
        scrap_percent,
        notes,
        created_at,
        updated_at,
        product:products!product_id (
          id,
          code,
          name,
          type,
          base_uom
        )
      `)
      .eq('bom_id', bomId)
      .order('sequence', { ascending: true })

    if (itemsError) {
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    // Get operation names if routing exists
    let operations: Record<number, string> = {}
    if (bom.routing_id) {
      const { data: ops } = await supabase
        .from('routing_operations')
        .select('sequence, operation_name')
        .eq('routing_id', bom.routing_id)

      if (ops) {
        operations = Object.fromEntries(ops.map(o => [o.sequence, o.operation_name]))
      }
    }

    // Transform items to include product details
    const transformedItems: BOMItem[] = (items || []).map((item: any) => ({
      id: item.id,
      bom_id: item.bom_id,
      product_id: item.product_id,
      product_code: item.product?.code || '',
      product_name: item.product?.name || '',
      product_type: item.product?.type || 'UNKNOWN',
      product_base_uom: item.product?.base_uom || '',
      quantity: item.quantity,
      uom: item.uom,
      sequence: item.sequence,
      operation_seq: item.operation_seq,
      operation_name: item.operation_seq ? operations[item.operation_seq] || null : null,
      scrap_percent: item.scrap_percent || 0,
      notes: item.notes,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }))

    const response: BOMItemsListResponse = {
      items: transformedItems,
      total: transformedItems.length,
      bom_output_qty: bom.output_qty,
      bom_output_uom: bom.output_uom,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('GET /api/v1/technical/boms/[id]/items error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/v1/technical/boms/:id/items
 * Create a new BOM item
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bomId } = await params
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

    // Check permission - need technical.C (Create)
    const roleCode = (userData.role as any)?.code || ''
    const hasCreatePerm = ['owner', 'admin', 'production_manager'].includes(roleCode)

    if (!hasCreatePerm) {
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

    // Parse and validate request body
    const body = await request.json()
    const validation = createBOMItemSchema.safeParse(body)

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

    // Auto-sequence if not provided
    let sequence = data.sequence
    if (sequence === undefined || sequence === 0) {
      const { data: maxSeqItem } = await supabase
        .from('bom_items')
        .select('sequence')
        .eq('bom_id', bomId)
        .order('sequence', { ascending: false })
        .limit(1)
        .single()

      sequence = (maxSeqItem?.sequence || 0) + 10
    }

    // Get component product for UoM check
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, code, name, type, base_uom')
      .eq('id', data.product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Component product not found' }, { status: 404 })
    }

    // Insert item
    const { data: item, error: insertError } = await supabase
      .from('bom_items')
      .insert({
        bom_id: bomId,
        product_id: data.product_id,
        quantity: data.quantity,
        uom: data.uom,
        sequence,
        operation_seq: data.operation_seq || null,
        scrap_percent: data.scrap_percent || 0,
        notes: data.notes || null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      // Check for constraint violations
      if (insertError.code === '23514') {
        return NextResponse.json(
          { error: 'Quantity must be greater than 0' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Check for UoM mismatch warning
    const warnings: BOMItemWarning[] = []
    if (product.base_uom !== data.uom) {
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
      product_code: product.code,
      product_name: product.name,
      product_type: product.type,
      product_base_uom: product.base_uom,
      quantity: item.quantity,
      uom: item.uom,
      sequence: item.sequence,
      operation_seq: item.operation_seq,
      operation_name: null, // Would need routing lookup
      scrap_percent: item.scrap_percent || 0,
      notes: item.notes,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }

    const response: BOMItemResponse = {
      item: responseItem,
      warnings,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/technical/boms/[id]/items error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
