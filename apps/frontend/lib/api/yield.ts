import { shouldUseMockData } from './config';
import { supabase } from '../supabase/client';

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
    if (shouldUseMockData()) {
      // Mock PR yield data
      return {
        data: [
          {
            production_date: '2024-01-15',
            production_date_utc: '2024-01-15T00:00:00Z',
            production_line: 'Line 1',
            product: 'Ground Beef',
            part_number: 'GB-001',
            work_order_count: 3,
            total_input_kg: 1500,
            total_output_kg: 1350,
            pr_yield_percent: 90.0,
            pr_consumption_per_kg: 1.11,
            plan_accuracy_percent: 95.0
          }
        ],
        summary: {
          total_work_orders: 3,
          avg_yield_percent: 90.0,
          total_input_kg: 1500,
          total_output_kg: 1350
        }
      };
    }

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
    if (shouldUseMockData()) {
      // Mock FG yield data
      return {
        data: [
          {
            production_date: '2024-01-15',
            production_date_utc: '2024-01-15T00:00:00Z',
            production_line: 'Line 1',
            product: 'Beef Sausage',
            part_number: 'BS-001',
            work_order_count: 2,
            total_planned_boxes: 100,
            total_actual_boxes: 95,
            avg_box_weight_kg: 2.5,
            total_fg_weight_kg: 237.5,
            total_meat_input_kg: 300,
            fg_yield_percent: 79.17,
            plan_accuracy_percent: 95.0,
            waste_kg: 62.5
          }
        ],
        summary: {
          total_work_orders: 2,
          avg_yield_percent: 79.17,
          total_boxes: 95,
          total_waste_kg: 62.5
        }
      };
    }

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
      const consumption_per_kg = summary.total_input_kg > 0 
        ? summary.total_input_kg / summary.total_output_kg 
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
        total_input_kg: summary.total_input_kg,
        total_output_kg: summary.total_output_kg
      };
    } catch (error) {
      console.error('Error fetching yield KPIs:', error);
      throw error;
    }
  }
}
