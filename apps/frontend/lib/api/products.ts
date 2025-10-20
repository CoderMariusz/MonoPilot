import { supabase } from '@/lib/supabase/client-browser';
import type { Product, CreateProductData, UpdateProductData } from '@/lib/types';

export class ProductsAPI {
  static async getAll(): Promise<Product[]> {
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
      throw new Error('Failed to fetch products');
    }

    return data || [];
  }

  static async getById(id: number): Promise<Product | null> {
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


  // legacy getByCategory removed in favor of group/type filters in clientState
}
