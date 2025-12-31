/**
 * Supplier Service
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * Handles supplier CRUD operations with business logic:
 * - List suppliers with filters, search, and pagination
 * - Create/update/delete suppliers
 * - Code generation and uniqueness validation
 * - Business rules: canDelete, canDeactivate
 * - Bulk operations (activate/deactivate)
 * - Summary KPIs
 *
 * @module supplier-service
 */

import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import type {
  SupplierFormData,
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierListQuery,
} from '../validation/supplier-schema'

// ============================================================================
// TYPES
// ============================================================================

export interface Supplier {
  id: string
  org_id: string
  code: string
  name: string
  address: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  currency: string
  tax_code_id: string | null
  payment_terms: string
  notes: string | null
  is_active: boolean
  approved_supplier: boolean
  supplier_rating: number | null
  last_audit_date: string | null
  next_audit_due: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Computed/joined fields
  tax_code?: {
    id: string
    code: string
    name: string
    rate: number
  } | null
  products_count?: number
  has_open_pos?: boolean
}

export interface SupplierSummary {
  total_count: number
  active_count: number
  inactive_count: number
  active_rate: number
  this_month_count: number
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

export interface ValidationResult {
  allowed: boolean
  reason?: string
  details?: Record<string, unknown>
}

export interface BulkActionResult {
  success_count: number
  failed_count: number
  results: Array<{
    id: string
    status: 'success' | 'failed'
    error?: string
  }>
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get current user's org_id from JWT
 */
async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
 * Get current user's ID
 */
async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

/**
 * Calculate active rate percentage
 */
function calculateActiveRate(active: number, total: number): number {
  if (total === 0) return 0
  return Math.round((active / total) * 10000) / 100 // 2 decimal places
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * List suppliers with filters, search, and pagination
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated list of suppliers with metadata
 */
export async function listSuppliers(params: SupplierListQuery = {}): Promise<{
  data: Supplier[]
  meta: PaginationMeta
}> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    throw new Error('Organization not found')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  const {
    status = 'all',
    currency,
    payment_terms,
    search,
    page = 1,
    limit = 20,
    sort = 'code',
    order = 'asc',
  } = params

  // Build query
  let query = supabaseAdmin
    .from('suppliers')
    .select(
      `
      *,
      tax_code:tax_codes(id, code, name, rate)
    `,
      { count: 'exact' }
    )
    .eq('org_id', orgId)

  // Status filter
  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'inactive') {
    query = query.eq('is_active', false)
  }

  // Currency filter
  if (currency && currency.length > 0) {
    query = query.in('currency', currency)
  }

  // Payment terms filter
  if (payment_terms) {
    query = query.ilike('payment_terms', `%${payment_terms}%`)
  }

  // Search filter (code, name, contact_name, email, phone)
  if (search) {
    const escapedSearch = search.replace(/[%_\\]/g, '\\$&')
    query = query.or(
      `code.ilike.%${escapedSearch}%,name.ilike.%${escapedSearch}%,contact_name.ilike.%${escapedSearch}%,contact_email.ilike.%${escapedSearch}%,contact_phone.ilike.%${escapedSearch}%`
    )
  }

  // Sorting
  const ascending = order === 'asc'
  query = query.order(sort, { ascending })

  // Pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error listing suppliers:', error)
    throw new Error(`Failed to list suppliers: ${error.message}`)
  }

  const total = count ?? 0
  const pages = Math.ceil(total / limit)

  return {
    data: (data ?? []) as Supplier[],
    meta: {
      total,
      page,
      limit,
      pages,
    },
  }
}

/**
 * Get supplier summary KPIs for dashboard
 *
 * @returns Summary statistics for suppliers
 */
export async function getSupplierSummary(): Promise<SupplierSummary> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    throw new Error('Organization not found')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Get all suppliers for this org
  const { data: suppliers, error } = await supabaseAdmin
    .from('suppliers')
    .select('id, is_active, created_at')
    .eq('org_id', orgId)

  if (error) {
    console.error('Error getting supplier summary:', error)
    throw new Error(`Failed to get supplier summary: ${error.message}`)
  }

  const allSuppliers = suppliers ?? []
  const total_count = allSuppliers.length
  const active_count = allSuppliers.filter((s) => s.is_active).length
  const inactive_count = total_count - active_count
  const active_rate = calculateActiveRate(active_count, total_count)

  // Count suppliers added this month
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const this_month_count = allSuppliers.filter((s) => {
    const createdAt = new Date(s.created_at)
    return createdAt >= thisMonthStart
  }).length

  return {
    total_count,
    active_count,
    inactive_count,
    active_rate,
    this_month_count,
  }
}

/**
 * Get a single supplier by ID
 *
 * @param id - Supplier UUID
 * @returns Supplier with tax code details, or null if not found
 */
