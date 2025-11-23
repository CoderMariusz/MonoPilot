// PO Number Generator Utility
// Epic 3 Batch 3A - Story 3.1: Purchase Order CRUD
// Format: PO-YYYY-NNNN (e.g., PO-2025-0001)

import { createServerSupabaseAdmin } from '@/lib/supabase/server'

/**
 * Generates the next PO number for an organization
 * Format: PO-YYYY-NNNN (e.g., PO-2025-0001)
 *
 * @param orgId - Organization ID
 * @returns Promise<string> - Next PO number
 * @throws Error if unable to generate PO number
 */
export async function generatePONumber(orgId: string): Promise<string> {
  const supabase = createServerSupabaseAdmin()
  const currentYear = new Date().getFullYear()

  // Get the highest PO number for current year in this org
  // Pattern: PO-YYYY-____
  const pattern = `PO-${currentYear}-%`

  const { data, error } = await supabase
    .from('purchase_orders')
    .select('po_number')
    .eq('org_id', orgId)
    .like('po_number', pattern)
    .order('po_number', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching latest PO number:', error)
    throw new Error('Failed to generate PO number')
  }

  let nextSequence = 1

  if (data && data.length > 0) {
    // Extract sequence number from PO-YYYY-NNNN
    const latestPO = data[0].po_number
    const sequencePart = latestPO.split('-')[2] // "0001"
    const currentSequence = parseInt(sequencePart, 10)

    if (!isNaN(currentSequence)) {
      nextSequence = currentSequence + 1
    }
  }

  // Format: PO-YYYY-NNNN (zero-padded to 4 digits)
  const formattedSequence = nextSequence.toString().padStart(4, '0')
  const poNumber = `PO-${currentYear}-${formattedSequence}`

  return poNumber
}

/**
 * Validates PO number format
 * @param poNumber - PO number to validate
 * @returns boolean - True if valid format
 */
export function isValidPONumber(poNumber: string): boolean {
  const pattern = /^PO-\d{4}-\d{4}$/
  return pattern.test(poNumber)
}

/**
 * Extracts year and sequence from PO number
 * @param poNumber - PO number (e.g., "PO-2025-0001")
 * @returns { year: number, sequence: number } | null
 */
export function parsePONumber(poNumber: string): { year: number; sequence: number } | null {
  if (!isValidPONumber(poNumber)) {
    return null
  }

  const parts = poNumber.split('-')
  const year = parseInt(parts[1], 10)
  const sequence = parseInt(parts[2], 10)

  return { year, sequence }
}
