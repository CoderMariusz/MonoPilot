// API Route: Print License Plate Label
// Epic 5 Batch 5A-3 - Story 5.12: Auto-Print Labels
// POST /api/warehouse/license-plates/[id]/print

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

// Generate ZPL label stub (basic format)
function generateZPL(lpData: {
  lp_number: string
  product_code: string
  product_name: string
  quantity: number
  uom: string
  manufacturing_date?: string | null
  expiry_date?: string | null
  supplier_batch_number?: string | null
}): string {
  return `^XA
^FO50,50^A0N,40,40^FDLICENSE PLATE^FS
^FO50,100^BY2^BCN,100,Y,N,N^FD${lpData.lp_number}^FS
^FO50,220^A0N,30,30^FDProduct: ${lpData.product_code}^FS
^FO50,260^A0N,25,25^FD${lpData.product_name}^FS
^FO50,300^A0N,30,30^FDQty: ${lpData.quantity} ${lpData.uom}^FS
${lpData.supplier_batch_number ? `^FO50,340^A0N,25,25^FDBatch: ${lpData.supplier_batch_number}^FS` : ''}
${lpData.manufacturing_date ? `^FO50,380^A0N,25,25^FDMfg: ${lpData.manufacturing_date}^FS` : ''}
${lpData.expiry_date ? `^FO50,420^A0N,25,25^FDExp: ${lpData.expiry_date}^FS` : ''}
^XZ`
}

// POST - Generate print job for LP label
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabaseAdmin = createServerSupabaseAdmin()
    const { id: lp_id } = await context.params

    // Fetch License Plate with product details
    const { data: lp, error: lpError } = await supabaseAdmin
      .from('license_plates')
      .select(`
        *,
        products (
          code,
          name
        )
      `)
      .eq('id', lp_id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (lpError || !lp) {
      return NextResponse.json({ error: 'License Plate not found' }, { status: 404 })
    }

    // Generate ZPL label
    const zplData = generateZPL({
      lp_number: lp.lp_number,
      product_code: lp.products?.code || 'UNKNOWN',
      product_name: lp.products?.name || 'Unknown Product',
      quantity: lp.quantity,
      uom: lp.uom,
      manufacturing_date: lp.manufacturing_date,
      expiry_date: lp.expiry_date,
      supplier_batch_number: lp.supplier_batch_number,
    })

    // TODO: In production, send to actual printer
    // For now, return label data for preview/manual printing
    return NextResponse.json(
      {
        message: 'Print job created (stub)',
        lp_id,
        lp_number: lp.lp_number,
        zpl: zplData,
        format: 'ZPL',
        note: 'Integration with actual printer pending. Use ZPL data with Zebra printer or ZPL viewer.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/warehouse/license-plates/[id]/print:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
