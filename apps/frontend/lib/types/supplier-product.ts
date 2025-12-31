/**
 * Supplier Product Types
 * Story: 03.2 - Supplier-Product Assignment
 *
 * Types for supplier-product assignments (junction table)
 */

/**
 * Base supplier-product assignment
 */
export interface SupplierProduct {
  id: string
  supplier_id: string
  product_id: string
  is_default: boolean
  supplier_product_code: string | null
  unit_price: number | null
  currency: string | null
  lead_time_days: number | null
  moq: number | null
  order_multiple: number | null
  last_purchase_date: string | null
  last_purchase_price: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Product summary for display in supplier products table
 */
export interface ProductSummary {
  id: string
  code: string
  name: string
  uom: string
  supplier_lead_time_days: number | null
}

/**
 * Supplier summary for default supplier queries
 */
export interface SupplierSummary {
  id: string
  code: string
  name: string
  currency: string
}

/**
 * Supplier product with embedded product data (for supplier detail view)
 */
export interface SupplierProductWithProduct extends SupplierProduct {
  product: ProductSummary
}

/**
 * Supplier product with embedded supplier data (for product detail view)
 */
export interface SupplierProductWithSupplier extends SupplierProduct {
  supplier: SupplierSummary
}

/**
 * Input for assigning a product to a supplier (POST)
 */
export interface AssignProductInput {
  product_id: string
  is_default?: boolean
  supplier_product_code?: string | null
  unit_price?: number | null
  currency?: string | null
  lead_time_days?: number | null
  moq?: number | null
  order_multiple?: number | null
  notes?: string | null
}

/**
 * Input for updating a supplier-product assignment (PUT)
 */
export interface UpdateSupplierProductInput {
  is_default?: boolean
  supplier_product_code?: string | null
  unit_price?: number | null
  currency?: string | null
  lead_time_days?: number | null
  moq?: number | null
  order_multiple?: number | null
  notes?: string | null
}

/**
 * Response from list supplier products API
 */
export interface SupplierProductsResponse {
  data: SupplierProductWithProduct[]
  meta: {
    total: number
    default_count: number
  }
}

/**
 * Helper function to resolve lead time with fallback
 *
 * @param supplierProduct - The supplier product assignment
 * @param productDefaultLeadTime - The product's default lead time
 * @returns Resolved lead time in days
 */
export function resolveLeadTime(
  supplierProductLeadTime: number | null,
  productDefaultLeadTime: number | null
): number {
  return supplierProductLeadTime ?? productDefaultLeadTime ?? 0
}

/**
 * Helper to check if lead time is an override
 *
 * @param supplierProductLeadTime - The supplier product lead time
 * @param productDefaultLeadTime - The product's default lead time
 * @returns True if supplier product has a different lead time than product default
 */
export function isLeadTimeOverride(
  supplierProductLeadTime: number | null,
  productDefaultLeadTime: number | null
): boolean {
  if (supplierProductLeadTime === null) return false
  if (productDefaultLeadTime === null) return true
  return supplierProductLeadTime !== productDefaultLeadTime
}
