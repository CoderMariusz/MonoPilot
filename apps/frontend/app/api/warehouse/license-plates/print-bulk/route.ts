/**
 * API Route: POST /api/warehouse/license-plates/print-bulk
 * Story 05.14 - LP Label Printing (Bulk)
 *
 * Generates ZPL labels for multiple License Plates
 * Returns ZIP file with individual .zpl files or concatenated ZPL
 *
 * AC Coverage:
 * - AC-6: Bulk print from LP list
 * - AC-11: Copies validation
 * - AC-13: Performance (50 labels < 3s)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { LabelPrintService } from '@/lib/services/label-print-service'
import { printBulkLabelsSchema } from '@/lib/validation/label-print-schemas'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = printBulkLabelsSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { lp_ids, copies, format } = validationResult.data

    // Fetch all LPs with product and location data (RLS enforced)
    const { data: lps, error: lpsError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        uom,
        batch_number,
        expiry_date,
        manufacture_date,
        location_id,
        products (
          id,
          name,
          code
        ),
        locations (
          id,
          full_path
        )
      `)
      .in('id', lp_ids)

    if (lpsError) {
      console.error('Error fetching LPs:', lpsError)
      return NextResponse.json(
        { error: 'Failed to fetch License Plates' },
        { status: 500 }
      )
    }

    if (!lps || lps.length === 0) {
      return NextResponse.json(
        { error: 'No License Plates found' },
        { status: 404 }
      )
    }

    // Prepare label data for each LP
    const labelDataArray = lps.map((lp) => ({
      lp_number: lp.lp_number,
      product_name: (lp.products as { name: string })?.name || 'Unknown Product',
      product_id: lp.product_id,
      quantity: lp.quantity,
      uom: lp.uom,
      batch_number: lp.batch_number,
      expiry_date: lp.expiry_date,
      manufacture_date: lp.manufacture_date,
      location_path: (lp.locations as { full_path: string })?.full_path || null,
    }))

    // Generate ZPL for each LP
    const options = {
      copies,
      label_size: '4x6' as const,
      include_qr: true,
      concat: format === 'concat',
    }

    const zplResults = LabelPrintService.generateBulkLabels(labelDataArray, options)

    // Log print requests
    try {
      const logEntries = lps.map((lp) => ({
        lp_id: lp.id,
        label_type: 'lp' as const,
        copies,
        printed_by: user.id,
        auto_print: false,
        print_method: 'download' as const,
      }))

      await supabase.from('label_print_logs').insert(logEntries)
    } catch (logError) {
      // Non-critical - continue even if logging fails
      console.error('Failed to log bulk print request:', logError)
    }

    // Return based on format
    if (format === 'concat') {
      // Return concatenated ZPL as text
      const concatenatedZpl = typeof zplResults === 'string' ? zplResults : zplResults.join('\n')

      return NextResponse.json({
        format: 'concat',
        total_labels: lps.length,
        total_copies: lps.length * copies,
        file_size_bytes: concatenatedZpl.length,
        zpl: concatenatedZpl,
      })
    }

    // Return ZIP file
    const zip = new JSZip()
    const zplArray = Array.isArray(zplResults) ? zplResults : [zplResults]

    lps.forEach((lp, index) => {
      const zpl = zplArray[index]
      if (zpl) {
        zip.file(`${lp.lp_number}.zpl`, zpl)
      }
    })

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="lp-labels-${new Date().toISOString().split('T')[0]}.zip"`,
        'Content-Length': String(zipBuffer.length),
      },
    })
  } catch (error) {
    console.error('Error generating bulk labels:', error)
    return NextResponse.json(
      { error: 'Failed to generate bulk labels' },
      { status: 500 }
    )
  }
}
