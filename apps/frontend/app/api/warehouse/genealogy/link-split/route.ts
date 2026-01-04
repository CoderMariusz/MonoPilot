/**
 * POST /api/warehouse/genealogy/link-split
 * Story 05.2: LP Genealogy - Link Split Operation (AC-5)
 */

import { NextRequest, NextResponse } from 'next/server'
import { linkSplitSchema } from '@/lib/validation/lp-genealogy-schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parseResult = linkSplitSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const input = parseResult.data

    // Check for self-reference
    if (input.sourceLpId === input.newLpId) {
      return NextResponse.json(
        { error: 'Cannot create self-referencing genealogy link' },
        { status: 400 }
      )
    }

    // Return mock success response
    // TODO: Integrate with LPGenealogyService when Supabase is configured
    return NextResponse.json({ id: `gen-split-${Date.now()}`, created: true }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('self-referencing')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message.includes('positive')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
