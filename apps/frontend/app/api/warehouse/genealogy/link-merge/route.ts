/**
 * POST /api/warehouse/genealogy/link-merge
 * Story 05.2: LP Genealogy - Link Merge Operation (AC-6)
 */

import { NextRequest, NextResponse } from 'next/server'
import { linkMergeSchema } from '@/lib/validation/lp-genealogy-schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parseResult = linkMergeSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const input = parseResult.data

    // Return mock success response
    // TODO: Integrate with LPGenealogyService when Supabase is configured
    const mockIds = input.sourceLpIds.map((_, idx) => `gen-merge-${Date.now()}-${idx}`)

    return NextResponse.json(
      { ids: mockIds, created: true },
      { status: 201 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('At least one')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message.includes('Target LP cannot')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
