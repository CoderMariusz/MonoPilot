import { supabase } from '@/lib/supabase/client-browser';
import type { RoutingOperationName } from '@/lib/types';

export interface CreateRoutingOperationNameDTO {
  name: string;
  alias?: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateRoutingOperationNameDTO {
  name?: string;
  alias?: string;
  description?: string;
  is_active?: boolean;
}

export class RoutingOperationNamesAPI {
  static async getAll(): Promise<RoutingOperationName[]> {
    const { data, error } = await supabase
      .from('routing_operation_names')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching routing operation names:', error);
      throw new Error('Failed to fetch routing operation names');
    }

    return data || [];
  }

  static async getAllIncludingInactive(): Promise<RoutingOperationName[]> {
    const { data, error } = await supabase
      .from('routing_operation_names')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching routing operation names:', error);
      throw new Error('Failed to fetch routing operation names');
    }

    return data || [];
  }

  static async getById(id: number): Promise<RoutingOperationName | null> {
    const { data, error } = await supabase
      .from('routing_operation_names')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching routing operation name:', error);
      return null;
    }

    return data;
  }

  static async create(data: CreateRoutingOperationNameDTO): Promise<RoutingOperationName> {
    const { data: result, error } = await supabase
      .from('routing_operation_names')
      .insert({
        name: data.name,
        alias: data.alias || null,
        description: data.description || null,
        is_active: data.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating routing operation name:', error);
      throw new Error('Failed to create routing operation name');
    }

    return result;
  }

  static async update(id: number, data: UpdateRoutingOperationNameDTO): Promise<RoutingOperationName> {
    const { data: result, error } = await supabase
      .from('routing_operation_names')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating routing operation name:', error);
      throw new Error('Failed to update routing operation name');
    }

    return result;
  }

  static async delete(id: number): Promise<void> {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('routing_operation_names')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting routing operation name:', error);
      throw new Error('Failed to delete routing operation name');
    }
  }

  static async hardDelete(id: number): Promise<void> {
    const { error } = await supabase
      .from('routing_operation_names')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error hard deleting routing operation name:', error);
      throw new Error('Failed to hard delete routing operation name');
    }
  }
}

