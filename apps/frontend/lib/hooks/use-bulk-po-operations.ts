/**
 * Bulk PO Operations Hooks
 * Story: 03.6 - PO Bulk Operations
 * React Query hooks for bulk import, export, and status updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseOrderKeys } from './use-purchase-orders'
import type {
  BulkCreatePOInput,
  BulkCreatePOResult,
  BulkStatusUpdateRequest,
  BulkStatusUpdateResult,
  ValidationResult,
  ImportGroup,
  POExportRequest,
} from '@/lib/types/po-bulk'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const bulkPOKeys = {
  all: ['bulk-po'] as const,
  validate: () => [...bulkPOKeys.all, 'validate'] as const,
  import: () => [...bulkPOKeys.all, 'import'] as const,
  export: () => [...bulkPOKeys.all, 'export'] as const,
  bulkStatus: () => [...bulkPOKeys.all, 'bulk-status'] as const,
}

// ============================================================================
// IMPORT MUTATIONS
// ============================================================================

/**
 * Parse and validate import file
 */
export function useValidateImport() {
  return useMutation({
    mutationKey: bulkPOKeys.validate(),
    mutationFn: async (file: File): Promise<ValidationResult> => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/planning/purchase-orders/import/validate', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to validate import file')
      }

      const data = await response.json()
      return data.data || data
    },
  })
}

/**
 * Execute import and create POs from validated groups
 */
export function useExecuteImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: bulkPOKeys.import(),
    mutationFn: async (groups: ImportGroup[]): Promise<BulkCreatePOResult> => {
      const response = await fetch('/api/planning/purchase-orders/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to execute import')
      }

      const data = await response.json()
      return data.data || data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() })
    },
  })
}

/**
 * Bulk create POs from product list (API-based, no file)
 */
export function useBulkCreatePOs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: BulkCreatePOInput): Promise<BulkCreatePOResult> => {
      const response = await fetch('/api/planning/purchase-orders/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to create POs')
      }

      const data = await response.json()
      return data.data || data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() })
    },
  })
}

// ============================================================================
// EXPORT MUTATIONS
// ============================================================================

/**
 * Export POs to Excel file
 */
export function useExportPOs() {
  return useMutation({
    mutationKey: bulkPOKeys.export(),
    mutationFn: async (request: POExportRequest): Promise<Blob> => {
      const response = await fetch('/api/planning/purchase-orders/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to export POs')
      }

      return await response.blob()
    },
  })
}

/**
 * Download import template
 */
export function useDownloadTemplate() {
  return useMutation({
    mutationFn: async (): Promise<Blob> => {
      const response = await fetch('/api/planning/purchase-orders/import/template', {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to download template')
      }

      return await response.blob()
    },
  })
}

// ============================================================================
// BULK STATUS MUTATIONS
// ============================================================================

/**
 * Bulk update PO status (approve, reject, cancel, confirm)
 */
export function useBulkStatusUpdate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: bulkPOKeys.bulkStatus(),
    mutationFn: async (request: BulkStatusUpdateRequest): Promise<BulkStatusUpdateResult> => {
      const response = await fetch('/api/planning/purchase-orders/bulk-status-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to update PO status')
      }

      const data = await response.json()
      return data.data || data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() })
    },
  })
}

/**
 * Bulk submit POs
 */
export function useBulkSubmitPOs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (poIds: string[]): Promise<BulkStatusUpdateResult> => {
      const response = await fetch('/api/planning/purchase-orders/bulk-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ po_ids: poIds }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to submit POs')
      }

      const data = await response.json()
      return data.data || data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() })
    },
  })
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Helper to trigger file download from Blob
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Generate export filename with timestamp
 */
export function generateExportFilename(prefix: string = 'POs_Export'): string {
  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const time = now.toTimeString().slice(0, 5).replace(':', '')
  return `${prefix}_${date}_${time}.xlsx`
}
