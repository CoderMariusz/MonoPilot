import { supabase } from '../supabase/client';

// Consume API - Material consumption analysis
export class ConsumeAPI {
  // Get consumption data with variance analysis
  static async getConsumptionData(params: {
    woId?: number;
    from?: string;
    to?: string;
    materialId?: number;
    line?: string;
  }): Promise<{
    data: Array<{
      wo_number: string;
      production_date_london: string;
      production_date_utc: string;
      product: string;
      material: string;
      material_part_number: string;
      bom_standard_kg: number;
      actual_consumed_kg: number;
      variance_kg: number;
      variance_percent: number;
      production_line: string;
      work_order_status: string;
      one_to_one: boolean;
      is_optional: boolean;
    }>;
    summary: {
      total_materials: number;
      avg_variance_percent: number;
      total_standard_kg: number;
      total_actual_kg: number;
      total_variance_kg: number;
    };
  }> {
    ],
        summary: {
          total_materials: 1,
          avg_variance_percent: -5.0,
          total_standard_kg: 100,
          total_actual_kg: 95,
          total_variance_kg: -5
        }
      };
    }

    try {
      let query = supabase.from('vw_consume').select('*');

      // Apply filters
      if (params.woId) {
        query = query.eq('wo_number', `WO-${params.woId}`);
      }
      if (params.from) {
        query = query.gte('production_date_london', params.from);
      }
      if (params.to) {
        query = query.lte('production_date_london', params.to);
      }
      if (params.materialId) {
        // Filter by material part number - would need to join with products table
        // For now, we'll filter in the application layer
      }
      if (params.line) {
        query = query.eq('production_line', params.line);
      }

      const { data, error } = await query.order('production_date_london', { ascending: false });

      if (error) throw error;

      // Calculate summary
      const summary = {
        total_materials: data?.length || 0,
        avg_variance_percent: data?.length > 0 
          ? data.reduce((sum, row) => sum + (row.variance_percent || 0), 0) / data.length 
          : 0,
        total_standard_kg: data?.reduce((sum, row) => sum + (row.bom_standard_kg || 0), 0) || 0,
        total_actual_kg: data?.reduce((sum, row) => sum + (row.actual_consumed_kg || 0), 0) || 0,
        total_variance_kg: data?.reduce((sum, row) => sum + (row.variance_kg || 0), 0) || 0
      };

      return {
        data: data || [],
        summary
      };
    } catch (error) {
      console.error('Error fetching consumption data:', error);
      throw error;
    }
  }

  // Get consumption variance by material
  static async getConsumptionVarianceByMaterial(params: {
    from?: string;
    to?: string;
    line?: string;
  }): Promise<Array<{
    material_id: number;
    material_name: string;
    material_part_number: string;
    total_standard_kg: number;
    total_actual_kg: number;
    total_variance_kg: number;
    avg_variance_percent: number;
    work_order_count: number;
    one_to_one_count: number;
  }>> {
    ];
    }

    try {
      const { data, error } = await supabase
        .from('vw_consume')
        .select(`
          material_part_number,
          material,
          bom_standard_kg,
          actual_consumed_kg,
          variance_kg,
          variance_percent,
          one_to_one,
          work_order_status
        `);

      if (error) throw error;

      // Group by material and calculate aggregates
      const materialMap = new Map();
      
      data?.forEach(row => {
        const key = row.material_part_number;
        if (!materialMap.has(key)) {
          materialMap.set(key, {
            material_id: 0, // Would need to join with products table
            material_name: row.material,
            material_part_number: row.material_part_number,
            total_standard_kg: 0,
            total_actual_kg: 0,
            total_variance_kg: 0,
            variance_percentages: [],
            work_order_count: 0,
            one_to_one_count: 0
          });
        }

        const material = materialMap.get(key);
        material.total_standard_kg += row.bom_standard_kg || 0;
        material.total_actual_kg += row.actual_consumed_kg || 0;
        material.total_variance_kg += row.variance_kg || 0;
        material.variance_percentages.push(row.variance_percent || 0);
        material.work_order_count += 1;
        if (row.one_to_one) material.one_to_one_count += 1;
      });

      // Calculate averages and return array
      return Array.from(materialMap.values()).map(material => ({
        material_id: material.material_id,
        material_name: material.material_name,
        material_part_number: material.material_part_number,
        total_standard_kg: material.total_standard_kg,
        total_actual_kg: material.total_actual_kg,
        total_variance_kg: material.total_variance_kg,
        avg_variance_percent: material.variance_percentages.length > 0 
          ? material.variance_percentages.reduce((sum, pct) => sum + pct, 0) / material.variance_percentages.length 
          : 0,
        work_order_count: material.work_order_count,
        one_to_one_count: material.one_to_one_count
      }));
    } catch (error) {
      console.error('Error fetching consumption variance by material:', error);
      throw error;
    }
  }

  // Get consumption trends over time
  static async getConsumptionTrends(params: {
    materialId?: number;
    line?: string;
    bucket: 'day' | 'week' | 'month';
    from?: string;
    to?: string;
  }): Promise<Array<{
    date: string;
    standard_kg: number;
    actual_kg: number;
    variance_kg: number;
    variance_percent: number;
    work_order_count: number;
  }>> {
    ];
    }

    try {
      // This would require a more complex query to group by time buckets
      // For now, return the basic consumption data
      const consumptionData = await this.getConsumptionData(params);
      
      // Group by date (simplified - would need proper time bucketing)
      const dateMap = new Map();
      
      consumptionData.data.forEach(row => {
        const date = row.production_date_london.split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date,
            standard_kg: 0,
            actual_kg: 0,
            variance_kg: 0,
            variance_percentages: [],
            work_order_count: 0
          });
        }

        const dayData = dateMap.get(date);
        dayData.standard_kg += row.bom_standard_kg;
        dayData.actual_kg += row.actual_consumed_kg;
        dayData.variance_kg += row.variance_kg;
        dayData.variance_percentages.push(row.variance_percent);
        dayData.work_order_count += 1;
      });

      return Array.from(dateMap.values()).map(dayData => ({
        date: dayData.date,
        standard_kg: dayData.standard_kg,
        actual_kg: dayData.actual_kg,
        variance_kg: dayData.variance_kg,
        variance_percent: dayData.variance_percentages.length > 0 
          ? dayData.variance_percentages.reduce((sum, pct) => sum + pct, 0) / dayData.variance_percentages.length 
          : 0,
        work_order_count: dayData.work_order_count
      }));
    } catch (error) {
      console.error('Error fetching consumption trends:', error);
      throw error;
    }
  }
}
