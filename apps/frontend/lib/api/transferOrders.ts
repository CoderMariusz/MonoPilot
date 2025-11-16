import { supabase } from '../supabase/client-browser';
import type { TransferOrder, TOHeader, TOStatus, TOLine } from '../types';

export class TransferOrdersAPI {
  static async update(toId: number, payload: UpdateTransferOrderRequest): Promise<TOHeader> {
    try {
      if (!toId) {
        throw new Error('Transfer order ID is required');
      }

      if (!payload.from_wh_id || !payload.to_wh_id) {
        throw new Error('Source and destination warehouses are required');
      }

      if (!payload.lines || payload.lines.length === 0) {
        throw new Error('At least one line item is required');
      }

      payload.lines.forEach((line, index) => {
        if (!line.item_id) {
          throw new Error(`Line ${index + 1}: product is required`);
        }
        if (!line.qty_planned || line.qty_planned <= 0) {
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
        from_wh_id,
        to_wh_id,
        planned_ship_date,
        planned_receive_date,
        requested_date,
        status,
        lines,
      } = payload;

      const { error: headerError } = await supabase
        .from('to_header')
        .update({
          from_wh_id,
          to_wh_id,
          status,
          requested_date: requested_date || planned_ship_date || new Date().toISOString(),
          planned_ship_date: planned_ship_date || null,
          planned_receive_date: planned_receive_date || null,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', toId);

      if (headerError) {
        console.error('Error updating transfer order header:', headerError);
        throw new Error(headerError.message || 'Failed to update transfer order');
      }

      await supabase.from('to_line').delete().eq('to_id', toId);

      const lineRecords = lines.map((line, index) => ({
        to_id: toId,
        line_no: index + 1,
        item_id: line.item_id,
        uom: line.uom,
        qty_planned: line.qty_planned,
        qty_shipped: line.qty_shipped || 0,
        qty_received: line.qty_received || 0,
        lp_id: line.lp_id || null,
        batch: line.batch || null,
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
          from_warehouse:warehouses!to_header_from_wh_id_fkey(*),
          to_warehouse:warehouses!to_header_to_wh_id_fkey(*),
          to_lines:to_line(
            *,
            item:products(*)
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
          from_warehouse:warehouses!to_header_from_wh_id_fkey(*),
          to_warehouse:warehouses!to_header_to_wh_id_fkey(*),
          to_lines:to_line(
            *,
            item:products(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map to TransferOrder for backward compatibility
      return (data || []).map((to: TOHeader) => ({
        id: to.id,
        to_number: to.number,
        from_warehouse_id: to.from_wh_id,
        to_warehouse_id: to.to_wh_id,
        status: to.status,
        transfer_date: to.transfer_date || to.planned_ship_date, // Ensure required field for TransferOrder
        requested_date: to.requested_date,
        planned_ship_date: to.planned_ship_date,
        actual_ship_date: to.actual_ship_date,
        planned_receive_date: to.planned_receive_date,
        actual_receive_date: to.actual_receive_date,
        notes: to.notes,
        created_by: to.created_by,
        updated_by: to.updated_by,
        created_at: to.created_at,
        updated_at: to.updated_at,
        from_warehouse: to.from_warehouse,
        to_warehouse: to.to_warehouse,
        // Map to_lines to items (new API) and transfer_order_items (deprecated backward compat)
        items: to.to_lines?.map(line => ({
          id: line.id,
          to_id: line.to_id,
          line_no: line.line_no,
          item_id: line.item_id,
          uom: line.uom,
          qty_planned: line.qty_planned,
          qty_shipped: line.qty_shipped || 0,
          qty_received: line.qty_received || 0,
          lp_id: line.lp_id,
          batch: line.batch,
          notes: line.notes,
          created_at: line.created_at,
          updated_at: line.updated_at,
          product: line.item
        })) || [],
        // Deprecated backward compatibility
        from_wh_id: to.from_wh_id,
        to_wh_id: to.to_wh_id,
        transfer_order_items: to.to_lines?.map(line => ({
          id: line.id,
          to_id: line.to_id,
          line_no: line.line_no,
          item_id: line.item_id,
          uom: line.uom,
          qty_planned: line.qty_planned,
          qty_shipped: line.qty_shipped || 0,
          qty_received: line.qty_received || 0,
          lp_id: line.lp_id,
          batch: line.batch,
          notes: line.notes,
          created_at: line.created_at,
          updated_at: line.updated_at,
          product: line.item
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
      if (!payload.from_wh_id || !payload.to_wh_id) {
        throw new Error('Source and destination warehouses are required');
      }

      if (!payload.lines || payload.lines.length === 0) {
        throw new Error('At least one line item is required');
      }

      // Ensure quantities are positive
      payload.lines.forEach((line, index) => {
        if (!line.item_id) {
          throw new Error(`Line ${index + 1}: product is required`);
        }
        if (!line.qty_planned || line.qty_planned <= 0) {
          throw new Error(`Line ${index + 1}: quantity must be greater than zero`);
        }
        if (!line.uom) {
          throw new Error(`Line ${index + 1}: unit of measure is required`);
        }
      });

      const {
        from_wh_id,
        to_wh_id,
        planned_ship_date,
        planned_receive_date,
        requested_date,
        status = 'draft',
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
          number: toNumber,
          status,
          from_warehouse_id: from_wh_id,
          to_warehouse_id: to_wh_id,
          requested_date: requested_date || planned_ship_date || new Date().toISOString(),
          planned_ship_date: planned_ship_date || null,
          planned_receive_date: planned_receive_date || null,
          created_by: user.id,
          approved_by: status !== 'draft' ? user.id : null,
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
        line_no: index + 1,
        item_id: line.item_id,
        uom: line.uom,
        qty_planned: line.qty_planned,
        qty_shipped: line.qty_shipped || 0,
        qty_received: line.qty_received || 0,
        lp_id: line.lp_id || null,
        batch: line.batch || null,
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
          from_warehouse:warehouses!to_header_from_wh_id_fkey(*),
          to_warehouse:warehouses!to_header_to_wh_id_fkey(*),
          to_lines:to_line(
            *,
            item:products(*)
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
          from_warehouse:warehouses!to_header_from_wh_id_fkey(*),
          to_warehouse:warehouses!to_header_to_wh_id_fkey(*),
          to_lines:to_line(
            *,
            item:products(*)
          )
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
        transfer_order_items: data.to_lines?.map(line => {
          const lineWithQty = line as TOLine & { qty_shipped?: number; qty_received?: number };
          return {
            ...line,
            product_id: line.item_id,
            quantity: line.qty_planned,
            quantity_planned: line.qty_planned,
            quantity_actual: lineWithQty.qty_received || line.qty_moved || 0,
            quantity_shipped: lineWithQty.qty_shipped || 0,
            quantity_received: lineWithQty.qty_received || 0,
            lp_id: line.lp_id,
            batch: line.batch
          };
        }) || []
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

  /**
   * Mark a transfer order as shipped
   * Sets actual_ship_date and updates status to 'in_transit'
   * Only works if current status is 'submitted'
   */
  static async markShipped(toId: number, actualShipDate: string): Promise<TOHeader> {
    try {
      // Get current user from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase.rpc('mark_transfer_shipped', {
        p_to_id: toId,
        p_actual_ship_date: actualShipDate,
        p_user_id: user.id
      });
      
      if (error) throw error;
      if (!data) throw new Error('No data returned from mark_transfer_shipped');
      
      return data as TOHeader;
    } catch (error: any) {
      console.error('Error marking transfer as shipped:', error);
      throw new Error(error.message || 'Failed to mark transfer as shipped');
    }
  }

  /**
   * Mark a transfer order as received
   * Sets actual_receive_date and updates status to 'received'
   * Updates line items with qty_moved, lp_id, and batch
   * Only works if current status is 'in_transit'
   */
  static async markReceived(
    toId: number,
    actualReceiveDate: string,
    lineUpdates: MarkReceivedLineUpdate[]
  ): Promise<TOHeader> {
    try {
      // Get current user from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase.rpc('mark_transfer_received', {
        p_to_id: toId,
        p_actual_receive_date: actualReceiveDate,
        p_line_updates: lineUpdates,
        p_user_id: user.id
      });
      
      if (error) throw error;
      if (!data) throw new Error('No data returned from mark_transfer_received');
      
      return data as TOHeader;
    } catch (error: any) {
      console.error('Error marking transfer as received:', error);
      throw new Error(error.message || 'Failed to mark transfer as received');
    }
  }

  /**
   * Validate that planned receive date is after or equal to planned ship date
   */
  static validateDateOrder(
    plannedShip?: string,
    plannedReceive?: string
  ): void {
    if (plannedShip && plannedReceive) {
      const shipDate = new Date(plannedShip);
      const receiveDate = new Date(plannedReceive);
      if (receiveDate < shipDate) {
        throw new Error('Planned receive date must be >= planned ship date');
      }
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

// DTO for markReceived line updates
export interface MarkReceivedLineUpdate {
  line_id: number;
  qty_received: number;
  lp_id?: number;
  batch?: string;
}

export interface CreateTransferOrderRequest {
  from_wh_id: number;
  to_wh_id: number;
  requested_date?: string | null;
  planned_ship_date?: string | null;
  planned_receive_date?: string | null;
  status?: TOStatus;
  lines: CreateTransferOrderLineRequest[];
}

export interface CreateTransferOrderLineRequest {
  item_id: number;
  uom: string;
  qty_planned: number;
  qty_shipped?: number;
  qty_received?: number;
  lp_id?: number;
  batch?: string;
  notes?: string;
}

export interface UpdateTransferOrderRequest extends CreateTransferOrderRequest {
  status: TOStatus;
}
