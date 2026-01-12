/**
 * API Route: POST /api/warehouse/grns/from-to/[toId]
 * Story: 05.12 - GRN from TO
 * Purpose: Create GRN with License Plates from Transfer Order
 *
 * Request Body:
 * {
 *   warehouse_id: string (UUID) - must match TO destination
 *   location_id: string (UUID)
 *   notes?: string
 *   items: [{
 *     to_line_id: string (UUID)
 *     received_qty: number
 *     variance_reason?: string - required if qty != remaining
 *     batch_number?: string
 *     supplier_batch_number?: string
 *     expiry_date?: string (YYYY-MM-DD)
 *     manufacture_date?: string (YYYY-MM-DD)
 *     location_id?: string (UUID) - override default
 *     notes?: string
 *   }]
 * }
 *
 * Response (201 Created):
 * {
 *   grn: { id, grn_number, status, from_warehouse_id, to_warehouse_id, ... }
 *   items: [{ id, product_name, shipped_qty, received_qty, variance_qty, lp_id, lp_number, ... }]
 *   to_status: string
 *   variances: [{ to_line_id, product_name, shipped_qty, received_qty, variance_qty, variance_pct }]
 *   lps_created: number
 * }
 *
 * Errors:
 * - 400: Invalid input, TO not receivable, wrong warehouse, variance without reason
 * - 401: Unauthorized
 * - 404: TO not found
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createGRNFromTOSchema } from '@/lib/validation/grn'
import { GRNFromTOService, type CreateGRNFromTOInput } from '@/lib/services/grn-to-service'

interface RouteParams {
  params: Promise<{ toId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { toId } = await params

    // 1. Validate toId is UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(toId)) {
      return NextResponse.json(
        { error: 'Invalid TO ID format' },
        { status: 400 }
      )
    }

    // 2. Create Supabase client with auth
    const supabase = await createServerSupabase()

    // 3. Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 4. Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.org_id) {
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 401 }
      )
    }

    const orgId = userData.org_id

    // 5. Parse and validate request body
    const body = await request.json()
    const validationResult = createGRNFromTOSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const input: CreateGRNFromTOInput = {
      to_id: toId,
      warehouse_id: validationResult.data.warehouse_id,
      location_id: validationResult.data.location_id,
      notes: validationResult.data.notes,
      items: validationResult.data.items.map(item => ({
        to_line_id: item.to_line_id,
        received_qty: item.received_qty,
        variance_reason: item.variance_reason ?? undefined,
        batch_number: item.batch_number ?? undefined,
        supplier_batch_number: item.supplier_batch_number ?? undefined,
        expiry_date: item.expiry_date ?? undefined,
        manufacture_date: item.manufacture_date ?? undefined,
        location_id: item.location_id ?? undefined,
        notes: item.notes ?? undefined,
      })),
    }

    // 6. Validate receipt before creating
    const validation = await GRNFromTOService.validateReceipt(input, orgId, supabase)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Receipt validation failed',
          details: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      )
    }

    // 7. Create GRN via RPC (atomic transaction)
    const result = await GRNFromTOService.createFromTO(input, orgId, user.id, supabase)

    // 8. Return success response with warnings if any
    return NextResponse.json(
      {
        ...result,
        warnings: validation.warnings,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating GRN from TO:', error)

    // Handle specific errors
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('not found')) {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      )
    }

    if (message.includes('Cannot receive') ||
        message.includes('Receipt must occur') ||
        message.includes('required')) {
      return NextResponse.json(
        { error: message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create GRN', details: message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/warehouse/grns/from-to/[toId]
 * Get TO details for receiving (lines with shipped/received/remaining quantities)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { toId } = await params

    // 1. Validate toId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(toId)) {
      return NextResponse.json(
        { error: 'Invalid TO ID format' },
        { status: 400 }
      )
    }

    // 2. Create Supabase client
    const supabase = await createServerSupabase()

    // 3. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 4. Get user's org_id
    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!userData?.org_id) {
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 401 }
      )
    }

    // 5. Get TO details
    const to = await GRNFromTOService.getTOForReceipt(toId, userData.org_id, supabase)

    // 6. Validate TO status
    const statusValidation = GRNFromTOService.validateTOForReceipt(to.status)
    if (!statusValidation.valid) {
      return NextResponse.json(
        { error: statusValidation.errors[0] },
        { status: 400 }
      )
    }

    // 7. Get TO lines
    const lines = await GRNFromTOService.getTOLinesForReceipt(toId, supabase)

    // 8. Get warehouse settings
    const settings = await GRNFromTOService.getWarehouseSettings(userData.org_id, supabase)

    return NextResponse.json({
      transfer_order: to,
      lines,
      settings: {
        require_batch_on_receipt: settings.require_batch_on_receipt,
        require_expiry_on_receipt: settings.require_expiry_on_receipt,
      },
    })
  } catch (error) {
    console.error('Error getting TO for receipt:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('not found')) {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to get TO details', details: message },
      { status: 500 }
    )
  }
}
