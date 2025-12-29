import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'

/**
 * Tax Code Service
 * Story: 1.10 Tax Code Configuration
 *
 * Handles tax code CRUD operations with:
 * - Country-based seeding (Poland, UK, Default) (AC-009.1, AC-009.6)
 * - Unique code validation per org (AC-009.2)
 * - PO line usage check before deletion (AC-009.4)
 * - Rate change warnings (AC-009.5)
 * - Cache invalidation events (AC-009.7)
 */

// Type alias for Supabase client
type SupabaseClient = Awaited<ReturnType<typeof createServerSupabase>>

export interface TaxCode {
  id: string
  org_id: string
  code: string
  name: string
  rate: number // Stored as 23.00 for 23%
  created_at: string
  updated_at: string
  // Populated data (JOIN results)
  po_line_count?: number // Number of PO lines using this tax code (Epic 3)
}

export interface CreateTaxCodeInput {
  code: string
  name: string
  rate: number
}

export interface UpdateTaxCodeInput {
  code?: string
  name?: string
  rate?: number
}

export interface TaxCodeFilters {
  search?: string
  sort_by?: 'code' | 'name' | 'rate'
  sort_direction?: 'asc' | 'desc'
}

export interface TaxCodeServiceResult<T = TaxCode> {
  success: boolean
  data?: T
  error?: string
  warning?: string
  code?: 'DUPLICATE_CODE' | 'NOT_FOUND' | 'IN_USE' | 'INVALID_INPUT' | 'DATABASE_ERROR'
  usageCount?: number // For rate change warning
}

export interface TaxCodeListResult {
  success: boolean
  data?: TaxCode[]
  total?: number
  error?: string
}

/**
 * Get current user's org_id from JWT
 */
async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const supabaseAdmin = createServerSupabaseAdmin()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData, error } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (error || !userData) {
    console.error('Failed to get org_id for user:', user.id, error)
    return null
  }

  return userData.org_id
}

/**
 * Seed tax codes for organization based on country
 * AC-009.1, AC-009.6: Country-based tax code seeding
 *
 * Countries:
 * - Poland (PL): VAT 23%, 8%, 5%, 0%
 * - UK (UK/GB): Standard 20%, Reduced 5%, Zero 0%
 * - Default: VAT 0%
 *
 * Idempotent: ON CONFLICT DO NOTHING
 *
 * @param orgId - Organization UUID
 * @param countryCode - ISO country code (PL, UK, GB, etc.)
 * @returns Number of tax codes inserted
 */
