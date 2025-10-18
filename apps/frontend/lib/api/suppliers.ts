import { supabase } from '../supabase/client';
import type { Supplier, CreateSupplierData, UpdateSupplierData } from '../types';

export class SuppliersAPI {
  static async getAll(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching suppliers:', error);
      throw new Error('Failed to fetch suppliers');
    }

    return data || [];
  }

  static async getById(id: number): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching supplier:', error);
      return null;
    }

    return data;
  }

  static async create(data: CreateSupplierData): Promise<Supplier> {
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      throw new Error('Failed to create supplier');
    }

    return supplier;
  }

  static async update(id: number, data: UpdateSupplierData): Promise<Supplier> {
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier:', error);
      throw new Error('Failed to update supplier');
    }

    return supplier;
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting supplier:', error);
      throw new Error('Failed to delete supplier');
    }
  }
}
