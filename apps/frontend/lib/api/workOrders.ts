import { supabase } from '../supabase/client-browser';
import type { WorkOrder, CreateWorkOrderData, UpdateWorkOrderData } from '../types';

// Work Orders API - Database-first operation
export class WorkOrdersAPI {
  // Get all work orders with enhanced filters
  static async getAll(filters?: {
    line?: string;
    qa_status?: string;
    date_bucket?: 'day' | 'week' | 'month';
    kpi_scope?: 'PR' | 'FG';
    status?: string;
  }): Promise<WorkOrder[]> {
    
    try {
      let query = supabase
        .from('work_orders')
        .select(`
          *,
          product:products(*),
          bom:boms(*),
          routing:routings(*),
          wo_materials:wo_materials(
            *,
            material:products(*)
          ),
          wo_operations:wo_operations(*),
          production_outputs:production_outputs(*)
        `);

      // Apply filters
      if (filters?.line) {
        query = query.eq('line_number', filters.line);
      }
      if (filters?.kpi_scope) {
        query = query.eq('kpi_scope', filters.kpi_scope);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.date_bucket) {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.date_bucket) {
          case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('actual_start', startDate.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(wo => ({
        id: wo.id.toString(),
        wo_number: wo.wo_number,
        product_id: wo.product_id,
        bom_id: wo.bom_id,
        quantity: parseFloat(wo.quantity),
        uom: wo.uom,
        priority: wo.priority,
        status: wo.status,
        scheduled_start: wo.scheduled_start,
        scheduled_end: wo.scheduled_end,
        due_date: wo.scheduled_end, // Use scheduled_end as due_date
        actual_start: wo.actual_start,
        actual_end: wo.actual_end,
        actual_output_qty: wo.actual_output_qty ? parseFloat(wo.actual_output_qty) : null,
        machine_id: wo.machine_id,
        line_number: wo.line_number,
        routing_id: wo.routing_id,
        kpi_scope: wo.kpi_scope,
        planned_boxes: wo.planned_boxes,
        actual_boxes: wo.actual_boxes,
        box_weight_kg: wo.box_weight_kg ? parseFloat(wo.box_weight_kg) : null,
        current_operation_seq: wo.current_operation_seq,
        closed_by: wo.closed_by,
        closed_at: wo.closed_at,
        closed_source: wo.closed_source,
        source_demand_type: wo.source_demand_type || undefined,
        source_demand_id:
          wo.source_demand_type === 'Manual'
            ? null
            : wo.source_demand_id ?? null,
        created_by: wo.created_by || undefined,
        approved_by: wo.approved_by,
        created_at: wo.created_at,
        updated_at: wo.updated_at,
        product: wo.product ? {
          id: wo.product.id.toString(),
          part_number: wo.product.part_number,
          description: wo.product.description,
          type: wo.product.type,
          uom: wo.product.uom,
          expiry_policy: wo.product.expiry_policy,
          shelf_life_days: wo.product.shelf_life_days,
          production_lines: wo.product.production_lines,
          is_active: wo.product.is_active
        } : undefined,
        bom: wo.bom ? {
          id: wo.bom.id.toString(),
          version: wo.bom.version,
          status: wo.bom.status,
          effective_from: wo.bom.effective_from,
          effective_to: wo.bom.effective_to
        } : undefined,
        routing: wo.routing,
        wo_materials: wo.wo_materials || [],
        wo_operations: wo.wo_operations || [],
        production_outputs: wo.production_outputs || []
      }));
    } catch (error) {
      console.error('Error fetching work orders:', error);
      return [];
    }
  }

  // Get work order by ID
  static async getById(id: number): Promise<WorkOrder | null> {
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        product:products(*),
        bom:boms(*),
        routing:routings(*),
        wo_materials:wo_materials(
          *,
          material:products(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching work order:', error);
      return null;
    }

    return data;
  }

  // Create new work order
  static async create(data: CreateWorkOrderData): Promise<WorkOrder> {
    const { data: workOrder, error } = await supabase
      .from('work_orders')
      .insert(data)
      .select(`
        *,
        product:products(*),
        bom:boms(*),
        routing:routings(*),
        wo_materials:wo_materials(
          *,
          material:products(*)
        )
      `)
      .single();

    if (error) {
      console.error('Error creating work order:', error);
      throw new Error('Failed to create work order');
    }

    return workOrder;
  }

  // Update work order
  static async update(id: number, data: UpdateWorkOrderData): Promise<WorkOrder> {
    const { data: workOrder, error } = await supabase
      .from('work_orders')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        product:products(*),
        bom:boms(*),
        routing:routings(*),
        wo_materials:wo_materials(
          *,
          material:products(*)
        )
      `)
      .single();

    if (error) {
      console.error('Error updating work order:', error);
      throw new Error('Failed to update work order');
    }

    return workOrder;
  }

  // Delete work order
  static async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('work_orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting work order:', error);
      throw new Error('Failed to delete work order');
    }

    return true;
  }

  // Get production stats for a work order
  static async getProductionStats(woId: number): Promise<{ madeQty: number; plannedQty: number; progressPct: number }> {
    try {
      const { data: wo } = await supabase
        .from('work_orders')
        .select('quantity, uom')
        .eq('id', woId)
        .single();
      
      if (!wo) return { madeQty: 0, plannedQty: 0, progressPct: 0 };
      
      const { data: outputs } = await supabase
        .from('production_outputs')
        .select('quantity')
        .eq('wo_id', woId);
      
      const madeQty = outputs?.reduce((sum, o) => sum + parseFloat(o.quantity.toString()), 0) || 0;
      const plannedQty = parseFloat(wo.quantity.toString());
      const progressPct = plannedQty > 0 ? Math.round((madeQty / plannedQty) * 100) : 0;
      
      return { madeQty, plannedQty, progressPct };
    } catch (error) {
      console.error('Error fetching production stats:', error);
      return { madeQty: 0, plannedQty: 0, progressPct: 0 };
    }
  }

  static async cancel(id: number, reason?: string, source?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get current user from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc('cancel_work_order', {
        p_wo_id: id,
        p_user_id: user?.id || null,
        p_reason: reason || null,
        p_source: source || 'web_ui'
      });
      
      if (error) throw error;
      
      // New RPC returns JSONB with success/note
      if (data && typeof data === 'object') {
        return { 
          success: data.success || true, 
          message: data.note || 'Work order cancelled successfully' 
        };
      }
      
      return { success: true, message: 'Work order cancelled' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to cancel' };
    }
  }

  // Get work order stage status for Stage Board
  static async getWorkOrderStageStatus(woId: number): Promise<{
    wo_id: number;
    operations: Array<{
      seq: number;
      operation_name: string;
      required_kg: number;
      staged_kg: number;
      in_kg: number;
      remaining_kg: number;
      color_code: 'green' | 'amber' | 'red';
      one_to_one_components: Array<{
        material_id: number;
        material_name: string;
        one_to_one: boolean;
      }>;
    }>;
  }> {
    try {
      // Get work order materials and operations
      const { data: woData, error: woError } = await supabase
        .from('work_orders')
        .select(`
          id,
          wo_number,
          kpi_scope,
          wo_materials:wo_materials(
            sequence,
            quantity,
            one_to_one,
            material:products(description)
          ),
          wo_operations:wo_operations(
            sequence,
            operation_name,
            actual_input_weight,
            actual_output_weight
          )
        `)
        .eq('id', woId)
        .single();

      if (woError) throw woError;

      // Calculate stage status for each operation
      const operations = woData.wo_operations.map((op: any) => {
        // Get required materials for this operation
        const requiredMaterials = woData.wo_materials.filter((mat: any) => 
          mat.sequence === op.sequence
        );

        const required_kg = requiredMaterials.reduce((sum: number, mat: any) => 
          sum + parseFloat(mat.quantity), 0
        );

        // Get staged quantity from reservations
        const staged_kg = 0; // TODO: Calculate from lp_reservations

        // Get IN quantity from actual weights
        const in_kg = op.actual_input_weight ? parseFloat(op.actual_input_weight) : 0;

        // Calculate remaining
        const remaining_kg = Math.max(0, required_kg - in_kg);

        // Determine color code
        let color_code: 'green' | 'amber' | 'red';
        const percentage = required_kg > 0 ? (in_kg / required_kg) * 100 : 100;
        if (percentage >= 100) color_code = 'green';
        else if (percentage >= 90) color_code = 'amber';
        else color_code = 'red';

        return {
          seq: op.sequence,
          operation_name: op.operation_name,
          required_kg,
          staged_kg,
          in_kg,
          remaining_kg,
          color_code,
          one_to_one_components: requiredMaterials
            .filter((mat: any) => mat.one_to_one)
            .map((mat: any) => ({
              material_id: mat.material_id,
              material_name: mat.material.description,
              one_to_one: mat.one_to_one
            }))
        };
      });

      return {
        wo_id: woId,
        operations
      };
    } catch (error) {
      console.error('Error fetching work order stage status:', error);
      throw error;
    }
  }

  // ============================================================================
  // EPIC-001: By-Products Support
  // ============================================================================

  /**
   * Get by-products for a work order
   * @param woId Work order ID
   * @returns Array of by-products with expected and actual quantities
   */
  static async getByProducts(woId: number) {
    try {
      const { data, error } = await supabase
        .from('wo_by_products')
        .select(`
          *,
          product:products(
            id,
            product_code,
            description,
            product_type
          ),
          lp:license_plates(
            id,
            lp_number,
            status
          )
        `)
        .eq('wo_id', woId)
        .order('product_id');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching WO by-products:', error);
      throw error;
    }
  }

  /**
   * Record actual by-product output and create license plate
   * @param woId Work order ID
   * @param byProductId By-product record ID (from wo_by_products table)
   * @param actualQuantity Actual quantity produced
   * @param locationId Location where by-product will be stored
   * @param notes Optional notes from operator
   * @returns Created license plate details
   */
  static async recordByProductOutput(
    woId: number,
    byProductId: number,
    actualQuantity: number,
    locationId: number,
    notes?: string
  ): Promise<{ lp_id: number; lp_number: string }> {
    try {
      // 1. Get by-product details
      const { data: byProduct, error: byProductError } = await supabase
        .from('wo_by_products')
        .select('product_id, uom')
        .eq('id', byProductId)
        .eq('wo_id', woId)
        .single();

      if (byProductError || !byProduct) {
        throw new Error('By-product not found');
      }

      // 2. Generate LP number
      const { data: lpData, error: lpError } = await supabase.rpc(
        'generate_lp_number',
        {}
      );

      if (lpError) {
        console.error('Error generating LP number:', lpError);
        throw new Error('Failed to generate LP number');
      }

      const lpNumber = lpData || `LP-${Date.now()}`;

      // 3. Create license plate
      const { data: lp, error: createLpError } = await supabase
        .from('license_plates')
        .insert({
          lp_number: lpNumber,
          product_id: byProduct.product_id,
          quantity: actualQuantity,
          uom: byProduct.uom,
          location_id: locationId,
          status: 'available',
          qa_status: 'pending',
          source_type: 'wo_by_product',
          source_id: woId,
        })
        .select()
        .single();

      if (createLpError || !lp) {
        console.error('Error creating LP:', createLpError);
        throw new Error('Failed to create license plate');
      }

      // 4. Update by-product record with actual quantity and LP
      const { error: updateError } = await supabase
        .from('wo_by_products')
        .update({
          actual_quantity: actualQuantity,
          lp_id: lp.id,
          notes: notes || null,
        })
        .eq('id', byProductId);

      if (updateError) {
        console.error('Error updating by-product:', updateError);
        throw new Error('Failed to update by-product record');
      }

      return {
        lp_id: lp.id,
        lp_number: lp.lp_number,
      };
    } catch (error) {
      console.error('Error recording by-product output:', error);
      throw error;
    }
  }

  /**
   * Snapshot by-products from BOM to WO during WO creation
   * This is called internally when creating a WO
   * @param woId Work order ID
   * @param bomId BOM ID
   * @param woQuantity Work order quantity (main output)
   * @returns Array of created by-product records
   */
  static async snapshotByProductsFromBOM(
    woId: number,
    bomId: number,
    woQuantity: number
  ) {
    try {
      // 1. Get by-products from BOM
      const { data: bomByProducts, error: bomError } = await supabase
        .from('bom_items')
        .select('material_id, uom, yield_percentage')
        .eq('bom_id', bomId)
        .eq('is_by_product', true);

      if (bomError) throw bomError;

      if (!bomByProducts || bomByProducts.length === 0) {
        return [];  // No by-products in this BOM
      }

      // 2. Calculate expected quantities and create wo_by_products records
      const byProductRecords = bomByProducts.map((bomItem) => ({
        wo_id: woId,
        product_id: bomItem.material_id,
        expected_quantity: (woQuantity * bomItem.yield_percentage!) / 100,
        actual_quantity: 0,
        uom: bomItem.uom,
        lp_id: null,
        notes: null,
      }));

      // 3. Insert all by-product records
      const { data, error: insertError } = await supabase
        .from('wo_by_products')
        .insert(byProductRecords)
        .select();

      if (insertError) throw insertError;

      return data || [];
    } catch (error) {
      console.error('Error snapshotting by-products from BOM:', error);
      throw error;
    }
  }
}
