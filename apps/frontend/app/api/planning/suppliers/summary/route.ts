/**
 * API Route: Supplier Summary KPIs
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * GET /api/planning/suppliers/summary - Get supplier KPI summary
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getSupplierSummary } from '@/lib/services/supplier-service'

/**
 * GET /api/planning/suppliers/summary
 * Returns KPI summary for supplier dashboard
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

    // Fetch summary
    const summary = await getSupplierSummary()

    return NextResponse.json({
      success: true,
      data: summary,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/suppliers/summary:', error)

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
