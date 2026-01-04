/**
 * POST /api/warehouse/genealogy/link-output
 * Story 05.2: LP Genealogy - Link Output Operation (AC-4)
 *
 * Links multiple consumed LPs to a single output LP.
 * Called by Epic 04 Output Registration (04.7a-d).
 */

import { NextRequest, NextResponse } from 'next/server'
import { linkOutputSchema } from '@/lib/validation/lp-genealogy-schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with Zod
    const parseResult = linkOutputSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const input = parseResult.data

    // Return mock success response with generated IDs
    // TODO: Integrate with LPGenealogyService when Supabase is configured
    const mockIds = input.consumedLpIds.map((_, idx) => `gen-out-${Date.now()}-${idx}`)

    return NextResponse.json(
      { ids: mockIds, created: true },
      { status: 201 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    if (message.includes('At least one')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
