/**
 * WO Cost Variance Report API Route - EPIC-003 Phase 1
 * Get cost variance report for multiple work orders with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/costs/wo/variance-report?status=completed&product_id=123&date_from=2025-01-01&date_to=2025-12-31
 * Get WO cost variance report with filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // Build query
    let query = supabase
      .from('wo_costs')
      .select(`
        *,
        work_order:work_orders(
          id,
          wo_number,
          status,
          qty_planned,
          qty_produced,
          product_id,
          scheduled_date,
          products(name, sku)
        )
      `)
      .order('created_at', { ascending: false });

    // Get WO costs with work orders, then filter by WO fields
    const { data: woCosts, error } = await query;

    if (error) {
      console.error('Error fetching WO variance report:', error);
      return NextResponse.json(
        { error: 'Failed to fetch WO cost variance report' },
        { status: 500 }
      );
    }

    // Apply filters in memory (since we're filtering on related table)
    let filteredResults = woCosts || [];

    const status = searchParams.get('status');
    const productId = searchParams.get('product_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    if (status) {
      filteredResults = filteredResults.filter(
        (wc: any) => wc.work_order?.status === status
      );
    }

    if (productId) {
      filteredResults = filteredResults.filter(
        (wc: any) => wc.work_order?.product_id === parseInt(productId)
      );
    }

    if (dateFrom) {
      filteredResults = filteredResults.filter(
        (wc: any) => wc.work_order?.scheduled_date >= dateFrom
      );
    }

    if (dateTo) {
      filteredResults = filteredResults.filter(
        (wc: any) => wc.work_order?.scheduled_date <= dateTo
      );
    }

    return NextResponse.json(filteredResults);

  } catch (error) {
    console.error('WO variance report GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
