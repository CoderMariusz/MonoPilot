// GET /api/technical/dashboard/recent-activity - Recent Activity API (Story 2.23 AC-2.23.6)
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { recentActivityQuerySchema } from '@/lib/validation/dashboard-schemas'
import { getRecentActivity } from '@/lib/services/dashboard-service'

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

    // Get current user to get org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const orgId = currentUser.org_id

    const searchParams = request.nextUrl.searchParams
    const query = recentActivityQuerySchema.parse({
      days: parseInt(searchParams.get('days') || '7'),
      limit: parseInt(searchParams.get('limit') || '10')
    })

    const result = await getRecentActivity(orgId, query)

    const response = NextResponse.json(result)
    response.headers.set('Cache-Control', 'private, max-age=30')
    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
