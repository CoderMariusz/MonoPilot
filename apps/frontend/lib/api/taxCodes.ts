import { supabase } from '@/lib/supabase/client';
import type { TaxCode } from '@/lib/types';

export class TaxCodesAPI {
  static async getAll(): Promise<TaxCode[]> {
    const { data, error } = await supabase
      .from('settings_tax_codes')
      .select('*')
      .order('code');

    if (error) {
      console.error('Error fetching tax codes:', error);
      throw new Error('Failed to fetch tax codes');
    }

    return data || [];
  }

  static async getById(id: number): Promise<TaxCode> {
    const { data, error } = await supabase
      .from('settings_tax_codes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching tax code:', error);
      throw new Error('Failed to fetch tax code');
    }

    return data;
  }

  static async create(data: Omit<TaxCode, 'id' | 'created_at' | 'updated_at'>): Promise<TaxCode> {
    const { data: result, error } = await supabase
      .from('settings_tax_codes')
      .insert({
        code: data.code,
        name: data.name,
        rate: data.rate,
        is_active: data.is_active
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tax code:', error);
      throw new Error('Failed to create tax code');
    }

    return result;
  }

  static async update(id: number, data: Partial<Omit<TaxCode, 'id' | 'created_at' | 'updated_at'>>): Promise<TaxCode> {
    const { data: result, error } = await supabase
      .from('settings_tax_codes')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tax code:', error);
      throw new Error('Failed to update tax code');
    }

    return result;
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('settings_tax_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting tax code:', error);
      throw new Error('Failed to delete tax code');
    }
  }
}
