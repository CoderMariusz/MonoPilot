import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import type {
  ShelfLifeConfig,
  ShelfLifeConfigResponse,
  CalculateShelfLifeResponse,
  UpdateShelfLifeRequest,
  IngredientShelfLife,
  UpdateIngredientShelfLifeRequest,
  ShipmentEligibility,
  ShelfLifeAuditEntry,
  AuditLogResponse,
  RecalculationQueueResponse,
  ProductNeedsRecalculation,
  BulkRecalculationResult,
  RecalculationResult,
  EnforcementLevel,
  AuditActionType,
  StorageCondition,
} from '../types/shelf-life'

/**
 * Shelf Life Service
 * Story: 02.11 - Shelf Life Calculation + Expiry Management
 * PRD Section 5.8: Default = min(ingredient shelf lives)
 *
 * Handles shelf life calculation for products based on BOM ingredients:
 * - Auto-calculation from minimum ingredient shelf life (MIN rule)
 * - Processing impact and safety buffer application
 * - Manual override support with required reason
 * - Best Before date calculation (fixed/rolling modes)
 * - Shipment eligibility checking (FEFO enforcement)
 * - Recalculation triggers on ingredient changes
 * - Audit logging for all changes
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
      .eq('status', 'active')
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
      component:products!product_id (
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

// ============================================================================
// NEW METHODS FOR STORY 02.11
// ============================================================================

/**
 * Log shelf life change to audit table
 */
async function logShelfLifeAudit(
  productId: string,
  actionType: AuditActionType,
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown>,
  reason?: string | null
): Promise<void> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) throw new Error('Unauthorized')

  const supabaseAdmin = createServerSupabaseAdmin()

  const { error } = await supabaseAdmin.from('shelf_life_audit_log').insert({
    org_id: userInfo.orgId,
    product_id: productId,
    action_type: actionType,
    old_value: oldValue,
    new_value: newValue,
    change_reason: reason || null,
    changed_by: userInfo.userId,
  })

  if (error) {
    console.error('Error logging shelf life audit:', error)
    // Don't throw - audit failures shouldn't block operations
  }
}

/**
 * Get full shelf life configuration for a product
 * Returns null if no configuration exists
 */
