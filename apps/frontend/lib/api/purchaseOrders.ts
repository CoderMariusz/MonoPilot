import { supabase } from '../supabase/client-browser';
import type { PurchaseOrder } from '../types';

export class PurchaseOrdersAPI {
  static async getAll(): Promise<PurchaseOrder[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items(*),
          grns(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      return [];
    }
  }

  static async getById(id: number): Promise<PurchaseOrder | null> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items(*),
          grns(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      return null;
    }
  }

  // Get default unit price for a product
  static async getDefaultUnitPrice(productId: number, supplierId?: number): Promise<number> {
    try {
      // Call RPC function to get material std cost
      const { data, error } = await supabase.rpc('get_material_std_cost', { 
        p_material_id: productId 
      });
      
      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error fetching default unit price:', error);
      return 0;
    }
  }

  static async cancel(id: number, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('cancel_purchase_order', {
        p_po_id: id,
        p_user_id: 1, // TODO: Get from auth context
        p_reason: reason
      });
      
      if (error) throw error;
      return { success: true, message: 'Purchase order cancelled' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to cancel PO' };
    }
  }

  static async close(id: number): Promise<{ success: boolean; message: string; grnNumber?: string }> {
    try {
      // Get PO details
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items(*)
        `)
        .eq('id', id)
        .single();
      
      if (poError) throw poError;
      
      if (po.status === 'closed') {
        return { success: false, message: 'Purchase order is already closed' };
      }

      if (!po.purchase_order_items || po.purchase_order_items.length === 0) {
        return { success: false, message: 'Purchase order has no items' };
      }

      const unconfirmedItems = po.purchase_order_items.filter(item => !item.confirmed);
      if (unconfirmedItems.length > 0) {
        const confirmedCount = po.purchase_order_items.length - unconfirmedItems.length;
        const totalCount = po.purchase_order_items.length;
        return { 
          success: false, 
          message: `Please confirm all items before closing the PO (${confirmedCount} of ${totalCount} items confirmed)` 
        };
      }

      // Create GRN
      const year = new Date().getFullYear();
      const { data: grnCount } = await supabase
        .from('grns')
        .select('id', { count: 'exact', head: true });
      
      const nextGrnNumber = (grnCount?.length || 0) + 1;
      const grnNumber = `GRN-${year}-${String(nextGrnNumber).padStart(3, '0')}`;

      // Create GRN
      const { data: grn, error: grnError } = await supabase
        .from('grns')
        .insert({
          grn_number: grnNumber,
          po_id: id,
          status: 'completed',
          received_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (grnError) throw grnError;

      // Create GRN items
      const grnItems = po.purchase_order_items.map(poItem => ({
        grn_id: grn.id,
        product_id: poItem.product_id,
        quantity_ordered: poItem.quantity,
        quantity_received: poItem.quantity,
        location_id: po.warehouse_id || 1
      }));

      await supabase.from('grn_items').insert(grnItems);

      // Update PO status
      await supabase
        .from('purchase_orders')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', id);

      return { 
        success: true, 
        message: `PO closed successfully. GRN created: ${grnNumber}`,
        grnNumber 
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to close PO' };
    }
  }
}
