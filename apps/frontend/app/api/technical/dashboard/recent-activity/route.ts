// GET /api/technical/dashboard/recent-activity - Recent Activity API (Story 2.23 AC-2.23.6)
import { NextRequest, NextResponse } from 'next/server'
import { recentActivityQuerySchema } from '@/lib/validation/dashboard-schemas'
import { getRecentActivity } from '@/lib/services/dashboard-service'

export async function GET(request: NextRequest) {
  try {
    // TODO: Get org_id from auth session
    const orgId = request.headers.get('x-org-id') || 'mock-org-id'

    const searchParams = request.nextUrl.searchParams
    const query = recentActivityQuerySchema.parse({
      days: parseInt(searchParams.get('days') || '7'),
      limit: parseInt(searchParams.get('limit') || '10')
    })

    const result = await getRecentActivity(orgId, query)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
