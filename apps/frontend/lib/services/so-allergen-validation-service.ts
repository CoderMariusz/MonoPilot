/**
 * SO Allergen Validation Service
 * Story: 07.6 - SO Allergen Validation
 *
 * Handles:
 * - Validating SO lines against customer allergen restrictions
 * - Detecting allergen conflicts (only 'contains', not 'may_contain')
 * - Manager override with reason capture
 * - Audit logging for all validation/override events
 * - Customer order history retrieval
 *
 * Business Rules:
 * - BR-001: Only 'contains' allergens trigger conflicts, not 'may_contain'
 * - BR-002: Customers with no restrictions auto-pass validation
 * - BR-003: SO confirmation blocked until allergens validated or overridden
 * - BR-004: Validation resets on line changes (handled by caller)
 * - BR-005: Only Manager/Admin can override
 * - BR-006: Override reason must be 20-500 characters
 * - BR-007: All overrides are audit logged
 * - BR-008: Performance target <1s for 50 lines
 * - BR-009: Customer order history with pagination
 */

import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import {
  VALIDATION_ALLOWED_STATUSES,
} from '../validation/allergen-validation-schemas'
import { normalizeRoleFromQuery } from '../utils/role-normalizer'
import type {
  AllergenConflict,
  ValidateAllergensResponse,
  OverrideAllergenRequest,
  OverrideAllergenResponse,
  AllergenValidationResult,
  CustomerOrdersResponse,
  CustomerOrderHistoryOptions,
} from '../types/shipping'

// ============================================================================
// Types
// ============================================================================

interface SalesOrderWithCustomer {
  id: string
  org_id: string
  order_number: string
  customer_id: string
  status: string
  allergen_validated: boolean
  allow_allergen_override: boolean
  customer: {
    id: string
    name: string
    allergen_restrictions: string[] | null
  }
}

interface SOLineWithProduct {
  id: string
  line_number: number
  product_id: string
  product: {
    id: string
    code: string
    name: string
  }
}

interface ProductAllergenWithAllergen {
  id: string
  product_id: string
  allergen_id: string
  relation_type: 'contains' | 'may_contain'
  allergen: {
    id: string
    code: string
    name_en: string
  }
}

interface UserData {
  id: string
  org_id: string
  name: string
  email: string
  role: { code: string } | { code: string }[] | string | null
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current user data with role
 */
async function getCurrentUser(): Promise<AllergenValidationResult<UserData>> {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
        code: 'UNAUTHORIZED',
      }
    }

    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, org_id, name, email, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return {
        success: false,
        error: 'User not found',
        code: 'UNAUTHORIZED',
      }
    }

    return {
      success: true,
      data: userData as UserData,
    }
  } catch (error) {
    console.error('[SOAllergenValidation] Error getting current user:', error)
    return {
      success: false,
      error: 'Failed to get user data',
      code: 'DATABASE_ERROR',
    }
  }
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Validate SO lines against customer allergen restrictions
 *
 * @param salesOrderId - Sales order UUID
 * @returns ValidateAllergensResponse with conflicts or success
 *
 * Business Rules:
 * - BR-001: Only 'contains' allergens trigger conflicts
 * - BR-002: Empty/null restrictions = auto-pass
 * - BR-008: Target <1s for 50 lines
 */
