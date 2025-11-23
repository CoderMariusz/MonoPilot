// GET /api/technical/dashboard/products - Product Dashboard API (Story 2.23)
import { NextRequest, NextResponse } from 'next/server'
import { getProductDashboard } from '@/lib/services/dashboard-service'

export async function GET(request: NextRequest) {
  try {
    // TODO: Get org_id from auth session
    const orgId = request.headers.get('x-org-id') || 'mock-org-id'

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '8')

    const result = await getProductDashboard(orgId, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
