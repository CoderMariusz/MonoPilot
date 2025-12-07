// GRN Number Generator Utility
// Epic 5 Batch 5A-3 - Story 5.11: GRN + LP Creation
// Format: GRN-YYYYMMDD-NNNN (e.g., GRN-20251207-0001)

import { createServerSupabaseAdmin } from '@/lib/supabase/server'

const MAX_RETRIES = 3
const SEQUENCE_DIGITS = 4

/**
 * Generates the next GRN number for an organization with retry logic for race conditions
 * Format: GRN-YYYYMMDD-NNNN (e.g., GRN-20251207-0001)
 *
 * @param orgId - Organization ID
 * @returns Promise<string> - Next GRN number
 * @throws Error if unable to generate GRN number after retries
 */
export async function generateGRNNumber(orgId: string): Promise<string> {
  const supabase = createServerSupabaseAdmin()
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Get the highest GRN number for current date in this org
    const pattern = `GRN-${dateStr}-%`

    const { data, error } = await supabase
      .from('goods_receipt_notes')
      .select('grn_number')
      .eq('org_id', orgId)
      .like('grn_number', pattern)
      .order('grn_number', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching latest GRN number:', error)
      throw new Error('Failed to generate GRN number')
    }

    let nextSequence = 1

    if (data && data.length > 0) {
      const latestGRN = data[0].grn_number
      const sequencePart = latestGRN.split('-')[2]
      const currentSequence = parseInt(sequencePart, 10)

      if (!isNaN(currentSequence)) {
        nextSequence = currentSequence + 1
      }
    }

    // Format: GRN-YYYYMMDD-NNNN (zero-padded)
    const formattedSequence = nextSequence.toString().padStart(SEQUENCE_DIGITS, '0')
    const grnNumber = `GRN-${dateStr}-${formattedSequence}`

    // Verify this number doesn't exist (race condition check)
    const { data: existing } = await supabase
      .from('goods_receipt_notes')
      .select('id')
      .eq('org_id', orgId)
      .eq('grn_number', grnNumber)
      .maybeSingle()

    if (!existing) {
      return grnNumber
    }

    // Number already taken - retry with delay
    await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)))
  }

  // Fallback: add random suffix
  const fallbackSequence = Date.now().toString().slice(-4)
  return `GRN-${dateStr}-${fallbackSequence}`
}

/**
 * Validates GRN number format
 * @param grnNumber - GRN number to validate
 * @returns boolean - True if valid format
 */
export function isValidGRNNumber(grnNumber: string): boolean {
  const pattern = /^GRN-\d{8}-\d{4}$/
  return pattern.test(grnNumber)
}

/**
 * Extracts date and sequence from GRN number
 * @param grnNumber - GRN number (e.g., "GRN-20251207-0001")
 * @returns { date: string, sequence: number } | null
 */
export function parseGRNNumber(grnNumber: string): { date: string; sequence: number } | null {
  if (!isValidGRNNumber(grnNumber)) {
    return null
  }

  const parts = grnNumber.split('-')
  const date = parts[1] // "20251207"
  const sequence = parseInt(parts[2], 10)

  return { date, sequence }
}
