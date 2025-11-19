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
    // Required fields - map from UI inputs
    sku: product.part_number,  // part_number becomes sku (required)
    name: product.description, // description becomes name (required)
    // Optional fields
    type: product.type,
    part_number: product.part_number,
    description: product.description,
    uom: product.uom,
    product_group: product.product_group,
    product_type: product.product_type,
    supplier_id: product.supplier_id ?? null,
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

  // Get user's org_id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.org_id) {
    console.error('Error getting user org_id:', userError);
    throw new Error('Failed to get user organization');
  }

  // Check if part_number already exists
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('part_number', product.part_number)
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error(`Part number "${product.part_number}" already exists. Please use a unique part number.`);
  }

  const insert = pickInsertColumns(product);

  const { data, error } = await supabase
    .from('products')
    .insert([{ ...insert, org_id: userData.org_id }])
    .select()
    .single();

  if (error) {
    if ((error as any).code === '23505') {
      throw new Error(`Part number "${product.part_number}" already exists. Please use a unique part number.`);
    }
    throw new Error('Failed to create product');
  }

  return data;
}


