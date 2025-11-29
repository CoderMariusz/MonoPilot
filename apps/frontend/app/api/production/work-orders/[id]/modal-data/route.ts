/**
 * API Route: Get WO data for start modal
 * Epic 4 Story 4.2 - AC-4.2.1
 * GET /api/production/work-orders/:id/modal-data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getWOForStartModal, WOStartError } from '@/lib/services/wo-start-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    // Get current user's org
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get WO data for modal
    const woData = await getWOForStartModal(woId, currentUser.org_id)

    return NextResponse.json({ data: woData }, { status: 200 })
  } catch (error) {
    if (error instanceof WOStartError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      )
    }

    console.error('Error in GET /api/production/work-orders/:id/modal-data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
