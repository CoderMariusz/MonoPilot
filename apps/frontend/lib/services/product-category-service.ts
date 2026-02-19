/**
 * Product Category Service (Story 02.16)
 * Handles hierarchical product categories (max 3 levels)
 *
 * Business Rules:
 * - Maximum 3 levels deep
 * - Cannot delete category with children or products
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ProductCategoryCreateInput,
  ProductCategoryUpdateInput,
  ProductCategoryNode,
} from '@/lib/validation/product-advanced'

export interface ProductCategory {
  id: string
  org_id: string
  name: string
  description: string | null
  parent_id: string | null
  level: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * List all categories for an organization
 */
export async function list(
  supabase: SupabaseClient,
  orgId: string
): Promise<ProductCategory[]> {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  return (data || []) as ProductCategory[]
}

/**
 * Get hierarchical tree structure of categories
 */
export async function getTree(
  supabase: SupabaseClient,
  orgId: string
): Promise<ProductCategoryNode[]> {
  const categories = await list(supabase, orgId)
  return buildCategoryTree(categories)
}

/**
 * Build tree structure from flat category list
 */
function buildCategoryTree(categories: ProductCategory[]): ProductCategoryNode[] {
  const nodeMap = new Map<string, ProductCategoryNode>()
  const roots: ProductCategoryNode[] = []

  // First pass: create all nodes
  categories.forEach((cat) => {
    nodeMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      description: cat.description,
      parent_id: cat.parent_id,
      level: cat.level,
      sort_order: cat.sort_order,
      is_active: cat.is_active,
      children: [],
    })
  })

  // Second pass: build tree
  categories.forEach((cat) => {
    const node = nodeMap.get(cat.id)!
    if (cat.parent_id && nodeMap.has(cat.parent_id)) {
      const parent = nodeMap.get(cat.parent_id)!
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  // Sort children by sort_order
  const sortChildren = (nodes: ProductCategoryNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    nodes.forEach((node) => sortChildren(node.children))
  }
  sortChildren(roots)

  return roots
}

/**
 * Get a single category by ID
 */
export async function getById(
  supabase: SupabaseClient,
  orgId: string,
  id: string
): Promise<ProductCategory | null> {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch category: ${error.message}`)
  }

  return data as ProductCategory
}

/**
 * Create a new category
 */
export async function create(
  supabase: SupabaseClient,
  orgId: string,
  input: ProductCategoryCreateInput
): Promise<ProductCategory> {
  // Validate parent exists and check level
  if (input.parent_id) {
    const parent = await getById(supabase, orgId, input.parent_id)
    if (!parent) {
      throw new Error('Parent category not found')
    }
    if (parent.level >= 3) {
      throw new Error('Category hierarchy cannot exceed 3 levels')
    }
  }

  const { data, error } = await supabase
    .from('product_categories')
    .insert({
      org_id: orgId,
      name: input.name,
      description: input.description,
      parent_id: input.parent_id,
      sort_order: input.sort_order,
      is_active: input.is_active,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`)
  }

  return data as ProductCategory
}

/**
 * Update a category
 */
export async function update(
  supabase: SupabaseClient,
  orgId: string,
  id: string,
  input: ProductCategoryUpdateInput
): Promise<ProductCategory> {
  const { data, error } = await supabase
    .from('product_categories')
    .update({
      name: input.name,
      description: input.description,
      sort_order: input.sort_order,
      is_active: input.is_active,
    })
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Category not found')
    }
    throw new Error(`Failed to update category: ${error.message}`)
  }

  return data as ProductCategory
}

/**
 * Delete a category
 * Cannot delete if has children or associated products
 */
export async function deleteCategory(
  supabase: SupabaseClient,
  orgId: string,
  id: string
): Promise<void> {
  // Check for children
  const { data: children, error: childrenError } = await supabase
    .from('product_categories')
    .select('id')
    .eq('parent_id', id)
    .eq('org_id', orgId)
    .limit(1)

  if (childrenError) {
    throw new Error(`Failed to check children: ${childrenError.message}`)
  }

  if (children && children.length > 0) {
    throw new Error('Cannot delete category: has child categories')
  }

  // Check for associated products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', id)
    .is('deleted_at', null)
    .limit(1)

  if (productsError) {
    throw new Error(`Failed to check products: ${productsError.message}`)
  }

  if (products && products.length > 0) {
    throw new Error('Cannot delete category: has associated products')
  }

  // Delete the category
  const { error } = await supabase
    .from('product_categories')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId)

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`)
  }
}

/**
 * Get category path (breadcrumb)
 */
export async function getPath(
  supabase: SupabaseClient,
  orgId: string,
  id: string
): Promise<ProductCategory[]> {
  const path: ProductCategory[] = []
  let currentId: string | null = id

  while (currentId) {
    const category = await getById(supabase, orgId, currentId)
    if (!category) break
    
    path.unshift(category)
    currentId = category.parent_id
  }

  return path
}

/**
 * Move category to new parent
 */
export async function move(
  supabase: SupabaseClient,
  orgId: string,
  id: string,
  newParentId: string | null
): Promise<ProductCategory> {
  // Validate new parent exists and check level
  if (newParentId) {
    const parent = await getById(supabase, orgId, newParentId)
    if (!parent) {
      throw new Error('Parent category not found')
    }
    if (parent.level >= 3) {
      throw new Error('Category hierarchy cannot exceed 3 levels')
    }
    
    // Prevent circular reference
    const path = await getPath(supabase, orgId, newParentId)
    if (path.some((cat) => cat.id === id)) {
      throw new Error('Cannot move category to its own descendant')
    }
  }

  const { data, error } = await supabase
    .from('product_categories')
    .update({ parent_id: newParentId })
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to move category: ${error.message}`)
  }

  return data as ProductCategory
}

// Export service as class with static methods for compatibility
export const ProductCategoryService = {
  list: (supabase: SupabaseClient, orgId: string) => list(supabase, orgId),
  getTree: (supabase: SupabaseClient, orgId: string) => getTree(supabase, orgId),
  getById: (supabase: SupabaseClient, orgId: string, id: string) => getById(supabase, orgId, id),
  create: (supabase: SupabaseClient, orgId: string, input: ProductCategoryCreateInput) =>
    create(supabase, orgId, input),
  update: (supabase: SupabaseClient, orgId: string, id: string, input: ProductCategoryUpdateInput) =>
    update(supabase, orgId, id, input),
  delete: (supabase: SupabaseClient, orgId: string, id: string) => deleteCategory(supabase, orgId, id),
  getPath: (supabase: SupabaseClient, orgId: string, id: string) => getPath(supabase, orgId, id),
  move: (supabase: SupabaseClient, orgId: string, id: string, newParentId: string | null) =>
    move(supabase, orgId, id, newParentId),
}