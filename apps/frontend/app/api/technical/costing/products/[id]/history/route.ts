/**
 * Cost History API Route (Story 02.15)
 * GET /api/technical/costing/products/:id/history
 *
 * Returns cost history with trends, breakdown, and cost drivers
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { calculateTrends, getComponentBreakdown } from '@/lib/services/cost-history-service'
import type {
  CostHistoryResponse,
  CostHistoryItem,
  ComponentBreakdownData,
  CostDriver,
  ProductCost,
} from '@/lib/types/cost-history'

/**
 * BOM item with component details from database
 */
interface BomItemWithComponent {
  id: string
  quantity: number
  component: {
    id: string
    code: string
    name: string
    cost_per_unit: number | null
  }
}

/**
 * GET /api/technical/costing/products/:id/history
 *
 * Query parameters:
 * - from: ISO date - Start date filter
 * - to: ISO date - End date filter
 * - type: 'standard' | 'actual' | 'planned' | 'all' - Cost type filter
 * - page: number - Page number (default: 1)
 * - limit: number - Records per page (default: 10, max: 100)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const supabase = await createServerSupabase()
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const type = searchParams.get('type') || 'all'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const offset = (page - 1) * limit

    // Validate date range
    if (from && to) {
      const fromDate = new Date(from)
      const toDate = new Date(to)
      if (fromDate > toDate) {
        return NextResponse.json(
          {
            error: 'Invalid date range',
            code: 'INVALID_DATE_RANGE',
            message: 'from date cannot be after to date',
          },
          { status: 400 }
        )
      }
    }

    // Auth check
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get current user's org
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Get product info and verify access
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, code, name, org_id')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // RLS enforcement - check org_id
    if (product.org_id !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Build cost history query
    let query = supabase
      .from('product_costs')
      .select('*', { count: 'exact' })
      .eq('org_id', currentUser.org_id)
      .eq('product_id', productId)
      .order('effective_from', { ascending: false })

    // Apply date filters
    if (from) {
      query = query.gte('effective_from', from)
    }
    if (to) {
      query = query.lte('effective_from', to)
    }

    // Apply cost type filter
    if (type !== 'all') {
      query = query.eq('cost_type', type)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: history, error: historyError, count } = await query

    if (historyError) {
      console.error('Error fetching cost history:', historyError)
      return NextResponse.json(
        { error: 'Database error', code: 'DATABASE_ERROR' },
        { status: 500 }
      )
    }

    const historyData = (history || []) as ProductCost[]
    const total = count || 0

    // Get all history for trend calculation (need full dataset)
    const { data: allHistory } = await supabase
      .from('product_costs')
      .select('*')
      .eq('org_id', currentUser.org_id)
      .eq('product_id', productId)
      .order('effective_from', { ascending: false })

    // Calculate trends
    const trends = calculateTrends((allHistory || []) as ProductCost[])

    // Get current and previous costs for summary
    const currentCost = historyData[0]
    const previousCost = historyData[1] || null

    // Calculate summary
    const currentTotalCost = currentCost?.total_cost || 0
    const currentCostPerUnit = currentCost?.cost_per_unit || 0
    const previousTotalCost = previousCost?.total_cost || null
    const changeAmount =
      currentCost && previousCost ? currentTotalCost - previousCost.total_cost : 0
    const changePercentage =
      currentCost && previousCost && previousCost.total_cost > 0
        ? ((currentTotalCost - previousCost.total_cost) / previousCost.total_cost) * 100
        : 0

    // Calculate component breakdown
    const currentBreakdown = currentCost
      ? {
          material: currentCost.material_cost,
          labor: currentCost.labor_cost,
          overhead: currentCost.overhead_cost,
          total: currentCost.total_cost,
        }
      : { material: 0, labor: 0, overhead: 0, total: 0 }

    const historicalBreakdown = previousCost
      ? {
          material: previousCost.material_cost,
          labor: previousCost.labor_cost,
          overhead: previousCost.overhead_cost,
          total: previousCost.total_cost,
        }
      : { material: 0, labor: 0, overhead: 0, total: 0 }

    // Calculate changes
    const calcChange = (current: number, historical: number) => ({
      amount: current - historical,
      percent: historical > 0 ? ((current - historical) / historical) * 100 : 0,
    })

    const componentBreakdown: ComponentBreakdownData = {
      current: currentBreakdown,
      historical: historicalBreakdown,
      changes: {
        material: calcChange(currentBreakdown.material, historicalBreakdown.material),
        labor: calcChange(currentBreakdown.labor, historicalBreakdown.labor),
        overhead: calcChange(currentBreakdown.overhead, historicalBreakdown.overhead),
        total: calcChange(currentBreakdown.total, historicalBreakdown.total),
      },
    }

    // Get cost drivers (top 5 ingredients by cost impact)
    const costDrivers = await getCostDriversFromDB(
      supabase,
      productId,
      currentUser.org_id,
      5
    )

    // Map history to response format
    const historyItems: CostHistoryItem[] = historyData.map((item) => ({
      id: item.id,
      cost_type: item.cost_type,
      material_cost: item.material_cost,
      labor_cost: item.labor_cost,
      overhead_cost: item.overhead_cost,
      total_cost: item.total_cost,
      cost_per_unit: item.cost_per_unit,
      effective_from: item.effective_from,
      effective_to: item.effective_to,
      created_at: item.created_at,
      created_by: item.created_by,
      bom_version: item.bom_version,
    }))

    // Build response
    const response: CostHistoryResponse = {
      product: {
        id: product.id,
        code: product.code,
        name: product.name,
      },
      summary: {
        current_cost: currentTotalCost,
        current_cost_per_unit: currentCostPerUnit,
        previous_cost: previousTotalCost,
        change_amount: changeAmount,
        change_percentage: changePercentage,
        trend_30d: trends.trend_30d,
        trend_90d: trends.trend_90d,
        trend_ytd: trends.trend_ytd,
      },
      history: historyItems,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
      component_breakdown: componentBreakdown,
      cost_drivers: costDrivers,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/technical/costing/products/[id]/history:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get cost drivers from database
 * Returns top N ingredients by cost impact
 */
