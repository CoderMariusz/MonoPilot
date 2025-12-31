// API Route: WO Materials with Reservations
// Story 4.7: Material Reservation (Desktop)
// GET /api/production/work-orders/:id/materials - Get materials with reservation status

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { MaterialReservationService } from '@/lib/services/material-reservation-service'

export async function GET(
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const supabaseAdmin = createServerSupabaseAdmin()
    const service = new MaterialReservationService(supabaseAdmin)

    const { data, error } = await service.getMaterialsWithReservations(woId, currentUser.org_id)

    if (error) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/production/work-orders/:id/materials:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
