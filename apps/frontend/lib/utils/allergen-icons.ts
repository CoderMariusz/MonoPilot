/**
 * Allergen Icon Utilities (Story 02.3 - Refactor)
 * Purpose: Shared allergen icon mapping for EU 14 allergens
 *
 * Usage:
 * import { getDefaultAllergenIcon } from '@/lib/utils/allergen-icons'
 * const icon = getDefaultAllergenIcon('A01') // Returns wheat emoji
 */

/**
 * Default emoji icon map for EU 14 allergens
 * Fallback when icon_url is not available from database
 */
const ALLERGEN_ICON_MAP: Record<string, string> = {
  A01: '\u{1F33E}', // Gluten (wheat)
  A02: '\u{1F990}', // Crustaceans (shrimp)
  A03: '\u{1F95A}', // Eggs
  A04: '\u{1F41F}', // Fish
  A05: '\u{1F95C}', // Peanuts
  A06: '\u{1FAD8}', // Soybeans (beans)
  A07: '\u{1F95B}', // Milk
  A08: '\u{1F330}', // Tree Nuts (chestnut)
  A09: '\u{1F33F}', // Celery (herb)
  A10: '\u{1F7E1}', // Mustard (yellow circle)
  A11: '\u{1F331}', // Sesame (seedling)
  A12: '\u{1F347}', // Sulphites (grapes)
  A13: '\u{1FAD9}', // Lupin (pea pod)
  A14: '\u{1F41A}', // Molluscs (shell)
}

/**
 * Get default emoji icon for allergen based on code
 * @param code - Allergen code (A01-A14)
 * @returns Emoji string
 */
export function getDefaultAllergenIcon(code: string): string {
  return ALLERGEN_ICON_MAP[code] || '\u{26A0}\u{FE0F}' // Warning sign fallback
}
