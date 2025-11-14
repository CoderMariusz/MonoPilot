import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

/**
 * GET /api/production/consume
 *
 * Fetches material consumption data with variance analysis.
 * Uses vw_consume view for aggregated consumption metrics.
 *
 * Query Parameters:
 * - woId: Filter by work order ID
 * - from: Start date (YYYY-MM-DD)
 * - to: End date (YYYY-MM-DD)
 * - materialId: Filter by material/product ID
 * - line: Filter by production line
 *
 * Returns:
 * - data: Array of consumption records with variance analysis
 * - summary: Aggregated metrics (total materials, avg variance, totals)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const woId = searchParams.get('woId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const materialId = searchParams.get('materialId');
    const line = searchParams.get('line');

    // Build query on vw_consume view
    let query = supabase
      .from('vw_consume')
      .select('*')
      .order('production_date_london', { ascending: false });

    // Apply filters
    if (woId) {
      query = query.eq('wo_number', `WO-${woId}`);
    }
    if (from) {
      query = query.gte('production_date_london', from);
    }
    if (to) {
      query = query.lte('production_date_london', to);
    }
    if (line) {
      query = query.eq('production_line', line);
    }
    // Note: materialId filtering would require joining with products table
    // For now, we filter in the application layer if needed
    // TODO: Add material filter via join or separate view

    const { data: consumeData, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate summary metrics
    const summary = {
      total_materials: consumeData?.length || 0,
      avg_variance_percent:
        consumeData?.length > 0
          ? consumeData.reduce(
              (sum, row) => sum + (row.variance_percent || 0),
              0
            ) / consumeData.length
          : 0,
      total_standard_kg:
        consumeData?.reduce(
          (sum, row) => sum + (row.bom_standard_kg || 0),
          0
        ) || 0,
      total_actual_kg:
        consumeData?.reduce(
          (sum, row) => sum + (row.actual_consumed_kg || 0),
          0
        ) || 0,
      total_variance_kg:
        consumeData?.reduce((sum, row) => sum + (row.variance_kg || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        details: consumeData,
        date_range: { from, to },
        filters: { woId, line, materialId },
      },
    });
  } catch (error) {
    console.error('Error fetching consumption data:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch consumption data',
      },
      { status: 500 }
    );
  }
}
