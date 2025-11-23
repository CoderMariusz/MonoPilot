// POST /api/technical/tracing/recall - Recall Simulation API (Story 2.20)
import { NextRequest, NextResponse } from 'next/server'
import { recallInputSchema } from '@/lib/validation/tracing-schemas'
import { simulateRecall } from '@/lib/services/recall-service'

export async function POST(request: NextRequest) {
  try {
    // Mock org_id - in production, get from session/auth
    const orgId = request.headers.get('x-org-id') || 'mock-org-id'

    const body = await request.json()
    const input = recallInputSchema.parse(body)

    const result = await simulateRecall(orgId, input)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Recall simulation error:', error)
    return NextResponse.json(
      { error: error.message || 'Recall simulation failed' },
      { status: 400 }
    )
  }
}
