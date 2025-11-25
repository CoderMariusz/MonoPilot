// GET /api/technical/dashboard/products - Product Dashboard API (Story 2.23)
import { NextRequest, NextResponse } from 'next/server'
import { productDashboardQuerySchema } from '@/lib/validation/dashboard-schemas'
import { getProductDashboard } from '@/lib/services/dashboard-service'

export async function GET(request: NextRequest) {
  try {
    // TODO: Get org_id from auth session
    const orgId = request.headers.get('x-org-id') || 'mock-org-id'

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
