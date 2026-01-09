/**
 * API Route: /api/technical/nutrition/products/[id]
 * Story 02.13: Nutrition Calculation - Get and Update product nutrition
 *
 * GET - Get product nutrition data
 * PUT - Update product nutrition (manual override)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { nutritionOverrideSchema } from '@/lib/validation/nutrition-schema'
import { ZodError } from 'zod'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/technical/nutrition/products/[id] - Get product nutrition data
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await context.params

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
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .single()

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Fetch product nutrition
    const { data: nutrition, error: nutritionError } = await supabase
      .from('product_nutrition')
      .select('*')
      .eq('product_id', id)
      .eq('org_id', orgId)
      .single()

    if (nutritionError) {
      if (nutritionError.code === 'PGRST116') {
        // No nutrition data found - return empty with product info
        return NextResponse.json({
          product_id: id,
          product_code: product.code,
          product_name: product.name,
          nutrition: null,
          message: 'No nutrition data found for this product'
        })
      }
      console.error('Error fetching product nutrition:', nutritionError)
      return NextResponse.json(
        { error: 'Failed to fetch nutrition data', details: nutritionError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      product_id: id,
      product_code: product.code,
      product_name: product.name,
      nutrition
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/technical/nutrition/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/technical/nutrition/products/[id] - Update product nutrition (manual override)
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await context.params

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
      .select('id')
      .eq('id', id)
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
    const body = await req.json()
    const validated = nutritionOverrideSchema.parse(body)

    const now = new Date().toISOString()

    // Prepare nutrition data for upsert
    const nutritionData = {
      org_id: orgId,
      product_id: id,
      serving_size: validated.serving_size,
      serving_unit: validated.serving_unit,
      servings_per_container: validated.servings_per_container,
      is_manual_override: true,
      override_source: validated.source,
      override_reference: validated.reference || null,
      override_notes: validated.notes || null,
      override_by: session.user.id,
      override_at: now,
      energy_kcal: validated.energy_kcal,
      energy_kj: validated.energy_kj || Math.round(validated.energy_kcal * 4.184),
      protein_g: validated.protein_g,
      fat_g: validated.fat_g,
      saturated_fat_g: validated.saturated_fat_g ?? null,
      trans_fat_g: validated.trans_fat_g ?? null,
      carbohydrate_g: validated.carbohydrate_g,
      sugar_g: validated.sugar_g ?? null,
      added_sugar_g: validated.added_sugar_g ?? null,
      fiber_g: validated.fiber_g ?? null,
      sodium_mg: validated.sodium_mg ?? null,
      salt_g: validated.salt_g,
      cholesterol_mg: validated.cholesterol_mg ?? null,
      vitamin_d_mcg: validated.vitamin_d_mcg ?? null,
      calcium_mg: validated.calcium_mg ?? null,
      iron_mg: validated.iron_mg ?? null,
      potassium_mg: validated.potassium_mg ?? null,
      updated_at: now,
    }

    // Upsert nutrition record
    const { data: result, error: upsertError } = await supabase
      .from('product_nutrition')
      .upsert(nutritionData, {
        onConflict: 'org_id,product_id',
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error updating product nutrition:', upsertError)
      return NextResponse.json(
        { error: 'Failed to update nutrition data', details: upsertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      nutrition: result,
      message: 'Nutrition data updated successfully'
    })

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error in PUT /api/technical/nutrition/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
