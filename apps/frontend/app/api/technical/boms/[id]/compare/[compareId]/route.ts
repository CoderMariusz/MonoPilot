import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { compareBOMVersions } from '@/lib/services/bom-service'

/**
 * BOM Version Comparison API
 * Story: 02.14 - BOM Advanced Features
 * FR-2.25: BOM version comparison (diff view)
 *
 * GET /api/technical/boms/:id/compare/:compareId - Compare two BOM versions
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; compareId: string }> }
) {
  try {
    const { id, compareId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Call service method
    const comparison = await compareBOMVersions(id, compareId)

    return NextResponse.json(comparison, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/technical/boms/[id]/compare/[compareId]:', error)

    if (error instanceof Error) {
      switch (error.message) {
        case 'SAME_VERSION':
          return NextResponse.json(
            { error: 'Cannot compare version to itself', code: 'SAME_VERSION' },
            { status: 400 }
          )
        case 'DIFFERENT_PRODUCTS':
          return NextResponse.json(
            { error: 'Versions must be from same product', code: 'DIFFERENT_PRODUCTS' },
            { status: 400 }
          )
        case 'BOM_NOT_FOUND':
          return NextResponse.json(
            { error: 'BOM not found', code: 'BOM_NOT_FOUND' },
            { status: 404 }
          )
        case 'Unauthorized':
          return NextResponse.json(
            { error: 'Unauthorized', code: 'UNAUTHORIZED' },
            { status: 401 }
          )
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
