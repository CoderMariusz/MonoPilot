/**
 * Location Lookup API Route (Story 05.19)
 * GET /api/warehouse/scanner/lookup/location/[barcode] - Lookup location by barcode
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ScannerReceiveService } from '@/lib/services/scanner-receive-service'

export async function GET(
  request: Request,
  { params }: { params: { barcode: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const { barcode } = params

    if (!barcode || barcode.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Barcode is required' } },
        { status: 400 }
      )
    }

    const location = await ScannerReceiveService.lookupLocation(supabase, decodeURIComponent(barcode))

    if (!location) {
      return NextResponse.json(
        { success: false, error: { code: 'LOCATION_NOT_FOUND', message: 'Location not found or inactive' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: location.id,
        code: location.code,
        name: location.name,
        warehouse_id: location.warehouse_id,
        warehouse_name: (location.warehouse as { name: string } | undefined)?.name || '',
        zone_id: null, // Can be extended with zone support
        zone_name: null,
        full_path: location.full_path,
      },
    })
  } catch (error) {
    console.error('Location lookup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to lookup location',
        },
      },
      { status: 500 }
    )
  }
}
