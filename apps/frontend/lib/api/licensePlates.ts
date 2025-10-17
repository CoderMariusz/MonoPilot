import { shouldUseMockData } from './config';
import { supabase } from '../supabase/client';

// License Plates API - Warehouse license plate management
export class LicensePlatesAPI {
  // Get all license plates with filters
  static async getAll(filters?: {
    qa_status?: 'Pending' | 'Passed' | 'Failed' | 'Quarantine';
    location?: string;
    product_id?: number;
    stage_suffix?: string;
    origin_type?: string;
    has_reservations?: boolean;
  }): Promise<{
    data: Array<{
      id: number;
      lp_number: string;
      product_id: number;
      product_description: string;
      product_part_number: string;
      location_id: number;
      location_name: string;
      quantity: number;
      uom: string;
      qa_status: string;
      stage_suffix: string;
      parent_lp_id: number;
      parent_lp_number: string;
      origin_type: string;
      origin_ref: any;
      available_qty: number;
      reserved_qty: number;
      created_at: string;
      updated_at: string;
    }>;
    summary: {
      total_lps: number;
      total_quantity: number;
      qa_status_counts: Record<string, number>;
      location_counts: Record<string, number>;
    };
  }> {
    if (shouldUseMockData()) {
      // Mock license plates data
      return {
        data: [
          {
            id: 1,
            lp_number: '00000001',
            product_id: 1,
            product_description: 'Ground Beef',
            product_part_number: 'GB-001',
            location_id: 1,
            location_name: 'Main Warehouse',
            quantity: 100,
            uom: 'kg',
            qa_status: 'Passed',
            stage_suffix: null,
            parent_lp_id: null,
            parent_lp_number: null,
            origin_type: 'GRN',
            origin_ref: { grn_id: 1 },
            available_qty: 100,
            reserved_qty: 0,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          }
        ],
        summary: {
          total_lps: 1,
          total_quantity: 100,
          qa_status_counts: { 'Passed': 1 },
          location_counts: { 'Main Warehouse': 1 }
        }
      };
    }

    try {
      let query = supabase
        .from('license_plates')
        .select(`
          *,
          product:products(description, part_number),
          location:locations(name)
        `);

      // Apply filters
      if (filters?.qa_status) {
        query = query.eq('qa_status', filters.qa_status);
      }
      if (filters?.location) {
        query = query.eq('location.name', filters.location);
      }
      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }
      if (filters?.stage_suffix) {
        query = query.eq('stage_suffix', filters.stage_suffix);
      }
      if (filters?.origin_type) {
        query = query.eq('origin_type', filters.origin_type);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate available quantities and reservations
      const enhancedData = await Promise.all(
        (data || []).map(async (lp) => {
          // Get available quantity (total - reserved)
          const { data: reservations } = await supabase
            .from('lp_reservations')
            .select('qty')
            .eq('lp_id', lp.id)
            .eq('status', 'active');

          const reserved_qty = reservations?.reduce((sum, r) => sum + parseFloat(r.qty), 0) || 0;
          const available_qty = Math.max(0, parseFloat(lp.quantity) - reserved_qty);

          return {
            id: lp.id,
            lp_number: lp.lp_number,
            product_id: lp.product_id,
            product_description: lp.product?.description || '',
            product_part_number: lp.product?.part_number || '',
            location_id: lp.location_id,
            location_name: lp.location?.name || '',
            quantity: parseFloat(lp.quantity),
            uom: lp.uom,
            qa_status: lp.qa_status,
            stage_suffix: lp.stage_suffix,
            parent_lp_id: lp.parent_lp_id,
            parent_lp_number: lp.parent_lp_number,
            origin_type: lp.origin_type,
            origin_ref: lp.origin_ref,
            available_qty,
            reserved_qty,
            created_at: lp.created_at,
            updated_at: lp.updated_at
          };
        })
      );

      // Filter by reservations if requested
      const filteredData = filters?.has_reservations !== undefined
        ? enhancedData.filter(lp => 
            filters.has_reservations ? lp.reserved_qty > 0 : lp.reserved_qty === 0
          )
        : enhancedData;

      // Calculate summary
      const summary = {
        total_lps: filteredData.length,
        total_quantity: filteredData.reduce((sum, lp) => sum + lp.quantity, 0),
        qa_status_counts: filteredData.reduce((counts, lp) => {
          counts[lp.qa_status] = (counts[lp.qa_status] || 0) + 1;
          return counts;
        }, {} as Record<string, number>),
        location_counts: filteredData.reduce((counts, lp) => {
          counts[lp.location_name] = (counts[lp.location_name] || 0) + 1;
          return counts;
        }, {} as Record<string, number>)
      };

      return {
        data: filteredData,
        summary
      };
    } catch (error) {
      console.error('Error fetching license plates:', error);
      throw error;
    }
  }

