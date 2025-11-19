import { supabase } from '../supabase/client-browser';
import type { TransferOrder, TOHeader, TOStatus, TOLine } from '../types';

export class TransferOrdersAPI {
  static async update(toId: number, payload: UpdateTransferOrderRequest): Promise<TOHeader> {
    try {
      if (!toId) {
        throw new Error('Transfer order ID is required');
      }

      if (!payload.from_warehouse_id || !payload.to_warehouse_id) {
        throw new Error('Source and destination warehouses are required');
      }

      if (!payload.lines || payload.lines.length === 0) {
        throw new Error('At least one line item is required');
      }

      payload.lines.forEach((line, index) => {
        if (!line.product_id) {
          throw new Error(`Line ${index + 1}: product is required`);
        }
        if (!line.quantity || line.quantity <= 0) {
          throw new Error(`Line ${index + 1}: quantity must be greater than zero`);
        }
        if (!line.uom) {
          throw new Error(`Line ${index + 1}: unit of measure is required`);
        }
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const {
        from_warehouse_id,
        to_warehouse_id,
        scheduled_date,
        status,
        notes,
        lines,
      } = payload;

      const { error: headerError } = await supabase
        .from('to_header')
        .update({
          from_warehouse_id,
          to_warehouse_id,
          status,
          scheduled_date: scheduled_date || null,
          notes: notes || null,
          updated_by: user.id,
        })
        .eq('id', toId);

      if (headerError) {
        console.error('Error updating transfer order header:', headerError);
        throw new Error(headerError.message || 'Failed to update transfer order');
      }

      await supabase.from('to_line').delete().eq('to_id', toId);

      const lineRecords = lines.map((line, index) => ({
        to_id: toId,
        line_number: index + 1,
        product_id: line.product_id,
        uom: line.uom,
        quantity: line.quantity,
        transferred_qty: line.transferred_qty || 0,
        notes: line.notes || null,
      }));

      if (lineRecords.length > 0) {
        const { error: lineError } = await supabase
          .from('to_line')
          .insert(lineRecords);

        if (lineError) {
          console.error('Error updating transfer order lines:', lineError);
          throw new Error(lineError.message || 'Failed to update transfer order lines');
        }
      }

      const { data: completeTO, error: fetchError } = await supabase
        .from('to_header')
        .select(`
          *,
          from_warehouse:warehouses!to_header_from_warehouse_id_fkey(*),
          to_warehouse:warehouses!to_header_to_warehouse_id_fkey(*),
          to_lines:to_line(
            *,
            product:products(*)
          )
        `)
        .eq('id', toId)
        .single();

      if (fetchError || !completeTO) {
        console.error('Error fetching updated transfer order:', fetchError);
        throw new Error('Transfer order updated but failed to fetch details');
      }

      return completeTO as TOHeader;
    } catch (error: any) {
      console.error('Error updating transfer order:', error);
      throw new Error(error.message || 'Failed to update transfer order');
    }
  }

  static async getAll(): Promise<TransferOrder[]> {
    try {
      const { data, error } = await supabase
        .from('to_header')
        .select(`
          *,
          from_warehouse:warehouses!to_header_from_warehouse_id_fkey(*),
          to_warehouse:warehouses!to_header_to_warehouse_id_fkey(*),
          to_lines:to_line(
            *,
            product:products(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map to TransferOrder for backward compatibility
      return (data || []).map((to: any) => ({
        id: to.id,
        to_number: to.to_number,
        from_warehouse_id: to.from_warehouse_id,
        to_warehouse_id: to.to_warehouse_id,
        status: to.status,
        scheduled_date: to.scheduled_date,
        notes: to.notes,
        created_by: to.created_by,
        updated_by: to.updated_by,
        created_at: to.created_at,
        updated_at: to.updated_at,
        from_warehouse: to.from_warehouse,
        to_warehouse: to.to_warehouse,
        // Map to_lines to items
        items: to.to_lines?.map((line: any) => ({
          id: line.id,
          to_id: line.to_id,
          line_number: line.line_number,
          product_id: line.product_id,
          uom: line.uom,
          quantity: line.quantity,
          transferred_qty: line.transferred_qty || 0,
          notes: line.notes,
          created_at: line.created_at,
          updated_at: line.updated_at,
          product: line.product
        })) || [],
        // Deprecated backward compatibility
        transfer_order_items: to.to_lines?.map((line: any) => ({
          id: line.id,
          to_id: line.to_id,
          line_number: line.line_number,
          product_id: line.product_id,
          uom: line.uom,
          quantity: line.quantity,
          transferred_qty: line.transferred_qty || 0,
          notes: line.notes,
          created_at: line.created_at,
          updated_at: line.updated_at,
          product: line.product
        })) || []
      })) as TransferOrder[];
    } catch (error) {
      console.error('Error fetching transfer orders:', error);
      return [];
    }
  }

  static async create(payload: CreateTransferOrderRequest): Promise<TOHeader> {
    try {
      // Validate required fields
      if (!payload.from_warehouse_id || !payload.to_warehouse_id) {
        throw new Error('Source and destination warehouses are required');
      }

      if (!payload.lines || payload.lines.length === 0) {
        throw new Error('At least one line item is required');
      }

      // Ensure quantities are positive
      payload.lines.forEach((line, index) => {
        if (!line.product_id) {
          throw new Error(`Line ${index + 1}: product is required`);
        }
        if (!line.quantity || line.quantity <= 0) {
          throw new Error(`Line ${index + 1}: quantity must be greater than zero`);
        }
        if (!line.uom) {
          throw new Error(`Line ${index + 1}: unit of measure is required`);
        }
      });

      const {
        from_warehouse_id,
        to_warehouse_id,
        scheduled_date,
        status = 'draft',
        notes,
        lines,
      } = payload;

      // Get current user for audit fields
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate TO number
      const fallbackNumber = `TO-${new Date().getFullYear()}-${Date.now()}`;
      let toNumber = fallbackNumber;

      const { data: generatedNumber, error: numberError } = await supabase.rpc('generate_to_number');
      if (numberError) {
        console.warn('generate_to_number failed, using fallback sequence', numberError);
      } else if (generatedNumber) {
        toNumber = generatedNumber;
      }

      // Insert header
      const { data: header, error: headerError } = await supabase
        .from('to_header')
        .insert({
          to_number: toNumber,
          status,
          from_warehouse_id,
          to_warehouse_id,
          scheduled_date: scheduled_date || null,
          notes: notes || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (headerError) {
        console.error('Error creating transfer order header:', headerError);
        throw new Error(headerError.message || 'Failed to create transfer order');
      }

      // Insert lines
      const lineRecords = lines.map((line, index) => ({
        to_id: header.id,
        line_number: index + 1,
        product_id: line.product_id,
        uom: line.uom,
        quantity: line.quantity,
        transferred_qty: line.transferred_qty || 0,
        notes: line.notes || null,
      }));

      const { error: lineError } = await supabase
        .from('to_line')
        .insert(lineRecords);

      if (lineError) {
        console.error('Error creating transfer order lines:', lineError);
        // Rollback header
        await supabase.from('to_header').delete().eq('id', header.id);
        throw new Error(lineError.message || 'Failed to create transfer order lines');
      }

      // Fetch complete TO with relations
      const { data: completeTO, error: fetchError } = await supabase
        .from('to_header')
        .select(`
          *,
          from_warehouse:warehouses!to_header_from_warehouse_id_fkey(*),
          to_warehouse:warehouses!to_header_to_warehouse_id_fkey(*),
          to_lines:to_line(
            *,
            product:products(*)
          )
        `)
        .eq('id', header.id)
        .single();

      if (fetchError || !completeTO) {
        console.error('Error fetching newly created transfer order:', fetchError);
        throw new Error('Transfer order created but failed to fetch details');
      }

      return completeTO as TOHeader;
    } catch (error: any) {
      console.error('Error creating transfer order:', error);
      throw new Error(error.message || 'Failed to create transfer order');
    }
  }

  static async getById(id: number): Promise<TransferOrder | null> {
    try {
      const { data, error} = await supabase
        .from('to_header')
        .select(`
          *,
          from_warehouse:warehouses!to_header_from_warehouse_id_fkey(*),
          to_warehouse:warehouses!to_header_to_warehouse_id_fkey(*),
          to_lines:to_line(
            *,
            product:products(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Map to TransferOrder for backward compatibility
      return {
        ...data,
        to_number: data.to_number,
        from_warehouse_id: data.from_warehouse_id,
        to_warehouse_id: data.to_warehouse_id,
        scheduled_date: data.scheduled_date,
        transfer_order_items: data.to_lines?.map((line: any) => ({
          ...line,
          product_id: line.product_id,
          quantity: line.quantity,
          transferred_qty: line.transferred_qty || 0,
        })) || []
      } as TransferOrder;
    } catch (error) {
      console.error('Error fetching transfer order:', error);
      return null;
    }
  }

  static async cancel(id: number, reason?: string, source?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get current user from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.rpc('cancel_transfer_order', {
        p_to_id: id,
        p_user_id: user?.id || null,
        p_reason: reason || null,
        p_source: source || 'web_ui'
      });

      if (error) throw error;

      // New RPC returns JSONB with success/note
      if (data && typeof data === 'object') {
        return {
          success: data.success || true,
          message: data.note || 'Transfer order cancelled successfully'
        };
      }

      return { success: true, message: 'Transfer order cancelled' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to cancel transfer order' };
    }
  }

  static async delete(toId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('to_header')
        .delete()
        .eq('id', toId);

      if (error) {
        console.error('Error deleting transfer order:', error);
        throw new Error(error.message || 'Failed to delete transfer order');
      }
    } catch (error: any) {
      console.error('Error deleting transfer order:', error);
      throw new Error(error.message || 'Failed to delete transfer order');
    }
  }
}

export interface CreateTransferOrderRequest {
  from_warehouse_id: number;
  to_warehouse_id: number;
  scheduled_date?: string | null;
  notes?: string | null;
  status?: TOStatus;
  lines: CreateTransferOrderLineRequest[];
}

export interface CreateTransferOrderLineRequest {
  product_id: number;
  uom: string;
  quantity: number;
  transferred_qty?: number;
  notes?: string;
}

export interface UpdateTransferOrderRequest extends CreateTransferOrderRequest {
  status: TOStatus;
}
