/**
 * API Route: Validate Supplier Code
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * GET /api/planning/suppliers/validate-code - Check code availability
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { validateSupplierCode } from '@/lib/services/supplier-service'

/**
 * GET /api/planning/suppliers/validate-code
 * Check if supplier code is available (for uniqueness validation)
 */
export async function GET(request: NextRequest) {
  try {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const excludeId = searchParams.get('exclude_id')

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Code parameter is required',
          },
        },
        { status: 400 }
      )
    }

    // Validate code availability
    const available = await validateSupplierCode(code, excludeId ?? undefined)

    return NextResponse.json({
      success: true,
      data: { available },
    })
  } catch (error) {
    console.error('Error in GET /api/planning/suppliers/validate-code:', error)

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
