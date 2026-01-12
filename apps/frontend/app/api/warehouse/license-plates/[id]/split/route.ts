/**
 * LP Split API Route (Story 05.17)
 * POST /api/warehouse/license-plates/:id/split
 *
 * Execute LP split operation - creates new LP with split quantity
 *
 * Request Body:
 * - splitQty: number (required) - Quantity to split off
 * - destinationLocationId: string (optional) - New LP location (defaults to source)
 *
 * Business Rules:
 * - Settings toggle must be enabled (enable_split_merge)
 * - Source LP must have status='available'
 * - splitQty must be < source.quantity
 * - Creates genealogy record (operation_type='split')
 * - Transaction is atomic (rollback on error)
 *
 * Acceptance Criteria Coverage:
 * - AC-14: Success Response
 * - AC-15: Validation Error Response
 * - AC-16: LP Not Found
 * - AC-17: Settings Disabled
 * - AC-22: RLS Permission Check
 * - AC-23: Performance <300ms
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { SplitLPSchema } from '@/lib/validation/lp-split-schema'
import { LPSplitService } from '@/lib/services/lp-split-service'
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
    const { splitQty, destinationLocationId } = validatedData

    // 3. Check warehouse settings
    const { data: settings, error: settingsError } = await supabase
      .from('warehouse_settings')
      .select('org_id, enable_split_merge')
      .single()

    if (settingsError) {
      return NextResponse.json(
        { error: 'Failed to fetch warehouse settings' },
        { status: 500 }
      )
    }

    if (!settings?.enable_split_merge) {
      return NextResponse.json(
        {
          error: 'Split/merge operations are disabled',
          message: "Enable 'enable_split_merge' in warehouse settings to use this feature",
        },
        { status: 403 }
      )
    }

    const orgId = settings.org_id

    // 4. Fetch source LP (RLS enforces org_id isolation)
    const { data: sourceLp, error: lpError } = await supabase
      .from('license_plates')
      .select(`
        *,
        location:locations(id, name),
        warehouse:warehouses(id, name)
      `)
      .eq('id', lpId)
      .single()

    if (lpError || !sourceLp) {
      return NextResponse.json(
        { error: 'License Plate not found', lpId },
        { status: 404 }
      )
    }

    // 5. Check org_id isolation (should be enforced by RLS, but double-check)
    if (sourceLp.org_id !== orgId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // 6. Validate LP status
    if (sourceLp.status !== 'available') {
      return NextResponse.json(
        {
          error: `Cannot split LP. Status must be 'available'. Current status: ${sourceLp.status}`,
          details: {
            currentStatus: sourceLp.status,
          },
        },
        { status: 400 }
      )
    }

    // 7. Validate split quantity
    if (splitQty >= sourceLp.quantity) {
      return NextResponse.json(
        {
          error: 'Split quantity must be less than LP quantity',
          details: {
            splitQty,
            currentQty: sourceLp.quantity,
          },
        },
        { status: 400 }
      )
    }

    // 8. Execute split via RPC
    const { data: splitResult, error: splitError } = await supabase.rpc(
      'split_license_plate',
      {
        p_source_lp_id: lpId,
        p_org_id: orgId,
        p_split_qty: splitQty,
        p_destination_location_id: destinationLocationId || sourceLp.location_id,
        p_user_id: user.id,
      }
    )

    if (splitError) {
      console.error('Split RPC error:', splitError)
      return NextResponse.json(
        { error: splitError.message || 'Split operation failed' },
        { status: 500 }
      )
    }

    // 9. Return success response
    return NextResponse.json(splitResult)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/warehouse/license-plates/:id/split:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
