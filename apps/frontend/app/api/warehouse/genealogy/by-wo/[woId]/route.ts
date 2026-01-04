/**
 * GET /api/warehouse/genealogy/by-wo/:woId
 * Story 05.2: LP Genealogy - Get All Genealogy for Work Order (AC-15)
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { woId: string } | Promise<{ woId: string }> }
) {
  try {
    // Handle both Promise and object params (Next.js 15 compatibility)
    const resolvedParams = 'then' in params ? await params : params
    const { woId } = resolvedParams

    // Return mock data for now (service integration requires Supabase setup)
    // TODO: Integrate with LPGenealogyService when Supabase is configured
    const mockResult = {
      woId,
      genealogy: {
        consume: [],
        output: [],
      },
      totalCount: 0,
    }

    return NextResponse.json(mockResult, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
