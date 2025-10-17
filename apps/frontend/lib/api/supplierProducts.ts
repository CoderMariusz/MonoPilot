import { supabase } from '@/lib/supabase/client';
import type { SupplierProduct } from '@/lib/types';
import { shouldUseMockData } from './config';

export class SupplierProductsAPI {
  static async getBySupplier(supplierId: number): Promise<SupplierProduct[]> {
    if (shouldUseMockData()) {
      // Mock data will be provided by clientState
      return [];
    }

    const { data, error } = await supabase
      .from('supplier_products')
      .select(`
        *,
        products!inner(id, part_number, description, uom),
        settings_tax_codes(id, code, name, rate)
      `)
      .eq('supplier_id', supplierId)
      .eq('is_active', true)
      .order('products.part_number');

    if (error) {
      console.error('Error fetching supplier products:', error);
      throw new Error('Failed to fetch supplier products');
    }

    return data || [];
  }

  static async getByProduct(productId: number): Promise<SupplierProduct[]> {
    if (shouldUseMockData()) {
      // Mock data will be provided by clientState
      return [];
    }

    const { data, error } = await supabase
      .from('supplier_products')
      .select(`
        *,
        suppliers!inner(id, name, legal_name),
        settings_tax_codes(id, code, name, rate)
      `)
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('suppliers.name');

    if (error) {
      console.error('Error fetching product suppliers:', error);
      throw new Error('Failed to fetch product suppliers');
    }

    return data || [];
  }

  static async create(data: Omit<SupplierProduct, 'id' | 'created_at' | 'updated_at'>): Promise<SupplierProduct> {
    if (shouldUseMockData()) {
      // Mock data will be provided by clientState
      throw new Error('Mock data not implemented');
    }

    const { data: result, error } = await supabase
      .from('supplier_products')
      .insert({
        supplier_id: data.supplier_id,
        product_id: data.product_id,
        supplier_sku: data.supplier_sku,
        lead_time_days: data.lead_time_days,
        moq: data.moq,
        price_excl_tax: data.price_excl_tax,
        tax_code_id: data.tax_code_id,
        currency: data.currency,
        is_active: data.is_active
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier product:', error);
      throw new Error('Failed to create supplier product');
    }

    return result;
  }

  static async update(id: number, data: Partial<Omit<SupplierProduct, 'id' | 'created_at' | 'updated_at'>>): Promise<SupplierProduct> {
    if (shouldUseMockData()) {
      // Mock data will be provided by clientState
      throw new Error('Mock data not implemented');
    }

    const { data: result, error } = await supabase
      .from('supplier_products')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier product:', error);
      throw new Error('Failed to update supplier product');
    }

    return result;
  }

  static async delete(id: number): Promise<void> {
    if (shouldUseMockData()) {
      // Mock data will be provided by clientState
      throw new Error('Mock data not implemented');
    }

    const { error } = await supabase
      .from('supplier_products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting supplier product:', error);
      throw new Error('Failed to delete supplier product');
    }
  }

  static async getPricingForProduct(productId: number, supplierId?: number): Promise<SupplierProduct | null> {
    if (shouldUseMockData()) {
      // Mock data will be provided by clientState
      return null;
    }

    let query = supabase
      .from('supplier_products')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true);

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching supplier product pricing:', error);
      throw new Error('Failed to fetch supplier product pricing');
    }

    return data || null;
  }
}
