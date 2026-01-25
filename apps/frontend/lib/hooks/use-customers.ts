/**
 * React Hooks: Customers
 * Story: 07.1 - Customers CRUD
 *
 * React Query hooks for customer CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Customer } from '@/components/shipping/customers/CustomerDataTable'

const CUSTOMERS_QUERY_KEY = 'customers'

export interface CustomerListParams {
  page?: number
  limit?: number
  search?: string
  category?: 'retail' | 'wholesale' | 'distributor'
  is_active?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface CustomerListResponse {
  data: Customer[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface CreateCustomerDto {
  customer_code: string
  name: string
  category: 'retail' | 'wholesale' | 'distributor'
  email?: string
  phone?: string
  tax_id?: string
  credit_limit?: number | null
  payment_terms_days?: number
  allergen_restrictions?: string[]
  notes?: string
  is_active?: boolean
}

export type UpdateCustomerDto = Partial<Omit<CreateCustomerDto, 'customer_code'>>

/**
 * Fetches customers with filters, search, and pagination
 */
export function useCustomers(params: CustomerListParams = {}) {
  return useQuery({
    queryKey: [CUSTOMERS_QUERY_KEY, params],
    queryFn: async (): Promise<CustomerListResponse> => {
      const queryParams = new URLSearchParams()

      if (params.search) queryParams.append('search', params.search)
      if (params.category) queryParams.append('category', params.category)
      if (params.is_active !== undefined) {
        queryParams.append('is_active', params.is_active.toString())
      }
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sort_by) queryParams.append('sort_by', params.sort_by)
      if (params.sort_order) queryParams.append('sort_order', params.sort_order)

      const url = `/api/shipping/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }

      return response.json()
    },
    staleTime: 30000,
  })
}

/**
 * Fetches a single customer by ID
 */
export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: [CUSTOMERS_QUERY_KEY, id],
    queryFn: async (): Promise<Customer | null> => {
      if (!id) return null

      const response = await fetch(`/api/shipping/customers/${id}`)

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch customer')
      }

      return response.json()
    },
    enabled: !!id,
    staleTime: 30000,
  })
}

/**
 * Creates a new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCustomerDto): Promise<Customer> => {
      const response = await fetch('/api/shipping/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to create customer')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] })
    },
  })
}

/**
 * Updates an existing customer
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomerDto }): Promise<Customer> => {
      const response = await fetch(`/api/shipping/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to update customer')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY, variables.id] })
    },
  })
}

/**
 * Deletes a customer
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/shipping/customers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to delete customer')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] })
    },
  })
}
