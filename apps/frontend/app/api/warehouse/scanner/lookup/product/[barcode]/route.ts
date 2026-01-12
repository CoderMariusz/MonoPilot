/**
 * Product Lookup API Route (Story 05.19)
 * GET /api/warehouse/scanner/lookup/product/[barcode] - Lookup product by barcode
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

    const product = await ScannerReceiveService.lookupProduct(supabase, decodeURIComponent(barcode))

    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        code: product.code,
        name: product.name,
        gtin: product.gtin,
        uom: product.uom,
        is_batch_tracked: product.require_batch,
        is_expiry_tracked: product.shelf_life_days !== null,
        is_catch_weight: false, // Can be extended later
      },
    })
  } catch (error) {
    console.error('Product lookup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to lookup product',
        },
      },
      { status: 500 }
    )
  }
}
