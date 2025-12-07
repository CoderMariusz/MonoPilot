// API Route: License Plates Expiring
// Epic 5 Batch 05A-1: LP Core (Story 5.3)
// GET /api/warehouse/license-plates/expiring - List LPs expiring within X days

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getExpiringLPs, getExpiredLPs } from '@/lib/services/license-plate-service'

// GET /api/warehouse/license-plates/expiring - List expiring LPs
export async function GET(request: NextRequest) {
  try {
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
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)

    // Get query parameters
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30
    const expired = searchParams.get('expired') === 'true'

    // Get expiring or expired LPs
    const data = expired
      ? await getExpiredLPs(currentUser.org_id)
      : await getExpiringLPs(currentUser.org_id, days)

    return NextResponse.json({
      data,
      total: data.length,
      days: expired ? 0 : days,
      expired,
    })
  } catch (error) {
    console.error('Error in GET /api/warehouse/license-plates/expiring:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
