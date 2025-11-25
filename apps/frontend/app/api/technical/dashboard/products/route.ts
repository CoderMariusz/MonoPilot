// GET /api/technical/dashboard/products - Product Dashboard API (Story 2.23)
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { productDashboardQuerySchema } from '@/lib/validation/dashboard-schemas'
import { getProductDashboard } from '@/lib/services/dashboard-service'

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
    const query = productDashboardQuerySchema.parse({
      limit: parseInt(searchParams.get('limit') || '8'),
      search: searchParams.get('search') || undefined,
      type_filter: (searchParams.get('type_filter') as 'all' | 'RM' | 'WIP' | 'FG') || 'all'
    })

    const result = await getProductDashboard(orgId, {
      limit: query.limit,
      search: query.search,
      type_filter: query.type_filter
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
