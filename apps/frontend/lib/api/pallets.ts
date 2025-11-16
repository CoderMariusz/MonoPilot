import { supabase } from '../supabase/client-browser';

// Pallets API - Pallet management for warehouse operations
export class PalletsAPI {
  // Get all pallets with filters
  static async getAll(filters?: {
    status?: 'open' | 'closed' | 'shipped';
    location_id?: number;
    wo_id?: number;
    pallet_type?: string;
  }): Promise<{
    data: Array<{
      id: number;
      pallet_number: string;
      pallet_type: string;
      wo_id: number | null;
      wo_number: string | null;
      line: string | null;
      location_id: number | null;
      location_name: string | null;
      status: string;
      target_boxes: number | null;
      actual_boxes: number | null;
      item_count: number;
      total_quantity: number;
      created_at: string;
      created_by: string | null;
      closed_at: string | null;
      closed_by: string | null;
    }>;
    summary: {
      total_pallets: number;
      status_counts: Record<string, number>;
      location_counts: Record<string, number>;
    };
  }> {
    try {
      let query = supabase
        .from('pallets')
        .select(`
          *,
          work_order:work_orders(wo_number),
          location:locations(name)
        `);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.location_id) {
        query = query.eq('location_id', filters.location_id);
      }
      if (filters?.wo_id) {
        query = query.eq('wo_id', filters.wo_id);
      }
      if (filters?.pallet_type) {
        query = query.eq('pallet_type', filters.pallet_type);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Get item counts and quantities for each pallet
      const enhancedData = await Promise.all(
        (data || []).map(async (pallet) => {
          const { data: items } = await supabase
            .from('pallet_items')
            .select('lp_id, quantity')
            .eq('pallet_id', pallet.id);

          const item_count = items?.length || 0;
          const total_quantity = items?.reduce((sum, item) => sum + (parseFloat(item.quantity || '0')), 0) || 0;

          return {
            id: pallet.id,
            pallet_number: pallet.pallet_number,
            pallet_type: pallet.pallet_type || 'EURO',
            wo_id: pallet.wo_id,
            wo_number: pallet.work_order?.wo_number || null,
            line: pallet.line,
            location_id: pallet.location_id,
            location_name: pallet.location?.name || null,
            status: pallet.status || 'open',
            target_boxes: pallet.target_boxes,
            actual_boxes: pallet.actual_boxes,
            item_count,
            total_quantity,
            created_at: pallet.created_at,
            created_by: pallet.created_by,
            closed_at: pallet.closed_at,
            closed_by: pallet.closed_by
          };
        })
      );

      // Calculate summary statistics
      const status_counts = enhancedData.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const location_counts = enhancedData.reduce((acc, p) => {
        const loc = p.location_name || 'Unknown';
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        data: enhancedData,
        summary: {
          total_pallets: enhancedData.length,
          status_counts,
          location_counts
        }
      };
    } catch (error) {
      console.error('Error fetching pallets:', error);
      throw error;
    }
  }

  // Get pallet by ID with full details
  static async getById(id: number): Promise<{
    pallet: {
      id: number;
      pallet_number: string;
      pallet_type: string;
      wo_id: number | null;
      wo_number: string | null;
      line: string | null;
      location_id: number | null;
      location_name: string | null;
      status: string;
      target_boxes: number | null;
      actual_boxes: number | null;
      created_at: string;
      created_by: string | null;
      closed_at: string | null;
      closed_by: string | null;
    };
    items: Array<{
      id: number;
      lp_id: number;
      lp_number: string;
      product_description: string;
      quantity: number;
      uom: string;
      batch: string | null;
      expiry_date: string | null;
      added_at: string;
      added_by: string | null;
    }>;
  }> {
    try {
      // Get pallet details
      const { data: pallet, error: palletError } = await supabase
        .from('pallets')
        .select(`
          *,
          work_order:work_orders(wo_number),
          location:locations(name)
        `)
        .eq('id', id)
        .single();

      if (palletError) throw palletError;
      if (!pallet) throw new Error('Pallet not found');

      // Get pallet items with LP details
      const { data: items, error: itemsError } = await supabase
        .from('pallet_items')
        .select(`
          *,
          license_plate:license_plates(
            lp_number,
            product:products(description),
            quantity,
            uom,
            batch,
            expiry_date
          )
        `)
        .eq('pallet_id', id)
        .order('added_at', { ascending: true });

      if (itemsError) throw itemsError;

      return {
        pallet: {
          id: pallet.id,
          pallet_number: pallet.pallet_number,
          pallet_type: pallet.pallet_type || 'EURO',
          wo_id: pallet.wo_id,
          wo_number: pallet.work_order?.wo_number || null,
          line: pallet.line,
          location_id: pallet.location_id,
          location_name: pallet.location?.name || null,
          status: pallet.status || 'open',
          target_boxes: pallet.target_boxes,
          actual_boxes: pallet.actual_boxes,
          created_at: pallet.created_at,
          created_by: pallet.created_by,
          closed_at: pallet.closed_at,
          closed_by: pallet.closed_by
        },
        items: (items || []).map(item => ({
          id: item.id,
          lp_id: item.lp_id,
          lp_number: item.license_plate?.lp_number || '',
          product_description: item.license_plate?.product?.description || '',
          quantity: parseFloat(item.quantity || item.license_plate?.quantity || '0'),
          uom: item.uom || item.license_plate?.uom || '',
          batch: item.license_plate?.batch || null,
          expiry_date: item.license_plate?.expiry_date || null,
          added_at: item.added_at,
          added_by: item.added_by
        }))
      };
    } catch (error) {
      console.error('Error fetching pallet by ID:', error);
      throw error;
    }
  }

  // Create new pallet
  static async create(data: {
    pallet_number?: string; // Auto-generate if not provided
    pallet_type: 'EURO' | 'CHEP' | 'CUSTOM' | 'OTHER';
    wo_id?: number;
    line?: string;
    location_id?: number;
    target_boxes?: number;
    userId: string;
  }): Promise<{
    id: number;
    pallet_number: string;
  }> {
    try {
      // Auto-generate pallet number if not provided
      let pallet_number = data.pallet_number;
      if (!pallet_number) {
        // Format: PALLET-YYYY-NNNNNN
        const year = new Date().getFullYear();
        const { data: lastPallet, error: lastError } = await supabase
          .from('pallets')
          .select('pallet_number')
          .like('pallet_number', `PALLET-${year}-%`)
          .order('pallet_number', { ascending: false })
          .limit(1)
          .single();

        let nextSequence = 1;
        if (!lastError && lastPallet) {
          const match = lastPallet.pallet_number.match(/PALLET-\d{4}-(\d{6})/);
          if (match) {
            nextSequence = parseInt(match[1], 10) + 1;
          }
        }

        pallet_number = `PALLET-${year}-${nextSequence.toString().padStart(6, '0')}`;
      }

      // Insert pallet
      const { data: pallet, error } = await supabase
        .from('pallets')
        .insert({
          pallet_number,
          pallet_type: data.pallet_type,
          wo_id: data.wo_id || null,
          line: data.line || null,
          location_id: data.location_id || null,
          target_boxes: data.target_boxes || null,
          status: 'open',
          created_by: data.userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: pallet.id,
        pallet_number: pallet.pallet_number
      };
    } catch (error) {
      console.error('Error creating pallet:', error);
      throw error;
    }
  }

  // Add LP to pallet
  static async addLP(data: {
    pallet_id: number;
    lp_id: number;
    quantity?: number; // Optional, use full LP quantity if not specified
    userId: string;
  }): Promise<{
    item_id: number;
    lp_number: string;
  }> {
    try {
      // Validate pallet exists and is open
      const { data: pallet, error: palletError } = await supabase
        .from('pallets')
        .select('id, status')
        .eq('id', data.pallet_id)
        .single();

      if (palletError) throw palletError;
      if (!pallet) throw new Error('Pallet not found');
      if (pallet.status !== 'open') {
        throw new Error(`Cannot add LP to ${pallet.status} pallet. Pallet must be open.`);
      }

      // Validate LP exists and is not consumed
      const { data: lp, error: lpError } = await supabase
        .from('license_plates')
        .select('id, lp_number, quantity, uom, is_consumed, qa_status')
        .eq('id', data.lp_id)
        .single();

      if (lpError) throw lpError;
      if (!lp) throw new Error('License plate not found');
      if (lp.is_consumed) {
        throw new Error('Cannot add consumed LP to pallet');
      }
      if (lp.qa_status !== 'passed') {
        throw new Error(`Cannot add LP with QA status ${lp.qa_status}. Only 'passed' LPs can be added to pallets.`);
      }

      // Check if LP is already on this pallet
      const { data: existing } = await supabase
        .from('pallet_items')
        .select('id')
        .eq('pallet_id', data.pallet_id)
        .eq('lp_id', data.lp_id)
        .single();

      if (existing) {
        throw new Error('This LP is already on the pallet');
      }

      // Use specified quantity or full LP quantity
      const quantity = data.quantity !== undefined ? data.quantity : parseFloat(lp.quantity);

      // Validate quantity
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      if (quantity > parseFloat(lp.quantity)) {
        throw new Error(`Quantity ${quantity} exceeds LP quantity ${lp.quantity}`);
      }

      // Add LP to pallet
      const { data: item, error: itemError } = await supabase
        .from('pallet_items')
        .insert({
          pallet_id: data.pallet_id,
          lp_id: data.lp_id,
          quantity,
          uom: lp.uom,
          added_at: new Date().toISOString(),
          added_by: data.userId
        })
        .select()
        .single();

      if (itemError) throw itemError;

      return {
        item_id: item.id,
        lp_number: lp.lp_number
      };
    } catch (error) {
      console.error('Error adding LP to pallet:', error);
      throw error;
    }
  }

  // Remove LP from pallet
  static async removeLP(data: {
    pallet_id: number;
    lp_id: number;
    userId: string;
  }): Promise<void> {
    try {
      // Validate pallet is open
      const { data: pallet, error: palletError } = await supabase
        .from('pallets')
        .select('status')
        .eq('id', data.pallet_id)
        .single();

      if (palletError) throw palletError;
      if (!pallet) throw new Error('Pallet not found');
      if (pallet.status !== 'open') {
        throw new Error(`Cannot remove LP from ${pallet.status} pallet. Pallet must be open.`);
      }

      // Delete pallet item
      const { error } = await supabase
        .from('pallet_items')
        .delete()
        .eq('pallet_id', data.pallet_id)
        .eq('lp_id', data.lp_id);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing LP from pallet:', error);
      throw error;
    }
  }

  // Close pallet (seal it, no more changes allowed)
  static async close(data: {
    pallet_id: number;
    actual_boxes?: number;
    userId: string;
  }): Promise<void> {
    try {
      // Validate pallet exists and is open
      const { data: pallet, error: palletError } = await supabase
        .from('pallets')
        .select('id, status')
        .eq('id', data.pallet_id)
        .single();

      if (palletError) throw palletError;
      if (!pallet) throw new Error('Pallet not found');
      if (pallet.status !== 'open') {
        throw new Error(`Pallet is already ${pallet.status}`);
      }

      // Validate pallet has items
      const { data: items } = await supabase
        .from('pallet_items')
        .select('id')
        .eq('pallet_id', data.pallet_id);

      if (!items || items.length === 0) {
        throw new Error('Cannot close empty pallet. Add at least one LP first.');
      }

      // Update pallet status to closed
      const { error } = await supabase
        .from('pallets')
        .update({
          status: 'closed',
          actual_boxes: data.actual_boxes || null,
          closed_at: new Date().toISOString(),
          closed_by: data.userId
        })
        .eq('id', data.pallet_id);

      if (error) throw error;
    } catch (error) {
      console.error('Error closing pallet:', error);
      throw error;
    }
  }

  // Reopen pallet (allow modifications again)
  static async reopen(data: {
    pallet_id: number;
    userId: string;
  }): Promise<void> {
    try {
      const { data: pallet, error: palletError } = await supabase
        .from('pallets')
        .select('status')
        .eq('id', data.pallet_id)
        .single();

      if (palletError) throw palletError;
      if (!pallet) throw new Error('Pallet not found');
      if (pallet.status === 'shipped') {
        throw new Error('Cannot reopen shipped pallet');
      }

      const { error } = await supabase
        .from('pallets')
        .update({
          status: 'open',
          closed_at: null,
          closed_by: null
        })
        .eq('id', data.pallet_id);

      if (error) throw error;
    } catch (error) {
      console.error('Error reopening pallet:', error);
      throw error;
    }
  }

  // Mark pallet as shipped
  static async markShipped(data: {
    pallet_id: number;
    userId: string;
  }): Promise<void> {
    try {
      const { data: pallet, error: palletError } = await supabase
        .from('pallets')
        .select('status')
        .eq('id', data.pallet_id)
        .single();

      if (palletError) throw palletError;
      if (!pallet) throw new Error('Pallet not found');
      if (pallet.status !== 'closed') {
        throw new Error('Only closed pallets can be marked as shipped');
      }

      const { error } = await supabase
        .from('pallets')
        .update({
          status: 'shipped'
        })
        .eq('id', data.pallet_id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking pallet as shipped:', error);
      throw error;
    }
  }

  // Delete pallet (only if open and empty)
  static async delete(palletId: number): Promise<void> {
    try {
      const { data: pallet, error: palletError } = await supabase
        .from('pallets')
        .select('status')
        .eq('id', palletId)
        .single();

      if (palletError) throw palletError;
      if (!pallet) throw new Error('Pallet not found');
      if (pallet.status !== 'open') {
        throw new Error(`Cannot delete ${pallet.status} pallet. Only open pallets can be deleted.`);
      }

      // Check if pallet has items
      const { data: items } = await supabase
        .from('pallet_items')
        .select('id')
        .eq('pallet_id', palletId);

      if (items && items.length > 0) {
        throw new Error('Cannot delete pallet with items. Remove all items first.');
      }

      const { error } = await supabase
        .from('pallets')
        .delete()
        .eq('id', palletId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting pallet:', error);
      throw error;
    }
  }
}
