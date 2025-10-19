import { supabase } from '../supabase/client-browser';
import type { TransferOrder } from '../types';

export class TransferOrdersAPI {
  static async getAll(): Promise<TransferOrder[]> {
    try {
      const { data, error } = await supabase
        .from('transfer_orders')
        .select(`
          *,
          transfer_order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transfer orders:', error);
      return [];
    }
  }

  static async getById(id: number): Promise<TransferOrder | null> {
    try {
      const { data, error } = await supabase
        .from('transfer_orders')
        .select(`
          *,
          transfer_order_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
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
