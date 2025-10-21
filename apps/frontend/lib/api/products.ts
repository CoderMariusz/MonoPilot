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

    // Process data to get the latest BOM for each product (regardless of status)
    const processedData = (data || []).map(product => {
      // activeBom is returned as an array by Supabase
      let latestBom = null;
      
      if (Array.isArray(product.activeBom) && product.activeBom.length > 0) {
        // Sort by created_at descending and get the first (latest) one
        const sortedBoms = [...product.activeBom].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        latestBom = sortedBoms[0];
      } else if (product.activeBom && !Array.isArray(product.activeBom)) {
        // If it's already a single object, use it
        latestBom = product.activeBom;
      }
      
      return {
        ...product,
        activeBom: latestBom
      };
    });

    console.log('ProductsAPI.getAll() - Processed data:', processedData);
    
    return processedData;
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
