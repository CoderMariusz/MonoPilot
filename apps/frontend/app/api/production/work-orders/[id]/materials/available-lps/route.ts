// API Route: Search Available LPs for Material
// Story 4.7: Material Reservation (Desktop)
// GET /api/production/work-orders/:id/materials/available-lps?product_id=&uom=&search=

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { MaterialReservationService } from '@/lib/services/material-reservation-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params // Validate route param exists
    const supabase = await createServerSupabase()
    const searchParams = request.nextUrl.searchParams

    const productId = searchParams.get('product_id')
    const uom = searchParams.get('uom')
    const search = searchParams.get('search') || undefined

    if (!productId || !uom) {
      return NextResponse.json(
        { error: 'product_id and uom are required' },
        { status: 400 }
      )
    }

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

    const { data, error } = await service.searchAvailableLPs(
      productId,
      uom,
      currentUser.org_id,
      search
    )

    if (error) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/production/work-orders/:id/materials/available-lps:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