export async function validateSalesOrderAllergens(
  salesOrderId: string
): Promise<AllergenValidationResult<ValidateAllergensResponse>> {
  try {
    // Get current user
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: userResult.error,
        code: userResult.code,
      }
    }
    const user = userResult.data

    const supabaseAdmin = createServerSupabaseAdmin()

    // 1. Get sales order with customer (RLS via org_id check)
    const { data: salesOrder, error: soError } = await supabaseAdmin
      .from('sales_orders')
      .select(`
        id,
        org_id,
        order_number,
        customer_id,
        status,
        allergen_validated,
        allow_allergen_override,
        customer:customers(id, name, allergen_restrictions)
      `)
      .eq('id', salesOrderId)
      .eq('org_id', user.org_id)
      .single()

    if (soError || !salesOrder) {
      return {
        success: false,
        error: 'Sales order not found',
        code: 'SALES_ORDER_NOT_FOUND',
      }
    }

    const so = salesOrder as unknown as SalesOrderWithCustomer

    // 2. Check SO status allows validation
    if (!VALIDATION_ALLOWED_STATUSES.includes(so.status as typeof VALIDATION_ALLOWED_STATUSES[number])) {
      return {
        success: false,
        error: `Cannot validate sales order in ${so.status} status`,
        code: 'INVALID_SO_STATUS',
      }
    }

    // 3. BR-002: Customer with no restrictions = auto-pass
    const customerRestrictions = so.customer?.allergen_restrictions || []
    if (!customerRestrictions || customerRestrictions.length === 0) {
      // Update SO to validated
      await supabaseAdmin
        .from('sales_orders')
        .update({
          allergen_validated: true,
          allergen_validation_date: new Date().toISOString(),
          allergen_validation_user: user.id,
        })
        .eq('id', salesOrderId)

      // Create audit log
      await supabaseAdmin.from('audit_logs').insert({
        org_id: user.org_id,
        entity_type: 'sales_order',
        entity_id: salesOrderId,
        action: 'allergen_validation_passed',
        new_value: { valid: true, conflicts: [], customer_restrictions: [] },
        user_id: user.id,
      })

      return {
        success: true,
        data: {
          valid: true,
          conflicts: [],
          customer_restrictions: [],
          validated_at: new Date().toISOString(),
          validated_by: user.name || user.email,
        },
      }
    }

    // 4. Get SO lines with products
    const { data: soLines, error: linesError } = await supabaseAdmin
      .from('sales_order_lines')
      .select(`
        id,
        line_number,
        product_id,
        product:products(id, code, name)
      `)
      .eq('sales_order_id', salesOrderId)
      .order('line_number')

    if (linesError) {
      console.error('[SOAllergenValidation] Error fetching SO lines:', linesError)
      return {
        success: false,
        error: 'Failed to fetch order lines',
        code: 'DATABASE_ERROR',
      }
    }

    const lines = (soLines || []) as unknown as SOLineWithProduct[]

    // 5. Get all product IDs
    const productIds = lines.map((line) => line.product_id).filter(Boolean)

    if (productIds.length === 0) {
      // No products = no conflicts
      await supabaseAdmin
        .from('sales_orders')
        .update({
          allergen_validated: true,
          allergen_validation_date: new Date().toISOString(),
          allergen_validation_user: user.id,
        })
        .eq('id', salesOrderId)

      return {
        success: true,
        data: {
          valid: true,
          conflicts: [],
          customer_restrictions: customerRestrictions,
          validated_at: new Date().toISOString(),
          validated_by: user.name || user.email,
        },
      }
    }

    // 6. Get product allergens (only 'contains', not 'may_contain' - BR-001)
    const { data: productAllergens, error: allergensError } = await supabaseAdmin
      .from('product_allergens')
      .select(`
        id,
        product_id,
        allergen_id,
        relation_type,
        allergen:allergens(id, code, name_en)
      `)
      .in('product_id', productIds)
      .eq('relation_type', 'contains')

    if (allergensError) {
      console.error('[SOAllergenValidation] Error fetching product allergens:', allergensError)
      return {
        success: false,
        error: 'Failed to fetch product allergens',
        code: 'DATABASE_ERROR',
      }
    }

    const allergens = (productAllergens || []) as unknown as ProductAllergenWithAllergen[]

    // 7. Find conflicts
    const conflicts: AllergenConflict[] = []

    for (const line of lines) {
      const lineAllergens = allergens.filter((a) => a.product_id === line.product_id)

      for (const pa of lineAllergens) {
        // Check if allergen is in customer restrictions
        if (customerRestrictions.includes(pa.allergen_id)) {
          conflicts.push({
            line_id: line.id,
            line_number: line.line_number,
            product_id: line.product.id,
            product_code: line.product.code,
            product_name: line.product.name,
            allergen_id: pa.allergen.id,
            allergen_code: pa.allergen.code,
            allergen_name: pa.allergen.name_en,
          })
        }
      }
    }

    const isValid = conflicts.length === 0

    // 8. Update SO with validation result
    await supabaseAdmin
      .from('sales_orders')
      .update({
        allergen_validated: isValid,
        allergen_validation_date: new Date().toISOString(),
        allergen_validation_user: user.id,
      })
      .eq('id', salesOrderId)

    // 9. Create audit log
    await supabaseAdmin.from('audit_logs').insert({
      org_id: user.org_id,
      entity_type: 'sales_order',
      entity_id: salesOrderId,
      action: isValid ? 'allergen_validation_passed' : 'allergen_validation_failed',
      new_value: { valid: isValid, conflicts, customer_restrictions: customerRestrictions },
      user_id: user.id,
    })

    return {
      success: true,
      data: {
        valid: isValid,
        conflicts,
        customer_restrictions: customerRestrictions,
        validated_at: new Date().toISOString(),
        validated_by: user.name || user.email,
      },
    }
  } catch (error) {
    console.error('[SOAllergenValidation] Error in validateSalesOrderAllergens:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
      code: 'VALIDATION_ERROR',
    }
  }
}

