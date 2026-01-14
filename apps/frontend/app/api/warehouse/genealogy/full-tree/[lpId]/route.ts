/**
 * GET /api/warehouse/genealogy/full-tree/:lpId
 * Story 05.2: LP Genealogy - Full Tree (Both Directions)
 */

import { NextRequest, NextResponse } from 'next/server'
import { TraceQuerySchema, GenealogyDirectionSchema } from '@/lib/validation/lp-genealogy-schemas'
import type { GenealogyTree, GenealogyNode } from '@/lib/types/genealogy'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ lpId: string } | Promise<{ lpId: string }>> }
) {
  const params = await props.params;
  try {
    // Handle both Promise and object params (Next.js 15 compatibility)
    const resolvedParams = 'then' in params ? await params : params
    const { lpId } = resolvedParams

    // Parse query params safely
    const searchParams = request.nextUrl?.searchParams || new URLSearchParams(request.url?.split('?')[1] || '')

    const directionResult = GenealogyDirectionSchema.safeParse(searchParams.get('direction') || 'both')
    const queryResult = TraceQuerySchema.safeParse({
      maxDepth: searchParams.get('maxDepth') || '5',
      includeReversed: searchParams.get('includeReversed') || 'false',
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      )
    }

    const direction = directionResult.success ? directionResult.data : 'both'

    // TODO: Integrate with LPGenealogyService when Supabase is configured
    // For now, return properly structured mock data
    const mockAncestors: GenealogyNode[] = []
    const mockDescendants: GenealogyNode[] = []

    // Apply direction filtering properly
    const ancestors = direction === 'forward' ? [] : mockAncestors
    const descendants = direction === 'backward' ? [] : mockDescendants

    const hasGenealogy = ancestors.length > 0 || descendants.length > 0

    const mockResult: GenealogyTree = {
      lpId,
      lpNumber: `LP-2024-${(lpId.length >= 8 ? lpId.slice(0, 8) : lpId).toUpperCase()}`,
      hasGenealogy,
      ancestors,
      descendants,
      summary: {
        originalQuantity: 0,
        splitOutTotal: 0,
        currentQuantity: 0,
        childCount: descendants.length,
        parentCount: ancestors.length,
        depth: {
          forward: descendants.length > 0 ? Math.max(...descendants.map(d => d.depth)) : 0,
          backward: ancestors.length > 0 ? Math.max(...ancestors.map(a => a.depth)) : 0,
        },
        totalOperations: ancestors.length + descendants.length,
        operationBreakdown: {
          split: 0,
          consume: 0,
          output: 0,
          merge: 0,
        },
      },
      hasMoreLevels: {
        ancestors: false,
        descendants: false,
      },
    }

    return NextResponse.json(mockResult, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
