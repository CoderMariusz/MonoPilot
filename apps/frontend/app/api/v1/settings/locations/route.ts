/**
 * API Route: /api/v1/settings/locations
 * Story: 01.9 - Warehouse Locations Management
 * Methods: GET (list)
 *
 * Provides flat or hierarchical list of locations for dropdowns
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/v1/settings/locations
 * List locations with optional view format
 *
 * Query Parameters:
 * - view: 'flat' | 'hierarchical' (default: flat)
 * - warehouse_id: Filter by warehouse UUID (optional)
 * - active_only: Filter active only (default: true)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabase()

        // Get authenticated user
        const {
            data: { user },
            error: authError,
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
            return NextResponse.json({ error: 'User not found' }, { status: 401 })
        }

        const orgId = userData.org_id

        // Parse query parameters
        const searchParams = request.nextUrl.searchParams
        const view = searchParams.get('view') || 'flat'
        const warehouseId = searchParams.get('warehouse_id') || undefined
        const activeOnly = searchParams.get('active_only') !== 'false'

        // Build query
        let query = supabase
            .from('locations')
            .select(`
        id,
        code,
        name,
        full_path,
        level,
        depth,
        location_type,
        warehouse_id,
        parent_id,
        is_active,
        warehouse:warehouses(id, code, name)
      `)
            .eq('org_id', orgId)

        // Apply filters
        if (warehouseId) {
            query = query.eq('warehouse_id', warehouseId)
        }

        if (activeOnly) {
            query = query.eq('is_active', true)
        }

        // Order by full_path for consistent display
        query = query.order('full_path', { ascending: true })

        // Execute query
        const { data: locations, error } = await query

        if (error) {
            console.error('Failed to fetch locations:', error)
            return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
        }

        return NextResponse.json({
            locations: locations || [],
            view,
        })
    } catch (error) {
        console.error('Error in GET /api/v1/settings/locations:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
