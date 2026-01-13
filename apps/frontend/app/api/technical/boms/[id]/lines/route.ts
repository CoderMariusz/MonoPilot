import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { SetBomLinesSchema } from '@/lib/validation/bom-schemas'
import { getProductionLines, setProductionLines } from '@/lib/services/bom-service'
import { ZodError } from 'zod'

/**
 * BOM Production Lines API Routes - Story 2.25
 *
 * GET /api/technical/boms/:id/lines - List production lines assigned to BOM
 * PUT /api/technical/boms/:id/lines - Bulk replace production line assignments
 */

// ============================================================================
// GET /api/technical/boms/:id/lines - List Production Lines (AC-2.25.3)
// ============================================================================

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get production lines
    const lines = await getProductionLines(id)

    return NextResponse.json(
      {
        lines,
        total: lines.length
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/technical/boms/:id/lines:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === 'BOM_NOT_FOUND') {
      return NextResponse.json(
        { error: 'BOM not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/technical/boms/:id/lines - Set Production Lines (AC-2.25.4)
// ============================================================================

export async function PUT(
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Extract role code from joined data
    const roleData = currentUser.role as unknown as { code: string } | null
    const userRole = roleData?.code?.toLowerCase() || ''

    // Check authorization: Admin or Technical only
    if (!['admin', 'technical'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Technical role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = SetBomLinesSchema.parse(body)

    // Call service method
    const lines = await setProductionLines(id, validatedData)

    return NextResponse.json(
      {
        lines,
        message: 'BOM lines updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/technical/boms/:id/lines:', error)

    if (error instanceof ZodError) {
      // Check for duplicate line error from Zod refinement
      const duplicateError = error.errors.find(e => e.message.includes('Duplicate'))
      if (duplicateError) {
        return NextResponse.json(
          { error: 'DUPLICATE_LINE', message: duplicateError.message },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === 'BOM_NOT_FOUND') {
      return NextResponse.json(
        { error: 'BOM_NOT_FOUND', message: 'BOM not found' },
        { status: 404 }
      )
    }

    if (message.startsWith('INVALID_LINE:')) {
      const lineId = message.split(':')[1]
      return NextResponse.json(
        { error: 'INVALID_LINE', message: `Line ${lineId} not found` },
        { status: 400 }
      )
    }

    if (message.startsWith('INVALID_LINE_ORG:')) {
      const lineId = message.split(':')[1]
      return NextResponse.json(
        { error: 'INVALID_LINE_ORG', message: `Line ${lineId} belongs to different organization` },
        { status: 400 }
      )
    }

    if (message === 'DUPLICATE_LINE') {
      return NextResponse.json(
        { error: 'DUPLICATE_LINE', message: 'Duplicate line assignment' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
