import { shouldUseMockData } from './config';
import { supabase } from '../supabase/client';
import { clientState } from '../clientState';
import type { Warehouse, CreateWarehouseData, UpdateWarehouseData } from '../types';

export class WarehousesAPI {
  static async getAll(): Promise<Warehouse[]> {
    if (shouldUseMockData()) {
      return clientState.getWarehouses();
    }
    
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      return [];
    }
  }

  static async getById(id: number): Promise<Warehouse | null> {
    if (shouldUseMockData()) {
      const warehouses = clientState.getWarehouses();
      return warehouses.find(w => w.id === id) || null;
    }
    
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      return null;
    }
  }

  static async create(data: CreateWarehouseData): Promise<Warehouse> {
    if (shouldUseMockData()) {
      // TODO: Implement in clientState
      throw new Error('Create warehouse not implemented in mock mode');
    }
    
    try {
      const { data: warehouse, error } = await supabase
        .from('warehouses')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return warehouse;
    } catch (error) {
      console.error('Error creating warehouse:', error);
      throw error;
    }
  }

  static async update(id: number, data: UpdateWarehouseData): Promise<Warehouse> {
    if (shouldUseMockData()) {
      // TODO: Implement in clientState
      throw new Error('Update warehouse not implemented in mock mode');
    }
    
    try {
      const { data: warehouse, error } = await supabase
        .from('warehouses')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return warehouse;
    } catch (error) {
      console.error('Error updating warehouse:', error);
      throw error;
    }
  }

  static async delete(id: number): Promise<void> {
    if (shouldUseMockData()) {
      // TODO: Implement in clientState
      throw new Error('Delete warehouse not implemented in mock mode');
    }
    
    try {
      const { error } = await supabase
        .from('warehouses')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      throw error;
    }
  }
}
