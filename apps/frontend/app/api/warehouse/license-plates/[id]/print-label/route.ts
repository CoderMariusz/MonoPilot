/**
 * API Route: POST /api/warehouse/license-plates/[id]/print-label
 * Story 05.14 - LP Label Printing
 *
 * Generates ZPL label for a single License Plate
 *
 * AC Coverage:
 * - AC-1: ZPL template generation
 * - AC-2: Print label API endpoint
 * - AC-11: Copies validation (1-100)
 * - AC-12: RLS policy enforcement
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { LabelPrintService } from '@/lib/services/label-print-service'
import { printLabelQuerySchema } from '@/lib/validation/label-print-schemas'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = {
      copies: url.searchParams.get('copies') || '1',
      format: url.searchParams.get('format') || 'zpl',
    }

    // Validate query params
    const validationResult = printLabelQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { copies } = validationResult.data

    // Fetch LP with product and location data (RLS enforced)
    const { data: lp, error: lpError } = await supabase
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
        warehouse_id,
        status,
        qa_status,
        products (
          id,
          name,
          code
        ),
        locations (
          id,
          full_path
        ),
        warehouses (
          id,
          name,
          code
        )
      `)
      .eq('id', params.id)
      .single()

    if (lpError || !lp) {
      if (lpError?.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'License Plate not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching LP:', lpError)
      return NextResponse.json(
        { error: 'Failed to fetch License Plate' },
        { status: 500 }
      )
    }

    // Prepare label data
    const labelData = {
      lp_number: lp.lp_number,
      product_name: (lp.products as unknown as { name: string } | null)?.name || 'Unknown Product',
      product_id: lp.product_id,
      quantity: lp.quantity,
      uom: lp.uom,
      batch_number: lp.batch_number,
      expiry_date: lp.expiry_date,
      manufacture_date: lp.manufacture_date,
      location_path: (lp.locations as unknown as { full_path: string } | null)?.full_path || null,
    }

    // Validate label data
    const validation = LabelPrintService.validateData(labelData)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid label data',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Generate ZPL
    const zpl = LabelPrintService.buildZPL(labelData, {
      copies,
      label_size: '4x6',
      include_qr: true,
    })

    // Log print request (optional audit)
    try {
      await supabase.from('label_print_logs').insert({
        lp_id: lp.id,
        label_type: 'lp',
        copies,
        printed_by: user.id,
        auto_print: false,
        print_method: 'download',
      })
    } catch (logError) {
      // Non-critical - continue even if logging fails
      console.error('Failed to log print request:', logError)
    }

    // Return response
    return NextResponse.json({
      zpl,
      lp_number: lp.lp_number,
      product_name: labelData.product_name,
      copies,
      label_size: '4x6',
      generated_at: new Date().toISOString(),
      download_filename: `${lp.lp_number}.zpl`,
    })
  } catch (error) {
    console.error('Error generating label:', error)
    return NextResponse.json(
      { error: 'Failed to generate label' },
      { status: 500 }
    )
  }
}
