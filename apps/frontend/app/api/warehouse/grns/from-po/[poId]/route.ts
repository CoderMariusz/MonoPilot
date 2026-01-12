/**
 * API Route: POST /api/warehouse/grns/from-po/[poId]
 * Story: 05.11 - GRN from PO
 * Purpose: Create GRN with License Plates from Purchase Order
 *
 * Request Body:
 * {
 *   warehouse_id: string (UUID)
 *   location_id: string (UUID)
 *   notes?: string
 *   items: [{
 *     po_line_id: string (UUID)
 *     received_qty: number
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
 *   grn: { id, grn_number, status, ... }
 *   items: [{ id, product_name, lp_id, lp_number, ... }]
 *   po_status: string
 *   over_receipt_warnings: [{ po_line_id, ordered_qty, total_received, over_receipt_pct }]
 * }
 *
 * Errors:
 * - 400: Invalid input, PO not receivable, over-receipt blocked
 * - 401: Unauthorized
 * - 404: PO not found
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createGRNFromPOSchema } from '@/lib/validation/grn'
import { GRNFromPOService } from '@/lib/services/grn-po-service'

interface RouteParams {
  params: Promise<{ poId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { poId } = await params

    // 1. Validate poId is UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(poId)) {
      return NextResponse.json(
        { error: 'Invalid PO ID format' },
        { status: 400 }
      )
    }

    // 2. Create Supabase client with auth
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

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
    const validationResult = createGRNFromPOSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const input = {
      ...validationResult.data,
      po_id: poId,
    }

    // 6. Validate receipt before creating
    const validation = await GRNFromPOService.validateReceipt(input, orgId, supabase)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Receipt validation failed',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // 7. Create GRN via RPC (atomic transaction)
    const result = await GRNFromPOService.createFromPO(input, orgId, user.id, supabase)

    // 8. Return success response
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating GRN from PO:', error)

    // Handle specific errors
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('not found')) {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      )
    }

    if (message.includes('Cannot receive') ||
        message.includes('Over-receipt') ||
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
 * GET /api/warehouse/grns/from-po/[poId]
 * Get PO details for receiving (lines with remaining quantities)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { poId } = await params

    // 1. Validate poId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(poId)) {
      return NextResponse.json(
        { error: 'Invalid PO ID format' },
        { status: 400 }
      )
    }

    // 2. Create Supabase client
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

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

    // 5. Get PO details
    const po = await GRNFromPOService.getPOForReceipt(poId, userData.org_id, supabase)

    // 6. Validate PO status
    const statusValidation = GRNFromPOService.validatePOForReceipt(po.status)
    if (!statusValidation.valid) {
      return NextResponse.json(
        { error: statusValidation.errors[0] },
        { status: 400 }
      )
    }

    // 7. Get PO lines
    const lines = await GRNFromPOService.getPOLinesForReceipt(poId, supabase)

    // 8. Get warehouse settings
    const settings = await GRNFromPOService.getWarehouseSettings(userData.org_id, supabase)

    return NextResponse.json({
      purchase_order: po,
      lines,
      settings: {
        require_batch_on_receipt: settings.require_batch_on_receipt,
        require_expiry_on_receipt: settings.require_expiry_on_receipt,
        allow_over_receipt: settings.allow_over_receipt,
        over_receipt_tolerance_pct: settings.over_receipt_tolerance_pct,
      },
    })
  } catch (error) {
    console.error('Error getting PO for receipt:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('not found')) {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to get PO details', details: message },
      { status: 500 }
    )
  }
}
