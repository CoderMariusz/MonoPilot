/**
 * Bulk Import BOM Items API Route (Story 02.5b)
 * POST /api/v1/technical/boms/[id]/items/bulk
 *
 * Bulk create BOM items from import (CSV/JSON):
 * - Accepts array of items (max 500)
 * - Auto-increment sequence if not provided
 * - Auto-calculate yield_percent for byproducts
 * - Return 201 on full success, 207 on partial success
 * - Include detailed errors per row
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { bulkImportSchema } from '@/lib/validation/bom-items'

interface BulkImportError {
  row: number
  error: string
}

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
    if (items.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 items allowed per bulk import' },
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
    const results = {
      created: 0,
      total: items.length,
      items: [] as any[],
      errors: [] as BulkImportError[],
    }

    let sequenceCounter = maxSequence

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        // Auto-increment sequence if not provided
        const sequence = item.sequence !== undefined ? item.sequence : (sequenceCounter += 10)

        // Auto-calculate yield_percent for byproducts if not provided
        let yieldPercent = item.yield_percent
        if (item.is_by_product && !yieldPercent && bom.output_qty > 0) {
          yieldPercent = Math.round((item.quantity / bom.output_qty) * 10000) / 100
        }

        // Validate byproduct has yield_percent
        if (item.is_by_product && (yieldPercent === null || yieldPercent === undefined)) {
          results.errors.push({
            row: i + 1,
            error: 'yield_percent is required when is_by_product=true',
          })
          continue
        }

        // Normalize empty line_ids to null
        const lineIds = item.line_ids && item.line_ids.length === 0 ? null : item.line_ids

        // Insert item
        const { data, error } = await supabase
          .from('bom_items')
          .insert({
            bom_id: bomId,
            product_id: item.product_id,
            quantity: item.quantity,
            uom: item.uom,
            sequence,
            scrap_percent: item.scrap_percent ?? 0,
            operation_seq: item.operation_seq ?? null,
            consume_whole_lp: item.consume_whole_lp ?? false,
            line_ids: lineIds,
            is_by_product: item.is_by_product ?? false,
            is_output: item.is_by_product ?? false,
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
          results.errors.push({
            row: i + 1,
            error: error.message || 'Failed to create item',
          })
          continue
        }

        // Format response item
        const formattedItem = {
          ...data,
          product_code: data.products?.code,
          product_name: data.products?.name,
          product_type: data.products?.type,
          product_base_uom: data.products?.base_uom,
        }
        delete formattedItem.products

        results.items.push(formattedItem)
        results.created++
      } catch (err) {
        results.errors.push({
          row: i + 1,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    // Determine status code
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
