/**
 * Product Allergen Service (Story 02.3 - MVP)
 * Purpose: Business logic for product allergen management and BOM inheritance
 *
 * Features:
 * - Get product allergens with inheritance status
 * - Add/remove manual allergen declarations
 * - Calculate allergen inheritance from BOM ingredients
 * - Track auto vs manual allergens
 *
 * MVP Scope: Basic inheritance (single-level BOM)
 * Phase 1+: Multi-level BOM, risk assessment (deferred)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { addProductAllergenSchema } from '../validation/product-allergen-schema'
import type {
  ProductAllergen,
  AddProductAllergenRequest,
  ProductAllergensResponse,
  RecalculateAllergensResponse,
  InheritanceStatus,
} from '../types/product-allergen'

export type {
  ProductAllergen,
  AddProductAllergenRequest,
  ProductAllergensResponse,
  RecalculateAllergensResponse,
  InheritanceStatus,
}

/**
 * Product Allergen Service
 * Static methods for allergen CRUD and inheritance calculation
 */
export class ProductAllergenService {
  /**
   * Get Product Allergens
   * Returns all allergen declarations for a product with inheritance status
   *
   * @param supabase - Supabase client
   * @param productId - Product UUID
   * @returns Product allergens with inheritance status
   * @throws Error if product not found or database error
   */
  static async getProductAllergens(
    supabase: SupabaseClient,
    productId: string
  ): Promise<ProductAllergensResponse> {
    // Fetch product allergens with allergen details (join)
    const { data: allergens, error } = await supabase
      .from('product_allergens')
      .select(
        `
        id,
        allergen_id,
        relation_type,
        source,
        source_product_ids,
        reason,
        created_at,
        created_by,
        updated_at,
        allergen:allergens (
          code,
          name_en,
          icon_url
        )
      `
      )
      .eq('product_id', productId)
      .order('relation_type')
      .order('created_at')

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Product not found')
      }
      throw error
    }

    // Collect all unique source_product_ids to batch fetch (avoid N+1 queries)
    const allSourceProductIds = new Set<string>()
    for (const pa of allergens || []) {
      if (pa.source_product_ids && Array.isArray(pa.source_product_ids)) {
        for (const id of pa.source_product_ids) {
          allSourceProductIds.add(id)
        }
      }
    }

    // Batch fetch source products if any exist
    const sourceProductsMap = new Map<
      string,
      { id: string; code: string; name: string }
    >()
    if (allSourceProductIds.size > 0) {
      const { data: sourceProducts } = await supabase
        .from('products')
        .select('id, code, name')
        .in('id', Array.from(allSourceProductIds))

      if (sourceProducts) {
        for (const product of sourceProducts) {
          sourceProductsMap.set(product.id, {
            id: product.id,
            code: product.code,
            name: product.name,
          })
        }
      }
    }

    // Transform allergens data with resolved source products
    const transformedAllergens: ProductAllergen[] = (allergens || []).map(
      (pa: any) => {
        // Build source_products array from source_product_ids
        let source_products:
          | { id: string; code: string; name: string }[]
          | undefined
        if (pa.source_product_ids && Array.isArray(pa.source_product_ids)) {
          source_products = pa.source_product_ids
            .map((id: string) => sourceProductsMap.get(id))
            .filter(Boolean) as { id: string; code: string; name: string }[]
        }

        return {
          id: pa.id,
          allergen_id: pa.allergen_id,
          allergen_code: pa.allergen?.code || '',
          allergen_name: pa.allergen?.name_en || '',
          allergen_icon: pa.allergen?.icon_url || null,
          relation_type: pa.relation_type,
          source: pa.source,
          source_products:
            source_products && source_products.length > 0
              ? source_products
              : undefined,
          reason: pa.reason || undefined,
          created_at: pa.created_at,
          created_by: pa.created_by,
          updated_at: pa.updated_at,
        }
      }
    )

    // Get inheritance status
    const inheritanceStatus = await this.getInheritanceStatus(
      supabase,
      productId
    )

    return {
      allergens: transformedAllergens,
      inheritance_status: inheritanceStatus,
    }
  }

  /**
   * Add Product Allergen (Manual)
   * Adds a manual allergen declaration to a product
   *
   * @param supabase - Supabase client
   * @param productId - Product UUID
   * @param orgId - Organization UUID (for RLS)
   * @param userId - User UUID (created_by)
   * @param input - Allergen declaration data
   * @returns Created product allergen
   * @throws Error if validation fails, duplicate exists, or allergen invalid
   */
  static async addProductAllergen(
    supabase: SupabaseClient,
    productId: string,
    orgId: string,
    userId: string,
    input: AddProductAllergenRequest
  ): Promise<ProductAllergen> {
    // Validate input
    const validated = addProductAllergenSchema.parse(input)

    // Check for duplicate (same allergen + relation_type)
    const { data: existing } = await supabase
      .from('product_allergens')
      .select('id')
      .eq('product_id', productId)
      .eq('allergen_id', validated.allergen_id)
      .eq('relation_type', validated.relation_type)
      .single()

    if (existing) {
      throw new Error(
        `Allergen already declared with relation type: ${validated.relation_type}`
      )
    }

    // Insert product allergen
    const { data, error } = await supabase
      .from('product_allergens')
      .insert({
        org_id: orgId,
        product_id: productId,
        allergen_id: validated.allergen_id,
        relation_type: validated.relation_type,
        source: 'manual',
        reason: validated.reason || null,
        created_by: userId,
      })
      .select(
        `
        id,
        allergen_id,
        relation_type,
        source,
        reason,
        created_at,
        created_by,
        allergen:allergens (
          code,
          name_en,
          icon_url
        )
      `
      )
      .single()

    if (error) {
      if (error.code === '23503') {
        throw new Error('Invalid allergen ID')
      }
      throw error
    }

    return {
      id: data.id,
      allergen_id: data.allergen_id,
      allergen_code: (data.allergen as any)?.code || '',
      allergen_name: (data.allergen as any)?.name_en || '',
      allergen_icon: (data.allergen as any)?.icon_url || null,
      relation_type: data.relation_type,
      source: data.source,
      reason: data.reason || undefined,
      created_at: data.created_at,
      created_by: data.created_by,
    }
  }

  /**
   * Remove Product Allergen
   * Removes an allergen declaration from a product
   *
   * @param supabase - Supabase client
   * @param productId - Product UUID
   * @param allergenRecordId - product_allergens.id (UUID)
   * @param relationType - Optional: filter by relation_type
   * @throws Error if allergen not found
   */
  static async removeProductAllergen(
    supabase: SupabaseClient,
    productId: string,
    allergenRecordId: string,
    relationType?: 'contains' | 'may_contain'
  ): Promise<void> {
    let query = supabase
      .from('product_allergens')
      .delete()
      .eq('id', allergenRecordId)
      .eq('product_id', productId)

    if (relationType) {
      query = query.eq('relation_type', relationType)
    }

    const { data, error } = await query.select('id').single()

    if (error || !data) {
      throw new Error('Allergen declaration not found')
    }
  }

  /**
   * Calculate Allergen Inheritance from BOM
   * Recalculates auto-inherited allergens from BOM ingredients (contains only)
   *
   * Algorithm (MVP - single-level):
   * 1. Get BOM items (ingredients) for product
   * 2. For each ingredient, fetch allergens (relation_type = 'contains' only)
   * 3. Aggregate unique allergens from all ingredients
   * 4. Upsert auto-inherited allergens (source='auto')
   * 5. Remove stale auto-inherited allergens not in current BOM
   * 6. Preserve manual allergens (source='manual')
   *
   * @param supabase - Supabase client
   * @param bomId - BOM UUID
   * @param productId - Product UUID (FG that owns the BOM)
   * @param orgId - Organization UUID (for RLS)
   * @returns Recalculation result with inherited, manual, and removed allergens
   * @throws Error if BOM not found
   */
  static async calculateAllergenInheritance(
    supabase: SupabaseClient,
    bomId: string,
    productId: string,
    orgId: string
  ): Promise<RecalculateAllergensResponse> {
    // 1. Get BOM items (ingredients)
    const { data: bomItems, error: bomError } = await supabase
      .from('bom_items')
      .select(
        `
        id,
        product_id,
        product:products!product_id (
          id,
          code,
          name
        )
      `
      )
      .eq('bom_id', bomId)
      .eq('is_output', false) // Only inputs (ingredients), not outputs

    if (bomError) {
      if (bomError.code === 'PGRST116') {
        throw new Error('BOM not found')
      }
      throw bomError
    }

    if (!bomItems || bomItems.length === 0) {
      // Empty BOM - remove all auto-inherited allergens
      const { data: removed } = await supabase
        .from('product_allergens')
        .delete()
        .eq('product_id', productId)
        .eq('source', 'auto')
        .select('id')

      return {
        inherited_allergens: [],
        manual_allergens: [],
        removed_count: removed?.length || 0,
        bom_version: '1.0',
      }
    }

    // 2. For each ingredient, fetch allergens (contains only)
    const inheritedAllergensMap = new Map<
      string,
      {
        allergenId: string
        allergenCode: string
        allergenName: string
        allergenIcon: string | null
        sourceProducts: { id: string; code: string; name: string }[]
      }
    >()

    for (const item of bomItems) {
      const { data: ingredientAllergens } = await supabase
        .from('product_allergens')
        .select(
          `
          allergen_id,
          allergen:allergens (
            code,
            name_en,
            icon_url
          )
        `
        )
        .eq('product_id', item.product_id)
        .eq('relation_type', 'contains') // Only inherit "contains" allergens

      if (ingredientAllergens && ingredientAllergens.length > 0) {
        for (const allergen of ingredientAllergens) {
          const allergenId = allergen.allergen_id
          const product = item.product as any

          if (inheritedAllergensMap.has(allergenId)) {
            // Allergen already inherited from another ingredient - add source product
            inheritedAllergensMap.get(allergenId)!.sourceProducts.push({
              id: product.id,
              code: product.code,
              name: product.name,
            })
          } else {
            // New inherited allergen
            inheritedAllergensMap.set(allergenId, {
              allergenId,
              allergenCode: (allergen.allergen as any)?.code || '',
              allergenName: (allergen.allergen as any)?.name_en || '',
              allergenIcon: (allergen.allergen as any)?.icon_url || null,
              sourceProducts: [
                {
                  id: product.id,
                  code: product.code,
                  name: product.name,
                },
              ],
            })
          }
        }
      }
    }

    // 3. Upsert auto-inherited allergens
    const inheritedAllergens: ProductAllergen[] = []
    for (const [allergenId, data] of inheritedAllergensMap) {
      const { data: upserted, error: upsertError } = await supabase
        .from('product_allergens')
        .upsert(
          {
            org_id: orgId,
            product_id: productId,
            allergen_id: allergenId,
            relation_type: 'contains',
            source: 'auto',
            source_product_ids: data.sourceProducts.map((p) => p.id),
          },
          {
            onConflict: 'product_id,allergen_id,relation_type',
          }
        )
        .select('id, created_at, created_by')
        .single()

      if (!upsertError && upserted) {
        inheritedAllergens.push({
          id: upserted.id,
          allergen_id: allergenId,
          allergen_code: data.allergenCode,
          allergen_name: data.allergenName,
          allergen_icon: data.allergenIcon,
          relation_type: 'contains',
          source: 'auto',
          source_products: data.sourceProducts,
          created_at: upserted.created_at,
          created_by: upserted.created_by,
        })
      }
    }

    // 4. Remove stale auto-inherited allergens (no longer in BOM)
    const validAllergenIds = Array.from(inheritedAllergensMap.keys())

    let deleteQuery = supabase
      .from('product_allergens')
      .delete()
      .eq('product_id', productId)
      .eq('source', 'auto')

    if (validAllergenIds.length > 0) {
      // SECURITY FIX (CRIT-1): Pass array directly to Supabase (parameterized query)
      // Before: String interpolation allowed SQL injection
      deleteQuery = deleteQuery.not('allergen_id', 'in', validAllergenIds)
    }

    const { data: removed } = await deleteQuery.select('id')

    // 5. Fetch preserved manual allergens
    const { data: manualAllergens } = await supabase
      .from('product_allergens')
      .select(
        `
        id,
        allergen_id,
        relation_type,
        source,
        reason,
        created_at,
        created_by,
        allergen:allergens (
          code,
          name_en,
          icon_url
        )
      `
      )
      .eq('product_id', productId)
      .eq('source', 'manual')

    const transformedManualAllergens: ProductAllergen[] = (
      manualAllergens || []
    ).map((pa: any) => ({
      id: pa.id,
      allergen_id: pa.allergen_id,
      allergen_code: pa.allergen?.code || '',
      allergen_name: pa.allergen?.name_en || '',
      allergen_icon: pa.allergen?.icon_url || null,
      relation_type: pa.relation_type,
      source: pa.source,
      reason: pa.reason || undefined,
      created_at: pa.created_at,
      created_by: pa.created_by,
    }))

    return {
      inherited_allergens: inheritedAllergens,
      manual_allergens: transformedManualAllergens,
      removed_count: removed?.length || 0,
      bom_version: '1.0', // TODO: Get from BOM table
    }
  }

  /**
   * Get Inheritance Status
   * Returns BOM info and recalculation status for a product
   *
   * @param supabase - Supabase client
   * @param productId - Product UUID
   * @returns Inheritance status
   */
  static async getInheritanceStatus(
    supabase: SupabaseClient,
    productId: string
  ): Promise<InheritanceStatus> {
    // Get active BOM for product
    const { data: bom } = await supabase
      .from('boms')
      .select('id, version, updated_at')
      .eq('product_id', productId)
      .eq('status', 'active')
      .single()

    if (!bom) {
      return {
        last_calculated: null,
        bom_version: null,
        ingredients_count: 0,
        needs_recalculation: false,
      }
    }

    // Count BOM items (ingredients)
    const { data: bomItems } = await supabase
      .from('bom_items')
      .select('id')
      .eq('bom_id', bom.id)
      .eq('is_output', false)

    const ingredientsCount = bomItems?.length || 0

    // Check if recalculation needed (BOM updated recently)
    // For MVP, assume needs_recalculation = false (user triggers manually)
    const needsRecalculation = false

    return {
      last_calculated: bom.updated_at || null,
      bom_version: bom.version || null,
      ingredients_count: ingredientsCount,
      needs_recalculation: needsRecalculation,
    }
  }
}