export async function getSupplier(id: string): Promise<Supplier | null> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    throw new Error('Organization not found')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('suppliers')
    .select(
      `
      *,
      tax_code:tax_codes(id, code, name, rate),
      created_by_user:users!suppliers_created_by_fkey(id, email),
      updated_by_user:users!suppliers_updated_by_fkey(id, email)
    `
    )
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null
    }
    console.error('Error getting supplier:', error)
    throw new Error(`Failed to get supplier: ${error.message}`)
  }

  return data as Supplier
}

/**
 * Get next available supplier code (SUP-XXX)
 *
 * @returns Next code (e.g., "SUP-001", "SUP-002", etc.)
 */
export async function getNextSupplierCode(): Promise<string> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    throw new Error('Organization not found')
  }

  const supabase = await createServerSupabase()

  const { data, error } = await supabase.rpc('get_next_supplier_code', {
    p_org_id: orgId,
  })

  if (error) {
    console.error('Error getting next supplier code:', error)
    // Fallback: generate code manually
    return 'SUP-001'
  }

  return data ?? 'SUP-001'
}

/**
 * Validate supplier code uniqueness
 *
 * @param code - Supplier code to validate
 * @param excludeId - Exclude this supplier ID (for edit operations)
 * @returns True if code is available
 */
export async function validateSupplierCode(
  code: string,
  excludeId?: string
): Promise<boolean> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    throw new Error('Organization not found')
  }

  const supabase = await createServerSupabase()

  const { data, error } = await supabase.rpc('validate_supplier_code', {
    p_org_id: orgId,
    p_code: code,
    p_exclude_id: excludeId ?? null,
  })

  if (error) {
    console.error('Error validating supplier code:', error)
    return false
  }

  return data === true
}

/**
 * Create a new supplier
 *
 * @param input - Supplier data
 * @returns Created supplier
 */
