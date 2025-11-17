/**
 * License Plate Number Generator (Atomic)
 * Story 1.7.1 AC-4 Gap 1: LP counter race condition fix
 *
 * Uses PostgreSQL sequence for atomic LP number generation
 * Format: LP-YYYYMMDD-NNN (e.g., LP-20251116-001)
 * Daily counter reset at midnight
 */

import { supabase } from '../supabase/client-browser';

export interface LPGenerationResult {
  lp_number: string;
  success: boolean;
  error?: string;
}

export interface LPSequenceInfo {
  current_date: string;
  last_reset_date: string;
  last_sequence_number: number;
  next_lp_number: string;
}

/**
 * Generate atomic LP number using database sequence
 * Thread-safe: Uses PostgreSQL function with sequence
 * Auto-resets counter at midnight
 *
 * @returns LP number in format LP-YYYYMMDD-NNN
 * @example
 * const result = await generateLPNumber();
 * // result.lp_number = 'LP-20251116-001'
 */
export async function generateLPNumber(): Promise<LPGenerationResult> {
  try {
    const { data, error } = await supabase.rpc('generate_lp_number');

    if (error) {
      console.error('Error generating LP number:', error);
      return {
        lp_number: '',
        success: false,
        error: error.message,
      };
    }

    return {
      lp_number: data as string,
      success: true,
    };
  } catch (error) {
    console.error('Exception generating LP number:', error);
    return {
      lp_number: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate LP number uniqueness before insert
 * Story 1.7.1 AC-4 Gap 5: LP uniqueness validation
 *
 * @param lpNumber LP number to validate
 * @returns true if unique, false if duplicate exists
 * @example
 * const isUnique = await validateLPUniqueness('LP-20251116-001');
 * if (!isUnique) {
 *   console.error('Duplicate LP number!');
 * }
 */
export async function validateLPUniqueness(lpNumber: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('validate_lp_uniqueness', {
      p_lp_number: lpNumber,
    });

    if (error) {
      console.error('Error validating LP uniqueness:', error);
      // Conservative: assume not unique on error (prevent duplicates)
      return false;
    }

    return data as boolean;
  } catch (error) {
    console.error('Exception validating LP uniqueness:', error);
    return false;
  }
}

/**
 * Get current LP sequence state (for debugging/monitoring)
 *
 * @returns Sequence state info
 * @example
 * const info = await getLPSequenceInfo();
 * console.log('Next LP:', info.next_lp_number);
 */
export async function getLPSequenceInfo(): Promise<LPSequenceInfo | null> {
  try {
    const { data, error } = await supabase.rpc('get_lp_sequence_info');

    if (error) {
      console.error('Error getting LP sequence info:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Exception getting LP sequence info:', error);
    return null;
  }
}

/**
 * Generate LP number with validation (atomic + uniqueness check)
 * Story 1.7.1 AC-4 Gap 1 + Gap 5
 *
 * @param maxRetries Maximum retry attempts if duplicate (default: 3)
 * @returns LP number guaranteed to be unique
 * @throws Error if max retries exceeded or generation fails
 *
 * @example
 * try {
 *   const lpNumber = await generateValidatedLPNumber();
 *   console.log('Generated unique LP:', lpNumber);
 * } catch (error) {
 *   console.error('Failed to generate LP:', error);
 * }
 */
export async function generateValidatedLPNumber(maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Generate LP number atomically
    const result = await generateLPNumber();

    if (!result.success || !result.lp_number) {
      throw new Error(`Failed to generate LP number: ${result.error}`);
    }

    // Validate uniqueness
    const isUnique = await validateLPUniqueness(result.lp_number);

    if (isUnique) {
      return result.lp_number;
    }

    console.warn(
      `LP number ${result.lp_number} already exists (attempt ${attempt}/${maxRetries}), retrying...`
    );
  }

  throw new Error(`Failed to generate unique LP number after ${maxRetries} attempts`);
}
