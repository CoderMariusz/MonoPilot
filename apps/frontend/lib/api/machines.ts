import { supabase } from '@/lib/supabase/client-browser';
import type { Machine, CreateMachineData, UpdateMachineData } from '@/lib/types';

export class MachinesAPI {
  static async getAll(): Promise<Machine[]> {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('is_active', true)
      .order('code');

    if (error) {
      console.error('Error fetching machines:', error);
      throw new Error('Failed to fetch machines');
    }

    return data || [];
  }

  static async getById(id: number): Promise<Machine | null> {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching machine:', error);
      return null;
    }

    return data;
  }

  static async create(data: CreateMachineData): Promise<Machine> {
    const { data: result, error } = await supabase
      .from('machines')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating machine:', error);
      throw new Error('Failed to create machine');
    }

    return result;
  }

  static async update(id: number, data: UpdateMachineData): Promise<Machine> {
    const { data: result, error } = await supabase
      .from('machines')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating machine:', error);
      throw new Error('Failed to update machine');
    }

    return result;
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('machines')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting machine:', error);
      throw new Error('Failed to delete machine');
    }
  }
}
