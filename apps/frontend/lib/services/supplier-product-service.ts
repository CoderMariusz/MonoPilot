/**
 * Supplier Product Service
 * Story: 03.2 - Supplier-Product Assignment
 *
 * Client-side service for supplier-product CRUD operations
 */

import type {
  SupplierProduct,
  SupplierProductWithProduct,
  SupplierProductWithSupplier,
  AssignProductInput,
  UpdateSupplierProductInput,
} from '@/lib/types/supplier-product'

/**
 * Get all products assigned to a supplier
 *
 * @param supplierId - The supplier ID
 * @param options - Optional search and filter options
 * @returns Array of supplier products with product details
 */
export async function getSupplierProducts(
  supplierId: string,
  options?: { search?: string }
): Promise<SupplierProductWithProduct[]> {
  const queryParams = new URLSearchParams()
  if (options?.search) {
    queryParams.append('search', options.search)
  }

  const url = `/api/planning/suppliers/${supplierId}/products${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`

  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Supplier not found')
    }
    throw new Error('Failed to fetch supplier products')
  }

  const data = await response.json()

  // Transform the response to match our expected format (standardized to data.data)
  const assignments = data.data || data.assignments || data.supplier_products || []

  return assignments.map((sp: SupplierProduct & { products?: any; product?: any }) => ({
    ...sp,
    product: sp.product || sp.products || {
      id: sp.product_id,
      code: '',
      name: '',
      uom: '',
      supplier_lead_time_days: null,
    },
  }))
}

/**
 * Assign a product to a supplier
 *
 * @param supplierId - The supplier ID
 * @param input - The assignment data
 * @returns Created supplier product
 */
export async function assignProductToSupplier(
  supplierId: string,
  input: AssignProductInput
): Promise<SupplierProduct> {
  const response = await fetch(`/api/planning/suppliers/${supplierId}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()

    // Handle specific error cases
    if (response.status === 400 && error.code === 'DUPLICATE_ASSIGNMENT') {
      throw new Error('This product is already assigned to this supplier')
    }
    if (response.status === 409) {
      throw new Error('This product is already assigned to this supplier')
    }

    throw new Error(error.error || 'Failed to assign product to supplier')
  }

  const data = await response.json()
  return data.assignment || data.data || data
}

/**
 * Update a supplier-product assignment
 *
 * @param supplierId - The supplier ID
 * @param productId - The product ID
 * @param input - The update data
 * @returns Updated supplier product
 */
export async function updateSupplierProduct(
  supplierId: string,
  productId: string,
  input: UpdateSupplierProductInput
): Promise<SupplierProduct> {
  const response = await fetch(
    `/api/planning/suppliers/${supplierId}/products/${productId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update supplier product')
  }

  const data = await response.json()
  return data.assignment || data.data || data
}

/**
 * Remove a product from a supplier
 *
 * @param supplierId - The supplier ID
 * @param productId - The product ID
 */
export async function removeSupplierProduct(
  supplierId: string,
  productId: string
): Promise<void> {
  const response = await fetch(
    `/api/planning/suppliers/${supplierId}/products/${productId}`,
    {
      method: 'DELETE',
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to remove product from supplier')
  }
}

/**
 * Get the default supplier for a product
 *
 * @param productId - The product ID
 * @returns The default supplier product or null if none
 */
export async function getDefaultSupplierForProduct(
  productId: string
): Promise<SupplierProductWithSupplier | null> {
  const response = await fetch(
    `/api/planning/products/${productId}/default-supplier`
  )

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error('Failed to fetch default supplier')
  }

  const data = await response.json()
  return data.data || null
}

/**
 * Set a supplier as the default for a product
 * This will automatically unset any existing default
 *
 * @param supplierId - The supplier ID
 * @param productId - The product ID
 * @returns Updated supplier product
 */
export async function setDefaultSupplier(
  supplierId: string,
  productId: string
): Promise<SupplierProduct> {
  return updateSupplierProduct(supplierId, productId, { is_default: true })
}

/**
 * Resolve lead time with fallback to product default
 *
 * @param supplierProductLeadTime - The supplier product lead time
 * @param productDefaultLeadTime - The product's default lead time
 * @returns Resolved lead time in days
 */
export function resolveLeadTime(
  supplierProductLeadTime: number | null | undefined,
  productDefaultLeadTime: number | null | undefined
): number {
  return supplierProductLeadTime ?? productDefaultLeadTime ?? 0
}
