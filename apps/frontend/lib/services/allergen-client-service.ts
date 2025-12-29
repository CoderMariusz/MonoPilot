/**
 * Allergen Client Service
 * 
 * Fetches allergen data via API endpoints.
 * Safe for use in Client Components ('use client').
 */

import type { AllergenProductCount } from './allergen-service-v2'

/**
 * Fetch product counts for all allergens via API
 * 
 * @returns Array of { allergen_id, product_count }
 */
export async function fetchAllergenProductCounts(): Promise<AllergenProductCount[]> {
    try {
        const response = await fetch('/api/v1/settings/allergens/counts')

        if (!response.ok) {
            console.error('[AllergenClientService] API error:', response.status)
            return []
        }

        const data = await response.json()
        return data as AllergenProductCount[]
    } catch (error) {
        console.error('[AllergenClientService] Fetch error:', error)
        return []
    }
}

/**
 * Fetch product count for a single allergen via API
 * 
 * @param allergenId - Allergen UUID
 * @returns Product count for the allergen
 */
export async function fetchProductCountForAllergen(allergenId: string): Promise<number> {
    try {
        const response = await fetch(`/api/v1/settings/allergens/${allergenId}/count`)

        if (!response.ok) {
            console.error('[AllergenClientService] API error:', response.status)
            return 0
        }

        const data = await response.json()
        return data.product_count ?? 0
    } catch (error) {
        console.error('[AllergenClientService] Fetch error:', error)
        return 0
    }
}
