/**
 * API Route: /api/technical/nutrition/ingredients/[id]
 * Story 02.13: Nutrition Calculation - Get ingredient nutrition profile
 *
 * GET - Get ingredient nutrition data
 * POST - Create/Update ingredient nutrition data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ingredientNutritionSchema } from '@/lib/validation/ingredient-nutrition-schema'
import { ZodError } from 'zod'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/technical/nutrition/ingredients/[id] - Get ingredient nutrition data
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()
    const { id: ingredientId } = await context.params

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

    // Verify ingredient (product) exists
    const { data: ingredient } = await supabase
      .from('products')
      .select('id, code, name, product_type')
      .eq('id', ingredientId)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .single()

    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingredient not found', code: 'INGREDIENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Fetch ingredient nutrition
    const { data: nutrition, error: nutritionError } = await supabase
      .from('ingredient_nutrition')
      .select('*')
      .eq('ingredient_id', ingredientId)
      .eq('org_id', orgId)
      .single()

    if (nutritionError) {
      if (nutritionError.code === 'PGRST116') {
        // No nutrition data found
        return NextResponse.json({
          ingredient_id: ingredientId,
          ingredient_code: ingredient.code,
          ingredient_name: ingredient.name,
          product_type: ingredient.product_type,
          nutrition: null,
          message: 'No nutrition data found for this ingredient'
        })
      }
      console.error('Error fetching ingredient nutrition:', nutritionError)
      return NextResponse.json(
        { error: 'Failed to fetch nutrition data', details: nutritionError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ingredient_id: ingredientId,
      ingredient_code: ingredient.code,
      ingredient_name: ingredient.name,
      product_type: ingredient.product_type,
      nutrition
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/technical/nutrition/ingredients/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/technical/nutrition/ingredients/[id] - Create/Update ingredient nutrition
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()
    const { id: ingredientId } = await context.params

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

    // Verify ingredient (product) exists
    const { data: ingredient } = await supabase
      .from('products')
      .select('id, code, name')
      .eq('id', ingredientId)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .single()

    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingredient not found', code: 'INGREDIENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validated = ingredientNutritionSchema.parse(body)

    const now = new Date().toISOString()

    // Prepare nutrition data for upsert
    const nutritionData = {
      org_id: orgId,
      ingredient_id: ingredientId,
      per_unit: validated.per_unit,
      unit: validated.unit,
      source: validated.source,
      source_id: validated.source_id ?? null,
      source_date: validated.source_date ?? null,
      confidence: validated.confidence,
      notes: validated.notes ?? null,
      energy_kcal: validated.energy_kcal ?? null,
      energy_kj: validated.energy_kj ?? null,
      protein_g: validated.protein_g ?? null,
      fat_g: validated.fat_g ?? null,
      saturated_fat_g: validated.saturated_fat_g ?? null,
      trans_fat_g: validated.trans_fat_g ?? null,
      carbohydrate_g: validated.carbohydrate_g ?? null,
      sugar_g: validated.sugar_g ?? null,
      added_sugar_g: validated.added_sugar_g ?? null,
      fiber_g: validated.fiber_g ?? null,
      sodium_mg: validated.sodium_mg ?? null,
      salt_g: validated.salt_g ?? null,
      cholesterol_mg: validated.cholesterol_mg ?? null,
      vitamin_d_mcg: validated.vitamin_d_mcg ?? null,
      calcium_mg: validated.calcium_mg ?? null,
      iron_mg: validated.iron_mg ?? null,
      potassium_mg: validated.potassium_mg ?? null,
      vitamin_c_mg: validated.vitamin_c_mg ?? null,
      vitamin_a_mcg: validated.vitamin_a_mcg ?? null,
      moisture_g: validated.moisture_g ?? null,
      updated_at: now,
    }

    // Upsert nutrition record
    const { data: result, error: upsertError } = await supabase
      .from('ingredient_nutrition')
      .upsert(nutritionData, {
        onConflict: 'org_id,ingredient_id',
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error saving ingredient nutrition:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save nutrition data', details: upsertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ingredient_id: ingredientId,
      ingredient_code: ingredient.code,
      ingredient_name: ingredient.name,
      nutrition: result,
      message: 'Ingredient nutrition saved successfully'
    })

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error in POST /api/technical/nutrition/ingredients/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
