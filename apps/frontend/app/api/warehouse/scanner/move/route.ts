/**
 * Scanner Move API Route (Story 05.20)
 * POST /api/warehouse/scanner/move - Execute scanner move operation
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ScannerMoveService } from '@/lib/services/scanner-move-service'
import { scannerMoveSchema, SCANNER_MOVE_ERROR_CODES } from '@/lib/validation/scanner-move'

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
    const parseResult = scannerMoveSchema.safeParse(body)

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

    const { lp_id, to_location_id, notes } = parseResult.data

    // Execute move
    const result = await ScannerMoveService.processMove(supabase, {
      lpId: lp_id,
      toLocationId: to_location_id,
      notes: notes || undefined,
    })

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Scanner move error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    // Map error messages to appropriate HTTP status codes
    if (message.includes('not found')) {
      const isLP = message.toLowerCase().includes('lp') || message.toLowerCase().includes('license plate')
      return NextResponse.json(
        {
          success: false,
          error: {
            code: isLP ? SCANNER_MOVE_ERROR_CODES.LP_NOT_FOUND : SCANNER_MOVE_ERROR_CODES.LOCATION_NOT_FOUND,
            message,
          },
        },
        { status: 404 }
      )
    }

    if (message.includes('inactive')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: SCANNER_MOVE_ERROR_CODES.LOCATION_NOT_ACTIVE,
            message,
          },
        },
        { status: 400 }
      )
    }

    if (message.includes('not available') || message.includes('status')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: SCANNER_MOVE_ERROR_CODES.LP_NOT_AVAILABLE,
            message,
          },
        },
        { status: 400 }
      )
    }

    if (message.includes('same')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: SCANNER_MOVE_ERROR_CODES.SAME_LOCATION,
            message,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to execute scanner move',
        },
      },
      { status: 500 }
    )
  }
}
