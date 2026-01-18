/**
 * Stock Adjustments API - List & Create
 * Story: WH-INV-001 - Stock Adjustment History & Approval Workflow
 * Phase: GREEN - Minimal code to pass tests
 *
 * Endpoints:
 * - GET /api/warehouse/inventory/adjustments - List adjustments with filters
 * - POST /api/warehouse/inventory/adjustments - Create new adjustment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StockAdjustmentService } from '@/lib/services/stock-adjustment-service'
import {
  adjustmentListFiltersSchema,
  createAdjustmentSchema,
} from '@/lib/validation/stock-adjustment-schema'
import { z } from 'zod'

// =============================================================================
// GET - List Stock Adjustments
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const filters = {
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      reason: searchParams.get('reason') || undefined,
      adjusted_by: searchParams.get('adjusted_by') || undefined,
      status: searchParams.get('status') || 'all',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    }

    const validatedFilters = adjustmentListFiltersSchema.parse(filters)

    // Fetch adjustments
    const result = await StockAdjustmentService.list(supabase, validatedFilters)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[GET /api/warehouse/inventory/adjustments]', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch adjustments',
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST - Create Stock Adjustment
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedInput = createAdjustmentSchema.parse(body)

    // Create adjustment
    const adjustment = await StockAdjustmentService.create(
      supabase,
      validatedInput,
      user.id
    )

    return NextResponse.json(adjustment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[POST /api/warehouse/inventory/adjustments]', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create adjustment',
      },
      { status: 500 }
    )
  }
}
