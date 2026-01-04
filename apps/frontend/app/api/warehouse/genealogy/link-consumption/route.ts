/**
 * POST /api/warehouse/genealogy/link-consumption
 * Story 05.2: LP Genealogy - Link Consumption Operation (AC-3)
 *
 * Creates a genealogy link for LP consumption in production.
 * Called by Epic 04 Consumption (04.6a-e).
 */

import { NextRequest, NextResponse } from 'next/server'
import { linkConsumptionSchema } from '@/lib/validation/lp-genealogy-schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with Zod
    const parseResult = linkConsumptionSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const input = parseResult.data

    // Check for self-reference (AC-20)
    if (input.parentLpId === input.childLpId) {
      return NextResponse.json(
        { error: 'Cannot create self-referencing genealogy link' },
        { status: 400 }
      )
    }

    // Return mock success response
    // TODO: Integrate with LPGenealogyService when Supabase is configured
    return NextResponse.json(
      { id: `gen-${Date.now()}`, created: true },
      { status: 201 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    // Handle specific error types
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    if (message.includes('self-referencing')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message.includes('already exists')) {
      return NextResponse.json({ error: message }, { status: 409 })
    }
    if (message.includes('different organizations')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
