import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import {
  CreateLocationSchema,
  LocationFiltersSchema,
} from '@/lib/validation/location-schemas'
import { createLocation } from '@/lib/services/location-service'
import { ZodError } from 'zod'

/**
 * Location Management API Routes
 * Story: 1.6 Location Management
 * Task 5: API Endpoints
 *
 * GET /api/settings/locations - List locations with filters
 * POST /api/settings/locations - Create new location
 */

// ============================================================================
// LEGACY FORMAT MAPPING (Story 01.9 → Story 1.6)
// ============================================================================

/**
 * Maps hierarchical location_type to legacy type enum
 * Story 01.9 uses: bulk, pallet, shelf, floor, staging
 * Story 1.6 uses: receiving, production, storage, shipping, transit, quarantine
 */
const LOCATION_TYPE_TO_LEGACY: Record<string, string> = {
  bulk: 'storage',
  pallet: 'storage',
  shelf: 'storage',
  floor: 'storage',
  staging: 'transit',
}

/**
 * Maps hierarchical level to legacy type enum (fallback)
 */
const LEVEL_TO_LEGACY_TYPE: Record<string, string> = {
  zone: 'receiving',
  aisle: 'storage',
  rack: 'storage',
  bin: 'storage',
}

interface LegacyLocation {
  id: string
  warehouse_id: string
  code: string
  name: string
  type: string
  zone: string | null
  zone_enabled: boolean
  capacity: number | null
  capacity_enabled: boolean
  barcode: string
  is_active: boolean
  warehouse?: {
    code: string
    name: string
  }
}

/**
 * Convert hierarchical location (Story 01.9) to legacy format (Story 1.6)
 */
function toLegacyLocation(loc: Record<string, unknown>, warehouse?: { code: string; name: string }): LegacyLocation {
  const locationType = loc.location_type as string
  const level = loc.level as string
  const maxPallets = loc.max_pallets as number | null
  
  return {
    id: loc.id as string,
    warehouse_id: loc.warehouse_id as string,
    code: loc.code as string,
    name: loc.name as string,
    // Map location_type or level to legacy type
    type: LOCATION_TYPE_TO_LEGACY[locationType] || LEVEL_TO_LEGACY_TYPE[level] || 'storage',
    // Use level as zone indicator (e.g., "Zone: aisle")
    zone: level !== 'zone' ? level : null,
    zone_enabled: level !== 'zone',
    // Map max_pallets to capacity
    capacity: maxPallets,
    capacity_enabled: maxPallets !== null,
    // Generate barcode from code or full_path
    barcode: `LOC-${(loc.code as string).toUpperCase()}`,
    is_active: loc.is_active as boolean,
    warehouse: warehouse,
  }
}

// ============================================================================
// GET /api/settings/locations - List Locations (AC-005.4)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const warehouse_id = searchParams.get('warehouse_id')
    const type = searchParams.get('type')
    const is_active = searchParams.get('is_active')
    const search = searchParams.get('search')

    // Determine warehouse ID
    let warehouseId = warehouse_id || ''
    if (!warehouseId) {
      // Get the first warehouse for the org if not specified
      const { data: warehouse } = await supabaseAdmin
        .from('warehouses')
        .select('id')
        .eq('org_id', currentUser.org_id)
        .limit(1)
        .single()
      if (warehouse) {
        warehouseId = warehouse.id
      }
    }

    // If no warehouse exists, return empty locations array
    if (!warehouseId) {
      return NextResponse.json({ locations: [] }, { status: 200 })
    }

    // Build direct query using admin client (bypasses RLS, we filter by org_id manually)
    let query = supabaseAdmin
      .from('locations')
      .select(`
        id,
        org_id,
        warehouse_id,
        code,
        name,
        level,
        location_type,
        max_pallets,
        max_weight_kg,
        is_active,
        full_path,
        warehouse:warehouses(code, name)
      `)
      .eq('org_id', currentUser.org_id)
      .eq('warehouse_id', warehouseId)

    // Apply filters
    if (type) {
      // Map legacy type to location_type filter
      const locationTypeMapping: Record<string, string[]> = {
        receiving: ['staging'],
        storage: ['bulk', 'pallet', 'shelf', 'floor'],
        shipping: ['staging'],
        transit: ['staging'],
        quarantine: ['staging'],
        production: ['floor'],
      }
      const mappedTypes = locationTypeMapping[type] || [type]
      query = query.in('location_type', mappedTypes)
    }

    if (is_active === 'active' || is_active === 'true') {
      query = query.eq('is_active', true)
    } else if (is_active === 'false') {
      query = query.eq('is_active', false)
    }
    // 'all' means no filter

    if (search) {
      const searchTerm = `%${search}%`
      query = query.or(`code.ilike.${searchTerm},name.ilike.${searchTerm},full_path.ilike.${searchTerm}`)
    }

    query = query.order('full_path', { ascending: true })

    const { data: locations, error } = await query

    if (error) {
      console.error('Failed to fetch locations:', error)
      return NextResponse.json({ locations: [] }, { status: 200 })
    }

    // Convert to legacy format for frontend compatibility
    const legacyLocations = (locations || []).map((loc) => {
      // Supabase returns single object for single relations, handle both cases
      const warehouseData = loc.warehouse
      const warehouse = Array.isArray(warehouseData) 
        ? warehouseData[0] as { code: string; name: string } | undefined
        : warehouseData as { code: string; name: string } | null
      return toLegacyLocation(loc, warehouse || undefined)
    })

    return NextResponse.json({ locations: legacyLocations }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/settings/locations:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/settings/locations - Create Location (AC-005.1, AC-005.2, AC-005.3)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check role and org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization: Admin only (AC-005.1)
    const roleCode = (currentUser.role as unknown as { code: string } | null)?.code?.toLowerCase() ?? ''
    if (roleCode !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    
    // warehouse_id is required for creating a location
    if (!body.warehouse_id) {
      return NextResponse.json(
        { error: 'warehouse_id is required' },
        { status: 400 }
      )
    }

    // Map legacy format (Story 1.6) to hierarchical format (Story 01.9)
    const LEGACY_TYPE_TO_LOCATION_TYPE: Record<string, string> = {
      receiving: 'staging',
      production: 'floor',
      storage: 'shelf',
      shipping: 'staging',
      transit: 'staging',
      quarantine: 'staging',
    }

    const mappedBody = {
      ...body,
      // Default to 'zone' level for root locations (flat structure for legacy)
      level: body.level || 'zone',
      // Map legacy type to location_type
      location_type: body.location_type || LEGACY_TYPE_TO_LOCATION_TYPE[body.type] || 'shelf',
      // Map legacy capacity to max_pallets
      max_pallets: body.max_pallets ?? (body.capacity_enabled ? body.capacity : null),
      // Ensure code is uppercase
      code: body.code?.toUpperCase(),
    }

    const validatedData = CreateLocationSchema.parse(mappedBody)

    // Call service to create location
    const result = await createLocation(
      body.warehouse_id,
      validatedData,
      session.user.id,
      currentUser.org_id
    )

    if (!result.success) {
      // Check for specific error types
      if (result.error?.includes('already exists')) {
        return NextResponse.json({ error: result.error }, { status: 409 })
      }

      if (result.error?.includes('not found')) {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }

      return NextResponse.json(
        { error: result.error || 'Failed to create location' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        location: result.data,
        message: 'Location created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/settings/locations:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
