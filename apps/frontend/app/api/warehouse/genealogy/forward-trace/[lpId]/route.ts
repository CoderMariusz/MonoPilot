/**
 * GET /api/warehouse/genealogy/forward-trace/:lpId
 * Story 05.2: LP Genealogy - Forward Trace (Descendants) (AC-8, AC-9)
 *
 * Returns all descendants of an LP (where did this LP go?).
 * Supports maxDepth and includeReversed query params.
 */

import { NextRequest, NextResponse } from 'next/server'
import { TraceQuerySchema } from '@/lib/validation/lp-genealogy-schemas'
import type { GenealogyNode } from '@/lib/types/genealogy'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ lpId: string } | Promise<{ lpId: string }>> }
) {
  const params = await props.params;
  try {
    // Handle both Promise and object params (Next.js 15 compatibility)
    const resolvedParams = 'then' in params ? await params : params
    const { lpId } = resolvedParams

    // Parse query params
    const searchParams = request.nextUrl?.searchParams || new URLSearchParams(request.url?.split('?')[1] || '')
    const parseResult = TraceQuerySchema.safeParse({
      maxDepth: searchParams.get('maxDepth') || '10',
      includeReversed: searchParams.get('includeReversed') || 'false',
    })

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      )
    }

    // TODO: Integrate with LPGenealogyService when Supabase is configured
    const descendants: GenealogyNode[] = []

    return NextResponse.json({
      lpId,
      descendants,
      hasMoreLevels: false,
      totalCount: descendants.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
