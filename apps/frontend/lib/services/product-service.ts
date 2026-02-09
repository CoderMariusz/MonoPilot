/**
 * Product Service (Story 02.1)
 * Handles CRUD operations for products with validation and SKU uniqueness checks
 *
 * Architecture: Service layer accepts Supabase client as parameter to support
 * both server-side (API routes) and client-side usage.
 *
 * Security: All queries enforce org_id isolation (ADR-013). Soft delete only.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductListParams,
  PaginatedProductsResult,
} from '@/lib/types/product'

/**
 * List products with filters, pagination, and sorting
 */
export async function list(
  supabase: SupabaseClient,
  params: ProductListParams
): Promise<PaginatedProductsResult> {
  const {
    page = 1,
    limit = 20,
    search,
    type,
    status,
    sort = 'code',
    order = 'asc',
  } = params

  // Build query
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .is('deleted_at', null) // Exclude soft-deleted products

  // Apply filters
  if (search) {
    query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
  }

  if (type) {
    // Type filter requires joining with product_types table
    const { data: productType } = await supabase
      .from('product_types')
      .select('id')
      .eq('code', type)
      .single()

    if (productType) {
      query = query.eq('product_type_id', productType.id)
    }
  }

  if (status) {
    query = query.eq('status', status)
  }

  // Apply sorting
  query = query.order(sort, { ascending: order === 'asc' })

  // Apply pagination
  const start = (page - 1) * limit
  const end = start + limit - 1
  query = query.range(start, end)

  // Execute query
  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  return {
    data: (data || []) as Product[],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

/**
 * Get single product by ID
 */
export async function getById(
  supabase: SupabaseClient,
  id: string
): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    // Handle not found
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch product: ${error.message}`)
  }

  return data as Product
}

/**
 * Create new product with SKU and barcode uniqueness check
 */
export async function create(
  supabase: SupabaseClient,
  input: CreateProductInput
): Promise<Product> {
  // Check SKU uniqueness
  const skuExists = await checkSkuExists(supabase, input.code)
  if (skuExists) {
    throw new Error(`SKU "${input.code}" already exists`)
  }

  // Check barcode uniqueness (if barcode is provided)
  if (input.barcode) {
    const barcodeExists = await checkBarcodeExists(supabase, input.barcode)
    if (barcodeExists) {
      throw new Error(`Barcode "${input.barcode}" already exists`)
    }
  }

  // Insert product with version 1 and default status
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...input,
      version: 1,
      status: input.status || 'active',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`)
  }

  return data as Product
}

/**
 * Update product (excludes immutable fields: code, product_type_id)
 */
export async function update(
  supabase: SupabaseClient,
  id: string,
  input: UpdateProductInput
): Promise<Product> {
  // Strip immutable fields (code, product_type_id) if present
  const { ...updateData } = input
  const cleanedData = { ...updateData } as any

  // Remove immutable fields if accidentally passed
  delete cleanedData.code
  delete cleanedData.product_type_id

  // Update product
  const { data, error } = await supabase
    .from('products')
    .update(cleanedData)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Product not found')
    }
    throw new Error(`Failed to update product: ${error.message}`)
  }

  return data as Product
}

/**
 * Soft delete product
 */
export async function deleteProduct(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { data, error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Product not found')
    }
    // Check for foreign key violations (product referenced by BOMs, etc.)
    if (error.code === '23503') {
      throw new Error(
        'Cannot delete product: it is referenced by other records (BOMs, work orders, inventory)'
      )
    }
    throw new Error(`Failed to delete product: ${error.message}`)
  }
}

/**
 * Check if SKU (code) already exists in organization (excluding soft-deleted)
 */
export async function checkSkuExists(
  supabase: SupabaseClient,
  code: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('products')
    .select('id, code')
    .eq('code', code)
    .is('deleted_at', null)
    .single()

  // If not found (PGRST116), SKU doesn't exist
  if (error && error.code === 'PGRST116') {
    return false
  }

  // For other errors, don't throw on check, return false
  if (error) {
    return false
  }

  return data !== null
}

/**
 * Check if barcode already exists in organization (excluding soft-deleted)
 * BUG-W-002: Enforce duplicate barcode prevention
 */
export async function checkBarcodeExists(
  supabase: SupabaseClient,
  barcode: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('products')
    .select('id, barcode')
    .eq('barcode', barcode)
    .is('deleted_at', null)
    .single()

  // If not found (PGRST116), barcode doesn't exist
  if (error && error.code === 'PGRST116') {
    return false
  }

  // For other errors, don't throw on check, return false
  if (error) {
    return false
  }

  return data !== null
}

// Export service as default object for easier testing
export const ProductService = {
  list,
  getById,
  create,
  update,
  delete: deleteProduct,
  checkSkuExists,
  checkBarcodeExists,
}
