// POST /api/technical/tracing/backward - Backward Trace API (Story 2.19)
import { NextRequest, NextResponse } from 'next/server'
import { traceInputSchema } from '@/lib/validation/tracing-schemas'
import { traceBackward } from '@/lib/services/genealogy-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input = traceInputSchema.parse(body)

    let lpId = input.lp_id
    if (!lpId && input.batch_number) {
      // TODO: Query LP by batch_number
      throw new Error('Batch number lookup not implemented yet')
    }

    const result = await traceBackward(lpId!, input.max_depth)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
