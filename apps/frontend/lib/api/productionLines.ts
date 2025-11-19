import { ProductionLine, CreateProductionLineData, UpdateProductionLineData } from '@/lib/types';
import { supabase } from '@/lib/supabase/client-browser';

const API_BASE = '/api/settings/production-lines';

export const ProductionLinesAPI = {
  /**
   * Get all production lines
   */
  async getAll(): Promise<ProductionLine[]> {
    const { data, error } = await supabase
      .from('production_lines')
      .select('*')
      .order('code');

    if (error) {
      throw new Error(`Failed to fetch production lines: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Get active production lines only
   */
  async getActive(): Promise<ProductionLine[]> {
    const { data, error } = await supabase
      .from('production_lines')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'active')
      .order('code');

    if (error) {
      throw new Error(`Failed to fetch active production lines: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Get production line by ID
   */
  async getById(id: number): Promise<ProductionLine> {
    const { data, error } = await supabase
      .from('production_lines')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch production line ${id}: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Production line ${id} not found`);
    }

    return data;
  },

  /**
   * Get production lines by warehouse
   */
  async getByWarehouse(warehouseId: number): Promise<ProductionLine[]> {
    const { data, error } = await supabase
      .from('production_lines')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .eq('is_active', true)
      .order('code');

    if (error) {
      throw new Error(`Failed to fetch production lines for warehouse ${warehouseId}: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Create new production line
   */
  async create(data: CreateProductionLineData): Promise<ProductionLine> {
    // Get user's org_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.org_id) {
      throw new Error('Failed to get user organization');
    }

    const { data: newLine, error } = await supabase
      .from('production_lines')
      .insert([{
        code: data.code,
        name: data.name,
        status: data.status || 'active',
        warehouse_id: data.warehouse_id || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
        org_id: userData.org_id,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create production line: ${error.message}`);
    }

    if (!newLine) {
      throw new Error('Failed to create production line: No data returned');
    }

    return newLine;
  },

  /**
   * Update production line
   */
  async update(id: number, data: UpdateProductionLineData): Promise<ProductionLine> {
    const updateData: any = {};

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.warehouse_id !== undefined) updateData.warehouse_id = data.warehouse_id;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    updateData.updated_at = new Date().toISOString();

    const { data: updatedLine, error } = await supabase
      .from('production_lines')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update production line ${id}: ${error.message}`);
    }

    if (!updatedLine) {
      throw new Error(`Production line ${id} not found`);
    }

    return updatedLine;
  },

  /**
   * Delete production line (soft delete by setting is_active to false)
   */
  async delete(id: number): Promise<void> {
    // Check if line is in use by any work orders
    const { count: woCount, error: woError } = await supabase
      .from('work_orders')
      .select('*', { count: 'exact', head: true })
      .eq('line_id', id);

    if (woError) {
      throw new Error(`Failed to check work orders: ${woError.message}`);
    }

    if (woCount && woCount > 0) {
      throw new Error(`Cannot delete production line: ${woCount} work order(s) are using this line`);
    }

    // Check if line is in use by any BOMs
    const { data: bomsData, error: bomsError } = await supabase
      .from('boms')
      .select('line_id')
      .not('line_id', 'is', null);

    if (bomsError) {
      throw new Error(`Failed to check BOMs: ${bomsError.message}`);
    }

    const bomsUsingLine = bomsData?.filter(bom => 
      bom.line_id && bom.line_id.includes(id)
    );

    if (bomsUsingLine && bomsUsingLine.length > 0) {
      throw new Error(`Cannot delete production line: ${bomsUsingLine.length} BOM(s) are using this line`);
    }

    // Soft delete
    const { error } = await supabase
      .from('production_lines')
      .update({ 
        is_active: false,
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete production line ${id}: ${error.message}`);
    }
  },

  /**
   * Hard delete production line (use with caution)
   */
  async hardDelete(id: number): Promise<void> {
    const { error } = await supabase
      .from('production_lines')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to hard delete production line ${id}: ${error.message}`);
    }
  },

  /**
   * Validate BOM line compatibility
   */
  async validateLineCompatibility(bomId: number, lineId: number): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('validate_bom_line_compatibility', {
        p_bom_id: bomId,
        p_line_id: lineId
      });

    if (error) {
      console.error('Line compatibility validation error:', error);
      return false;
    }

    return data === true;
  },
};