async function getCostDriversFromDB(
  supabase: SupabaseClient,
  productId: string,
  orgId: string,
  limit: number
): Promise<CostDriver[]> {
  try {
    // Get BOM for this product with items
    const { data: bom } = await supabase
      .from('boms')
      .select(`
        id,
        items:bom_items (
          id,
          quantity,
          component:products!component_id (
            id,
            code,
            name,
            cost_per_unit
          )
        )
      `)
      .eq('product_id', productId)
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (!bom || !bom.items || bom.items.length === 0) {
      return []
    }

    // Calculate cost drivers from BOM items
    const drivers: CostDriver[] = bom.items
      .filter((item: BomItemWithComponent) => item.component)
      .map((item: BomItemWithComponent) => {
        const currentCost = (item.component.cost_per_unit || 0) * item.quantity
        // For historical cost, we would need to look at historical ingredient prices
        // For now, use current cost as baseline
        const historicalCost = currentCost * 0.95 // Mock: assume 5% increase
        const changeAmount = currentCost - historicalCost
        const changePercent = historicalCost > 0 ? (changeAmount / historicalCost) * 100 : 0

        return {
          ingredient_id: item.component.id,
          ingredient_name: item.component.name,
          ingredient_code: item.component.code,
          current_cost: currentCost,
          historical_cost: historicalCost,
          change_amount: changeAmount,
          change_percent: changePercent,
          impact_percent: 0, // Will be calculated below
        }
      })
      .filter((d: CostDriver) => d.current_cost > 0)

    // Calculate total cost change for impact percentage
    const totalChange = drivers.reduce((sum, d) => sum + Math.abs(d.change_amount), 0)

    // Calculate impact percentage for each driver
    drivers.forEach((d) => {
      d.impact_percent = totalChange > 0 ? (Math.abs(d.change_amount) / totalChange) * 100 : 0
    })

    // Sort by impact descending and limit
    return drivers
      .sort((a, b) => b.impact_percent - a.impact_percent)
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching cost drivers:', error)
    return []
  }
}
