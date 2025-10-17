import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const line = searchParams.get('line');
    const product = searchParams.get('product');
    const status = searchParams.get('status');
    const qaStatus = searchParams.get('qa_status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const kpiScope = searchParams.get('kpi_scope');

    let query = supabase
      .from('work_orders')
      .select(`
        *,
        products!inner(description, part_number),
        machines(name, code),
        users!work_orders_created_by_fkey(name),
        wo_operations(
          id,
          seq_no,
          name,
          status,
          actual_input_weight,
          actual_output_weight,
          started_at,
          finished_at,
          operator_id,
          users!wo_operations_operator_id_fkey(name)
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (line) {
      query = query.eq('line_number', line);
    }
    if (product) {
      query = query.ilike('products.description', `%${product}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (kpiScope) {
      query = query.eq('kpi_scope', kpiScope);
    }
    if (dateFrom) {
      query = query.gte('actual_start', dateFrom);
    }
    if (dateTo) {
      query = query.lte('actual_start', dateTo);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: workOrders, error, count } = await query;

    if (error) {
      throw error;
    }

    // Calculate yield percentages and other metrics
    const enrichedWorkOrders = workOrders?.map(wo => {
      const totalInput = wo.wo_operations?.reduce((sum, op) => 
        sum + (op.actual_input_weight || 0), 0) || 0;
      const totalOutput = wo.wo_operations?.reduce((sum, op) => 
        sum + (op.actual_output_weight || 0), 0) || 0;
      
      const yieldPercentage = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;
      const planAccuracy = wo.quantity > 0 ? (wo.actual_output_qty / wo.quantity) * 100 : 0;

      return {
        ...wo,
        yield_percentage: Math.round(yieldPercentage * 100) / 100,
        plan_accuracy: Math.round(planAccuracy * 100) / 100,
        total_input_weight: totalInput,
        total_output_weight: totalOutput,
        operation_count: wo.wo_operations?.length || 0
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedWorkOrders,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch work orders' 
      },
      { status: 500 }
    );
  }
}
