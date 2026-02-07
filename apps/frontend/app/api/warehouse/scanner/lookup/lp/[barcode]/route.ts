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
    const decodedBarcode = decodeURIComponent(barcode)

    if (!decodedBarcode || decodedBarcode.length === 0) {
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

    // Validate barcode format: alphanumeric, hyphens, underscores only
    const LP_PATTERN = /^[A-Za-z0-9\-_]+$/
    const MAX_LP_LENGTH = 50

    if (decodedBarcode.length > MAX_LP_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: SCANNER_MOVE_ERROR_CODES.VALIDATION_ERROR,
            message: `Barcode too long (max ${MAX_LP_LENGTH} characters)`,
          },
        },
        { status: 400 }
      )
    }

    if (!LP_PATTERN.test(decodedBarcode)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: SCANNER_MOVE_ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid barcode format. Only letters, numbers, hyphens, and underscores allowed.',
          },
        },
        { status: 400 }
      )
    }

    // BUG-087: Add debug logging for LP lookup
    console.log('[LP Lookup] Searching for LP:', decodedBarcode, 'by user:', user.id)
    
    const lp = await ScannerMoveService.lookupLP(supabase, decodedBarcode)

    if (!lp) {
      console.log('[LP Lookup] LP not found:', decodedBarcode)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: SCANNER_MOVE_ERROR_CODES.LP_NOT_FOUND,
            message: `LP not found: ${decodedBarcode}`,
          },
        },
        { status: 404 }
      )
    }
    
    console.log('[LP Lookup] Found LP:', lp.id, lp.lp_number)

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
