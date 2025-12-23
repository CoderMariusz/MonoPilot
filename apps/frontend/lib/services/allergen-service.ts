import { createServerSupabase } from '../supabase/server'
import type { Allergen } from '../types/allergen'

/**
 * Allergen Service
 * Story: 01.12 - Allergens Management
 *
 * Global read-only service for EU mandatory allergens.
 * NO org_id filtering - allergens are global reference data.
 * NO create/update/delete - read-only in MVP.
 *
 * Acceptance Criteria:
 * - AC-AL-01: List all 14 EU allergens sorted by display_order
 * - AC-AS-01 to AC-AS-03: Full-text search across all languages
 * - AC-ML-01 to AC-ML-02: Multi-language support
 */

export interface AllergenFilters {
  search?: string
  is_eu_mandatory?: boolean
  is_active?: boolean
}

export interface AllergenServiceResult<T = Allergen> {
  success: boolean
  data?: T
  error?: string
  code?: 'NOT_FOUND' | 'DATABASE_ERROR' | 'UNAUTHORIZED'
}

export interface AllergenListResult {
  success: boolean
  data?: Allergen[]
  total?: number
  error?: string
  code?: 'DATABASE_ERROR' | 'UNAUTHORIZED'
}

/**
 * Get all allergens
 * AC-AL-01: Returns all 14 EU allergens sorted by display_order
 *
 * @param filters - Optional filters (search, is_eu_mandatory, is_active)
 * @returns AllergenListResult with allergens array or error
 */
export async function getAllergens(
  filters?: AllergenFilters
): Promise<AllergenListResult> {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
        total: 0,
      }
    }

    // Build query - NO org_id filter (global data)
    let query = supabase
      .from('allergens')
      .select('*', { count: 'exact' })
      .eq('is_active', filters?.is_active ?? true)

    // Filter by EU mandatory status
    if (filters?.is_eu_mandatory !== undefined) {
      query = query.eq('is_eu_mandatory', filters.is_eu_mandatory)
    }

    // AC-AS-01 to AC-AS-03: Full-text search across all language fields
    if (filters?.search && filters.search.trim().length > 0) {
      const searchTerm = filters.search.trim().toLowerCase()

      // Search across code and all language fields
      query = query.or(
        `code.ilike.%${searchTerm}%,` +
        `name_en.ilike.%${searchTerm}%,` +
        `name_pl.ilike.%${searchTerm}%,` +
        `name_de.ilike.%${searchTerm}%,` +
        `name_fr.ilike.%${searchTerm}%`
      )
    }

    // Always sort by display_order (AC-AL-01)
    query = query.order('display_order', { ascending: true })

    const { data: allergens, error, count } = await query

    if (error) {
      console.error('[AllergenService] Failed to fetch allergens:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
        total: 0,
      }
    }

    return {
      success: true,
      data: allergens || [],
      total: count ?? 0,
    }
  } catch (error) {
    console.error('[AllergenService] Error in getAllergens:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
      total: 0,
    }
  }
}

/**
 * Get allergen by ID
 * AC-AL-03: Returns single allergen by UUID
 *
 * @param id - Allergen UUID
 * @returns AllergenServiceResult with allergen data or error
 */
export async function getAllergenById(id: string): Promise<AllergenServiceResult> {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      }
    }

    // Fetch allergen - NO org_id filter (global data)
    const { data: allergen, error } = await supabase
      .from('allergens')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !allergen) {
      console.error('[AllergenService] Allergen not found:', id, error)
      return {
        success: false,
        error: 'Allergen not found',
        code: 'NOT_FOUND',
      }
    }

    return {
      success: true,
      data: allergen,
    }
  } catch (error) {
    console.error('[AllergenService] Error in getAllergenById:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Get allergen by code
 * AC-AL-02: Returns allergen by code (A01-A14)
 *
 * @param code - Allergen code (e.g., 'A01', 'A07')
 * @returns AllergenServiceResult with allergen data or error
 */
export async function getAllergenByCode(code: string): Promise<AllergenServiceResult> {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      }
    }

    // Fetch allergen by code - NO org_id filter (global data)
    const { data: allergen, error } = await supabase
      .from('allergens')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !allergen) {
      console.error('[AllergenService] Allergen not found by code:', code, error)
      return {
        success: false,
        error: `Allergen with code "${code}" not found`,
        code: 'NOT_FOUND',
      }
    }

    return {
      success: true,
      data: allergen,
    }
  } catch (error) {
    console.error('[AllergenService] Error in getAllergenByCode:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Get allergen name by language preference
 * AC-ML-01: Returns localized name based on user preference
 *
 * Helper method for UI display.
 *
 * @param allergen - Allergen object
 * @param lang - Language code ('en', 'pl', 'de', 'fr')
 * @returns Localized allergen name
 */
export function getName(allergen: Allergen, lang: 'en' | 'pl' | 'de' | 'fr' = 'en'): string {
  switch (lang) {
    case 'pl':
      return allergen.name_pl
    case 'de':
      return allergen.name_de || allergen.name_en
    case 'fr':
      return allergen.name_fr || allergen.name_en
    default:
      return allergen.name_en
  }
}

/**
 * Get allergens formatted for Select component
 * AC-UX-01: Returns allergens in format for dropdown selection
 *
 * @param lang - Language code for label
 * @returns Array of { value, label, code, icon_url }
 */
export async function getAllergensForSelect(
  lang: 'en' | 'pl' | 'de' | 'fr' = 'en'
): Promise<{ value: string; label: string; code: string; icon_url: string | null }[]> {
  const result = await getAllergens({ is_active: true })

  if (!result.success || !result.data) {
    return []
  }

  return result.data.map(allergen => ({
    value: allergen.id,
    label: getName(allergen, lang),
    code: allergen.code,
    icon_url: allergen.icon_url,
  }))
}
