/**
 * API Route: Generate LP Label (ZPL)
 * Story 04.7b: Output Registration Scanner
 *
 * POST /api/production/output/generate-label - Generate ZPL content for LP
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrgContext } from '@/lib/hooks/server/getOrgContext'
import { generateLabelSchema } from '@/lib/validation/scanner-output'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get org context
    const orgContext = await getOrgContext()
    if (!orgContext?.org_id) {
      return NextResponse.json({ error: 'Organization context not found' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = generateLabelSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { lp_id } = validation.data

    // Get LP with product info
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select(
        `
        id,
        lp_number,
        quantity,
        current_qty,
        uom,
        batch_number,
        expiry_date,
        qa_status,
        org_id,
        products!license_plates_product_id_fkey(id, name, code)
      `
      )
      .eq('id', lp_id)
      .single()

    if (lpError || !lp) {
      return NextResponse.json({ error: 'LP not found', success: false }, { status: 404 })
    }

    // Verify org isolation
    if (lp.org_id !== orgContext.org_id) {
      return NextResponse.json({ error: 'LP not found', success: false }, { status: 404 })
    }

    const product = lp.products as { id: string; name: string; code: string }
    const qtyValue = lp.current_qty || lp.quantity
    const qtyWithUom = `${qtyValue} ${lp.uom}`
    const expiryDate = lp.expiry_date
      ? new Date(lp.expiry_date).toISOString().slice(0, 10)
      : ''

    // Generate ZPL content
    const zplContent = generateZPLContent({
      lpNumber: lp.lp_number,
      productName: product.name,
      qtyWithUom,
      batchNumber: lp.batch_number || '',
      expiryDate,
      qaStatus: lp.qa_status || 'pending',
    })

    return NextResponse.json({
      success: true,
      zpl_content: zplContent,
      label_fields: {
        lp_number: lp.lp_number,
        barcode_type: 'Code128',
        product_name: product.name,
        qty_with_uom: qtyWithUom,
        batch_number: lp.batch_number || '',
        expiry_date: expiryDate,
        qa_status: lp.qa_status || 'pending',
      },
    })
  } catch (error) {
    console.error('Error in POST /api/production/output/generate-label:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateZPLContent(fields: {
  lpNumber: string
  productName: string
  qtyWithUom: string
  batchNumber: string
  expiryDate: string
  qaStatus: string
}): string {
  // Standard ZPL for 4x6 label (203 DPI)
  return `^XA
^FO50,30^A0N,30,30^FD${fields.productName}^FS
^FO50,70^A0N,24,24^FDQty: ${fields.qtyWithUom}^FS
^FO50,100^A0N,24,24^FDBatch: ${fields.batchNumber}^FS
^FO50,130^A0N,24,24^FDExpiry: ${fields.expiryDate}^FS
^FO50,160^A0N,24,24^FDQA: ${fields.qaStatus.toUpperCase()}^FS
^FO50,200^BY3^BCN,100,Y,N,N^FD${fields.lpNumber}^FS
^FO50,320^A0N,20,20^FD${fields.lpNumber}^FS
^XZ`
}
