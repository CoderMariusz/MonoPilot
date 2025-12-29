/**
 * Variance Report API Route (Story 02.15)
 * GET /api/technical/costing/variance/report
 *
 * Returns variance analysis comparing standard vs actual costs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  calculateVariance,
  identifySignificantVariances,
} from '@/lib/services/variance-analysis-service'
import type {
  VarianceReportResponse,
  WorkOrderVarianceDetail,
  ProductCost,
  WorkOrderCost,
} from '@/lib/types/variance'


/**
 * Cost variance record from database
 */
interface CostVarianceRecord {
  id: string
  work_order_id: string
  product_id: string
  standard_material: number | null
  actual_material: number | null
  standard_labor: number | null
  actual_labor: number | null
  standard_overhead: number | null
  actual_overhead: number | null
  standard_total: number | null
  actual_total: number | null
  variance_total: number | null
  variance_percent: number | null
  analyzed_at: string
  work_order: {
    id: string
    code: string
    completed_at: string | null
  } | null
}

/**
 * Valid period values in days
 */
const VALID_PERIODS = [7, 30, 90, 365]

/**
 * Default period in days
 */
const DEFAULT_PERIOD = 30

/**
 * GET /api/technical/costing/variance/report
 *
 * Query parameters:
 * - productId: UUID (required) - Product to analyze
 * - period: number - Analysis period in days: 7 | 30 | 90 | 365 (default: 30)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const productId = searchParams.get('productId')
    const periodParam = searchParams.get('period')
    const period = periodParam ? parseInt(periodParam, 10) : DEFAULT_PERIOD

    // Validate productId is provided
    if (!productId) {
      return NextResponse.json(
        {
          error: 'productId is required',
          code: 'MISSING_PRODUCT_ID',
        },
        { status: 400 }
      )
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

    // Get product and verify access
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

    // RLS enforcement
    if (product.org_id !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Validate period - use default if invalid
    const validPeriod = VALID_PERIODS.includes(period) ? period : DEFAULT_PERIOD

    // Get standard cost for the product (most recent)
    const { data: standardCost, error: standardError } = await supabase
      .from('product_costs')
      .select('*')
      .eq('org_id', currentUser.org_id)
      .eq('product_id', productId)
      .eq('cost_type', 'standard')
      .order('effective_from', { ascending: false })
      .limit(1)
      .single()

    // Calculate cutoff date for period
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - validPeriod)
    const cutoffIso = cutoffDate.toISOString()

    // Get cost variances from production (work orders)
    const { data: varianceRecords, error: varianceError } = await supabase
      .from('cost_variances')
      .select(`
        id,
        work_order_id,
        product_id,
        standard_material,
        actual_material,
        standard_labor,
        actual_labor,
        standard_overhead,
        actual_overhead,
        standard_total,
        actual_total,
        variance_total,
        variance_percent,
        analyzed_at,
        work_order:work_orders (
          id,
          code,
          completed_at
        )
      `)
      .eq('org_id', currentUser.org_id)
      .eq('product_id', productId)
      .gte('analyzed_at', cutoffIso)
      .order('analyzed_at', { ascending: false })

    // If no variance records exist, try to build from work orders directly
    let workOrderCosts: WorkOrderCost[] = []
    let workOrderDetails: WorkOrderVarianceDetail[] = []

    if (!varianceRecords || varianceRecords.length === 0) {
      // No production data - return empty result
      const response: VarianceReportResponse = {
        product_id: productId,
        period_days: validPeriod,
        work_orders_analyzed: 0,
        components: null,
        significant_variances: [],
        work_order_details: [],
      }

      return NextResponse.json(response, { status: 200 })
    }

    // Build work order costs from variance records
    workOrderCosts = varianceRecords.map((record: CostVarianceRecord) => ({
      id: record.id,
      work_order_id: record.work_order_id,
      org_id: currentUser.org_id,
      product_id: record.product_id,
      material_cost: record.actual_material || 0,
      labor_cost: record.actual_labor || 0,
      overhead_cost: record.actual_overhead || 0,
      total_cost: record.actual_total || 0,
      created_at: record.analyzed_at,
      created_by: null,
    }))

    // Build work order details
    workOrderDetails = varianceRecords.map((record: CostVarianceRecord) => ({
      work_order_id: record.work_order_id,
      work_order_code: record.work_order?.code || '',
      standard_cost: record.standard_total || 0,
      actual_cost: record.actual_total || 0,
      variance: record.variance_total || 0,
      variance_percent: record.variance_percent || 0,
      completed_at: record.work_order?.completed_at || record.analyzed_at,
    }))

    // Use standard cost if available, otherwise create mock standard from first variance record
    const standardForCalc: ProductCost = standardCost || {
      id: '',
      product_id: productId,
      org_id: currentUser.org_id,
      cost_type: 'standard' as const,
      material_cost: varianceRecords[0].standard_material || 0,
      labor_cost: varianceRecords[0].standard_labor || 0,
      overhead_cost: varianceRecords[0].standard_overhead || 0,
      total_cost: varianceRecords[0].standard_total || 0,
      cost_per_unit: null,
      effective_from: new Date().toISOString(),
      effective_to: null,
      created_at: new Date().toISOString(),
      created_by: null,
      bom_version: null,
    }

    // Calculate variance
    const varianceResult = calculateVariance(standardForCalc, workOrderCosts)

    // Build response
    const response: VarianceReportResponse = {
      product_id: productId,
      period_days: validPeriod,
      work_orders_analyzed: varianceResult.work_orders_analyzed,
      components: varianceResult.components,
      significant_variances: varianceResult.significant_variances,
      work_order_details: workOrderDetails,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/technical/costing/variance/report:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
