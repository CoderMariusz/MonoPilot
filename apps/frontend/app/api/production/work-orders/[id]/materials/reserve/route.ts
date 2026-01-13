// API Route: Reserve Material
// Story 4.7: Material Reservation (Desktop)
// POST /api/production/work-orders/:id/materials/reserve - Reserve material from LP

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { MaterialReservationService, ReservationErrorCodes } from '@/lib/services/material-reservation-service'
import { z } from 'zod'

const reserveMaterialSchema = z.object({
  material_id: z.string().uuid('Invalid material ID'),
  lp_id: z.string().uuid('Invalid LP ID'),
  reserved_qty: z.number().positive('Quantity must be positive'),
  notes: z.string().max(500).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: ReservationErrorCodes.UNAUTHORIZED, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = reserveMaterialSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: ReservationErrorCodes.VALIDATION_ERROR,
          message: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { material_id, lp_id, reserved_qty, notes } = validationResult.data

    const supabaseAdmin = createServerSupabaseAdmin()
    const service = new MaterialReservationService(supabaseAdmin)

    const roleCode = (currentUser.role as unknown as { code: string } | null)?.code ?? ''
    const { data, error } = await service.reserveMaterial(
      {
        woId,
        materialId: material_id,
        lpId: lp_id,
        reservedQty: reserved_qty,
        notes,
        userId: session.user.id,
        orgId: currentUser.org_id,
      },
      roleCode
    )

    if (error) {
      const statusCode = getStatusCode(error.code)
      return NextResponse.json(
        { error: error.code, message: error.message, details: error.details },
        { status: statusCode }
      )
    }

    // Broadcast realtime event for material.reserved
    try {
      await supabaseAdmin.channel(`wo:${woId}`).send({
        type: 'broadcast',
        event: 'material.reserved',
        payload: {
          wo_id: woId,
          material_id: material_id,
          reservation: data,
        },
      })
    } catch (broadcastError) {
      console.error('Error broadcasting material.reserved:', broadcastError)
    }

    return NextResponse.json({
      data,
      message: 'Material reserved successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/production/work-orders/:id/materials/reserve:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getStatusCode(errorCode: string): number {
  switch (errorCode) {
    case ReservationErrorCodes.UNAUTHORIZED:
      return 401
    case ReservationErrorCodes.FORBIDDEN:
      return 403
    case ReservationErrorCodes.WO_NOT_FOUND:
    case ReservationErrorCodes.LP_NOT_FOUND:
    case ReservationErrorCodes.MATERIAL_NOT_IN_BOM:
    case ReservationErrorCodes.RESERVATION_NOT_FOUND:
      return 404
    default:
      return 400
  }
}
