/**
 * Product Type Service (Story 02.1)
 * Handles read operations for product types (RM, WIP, FG, PKG, BP)
 *
 * Architecture: Service layer accepts Supabase client as parameter to support
 * both server-side (API routes) and client-side usage.
 *
 * Security: Product types are per-org (RLS enforced). Default types seeded on org creation.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProductType, ProductTypeSelectOption } from '@/lib/types/product'

/**
 * List all active product types for the organization
 */
export async function list(supabase: SupabaseClient): Promise<ProductType[]> {
  const { data, error } = await supabase
    .from('product_types')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch product types: ${error.message}`)
  }

  return (data || []) as ProductType[]
}

/**
 * Get single product type by ID
 */
export async function getById(
  supabase: SupabaseClient,
  id: string
): Promise<ProductType | null> {
  const { data, error } = await supabase
    .from('product_types')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    // Handle not found
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch product type: ${error.message}`)
  }

  return data as ProductType
}

/**
 * Get product type by code (RM, WIP, FG, PKG, BP)
 */
export async function getByCode(
  supabase: SupabaseClient,
  code: string
): Promise<ProductType | null> {
  const { data, error } = await supabase
    .from('product_types')
    .select('*')
    .eq('code', code)
    .single()

  if (error) {
    // Handle not found
    if (error.code === 'PGRST116') {
      return null
    }
    // Return null for other errors (don't throw)
    return null
  }

  return data as ProductType
}

/**
 * Get product types formatted for select dropdown options
 */
export async function getSelectOptions(
  supabase: SupabaseClient
): Promise<ProductTypeSelectOption[]> {
  const types = await list(supabase)

  return types.map((type) => ({
    value: type.id,
    label: type.name,
    code: type.code,
    color: type.color,
  }))
}

// Export service as default object for easier testing
export const ProductTypeService = {
  list,
  getById,
  getByCode,
  getSelectOptions,
}
