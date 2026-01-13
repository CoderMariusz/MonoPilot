/**
 * Validate Receipt API Route (Story 05.19)
 * POST /api/warehouse/scanner/validate-receipt - Pre-validate receipt data
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { validateReceiptSchema } from '@/lib/validation/scanner-receive'
import { ScannerReceiveService } from '@/lib/services/scanner-receive-service'

export async function POST(request: Request) {
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

    // Parse and validate request body
    const body = await request.json()
    const validated = validateReceiptSchema.parse(body)

    // Validate receipt
    const result = await ScannerReceiveService.validateReceipt(supabase, {
      poId: validated.po_id,
      poLineId: validated.po_line_id,
      receivedQty: validated.received_qty,
      batchNumber: validated.batch_number ?? undefined,
      expiryDate: validated.expiry_date ?? undefined,
    })

    return NextResponse.json({
      success: true,
      data: {
        valid: result.valid,
        errors: result.errors,
        warnings: result.warnings,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    console.error('Validate receipt error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate receipt',
        },
      },
      { status: 500 }
    )
  }
}
