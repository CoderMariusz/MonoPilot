import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'

/**
 * Shelf Life Service
 * Issue: P1-1 - Shelf life calculation logic
 * PRD Section 5.8: Default = min(ingredient shelf lives)
 *
 * Handles shelf life calculation for products based on BOM ingredients:
 * - Auto-calculation from minimum ingredient shelf life
 * - Manual override support
 * - RLS org_id isolation
 */

// Internal type for BOM item with component relation
interface BomItemWithComponent {
  id: string
  quantity: number
  component: {
    id: string
    code: string
    name: string
    shelf_life_days: number | null
    type: string
  } | null
}

export interface ShelfLifeCalculation {
  productId: string
  calculatedDays: number | null
  overrideDays: number | null
  finalDays: number
  calculationMethod: 'manual' | 'auto_min_ingredients'
  shortestIngredient: {
    productId: string
    productCode: string
    shelfLifeDays: number
  } | null
  storageConditions: string | null
  calculatedAt: Date
}

/**
 * Get current user's org_id from users table
 * Used for RLS enforcement and multi-tenancy
 */
async function getCurrentUserOrgId(): Promise<{ userId: string; orgId: string } | null> {
  const supabase = await createServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return null

  // Get org_id from users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (error || !userData?.org_id) {
    console.error('Failed to get org_id for user:', user.id, error)
    return null
  }

  return { userId: user.id, orgId: userData.org_id }
}

/**
 * Calculate product shelf life based on BOM ingredients
 * Formula from PRD Section 5.8: Default = min(ingredient shelf lives)
 */
export async function calculateProductShelfLife(
  productId: string,
  bomId?: string
): Promise<ShelfLifeCalculation> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized or no organization found for user')
  }

  const supabase = await createServerSupabase()
  const supabaseAdmin = createServerSupabaseAdmin()

  // 1. Check for existing override in product_shelf_life table
  const { data: existingShelfLife } = await supabase
    .from('product_shelf_life')
    .select('*')
    .eq('product_id', productId)
    .maybeSingle()

  if (existingShelfLife?.override_days) {
    return {
      productId,
      calculatedDays: existingShelfLife.calculated_days,
      overrideDays: existingShelfLife.override_days,
      finalDays: existingShelfLife.override_days,
      calculationMethod: 'manual',
      shortestIngredient: null,
      storageConditions: existingShelfLife.storage_conditions,
      calculatedAt: new Date(existingShelfLife.calculated_at)
    }
  }

  // 2. Get active BOM
  let activeBomId = bomId
  if (!activeBomId) {
    const { data: bom } = await supabase
      .from('boms')
      .select('id')
      .eq('product_id', productId)
      .eq('status', 'Active')
      .maybeSingle()

    if (!bom) {
      // No BOM - return product's own shelf_life_days
      const { data: product } = await supabase
        .from('products')
        .select('shelf_life_days')
        .eq('id', productId)
        .single()

      const productShelfLife = product?.shelf_life_days || 0

      return {
        productId,
        calculatedDays: productShelfLife,
        overrideDays: null,
        finalDays: productShelfLife,
        calculationMethod: 'manual',
        shortestIngredient: null,
        storageConditions: null,
        calculatedAt: new Date()
      }
    }

    activeBomId = bom.id
  }

  // 3. Get all ingredients with shelf life
  const { data: items, error: itemsError } = await supabase
    .from('bom_items')
    .select(`
      id,
      quantity,
      component:products!component_id (
        id,
        code,
        name,
        shelf_life_days,
        type
      )
    `)
    .eq('bom_id', activeBomId)

  if (itemsError) {
    console.error('Error fetching BOM items:', itemsError)
    throw new Error(`Failed to fetch BOM items: ${itemsError.message}`)
  }

  // Cast items to proper type (Supabase returns component as object, not array)
  const typedItems = (items || []) as unknown as BomItemWithComponent[]

  // 4. Find minimum shelf life (only from ingredients, not FG)
  const ingredients = typedItems.filter((item) =>
    item.component !== null &&
    item.component.type !== 'FG' &&
    item.component.shelf_life_days !== null
  )

  if (ingredients.length === 0) {
    // No ingredients with shelf life
    const { data: product } = await supabase
      .from('products')
      .select('shelf_life_days')
      .eq('id', productId)
      .single()

    const productShelfLife = product?.shelf_life_days || 0

    return {
      productId,
      calculatedDays: productShelfLife,
      overrideDays: null,
      finalDays: productShelfLife,
      calculationMethod: 'manual',
      shortestIngredient: null,
      storageConditions: null,
      calculatedAt: new Date()
    }
  }

  // Find ingredient with minimum shelf life
  const shortest = ingredients.reduce((min, item) => {
    const minShelfLife = min.component!.shelf_life_days!
    const itemShelfLife = item.component!.shelf_life_days!
    return itemShelfLife < minShelfLife ? item : min
  })

  const shortestComponent = shortest.component!
  const calculatedDays = shortestComponent.shelf_life_days!

  // 5. Save to product_shelf_life table using admin client (bypasses RLS for upsert)
  const { error: upsertError } = await supabaseAdmin
    .from('product_shelf_life')
    .upsert({
      org_id: userInfo.orgId,
      product_id: productId,
      calculated_days: calculatedDays,
      override_days: existingShelfLife?.override_days || null,
      final_days: existingShelfLife?.override_days || calculatedDays,
      calculation_method: 'auto_min_ingredients',
      shortest_ingredient_id: shortestComponent.id,
      calculated_at: new Date().toISOString(),
      created_by: userInfo.userId
    }, {
      onConflict: 'org_id,product_id'
    })

  if (upsertError) {
    console.error('Error saving shelf life calculation:', upsertError)
    // Don't throw - still return calculated value even if save fails
  }

  return {
    productId,
    calculatedDays,
    overrideDays: existingShelfLife?.override_days || null,
    finalDays: existingShelfLife?.override_days || calculatedDays,
    calculationMethod: 'auto_min_ingredients',
    shortestIngredient: {
      productId: shortestComponent.id,
      productCode: shortestComponent.code,
      shelfLifeDays: calculatedDays
    },
    storageConditions: existingShelfLife?.storage_conditions || null,
    calculatedAt: new Date()
  }
}

