import { supabase } from '../supabase/client-browser';

// Yield API - Production yield calculations
export class YieldAPI {
  // Get PR yield data with time buckets
  static async getPRYield(params: {
    bucket: 'day' | 'week' | 'month';
    from?: string;
    to?: string;
    line?: string;
  }): Promise<{
    data: Array<{
      production_date: string;
      production_date_utc: string;
      production_line: string;
      product: string;
      part_number: string;
      work_order_count: number;
      total_input_kg: number;
      total_output_kg: number;
      pr_yield_percent: number;
      pr_consumption_per_kg: number;
      plan_accuracy_percent: number;
    }>;
    summary: {
      total_work_orders: number;
      avg_yield_percent: number;
      total_input_kg: number;
      total_output_kg: number;
    };
  }> {
    try {
      let viewName: string;
      switch (params.bucket) {
        case 'day':
          viewName = 'vw_yield_pr_daily';
          break;
        case 'week':
          viewName = 'vw_yield_pr_weekly';
          break;
        case 'month':
          viewName = 'vw_yield_pr_monthly';
          break;
        default:
          viewName = 'vw_yield_pr_daily';
      }

      let query = supabase.from(viewName).select('*');

      // Apply filters
      if (params.from) {
        query = query.gte('production_date', params.from);
      }
      if (params.to) {
        query = query.lte('production_date', params.to);
      }
      if (params.line) {
        query = query.eq('production_line', params.line);
      }

      const { data, error } = await query.order('production_date', { ascending: false });

      if (error) throw error;

      // Calculate summary
      const summary = {
        total_work_orders: data?.reduce((sum, row) => sum + row.work_order_count, 0) || 0,
        avg_yield_percent: data?.length > 0 
          ? data.reduce((sum, row) => sum + row.pr_yield_percent, 0) / data.length 
          : 0,
        total_input_kg: data?.reduce((sum, row) => sum + row.total_input_kg, 0) || 0,
        total_output_kg: data?.reduce((sum, row) => sum + row.total_output_kg, 0) || 0
      };

      return {
        data: data || [],
        summary
      };
    } catch (error) {
      console.error('Error fetching PR yield data:', error);
      throw error;
    }
  }

  // Get FG yield data with time buckets
  static async getFGYield(params: {
    bucket: 'day' | 'week' | 'month';
    from?: string;
    to?: string;
    line?: string;
  }): Promise<{
    data: Array<{
      production_date: string;
      production_date_utc: string;
      production_line: string;
      product: string;
      part_number: string;
      work_order_count: number;
      total_planned_boxes: number;
      total_actual_boxes: number;
      avg_box_weight_kg: number;
      total_fg_weight_kg: number;
      total_meat_input_kg: number;
      fg_yield_percent: number;
      plan_accuracy_percent: number;
      waste_kg: number;
    }>;
    summary: {
      total_work_orders: number;
      avg_yield_percent: number;
      total_boxes: number;
      total_waste_kg: number;
    };
  }> {
    try {
      let viewName: string;
      switch (params.bucket) {
        case 'day':
          viewName = 'vw_yield_fg_daily';
          break;
        case 'week':
          viewName = 'vw_yield_fg_weekly';
          break;
        case 'month':
          viewName = 'vw_yield_fg_monthly';
          break;
        default:
          viewName = 'vw_yield_fg_daily';
      }

      let query = supabase.from(viewName).select('*');

      // Apply filters
      if (params.from) {
        query = query.gte('production_date', params.from);
      }
      if (params.to) {
        query = query.lte('production_date', params.to);
      }
      if (params.line) {
        query = query.eq('production_line', params.line);
      }

      const { data, error } = await query.order('production_date', { ascending: false });

      if (error) throw error;

      // Calculate summary
      const summary = {
        total_work_orders: data?.reduce((sum, row) => sum + row.work_order_count, 0) || 0,
        avg_yield_percent: data?.length > 0 
          ? data.reduce((sum, row) => sum + row.fg_yield_percent, 0) / data.length 
          : 0,
        total_boxes: data?.reduce((sum, row) => sum + row.total_actual_boxes, 0) || 0,
        total_waste_kg: data?.reduce((sum, row) => sum + row.waste_kg, 0) || 0
      };

      return {
        data: data || [],
        summary
      };
    } catch (error) {
      console.error('Error fetching FG yield data:', error);
      throw error;
    }
  }

  // Get yield KPIs for dashboard
  static async getYieldKPIs(params: {
    kpi_scope: 'PR' | 'FG';
    bucket: 'day' | 'week' | 'month';
    from?: string;
    to?: string;
  }): Promise<{
    yield_percent: number;
    consumption_per_kg: number;
    plan_accuracy_percent: number;
    on_time_percent: number;
    total_work_orders: number;
    total_input_kg: number;
    total_output_kg: number;
  }> {
    try {
      const yieldData = params.kpi_scope === 'PR' 
        ? await this.getPRYield(params)
        : await this.getFGYield(params);

      const data = yieldData.data;
      const summary = yieldData.summary;

      // Calculate KPIs
      const yield_percent = summary.avg_yield_percent;
      const consumption_per_kg = (summary as any).total_input_kg > 0 
        ? (summary as any).total_input_kg / (summary as any).total_output_kg 
        : 0;
      const plan_accuracy_percent = data.length > 0 
        ? data.reduce((sum, row) => sum + (row.plan_accuracy_percent || 0), 0) / data.length 
        : 0;
      const on_time_percent = 95.0; // TODO: Calculate from work order due dates

      return {
        yield_percent,
        consumption_per_kg,
        plan_accuracy_percent,
        on_time_percent,
        total_work_orders: summary.total_work_orders,
        total_input_kg: (summary as any).total_input_kg || 0,
        total_output_kg: (summary as any).total_output_kg || 0
      };
    } catch (error) {
      console.error('Error fetching yield KPIs:', error);
      throw error;
    }
  }
}
