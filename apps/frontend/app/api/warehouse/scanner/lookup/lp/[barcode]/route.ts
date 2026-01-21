/**
 * LP Lookup API Route (Story 05.20)
 * GET /api/warehouse/scanner/lookup/lp/[barcode] - Lookup LP by barcode (lp_number)
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ScannerMoveService } from '@/lib/services/scanner-move-service'
import { SCANNER_MOVE_ERROR_CODES } from '@/lib/validation/scanner-move'

export async function GET(request: Request, props: { params: Promise<{ barcode: string }> }) {
  const params = await props.params
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

    const { barcode } = params

    if (!barcode || barcode.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: SCANNER_MOVE_ERROR_CODES.VALIDATION_ERROR,
            message: 'Barcode is required',
          },
        },
        { status: 400 }
      )
    }

    const lp = await ScannerMoveService.lookupLP(supabase, decodeURIComponent(barcode))

    if (!lp) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: SCANNER_MOVE_ERROR_CODES.LP_NOT_FOUND,
            message: 'LP not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: lp,
    })
  } catch (error) {
    console.error('LP lookup error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to lookup LP',
        },
      },
      { status: 500 }
    )
  }
}
