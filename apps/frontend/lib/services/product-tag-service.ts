/**
 * Product Tag Service (Story 02.16)
 * Handles product tags and assignments (many-to-many)
 *
 * Business Rules:
 * - Max 50 chars for tag name
 * - Cannot delete tag assigned to products
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ProductTagCreateInput,
  ProductTagUpdateInput,
  ProductTagWithCount,
} from '@/lib/validation/product-advanced'

export interface ProductTag {
  id: string
  org_id: string
  name: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductTagAssignment {
  id: string
  org_id: string
  product_id: string
  tag_id: string
  created_at: string
}

/**
 * List all tags for an organization with usage counts
 */
export async function list(
  supabase: SupabaseClient,
  orgId: string
): Promise<ProductTagWithCount[]> {
  const { data, error } = await supabase
    .from('product_tags')
    .select(`
      *,
      product_count:product_tag_assignments(count)
    `)
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch tags: ${error.message}`)
  }

  return (data || []).map((tag: any) => ({
    ...tag,
    product_count: tag.product_count?.[0]?.count || 0,
  })) as ProductTagWithCount[]
}

/**
 * Get a single tag by ID
 */
export async function getById(
  supabase: SupabaseClient,
  orgId: string,
  id: string
): Promise<ProductTag | null> {
  const { data, error } = await supabase
    .from('product_tags')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch tag: ${error.message}`)
  }

  return data as ProductTag
}

/**
 * Create a new tag
 */
export async function create(
  supabase: SupabaseClient,
  orgId: string,
  name: string,
  color?: string
): Promise<ProductTag> {
  const { data, error } = await supabase
    .from('product_tags')
    .insert({
      org_id: orgId,
      name: name.substring(0, 50), // Enforce max 50 chars
      color: color || '#6B7280',
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create tag: ${error.message}`)
  }

  return data as ProductTag
}

/**
 * Update a tag
 */
export async function update(
  supabase: SupabaseClient,
  orgId: string,
  id: string,
  input: ProductTagUpdateInput
): Promise<ProductTag> {
  const updateData: Partial<ProductTag> = {}
  
  if (input.name !== undefined) {
    updateData.name = input.name.substring(0, 50)
  }
  if (input.color !== undefined) {
    updateData.color = input.color
  }
  if (input.is_active !== undefined) {
    updateData.is_active = input.is_active
  }

  const { data, error } = await supabase
    .from('product_tags')
    .update(updateData)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Tag not found')
    }
    throw new Error(`Failed to update tag: ${error.message}`)
  }

  return data as ProductTag
}

/**
 * Delete a tag
 * Cannot delete if assigned to products
 */
export async function deleteTag(
  supabase: SupabaseClient,
  orgId: string,
  id: string
): Promise<void> {
  // Check for assignments
  const { data: assignments, error: checkError } = await supabase
    .from('product_tag_assignments')
    .select('id')
    .eq('tag_id', id)
    .eq('org_id', orgId)
    .limit(1)

  if (checkError) {
    throw new Error(`Failed to check assignments: ${checkError.message}`)
  }

  if (assignments && assignments.length > 0) {
    throw new Error('Cannot delete tag: assigned to products')
  }

  // Delete the tag
  const { error } = await supabase
    .from('product_tags')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId)

  if (error) {
    throw new Error(`Failed to delete tag: ${error.message}`)
  }
}

/**
 * Assign tags to a product (replaces existing assignments)
 */
export async function assignToProduct(
  supabase: SupabaseClient,
  orgId: string,
  productId: string,
  tagIds: string[]
): Promise<void> {
  // Validate all tags exist and belong to org
  if (tagIds.length > 0) {
    const { data: validTags, error: validateError } = await supabase
      .from('product_tags')
      .select('id')
      .eq('org_id', orgId)
      .in('id', tagIds)

    if (validateError) {
      throw new Error(`Failed to validate tags: ${validateError.message}`)
    }

    const validTagIds = new Set(validTags?.map((t) => t.id) || [])
    const invalidTags = tagIds.filter((id) => !validTagIds.has(id))
    
    if (invalidTags.length > 0) {
      throw new Error(`Invalid tags: ${invalidTags.join(', ')}`)
    }
  }

  // Delete existing assignments
  const { error: deleteError } = await supabase
    .from('product_tag_assignments')
    .delete()
    .eq('product_id', productId)
    .eq('org_id', orgId)

  if (deleteError) {
    throw new Error(`Failed to clear existing assignments: ${deleteError.message}`)
  }

  // Insert new assignments
  if (tagIds.length > 0) {
    const assignments = tagIds.map((tagId) => ({
      org_id: orgId,
      product_id: productId,
      tag_id: tagId,
    }))

    const { error: insertError } = await supabase
      .from('product_tag_assignments')
      .insert(assignments)

    if (insertError) {
      throw new Error(`Failed to assign tags: ${insertError.message}`)
    }
  }
}

/**
 * Get tags assigned to a product
 */
export async function getByProductId(
  supabase: SupabaseClient,
  orgId: string,
  productId: string
): Promise<ProductTag[]> {
  const { data, error } = await supabase
    .from('product_tag_assignments')
    .select(`
      tag:tag_id(*)
    `)
    .eq('product_id', productId)
    .eq('org_id', orgId)

  if (error) {
    throw new Error(`Failed to fetch product tags: ${error.message}`)
  }

  return (data || []).map((row: any) => row.tag) as ProductTag[]
}

/**
 * Add a single tag to a product
 */
export async function addToProduct(
  supabase: SupabaseClient,
  orgId: string,
  productId: string,
  tagId: string
): Promise<void> {
  const { error } = await supabase
    .from('product_tag_assignments')
    .insert({
      org_id: orgId,
      product_id: productId,
      tag_id: tagId,
    })

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation - tag already assigned
      return
    }
    throw new Error(`Failed to add tag to product: ${error.message}`)
  }
}

/**
 * Remove a single tag from a product
 */
