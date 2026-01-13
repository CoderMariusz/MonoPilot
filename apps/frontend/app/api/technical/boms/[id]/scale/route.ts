import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { scaleBOM, applyBOMScaling } from '@/lib/services/bom-service'
import { scaleBomRequestSchema } from '@/lib/validation/bom-advanced-schemas'
import { ZodError } from 'zod'

/**
 * BOM Scaling API
 * Story: 02.14 - BOM Advanced Features
 * FR-2.35: BOM scaling (batch size adjust)
 *
 * GET /api/technical/boms/:id/scale - Legacy: Scale BOM quantities (read-only preview)
 * POST /api/technical/boms/:id/scale - Scale BOM to new batch size (preview or apply)
 */

// ============================================================================
// GET - Legacy simple scale (read-only calculation)
// ============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const multiplierParam = searchParams.get('multiplier')

    // Validate multiplier parameter
    if (!multiplierParam) {
      return NextResponse.json(
        { error: 'Missing required parameter: multiplier' },
        { status: 400 }
      )
    }

    const multiplier = parseFloat(multiplierParam)

    // Validate multiplier value
    if (isNaN(multiplier) || multiplier <= 0) {
      return NextResponse.json(
        { error: 'Invalid multiplier parameter. Must be a positive number.' },
        { status: 400 }
      )
    }

    // Calculate scaled quantities (read-only)
    const result = await scaleBOM(id, multiplier)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error scaling BOM:', error)

    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch BOM') || error.message === 'BOM not found') {
        return NextResponse.json(
          { error: 'BOM not found', code: 'BOM_NOT_FOUND' },
          { status: 404 }
        )
      }

      if (error.message === 'Multiplier must be positive') {
        return NextResponse.json(
          { error: error.message, code: 'INVALID_SCALE' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Advanced scale with preview or apply (Story 02.14)
// ============================================================================
export async function POST(
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
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Extract role code from joined data
    const roleData = currentUser.role as unknown as { code: string } | null
    const userRole = roleData?.code?.toLowerCase() || ''

    // Parse and validate request body
    const body = await request.json()
    const validatedData = scaleBomRequestSchema.parse(body)

    // Check write permission if not preview-only
    if (!validatedData.preview_only) {
      if (!['admin', 'technical', 'production_manager'].includes(userRole)) {
        return NextResponse.json(
          { error: 'Cannot modify BOM', code: 'FORBIDDEN' },
          { status: 403 }
        )
      }
    }

    // Call service method
    const result = await applyBOMScaling(id, validatedData)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/technical/boms/[id]/scale:', error)

    if (error instanceof ZodError) {
      // Check for missing scale param error
      const missingParamError = error.errors.find(e => e.message.includes('target_batch_size or scale_factor'))
      if (missingParamError) {
        return NextResponse.json(
          { error: 'Either target_batch_size or scale_factor required', code: 'MISSING_SCALE_PARAM' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
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
        case 'INVALID_SCALE':
          return NextResponse.json(
            { error: 'Batch size must be positive', code: 'INVALID_SCALE' },
            { status: 400 }
          )
        case 'MISSING_SCALE_PARAM':
          return NextResponse.json(
            { error: 'Either target_batch_size or scale_factor required', code: 'MISSING_SCALE_PARAM' },
            { status: 400 }
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