export async function getShelfLifeConfig(
  productId: string
): Promise<ShelfLifeConfigResponse | null> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized or no organization found for user')
  }

  const supabase = await createServerSupabase()

  // Get product details
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, code, name, shelf_life_days')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    return null // Product not found (returns 404 per AC-11.19)
  }

  // Get shelf life config
  const { data: config } = await supabase
    .from('product_shelf_life')
    .select('*')
    .eq('product_id', productId)
    .maybeSingle()

  // Get active BOM
  const { data: bom } = await supabase
    .from('boms')
    .select('id, version, effective_from')
    .eq('product_id', productId)
    .eq('status', 'active')
    .maybeSingle()

  // Get BOM ingredients if BOM exists
  let ingredients: IngredientShelfLife[] = []
  let shortestIngredientName: string | null = null
  let shortestIngredientDays: number | null = null

  if (bom) {
    const { data: items } = await supabase
      .from('bom_items')
      .select(`
        component:products!product_id (
          id,
          code,
          name,
          shelf_life_days,
          type
        )
      `)
      .eq('bom_id', bom.id)

    if (items) {
      const typedItems = items as unknown as { component: BomItemWithComponent['component'] }[]
      ingredients = typedItems
        .filter((item) => item.component !== null && item.component.type !== 'FG')
        .map((item) => ({
          id: item.component!.id,
          code: item.component!.code,
          name: item.component!.name,
          shelf_life_days: item.component!.shelf_life_days,
          shelf_life_source: null,
          supplier_name: null,
          specification_reference: null,
          storage_temp_min: null,
          storage_temp_max: null,
          storage_humidity_min: null,
          storage_humidity_max: null,
          storage_conditions: [],
          min_acceptable_on_receipt: null,
          quarantine_required: false,
          quarantine_duration_days: null,
        }))

      // Find shortest ingredient
      if (config?.shortest_ingredient_id) {
        const shortest = ingredients.find((i) => i.id === config.shortest_ingredient_id)
        if (shortest) {
          shortestIngredientName = shortest.name || null
          shortestIngredientDays = shortest.shelf_life_days ?? null
        }
      }
    }
  }

  // Build response
  const response: ShelfLifeConfigResponse = {
    product_id: product.id,
    product_code: product.code,
    product_name: product.name,
    bom_version: bom?.version?.toString() || null,
    bom_effective_date: bom?.effective_from || null,
    calculated_days: config?.calculated_days ?? null,
    calculation_method: config?.calculation_method || 'manual',
    shortest_ingredient_id: config?.shortest_ingredient_id || null,
    shortest_ingredient_name: shortestIngredientName,
    shortest_ingredient_days: shortestIngredientDays,
    processing_impact_days: config?.processing_impact_days ?? 0,
    safety_buffer_percent: Number(config?.safety_buffer_percent ?? 20),
    safety_buffer_days: config?.safety_buffer_days ?? 0,
    override_days: config?.override_days ?? null,
    override_reason: config?.override_reason ?? null,
    final_days: config?.final_days ?? product.shelf_life_days ?? 0,
    storage_temp_min: config?.storage_temp_min ? Number(config.storage_temp_min) : null,
    storage_temp_max: config?.storage_temp_max ? Number(config.storage_temp_max) : null,
    storage_humidity_min: config?.storage_humidity_min ? Number(config.storage_humidity_min) : null,
    storage_humidity_max: config?.storage_humidity_max ? Number(config.storage_humidity_max) : null,
    storage_conditions: (config?.storage_conditions_json || []) as StorageCondition[],
    storage_instructions: config?.storage_instructions ?? null,
    shelf_life_mode: config?.shelf_life_mode || 'fixed',
    label_format: config?.label_format || 'best_before_day',
    picking_strategy: config?.picking_strategy || 'FEFO',
    min_remaining_for_shipment: config?.min_remaining_for_shipment ?? null,
    enforcement_level: config?.enforcement_level || 'warn',
    expiry_warning_days: config?.expiry_warning_days ?? 7,
    expiry_critical_days: config?.expiry_critical_days ?? 3,
    needs_recalculation: config?.needs_recalculation ?? false,
    calculated_at: config?.calculated_at ?? null,
    updated_at: config?.updated_at ?? new Date().toISOString(),
    updated_by: config?.updated_by ?? null,
    ingredients,
  }

  return response
}

/**
 * Update shelf life configuration
 * Supports partial updates and creates audit log entries
 */
