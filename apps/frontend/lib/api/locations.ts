import { supabase } from '@/lib/supabase/client-browser';
import type {
  Location,
  CreateLocationData,
  UpdateLocationData,
} from '@/lib/types';

export class LocationsAPI {
  static async getAll(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('code');

    if (error) {
      console.error('Error fetching locations:', error);
      throw new Error('Failed to fetch locations');
    }

    return data || [];
  }

  static async getById(id: number): Promise<Location | null> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching location:', error);
      return null;
    }

    return data;
  }

  static async create(data: CreateLocationData): Promise<Location> {
    const { data: result, error } = await supabase
      .from('locations')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating location:', error);
      throw new Error('Failed to create location');
    }

    return result;
  }

  static async update(id: number, data: UpdateLocationData): Promise<Location> {
    const timestamp = new Date().toISOString();
    const payload = {
      ...data,
      updated_at: timestamp,
    };

    const { data: result, error } = await supabase
      .from('locations')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating location:', error);
      throw new Error('Failed to update location');
    }

    return result;
  }

  static async delete(id: number): Promise<void> {
    const timestamp = new Date().toISOString();

    const { error } = await supabase
      .from('locations')
      .update({ is_active: false, updated_at: timestamp })
      .eq('id', id);

    if (error) {
      console.error('Error deleting location:', error);
      throw new Error('Failed to delete location');
    }
  }
}
