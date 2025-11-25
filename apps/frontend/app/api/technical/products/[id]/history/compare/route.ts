/**
 * API Route: /api/technical/products/[id]/history/compare
 * Story 2.3: Product History - Compare two versions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { versionCompareQuerySchema } from '@/lib/validation/product-schemas'
import { ZodError } from 'zod'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/technical/products/[id]/history/compare?v1=1.0&v2=1.5
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

    // Parse query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries())
    const params = versionCompareQuerySchema.parse(searchParams)

    // Verify product exists
    const { data: product } = await supabase
      .from('products')
      .select('id, version')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get version history entries for both versions
    const { data: history, error } = await supabase
      .from('product_version_history')
      .select('version, changed_fields')
      .eq('product_id', id)
      .eq('org_id', orgId)
      .in('version', [params.v1, params.v2])
      .order('version', { ascending: true })

    if (error) {
      console.error('Error fetching version history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch version history', details: error.message },
        { status: 500 }
      )
    }

    if (!history || history.length < 2) {
      return NextResponse.json(
        { error: 'One or both versions not found' },
        { status: 404 }
      )
    }

    // Build cumulative state for each version
    const buildVersionState = async (targetVersion: number) => {
      const { data: changes } = await supabase
        .from('product_version_history')
        .select('version, changed_fields')
        .eq('product_id', id)
        .eq('org_id', orgId)
        .lte('version', targetVersion)
        .order('version', { ascending: true })

      const state: Record<string, any> = {}

      changes?.forEach((change: any) => {
        const fields = change.changed_fields as Record<string, { old: any; new: any }>
        Object.entries(fields).forEach(([field, { new: newValue }]) => {
          state[field] = newValue
        })
      })

      return state
    }

    const [state1, state2] = await Promise.all([
      buildVersionState(params.v1),
      buildVersionState(params.v2)
    ])

    // Compare states
    const allFields = new Set([...Object.keys(state1), ...Object.keys(state2)])
    const differences = Array.from(allFields)
      .map(field => {
        const v1Value = state1[field]
        const v2Value = state2[field]

        if (v1Value === undefined && v2Value !== undefined) {
          return {
            field,
            v1_value: null,
            v2_value: v2Value,
            status: 'added' as const
          }
        } else if (v1Value !== undefined && v2Value === undefined) {
          return {
            field,
            v1_value: v1Value,
            v2_value: null,
            status: 'removed' as const
          }
        } else if (v1Value !== v2Value) {
          return {
            field,
            v1_value: v1Value,
            v2_value: v2Value,
            status: 'changed' as const
          }
        }
        return null
      })
      .filter(Boolean)

    return NextResponse.json({
      v1: params.v1,
      v2: params.v2,
      differences
    })

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error in GET /api/technical/products/[id]/history/compare:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
