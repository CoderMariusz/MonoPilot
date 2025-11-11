import { supabase } from '../supabase/client-browser';
import type { PurchaseOrder, POHeader } from '../types';

export interface QuickPOEntryLine {
  product_code: string;
  quantity: number;
}

export interface QuickPOCreateRequest {
  lines: QuickPOEntryLine[];
  warehouse_id?: number;
}

export interface QuickPOCreatedPO {
  id: number;
  number: string;
  supplier_id: number;
  supplier_name: string;
  currency: string;
  total_lines: number;
  net_total: number;
  vat_total: number;
  gross_total: number;
}

export interface QuickPOCreateResponse {
  purchase_orders: QuickPOCreatedPO[];
}

export class PurchaseOrdersAPI {
  static async getAll(): Promise<PurchaseOrder[]> {
    try {
      const { data, error } = await supabase
        .from('po_header')
        .select(`
          *,
          supplier:suppliers(*),
          po_lines:po_line(*, item:products(*), default_location:locations(*))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];
      
      // Map to PurchaseOrder for backward compatibility
      return data.map((po: any) => {
        const poLines = po.po_lines || [];
        const calculatedTotal = poLines.reduce(
          (sum: number, line: any) => {
            const qty = typeof line.qty_ordered === 'number' ? line.qty_ordered : 0;
            const price = typeof line.unit_price === 'number' ? line.unit_price : 0;
            const vatRate = typeof line.vat_rate === 'number' ? line.vat_rate : 0;
            return sum + (price * qty * (1 + vatRate / 100));
          },
          0
        );
        
        return {
          ...po,
          po_number: po.number,
          expected_delivery: po.promised_delivery_date || po.requested_delivery_date || null,
          due_date: po.payment_due_date || po.promised_delivery_date || null,
          payment_due_date: po.payment_due_date || null,
          expected_delivery_date: po.promised_delivery_date || null,
          request_delivery_date: po.requested_delivery_date || null,
          currency: po.currency || 'USD',
          exchange_rate: po.exchange_rate || 1.0,
          total_amount: po.gross_total || calculatedTotal,
          purchase_order_items: poLines.map((line: any) => {
            const qty = typeof line.qty_ordered === 'number' ? line.qty_ordered : 0;
            const price = typeof line.unit_price === 'number' ? line.unit_price : 0;
            const vatRate = typeof line.vat_rate === 'number' ? line.vat_rate : 0;
            return {
              ...line,
              product_id: line.item_id,
              quantity: qty,
              quantity_ordered: qty,
              quantity_received: typeof line.qty_received === 'number' ? line.qty_received : 0,
              unit_price: price,
              tax_rate: vatRate,
              total_price: price * qty * (1 + vatRate / 100),
              product: line.item || undefined
            };
          }) || []
        } as PurchaseOrder;
      });
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      return [];
    }
  }

  static async getById(id: number): Promise<PurchaseOrder | null> {
    try {
      const { data, error } = await supabase
        .from('po_header')
        .select(`
          *,
          supplier:suppliers(*),
          po_lines:po_line(*, item:products(*), default_location:locations(*))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;
      
      const poLines = data.po_lines || [];
      const calculatedTotal = poLines.reduce(
        (sum: number, line: any) => {
            const qty = typeof line.qty_ordered === 'number' ? line.qty_ordered : 0;
            const price = typeof line.unit_price === 'number' ? line.unit_price : 0;
            const vatRate = typeof line.vat_rate === 'number' ? line.vat_rate : 0;
            return sum + (price * qty * (1 + vatRate / 100));
          },
          0
        );
      
      // Map to PurchaseOrder for backward compatibility
      return {
        ...data,
        po_number: data.number,
        expected_delivery: data.promised_delivery_date || data.requested_delivery_date || null,
        due_date: data.payment_due_date || data.promised_delivery_date || null,
        payment_due_date: data.payment_due_date || null,
        expected_delivery_date: data.promised_delivery_date || null,
        request_delivery_date: data.requested_delivery_date || null,
        currency: data.currency || 'USD',
        exchange_rate: data.exchange_rate || 1.0,
        total_amount: data.gross_total || calculatedTotal,
        purchase_order_items: poLines.map((line: any) => {
          const qty = typeof line.qty_ordered === 'number' ? line.qty_ordered : 0;
          const price = typeof line.unit_price === 'number' ? line.unit_price : 0;
          const vatRate = typeof line.vat_rate === 'number' ? line.vat_rate : 0;
          return {
            ...line,
            product_id: line.item_id,
            quantity: qty,
            quantity_ordered: qty,
            quantity_received: typeof line.qty_received === 'number' ? line.qty_received : 0,
            unit_price: price,
            tax_rate: vatRate,
            total_price: price * qty * (1 + vatRate / 100),
            product: line.item || undefined
          };
        }) || []
      } as PurchaseOrder;
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      return null;
    }
  }

  // Get default unit price for a product
  static async getDefaultUnitPrice(
    productId: number, 
    supplierId?: number,
    asOfDate?: Date,
    currency?: string
  ): Promise<number> {
    try {
      // Call RPC function to get material std cost with optional parameters
      const { data, error } = await supabase.rpc('get_material_std_cost', { 
        p_material_id: productId,
        p_as_of_date: asOfDate?.toISOString() || null,
        p_currency: currency || null
      });
      
      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error fetching default unit price:', error);
      return 0;
    }
  }

  static async cancel(id: number, reason?: string, source?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get current user from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc('cancel_purchase_order', {
        p_po_id: id,
        p_user_id: user?.id || null,
        p_reason: reason || null,
        p_source: source || 'web_ui'
      });
      
      if (error) throw error;
      
      // New RPC returns JSONB with success/note
      if (data && typeof data === 'object') {
        return { 
          success: data.success || true, 
          message: data.note || 'Purchase order cancelled successfully' 
        };
      }
      
      return { success: true, message: 'Purchase order cancelled' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to cancel PO' };
    }
  }

  static async close(id: number): Promise<{ success: boolean; message: string; grnNumber?: string }> {
    try {
      // Get PO details from new schema
      const { data: po, error: poError } = await supabase
        .from('po_header')
        .select(`
          *,
          po_lines:po_line(*)
        `)
        .eq('id', id)
        .single();
      
      if (poError) throw poError;
      
      if (po.status === 'closed') {
        return { success: false, message: 'Purchase order is already closed' };
      }

      if (!po.po_lines || po.po_lines.length === 0) {
        return { success: false, message: 'Purchase order has no items' };
      }

      // Note: Phase 1 schema doesn't have 'confirmed' field, so we skip that check
      // All items are considered ready if PO status is 'approved'

      if (po.status !== 'approved') {
        return { 
          success: false, 
          message: 'Purchase order must be approved before closing' 
        };
      }

      // Create GRN
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('grns')
        .select('id', { count: 'exact', head: true });
      
      const nextGrnNumber = (count || 0) + 1;
      const grnNumber = `GRN-${year}-${String(nextGrnNumber).padStart(3, '0')}`;

      // Create GRN
      const { data: grn, error: grnError } = await supabase
        .from('grns')
        .insert({
          grn_number: grnNumber,
          po_id: id,
          supplier_id: po.supplier_id || null,
          status: 'completed',
          received_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (grnError) throw grnError;

      // Create GRN items from po_lines
      const grnItems = po.po_lines.map(poLine => ({
        grn_id: grn.id,
        product_id: poLine.item_id,
        quantity_ordered: poLine.qty_ordered,
        quantity_received: poLine.qty_received || poLine.qty_ordered,
        location_id: poLine.default_location_id || null
      }));

      await supabase.from('grn_items').insert(grnItems);

      // Update PO status
      await supabase
        .from('po_header')
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

  static async quickCreate(request: QuickPOCreateRequest): Promise<QuickPOCreateResponse> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Call RPC function
      const { data, error } = await supabase.rpc('quick_create_pos', {
        p_product_entries: request.lines,
        p_user_id: user.id,
        p_warehouse_id: request.warehouse_id || null
      });

      if (error) {
        console.error('Error in quick_create_pos:', error);
        throw new Error(error.message || 'Failed to create purchase orders');
      }

      if (!data || !data.purchase_orders) {
        throw new Error('No data returned from quick create');
      }

      return data as QuickPOCreateResponse;
    } catch (error: any) {
      console.error('Error creating quick POs:', error);
      throw new Error(error.message || 'Failed to create purchase orders');
    }
  }

  static async delete(id: number): Promise<{ success: boolean; message: string }> {
    try {
      // First check if PO is in draft status
      const po = await this.getById(id);
      if (!po) {
        return { success: false, message: 'Purchase order not found' };
      }

      if (po.status !== 'draft') {
        return { success: false, message: 'Only draft purchase orders can be deleted' };
      }

      // Delete PO lines first
      const { error: linesError } = await supabase
        .from('po_line')
        .delete()
        .eq('po_id', id);

      if (linesError) {
        console.error('Error deleting PO lines:', linesError);
        throw new Error('Failed to delete purchase order lines');
      }

      // Delete PO header
      const { error: headerError } = await supabase
        .from('po_header')
        .delete()
        .eq('id', id);

      if (headerError) {
        console.error('Error deleting PO header:', headerError);
        throw new Error('Failed to delete purchase order');
      }

      return { success: true, message: 'Purchase order deleted successfully' };
    } catch (error: any) {
      console.error('Error deleting PO:', error);
      return { success: false, message: error.message || 'Failed to delete purchase order' };
    }
  }
}
