import { supabase } from '../supabase/client-browser';
import type { Warehouse, CreateWarehouseData, UpdateWarehouseData } from '../types';

export class WarehousesAPI {
  static async getAll(): Promise<Warehouse[]> {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching warehouses:', error);
      throw new Error('Failed to fetch warehouses');
    }

    return data || [];
  }

  static async getById(id: number): Promise<Warehouse | null> {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching warehouse:', error);
      return null;
    }

    return data;
  }

  static async create(data: CreateWarehouseData): Promise<Warehouse> {
    const { data: warehouse, error } = await supabase
      .from('warehouses')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating warehouse:', error);
      throw new Error('Failed to create warehouse');
    }

    return warehouse;
  }

  static async update(id: number, data: UpdateWarehouseData): Promise<Warehouse> {
    const { data: warehouse, error } = await supabase
      .from('warehouses')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating warehouse:', error);
      throw new Error('Failed to update warehouse');
    }

    return warehouse;
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('warehouses')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting warehouse:', error);
      throw new Error('Failed to delete warehouse');
    }
  }
}
