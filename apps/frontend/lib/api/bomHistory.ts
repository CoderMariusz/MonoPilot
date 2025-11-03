import { supabase } from '@/lib/supabase/client-browser';
import type { BomHistory } from '@/lib/types';

export class BomHistoryAPI {
  static async create(data: {
    bom_id: number;
    version: string;
    status_from: string;
    status_to: string;
    changes: object;
    description?: string;
  }): Promise<BomHistory> {
    const { data: user } = await supabase.auth.getUser();
    
    const { data: result, error } = await supabase
      .from('bom_history')
      .insert({
        bom_id: data.bom_id,
        version: data.version,
        status_from: data.status_from,
        status_to: data.status_to,
        changes: data.changes,
        description: data.description,
        changed_by: user?.user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating BOM history:', error);
      throw new Error('Failed to create BOM history');
    }

    return result;
  }

  static async getByBomId(bomId: number): Promise<BomHistory[]> {
    const { data, error } = await supabase
      .from('bom_history')
      .select(`
        *,
        changed_by_user:users!changed_by(id, email)
      `)
      .eq('bom_id', bomId)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('Error fetching BOM history:', error);
      throw new Error('Failed to fetch BOM history');
    }

    return data || [];
  }

  static async getAll(options?: {
    limit?: number;
    offset?: number;
    bom_id?: number;
  }): Promise<BomHistory[]> {
    let query = supabase
      .from('bom_history')
      .select(`
        *,
        changed_by_user:users!changed_by(id, email),
        bom:boms!bom_id(
          id,
          product_id,
          version,
          status,
          products!product_id(id, part_number, description)
        )
      `)
      .order('changed_at', { ascending: false });

    if (options?.bom_id) {
      query = query.eq('bom_id', options.bom_id);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching BOM history:', error);
      throw new Error('Failed to fetch BOM history');
    }

    return data || [];
  }
}


