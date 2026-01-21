/**
 * Scanner Validate Move API Route (Story 05.20)
 * POST /api/warehouse/scanner/validate-move - Pre-validate move without executing
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ScannerMoveService } from '@/lib/services/scanner-move-service'
import { validateMoveSchema, SCANNER_MOVE_ERROR_CODES } from '@/lib/validation/scanner-move'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized',
          },
        },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const parseResult = validateMoveSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: SCANNER_MOVE_ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid request data',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      )
    }

    const { lp_id, to_location_id } = parseResult.data

    // Validate move without executing
    const result = await ScannerMoveService.validateMove(supabase, lp_id, to_location_id)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Scanner validate-move error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate move',
        },
      },
      { status: 500 }
    )
  }
}
