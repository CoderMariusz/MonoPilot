/**
 * Product Clone Service (Story 02.16)
 * Handles product cloning with optional allergen, category, tag, and image copying
 *
 * Business Rules:
 * - Cloned products always have version=1
 * - SKU uniqueness is enforced
 * - -COPY suffix suggested for clone code
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Product } from '@/lib/types/product'
import type { ProductCloneOptions } from '@/lib/validation/product-advanced'

export interface CloneResult {
  id: string
  code: string
  name: string
  version: number
  product_type_id: string
  base_uom: string
  status: string
  created_at: string
}

export interface ValidateCloneCodeResult {
  valid: boolean
  error?: string
}

/**
 * Clone a product with specified options
 */
export async function clone(
  supabase: SupabaseClient,
  orgId: string,
  productId: string,
  options: ProductCloneOptions
): Promise<CloneResult> {
  // Fetch source product
  const { data: sourceProduct, error: sourceError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .is('deleted_at', null)
    .single()

  if (sourceError || !sourceProduct) {
    throw new Error('Source product not found')
  }

  // Validate SKU uniqueness
  const codeValidation = await validateCloneCode(supabase, orgId, options.code)
  if (!codeValidation.valid) {
    throw new Error(codeValidation.error || 'SKU already exists')
  }

  // Prepare new product data (always version=1)
  const newProductData = {
    org_id: orgId,
    code: options.code,
    name: options.name,
    description: sourceProduct.description,
    product_type_id: sourceProduct.product_type_id,
    base_uom: sourceProduct.base_uom,
    status: 'active',
    version: 1,
    barcode: null, // Don't copy barcode (must be unique)
    gtin: null, // Don't copy GTIN (must be unique)
    category_id: options.includeCategoriesTags ? sourceProduct.category_id : null,
    supplier_id: sourceProduct.supplier_id,
    lead_time_days: sourceProduct.lead_time_days,
    moq: sourceProduct.moq,
    std_price: sourceProduct.std_price,
    cost_per_unit: sourceProduct.cost_per_unit,
    min_stock: sourceProduct.min_stock,
    max_stock: sourceProduct.max_stock,
    expiry_policy: sourceProduct.expiry_policy,
    shelf_life_days: sourceProduct.shelf_life_days,
    storage_conditions: sourceProduct.storage_conditions,
    is_perishable: sourceProduct.is_perishable,
  }

  // Insert new product
  const { data: newProduct, error: insertError } = await supabase
    .from('products')
    .insert(newProductData)
    .select()
    .single()

  if (insertError) {
    throw new Error(`Failed to clone product: ${insertError.message}`)
  }

  // Copy allergens if requested
  if (options.includeAllergens) {
    await copyAllergens(supabase, productId, newProduct.id)
  }

  // Copy categories and tags if requested
  if (options.includeCategoriesTags) {
    await copyTags(supabase, orgId, productId, newProduct.id)
  }

  // Copy image if requested
  if (options.includeImage) {
    await copyImage(supabase, orgId, productId, newProduct.id)
  }

  return {
    id: newProduct.id,
    code: newProduct.code,
    name: newProduct.name,
    version: newProduct.version,
    product_type_id: newProduct.product_type_id,
    base_uom: newProduct.base_uom,
    status: newProduct.status,
    created_at: newProduct.created_at,
  }
}

/**
 * Generate suggested clone code with -COPY suffix
 */
export function generateSuggestedCode(originalCode: string): string {
  const suffix = '-COPY'
  const maxLength = 50
  
  // If original code + suffix exceeds max length, truncate original
  if (originalCode.length + suffix.length > maxLength) {
    const availableLength = maxLength - suffix.length
    return originalCode.substring(0, availableLength) + suffix
  }
  
  return originalCode + suffix
}

/**
 * Validate that a clone code (SKU) is unique
 */
export async function validateCloneCode(
  supabase: SupabaseClient,
  orgId: string,
  code: string
): Promise<ValidateCloneCodeResult> {
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .eq('code', code)
    .is('deleted_at', null)
    .single()

  // PGRST116 = not found, which means code is available
  if (error && error.code === 'PGRST116') {
    return { valid: true }
  }

  // If we got data, the code already exists
  if (data) {
    return { valid: false, error: 'SKU already exists' }
  }

  // For other errors, assume valid (defensive)
  return { valid: true }
}

/**
 * Copy allergens from source product to cloned product
 */
async function copyAllergens(
  supabase: SupabaseClient,
  sourceProductId: string,
  targetProductId: string
): Promise<void> {
  const { data: allergens, error } = await supabase
    .from('product_allergens')
    .select('allergen_id, level')
    .eq('product_id', sourceProductId)

  if (error || !allergens || allergens.length === 0) {
    return
  }

  const newAllergens = allergens.map((a) => ({
    product_id: targetProductId,
    allergen_id: a.allergen_id,
    level: a.level,
  }))

  await supabase.from('product_allergens').insert(newAllergens)
}

/**
 * Copy tags from source product to cloned product
 */
async function copyTags(
  supabase: SupabaseClient,
  orgId: string,
  sourceProductId: string,
  targetProductId: string
): Promise<void> {
  const { data: assignments, error } = await supabase
    .from('product_tag_assignments')
    .select('tag_id')
    .eq('product_id', sourceProductId)

  if (error || !assignments || assignments.length === 0) {
    return
  }

  const newAssignments = assignments.map((a) => ({
    org_id: orgId,
    product_id: targetProductId,
    tag_id: a.tag_id,
  }))

  await supabase.from('product_tag_assignments').insert(newAssignments)
}

/**
 * Copy image from source product to cloned product
 */
async function copyImage(
  supabase: SupabaseClient,
  orgId: string,
  sourceProductId: string,
  targetProductId: string
): Promise<void> {
  const { data: images, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', sourceProductId)
    .eq('is_primary', true)
    .limit(1)

  if (error || !images || images.length === 0) {
    return
  }

  const sourceImage = images[0]

  // Copy file in storage
  const sourcePath = sourceImage.storage_path
  const targetPath = `products/${targetProductId}/${sourceImage.filename}`

  const { error: copyError } = await supabase.storage
    .from('product-images')
    .copy(sourcePath, targetPath)

  if (copyError) {
    console.warn('Failed to copy image:', copyError)
    return
  }

  // Create new image record
  await supabase.from('product_images').insert({
    org_id: orgId,
    product_id: targetProductId,
    storage_path: targetPath,
    thumbnail_path: sourceImage.thumbnail_path
      ? targetPath.replace(/\.(\w+)$/, '-thumb.$1')
      : null,
    filename: sourceImage.filename,
    mime_type: sourceImage.mime_type,
    file_size_bytes: sourceImage.file_size_bytes,
    width: sourceImage.width,
    height: sourceImage.height,
    is_primary: true,
  })
}

// Export service as class with static methods for compatibility
export const ProductCloneService = {
  clone: (supabase: SupabaseClient, orgId: string, productId: string, options: ProductCloneOptions) =>
    clone(supabase, orgId, productId, options),
  generateSuggestedCode,
  validateCloneCode: (supabase: SupabaseClient, orgId: string, code: string) =>
    validateCloneCode(supabase, orgId, code),
}