/**
 * Manager/Admin override for allergen conflicts
 *
 * @param salesOrderId - Sales order UUID
 * @param request - Override request with reason and confirmation
 * @returns OverrideAllergenResponse
 *
 * Business Rules:
 * - BR-005: Only Manager/Admin can override
 * - BR-006: Reason must be 20-500 characters
 * - BR-007: All overrides are audit logged
 */
export async function overrideAllergenBlock(
  salesOrderId: string,
  request: OverrideAllergenRequest
): Promise<AllergenValidationResult<OverrideAllergenResponse>> {
  try {
    // Validate request
    if (!request.reason || typeof request.reason !== 'string') {
      return {
        success: false,
        error: 'Reason is required',
        code: 'INVALID_REASON',
      }
    }

    const trimmedReason = request.reason.trim()
    if (trimmedReason.length < 20) {
      return {
        success: false,
        error: 'Reason must be at least 20 characters',
        code: 'INVALID_REASON',
      }
    }
    if (trimmedReason.length > 500) {
      return {
        success: false,
        error: 'Reason cannot exceed 500 characters',
        code: 'INVALID_REASON',
      }
    }

    if (request.confirmed !== true) {
      return {
        success: false,
        error: 'Override must be confirmed',
        code: 'UNCONFIRMED',
      }
    }

    // Get current user
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: userResult.error,
        code: userResult.code,
      }
    }
    const user = userResult.data

    // Check role permission (Manager+ only)
    const role = normalizeRoleFromQuery(user.role)
    const allowedRoles = ['admin', 'owner', 'super_admin', 'superadmin', 'manager']
    if (!role || !allowedRoles.includes(role)) {
      return {
        success: false,
        error: 'Only Manager or Admin roles can override allergen blocks',
        code: 'PERMISSION_DENIED',
      }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Get sales order
    const { data: salesOrder, error: soError } = await supabaseAdmin
      .from('sales_orders')
      .select('id, org_id, order_number, status, allergen_validated, allow_allergen_override')
      .eq('id', salesOrderId)
      .eq('org_id', user.org_id)
      .single()

    if (soError || !salesOrder) {
      return {
        success: false,
        error: 'Sales order not found',
        code: 'SALES_ORDER_NOT_FOUND',
      }
    }

    // Check if there are conflicts to override
    // If already validated without override, no conflicts exist
    if (salesOrder.allergen_validated && !salesOrder.allow_allergen_override) {
      return {
        success: false,
        error: 'This sales order has no allergen conflicts to override',
        code: 'NO_CONFLICTS',
      }
    }

    const now = new Date().toISOString()

    // Update SO with override
    const { error: updateError } = await supabaseAdmin
      .from('sales_orders')
      .update({
        allergen_validated: true,
        allow_allergen_override: true,
        allergen_override_date: now,
        allergen_override_user: user.id,
        allergen_override_reason: trimmedReason,
      })
      .eq('id', salesOrderId)

    if (updateError) {
      console.error('[SOAllergenValidation] Error updating SO override:', updateError)
      return {
        success: false,
        error: 'Failed to apply override',
        code: 'DATABASE_ERROR',
      }
    }

    // Create audit log entry
    const { data: auditLog, error: auditError } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        org_id: user.org_id,
        entity_type: 'sales_order',
        entity_id: salesOrderId,
        action: 'allergen_override',
        old_value: {
          allergen_validated: salesOrder.allergen_validated,
          allow_allergen_override: salesOrder.allow_allergen_override,
        },
        new_value: {
          allergen_validated: true,
          allow_allergen_override: true,
        },
        user_id: user.id,
        reason: trimmedReason,
      })
      .select('id')
      .single()

    if (auditError) {
      console.error('[SOAllergenValidation] Error creating audit log:', auditError)
      // Don't fail the override, just log the error
    }

    return {
      success: true,
      data: {
        success: true,
        allergen_validated: true,
        allow_allergen_override: true,
        overridden_by: user.name || user.email,
        overridden_at: now,
        audit_log_id: auditLog?.id || '',
      },
    }
  } catch (error) {
    console.error('[SOAllergenValidation] Error in overrideAllergenBlock:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Override failed',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Reset allergen validation (called when SO lines change)
 *
 * @param salesOrderId - Sales order UUID
 *
 * Business Rules:
 * - BR-004: Validation resets on line changes
 * - Override fields are NOT cleared (preserve approval history)
 */
export async function resetAllergenValidation(
  salesOrderId: string
): Promise<AllergenValidationResult<void>> {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.data) {
      return userResult as AllergenValidationResult<void>
    }
    const user = userResult.data

    const supabaseAdmin = createServerSupabaseAdmin()

    const { error } = await supabaseAdmin
      .from('sales_orders')
      .update({
        allergen_validated: false,
        allergen_validation_date: null,
        allergen_validation_user: null,
        // Note: Do NOT clear override fields (allow_allergen_override, etc.)
      })
      .eq('id', salesOrderId)
      .eq('org_id', user.org_id)

    if (error) {
      console.error('[SOAllergenValidation] Error resetting validation:', error)
      return {
        success: false,
        error: 'Failed to reset validation',
        code: 'DATABASE_ERROR',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[SOAllergenValidation] Error in resetAllergenValidation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Reset failed',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Get paginated order history for a customer
 *
 * @param customerId - Customer UUID
 * @param options - Pagination and filter options
 * @returns CustomerOrdersResponse with orders and pagination
 *
 * Business Rules:
 * - BR-009: Default 20 per page, max 100
 * - Sort by order_date DESC (newest first)
 */
export async function getCustomerOrderHistory(
  customerId: string,
  options: CustomerOrderHistoryOptions = {}
): Promise<AllergenValidationResult<CustomerOrdersResponse>> {
  try {
    // Validate pagination params
    const page = options.page ?? 1
    const limit = Math.min(options.limit ?? 20, 100)

    if (page < 1) {
      return {
        success: false,
        error: 'Page must be >= 1',
        code: 'INVALID_PAGE',
      }
    }

    if (limit < 1) {
      return {
        success: false,
        error: 'Limit must be between 1-100',
        code: 'INVALID_LIMIT',
      }
    }

    // Get current user
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: userResult.error,
        code: userResult.code,
      }
    }
    const user = userResult.data

    const supabaseAdmin = createServerSupabaseAdmin()

    // Verify customer exists in user's org
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('org_id', user.org_id)
      .single()

    if (customerError || !customer) {
      return {
        success: false,
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND',
      }
    }

    // Build query
    let query = supabaseAdmin
      .from('sales_orders')
      .select(
        `
        id,
        order_number,
        created_at,
        status,
        total_amount,
        currency,
        sales_order_lines(count)
      `,
        { count: 'exact' }
      )
      .eq('customer_id', customerId)
      .eq('org_id', user.org_id)

    // Apply status filter if provided
    if (options.status) {
      query = query.eq('status', options.status)
    }

    // Apply sorting and pagination
    const offset = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: orders, error: ordersError, count } = await query

    if (ordersError) {
      console.error('[SOAllergenValidation] Error fetching orders:', ordersError)
      return {
        success: false,
        error: 'Failed to fetch orders',
        code: 'DATABASE_ERROR',
      }
    }

    // Transform to CustomerOrder format
    const customerOrders = (orders || []).map((order: Record<string, unknown>) => ({
      id: order.id as string,
      order_number: order.order_number as string,
      order_date: order.created_at as string,
      status: order.status as string,
      total_amount: (order.total_amount as number) || 0,
      currency: (order.currency as string) || 'USD',
      line_count: Array.isArray(order.sales_order_lines)
        ? order.sales_order_lines.length
        : (order.sales_order_lines as { count: number })?.count || 0,
    }))

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return {
      success: true,
      data: {
        orders: customerOrders,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
        },
      },
    }
  } catch (error) {
    console.error('[SOAllergenValidation] Error in getCustomerOrderHistory:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get order history',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Check allergen conflicts for a list of products against customer restrictions
 * Utility function for inline validation during SO line add/edit
 *
 * @param customerId - Customer UUID
 * @param productIds - Array of product UUIDs
 * @returns Array of AllergenConflict
 */
export async function checkAllergenConflicts(
  customerId: string,
  productIds: string[]
): Promise<AllergenValidationResult<AllergenConflict[]>> {
  try {
    if (!productIds || productIds.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    // Get current user
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: userResult.error,
        code: userResult.code,
      }
    }
    const user = userResult.data

    const supabaseAdmin = createServerSupabaseAdmin()

    // Get customer restrictions
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, allergen_restrictions')
      .eq('id', customerId)
      .eq('org_id', user.org_id)
      .single()

    if (customerError || !customer) {
      return {
        success: false,
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND',
      }
    }

    const restrictions = customer.allergen_restrictions || []
    if (restrictions.length === 0) {
      return { success: true, data: [] }
    }

    // Get products
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, code, name')
      .in('id', productIds)

    if (productsError) {
      return {
        success: false,
        error: 'Failed to fetch products',
        code: 'DATABASE_ERROR',
      }
    }

    // Get product allergens (only 'contains')
    const { data: productAllergens, error: allergensError } = await supabaseAdmin
      .from('product_allergens')
      .select(`
        product_id,
        allergen_id,
        relation_type,
        allergen:allergens(id, code, name_en)
      `)
      .in('product_id', productIds)
      .eq('relation_type', 'contains')

    if (allergensError) {
      return {
        success: false,
        error: 'Failed to fetch allergens',
        code: 'DATABASE_ERROR',
      }
    }

    const conflicts: AllergenConflict[] = []
    const allergens = productAllergens as unknown as ProductAllergenWithAllergen[]

    for (const pa of allergens) {
      if (restrictions.includes(pa.allergen_id)) {
        const product = (products || []).find((p) => p.id === pa.product_id)
        if (product) {
          conflicts.push({
            line_id: '',
            line_number: 0,
            product_id: product.id,
            product_code: product.code,
            product_name: product.name,
            allergen_id: pa.allergen.id,
            allergen_code: pa.allergen.code,
            allergen_name: pa.allergen.name_en,
          })
        }
      }
    }

    return { success: true, data: conflicts }
  } catch (error) {
    console.error('[SOAllergenValidation] Error in checkAllergenConflicts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Check failed',
      code: 'DATABASE_ERROR',
    }
  }
}
