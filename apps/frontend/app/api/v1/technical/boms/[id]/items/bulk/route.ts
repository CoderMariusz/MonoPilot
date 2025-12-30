/**
 * Bulk Import BOM Items API Route (Story 02.5b)
 * POST /api/v1/technical/boms/[id]/items/bulk
 *
 * Bulk create BOM items from import (CSV/JSON):
 * - Accepts array of items (max defined by BOM_ITEM_LIMITS.MAX_BULK_IMPORT)
 * - Auto-increment sequence if not provided
 * - Auto-calculate yield_percent for byproducts
 * - Return 201 on full success, 207 on partial success
 * - Include detailed errors per row
 *
 * @module api/v1/technical/boms/[id]/items/bulk
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { bulkImportSchema } from '@/lib/validation/bom-items'
import { BOM_ITEM_LIMITS, BOM_ITEM_DEFAULTS } from '@/lib/constants/bom-items'

/**
 * Error object for bulk import failures
 */
interface BulkImportError {
  row: number
  error: string
}

/**
 * Result object for bulk import operation
 */
interface BulkImportResult {
  created: number
  total: number
  items: unknown[]
  errors: BulkImportError[]
}

/**
 * Process a single item for bulk import
 *
 * @param item - Item data from request
 * @param index - 0-based index in the items array
 * @param bomId - UUID of the BOM
 * @param bomOutputQty - Output quantity of the BOM (for yield calculation)
 * @param currentSequence - Current sequence counter (mutated)
 * @param supabase - Supabase client
 * @returns Created item or null if failed, plus any error
 */
async function processItem(
  item: {
    product_id: string
    quantity: number
    uom: string
    sequence?: number
    scrap_percent?: number
    operation_seq?: number | null
    consume_whole_lp?: boolean
    line_ids?: string[] | null
    is_by_product?: boolean
    yield_percent?: number | null
    condition_flags?: Record<string, boolean> | null
    notes?: string | null
  },
  index: number,
  bomId: string,
  bomOutputQty: number,
  sequenceRef: { current: number },
  supabase: ReturnType<typeof createServerSupabase> extends Promise<infer T> ? T : never
): Promise<{ item: unknown | null; error: BulkImportError | null }> {
  try {
    // Auto-increment sequence if not provided
    const sequence = item.sequence !== undefined
      ? item.sequence
      : (sequenceRef.current += BOM_ITEM_DEFAULTS.SEQUENCE_INCREMENT)

    // Auto-calculate yield_percent for byproducts if not provided
    let yieldPercent = item.yield_percent
    if (item.is_by_product && !yieldPercent && bomOutputQty > 0) {
      yieldPercent = Math.round((item.quantity / bomOutputQty) * 10000) / 100
    }

    // Validate byproduct has yield_percent
    if (item.is_by_product && (yieldPercent === null || yieldPercent === undefined)) {
      return {
        item: null,
        error: {
          row: index + 1,
          error: 'yield_percent is required when is_by_product=true',
        },
      }
    }

    // Normalize empty line_ids to null
    const lineIds = item.line_ids && item.line_ids.length === 0
      ? BOM_ITEM_DEFAULTS.LINE_IDS
      : item.line_ids

    // Insert item
    const { data, error } = await supabase
      .from('bom_items')
      .insert({
        bom_id: bomId,
        product_id: item.product_id,
        quantity: item.quantity,
        uom: item.uom,
        sequence,
        scrap_percent: item.scrap_percent ?? BOM_ITEM_DEFAULTS.SCRAP_PERCENT,
        operation_seq: item.operation_seq ?? null,
        consume_whole_lp: item.consume_whole_lp ?? BOM_ITEM_DEFAULTS.CONSUME_WHOLE_LP,
        line_ids: lineIds,
        is_by_product: item.is_by_product ?? BOM_ITEM_DEFAULTS.IS_BY_PRODUCT,
        is_output: item.is_by_product ?? BOM_ITEM_DEFAULTS.IS_OUTPUT,
        yield_percent: yieldPercent,
        condition_flags: item.condition_flags,
        notes: item.notes ?? null,
      })
      .select(`
        *,
        products:product_id (
          code,
          name,
          type,
          base_uom
        )
      `)
      .single()

    if (error) {
      return {
        item: null,
        error: {
          row: index + 1,
          error: error.message || 'Failed to create item',
        },
      }
    }

    // Format response item
    const formattedItem = {
      ...data,
      product_code: data.products?.code,
      product_name: data.products?.name,
      product_type: data.products?.type,
      product_base_uom: data.products?.base_uom,
    }
    delete (formattedItem as Record<string, unknown>).products

    return { item: formattedItem, error: null }
  } catch (err) {
    return {
      item: null,
      error: {
        row: index + 1,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
    }
  }
}

/**
 * POST handler for bulk importing BOM items
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing BOM id
 * @returns JSON response with import results
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bomId } = await params
    const supabase = await createServerSupabase()

    // Parse request body
    const body = await request.json()

    // Validate request structure
    const validation = bulkImportSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      )
    }

    const { items } = validation.data

    // Check item count limit
    if (items.length > BOM_ITEM_LIMITS.MAX_BULK_IMPORT) {
      return NextResponse.json(
        { error: `Maximum ${BOM_ITEM_LIMITS.MAX_BULK_IMPORT} items allowed per bulk import` },
        { status: 400 }
      )
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'At least 1 item is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify BOM exists and user has access
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id, output_qty, org_id')
      .eq('id', bomId)
      .single()

    if (bomError || !bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    // Get max existing sequence for auto-increment
    const { data: existingItems } = await supabase
      .from('bom_items')
      .select('sequence')
      .eq('bom_id', bomId)
      .order('sequence', { ascending: false })
      .limit(1)

    const maxSequence = existingItems?.[0]?.sequence || 0

    // Process items
    const results: BulkImportResult = {
      created: 0,
      total: items.length,
      items: [],
      errors: [],
    }

    const sequenceRef = { current: maxSequence }

    for (let i = 0; i < items.length; i++) {
      const { item, error } = await processItem(
        items[i],
        i,
        bomId,
        bom.output_qty,
        sequenceRef,
        supabase
      )

      if (error) {
        results.errors.push(error)
      } else if (item) {
        results.items.push(item)
        results.created++
      }
    }

    // Determine status code: 201 for full success, 207 for partial
    const statusCode = results.errors.length > 0 ? 207 : 201

    return NextResponse.json(results, { status: statusCode })
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
