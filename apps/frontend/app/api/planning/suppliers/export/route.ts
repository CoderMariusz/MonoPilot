/**
 * API Route: Export Suppliers
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * POST /api/planning/suppliers/export - Export suppliers to Excel
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { exportSuppliersSchema } from '@/lib/validation/supplier-schema'
import { exportSuppliersToExcel } from '@/lib/services/supplier-service'
import { ZodError } from 'zod'
import { validateOrigin, createCsrfErrorResponse } from '@/lib/csrf'

/**
 * POST /api/planning/suppliers/export
 * Export suppliers to Excel (xlsx) file
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection: Validate request origin
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { success: false, ...createCsrfErrorResponse() },
        { status: 403 }
      )
    }

    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = exportSuppliersSchema.parse(body)

    // Generate export file
    const blob = await exportSuppliersToExcel({
      supplier_ids: validatedData.supplier_ids,
      include_products: validatedData.include_products,
      include_purchase_history: validatedData.include_purchase_history,
    })

    // Generate filename
    const date = new Date().toISOString().split('T')[0]
    const filename = `suppliers_export_${date}.csv`

    // Return file
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/planning/suppliers/export:', error)

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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
          ...(process.env.NODE_ENV === 'development' && {
            debug: error instanceof Error ? error.message : 'Unknown error',
          }),
        },
      },
      { status: 500 }
    )
  }
}
