import { shouldUseMockData } from './config';
import { supabase } from '../supabase/client';
import { clientState } from '../clientState';
import type { Supplier, CreateSupplierData, UpdateSupplierData } from '../types';

export class SuppliersAPI {
  static async getAll(): Promise<Supplier[]> {
    if (shouldUseMockData()) {
      return clientState.getSuppliers();
    }
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  }

  static async getById(id: number): Promise<Supplier | null> {
    if (shouldUseMockData()) {
      const suppliers = clientState.getSuppliers();
      return suppliers.find(s => s.id === id) || null;
    }
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching supplier:', error);
      return null;
    }
  }

  static async create(data: CreateSupplierData): Promise<Supplier> {
    if (shouldUseMockData()) {
      // TODO: Implement in clientState
      throw new Error('Create supplier not implemented in mock mode');
    }
    
    try {
      const { data: supplier, error } = await supabase
        .from('suppliers')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return supplier;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  static async update(id: number, data: UpdateSupplierData): Promise<Supplier> {
    if (shouldUseMockData()) {
      // TODO: Implement in clientState
      throw new Error('Update supplier not implemented in mock mode');
    }
    
    try {
      const { data: supplier, error } = await supabase
        .from('suppliers')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return supplier;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }

  static async delete(id: number): Promise<void> {
    if (shouldUseMockData()) {
      // TODO: Implement in clientState
      throw new Error('Delete supplier not implemented in mock mode');
    }
    
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }
}
