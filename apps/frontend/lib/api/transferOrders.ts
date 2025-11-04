import { supabase } from '../supabase/client-browser';
import type { TransferOrder, TOHeader } from '../types';

export class TransferOrdersAPI {
  static async getAll(): Promise<TransferOrder[]> {
    try {
      const { data, error } = await supabase
        .from('to_header')
        .select(`
          *,
          from_warehouse:warehouses!to_header_from_wh_id_fkey(*),
          to_warehouse:warehouses!to_header_to_wh_id_fkey(*),
          to_lines:to_line(*, item:products(*), from_location:locations!to_line_from_location_id_fkey(*), to_location:locations!to_line_to_location_id_fkey(*))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map to TransferOrder for backward compatibility
      return (data || []).map((to: TOHeader) => ({
        ...to,
        to_number: to.number,
        from_warehouse_id: to.from_wh_id,
        to_warehouse_id: to.to_wh_id,
        transfer_date: to.transfer_date || to.planned_ship_date, // Ensure required field for TransferOrder
        planned_ship_date: to.planned_ship_date,
        actual_ship_date: to.actual_ship_date,
        planned_receive_date: to.planned_receive_date,
        actual_receive_date: to.actual_receive_date,
        transfer_order_items: to.to_lines?.map(line => ({
          ...line,
          product_id: line.item_id,
          quantity: line.qty_planned,
          quantity_planned: line.qty_planned,
          quantity_actual: line.qty_moved,
          lp_id: line.lp_id,
          batch: line.batch
        })) || []
      })) as TransferOrder[];
    } catch (error) {
      console.error('Error fetching transfer orders:', error);
      return [];
    }
  }

  static async getById(id: number): Promise<TransferOrder | null> {
    try {
      const { data, error } = await supabase
        .from('to_header')
        .select(`
          *,
          from_warehouse:warehouses!to_header_from_wh_id_fkey(*),
          to_warehouse:warehouses!to_header_to_wh_id_fkey(*),
          to_lines:to_line(*, item:products(*), from_location:locations!to_line_from_location_id_fkey(*), to_location:locations!to_line_to_location_id_fkey(*))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;
      
      // Map to TransferOrder for backward compatibility
      return {
        ...data,
        to_number: data.number,
        from_warehouse_id: data.from_wh_id,
        to_warehouse_id: data.to_wh_id,
        transfer_date: data.transfer_date || data.planned_ship_date,
        planned_ship_date: data.planned_ship_date,
        actual_ship_date: data.actual_ship_date,
        planned_receive_date: data.planned_receive_date,
        actual_receive_date: data.actual_receive_date,
        transfer_order_items: data.to_lines?.map(line => ({
          ...line,
          product_id: line.item_id,
          quantity: line.qty_planned,
          quantity_planned: line.qty_planned,
          quantity_actual: line.qty_moved,
          lp_id: line.lp_id,
          batch: line.batch
        })) || []
      } as TransferOrder;
    } catch (error) {
      console.error('Error fetching transfer order:', error);
      return null;
    }
  }

  static async cancel(id: number, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('cancel_transfer_order', {
        p_to_id: id,
        p_user_id: 1, // TODO: Get from auth context
        p_reason: reason
      });
      
      if (error) throw error;
      return { success: true, message: 'Transfer order cancelled' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to cancel transfer order' };
    }
  }

  /**
   * Mark a transfer order as shipped
   * Sets actual_ship_date and updates status to 'in_transit'
   * Only works if current status is 'submitted'
   */
  static async markShipped(id: number, actualShipDate?: Date): Promise<{ success: boolean; message: string }> {
    try {
      const date = actualShipDate || new Date();
      const { error } = await supabase
        .from('to_header')
        .update({ 
          actual_ship_date: date.toISOString(),
          status: 'in_transit'
        })
        .eq('id', id)
        .eq('status', 'submitted'); // Only if currently submitted
      
      if (error) {
        // Check if it's because status is not 'submitted'
        if (error.code === 'PGRST116') {
          return { success: false, message: 'Transfer order must be in "submitted" status to mark as shipped' };
        }
        return { success: false, message: error.message };
      }
      
      return { success: true, message: 'Transfer marked as shipped' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to mark transfer as shipped' };
    }
  }

  /**
   * Mark a transfer order as received
   * Sets actual_receive_date and updates status to 'received'
   * Only works if current status is 'in_transit'
   */
  static async markReceived(id: number, actualReceiveDate?: Date): Promise<{ success: boolean; message: string }> {
    try {
      const date = actualReceiveDate || new Date();
      const { error } = await supabase
        .from('to_header')
        .update({ 
          actual_receive_date: date.toISOString(),
          status: 'received'
        })
        .eq('id', id)
        .eq('status', 'in_transit'); // Only if currently in transit
      
      if (error) {
        // Check if it's because status is not 'in_transit'
        if (error.code === 'PGRST116') {
          return { success: false, message: 'Transfer order must be in "in_transit" status to mark as received' };
        }
        return { success: false, message: error.message };
      }
      
      return { success: true, message: 'Transfer marked as received' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to mark transfer as received' };
    }
  }
}
