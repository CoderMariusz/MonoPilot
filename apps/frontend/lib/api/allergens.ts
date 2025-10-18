import { supabase } from '@/lib/supabase/client';
import type { Allergen, CreateAllergenData, UpdateAllergenData } from '@/lib/types';

export class AllergensAPI {
  static async getAll(): Promise<Allergen[]> {
    const { data, error } = await supabase
      .from('allergens')
      .select('*')
      .order('code');

    if (error) {
      console.error('Error fetching allergens:', error);
      throw new Error('Failed to fetch allergens');
    }

    return data || [];
  }

  static async getById(id: number): Promise<Allergen | null> {
    const { data, error } = await supabase
      .from('allergens')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching allergen:', error);
      return null;
    }

    return data;
  }

  static async create(data: CreateAllergenData): Promise<Allergen> {
    const { data: result, error } = await supabase
      .from('allergens')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating allergen:', error);
      throw new Error('Failed to create allergen');
    }

    return result;
  }

  static async update(id: number, data: UpdateAllergenData): Promise<Allergen> {
    const { data: result, error } = await supabase
      .from('allergens')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating allergen:', error);
      throw new Error('Failed to update allergen');
    }

    return result;
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('allergens')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting allergen:', error);
      throw new Error('Failed to delete allergen');
    }
  }
}