  // Get LP composition tree
  static async getLPComposition(lpId: number): Promise<{
    forward: Array<{
      node_id: number;
      node_type: string;
      lp_number: string;
      product_description: string;
      quantity: number;
      uom: string;
      qa_status: string;
      stage_suffix: string;
      location: string;
      parent_node: string;
      depth: number;
      composition_qty: number;
      pallet_code: string;
    }>;
    backward: Array<{
      node_id: number;
      node_type: string;
      lp_number: string;
      product_description: string;
      quantity: number;
      uom: string;
      qa_status: string;
      stage_suffix: string;
      location: string;
      parent_node: string;
      depth: number;
      composition_qty: number;
      pallet_code: string;
    }>;
  }> {
    if (shouldUseMockData()) {
      return {
        forward: [],
        backward: []
      };
    }

    try {
      // Get LP number first
      const { data: lpData, error: lpError } = await supabase
        .from('license_plates')
        .select('lp_number')
        .eq('id', lpId)
        .single();

      if (lpError || !lpData) {
        throw new Error('License plate not found');
      }

      // Get forward composition
      const { data: forwardData, error: forwardError } = await supabase
        .rpc('get_lp_composition_tree', { lp_id_param: lpId });

      if (forwardError) throw forwardError;

      // Get backward composition
      const { data: backwardData, error: backwardError } = await supabase
        .rpc('get_lp_reverse_composition_tree', { lp_id_param: lpId });

      if (backwardError) throw backwardError;

      return {
        forward: forwardData || [],
        backward: backwardData || []
      };
    } catch (error) {
      console.error('Error fetching LP composition:', error);
      throw error;
    }
  }

  // Get LP details with full information
  static async getLPDetails(lpId: number): Promise<{
    id: number;
    lp_number: string;
    product: {
      id: number;
      part_number: string;
      description: string;
      type: string;
      uom: string;
    };
    location: {
      id: number;
      name: string;
      code: string;
    };
    quantity: number;
    qa_status: string;
    stage_suffix: string;
    parent_lp: {
      id: number;
      lp_number: string;
    } | null;
    origin: {
      type: string;
      ref: any;
    };
    reservations: Array<{
      id: number;
      wo_id: number;
      wo_number: string;
      qty: number;
      status: string;
      created_at: string;
    }>;
    compositions: Array<{
      id: number;
      input_lp_id: number;
      input_lp_number: string;
      output_lp_id: number;
      output_lp_number: string;
      qty: number;
      uom: string;
      op_seq: number;
    }>;
    stock_moves: Array<{
      id: number;
      move_number: string;
      move_type: string;
      status: string;
      quantity: number;
      move_date: string;
    }>;
  }> {
    if (shouldUseMockData()) {
      return {
        id: lpId,
        lp_number: '00000001',
        product: {
          id: 1,
          part_number: 'GB-001',
          description: 'Ground Beef',
          type: 'RM',
          uom: 'kg'
        },
        location: {
          id: 1,
          name: 'Main Warehouse',
          code: 'MW-001'
        },
        quantity: 100,
        qa_status: 'Passed',
        stage_suffix: null,
        parent_lp: null,
        origin: {
          type: 'GRN',
          ref: { grn_id: 1 }
        },
        reservations: [],
        compositions: [],
        stock_moves: []
      };
    }

    try {
      // Get LP with all related data
      const { data: lpData, error: lpError } = await supabase
        .from('license_plates')
        .select(`
          *,
          product:products(*),
          location:locations(*),
          parent_lp:license_plates!parent_lp_id(id, lp_number)
        `)
        .eq('id', lpId)
        .single();

      if (lpError) throw lpError;

      // Get reservations
      const { data: reservations, error: resError } = await supabase
        .from('lp_reservations')
        .select(`
          *,
          work_order:work_orders(wo_number)
        `)
        .eq('lp_id', lpId);

      if (resError) throw resError;

      // Get compositions
      const { data: compositions, error: compError } = await supabase
        .from('lp_compositions')
        .select(`
          *,
          input_lp:license_plates!input_lp_id(lp_number),
          output_lp:license_plates!output_lp_id(lp_number)
        `)
        .or(`input_lp_id.eq.${lpId},output_lp_id.eq.${lpId}`);

      if (compError) throw compError;

      // Get stock moves
      const { data: stockMoves, error: movesError } = await supabase
        .from('stock_moves')
        .select('*')
        .eq('lp_id', lpId)
        .order('move_date', { ascending: false });

      if (movesError) throw movesError;

      return {
        id: lpData.id,
        lp_number: lpData.lp_number,
        product: {
          id: lpData.product.id,
          part_number: lpData.product.part_number,
          description: lpData.product.description,
          type: lpData.product.type,
          uom: lpData.product.uom
        },
        location: {
          id: lpData.location.id,
          name: lpData.location.name,
          code: lpData.location.code
        },
        quantity: parseFloat(lpData.quantity),
        qa_status: lpData.qa_status,
        stage_suffix: lpData.stage_suffix,
        parent_lp: lpData.parent_lp ? {
          id: lpData.parent_lp.id,
          lp_number: lpData.parent_lp.lp_number
        } : null,
        origin: {
          type: lpData.origin_type,
          ref: lpData.origin_ref
        },
        reservations: (reservations || []).map(r => ({
          id: r.id,
          wo_id: r.wo_id,
          wo_number: r.work_order?.wo_number || '',
          qty: parseFloat(r.qty),
          status: r.status,
          created_at: r.created_at
        })),
        compositions: (compositions || []).map(c => ({
          id: c.id,
          input_lp_id: c.input_lp_id,
          input_lp_number: c.input_lp?.lp_number || '',
          output_lp_id: c.output_lp_id,
          output_lp_number: c.output_lp?.lp_number || '',
          qty: parseFloat(c.qty),
          uom: c.uom,
          op_seq: c.op_seq
        })),
        stock_moves: (stockMoves || []).map(sm => ({
          id: sm.id,
          move_number: sm.move_number,
          move_type: sm.move_type,
          status: sm.status,
          quantity: parseFloat(sm.quantity),
          move_date: sm.move_date
        }))
      };
    } catch (error) {
      console.error('Error fetching LP details:', error);
      throw error;
    }
  }
}
