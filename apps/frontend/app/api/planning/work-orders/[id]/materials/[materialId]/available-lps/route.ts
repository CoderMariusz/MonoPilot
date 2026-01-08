/**
 * API Route: Available LPs for WO Material (Story 03.11b)
 * Purpose: GET endpoint for fetching available LPs for manual reservation
 *
 * Endpoint:
 * - GET /api/planning/work-orders/:id/materials/:materialId/available-lps
 *   Get available LPs for manual reservation selection
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { WOReservationService, WOReservationErrorCode } from '@/lib/services/wo-reservation-service'
import { AvailableLPsQuerySchema } from '@/lib/validation/wo-reservations'

interface RouteParams {
  params: Promise<{
    id: string
    materialId: string
  }>
}

/**
 * GET /api/planning/work-orders/:id/materials/:materialId/available-lps
 * Get available LPs for manual reservation selection
 *
 * Query params:
 * - sort: 'fifo' | 'fefo' (optional)
 * - lot_number: string (optional)
 * - location: string (optional)
 *
 * Response format:
 * {
 *   lps: Array<{
 *     id: string,
 *     lp_number: string,
 *     quantity: number,
 *     available_qty: number,
 *     location: string | null,
 *     expiry_date: string | null,
 *     created_at: string
 *   }>,
 *   total_available: number
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: woId, materialId } = await params

    // Check authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    // Get user org_id
    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } },
        { status: 401 }
      )
    }

    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      sort: searchParams.get('sort') || undefined,
      lot_number: searchParams.get('lot_number') || undefined,
      location: searchParams.get('location') || undefined,
    }

    const validation = AvailableLPsQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ')
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: errors } },
        { status: 400 }
      )
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Get WO to verify access and get warehouse_id
    const { data: wo, error: woError } = await supabaseAdmin
      .from('work_orders')
      .select('id, warehouse_id, organization_id')
      .eq('id', woId)
      .eq('organization_id', userData.org_id)
      .single()

    if (woError || !wo) {
      return NextResponse.json(
        { success: false, error: { code: WOReservationErrorCode.WO_NOT_FOUND, message: 'Work order not found' } },
        { status: 404 }
      )
    }

    // Get WO material to get product_id
    const { data: material, error: matError } = await supabaseAdmin
      .from('wo_materials')
      .select('id, product_id, organization_id')
      .eq('id', materialId)
      .eq('wo_id', woId)
      .single()

    if (matError || !material) {
      return NextResponse.json(
        { success: false, error: { code: WOReservationErrorCode.WO_MATERIAL_NOT_FOUND, message: 'Work order material not found' } },
        { status: 404 }
      )
    }

    // Determine sort algorithm (default to FIFO)
    const algorithm = validation.data.sort === 'fefo' ? 'fefo' : 'fifo'

    // Get available LPs
    const result = await WOReservationService.getAvailableLPs(
      material.product_id,
      wo.warehouse_id,
      algorithm
    )

    // Apply additional filters if provided
    let filteredLps = result.lps

    if (validation.data.lot_number) {
      const lotFilter = validation.data.lot_number.toLowerCase()
      filteredLps = filteredLps.filter(lp =>
        lp.lot_number?.toLowerCase().includes(lotFilter)
      )
    }

    if (validation.data.location) {
      const locationFilter = validation.data.location.toLowerCase()
      filteredLps = filteredLps.filter(lp =>
        lp.location?.toLowerCase().includes(locationFilter)
      )
    }

    // Recalculate total
    const totalAvailable = filteredLps.reduce((sum, lp) => sum + lp.available_qty, 0)

    return NextResponse.json({
      success: true,
      data: {
        lps: filteredLps,
        total_available: totalAvailable,
      },
    })
  } catch (error) {
    console.error('Error in GET available-lps:', error)
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
