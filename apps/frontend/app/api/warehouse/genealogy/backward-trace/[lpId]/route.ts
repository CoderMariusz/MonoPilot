/**
 * GET /api/warehouse/genealogy/backward-trace/:lpId
 * Story 05.2: LP Genealogy - Backward Trace (Ancestors) (AC-10, AC-12)
 */

import { NextRequest, NextResponse } from 'next/server'
import { TraceQuerySchema } from '@/lib/validation/lp-genealogy-schemas'
import type { GenealogyNode } from '@/lib/types/genealogy'

export async function GET(
  request: NextRequest,
  { params }: { params: { lpId: string } | Promise<{ lpId: string }> }
) {
  try {
    // Handle both Promise and object params (Next.js 15 compatibility)
    const resolvedParams = 'then' in params ? await params : params
    const { lpId } = resolvedParams

    const searchParams = request.nextUrl?.searchParams || new URLSearchParams(request.url?.split('?')[1] || '')
    const parseResult = TraceQuerySchema.safeParse({
      maxDepth: searchParams.get('maxDepth') || '10',
      includeReversed: searchParams.get('includeReversed') || 'false',
    })

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
    }

    // TODO: Integrate with LPGenealogyService when Supabase is configured
    const ancestors: GenealogyNode[] = []

    return NextResponse.json({
      lpId,
      ancestors,
      hasMoreLevels: false,
      totalCount: ancestors.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
