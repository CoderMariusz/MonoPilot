/**
 * API Route: Next Supplier Code
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * GET /api/planning/suppliers/next-code - Get next auto-generated code
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getNextSupplierCode } from '@/lib/services/supplier-service'

/**
 * GET /api/planning/suppliers/next-code
 * Returns next available supplier code (e.g., SUP-001)
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

    // Get next code
    const code = await getNextSupplierCode()

    return NextResponse.json({
      success: true,
      data: { code },
    })
  } catch (error) {
    console.error('Error in GET /api/planning/suppliers/next-code:', error)

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
