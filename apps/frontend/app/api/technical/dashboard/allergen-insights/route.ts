// GET /api/technical/dashboard/allergen-insights - Allergen Insights API (Story 2.24 AC-2.24.9)
import { NextRequest, NextResponse } from 'next/server'
import { getAllergenInsights } from '@/lib/services/dashboard-service'

export async function GET(request: NextRequest) {
  try {
    // TODO: Get org_id from auth session
    const orgId = request.headers.get('x-org-id') || 'mock-org-id'

    const result = await getAllergenInsights(orgId)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
