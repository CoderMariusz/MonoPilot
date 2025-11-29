// API Route: Production Dashboard - Alerts
// Epic 4 Story 4.1 - AC-4.1.5
// GET /api/production/dashboard/alerts

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAlerts } from '@/lib/services/production-dashboard-service'

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

    // Get alerts for org
    const alerts = await getAlerts(currentUser.org_id)

    return NextResponse.json({ data: alerts })
  } catch (error) {
    console.error('Error in GET /api/production/dashboard/alerts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
