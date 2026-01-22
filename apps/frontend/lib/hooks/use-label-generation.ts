/**
 * Label Generation Hook (Story 07.13)
 * Purpose: React Query hooks for SSCC and label generation
 *
 * Features:
 * - useGenerateSSCC - Generate SSCC for boxes
 * - useLabelPreview - Get label preview data
 * - useGenerateBOL - Generate Bill of Lading
 * - useGeneratePackingSlip - Generate Packing Slip
 * - usePrintLabel - Print label to printer
 *
 * AC Coverage:
 * - AC: SSCC generation with MOD 10 check digit
 * - AC: Label preview generation
 * - AC: BOL PDF generation
 * - AC: Packing slip generation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query'

// =============================================================================
// Types
// =============================================================================

export interface SSCCGenerationRequest {
  shipmentId: string
  boxIds: string[]
  extensionDigit?: '0' | '9' // 0=carton, 9=pallet
}

export interface SSCCGenerationResult {
  boxId: string
  sscc: string
  ssccFormatted: string
  checkDigit: string
  success: boolean
  error?: string
}

export interface SSCCGenerationResponse {
  results: SSCCGenerationResult[]
  successCount: number
  errorCount: number
}

export interface LabelPreviewRequest {
  boxId: string
  shipmentId: string
  format: '4x6' | '4x8'
}

export interface LabelPreviewResponse {
  sscc: string
  sscc_formatted: string
  barcode_image_base64: string
  label_content: {
    ship_to: {
      customer_name: string
      address_line1: string
      city_state_zip: string
    }
    order_number: string
    box_number: string
    weight: string
    handling_instructions?: string
  }
}

export interface BOLGenerationRequest {
  shipmentId: string
}

export interface BOLGenerationResponse {
  pdf_url: string
  bol_number: string
  generated_at: string
  file_size_kb: number
}

export interface PackingSlipGenerationRequest {
  shipmentId: string
}

export interface PackingSlipGenerationResponse {
  pdf_url: string
  shipment_number: string
  generated_at: string
  file_size_kb: number
}

export interface PrintLabelRequest {
  sscc: string
  format: '4x6' | '4x8'
  output: 'zpl' | 'pdf'
  printerId?: string
  copies?: number
}

export interface PrintLabelResponse {
  success: boolean
  printer_name?: string
  sent_at?: string
  error?: string
}

// =============================================================================
// Query Keys
// =============================================================================

export const labelKeys = {
  all: ['labels'] as const,
  preview: (boxId: string, shipmentId: string) =>
    [...labelKeys.all, 'preview', boxId, shipmentId] as const,
  bol: (shipmentId: string) => [...labelKeys.all, 'bol', shipmentId] as const,
  packingSlip: (shipmentId: string) =>
    [...labelKeys.all, 'packing-slip', shipmentId] as const,
}

// =============================================================================
// API Functions
// =============================================================================

async function generateSSCC(request: SSCCGenerationRequest): Promise<SSCCGenerationResponse> {
  const response = await fetch('/api/shipping/labels/generate-sscc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to generate SSCC')
  }

  return response.json()
}

async function fetchLabelPreview(request: LabelPreviewRequest): Promise<LabelPreviewResponse> {
  const { boxId, shipmentId, format } = request
  const response = await fetch(
    `/api/shipping/labels/preview?boxId=${boxId}&shipmentId=${shipmentId}&format=${format}`
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to fetch label preview')
  }

  return response.json()
}

async function generateBOL(request: BOLGenerationRequest): Promise<BOLGenerationResponse> {
  const response = await fetch('/api/shipping/labels/generate-bol', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to generate BOL')
  }

  return response.json()
}

async function generatePackingSlip(
  request: PackingSlipGenerationRequest
): Promise<PackingSlipGenerationResponse> {
  const response = await fetch('/api/shipping/labels/generate-packing-slip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to generate packing slip')
  }

  return response.json()
}

async function printLabel(request: PrintLabelRequest): Promise<PrintLabelResponse> {
  const response = await fetch('/api/shipping/labels/print', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to print label')
  }

  return response.json()
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Generate SSCC codes for boxes
 */
export function useGenerateSSCC(): UseMutationResult<
  SSCCGenerationResponse,
  Error,
  SSCCGenerationRequest
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateSSCC,
    onSuccess: (_, variables) => {
      // Invalidate shipment and label queries
      queryClient.invalidateQueries({
        queryKey: ['shipments', variables.shipmentId],
      })
      queryClient.invalidateQueries({
        queryKey: labelKeys.all,
      })
    },
  })
}

/**
 * Fetch label preview data
 */
export function useLabelPreview(
  boxId: string | null,
  shipmentId: string | null,
  format: '4x6' | '4x8' = '4x6'
): UseQueryResult<LabelPreviewResponse> {
  return useQuery({
    queryKey: labelKeys.preview(boxId || '', shipmentId || ''),
    queryFn: () =>
      fetchLabelPreview({
        boxId: boxId!,
        shipmentId: shipmentId!,
        format,
      }),
    enabled: !!boxId && !!shipmentId,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Generate Bill of Lading PDF
 */
export function useGenerateBOL(): UseMutationResult<
  BOLGenerationResponse,
  Error,
  BOLGenerationRequest
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateBOL,
    onSuccess: (data, variables) => {
      // Cache the BOL result
      queryClient.setQueryData(labelKeys.bol(variables.shipmentId), data)
    },
  })
}

/**
 * Generate Packing Slip PDF
 */
export function useGeneratePackingSlip(): UseMutationResult<
  PackingSlipGenerationResponse,
  Error,
  PackingSlipGenerationRequest
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generatePackingSlip,
    onSuccess: (data, variables) => {
      // Cache the packing slip result
      queryClient.setQueryData(labelKeys.packingSlip(variables.shipmentId), data)
    },
  })
}

/**
 * Print label to configured printer
 */
export function usePrintLabel(): UseMutationResult<PrintLabelResponse, Error, PrintLabelRequest> {
  return useMutation({
    mutationFn: printLabel,
  })
}

/**
 * Batch generate and print labels
 */
export function useBatchLabelOperations(shipmentId: string) {
  const generateSSCCMutation = useGenerateSSCC()
  const generateBOLMutation = useGenerateBOL()
  const generatePackingSlipMutation = useGeneratePackingSlip()
  const printLabelMutation = usePrintLabel()

  return {
    // Mutations
    generateSSCC: generateSSCCMutation,
    generateBOL: generateBOLMutation,
    generatePackingSlip: generatePackingSlipMutation,
    printLabel: printLabelMutation,

    // Combined loading state
    isLoading:
      generateSSCCMutation.isPending ||
      generateBOLMutation.isPending ||
      generatePackingSlipMutation.isPending ||
      printLabelMutation.isPending,

    // Generate all SSCCs for shipment
    generateAllSSCC: async (boxIds: string[]) => {
      return generateSSCCMutation.mutateAsync({
        shipmentId,
        boxIds,
      })
    },

    // Generate BOL
    generateBOLForShipment: async () => {
      return generateBOLMutation.mutateAsync({ shipmentId })
    },

    // Generate Packing Slip
    generatePackingSlipForShipment: async () => {
      return generatePackingSlipMutation.mutateAsync({ shipmentId })
    },

    // Print single label
    printSingleLabel: async (
      sscc: string,
      format: '4x6' | '4x8',
      output: 'zpl' | 'pdf',
      printerId?: string,
      copies?: number
    ) => {
      return printLabelMutation.mutateAsync({
        sscc,
        format,
        output,
        printerId,
        copies,
      })
    },
  }
}

export default useBatchLabelOperations