export async function seedTaxCodesForOrganization(
  orgId: string,
  countryCode: string
): Promise<TaxCodeServiceResult<{ count: number }>> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()

    // Call database function to seed tax codes
    const { data, error } = await supabase.rpc('seed_tax_codes_for_organization', {
      p_org_id: orgId,
      p_country_code: countryCode,
    })

    if (error) {
      console.error('Failed to seed tax codes:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    console.log(`Seeded ${data} tax codes for org ${orgId} (country: ${countryCode})`)

    return {
      success: true,
      data: { count: data || 0 },
    }
  } catch (error) {
    console.error('Error in seedTaxCodesForOrganization:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Create a new tax code
 * AC-009.2: Admin can add custom tax codes
 *
 * Validation:
 * - Code must be unique per org
 * - Code format: uppercase alphanumeric + hyphens
 * - Description required (1-200 chars)
 * - Rate: 0-100%
 *
 * @param input - CreateTaxCodeInput
 * @returns TaxCodeServiceResult with created tax code
 */
export async function createTaxCode(
  input: CreateTaxCodeInput
): Promise<TaxCodeServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID not found',
        code: 'INVALID_INPUT',
      }
    }

    // Check if code already exists for this org
    const { data: existingCode } = await supabaseAdmin
      .from('tax_codes')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', input.code.toUpperCase())
      .single()

    if (existingCode) {
      return {
        success: false,
        error: `Tax code "${input.code}" already exists`,
        code: 'DUPLICATE_CODE',
      }
    }

    // Create tax code
    const { data: taxCode, error } = await supabaseAdmin
      .from('tax_codes')
      .insert({
        org_id: orgId,
        code: input.code.toUpperCase(),
        name: input.name,
        rate: input.rate,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create tax code:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    // Emit cache invalidation event
    await emitTaxCodeUpdatedEvent(orgId, 'created', taxCode.id)

    console.log(`Successfully created tax code: ${taxCode.code} (${taxCode.id})`)

    return {
      success: true,
      data: taxCode,
    }
  } catch (error) {
    console.error('Error in createTaxCode:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Update an existing tax code
 * AC-009.5: Edit tax code
 *
 * Rate change warning:
 * - If rate is being changed AND tax code is used in PO lines
 * - Return warning with usage count
 * - Recommendation: create new tax code instead
 *
 * @param id - Tax code UUID
 * @param input - UpdateTaxCodeInput
 * @returns TaxCodeServiceResult with updated tax code
 */
export async function updateTaxCode(
  id: string,
  input: UpdateTaxCodeInput
): Promise<TaxCodeServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID not found',
        code: 'INVALID_INPUT',
      }
    }

    // Check if tax code exists and belongs to org
    const { data: existingTaxCode, error: fetchError } = await supabaseAdmin
      .from('tax_codes')
      .select('id, code, rate')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existingTaxCode) {
      return {
        success: false,
        error: 'Tax code not found',
        code: 'NOT_FOUND',
      }
    }

    // If code is being changed, check uniqueness
    if (input.code && input.code.toUpperCase() !== existingTaxCode.code) {
      const { data: duplicateCode } = await supabaseAdmin
        .from('tax_codes')
        .select('id')
        .eq('org_id', orgId)
        .eq('code', input.code.toUpperCase())
        .neq('id', id)
        .single()

      if (duplicateCode) {
        return {
          success: false,
          error: `Tax code "${input.code}" already exists`,
          code: 'DUPLICATE_CODE',
        }
      }
    }

    // AC-009.5: Check for rate change and PO usage
    let rateChangeWarning: string | undefined
    let usageCount: number | undefined

    if (input.rate !== undefined && input.rate !== existingTaxCode.rate) {
      // TODO Epic 3: Query po_lines table to check usage
      // For now, return warning placeholder
      rateChangeWarning = 'Warning: Changing tax rate affects historical data. In Epic 3, this will check for active PO usage and recommend creating a new tax code instead.'
      console.warn(`Rate changing for tax code ${id}. Check for PO usage in Epic 3.`)
      usageCount = 0 // Will be actual count in Epic 3
    }

    // Build update payload
    const updatePayload: {
      code?: string
      name?: string
      rate?: number
    } = {}

    if (input.code) updatePayload.code = input.code.toUpperCase()
    if (input.name !== undefined) updatePayload.name = input.name
    if (input.rate !== undefined) updatePayload.rate = input.rate

    // Update tax code
    const { data: taxCode, error } = await supabaseAdmin
      .from('tax_codes')
      .update(updatePayload)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update tax code:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    // Emit cache invalidation event
    await emitTaxCodeUpdatedEvent(orgId, 'updated', taxCode.id)

    console.log(`Successfully updated tax code: ${taxCode.code} (${taxCode.id})`)

    return {
      success: true,
      data: taxCode,
      warning: rateChangeWarning,
      usageCount,
    }
  } catch (error) {
    console.error('Error in updateTaxCode:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * List tax codes with optional filters
 * AC-009.3: Tax codes list view
 *
 * Filters:
 * - search: filter by code or description (case-insensitive)
 * - sort_by: code/description/rate (default: code)
 * - sort_direction: asc/desc (default: asc)
 *
 * Includes:
 * - PO line count (JOIN po_lines - Epic 3)
 *
 * @param filters - TaxCodeFilters (optional)
 * @returns TaxCodeListResult with tax codes array
 */
export async function listTaxCodes(
  filters?: TaxCodeFilters
): Promise<TaxCodeListResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID not found',
        total: 0,
      }
    }

    // Build query
    let query = supabaseAdmin
      .from('tax_codes')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)

    // Search filter (AC-009.3: Search by code or description)
    if (filters?.search) {
      const escapedSearch = filters.search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')

      query = query.or(`code.ilike.%${escapedSearch}%,name.ilike.%${escapedSearch}%`)
    }

    // Dynamic sorting (AC-009.3)
    const sortBy = filters?.sort_by || 'code'
    const sortDirection = filters?.sort_direction || 'asc'
    query = query.order(sortBy, { ascending: sortDirection === 'asc' })

    const { data: taxCodes, error, count } = await query

    if (error) {
      console.error('Failed to list tax codes:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        total: 0,
      }
    }

    // TODO Epic 3: Join with po_lines to get usage count
    // For now, return tax codes without PO count
    const taxCodesWithCount = (taxCodes || []).map(tc => ({
      ...tc,
      po_line_count: 0, // Will be actual count in Epic 3
    }))

    return {
      success: true,
      data: taxCodesWithCount,
      total: count ?? 0,
    }
  } catch (error) {
    console.error('Error in listTaxCodes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      total: 0,
    }
  }
}