export async function updateShelfLifeConfig(
  productId: string,
  updates: UpdateShelfLifeRequest
): Promise<ShelfLifeConfigResponse> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized or no organization found for user')
  }

  const supabase = await createServerSupabase()
  const supabaseAdmin = createServerSupabaseAdmin()

  // Get existing config for audit
  const { data: existingConfig } = await supabase
    .from('product_shelf_life')
    .select('*')
    .eq('product_id', productId)
    .maybeSingle()

  // Prepare update data
  const updateData: Record<string, unknown> = {
    org_id: userInfo.orgId,
    product_id: productId,
    updated_by: userInfo.userId,
    updated_at: new Date().toISOString(),
  }

  // Apply updates
  if (updates.use_override !== undefined) {
    if (updates.use_override && updates.override_days) {
      updateData.override_days = updates.override_days
      updateData.override_reason = updates.override_reason
      updateData.final_days = updates.override_days
      updateData.calculation_method = 'manual'
    } else if (!updates.use_override) {
      updateData.override_days = null
      updateData.override_reason = null
      updateData.final_days = existingConfig?.calculated_days || 0
      updateData.calculation_method = 'auto_min_ingredients'
    }
  }

  if (updates.processing_impact_days !== undefined) {
    updateData.processing_impact_days = updates.processing_impact_days
  }
  if (updates.safety_buffer_percent !== undefined) {
    updateData.safety_buffer_percent = updates.safety_buffer_percent
  }
  if (updates.storage_temp_min !== undefined) {
    updateData.storage_temp_min = updates.storage_temp_min
  }
  if (updates.storage_temp_max !== undefined) {
    updateData.storage_temp_max = updates.storage_temp_max
  }
  if (updates.storage_humidity_min !== undefined) {
    updateData.storage_humidity_min = updates.storage_humidity_min
  }
  if (updates.storage_humidity_max !== undefined) {
    updateData.storage_humidity_max = updates.storage_humidity_max
  }
  if (updates.storage_conditions !== undefined) {
    updateData.storage_conditions_json = updates.storage_conditions
  }
  if (updates.storage_instructions !== undefined) {
    updateData.storage_instructions = updates.storage_instructions
  }
  if (updates.shelf_life_mode !== undefined) {
    updateData.shelf_life_mode = updates.shelf_life_mode
  }
  if (updates.label_format !== undefined) {
    updateData.label_format = updates.label_format
  }
  if (updates.picking_strategy !== undefined) {
    updateData.picking_strategy = updates.picking_strategy
  }
  if (updates.min_remaining_for_shipment !== undefined) {
    updateData.min_remaining_for_shipment = updates.min_remaining_for_shipment
  }
  if (updates.enforcement_level !== undefined) {
    updateData.enforcement_level = updates.enforcement_level
  }
  if (updates.expiry_warning_days !== undefined) {
    updateData.expiry_warning_days = updates.expiry_warning_days
  }
  if (updates.expiry_critical_days !== undefined) {
    updateData.expiry_critical_days = updates.expiry_critical_days
  }

  // Upsert configuration
  const { error: upsertError } = await supabaseAdmin
    .from('product_shelf_life')
    .upsert(updateData, {
      onConflict: 'org_id,product_id',
    })

  if (upsertError) {
    console.error('Error updating shelf life config:', upsertError)
    throw new Error(`Failed to update shelf life config: ${upsertError.message}`)
  }

  // Log audit entry
  const actionType: AuditActionType = updates.use_override ? 'override' : 'update_config'
  await logShelfLifeAudit(
    productId,
    actionType,
    existingConfig ? { ...existingConfig } : null,
    updateData,
    updates.override_reason
  )

  // Return updated config
  const result = await getShelfLifeConfig(productId)
  if (!result) {
    throw new Error('Failed to retrieve updated configuration')
  }

  // Add warning if override exceeds calculated
  if (
    updates.use_override &&
    updates.override_days &&
    existingConfig?.calculated_days &&
    updates.override_days > existingConfig.calculated_days
  ) {
    result.warning = `Override (${updates.override_days} days) exceeds calculated shelf life (${existingConfig.calculated_days} days). Ensure this is backed by testing.`
  }

  return result
}

/**
 * Calculate shelf life from BOM ingredients with full formula
 * Formula: final_days = MAX(1, MIN(ingredients) - processing_impact - CEIL(MIN * buffer%))
 */
