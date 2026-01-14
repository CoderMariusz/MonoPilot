/**
 * POST /api/warehouse/genealogy/:id/reverse
 * Story 05.2: LP Genealogy - Reverse Genealogy Link (AC-7)
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string } | Promise<{ id: string }>> }
) {
  const params = await props.params;
  try {
    // Handle both Promise and object params (Next.js 15 compatibility)
    const resolvedParams = 'then' in params ? await params : params
    const { id } = resolvedParams

    // Validate ID format
    if (!id || id.length < 5) {
      return NextResponse.json({ error: 'Invalid genealogy link ID' }, { status: 400 })
    }

    // For now, return mock success response
    // TODO: Integrate with LPGenealogyService when Supabase is configured
    return NextResponse.json({
      id,
      reversed: true,
      reversedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
