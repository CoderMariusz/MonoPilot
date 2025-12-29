/**
 * Traceability Config API Route - Story 02.10a
 * GET/PUT /api/v1/technical/products/:id/traceability-config
 *
 * Purpose: CRUD operations for product-level traceability configuration
 *
 * Authentication: Required
 * Authorization:
 * - GET: Any authenticated user with technical.R permission
 * - PUT: Technical write permission (PROD_MANAGER, ADMIN, SUPER_ADMIN)
 *
 * Security:
 * - Multi-tenancy via org_id isolation (RLS)
 * - Returns 404 (not 403) for cross-tenant access to prevent org discovery
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { traceabilityConfigSchema } from '@/lib/validation/traceability'
import { ZodError } from 'zod'
import type { TraceabilityConfig } from '@/lib/types/traceability'

/**
 * Default configuration values for products without saved config
 */
const DEFAULT_CONFIG: Partial<TraceabilityConfig> = {
  lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
  lot_number_prefix: 'LOT-',
  lot_number_sequence_length: 6,
  traceability_level: 'lot',
  standard_batch_size: null,
  min_batch_size: null,
  max_batch_size: null,
  expiry_calculation_method: 'fixed_days',
  processing_buffer_days: 0,
  gs1_lot_encoding_enabled: false,
  gs1_expiry_encoding_enabled: false,
  gs1_sscc_enabled: false
}

/**
 * GET /api/v1/technical/products/:id/traceability-config
 * Get traceability configuration for a product
 *
 * Returns:
 * - 200: TraceabilityConfig (or defaults with _isDefault flag)
 * - 401: Unauthorized
 * - 404: Product not found
 * - 500: Internal Server Error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify product exists and belongs to user's org
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('org_id', userData.org_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get traceability config
    const { data: config, error: configError } = await supabase
      .from('product_traceability_config')
      .select('*')
      .eq('product_id', productId)
      .single()

    // Handle not found - return defaults
    if (configError && configError.code === 'PGRST116') {
      return NextResponse.json(
        {
          ...DEFAULT_CONFIG,
          product_id: productId,
          _isDefault: true
        },
        { status: 200 }
      )
    }

    // Handle other errors
    if (configError) {
      console.error('Error fetching traceability config:', configError)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    return NextResponse.json(config, { status: 200 })
  } catch (error: unknown) {
    console.error('Error in GET /api/v1/technical/products/:id/traceability-config:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * PUT /api/v1/technical/products/:id/traceability-config
 * Create or update traceability configuration for a product
 *
 * Body: TraceabilityConfigInput
 *
 * Returns:
 * - 200: TraceabilityConfig (updated)
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (insufficient permissions)
 * - 404: Product not found
 * - 500: Internal Server Error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user org_id and check permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        `
        org_id,
        role:roles (
          code,
          permissions
        )
      `
      )
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Technical write permission (C or U)
    const techPerm = (userData.role as { permissions?: { technical?: string } })?.permissions
      ?.technical || ''
    if (!techPerm.includes('C') && !techPerm.includes('U')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify product exists and belongs to user's org
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('org_id', userData.org_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const validation = traceabilityConfigSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS for upsert
    const supabaseAdmin = createServerSupabaseAdmin()

    // Upsert config
    const { data: config, error: upsertError } = await supabaseAdmin
      .from('product_traceability_config')
      .upsert(
        {
          product_id: productId,
          org_id: userData.org_id,
          ...validation.data,
          updated_by: user.id
        },
        { onConflict: 'product_id' }
      )
      .select()
      .single()

    if (upsertError) {
      console.error('Error upserting traceability config:', upsertError)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    return NextResponse.json(config, { status: 200 })
  } catch (error: unknown) {
    console.error('Error in PUT /api/v1/technical/products/:id/traceability-config:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
