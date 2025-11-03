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
        transfer_date: to.transfer_date, // Ensure required field for TransferOrder
        transfer_order_items: to.to_lines?.map(line => ({
          ...line,
          product_id: line.item_id,
          quantity: line.qty_planned,
          quantity_planned: line.qty_planned,
          quantity_actual: line.qty_moved
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
        transfer_order_items: data.to_lines?.map(line => ({
          ...line,
          product_id: line.item_id,
          quantity: line.qty_planned,
          quantity_planned: line.qty_planned,
          quantity_actual: line.qty_moved
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
}
