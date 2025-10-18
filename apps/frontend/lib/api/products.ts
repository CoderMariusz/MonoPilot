import { supabase } from '@/lib/supabase/client';
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

  static async create(data: CreateProductData): Promise<Product> {

    const { bom_items, ...productData } = data;

    // Create the product first
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (productError) {
      console.error('Error creating product:', productError);
      throw new Error('Failed to create product');
    }

    // Create BOM if bom_items are provided
    if (bom_items && bom_items.length > 0) {
      const { data: bom, error: bomError } = await supabase
        .from('bom')
        .insert([{
          product_id: product.id,
          version: '1.0',
          is_active: true,
          created_by: null, // TODO: Get from auth context
          updated_by: null
        }])
        .select()
        .single();

      if (bomError) {
        console.error('Error creating BOM:', bomError);
        throw new Error('Failed to create BOM');
      }

      // Create BOM items
      const bomItems = bom_items.map((item, index) => ({
        bom_id: bom.id,
        material_id: item.material_id,
        quantity: item.quantity,
        uom: item.uom,
        sequence: item.sequence || index + 1,
        priority: item.priority,
        production_lines: item.production_lines || [],
        scrap_std_pct: item.scrap_std_pct || 0,
        is_optional: item.is_optional || false,
        is_phantom: item.is_phantom || false,
        one_to_one: item.one_to_one || false,
        unit_cost_std: item.unit_cost_std
      }));

      const { error: bomItemsError } = await supabase
        .from('bom_items')
        .insert(bomItems);

      if (bomItemsError) {
        console.error('Error creating BOM items:', bomItemsError);
        throw new Error('Failed to create BOM items');
      }
    }

    return product;
  }

  static async update(id: number, data: UpdateProductData): Promise<Product> {

    const { bom_items, ...productData } = data;

    // Update the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();

    if (productError) {
      console.error('Error updating product:', productError);
      throw new Error('Failed to update product');
    }

    // Handle BOM updates if bom_items are provided
    if (bom_items !== undefined) {
      // Get existing BOM
      const { data: existingBom } = await supabase
        .from('bom')
        .select('id')
        .eq('product_id', id)
        .eq('is_active', true)
        .single();

      if (bom_items && bom_items.length > 0) {
        let bomId = existingBom?.id;

        // Create new BOM if none exists
        if (!bomId) {
          const { data: newBom, error: bomError } = await supabase
            .from('bom')
            .insert([{
              product_id: id,
              version: '1.0',
              is_active: true,
              created_by: null, // TODO: Get from auth context
              updated_by: null
            }])
            .select()
            .single();

          if (bomError) {
            console.error('Error creating BOM:', bomError);
            throw new Error('Failed to create BOM');
          }

          bomId = newBom.id;
        }

        // Delete existing BOM items
        const { error: deleteError } = await supabase
          .from('bom_items')
          .delete()
          .eq('bom_id', bomId);

        if (deleteError) {
          console.error('Error deleting BOM items:', deleteError);
          throw new Error('Failed to delete existing BOM items');
        }

        // Create new BOM items
        const bomItems = bom_items.map((item, index) => ({
          bom_id: bomId,
          material_id: item.material_id,
          quantity: item.quantity,
          uom: item.uom,
          sequence: item.sequence || index + 1,
          priority: item.priority,
          production_lines: item.production_lines || [],
          scrap_std_pct: item.scrap_std_pct || 0,
          is_optional: item.is_optional || false,
          is_phantom: item.is_phantom || false,
          one_to_one: item.one_to_one || false,
          unit_cost_std: item.unit_cost_std
        }));

        const { error: bomItemsError } = await supabase
          .from('bom_items')
          .insert(bomItems);

        if (bomItemsError) {
          console.error('Error creating BOM items:', bomItemsError);
          throw new Error('Failed to create BOM items');
        }
      } else if (existingBom) {
        // Delete BOM and items if bom_items is empty
        const { error: deleteError } = await supabase
          .from('bom_items')
          .delete()
          .eq('bom_id', existingBom.id);

        if (deleteError) {
          console.error('Error deleting BOM items:', deleteError);
          throw new Error('Failed to delete BOM items');
        }

        const { error: bomDeleteError } = await supabase
          .from('bom')
          .delete()
          .eq('id', existingBom.id);

        if (bomDeleteError) {
          console.error('Error deleting BOM:', bomDeleteError);
          throw new Error('Failed to delete BOM');
        }
      }
    }

    return product;
  }

  static async delete(id: number): Promise<void> {

    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  }

  static async getByCategory(category: string): Promise<Product[]> {

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        allergens:product_allergens(
          allergen_id,
          allergens(id, code, name)
        )
      `)
      .eq('category', category)
      .eq('is_active', true)
      .order('part_number');

    if (error) {
      console.error('Error fetching products by category:', error);
      throw new Error('Failed to fetch products by category');
    }

    return data || [];
  }
}
