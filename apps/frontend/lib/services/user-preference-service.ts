/**
 * User Preference Service
 * Story: TD-208 - Language Selector for Allergen Names
 *
 * Handles user language preference management with:
 * - Get user's current language preference
 * - Save user's language preference
 * - Fallback chain: user -> org -> 'en'
 * - Validation of language codes
 *
 * Supported languages (EU-14 allergen names):
 * - 'en' - English (default)
 * - 'pl' - Polish
 * - 'de' - German
 * - 'fr' - French
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Valid language codes supported by the system
 */
export const VALID_LANGUAGE_CODES = ['en', 'pl', 'de', 'fr'] as const

/**
 * Type for valid language codes
 */
export type LanguageCode = typeof VALID_LANGUAGE_CODES[number]

/**
 * Result type for service operations
 */
export interface UserPreferenceResult<T = void> {
  success: boolean
  data?: T
  error?: string
  code?: 'UNAUTHORIZED' | 'NOT_FOUND' | 'INVALID_LANGUAGE' | 'DATABASE_ERROR'
}

/**
 * Check if a string is a valid language code
 *
 * @param code - String to validate
 * @returns true if valid language code
 */
export function isValidLanguageCode(code: string): code is LanguageCode {
  return VALID_LANGUAGE_CODES.includes(code as LanguageCode)
}

/**
 * Get user's language preference by user ID
 * Uses RPC function get_user_language with fallback chain
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @returns Language code with fallback to 'en'
 */
export async function getUserLanguage(
  supabase: SupabaseClient,
  userId: string
): Promise<LanguageCode> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_language', { p_user_id: userId })

    if (error) {
      console.error('[UserPreferenceService] Failed to get user language:', error)
      return 'en'
    }

    // Validate returned language code
    if (data && isValidLanguageCode(data)) {
      return data
    }

    return 'en'
  } catch (error) {
    console.error('[UserPreferenceService] Error in getUserLanguage:', error)
    return 'en'
  }
}

/**
 * Save user's language preference
 * Uses RPC function set_user_language with validation
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID (not used directly, RPC uses auth.uid())
 * @param language - Language code to set
 * @returns Result indicating success or error
 */
export async function saveUserLanguage(
  supabase: SupabaseClient,
  userId: string,
  language: LanguageCode
): Promise<UserPreferenceResult> {
  try {
    // Validate language code before sending to database
    if (!isValidLanguageCode(language)) {
      return {
        success: false,
        error: `Invalid language code: ${language}. Valid codes: ${VALID_LANGUAGE_CODES.join(', ')}`,
        code: 'INVALID_LANGUAGE',
      }
    }

    const { error } = await supabase
      .rpc('set_user_language', { p_language: language })

    if (error) {
      console.error('[UserPreferenceService] Failed to save user language:', error)

      // Handle specific error cases
      if (error.message.includes('Not authenticated')) {
        return {
          success: false,
          error: 'Not authenticated',
          code: 'UNAUTHORIZED',
        }
      }

      if (error.message.includes('Invalid language code')) {
        return {
          success: false,
          error: error.message,
          code: 'INVALID_LANGUAGE',
        }
      }

      if (error.message.includes('User not found')) {
        return {
          success: false,
          error: 'User not found',
          code: 'NOT_FOUND',
        }
      }

      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[UserPreferenceService] Error in saveUserLanguage:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Get current authenticated user's language preference
 * Convenience method that gets user ID from auth and fetches language
 *
 * @param supabase - Supabase client instance
 * @returns Language code with fallback to 'en'
 */
export async function getCurrentUserLanguage(
  supabase: SupabaseClient
): Promise<LanguageCode> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[UserPreferenceService] Not authenticated:', authError)
      return 'en'
    }

    return getUserLanguage(supabase, user.id)
  } catch (error) {
    console.error('[UserPreferenceService] Error in getCurrentUserLanguage:', error)
    return 'en'
  }
}

/**
 * Language display names for UI
 */
export const LANGUAGE_DISPLAY_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  pl: 'Polski',
  de: 'Deutsch',
  fr: 'Francais',
}

/**
 * Language options for select components
 */
export const LANGUAGE_OPTIONS = VALID_LANGUAGE_CODES.map(code => ({
  value: code,
  label: LANGUAGE_DISPLAY_NAMES[code],
  code: code.toUpperCase(),
}))
