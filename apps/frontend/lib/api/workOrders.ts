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
        quantity: parseFloat(wo.planned_qty), // Database uses planned_qty
        uom: wo.uom,
        priority: wo.priority,
        status: wo.status,
        scheduled_start: wo.start_date, // Database uses start_date
        scheduled_end: wo.end_date, // Database uses end_date
        due_date: wo.end_date, // Use end_date as due_date
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
        .select('planned_qty, uom') // Database uses planned_qty
        .eq('id', woId)
        .single();

      if (!wo) return { madeQty: 0, plannedQty: 0, progressPct: 0 };

      const { data: outputs } = await supabase
        .from('production_outputs')
        .select('quantity')
        .eq('wo_id', woId);

      const madeQty = outputs?.reduce((sum, o) => sum + parseFloat(o.quantity.toString()), 0) || 0;
      const plannedQty = parseFloat(wo.planned_qty.toString()); // Database uses planned_qty
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

  // ============================================================================
  // EPIC-001 Phase 3: Conditional Components Support
  // ============================================================================

  /**
   * Evaluate conditional materials for a Work Order
   * Returns filtered BOM items based on order_flags and context
   * 
   * @param bomId - BOM ID
   * @param woContext - Work Order context (order_flags, customer_id, order_type)
   * @returns Filtered BOM materials that meet conditions
   */
  static async evaluateConditionalMaterials(
    bomId: number,
    woContext: {
      order_flags?: string[];
      customer_id?: number;
      order_type?: string;
    }
  ): Promise<Array<{
    bom_item_id: number;
    material_id: number;
    quantity: number;
    uom: string;
    sequence: number;
    is_conditional: boolean;
    condition_met: boolean;
    condition: any;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('evaluate_bom_materials', {
          p_bom_id: bomId,
          p_wo_context: woContext
        });

      if (error) {
        console.error('Error evaluating conditional materials:', error);
        throw new Error(`Failed to evaluate conditional materials: ${error.message}`);
      }

      return data || [];
    } catch (err: any) {
      console.error('Error in evaluateConditionalMaterials:', err);
      throw err;
    }
  }

  /**
   * Get all BOM materials with condition evaluation (for UI preview)
   * Shows which materials will be included/excluded based on WO context
   * 
   * @param bomId - BOM ID
   * @param woContext - Work Order context
   * @returns All BOM items with condition_met flag
   */
  static async getAllMaterialsWithEvaluation(
    bomId: number,
    woContext: {
      order_flags?: string[];
      customer_id?: number;
      order_type?: string;
    }
  ): Promise<Array<{
    bom_item_id: number;
    material_id: number;
    quantity: number;
    uom: string;
    sequence: number;
    is_conditional: boolean;
    condition_met: boolean;
    condition: any;
    is_by_product: boolean;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('get_all_bom_materials_with_evaluation', {
          p_bom_id: bomId,
          p_wo_context: woContext
        });

      if (error) {
        console.error('Error getting materials with evaluation:', error);
        throw new Error(`Failed to get materials with evaluation: ${error.message}`);
      }

      return data || [];
    } catch (err: any) {
      console.error('Error in getAllMaterialsWithEvaluation:', err);
      throw err;
    }
  }

  /**
   * Create Work Order with conditional material evaluation
   * Automatically filters BOM materials based on order_flags
   * 
   * @param data - Work Order data with order_flags, customer_id, order_type
   * @returns Created Work Order with filtered materials
   */
  static async createWithConditionalMaterials(
    data: CreateWorkOrderData & {
      order_flags?: string[];
      customer_id?: number;
      order_type?: string;
    }
  ): Promise<{
    workOrder: WorkOrder;
    evaluatedMaterials: Array<{
      bom_item_id: number;
      material_id: number;
      quantity: number;
      uom: string;
      is_conditional: boolean;
      condition_met: boolean;
    }>;
  }> {
    try {
      // 1. Create Work Order with order_flags
      const workOrder = await this.create(data);

      // 2. If BOM exists, evaluate conditional materials
      let evaluatedMaterials: any[] = [];
      if (workOrder.bom_id) {
        const woContext = {
          order_flags: data.order_flags || [],
          customer_id: data.customer_id,
          order_type: data.order_type
        };

        evaluatedMaterials = await this.evaluateConditionalMaterials(
          Number(workOrder.bom_id),
          woContext
        );

        console.log(`WO ${workOrder.wo_number}: Evaluated ${evaluatedMaterials.length} materials (${evaluatedMaterials.filter(m => m.is_conditional).length} conditional)`);
      }

      return {
        workOrder,
        evaluatedMaterials
      };
    } catch (err: any) {
      console.error('Error creating WO with conditional materials:', err);
      throw err;
    }
  }

  // ============================================================================
  // PHASE 3: WO RESERVATIONS & MATERIAL MANAGEMENT
  // ============================================================================

  /**
   * Get required materials for WO with reservation status
   * Uses RPC function get_wo_required_materials() for progress tracking
   */
  static async getRequiredMaterials(woId: number): Promise<Array<{
    material_id: number;
    material_part_number: string;
    material_description: string;
    required_qty: number;
    reserved_qty: number;
    consumed_qty: number;
    remaining_qty: number;
    uom: string;
    operation_sequence: number;
    progress_pct: number;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('get_wo_required_materials', { wo_id_param: woId });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching WO required materials:', error);
      throw error;
    }
  }

  /**
   * Get available LPs for a material (FIFO order)
   * Uses RPC function get_available_lps_for_material()
   */
  static async getAvailableLPs(
    materialId: number,
    locationId?: number
  ): Promise<Array<{
    lp_id: number;
    lp_number: string;
    quantity: number;
    uom: string;
    batch: string;
    expiry_date: string;
    location_name: string;
    qa_status: string;
    reserved_qty: number;
    available_qty: number;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('get_available_lps_for_material', {
          material_id_param: materialId,
          location_id_param: locationId || null
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching available LPs:', error);
      throw error;
    }
  }

  /**
   * Reserve material (LP) for work order
   * Creates reservation record and prevents LP from being moved/split
   */
  static async reserveMaterial(data: {
    wo_id: number;
    material_id: number;
    lp_id: number;
    quantity_reserved: number;
    uom: string;
    operation_sequence?: number;
    userId: string;
  }): Promise<{
    reservation_id: number;
    lp_number: string;
  }> {
    try {
      // 1. Validate WO exists and is in correct status
      const { data: wo, error: woError } = await supabase
        .from('work_orders')
        .select('id, wo_number, status')
        .eq('id', data.wo_id)
        .single();

      if (woError) throw woError;
      if (!wo) throw new Error('Work Order not found');
      if (!['Released', 'Realise', 'In Progress'].includes(wo.status)) {
        throw new Error(`Cannot reserve materials for WO with status '${wo.status}'. WO must be Released or In Progress.`);
      }

      // 2. Validate LP exists and is available
      const { data: lp, error: lpError } = await supabase
        .from('license_plates')
        .select('id, lp_number, product_id, quantity, uom, is_consumed, qa_status')
        .eq('id', data.lp_id)
        .single();

      if (lpError) throw lpError;
      if (!lp) throw new Error('License plate not found');
      if (lp.is_consumed) {
        throw new Error('Cannot reserve consumed LP');
      }
      if (lp.qa_status !== 'Passed') {
        throw new Error(`Cannot reserve LP with QA status '${lp.qa_status}'. Only 'Passed' LPs can be reserved.`);
      }

      // 3. Validate LP product matches material
      if (lp.product_id !== data.material_id) {
        throw new Error(`LP product (${lp.product_id}) does not match material (${data.material_id})`);
      }

      // 4. Calculate available quantity (LP qty - existing reservations)
      const { data: existingReservations } = await supabase
        .from('wo_reservations')
        .select('quantity_reserved, quantity_consumed')
        .eq('lp_id', data.lp_id)
        .eq('status', 'active');

      const totalReserved = (existingReservations || []).reduce(
        (sum, r) => sum + (parseFloat(r.quantity_reserved) - parseFloat(r.quantity_consumed)),
        0
      );
      const availableQty = parseFloat(lp.quantity) - totalReserved;

      if (data.quantity_reserved > availableQty) {
        throw new Error(
          `Requested quantity ${data.quantity_reserved} exceeds available quantity ${availableQty} ` +
          `(LP qty: ${lp.quantity}, already reserved: ${totalReserved})`
        );
      }

      // 5. Check if reservation would exceed required quantity
      const { data: requiredMaterial } = await supabase
        .rpc('get_wo_required_materials', { wo_id_param: data.wo_id });

      const material = requiredMaterial?.find(m => m.material_id === data.material_id);
      if (material) {
        const newTotalReserved = parseFloat(material.reserved_qty) + data.quantity_reserved;
        if (newTotalReserved > parseFloat(material.required_qty)) {
          throw new Error(
            `Total reserved quantity ${newTotalReserved} would exceed required quantity ${material.required_qty} ` +
            `(already reserved: ${material.reserved_qty})`
          );
        }
      }

      // 6. Create reservation
      const { data: reservation, error: reservationError } = await supabase
        .from('wo_reservations')
        .insert({
          wo_id: data.wo_id,
          material_id: data.material_id,
          lp_id: data.lp_id,
          quantity_reserved: data.quantity_reserved,
          quantity_consumed: 0,
          uom: data.uom,
          operation_sequence: data.operation_sequence || null,
          status: 'active',
          reserved_at: new Date().toISOString(),
          reserved_by: data.userId
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      return {
        reservation_id: reservation.id,
        lp_number: lp.lp_number
      };
    } catch (error) {
      console.error('Error reserving material:', error);
      throw error;
    }
  }

  /**
   * Release reservation (cancel without consuming)
   */
  static async releaseReservation(data: {
    reservation_id: number;
    userId: string;
  }): Promise<void> {
    try {
      const { data: reservation, error: fetchError } = await supabase
        .from('wo_reservations')
        .select('status, quantity_consumed')
        .eq('id', data.reservation_id)
        .single();

      if (fetchError) throw fetchError;
      if (!reservation) throw new Error('Reservation not found');
      if (reservation.status === 'consumed') {
        throw new Error('Cannot release consumed reservation');
      }
      if (parseFloat(reservation.quantity_consumed) > 0) {
        throw new Error('Cannot release partially consumed reservation');
      }

      const { error } = await supabase
        .from('wo_reservations')
        .update({
          status: 'released'
        })
        .eq('id', data.reservation_id);

      if (error) throw error;
    } catch (error) {
      console.error('Error releasing reservation:', error);
      throw error;
    }
  }

  /**
   * Consume material from reservation
   * Records consumption and creates genealogy entry
   */
  static async consumeMaterial(data: {
    reservation_id: number;
    quantity_consumed: number;
    userId: string;
  }): Promise<{
    consumed_qty: number;
    remaining_qty: number;
  }> {
    try {
      // 1. Get reservation details
      const { data: reservation, error: resError } = await supabase
        .from('wo_reservations')
        .select('*, license_plate:license_plates(id, lp_number, quantity)')
        .eq('id', data.reservation_id)
        .single();

      if (resError) throw resError;
      if (!reservation) throw new Error('Reservation not found');
      if (reservation.status !== 'active') {
        throw new Error(`Cannot consume from ${reservation.status} reservation`);
      }

      // 2. Validate consumption quantity
      const currentConsumed = parseFloat(reservation.quantity_consumed);
      const reserved = parseFloat(reservation.quantity_reserved);
      const remaining = reserved - currentConsumed;

      if (data.quantity_consumed > remaining) {
        throw new Error(
          `Consumption quantity ${data.quantity_consumed} exceeds remaining reservation ${remaining} ` +
          `(reserved: ${reserved}, already consumed: ${currentConsumed})`
        );
      }

      // 3. Update reservation
      const newConsumed = currentConsumed + data.quantity_consumed;
      const fullyConsumed = Math.abs(newConsumed - reserved) < 0.0001;

      const { error: updateError } = await supabase
        .from('wo_reservations')
        .update({
          quantity_consumed: newConsumed,
          status: fullyConsumed ? 'consumed' : 'active',
          consumed_at: fullyConsumed ? new Date().toISOString() : reservation.consumed_at,
          consumed_by: fullyConsumed ? data.userId : reservation.consumed_by
        })
        .eq('id', data.reservation_id);

      if (updateError) throw updateError;

      // 4. Record genealogy (LP consumed for WO)
      const { error: genealogyError } = await supabase
        .from('lp_genealogy')
        .insert({
          parent_lp_id: reservation.lp_id,
          child_lp_id: null, // Will link to output LP when produced
          quantity_consumed: data.quantity_consumed,
          uom: reservation.uom,
          wo_id: reservation.wo_id,
          operation_sequence: reservation.operation_sequence,
          notes: `Material consumed for WO via reservation ${data.reservation_id}`
        });

      if (genealogyError) {
        console.warn('Failed to record genealogy:', genealogyError);
        // Don't fail consumption if genealogy recording fails
      }

      // 5. If LP fully consumed by all reservations, mark LP as consumed
      const { data: allReservations } = await supabase
        .from('wo_reservations')
        .select('quantity_reserved, quantity_consumed')
        .eq('lp_id', reservation.lp_id);

      const totalLPConsumed = (allReservations || []).reduce(
        (sum, r) => sum + parseFloat(r.quantity_consumed),
        0
      );
      const lpQty = parseFloat(reservation.license_plate?.quantity || '0');

      if (Math.abs(totalLPConsumed - lpQty) < 0.0001) {
        await supabase
          .from('license_plates')
          .update({
            is_consumed: true,
            consumed_at: new Date().toISOString(),
            consumed_by: data.userId
          })
          .eq('id', reservation.lp_id);
      }

      return {
        consumed_qty: newConsumed,
        remaining_qty: reserved - newConsumed
      };
    } catch (error) {
      console.error('Error consuming material:', error);
      throw error;
    }
  }

  /**
   * Get all reservations for a work order
   */
  static async getReservations(woId: number): Promise<Array<{
    id: number;
    material_id: number;
    material_part_number: string;
    material_description: string;
    lp_id: number;
    lp_number: string;
    quantity_reserved: number;
    quantity_consumed: number;
    uom: string;
    status: string;
    batch: string | null;
    expiry_date: string | null;
    reserved_at: string;
    reserved_by: string | null;
    consumed_at: string | null;
  }>> {
    try {
      const { data, error } = await supabase
        .from('wo_reservations')
        .select(`
          *,
          material:products!material_id(part_number, description),
          license_plate:license_plates(lp_number, batch, expiry_date)
        `)
        .eq('wo_id', woId)
        .order('reserved_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(r => ({
        id: r.id,
        material_id: r.material_id,
        material_part_number: r.material?.part_number || '',
        material_description: r.material?.description || '',
        lp_id: r.lp_id,
        lp_number: r.license_plate?.lp_number || '',
        quantity_reserved: parseFloat(r.quantity_reserved),
        quantity_consumed: parseFloat(r.quantity_consumed),
        uom: r.uom,
        status: r.status,
        batch: r.license_plate?.batch || null,
        expiry_date: r.license_plate?.expiry_date || null,
        reserved_at: r.reserved_at,
        reserved_by: r.reserved_by,
        consumed_at: r.consumed_at
      }));
    } catch (error) {
      console.error('Error fetching WO reservations:', error);
      throw error;
    }
  }
}
