// API Route: Remove LP from Pallet
// Epic 5 Batch 05B-2: Pallets (Story 5.20)
// DELETE /api/warehouse/pallets/[id]/lps/[lpId] - Remove LP from pallet

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lpId: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const { id: palletId, lpId } = await params

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
        { error: 'Cannot remove LP from closed pallet' },
        { status: 400 }
      )
    }

    // Remove LP from pallet
    const { error } = await supabase.from('pallet_lps').delete().eq('id', lpId)

    if (error) throw error

    return NextResponse.json({ message: 'License plate removed from pallet successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/warehouse/pallets/[id]/lps/[lpId]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
