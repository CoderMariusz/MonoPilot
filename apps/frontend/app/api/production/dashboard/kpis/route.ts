// API Route: Production Dashboard - KPIs
// Epic 4 Story 4.1 - AC-4.1.5
// GET /api/production/dashboard/kpis

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getKPIs } from '@/lib/services/production-dashboard-service'

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

    // Get KPIs for org
    const kpis = await getKPIs(currentUser.org_id)

    return NextResponse.json({ data: kpis })
  } catch (error) {
    console.error('Error in GET /api/production/dashboard/kpis:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
