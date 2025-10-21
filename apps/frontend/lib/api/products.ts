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
        ),
        activeBom:boms!boms_product_id_fkey(
          id,
          version,
          status,
          archived_at,
          deleted_at,
          requires_routing,
          default_routing_id,
          notes,
          effective_from,
          effective_to,
          created_at,
          updated_at,
          bomItems:bom_items(
            id,
            material_id,
            quantity,
            uom,
            sequence,
            priority,
            production_lines,
            production_line_restrictions,
            scrap_std_pct,
            is_optional,
            is_phantom,
            consume_whole_lp,
            unit_cost_std,
            tax_code_id,
            lead_time_days,
            moq,
            created_at,
            updated_at,
            material:products!bom_items_material_id_fkey(
              id,
              part_number,
              description,
              uom,
              product_group,
              product_type
            )
          )
        )
      `)
      .order('part_number');

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }

    // Filter to only include activeBom for products with active BOMs
    const filteredData = (data || []).map(product => ({
      ...product,
      activeBom: product.activeBom?.status === 'active' ? product.activeBom : null
    }));

    console.log('ProductsAPI.getAll() - Raw data:', data);
    console.log('ProductsAPI.getAll() - Filtered data:', filteredData);
    
    return filteredData;
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