export async function calculateShelfLife(
  productId: string,
  force: boolean = false
): Promise<CalculateShelfLifeResponse> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized or no organization found for user')
  }

  const supabase = await createServerSupabase()
  const supabaseAdmin = createServerSupabaseAdmin()

  // Check for existing config (unless force recalculate)
  if (!force) {
    const { data: existingConfig } = await supabase
      .from('product_shelf_life')
      .select('calculated_days, needs_recalculation')
      .eq('product_id', productId)
      .maybeSingle()

    if (existingConfig?.calculated_days && !existingConfig.needs_recalculation) {
      // Return cached calculation
      const config = await getShelfLifeConfig(productId)
      if (config) {
        return {
          calculated_days: config.calculated_days || 0,
          shortest_ingredient_id: config.shortest_ingredient_id || '',
          shortest_ingredient_name: config.shortest_ingredient_name || '',
          shortest_ingredient_days: config.shortest_ingredient_days || 0,
          processing_impact_days: config.processing_impact_days,
          safety_buffer_percent: config.safety_buffer_percent,
          safety_buffer_days: config.safety_buffer_days,
          ingredients_analyzed: config.ingredients.length,
          missing_shelf_life: [],
          calculation_timestamp: new Date().toISOString(),
        }
      }
    }
  }

  // Get active BOM
  const { data: bom } = await supabase
    .from('boms')
    .select('id')
    .eq('product_id', productId)
    .eq('status', 'active')
    .maybeSingle()

  if (!bom) {
    throw new Error('No active BOM found. Set shelf life manually or create BOM first.')
  }

  // Get all BOM ingredients
  const { data: items, error: itemsError } = await supabase
    .from('bom_items')
    .select(`
      id,
      quantity,
      component:products!product_id (
        id,
        code,
        name,
        shelf_life_days,
        type
      )
    `)
    .eq('bom_id', bom.id)

  if (itemsError) {
    throw new Error(`Failed to fetch BOM items: ${itemsError.message}`)
  }

  const typedItems = (items || []) as unknown as BomItemWithComponent[]

  // Filter to ingredients only (exclude FG)
  const ingredients = typedItems.filter(
    (item) => item.component !== null && item.component.type !== 'FG'
  )

  // Check for missing shelf life
  const missingShelfLife = ingredients
    .filter((item) => item.component?.shelf_life_days === null)
    .map((item) => item.component!.name)

  if (missingShelfLife.length > 0) {
    throw new Error(`Missing shelf life for ingredient: ${missingShelfLife.join(', ')}`)
  }

  // Find ingredient with minimum shelf life
  const validIngredients = ingredients.filter((item) => item.component?.shelf_life_days !== null)

  if (validIngredients.length === 0) {
    throw new Error('No ingredients with shelf life found in BOM')
  }

  const shortest = validIngredients.reduce((min, item) => {
    return item.component!.shelf_life_days! < min.component!.shelf_life_days! ? item : min
  })

  const shortestDays = shortest.component!.shelf_life_days!

  // Get existing config for processing impact, safety buffer, and override
  const { data: existingConfig } = await supabase
    .from('product_shelf_life')
    .select('processing_impact_days, safety_buffer_percent, override_days')
    .eq('product_id', productId)
    .maybeSingle()

  const processingImpactDays = existingConfig?.processing_impact_days ?? 0
  const safetyBufferPercent = Number(existingConfig?.safety_buffer_percent ?? 20)

  // Calculate final days using formula
  const safetyBufferDays = Math.ceil(shortestDays * (safetyBufferPercent / 100))
  const calculatedDays = Math.max(1, shortestDays - processingImpactDays - safetyBufferDays)

  // Save calculation result
  const { error: upsertError } = await supabaseAdmin
    .from('product_shelf_life')
    .upsert(
      {
        org_id: userInfo.orgId,
        product_id: productId,
        calculated_days: calculatedDays,
        final_days: existingConfig?.override_days
          ? existingConfig.override_days  // Keep override if set
          : calculatedDays,  // Otherwise use calculated
        calculation_method: 'auto_min_ingredients',
        shortest_ingredient_id: shortest.component!.id,
        safety_buffer_days: safetyBufferDays,
        needs_recalculation: false,
        calculated_at: new Date().toISOString(),
        created_by: userInfo.userId,
        updated_by: userInfo.userId,
      },
      {
        onConflict: 'org_id,product_id',
      }
    )

  if (upsertError) {
    console.error('Error saving calculation:', upsertError)
  }

  // Log audit entry
  await logShelfLifeAudit(
    productId,
    'calculate',
    existingConfig ? { calculated_days: existingConfig.processing_impact_days } : null,
    { calculated_days: calculatedDays, shortest_ingredient_id: shortest.component!.id }
  )

  return {
    calculated_days: calculatedDays,
    shortest_ingredient_id: shortest.component!.id,
    shortest_ingredient_name: shortest.component!.name,
    shortest_ingredient_days: shortestDays,
    processing_impact_days: processingImpactDays,
    safety_buffer_percent: safetyBufferPercent,
    safety_buffer_days: safetyBufferDays,
    ingredients_analyzed: validIngredients.length,
    missing_shelf_life: [],
    calculation_timestamp: new Date().toISOString(),
  }
}

/**
 * Get products needing shelf life recalculation
 */
