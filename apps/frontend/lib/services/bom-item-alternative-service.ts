/**
 * BOM Item Alternative Service - Story 2.27
 * Handles BOM item alternative components CRUD
 */

import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import {
  BOMItemAlternative,
  CreateBOMItemAlternativeInput,
  UpdateBOMItemAlternativeInput
} from '@/lib/validation/bom-schemas'

// Helper to get current user's org_id
async function getCurrentUserOrgId(): Promise<{ userId: string; orgId: string } | null> {
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) return null

  const { data: user } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', session.user.id)
    .single()

  if (!user?.org_id) return null
  return { userId: session.user.id, orgId: user.org_id }
}

/**
 * List alternatives for a BOM item
 * AC-2.27.3
 */
export async function listBomItemAlternatives(
  bomId: string,
  itemId: string
): Promise<BOMItemAlternative[]> {
  const supabase = await createServerSupabase()

  // Verify BOM item exists and belongs to BOM
  const { data: item, error: itemError } = await supabase
    .from('bom_items')
    .select('id, bom_id')
    .eq('id', itemId)
    .eq('bom_id', bomId)
    .single()

  if (itemError || !item) {
    throw new Error('ITEM_NOT_FOUND')
  }

  // Get alternatives with component join
  const { data, error } = await supabase
    .from('bom_item_alternatives')
    .select(`
      *,
      alternative_component:products!alternative_component_id (
        id,
        code,
        name,
        uom,
        type
      )
    `)
    .eq('bom_item_id', itemId)
    .order('priority', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch alternatives: ${error.message}`)
  }

  return (data || []) as BOMItemAlternative[]
}

/**
 * Create a new alternative for a BOM item
 * AC-2.27.4
 */
export async function createBomItemAlternative(
  bomId: string,
  itemId: string,
  input: CreateBOMItemAlternativeInput
): Promise<BOMItemAlternative> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Verify BOM exists and belongs to user's org
  const { data: bom, error: bomError } = await supabaseAdmin
    .from('boms')
    .select('id, org_id, product_id')
    .eq('id', bomId)
    .single()

  if (bomError || !bom) {
    throw new Error('BOM_NOT_FOUND')
  }

  if (bom.org_id !== userInfo.orgId) {
    throw new Error('BOM_NOT_FOUND')
  }

  // Verify BOM item exists
  const { data: item, error: itemError } = await supabaseAdmin
    .from('bom_items')
    .select('id, component_id')
    .eq('id', itemId)
    .eq('bom_id', bomId)
    .single()

  if (itemError || !item) {
    throw new Error('ITEM_NOT_FOUND')
  }

  // Validate alternative component exists and belongs to org
  const { data: altComponent, error: compError } = await supabaseAdmin
    .from('products')
    .select('id, org_id')
    .eq('id', input.alternative_component_id)
    .single()

  if (compError || !altComponent) {
    throw new Error('INVALID_ALTERNATIVE_COMPONENT')
  }

  if (altComponent.org_id !== userInfo.orgId) {
    throw new Error('INVALID_ALTERNATIVE_COMPONENT')
  }

  // Check self-reference: alternative cannot be same as primary component
  if (input.alternative_component_id === item.component_id) {
    throw new Error('SELF_REFERENCE')
  }

  // Insert alternative
  const { data: newAlt, error: insertError } = await supabaseAdmin
    .from('bom_item_alternatives')
    .insert({
      bom_item_id: itemId,
      alternative_component_id: input.alternative_component_id,
      priority: input.priority ?? 1,
      quantity_ratio: input.quantity_ratio ?? 1.0,
      notes: input.notes || null,
    })
    .select(`
      *,
      alternative_component:products!alternative_component_id (
        id,
        code,
        name,
        uom,
        type
      )
    `)
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('DUPLICATE_ALTERNATIVE')
    }
    throw new Error(`Failed to create alternative: ${insertError.message}`)
  }

  return newAlt as BOMItemAlternative
}

/**
 * Update a BOM item alternative
 * AC-2.27.5
 */
export async function updateBomItemAlternative(
  bomId: string,
  itemId: string,
  alternativeId: string,
  input: UpdateBOMItemAlternativeInput
): Promise<BOMItemAlternative> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Verify BOM exists and belongs to user's org
  const { data: bom } = await supabaseAdmin
    .from('boms')
    .select('id, org_id')
    .eq('id', bomId)
    .single()

  if (!bom || bom.org_id !== userInfo.orgId) {
    throw new Error('BOM_NOT_FOUND')
  }

  // Verify BOM item exists
  const { data: item } = await supabaseAdmin
    .from('bom_items')
    .select('id')
    .eq('id', itemId)
    .eq('bom_id', bomId)
    .single()

  if (!item) {
    throw new Error('ITEM_NOT_FOUND')
  }

  // Verify alternative exists
  const { data: existingAlt } = await supabaseAdmin
    .from('bom_item_alternatives')
    .select('id')
    .eq('id', alternativeId)
    .eq('bom_item_id', itemId)
    .single()

  if (!existingAlt) {
    throw new Error('ALTERNATIVE_NOT_FOUND')
  }

  // Build update object
  const updateData: Record<string, unknown> = {}
  if (input.priority !== undefined) updateData.priority = input.priority
  if (input.quantity_ratio !== undefined) updateData.quantity_ratio = input.quantity_ratio
  if (input.notes !== undefined) updateData.notes = input.notes

  // Update
  const { data: updatedAlt, error: updateError } = await supabaseAdmin
    .from('bom_item_alternatives')
    .update(updateData)
    .eq('id', alternativeId)
    .select(`
      *,
      alternative_component:products!alternative_component_id (
        id,
        code,
        name,
        uom,
        type
      )
    `)
    .single()

  if (updateError) {
    throw new Error(`Failed to update alternative: ${updateError.message}`)
  }

  return updatedAlt as BOMItemAlternative
}

/**
 * Delete a BOM item alternative
 * AC-2.27.6
 */
export async function deleteBomItemAlternative(
  bomId: string,
  itemId: string,
  alternativeId: string
): Promise<void> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Verify BOM exists and belongs to user's org
  const { data: bom } = await supabaseAdmin
    .from('boms')
    .select('id, org_id')
    .eq('id', bomId)
    .single()

  if (!bom || bom.org_id !== userInfo.orgId) {
    throw new Error('BOM_NOT_FOUND')
  }

  // Verify BOM item exists
  const { data: item } = await supabaseAdmin
    .from('bom_items')
    .select('id')
    .eq('id', itemId)
    .eq('bom_id', bomId)
    .single()

  if (!item) {
    throw new Error('ITEM_NOT_FOUND')
  }

  // Delete alternative
  const { error } = await supabaseAdmin
    .from('bom_item_alternatives')
    .delete()
    .eq('id', alternativeId)
    .eq('bom_item_id', itemId)

  if (error) {
    throw new Error(`Failed to delete alternative: ${error.message}`)
  }
}

/**
 * Get all alternatives for a BOM (all items)
 * AC-2.27.7: For production planning view
 */
export async function getAllAlternativesForBom(
  bomId: string
): Promise<Array<BOMItemAlternative & { primary_component: { id: string; code: string; name: string } }>> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from('bom_item_alternatives')
    .select(`
      *,
      alternative_component:products!alternative_component_id (
        id,
        code,
        name,
        uom,
        type
      ),
      bom_item:bom_items!bom_item_id (
        id,
        component:products!product_id (
          id,
          code,
          name
        )
      )
    `)
    .eq('bom_item.bom_id', bomId)
    .order('priority', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch BOM alternatives: ${error.message}`)
  }

  // Reshape data to include primary_component at top level
  
  return (data || []).map((alt: any) => ({
    ...alt,
    primary_component: alt.bom_item?.component || null
  })) as Array<BOMItemAlternative & { primary_component: { id: string; code: string; name: string } }>
}