/**
 * Override product shelf life manually
 */
export async function overrideProductShelfLife(
  productId: string,
  overrideDays: number,
  storageConditions?: string
): Promise<void> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized or no organization found for user')
  }

  if (overrideDays <= 0) {
    throw new Error('Override days must be a positive number')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  const { error } = await supabaseAdmin
    .from('product_shelf_life')
    .upsert({
      org_id: userInfo.orgId,
      product_id: productId,
      override_days: overrideDays,
      final_days: overrideDays,
      calculation_method: 'manual',
      storage_conditions: storageConditions || null,
      calculated_at: new Date().toISOString(),
      created_by: userInfo.userId
    }, {
      onConflict: 'org_id,product_id'
    })

  if (error) {
    console.error('Error overriding shelf life:', error)
    throw new Error(`Failed to override shelf life: ${error.message}`)
  }
}

/**
 * Clear shelf life override (return to auto-calculation)
 */
export async function clearShelfLifeOverride(productId: string): Promise<void> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized or no organization found for user')
  }

  const supabase = await createServerSupabase()

  // Get current record
  const { data: existing } = await supabase
    .from('product_shelf_life')
    .select('calculated_days')
    .eq('product_id', productId)
    .maybeSingle()

  if (!existing) {
    return // Nothing to clear
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  const { error } = await supabaseAdmin
    .from('product_shelf_life')
    .update({
      override_days: null,
      final_days: existing.calculated_days || 0,
      calculation_method: 'auto_min_ingredients',
      calculated_at: new Date().toISOString()
    })
    .eq('product_id', productId)
    .eq('org_id', userInfo.orgId)

  if (error) {
    console.error('Error clearing shelf life override:', error)
    throw new Error(`Failed to clear override: ${error.message}`)
  }
}
