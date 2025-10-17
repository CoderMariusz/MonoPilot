import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket') || 'day';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const line = searchParams.get('line');
    const product = searchParams.get('product');

    // Determine which view to use based on bucket
    let viewName = 'vw_yield_fg_daily';
    switch (bucket) {
      case 'week':
        viewName = 'vw_yield_fg_weekly';
        break;
      case 'month':
        viewName = 'vw_yield_fg_monthly';
        break;
      default:
        viewName = 'vw_yield_fg_daily';
    }

    let query = supabase
      .from(viewName)
      .select('*')
      .order('production_date', { ascending: false });

    // Apply date filters
    if (from) {
      query = query.gte('production_date', from);
    }
    if (to) {
      query = query.lte('production_date', to);
    }

    // Apply line filter
    if (line) {
      query = query.eq('production_line', line);
    }

    // Apply product filter
    if (product) {
      query = query.ilike('product', `%${product}%`);
    }

    const { data: yieldData, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate summary metrics
    const summary = {
      total_work_orders: yieldData?.reduce((sum, row) => sum + (row.work_order_count || 0), 0) || 0,
      total_planned_boxes: yieldData?.reduce((sum, row) => sum + (row.total_planned_boxes || 0), 0) || 0,
      total_actual_boxes: yieldData?.reduce((sum, row) => sum + (row.total_actual_boxes || 0), 0) || 0,
      total_fg_weight_kg: yieldData?.reduce((sum, row) => sum + (row.total_fg_weight_kg || 0), 0) || 0,
      total_meat_input_kg: yieldData?.reduce((sum, row) => sum + (row.total_meat_input_kg || 0), 0) || 0,
      total_waste_kg: yieldData?.reduce((sum, row) => sum + (row.waste_kg || 0), 0) || 0,
      avg_yield_percent: yieldData?.length > 0 
        ? yieldData.reduce((sum, row) => sum + (row.fg_yield_percent || 0), 0) / yieldData.length 
        : 0,
      avg_plan_accuracy: yieldData?.length > 0 
        ? yieldData.reduce((sum, row) => sum + (row.plan_accuracy_percent || 0), 0) / yieldData.length 
        : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        details: yieldData,
        bucket,
        date_range: { from, to },
        filters: { line, product }
      }
    });

  } catch (error) {
    console.error('Error fetching FG yield data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch FG yield data' 
      },
      { status: 500 }
    );
  }
}
