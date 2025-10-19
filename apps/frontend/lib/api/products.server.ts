import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { API_CONFIG } from './config';
import type { Product } from '@/lib/types';

export class ProductsServerAPI {
  static async getAll(): Promise<Product[]> {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      API_CONFIG.supabaseUrl,
      API_CONFIG.supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        allergens:product_allergens(
          allergen_id,
          allergens(id, code, name)
        )
      `)
      .eq('is_active', true)
      .order('part_number');

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data || [];
  }

  static async getById(id: number): Promise<Product | null> {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      API_CONFIG.supabaseUrl,
      API_CONFIG.supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        allergens:product_allergens(
          allergen_id,
          allergens(id, code, name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return data;
  }
}
