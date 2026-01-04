/**
 * GET /api/warehouse/license-plates/:id/genealogy
 * Story 05.2: LP Genealogy Tracking - LP Detail View Endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { TraceQuerySchema, GenealogyDirectionSchema } from '@/lib/validation/lp-genealogy-schemas'
import type { GenealogyTree, GenealogyNode } from '@/lib/types/genealogy'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Handle both Promise and object params (Next.js 15 compatibility)
    const resolvedParams = 'then' in params ? await params : params
    const { id } = resolvedParams

    // Validate id is present (routes with actual Supabase will validate UUID format)
    if (!id) {
      return NextResponse.json(
        { error: 'LP ID is required' },
        { status: 400 }
      )
    }

    // Parse query params safely
    const searchParams = request.nextUrl?.searchParams || new URLSearchParams(request.url?.split('?')[1] || '')

    const direction = GenealogyDirectionSchema.safeParse(searchParams.get('direction') || 'both')
    const queryParams = TraceQuerySchema.safeParse({
      maxDepth: searchParams.get('maxDepth') || '3', // Default 3 for LP detail view
      includeReversed: searchParams.get('includeReversed') || 'false',
    })

    if (!queryParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      )
    }

    const parsedDirection = direction.success ? direction.data : 'both'

    // TODO: Replace with actual database query via LPGenealogyService
    // For now, return properly structured mock data
    // The hasGenealogy flag should be determined by checking if ancestors/descendants exist
    const mockAncestors: GenealogyNode[] = []
    const mockDescendants: GenealogyNode[] = []

    const hasAncestors = parsedDirection !== 'forward' && mockAncestors.length > 0
    const hasDescendants = parsedDirection !== 'backward' && mockDescendants.length > 0
    const hasGenealogy = hasAncestors || hasDescendants

    const mockGenealogy: GenealogyTree = {
      lpId: id,
      lpNumber: `LP-2024-${(id.length >= 8 ? id.slice(0, 8) : id).toUpperCase()}`,
      hasGenealogy,
      ancestors: parsedDirection === 'forward' ? [] : mockAncestors,
      descendants: parsedDirection === 'backward' ? [] : mockDescendants,
      summary: {
        originalQuantity: 0,
        splitOutTotal: 0,
        currentQuantity: 0,
        childCount: mockDescendants.length,
        parentCount: mockAncestors.length,
        depth: {
          forward: mockDescendants.length > 0 ? Math.max(...mockDescendants.map(d => d.depth)) : 0,
          backward: mockAncestors.length > 0 ? Math.max(...mockAncestors.map(a => a.depth)) : 0,
        },
        totalOperations: mockAncestors.length + mockDescendants.length,
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

    return NextResponse.json(mockGenealogy, { status: 200 })
  } catch (error) {
    console.error('Error fetching LP genealogy:', error)
    return NextResponse.json(
      {
        error: {
          code: 'GENEALOGY_QUERY_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch genealogy',
        },
      },
      { status: 500 }
    )
  }
}