export async function createSupplier(
  input: CreateSupplierInput
): Promise<Supplier> {
  const orgId = await getCurrentOrgId()
  const userId = await getCurrentUserId()

  if (!orgId) {
    throw new Error('Organization not found')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Check code uniqueness
  const isAvailable = await validateSupplierCode(input.code)
  if (!isAvailable) {
    throw new Error('SUPPLIER_CODE_EXISTS')
  }

  // Verify tax_code_id exists in org
  const { data: taxCode, error: taxCodeError } = await supabaseAdmin
    .from('tax_codes')
    .select('id')
    .eq('id', input.tax_code_id)
    .eq('org_id', orgId)
    .single()

  if (taxCodeError || !taxCode) {
    throw new Error('TAX_CODE_NOT_FOUND')
  }

  // Create supplier
  const { data, error } = await supabaseAdmin
    .from('suppliers')
    .insert({
      org_id: orgId,
      code: input.code.toUpperCase(),
      name: input.name,
      contact_name: input.contact_name ?? null,
      contact_email: input.contact_email ?? null,
      contact_phone: input.contact_phone ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      postal_code: input.postal_code ?? null,
      country: input.country ?? null,
      currency: input.currency,
      tax_code_id: input.tax_code_id,
      payment_terms: input.payment_terms,
      notes: input.notes ?? null,
      is_active: input.is_active ?? true,
      created_by: userId,
      updated_by: userId,
    })
    .select(
      `
      *,
      tax_code:tax_codes(id, code, name, rate)
    `
    )
    .single()

  if (error) {
    console.error('Error creating supplier:', error)
    if (error.code === '23505') {
      throw new Error('SUPPLIER_CODE_EXISTS')
    }
    throw new Error(`Failed to create supplier: ${error.message}`)
  }

  return data as Supplier
}

/**
 * Update an existing supplier
 *
 * @param id - Supplier UUID
 * @param input - Fields to update
 * @returns Updated supplier
 */
export async function updateSupplier(
  id: string,
  input: UpdateSupplierInput
): Promise<Supplier> {
  const orgId = await getCurrentOrgId()
  const userId = await getCurrentUserId()

  if (!orgId) {
    throw new Error('Organization not found')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Fetch existing supplier
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('suppliers')
    .select('id, code')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (fetchError || !existing) {
    throw new Error('SUPPLIER_NOT_FOUND')
  }

  // If code is being changed, check constraints
  if (input.code && input.code.toUpperCase() !== existing.code) {
    // Check if supplier has POs (code is locked if so)
    const dependencyResult = await getSupplierDependencyCounts(id)
    if (dependencyResult.po_count > 0) {
      throw new Error('SUPPLIER_CODE_LOCKED')
    }

    // Check code uniqueness
    const isAvailable = await validateSupplierCode(input.code, id)
    if (!isAvailable) {
      throw new Error('SUPPLIER_CODE_EXISTS')
    }
  }

  // Verify tax_code_id if provided
  if (input.tax_code_id) {
    const { data: taxCode, error: taxCodeError } = await supabaseAdmin
      .from('tax_codes')
      .select('id')
      .eq('id', input.tax_code_id)
      .eq('org_id', orgId)
      .single()

    if (taxCodeError || !taxCode) {
      throw new Error('TAX_CODE_NOT_FOUND')
    }
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }

  if (input.code !== undefined) updatePayload.code = input.code.toUpperCase()
  if (input.name !== undefined) updatePayload.name = input.name
  if (input.contact_name !== undefined) updatePayload.contact_name = input.contact_name
  if (input.contact_email !== undefined) updatePayload.contact_email = input.contact_email
  if (input.contact_phone !== undefined) updatePayload.contact_phone = input.contact_phone
  if (input.address !== undefined) updatePayload.address = input.address
  if (input.city !== undefined) updatePayload.city = input.city
  if (input.postal_code !== undefined) updatePayload.postal_code = input.postal_code
  if (input.country !== undefined) updatePayload.country = input.country
  if (input.currency !== undefined) updatePayload.currency = input.currency
  if (input.tax_code_id !== undefined) updatePayload.tax_code_id = input.tax_code_id
  if (input.payment_terms !== undefined) updatePayload.payment_terms = input.payment_terms
  if (input.notes !== undefined) updatePayload.notes = input.notes
  if (input.is_active !== undefined) updatePayload.is_active = input.is_active

  // Update supplier
  const { data, error } = await supabaseAdmin
    .from('suppliers')
    .update(updatePayload)
    .eq('id', id)
    .eq('org_id', orgId)
    .select(
      `
      *,
      tax_code:tax_codes(id, code, name, rate)
    `
    )
    .single()

  if (error) {
    console.error('Error updating supplier:', error)
    if (error.code === '23505') {
      throw new Error('SUPPLIER_CODE_EXISTS')
    }
    throw new Error(`Failed to update supplier: ${error.message}`)
  }

  return data as Supplier
}

/**
 * Delete a supplier (if no POs or products)
 *
 * @param id - Supplier UUID
 */
export async function deleteSupplier(id: string): Promise<void> {
  const orgId = await getCurrentOrgId()

  if (!orgId) {
    throw new Error('Organization not found')
  }

  // Check if deletion is allowed
  const canDeleteResult = await canDeleteSupplier(id)
  if (!canDeleteResult.allowed) {
    throw new Error(canDeleteResult.reason ?? 'Cannot delete supplier')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  const { error } = await supabaseAdmin
    .from('suppliers')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId)

  if (error) {
    console.error('Error deleting supplier:', error)
    if (error.code === '23503') {
      throw new Error('SUPPLIER_HAS_DEPENDENCIES')
    }
    throw new Error(`Failed to delete supplier: ${error.message}`)
  }
}

/**
 * Check if a supplier can be deleted
 *
 * @param id - Supplier UUID
 * @returns Validation result with reason if not allowed
 */
export async function canDeleteSupplier(id: string): Promise<ValidationResult> {
  const deps = await getSupplierDependencyCounts(id)

  if (deps.po_count > 0) {
    return {
      allowed: false,
      reason: 'SUPPLIER_HAS_PURCHASE_ORDERS',
      details: {
        po_count: deps.po_count,
        open_po_count: deps.open_po_count,
      },
    }
  }

  if (deps.product_count > 0) {
    return {
      allowed: false,
      reason: 'SUPPLIER_HAS_PRODUCTS',
      details: {
        products_count: deps.product_count,
      },
    }
  }

  return { allowed: true }
}

/**
 * Check if a supplier can be deactivated
 *
 * @param id - Supplier UUID
 * @returns Validation result with reason if not allowed
 */
export async function canDeactivateSupplier(
  id: string
): Promise<ValidationResult> {
  const deps = await getSupplierDependencyCounts(id)

  if (deps.open_po_count > 0) {
    return {
      allowed: false,
      reason: 'CANNOT_DEACTIVATE_OPEN_POS',
      details: {
        open_po_count: deps.open_po_count,
      },
    }
  }

  return { allowed: true }
}

/**
 * Get supplier dependency counts (POs, products)
 */
async function getSupplierDependencyCounts(id: string): Promise<{
  po_count: number
  open_po_count: number
  product_count: number
}> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase.rpc('get_supplier_dependency_counts', {
    p_supplier_id: id,
  })

  if (error) {
    console.error('Error getting supplier dependency counts:', error)
    // Default to 0 (allow operations)
    return { po_count: 0, open_po_count: 0, product_count: 0 }
  }

  return {
    po_count: data?.po_count ?? 0,
    open_po_count: data?.open_po_count ?? 0,
    product_count: data?.product_count ?? 0,
  }
}

/**
 * Deactivate a single supplier
 *
 * @param id - Supplier UUID
 * @returns Updated supplier
 */
export async function deactivateSupplier(id: string): Promise<Supplier> {
  // Check if deactivation is allowed
  const canDeactivate = await canDeactivateSupplier(id)
  if (!canDeactivate.allowed) {
    throw new Error(canDeactivate.reason ?? 'Cannot deactivate supplier')
  }

  return updateSupplier(id, { is_active: false })
}

/**
 * Activate a single supplier
 *
 * @param id - Supplier UUID
 * @returns Updated supplier
 */
export async function activateSupplier(id: string): Promise<Supplier> {
  return updateSupplier(id, { is_active: true })
}

/**
 * Bulk deactivate suppliers
 *
 * @param ids - Array of supplier UUIDs
 * @param reason - Optional reason for deactivation
 * @returns Bulk action result with success/failure counts
 */
export async function bulkDeactivateSuppliers(
  ids: string[],
  reason?: string
): Promise<BulkActionResult> {
  const results: BulkActionResult['results'] = []
  let success_count = 0
  let failed_count = 0

  for (const id of ids) {
    try {
      const canDeactivate = await canDeactivateSupplier(id)
      if (!canDeactivate.allowed) {
        results.push({
          id,
          status: 'failed',
          error: getErrorMessage(canDeactivate.reason ?? 'Cannot deactivate'),
        })
        failed_count++
        continue
      }

      await updateSupplier(id, { is_active: false })
      results.push({ id, status: 'success' })
      success_count++
    } catch (error) {
      results.push({
        id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      failed_count++
    }
  }

  return {
    success_count,
    failed_count,
    results,
  }
}

/**
 * Bulk activate suppliers
 *
 * @param ids - Array of supplier UUIDs
 * @returns Bulk action result with success/failure counts
 */
export async function bulkActivateSuppliers(
  ids: string[]
): Promise<BulkActionResult> {
  const results: BulkActionResult['results'] = []
  let success_count = 0
  let failed_count = 0

  for (const id of ids) {
    try {
      await updateSupplier(id, { is_active: true })
      results.push({ id, status: 'success' })
      success_count++
    } catch (error) {
      results.push({
        id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      failed_count++
    }
  }

  return {
    success_count,
    failed_count,
    results,
  }
}

/**
 * Export suppliers to Excel
 *
 * @param params - Export parameters
 * @returns Excel file as Blob
 */
export async function exportSuppliersToExcel(params: {
  supplier_ids?: string[]
  include_products?: boolean
  include_purchase_history?: boolean
}): Promise<Blob> {
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    throw new Error('Organization not found')
  }

  const supabaseAdmin = createServerSupabaseAdmin()

  // Fetch suppliers
  let query = supabaseAdmin
    .from('suppliers')
    .select(
      `
      *,
      tax_code:tax_codes(id, code, name, rate)
    `
    )
    .eq('org_id', orgId)
    .order('code')

  if (params.supplier_ids && params.supplier_ids.length > 0) {
    query = query.in('id', params.supplier_ids)
  }

  const { data: suppliers, error } = await query

  if (error) {
    throw new Error(`Failed to fetch suppliers for export: ${error.message}`)
  }

  // For now, return a simple CSV as Blob
  // In production, use a library like exceljs for proper xlsx generation
  const headers = [
    'Code',
    'Name',
    'Contact Name',
    'Contact Email',
    'Contact Phone',
    'Address',
    'City',
    'Postal Code',
    'Country',
    'Currency',
    'Tax Code',
    'Payment Terms',
    'Status',
    'Notes',
    'Created At',
  ]

  const rows = (suppliers ?? []).map((s: Supplier) => [
    s.code,
    s.name,
    s.contact_name ?? '',
    s.contact_email ?? '',
    s.contact_phone ?? '',
    s.address ?? '',
    s.city ?? '',
    s.postal_code ?? '',
    s.country ?? '',
    s.currency,
    s.tax_code?.code ?? '',
    s.payment_terms,
    s.is_active ? 'Active' : 'Inactive',
    s.notes ?? '',
    s.created_at,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
}

/**
 * Get human-readable error message for error codes
 */
function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    SUPPLIER_NOT_FOUND: 'Supplier not found',
    SUPPLIER_CODE_EXISTS: 'Supplier code already exists in organization',
    SUPPLIER_CODE_LOCKED: 'Cannot change code - supplier has purchase orders',
    SUPPLIER_HAS_PURCHASE_ORDERS: 'Cannot delete supplier with existing purchase orders',
    SUPPLIER_HAS_PRODUCTS: 'Cannot delete supplier with assigned products',
    CANNOT_DEACTIVATE_OPEN_POS: 'Cannot deactivate supplier with open purchase orders',
    TAX_CODE_NOT_FOUND: 'Tax code not found',
  }
  return messages[code] ?? code
}
