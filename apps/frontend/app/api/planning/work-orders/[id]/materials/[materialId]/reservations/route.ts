/**
 * API Route: WO Material Reservations (Story 03.11b)
 * Purpose: GET/POST endpoints for WO material LP reservations
 *
 * Endpoints:
 * - GET /api/planning/work-orders/:id/materials/:materialId/reservations
 *   Returns all LP reservations for a specific wo_material
 *
 * - POST /api/planning/work-orders/:id/materials/:materialId/reservations
 *   Create manual LP reservation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WOReservationService } from '@/lib/services/wo-reservation-service'
import { getWOReservationStatusCode } from '@/lib/utils/wo-reservation-errors'
import { CreateReservationSchema } from '@/lib/validation/wo-reservations'

interface RouteParams {
  params: Promise<{
    id: string
    materialId: string
  }>
}

/**
 * GET /api/planning/work-orders/:id/materials/:materialId/reservations
 * Returns all LP reservations for a specific wo_material
 *
 * Response format:
 * {
 *   reservations: WOMaterialReservation[],
 *   total_reserved: number,
 *   required_qty: number,
 *   coverage_percent: number
 * }
 */
export async function GET(
  _request: NextRequest,
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

    // Get reservations for the material
    const result = await WOReservationService.getReservations(materialId)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error in GET reservations:', error)
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * POST /api/planning/work-orders/:id/materials/:materialId/reservations
 * Create manual LP reservation
 *
 * Request body:
 * {
 *   lp_id: string (UUID),
 *   quantity: number
 * }
 *
 * Response format:
 * {
 *   reservation: WOMaterialReservation,
 *   message: string,
 *   warnings?: string[]
 * }
 */
export async function POST(
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

    // Parse and validate request body
    const body = await request.json()
    const validation = CreateReservationSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ')
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: errors } },
        { status: 400 }
      )
    }

    const { lp_id, quantity } = validation.data

    // Create reservation
    const result = await WOReservationService.reserveLP(
      materialId,
      lp_id,
      quantity,
      user.id
    )

    if (!result.success) {
      const statusCode = getWOReservationStatusCode(result.code)
      return NextResponse.json(
        { success: false, error: { code: result.code, message: result.error } },
        { status: statusCode }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      warnings: result.warnings,
      message: result.warnings?.length
        ? 'LP reserved successfully with warnings'
        : 'LP reserved successfully',
    })
  } catch (error) {
    console.error('Error in POST reservation:', error)
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
