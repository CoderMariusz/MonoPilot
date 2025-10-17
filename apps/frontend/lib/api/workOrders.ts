import { shouldUseMockData } from './config';
import { clientState } from '../clientState';
import { supabase } from '../supabase/client';
import type { WorkOrder, CreateWorkOrderData, UpdateWorkOrderData } from '../types';

// Work Orders API - Dual mode (mock/real data)
export class WorkOrdersAPI {
  // Get all work orders
  static async getAll(): Promise<WorkOrder[]> {
    if (shouldUseMockData()) {
      return clientState.getWorkOrders();
    }
    
    // TODO: Implement Supabase query
    // const { data, error } = await supabase.from('work_orders').select('*');
    // return data || [];
    
    // Fallback to mock data for now
    return clientState.getWorkOrders();
  }

  // Get work order by ID
  static async getById(id: number): Promise<WorkOrder | null> {
    if (shouldUseMockData()) {
      const workOrders = clientState.getWorkOrders();
      return workOrders.find(wo => wo.id === id.toString()) || null;
    }
    
    // TODO: Implement Supabase query
    // const { data, error } = await supabase.from('work_orders').select('*').eq('id', id).single();
    // return data;
    
    // Fallback to mock data for now
    const workOrders = clientState.getWorkOrders();
    return workOrders.find(wo => wo.id === id.toString()) || null;
  }

  // Create new work order
  static async create(data: CreateWorkOrderData): Promise<WorkOrder> {
    if (shouldUseMockData()) {
      return clientState.addWorkOrder(data);
    }
    
    // TODO: Implement Supabase insert
    // const { data, error } = await supabase.from('work_orders').insert(data).select().single();
    // return data;
    
    // Fallback to mock data for now
    return clientState.addWorkOrder(data);
  }

  // Update work order
  static async update(id: number, data: UpdateWorkOrderData): Promise<WorkOrder> {
    if (shouldUseMockData()) {
      return clientState.updateWorkOrder(id, data);
    }
    
    // TODO: Implement Supabase update
    // const { data, error } = await supabase.from('work_orders').update(data).eq('id', id).select().single();
    // return data;
    
    // Fallback to mock data for now
    return clientState.updateWorkOrder(id, data);
  }

  // Delete work order
  static async delete(id: number): Promise<boolean> {
    if (shouldUseMockData()) {
      return clientState.deleteWorkOrder(id);
    }
    
    // TODO: Implement Supabase delete
    // await supabase.from('work_orders').delete().eq('id', id);
    
    // Fallback to mock data for now
    return clientState.deleteWorkOrder(id);
  }

  // Get production stats for a work order
  static async getProductionStats(woId: number): Promise<{ madeQty: number; plannedQty: number; progressPct: number }> {
    if (shouldUseMockData()) {
      return clientState.getWoProductionStats(woId);
    }
    
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

  static async cancel(id: number, reason?: string): Promise<{ success: boolean; message: string }> {
    if (shouldUseMockData()) {
      const success = clientState.cancelWorkOrder(id, reason);
      return { success, message: success ? 'Work order cancelled' : 'Failed to cancel' };
    }
    
    try {
      const { data, error } = await supabase.rpc('cancel_work_order', {
        p_wo_id: id,
        p_user_id: 1, // TODO: Get from auth context
        p_reason: reason
      });
      
      if (error) throw error;
      return { success: true, message: 'Work order cancelled' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to cancel' };
    }
  }
}
