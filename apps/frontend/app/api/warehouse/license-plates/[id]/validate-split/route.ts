/**
 * LP Validate Split API Route (Story 05.17)
 * POST /api/warehouse/license-plates/:id/validate-split
 *
 * Validate LP split parameters before execution
 * Used by UI for real-time validation feedback
 *
 * Request Body:
 * - splitQty: number (required) - Quantity to split off
 *
 * Response:
 * - valid: boolean - Whether split is allowed
 * - error: string - Error message if invalid
 * - warning: string - Warning message (non-blocking, e.g. QA status)
 * - sourceQty: number - Current source LP quantity
 * - remainingQty: number - Quantity remaining after split
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { SplitLPSchema } from '@/lib/validation/lp-split-schema'
import { ZodError } from 'zod'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lpId } = await params
    const supabase = await createServerSupabase()

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const validatedData = SplitLPSchema.parse(body)
    const { splitQty } = validatedData

    // 3. Check warehouse settings
    const { data: settings, error: settingsError } = await supabase
      .from('warehouse_settings')
      .select('org_id, enable_split_merge')
      .single()

    if (settingsError || !settings) {
      return NextResponse.json({
        valid: false,
        error: 'Warehouse settings not found',
      })
    }

    if (!settings.enable_split_merge) {
      return NextResponse.json({
        valid: false,
        error: 'Split/merge operations are disabled in settings',
      })
    }

    // 4. Fetch source LP
    const { data: sourceLp, error: lpError } = await supabase
      .from('license_plates')
      .select(`
        id,
        org_id,
        quantity,
        uom,
        status,
        qa_status
      `)
      .eq('id', lpId)
      .single()

    if (lpError || !sourceLp) {
      return NextResponse.json({
        valid: false,
        error: 'License Plate not found',
      })
    }

    // 5. Validate LP status
    if (sourceLp.status !== 'available') {
      return NextResponse.json({
        valid: false,
        error: `Cannot split LP. Status must be 'available'. Current status: ${sourceLp.status}`,
      })
    }

    // 6. Validate split quantity
    if (splitQty <= 0) {
      return NextResponse.json({
        valid: false,
        error: 'Split quantity must be greater than 0',
      })
    }

    if (splitQty >= sourceLp.quantity) {
      return NextResponse.json({
        valid: false,
        error: `Split quantity must be less than LP quantity (${sourceLp.quantity} ${sourceLp.uom})`,
      })
    }

    // 7. Calculate remaining quantity
    const remainingQty = Number((sourceLp.quantity - splitQty).toFixed(4))

    // 8. Check for QA status warning (non-blocking)
    let warning: string | undefined
    if (sourceLp.qa_status && sourceLp.qa_status !== 'passed') {
      warning = `This LP has QA status: ${sourceLp.qa_status}. Split will inherit this status.`
    }

    // 9. Return validation result
    return NextResponse.json({
      valid: true,
      warning,
      sourceQty: sourceLp.quantity,
      remainingQty,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { valid: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/warehouse/license-plates/:id/validate-split:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
