import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { explodeBOM } from '@/lib/services/bom-service'
import { explosionQuerySchema } from '@/lib/validation/bom-advanced-schemas'
import { ZodError } from 'zod'

/**
 * BOM Multi-Level Explosion API
 * Story: 02.14 - BOM Advanced Features
 * FR-2.29: BOM multi-level explosion
 *
 * GET /api/technical/boms/:id/explosion - Get multi-level BOM explosion
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      maxDepth: searchParams.get('maxDepth') || '10',
      includeQuantities: searchParams.get('includeQuantities') || 'true',
    }

    // Validate query parameters
    const validatedQuery = explosionQuerySchema.parse(queryParams)

    // Call service method
    const explosion = await explodeBOM(id, validatedQuery.maxDepth)

    return NextResponse.json(explosion, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/technical/boms/[id]/explosion:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      switch (error.message) {
        case 'BOM_NOT_FOUND':
          return NextResponse.json(
            { error: 'BOM not found', code: 'BOM_NOT_FOUND' },
            { status: 404 }
          )
        case 'CIRCULAR_REFERENCE':
          return NextResponse.json(
            { error: 'Circular BOM reference detected', code: 'CIRCULAR_REFERENCE' },
            { status: 422 }
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
