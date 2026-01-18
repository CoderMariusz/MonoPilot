/**
 * Inventory Overview API Route
 * Wireframe: WH-INV-001 - Overview Tab
 * PRD: FR-WH Inventory Visibility
 *
 * Endpoint: GET /api/warehouse/inventory
 *
 * Query Parameters:
 * - groupBy: 'product' | 'location' | 'warehouse' (required)
 * - warehouse_id: UUID (optional filter)
 * - location_id: UUID (optional filter)
 * - product_id: UUID (optional filter)
 * - status: 'available' | 'reserved' | 'blocked' | 'all' (default: 'available')
 * - date_from: ISO date (optional)
 * - date_to: ISO date (optional)
 * - search: string (optional - LP number prefix search)
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 *
 * Response:
 * {
 *   success: true,
 *   data: [...], // Array of aggregated inventory data
 *   pagination: { page, limit, total, pages },
 *   summary: { total_lps, total_qty, total_value }
 * }
 *
 * SECURITY (ADR-013 compliance):
 * - Authentication: Required (401 if not authenticated)
 * - Input validation: All query params validated via Zod schema
 * - SQL injection: Protected by Supabase parameterized queries
 * - RLS: Enforced at database level via org_id policies
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { InventoryOverviewService } from '@/lib/services/inventory-overview-service'
import { inventoryOverviewQuerySchema } from '@/lib/validation/inventory-overview-schema'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams
    const rawParams = {
      groupBy: searchParams.get('groupBy'),
      warehouse_id: searchParams.get('warehouse_id') || undefined,
      location_id: searchParams.get('location_id') || undefined,
      product_id: searchParams.get('product_id') || undefined,
      status: searchParams.get('status') || 'available',
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    }

    // Validate with Zod schema
    const validationResult = inventoryOverviewQuerySchema.safeParse(rawParams)

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json(
        { success: false, error: `Validation failed: ${errors}` },
        { status: 400 }
      )
    }

    const params = validationResult.data

    // Build filters
    const filters = {
      warehouse_id: params.warehouse_id,
      location_id: params.location_id,
      product_id: params.product_id,
      status: params.status,
      date_from: params.date_from,
      date_to: params.date_to,
      search: params.search,
    }

    const pagination = {
      page: params.page,
      limit: params.limit,
    }

    // Execute query via service
    const result = await InventoryOverviewService.getInventorySummary(
      supabase,
      params.groupBy,
      filters,
      pagination
    )

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      summary: result.summary,
    })
  } catch (error) {
    console.error('Inventory overview GET error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inventory overview',
      },
      { status: 500 }
    )
  }
}
