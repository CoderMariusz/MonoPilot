/**
 * API Route: Bulk Activate Suppliers
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * POST /api/planning/suppliers/bulk-activate - Activate multiple suppliers
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { bulkActivateSchema } from '@/lib/validation/supplier-schema'
import { bulkActivateSuppliers } from '@/lib/services/supplier-service'
import { ZodError } from 'zod'
import { validateOrigin, createCsrfErrorResponse } from '@/lib/csrf'

/**
 * POST /api/planning/suppliers/bulk-activate
 * Activate multiple inactive suppliers
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
    const validatedData = bulkActivateSchema.parse(body)

    // Perform bulk activation
    const result = await bulkActivateSuppliers(validatedData.supplier_ids)

    return NextResponse.json({
      success: true,
      data: {
        activated_count: result.success_count,
        failed_count: result.failed_count,
        results: result.results.map((r) => ({
          id: r.id,
          status: r.status === 'success' ? 'activated' : 'failed',
          error: r.error,
        })),
      },
    })
  } catch (error) {
    console.error('Error in POST /api/planning/suppliers/bulk-activate:', error)

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