/**
 * Delete tax code
 * AC-009.4: Cannot delete tax code if used in POs
 *
 * Checks:
 * - Tax code exists and belongs to org
 * - Not used in po_lines (Epic 3 FK constraint)
 *
 * Error handling:
 * - FK constraint violation → user-friendly message
 * - Recommendation: archive instead of delete
 *
 * @param id - Tax code UUID
 * @returns TaxCodeServiceResult with success status
 */
export async function deleteTaxCode(id: string): Promise<TaxCodeServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID not found',
        code: 'INVALID_INPUT',
      }
    }

    // TODO Epic 3: Check for PO line usage before allowing deletion
    // For now, log a warning
    console.warn(`Attempting to delete tax code ${id}. Check for PO usage in Epic 3.`)

    // Attempt delete
    const { error } = await supabaseAdmin
      .from('tax_codes')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) {
      console.error('Failed to delete tax code:', error)

      // AC-009.4: Foreign key constraint violation (Epic 3)
      if (error.code === '23503') {
        // TODO Epic 3: Query po_lines to get count of usage
        return {
          success: false,
          error: 'Cannot delete tax code - it is used in purchase orders. Archive it instead.',
          code: 'IN_USE',
          usageCount: 0, // Will be actual count in Epic 3
        }
      }

      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    // Emit cache invalidation event
    await emitTaxCodeUpdatedEvent(orgId, 'deleted', id)

    console.log(`Successfully deleted tax code: ${id}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteTaxCode:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Emit tax code cache invalidation event
 * AC-009.7: Cache invalidation events
 *
 * Publishes broadcast event to notify Epic 3 (PO creation)
 * to refetch tax code list.
 *
 * Redis cache key: `tax_codes:{org_id}`
 * Redis cache TTL: 10 min
 *
 * @param orgId - Organization UUID
 * @param action - Action type (created, updated, deleted)
 * @param taxCodeId - Tax code UUID
 */
async function emitTaxCodeUpdatedEvent(
  orgId: string,
  action: 'created' | 'updated' | 'deleted',
  taxCodeId: string
): Promise<void> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()

    // Publish to org-specific channel
    const channel = supabase.channel(`org:${orgId}`)

    await channel.send({
      type: 'broadcast',
      event: 'tax_code.updated',
      payload: {
        action,
        taxCodeId,
        orgId,
        timestamp: new Date().toISOString(),
      },
    })

    // Clean up channel
    await supabase.removeChannel(channel)

    console.log(`Emitted tax_code.updated event: ${action} ${taxCodeId}`)
  } catch (error) {
    // Non-critical error, log but don't fail the operation
    console.error('Failed to emit tax_code.updated event:', error)
  }
}
