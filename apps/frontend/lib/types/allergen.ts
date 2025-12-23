/**
 * Allergen Types
 * Story: 01.12 - Allergens Management
 *
 * Type definitions for EU-mandated allergens (global reference data)
 */

export interface Allergen {
  id: string
  code: string
  name_en: string
  name_pl: string
  name_de: string | null
  name_fr: string | null
  icon_url: string | null
  icon_svg: string | null
  is_eu_mandatory: boolean
  is_custom: boolean
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface AllergenSelectOption {
  value: string
  label: string
  code: string
  icon_url: string | null
}

/**
 * Get localized allergen name based on language preference
 */
export function getAllergenName(allergen: Allergen, lang: 'en' | 'pl' | 'de' | 'fr' = 'en'): string {
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
