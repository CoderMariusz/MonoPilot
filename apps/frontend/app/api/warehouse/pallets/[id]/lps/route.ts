// API Route: Pallet LP Management
// Epic 5 Batch 05B-2: Pallets (Story 5.20)
// POST /api/warehouse/pallets/[id]/lps - Add LP to pallet

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const { id: palletId } = await params

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
      .select('org_id, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization
    if (!['warehouse', 'production', 'manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Warehouse role or higher required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    if (!body.lp_id) {
      return NextResponse.json(
        { error: 'Missing required field: lp_id' },
        { status: 400 }
      )
    }

    // Check pallet exists and is open
    const { data: pallet, error: palletError } = await supabase
      .from('pallets')
      .select('id, status')
      .eq('id', palletId)
      .single()

    if (palletError || !pallet) {
      return NextResponse.json({ error: 'Pallet not found' }, { status: 404 })
    }

    if (pallet.status !== 'open') {
      return NextResponse.json(
        { error: 'Cannot add LP to closed pallet' },
        { status: 400 }
      )
    }

    // Check LP exists and is available
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('id, status, current_qty')
      .eq('id', body.lp_id)
      .single()

    if (lpError || !lp) {
      return NextResponse.json({ error: 'License plate not found' }, { status: 404 })
    }

    if (lp.status !== 'available') {
      return NextResponse.json(
        { error: 'License plate is not available' },
        { status: 400 }
      )
    }

    if (lp.current_qty <= 0) {
      return NextResponse.json(
        { error: 'License plate has zero quantity' },
        { status: 400 }
      )
    }

    // Check LP is not on another pallet
    const { data: existingPallets } = await supabase
      .from('pallet_lps')
      .select('pallet_id, pallets!inner(pallet_number)')
      .eq('lp_id', body.lp_id)
      .limit(1)

    if (existingPallets && existingPallets.length > 0) {
      const palletData = existingPallets[0].pallets as any
      return NextResponse.json(
        { error: `License plate already on pallet ${palletData.pallet_number}` },
        { status: 400 }
      )
    }

    // Add LP to pallet
    const { data, error } = await supabase
      .from('pallet_lps')
      .insert({
        pallet_id: palletId,
        lp_id: body.lp_id,
        added_by: session.user.id,
      })
      .select(`
        id,
        added_at,
        license_plate:license_plates(
          id,
          lp_number,
          product_id,
          current_qty,
          uom,
          batch_number,
          product:products(id, code, name)
        )
      `)
      .single()

    if (error) throw error

    return NextResponse.json(
      {
        data,
        message: 'License plate added to pallet successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/warehouse/pallets/[id]/lps:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
