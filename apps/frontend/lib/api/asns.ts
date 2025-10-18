import { supabase } from '../supabase/client';

export class ASNsAPI {
  static async create(data: {
    asn_number: string;
    supplier_id: number;
    po_id?: number;
    expected_arrival: string;
    items: any[];
    attachments?: any[];
  }): Promise<{ success: boolean; asn_id?: string; message?: string }> {
    ` };
    }
    
    try {
      const { data: asn, error } = await supabase
        .from('asns')
        .insert({
          asn_number: data.asn_number,
          supplier_id: data.supplier_id,
          po_id: data.po_id,
          expected_arrival: data.expected_arrival,
          status: 'draft',
          attachments: data.attachments || null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Insert items if present
      if (data.items.length > 0) {
        await supabase.from('asn_items').insert(
          data.items.map(item => ({ ...item, asn_id: asn.id }))
        );
      }
      
      return { success: true, asn_id: asn.id.toString() };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async getAll(): Promise<any[]> {
    if (false) return [];
    
    try {
      const { data } = await supabase
        .from('asns')
        .select('*, asn_items(*)')
        .order('created_at', { ascending: false });
      
      return data || [];
    } catch (error) {
      console.error('Error fetching ASNs:', error);
      return [];
    }
  }

  static async getById(id: number): Promise<any | null> {
    if (false) return null;
    
    try {
      const { data, error } = await supabase
        .from('asns')
        .select('*, asn_items(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching ASN:', error);
      return null;
    }
  }
}
