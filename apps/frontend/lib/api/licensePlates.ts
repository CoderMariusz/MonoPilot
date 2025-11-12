import { supabase } from '../supabase/client-browser';

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

  // Split LP into multiple child LPs with genealogy tracking
  static async split(
    lpId: number,
    childQuantities: Array<{ quantity: number; uom?: string }>,
    userId: string,
    woId?: number,
    opSeq?: number
  ): Promise<{
    parent_lp: { id: number; lp_number: string; is_consumed: boolean };
    child_lps: Array<{
      id: number;
      lp_number: string;
      quantity: number;
      uom: string;
      batch: string | null;
      expiry_date: string | null;
    }>;
  }> {
    try {
      // 1. Get parent LP details
      const { data: parentLP, error: parentError } = await supabase
        .from('license_plates')
        .select('*')
        .eq('id', lpId)
        .single();

      if (parentError) throw parentError;
      if (!parentLP) throw new Error('Parent LP not found');

      // 2. Validate parent LP
      if (parentLP.is_consumed) {
        throw new Error('Cannot split consumed LP');
      }

      if (parseFloat(parentLP.quantity) <= 0) {
        throw new Error('Parent LP has no quantity to split');
      }

      // 3. Validate quantities
      const totalChildQty = childQuantities.reduce((sum, c) => sum + c.quantity, 0);
      const parentQty = parseFloat(parentLP.quantity);

      if (totalChildQty > parentQty) {
        throw new Error(`Total child quantity (${totalChildQty}) exceeds parent quantity (${parentQty})`);
      }

      // 4. Generate LP numbers for children
      const year = new Date().getFullYear();
      const { data: existingLPs, error: countError } = await supabase
        .from('license_plates')
        .select('lp_number')
        .like('lp_number', `LP-${year}-%`)
        .order('lp_number', { ascending: false })
        .limit(1);

      if (countError) throw countError;

      let nextSequence = 1;
      if (existingLPs && existingLPs.length > 0) {
        const lastNumber = existingLPs[0].lp_number.replace(`LP-${year}-`, '');
        nextSequence = parseInt(lastNumber, 10) + 1;
      }

      // 5. Create child LPs (inherit batch, expiry, product, location, qa_status from parent)
      const childLPsData = childQuantities.map((child, index) => ({
        lp_number: `LP-${year}-${(nextSequence + index).toString().padStart(6, '0')}`,
        product_id: parentLP.product_id,
        location_id: parentLP.location_id,
        quantity: child.quantity,
        uom: child.uom || parentLP.uom,
        batch: parentLP.batch, // Inherit batch
        expiry_date: parentLP.expiry_date, // Inherit expiry
        qa_status: parentLP.qa_status, // Inherit QA status
        stage_suffix: parentLP.stage_suffix,
        parent_lp_id: lpId, // Set parent reference
        is_consumed: false,
        origin_type: 'split',
        origin_ref: { parent_lp_id: lpId, split_date: new Date().toISOString() }
      }));

      const { data: childLPs, error: childError } = await supabase
        .from('license_plates')
        .insert(childLPsData)
        .select();

      if (childError) throw childError;

      // 6. Record genealogy for each child
      const genealogyRecords = childLPs.map(child => ({
        child_lp_id: child.id,
        parent_lp_id: lpId,
        quantity_consumed: child.quantity,
        uom: child.uom,
        wo_id: woId || null,
        operation_sequence: opSeq || null
      }));

      const { error: genealogyError } = await supabase
        .from('lp_genealogy')
        .insert(genealogyRecords);

      if (genealogyError) {
        // Rollback: delete child LPs
        await supabase.from('license_plates').delete().in('id', childLPs.map(c => c.id));
        throw genealogyError;
      }

      // 7. Update parent LP (mark as consumed if fully split)
      const isFullSplit = Math.abs(totalChildQty - parentQty) < 0.0001; // Float comparison
      if (isFullSplit) {
        const { error: updateError } = await supabase
          .from('license_plates')
          .update({
            is_consumed: true,
            consumed_at: new Date().toISOString(),
            consumed_by: userId
          })
          .eq('id', lpId);

        if (updateError) throw updateError;
      }

      return {
        parent_lp: {
          id: parentLP.id,
          lp_number: parentLP.lp_number,
          is_consumed: isFullSplit
        },
        child_lps: childLPs.map(child => ({
          id: child.id,
          lp_number: child.lp_number,
          quantity: parseFloat(child.quantity),
          uom: child.uom,
          batch: child.batch,
          expiry_date: child.expiry_date
        }))
      };
    } catch (error) {
      console.error('Error splitting LP:', error);
      throw error;
    }
  }

  // Merge multiple LPs into single output LP with composition tracking
  static async merge(
    inputLpIds: number[],
    outputData: {
      product_id: number;
      location_id: number;
      quantity: number;
      uom: string;
      batch?: string;
      expiry_date?: string;
      qa_status?: string;
      stage_suffix?: string;
    },
    userId: string,
    woId?: number,
    opSeq?: number
  ): Promise<{
    output_lp: {
      id: number;
      lp_number: string;
      quantity: number;
      uom: string;
    };
    input_lps: Array<{
      id: number;
      lp_number: string;
      quantity: number;
      is_consumed: boolean;
    }>;
  }> {
    try {
      // 1. Get input LPs details
      const { data: inputLPs, error: inputError } = await supabase
        .from('license_plates')
        .select('*')
        .in('id', inputLpIds);

      if (inputError) throw inputError;
      if (!inputLPs || inputLPs.length === 0) {
        throw new Error('No input LPs found');
      }

      if (inputLPs.length !== inputLpIds.length) {
        throw new Error('Some input LPs not found');
      }

      // 2. Validate input LPs (same product, batch, expiry, qa_status - Business Rule)
      const firstLP = inputLPs[0];
      const invalidLP = inputLPs.find(lp =>
        lp.product_id !== firstLP.product_id ||
        lp.batch !== firstLP.batch ||
        lp.expiry_date !== firstLP.expiry_date ||
        lp.qa_status !== firstLP.qa_status ||
        lp.is_consumed === true
      );

      if (invalidLP) {
        throw new Error(
          'All input LPs must have same product, batch, expiry date, and QA status. ' +
          'Consumed LPs cannot be merged.'
        );
      }

      // 3. Generate LP number for output
      const year = new Date().getFullYear();
      const { data: existingLPs, error: countError } = await supabase
        .from('license_plates')
        .select('lp_number')
        .like('lp_number', `LP-${year}-%`)
        .order('lp_number', { ascending: false })
        .limit(1);

      if (countError) throw countError;

      let nextSequence = 1;
      if (existingLPs && existingLPs.length > 0) {
        const lastNumber = existingLPs[0].lp_number.replace(`LP-${year}-`, '');
        nextSequence = parseInt(lastNumber, 10) + 1;
      }

      const outputLpNumber = `LP-${year}-${nextSequence.toString().padStart(6, '0')}`;

      // 4. Create output LP
      const { data: outputLP, error: outputError } = await supabase
        .from('license_plates')
        .insert({
          lp_number: outputLpNumber,
          product_id: outputData.product_id,
          location_id: outputData.location_id,
          quantity: outputData.quantity,
          uom: outputData.uom,
          batch: outputData.batch || firstLP.batch,
          expiry_date: outputData.expiry_date || firstLP.expiry_date,
          qa_status: outputData.qa_status || firstLP.qa_status,
          stage_suffix: outputData.stage_suffix || firstLP.stage_suffix,
          is_consumed: false,
          origin_type: 'merge',
          origin_ref: { input_lp_ids: inputLpIds, merge_date: new Date().toISOString() }
        })
        .select()
        .single();

      if (outputError) throw outputError;

      // 5. Record composition for each input LP
      const compositionRecords = inputLPs.map((inputLP, index) => ({
        output_lp_id: outputLP.id,
        input_lp_id: inputLP.id,
        qty: parseFloat(inputLP.quantity),
        uom: inputLP.uom,
        op_seq: opSeq ? opSeq + index : index + 1
      }));

      const { error: compositionError } = await supabase
        .from('lp_compositions')
        .insert(compositionRecords);

      if (compositionError) {
        // Rollback: delete output LP
        await supabase.from('license_plates').delete().eq('id', outputLP.id);
        throw compositionError;
      }

      // 6. Mark input LPs as consumed
      const { error: consumeError } = await supabase
        .from('license_plates')
        .update({
          is_consumed: true,
          consumed_at: new Date().toISOString(),
          consumed_by: userId
        })
        .in('id', inputLpIds);

      if (consumeError) throw consumeError;

      return {
        output_lp: {
          id: outputLP.id,
          lp_number: outputLP.lp_number,
          quantity: parseFloat(outputLP.quantity),
          uom: outputLP.uom
        },
        input_lps: inputLPs.map(lp => ({
          id: lp.id,
          lp_number: lp.lp_number,
          quantity: parseFloat(lp.quantity),
          is_consumed: true
        }))
      };
    } catch (error) {
      console.error('Error merging LPs:', error);
      throw error;
    }
  }

  // Get genealogy tree (parent → children chain)
  static async getGenealogy(lpId: number): Promise<{
    tree: Array<{
      lp_id: number;
      lp_number: string;
      parent_lp_id: number | null;
      parent_lp_number: string | null;
      level: number;
      quantity: number;
      uom: string;
      batch: string | null;
      expiry_date: string | null;
      product_description: string;
      location: string;
      qa_status: string;
      is_consumed: boolean;
      created_at: string;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_lp_genealogy_tree', { lp_id_param: lpId });

      if (error) throw error;

      return {
        tree: data || []
      };
    } catch (error) {
      console.error('Error fetching LP genealogy:', error);
      throw error;
    }
  }

  // Get reverse genealogy (child → parent chain, where did this LP come from)
  static async getReverseGenealogy(lpId: number): Promise<{
    chain: Array<{
      lp_id: number;
      lp_number: string;
      parent_lp_id: number | null;
      parent_lp_number: string | null;
      level: number;
      quantity: number;
      uom: string;
      batch: string | null;
      expiry_date: string | null;
      product_description: string;
      location: string;
      qa_status: string;
      is_consumed: boolean;
      created_at: string;
      quantity_consumed: number | null;
      wo_number: string | null;
      operation_sequence: number | null;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_lp_reverse_genealogy', { lp_id_param: lpId });

      if (error) throw error;

      return {
        chain: data || []
      };
    } catch (error) {
      console.error('Error fetching LP reverse genealogy:', error);
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