export async function getRecalculationQueue(): Promise<RecalculationQueueResponse> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized or no organization found for user')
  }

  const supabase = await createServerSupabase()

  const { data: configs, error } = await supabase
    .from('product_shelf_life')
    .select(`
      product_id,
      final_days,
      calculated_at,
      updated_at,
      product:products!product_id (
        code,
        name
      )
    `)
    .eq('needs_recalculation', true)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get recalculation queue: ${error.message}`)
  }

  const queueItems = (configs || []).map((config) => {
    const product = config.product as unknown as { code: string; name: string }
    return {
      product_id: config.product_id,
      product_code: product?.code || '',
      product_name: product?.name || '',
      current_days: config.final_days as number | null,
      last_calculated_at: config.calculated_at as string | null,
      flagged_at: config.updated_at,
    }
  })

  return {
    count: queueItems.length,
    products: queueItems,
  }
}

/**
 * Bulk recalculate shelf life for multiple products
 */
export async function bulkRecalculate(
  productIds?: string[]
): Promise<BulkRecalculationResult> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized or no organization found for user')
  }

  const supabase = await createServerSupabase()

  // Get products to recalculate
  let idsToProcess: string[] = []

  if (productIds && productIds.length > 0) {
    idsToProcess = productIds
  } else {
    // Get all flagged products
    const { data: flagged } = await supabase
      .from('product_shelf_life')
      .select('product_id')
      .eq('needs_recalculation', true)

    idsToProcess = (flagged || []).map((p) => p.product_id)
  }

  const results: RecalculationResult[] = []
  let successful = 0
  let failed = 0

  for (const productId of idsToProcess) {
    try {
      // Get current shelf life
      const { data: current } = await supabase
        .from('product_shelf_life')
        .select('final_days')
        .eq('product_id', productId)
        .single()

      const oldDays = current?.final_days || 0

      // Recalculate
      const calcResult = await calculateShelfLife(productId, true)

      results.push({
        product_id: productId,
        product_name: calcResult.shortest_ingredient_name,
        old_days: oldDays,
        new_days: calcResult.calculated_days,
        success: true,
      })
      successful++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.push({
        product_id: productId,
        product_name: '',
        old_days: 0,
        new_days: 0,
        success: false,
        error: errorMessage,
      })
      failed++
    }
  }

  return {
    total_processed: idsToProcess.length,
    successful,
    failed,
    results,
  }
}

/**
 * Calculate best before date based on shelf life mode
 */
export async function calculateBestBeforeDate(
  productionDate: Date,
  productId: string,
  ingredientExpiries?: Date[]
): Promise<Date> {
  const config = await getShelfLifeConfig(productId)
  if (!config) {
    // Default: add 30 days
    const result = new Date(productionDate)
    result.setDate(result.getDate() + 30)
    return result
  }

  if (config.shelf_life_mode === 'rolling' && ingredientExpiries && ingredientExpiries.length > 0) {
    // Rolling mode: use earliest ingredient expiry - processing buffer
    const earliestExpiry = ingredientExpiries.reduce((earliest, date) =>
      date < earliest ? date : earliest
    )
    const result = new Date(earliestExpiry)
    result.setDate(result.getDate() - config.processing_impact_days)
    return result
  }

  // Fixed mode: production date + final days
  const result = new Date(productionDate)
  result.setDate(result.getDate() + config.final_days)
  return result
}

/**
 * Check if a lot is eligible for shipment based on remaining shelf life
 */
export async function checkShipmentEligibility(
  lotId: string,
  shipDate?: Date
): Promise<ShipmentEligibility> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized')
  }

  const supabase = await createServerSupabase()
  const today = shipDate || new Date()

  // Get lot with product info
  const { data: lot } = await supabase
    .from('license_plates')
    .select(`
      id,
      expiry_date,
      product_id
    `)
    .eq('id', lotId)
    .single()

  if (!lot || !lot.expiry_date) {
    return {
      eligible: true,
      remaining_days: 999,
      minimum_required: 0,
      enforcement_level: 'suggest',
      message: '',
      requires_confirmation: false,
      blocked: false,
    }
  }

  // Get shelf life config for product
  const config = await getShelfLifeConfig(lot.product_id)
  if (!config || config.min_remaining_for_shipment === null) {
    return {
      eligible: true,
      remaining_days: 999,
      minimum_required: 0,
      enforcement_level: 'suggest',
      message: '',
      requires_confirmation: false,
      blocked: false,
    }
  }

  // Calculate remaining days
  const expiryDate = new Date(lot.expiry_date)
  const remainingDays = Math.floor(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  const minRequired = config.min_remaining_for_shipment
  const canShip = remainingDays >= minRequired
  const enforcementLevel = config.enforcement_level as EnforcementLevel

  return {
    eligible: canShip || enforcementLevel === 'suggest',
    remaining_days: remainingDays,
    minimum_required: minRequired,
    enforcement_level: enforcementLevel,
    message: canShip
      ? ''
      : `Lot has ${remainingDays} days remaining (minimum: ${minRequired} days)`,
    requires_confirmation: !canShip && enforcementLevel === 'warn',
    blocked: !canShip && enforcementLevel === 'block',
  }
}

/**
 * Get ingredient shelf life configuration
 */
export async function getIngredientShelfLife(
  ingredientId: string
): Promise<IngredientShelfLife | null> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized')
  }

  const supabase = await createServerSupabase()

  const { data: product, error } = await supabase
    .from('products')
    .select('id, code, name, shelf_life_days, type')
    .eq('id', ingredientId)
    .single()

  if (error || !product) {
    return null
  }

  return {
    id: product.id,
    code: product.code,
    name: product.name,
    shelf_life_days: product.shelf_life_days,
    shelf_life_source: null,
    supplier_name: null,
    specification_reference: null,
    storage_temp_min: null,
    storage_temp_max: null,
    storage_humidity_min: null,
    storage_humidity_max: null,
    storage_conditions: [],
    min_acceptable_on_receipt: null,
    quarantine_required: false,
    quarantine_duration_days: null,
  }
}

/**
 * Update ingredient shelf life (triggers recalculation)
 */
export async function updateIngredientShelfLife(
  ingredientId: string,
  data: UpdateIngredientShelfLifeRequest
): Promise<IngredientShelfLife> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Update product shelf_life_days (triggers recalc via database trigger)
  const { error: updateError } = await supabaseAdmin
    .from('products')
    .update({
      shelf_life_days: data.shelf_life_days,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ingredientId)
    .eq('org_id', userInfo.orgId)

  if (updateError) {
    throw new Error(`Failed to update ingredient shelf life: ${updateError.message}`)
  }

  // Return updated ingredient
  const result = await getIngredientShelfLife(ingredientId)
  if (!result) {
    throw new Error('Failed to retrieve updated ingredient')
  }

  return result
}

/**
 * Get audit log for shelf life changes
 */
export async function getAuditLog(
  productId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AuditLogResponse> {
  const userInfo = await getCurrentUserOrgId()
  if (!userInfo) {
    throw new Error('Unauthorized')
  }

  const supabase = await createServerSupabase()

  // Get total count
  const { count } = await supabase
    .from('shelf_life_audit_log')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)

  // Get entries
  const { data: entries, error } = await supabase
    .from('shelf_life_audit_log')
    .select(`
      id,
      product_id,
      action_type,
      old_value,
      new_value,
      change_reason,
      changed_at,
      changed_by,
      user:users!changed_by (
        name
      )
    `)
    .eq('product_id', productId)
    .order('changed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to get audit log: ${error.message}`)
  }

  const auditEntries: ShelfLifeAuditEntry[] = (entries || []).map((entry) => {
    const user = entry.user as unknown as { name: string } | null
    return {
      id: entry.id,
      product_id: entry.product_id,
      action_type: entry.action_type as AuditActionType,
      old_value: entry.old_value as Record<string, unknown> | null,
      new_value: entry.new_value as Record<string, unknown>,
      change_reason: entry.change_reason,
      changed_at: entry.changed_at,
      changed_by: entry.changed_by,
      changed_by_name: user?.name || 'Unknown',
    }
  })

  return {
    total: count || 0,
    entries: auditEntries,
  }
}

// Re-export types for convenience
export type {
  ShelfLifeConfigResponse,
  CalculateShelfLifeResponse,
  UpdateShelfLifeRequest,
  IngredientShelfLife,
  UpdateIngredientShelfLifeRequest,
  ShipmentEligibility,
  ShelfLifeAuditEntry,
  AuditLogResponse,
  RecalculationQueueResponse,
  ProductNeedsRecalculation,
  BulkRecalculationResult,
}
