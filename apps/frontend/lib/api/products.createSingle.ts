import { supabase } from '@/lib/supabase/client-browser';
import type { CreateSinglePayload, ProductInsert } from '@/lib/types';

function assertMapping(product: ProductInsert) {
  if (product.product_group === 'MEAT' && product.type !== 'RM') {
    throw new Error('Invalid type for MEAT: expected RM');
  }
  if (product.product_group === 'DRYGOODS' && product.type !== 'DG') {
    throw new Error('Invalid type for DRYGOODS: expected DG');
  }
}

function pickInsertColumns(product: ProductInsert) {
  return {
    type: product.type,
    part_number: product.part_number,
    description: product.description,
    uom: product.uom,
    product_group: product.product_group,
    product_type: product.product_type,
    preferred_supplier_id: product.preferred_supplier_id ?? null,
    tax_code_id: product.tax_code_id ?? null,
    lead_time_days: product.lead_time_days ?? null,
    moq: product.moq ?? null,
    expiry_policy: product.expiry_policy ?? null,
    shelf_life_days: product.shelf_life_days ?? null,
    std_price: product.std_price ?? null,
    production_lines: Array.isArray(product.production_lines) ? product.production_lines : [],
  } as const;
}

export async function createSingle({ product }: CreateSinglePayload) {
  assertMapping(product);
  const insert = pickInsertColumns(product);

  const { data, error } = await supabase
    .from('products')
    .insert([insert])
    .select()
    .single();

  if (error) {
    if ((error as any).code === '23505') {
      throw new Error('Part number already exists');
    }
    throw new Error('Failed to create product');
  }

  return data;
}


