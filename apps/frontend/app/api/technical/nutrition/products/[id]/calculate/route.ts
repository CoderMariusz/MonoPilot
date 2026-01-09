/**
 * API Route: /api/technical/nutrition/products/[id]/calculate
 * Story 02.13: Nutrition Calculation - Calculate from BOM ingredients
 *
 * POST - Calculate nutrition from BOM with optional yield adjustment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { calculateNutritionRequestSchema } from '@/lib/validation/nutrition-schema'
import NutritionService from '@/lib/services/nutrition-service'
import { ZodError } from 'zod'

type RouteContext = {
  params: Promise<{ id: string }>
}

// POST /api/technical/nutrition/products/[id]/calculate - Calculate nutrition from BOM
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()
    const { id: productId } = await context.params

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user to get org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const orgId = currentUser.org_id

    // Verify product exists
    const { data: product } = await supabase
      .from('products')
      .select('id, code, name')
      .eq('id', productId)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .single()

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    let body = {}
    try {
      body = await req.json()
    } catch {
      // Empty body is valid - use defaults
    }

    const validated = calculateNutritionRequestSchema.parse(body)

    // Create nutrition service with the authenticated Supabase client
    const nutritionService = new NutritionService(supabase)

    // Calculate nutrition from BOM
    const result = await nutritionService.calculateFromBOM(
      productId,
      validated.bom_id,
      validated.actual_yield_kg,
      validated.allow_partial
    )

    // If calculation succeeded, optionally save the results
    const saveToDb = req.nextUrl.searchParams.get('save') === 'true'

    if (saveToDb && result.missing_ingredients.length === 0) {
      const now = new Date().toISOString()

      const nutritionData = {
        org_id: orgId,
        product_id: productId,
        is_manual_override: false,
        override_source: 'calculated',
        calculated_at: now,
        bom_version_used: result.metadata.bom_version,
        bom_id_used: result.metadata.bom_id,
        energy_kcal: result.per_100g.energy_kcal ?? 0,
        energy_kj: result.per_100g.energy_kj ?? 0,
        protein_g: result.per_100g.protein_g ?? 0,
        fat_g: result.per_100g.fat_g ?? 0,
        saturated_fat_g: result.per_100g.saturated_fat_g ?? null,
        trans_fat_g: result.per_100g.trans_fat_g ?? null,
        carbohydrate_g: result.per_100g.carbohydrate_g ?? 0,
        sugar_g: result.per_100g.sugar_g ?? null,
        added_sugar_g: result.per_100g.added_sugar_g ?? null,
        fiber_g: result.per_100g.fiber_g ?? null,
        sodium_mg: result.per_100g.sodium_mg ?? null,
        salt_g: result.per_100g.salt_g ?? null,
        cholesterol_mg: result.per_100g.cholesterol_mg ?? null,
        vitamin_d_mcg: result.per_100g.vitamin_d_mcg ?? null,
        calcium_mg: result.per_100g.calcium_mg ?? null,
        iron_mg: result.per_100g.iron_mg ?? null,
        potassium_mg: result.per_100g.potassium_mg ?? null,
        updated_at: now,
      }

      await supabase
        .from('product_nutrition')
        .upsert(nutritionData, {
          onConflict: 'org_id,product_id',
        })
    }

    return NextResponse.json({
      success: true,
      product_id: productId,
      product_code: product.code,
      product_name: product.name,
      calculation: result,
      saved: saveToDb && result.missing_ingredients.length === 0,
    })

  } catch (error: any) {
    // Handle nutrition-specific errors
    if (error.name === 'NutritionError') {
      const statusCode = error.code === 'NO_ACTIVE_BOM' ? 404 :
                        error.code === 'MISSING_INGREDIENT_NUTRITION' ? 422 : 400

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          missing_ingredients: error.missing || [],
        },
        { status: statusCode }
      )
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error in POST /api/technical/nutrition/products/[id]/calculate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
