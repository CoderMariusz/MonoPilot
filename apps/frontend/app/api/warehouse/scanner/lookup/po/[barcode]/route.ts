/**
 * PO Lookup API Route (Story 05.19)
 * GET /api/warehouse/scanner/lookup/po/[barcode] - Lookup PO by barcode
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ScannerReceiveService } from '@/lib/services/scanner-receive-service'

export async function GET(request: Request, props: { params: Promise<{ barcode: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient()

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

    const po = await ScannerReceiveService.lookupPO(supabase, decodeURIComponent(barcode))

    if (!po) {
      return NextResponse.json(
        { success: false, error: { code: 'PO_NOT_FOUND', message: 'PO not found' } },
        { status: 404 }
      )
    }

    // Transform lines for response
    const lines = (po.lines || []).map((line) => ({
      id: line.id,
      product_code: line.product?.code || '',
      product_name: line.product?.name || '',
      ordered_qty: line.quantity,
      received_qty: line.received_qty,
      remaining_qty: line.quantity - line.received_qty,
      uom: line.uom,
    }))

    return NextResponse.json({
      success: true,
      data: {
        id: po.id,
        po_number: po.po_number,
        supplier_name: po.supplier?.name || 'Unknown',
        expected_date: po.expected_delivery_date,
        status: po.status,
        lines,
      },
    })
  } catch (error) {
    console.error('PO lookup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to lookup PO',
        },
      },
      { status: 500 }
    )
  }
}
