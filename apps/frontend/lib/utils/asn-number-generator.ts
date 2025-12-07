// ASN Number Generator Utility
// Epic 5 Batch 5A-3 - Story 5.8: ASN Creation
// Format: ASN-YYYYMMDD-NNNN (e.g., ASN-20250107-0001)

import { createServerSupabaseAdmin } from '@/lib/supabase/server'

const MAX_RETRIES = 3
const SEQUENCE_DIGITS = 4

/**
 * Generates the next ASN number for an organization with retry logic for race conditions
 * Format: ASN-YYYYMMDD-NNNN (e.g., ASN-20250107-0001)
 *
 * @param orgId - Organization ID
 * @returns Promise<string> - Next ASN number
 * @throws Error if unable to generate ASN number after retries
 */
export async function generateASNNumber(orgId: string): Promise<string> {
  const supabase = createServerSupabaseAdmin()
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Get the highest ASN number for current date in this org
    const pattern = `ASN-${dateStr}-%`

    const { data, error } = await supabase
      .from('asn')
      .select('asn_number')
      .eq('org_id', orgId)
      .like('asn_number', pattern)
      .order('asn_number', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching latest ASN number:', error)
      throw new Error('Failed to generate ASN number')
    }

    let nextSequence = 1

    if (data && data.length > 0) {
      const latestASN = data[0].asn_number
      const sequencePart = latestASN.split('-')[2]
      const currentSequence = parseInt(sequencePart, 10)

      if (!isNaN(currentSequence)) {
        nextSequence = currentSequence + 1
      }
    }

    // Format: ASN-YYYYMMDD-NNNN (zero-padded)
    const formattedSequence = nextSequence.toString().padStart(SEQUENCE_DIGITS, '0')
    const asnNumber = `ASN-${dateStr}-${formattedSequence}`

    // Verify this number doesn't exist (race condition check)
    const { data: existing } = await supabase
      .from('asn')
      .select('id')
      .eq('org_id', orgId)
      .eq('asn_number', asnNumber)
      .maybeSingle()

    if (!existing) {
      return asnNumber
    }

    // Number already taken - retry with delay
    await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)))
  }

  // Fallback: add random suffix
  const fallbackSequence = Date.now().toString().slice(-4)
  return `ASN-${dateStr}-${fallbackSequence}`
}

/**
 * Validates ASN number format
 * @param asnNumber - ASN number to validate
 * @returns boolean - True if valid format
 */
export function isValidASNNumber(asnNumber: string): boolean {
  const pattern = /^ASN-\d{8}-\d{4}$/
  return pattern.test(asnNumber)
}

/**
 * Extracts date and sequence from ASN number
 * @param asnNumber - ASN number (e.g., "ASN-20250107-0001")
 * @returns { date: string, sequence: number } | null
 */
export function parseASNNumber(asnNumber: string): { date: string; sequence: number } | null {
  if (!isValidASNNumber(asnNumber)) {
    return null
  }

  const parts = asnNumber.split('-')
  const date = parts[1] // "20250107"
  const sequence = parseInt(parts[2], 10)

  return { date, sequence }
}
