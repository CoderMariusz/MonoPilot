/**
 * React Hook: Tax Codes
 * Story: 01.13 - Tax Codes CRUD
 *
 * Fetches tax codes list with search, filter, pagination
 * Uses React Query for caching and invalidation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  TaxCode,
  TaxCodeListParams,
  CreateTaxCodeInput,
  UpdateTaxCodeInput,
  PaginatedResult,
  TaxCodeValidation
} from '@/lib/types/tax-code'

/**
 * Fetches tax codes with optional filters
 */
export function useTaxCodes(params: TaxCodeListParams = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tax-codes', params],
    queryFn: async () => {
      // Build query string
      const queryParams = new URLSearchParams()
      if (params.search) queryParams.append('search', params.search)
      if (params.country_code) queryParams.append('country_code', params.country_code)
      if (params.status) queryParams.append('status', params.status)
      if (params.sort) queryParams.append('sort', params.sort)
      if (params.order) queryParams.append('order', params.order)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())

      const url = `/api/v1/settings/tax-codes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch tax codes')
      }

      return response.json() as Promise<PaginatedResult<TaxCode>>
    },
    staleTime: 30000, // Cache for 30 seconds
  })

  return { data, isLoading, error, refetch }
}

/**
 * Fetches a single tax code by ID
 */
export function useTaxCode(id: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tax-code', id],
    queryFn: async () => {
      if (!id) return null

      const response = await fetch(`/api/v1/settings/tax-codes/${id}`)

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch tax code')
      }

      return response.json() as Promise<TaxCode>
    },
    enabled: !!id,
    staleTime: 30000,
  })

  return { data, isLoading, error }
}

/**
 * Fetches the default tax code for the organization
 */
export function useDefaultTaxCode() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tax-code-default'],
    queryFn: async () => {
      const response = await fetch('/api/v1/settings/tax-codes/default')

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch default tax code')
      }

      return response.json() as Promise<TaxCode>
    },
    staleTime: 30000,
  })

  return { data, isLoading, error }
}

/**
 * Creates a new tax code
 */
export function useCreateTaxCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTaxCodeInput) => {
      const response = await fetch('/api/v1/settings/tax-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create tax code')
      }

      return response.json() as Promise<TaxCode>
    },
    onSuccess: () => {
      // Invalidate tax codes list
      queryClient.invalidateQueries({ queryKey: ['tax-codes'] })
      queryClient.invalidateQueries({ queryKey: ['tax-code-default'] })
    },
  })
}

/**
 * Updates an existing tax code
 */
export function useUpdateTaxCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaxCodeInput }) => {
      const response = await fetch(`/api/v1/settings/tax-codes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update tax code')
      }

      return response.json() as Promise<TaxCode>
    },
    onSuccess: (_, variables) => {
      // Invalidate tax codes list and specific tax code
      queryClient.invalidateQueries({ queryKey: ['tax-codes'] })
      queryClient.invalidateQueries({ queryKey: ['tax-code', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['tax-code-default'] })
    },
  })
}

/**
 * Deletes a tax code (soft delete)
 */
export function useDeleteTaxCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/settings/tax-codes/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete tax code')
      }
    },
    onSuccess: () => {
      // Invalidate tax codes list
      queryClient.invalidateQueries({ queryKey: ['tax-codes'] })
      queryClient.invalidateQueries({ queryKey: ['tax-code-default'] })
    },
  })
}

/**
 * Sets a tax code as default
 */
export function useSetDefaultTaxCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/settings/tax-codes/${id}/set-default`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to set default tax code')
      }

      return response.json() as Promise<TaxCode>
    },
    onSuccess: () => {
      // Invalidate tax codes list and default
      queryClient.invalidateQueries({ queryKey: ['tax-codes'] })
      queryClient.invalidateQueries({ queryKey: ['tax-code-default'] })
    },
  })
}

/**
 * Validates tax code uniqueness
 */
export function useValidateTaxCode(code: string, countryCode: string, excludeId?: string) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tax-code-validate', code, countryCode, excludeId],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      queryParams.append('code', code)
      queryParams.append('country_code', countryCode)
      if (excludeId) queryParams.append('exclude_id', excludeId)

      const response = await fetch(`/api/v1/settings/tax-codes/validate-code?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to validate tax code')
      }

      return response.json() as Promise<TaxCodeValidation>
    },
    enabled: false, // Manual trigger only
    staleTime: 0,
  })

  return { data, isLoading, validate: refetch }
}
