import { supabase } from '@/lib/supabase/client-browser';
import type { CreateCompositePayload } from '@/lib/types';

export async function createComposite(payload: CreateCompositePayload) {
  const { product, items } = payload;

  if (product.product_group !== 'COMPOSITE') {
    throw new Error('Composite products must have product_group=COMPOSITE');
  }
  if (!(product.type === 'PR' || product.type === 'FG')) {
    throw new Error('Composite product type must be PR or FG');
  }
  if (!items || items.length === 0) {
    throw new Error('At least one BOM item is required');
  }

  const { data, error } = await supabase.rpc('create_composite_product', { p: payload as any });

  if (error) {
    if ((error as any).code === '23505') {
      throw new Error('Part number already exists');
    }
    throw new Error('Failed to create composite product');
  }

  return data as { product_id: number; bom_id: number };
}


