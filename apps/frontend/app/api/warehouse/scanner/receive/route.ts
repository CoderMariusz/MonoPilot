/**
 * Scanner Receive API Route (Story 05.19)
 * POST /api/warehouse/scanner/receive - Process scanner receipt
 */

import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { scannerReceiveSchema } from '@/lib/validation/scanner-receive'
import { ScannerReceiveService } from '@/lib/services/scanner-receive-service'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase()

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

    // Parse and validate request body
    const body = await request.json()
    const validated = scannerReceiveSchema.parse(body)

    // Process receipt
    const result = await ScannerReceiveService.processReceipt(supabase, {
      poId: validated.po_id,
      poLineId: validated.po_line_id,
      warehouseId: validated.warehouse_id,
      locationId: validated.location_id,
      receivedQty: validated.received_qty,
      batchNumber: validated.batch_number ?? undefined,
      supplierBatchNumber: validated.supplier_batch_number ?? undefined,
      expiryDate: validated.expiry_date ?? undefined,
      manufactureDate: validated.manufacture_date ?? undefined,
      notes: validated.notes ?? undefined,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          grn: result.grn,
          lp: result.lp,
          po_line_status: result.poLineStatus,
          po_status: result.poStatus,
          print_job_id: result.printJobId,
          over_receipt: result.overReceipt
            ? {
                ordered_qty: result.overReceipt.orderedQty,
                total_received: result.overReceipt.totalReceived,
                over_receipt_pct: result.overReceipt.overReceiptPct,
              }
            : undefined,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Determine error code and status
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: errorMessage.includes('PO') ? 'PO_NOT_FOUND' : 'NOT_FOUND',
            message: errorMessage,
          },
        },
        { status: 404 }
      )
    }

    if (errorMessage.includes('over-receipt') || errorMessage.includes('Over-receipt')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OVER_RECEIPT_BLOCKED',
            message: errorMessage,
          },
        },
        { status: 400 }
      )
    }

    if (errorMessage.includes('required')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: errorMessage.includes('Batch')
              ? 'BATCH_REQUIRED'
              : errorMessage.includes('Expiry')
                ? 'EXPIRY_REQUIRED'
                : 'VALIDATION_ERROR',
            message: errorMessage,
          },
        },
        { status: 400 }
      )
    }

    console.error('Scanner receive error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process receipt',
        },
      },
      { status: 500 }
    )
  }
}
