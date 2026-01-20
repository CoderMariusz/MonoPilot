/**
 * BOM API Routes (Story 02.4 - Track C)
 *
 * GET /api/v1/technical/boms - List BOMs with pagination, search, and filters
 * POST /api/v1/technical/boms - Create new BOM with auto-versioning
 *
 * Auth: Required
 * POST Roles: ADMIN, SUPER_ADMIN, PRODUCTION_MANAGER (technical role)
 * GET Roles: All authenticated users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'
import type { BOMsListResponse, BOMWithProduct, CreateBOMRequest } from '@/lib/types/bom'
import { API_TO_DB_STATUS } from '@/lib/validation/bom-schema'

// Validation schema for create BOM
const createBOMSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  effective_from: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  effective_to: z.string().refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid date').nullable().optional(),
  status: z.enum(['draft', 'active']).default('draft'),
  output_qty: z.number().positive('Output quantity must be greater than 0').max(999999999, 'Output quantity too large'),
  output_uom: z.string().min(1, 'Unit of measure is required').max(20),
  notes: z.string().max(2000).optional().nullable(),
}).refine(
  (data) => {
    if (data.effective_to && data.effective_from) {
      return new Date(data.effective_to) > new Date(data.effective_from)
    }
    return true
  },
  {
    message: 'Effective To must be after Effective From',
    path: ['effective_to'],
  }
)

// Query validation schema
const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  status: z.enum(['draft', 'active', 'phased_out', 'inactive']).optional(),
  product_type: z.string().optional(),
  effective_date: z.enum(['current', 'future', 'expired']).optional(),
  product_id: z.string().uuid().optional(),
  sortBy: z.string().default('effective_from'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * GET /api/v1/technical/boms
 * List BOMs with pagination, search, and filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryResult = listQuerySchema.safeParse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 50,
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      product_type: searchParams.get('product_type'),
      effective_date: searchParams.get('effective_date'),
      product_id: searchParams.get('product_id'),
      sortBy: searchParams.get('sortBy') || 'effective_from',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: queryResult.error.errors },
        { status: 400 }
      )
    }

    const { page, limit, search, status, product_type, effective_date, product_id, sortBy, sortOrder } = queryResult.data

    // Build query - RLS applied automatically via org_id
    let query = supabase
      .from('boms')
      .select(`
        *,
        product:products!product_id (
          id,
          code,
          name,
          type,
          uom
        )
      `, { count: 'exact' })
      .eq('org_id', userData.org_id)

    // Apply filters
    if (status) {
      // Use shared status mapping constant (DRY)
      query = query.eq('status', API_TO_DB_STATUS[status] || status)
    }

    if (product_id) {
      query = query.eq('product_id', product_id)
    }

    if (effective_date) {
      const today = new Date().toISOString().split('T')[0]
      if (effective_date === 'current') {
        // Active today: effective_from <= today AND (effective_to IS NULL OR effective_to >= today)
        query = query.lte('effective_from', today)
        query = query.or(`effective_to.gte.${today},effective_to.is.null`)
      } else if (effective_date === 'future') {
        // Future: effective_from > today
        query = query.gt('effective_from', today)
      } else if (effective_date === 'expired') {
        // Expired: effective_to < today
        query = query.lt('effective_to', today)
      }
    }

    // Note: search on related product fields requires post-filtering or a view
    // For now, we'll do client-side filtering if search is provided
    // This is a limitation - in production, use a database view or function

    // Apply sorting
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Post-filter by search if provided (searches product code/name)
    let filteredData = data || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredData = filteredData.filter((bom: any) => {
        const product = bom.product
        if (!product) return false
        return (
          product.code?.toLowerCase().includes(searchLower) ||
          product.name?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Post-filter by product_type if provided
    if (product_type) {
      filteredData = filteredData.filter((bom: any) => {
        return bom.product?.type === product_type
      })
    }

    // Format response
    const response: BOMsListResponse = {
      boms: filteredData as BOMWithProduct[],
      total: count || 0,
      page,
      limit,
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST /api/v1/technical/boms
 * Create new BOM with auto-versioning
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user org_id and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        org_id,
        role:roles (
          code,
          permissions
        )
      `)
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - need Technical write permission (C for create)
    const techPerm = (userData.role as any)?.permissions?.technical || ''
    const roleCode = (userData.role as any)?.code || ''

    // Allow: admin, super_admin, or users with Technical C permission
    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin'
    const hasTechWrite = techPerm.includes('C')

    if (!isAdmin && !hasTechWrite) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createBOMSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', data.product_id)
      .eq('org_id', userData.org_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
        { status: 404 }
      )
    }

    // Check for existing BOM with NULL effective_to (only one allowed per product)
    if (data.effective_to === null || data.effective_to === undefined) {
      const { data: existingOngoing, error: ongoingError } = await supabase
        .from('boms')
        .select('id, version')
        .eq('product_id', data.product_id)
        .eq('org_id', userData.org_id)
        .is('effective_to', null)
        .limit(1)

      if (!ongoingError && existingOngoing && existingOngoing.length > 0) {
        return NextResponse.json(
          { error: 'MULTIPLE_ONGOING', message: 'Only one BOM can have no end date per product' },
          { status: 400 }
        )
      }
    }

    // Check for date overlap with existing BOMs
    const { data: overlappingBOMs, error: overlapError } = await supabase
      .from('boms')
      .select('id, version, effective_from, effective_to')
      .eq('product_id', data.product_id)
      .eq('org_id', userData.org_id)

    if (!overlapError && overlappingBOMs) {
      const newFrom = new Date(data.effective_from)
      const newTo = data.effective_to ? new Date(data.effective_to) : null

      for (const existing of overlappingBOMs) {
        const existingFrom = new Date(existing.effective_from)
        const existingTo = existing.effective_to ? new Date(existing.effective_to) : null

        // Check overlap: ranges overlap if NOT (newTo < existingFrom OR newFrom > existingTo)
        // Handle null (ongoing) cases
        const newEndsBeforeExisting = newTo && newTo < existingFrom
        const newStartsAfterExisting = existingTo && newFrom > existingTo

        if (!newEndsBeforeExisting && !newStartsAfterExisting) {
          return NextResponse.json(
            {
              error: 'DATE_OVERLAP',
              message: `Date range overlaps with existing BOM v${existing.version} (${existing.effective_from} to ${existing.effective_to || 'ongoing'})`,
            },
            { status: 400 }
          )
        }
      }
    }

    // Get next version number
    const { data: maxVersionBom, error: versionError } = await supabase
      .from('boms')
      .select('version')
      .eq('product_id', data.product_id)
      .eq('org_id', userData.org_id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextVersion = (maxVersionBom?.version || 0) + 1

    // Insert new BOM
    const { data: newBom, error: insertError } = await supabase
      .from('boms')
      .insert({
        org_id: userData.org_id,
        product_id: data.product_id,
        version: nextVersion,
        bom_type: 'standard',
        effective_from: data.effective_from,
        effective_to: data.effective_to || null,
        status: API_TO_DB_STATUS[data.status] || 'draft',
        output_qty: data.output_qty,
        output_uom: data.output_uom,
        notes: data.notes || null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select(`
        *,
        product:products!product_id (
          id,
          code,
          name,
          type,
          uom
        )
      `)
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(newBom as BOMWithProduct, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
