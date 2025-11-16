/**
 * UoM Utilities
 * Story 0.5: Fix LP UoM Constraint
 * 
 * Helper functions for working with Units of Measure
 */

import type { UoM } from '../types';

/**
 * UoM display name mapping
 * Based on uom_master table
 */
export const UOM_DISPLAY_NAMES: Record<UoM, string> = {
  // Weight
  KG: 'Kilogram',
  POUND: 'Pound',
  GRAM: 'Gram',
  TON: 'Metric Ton',
  OUNCE: 'Ounce',
  
  // Volume
  LITER: 'Liter',
  GALLON: 'US Gallon',
  MILLILITER: 'Milliliter',
  BARREL: 'Barrel',
  QUART: 'Quart',
  
  // Length
  METER: 'Meter',
  FOOT: 'Foot',
  INCH: 'Inch',
  CENTIMETER: 'Centimeter',
  
  // Count
  EACH: 'Each (Unit)',
  DOZEN: 'Dozen (12 units)',
  
  // Container
  BOX: 'Box',
  CASE: 'Case',
  PALLET: 'Pallet',
  DRUM: 'Drum',
  BAG: 'Bag',
  CARTON: 'Carton'
};

/**
 * UoM category mapping
 */
export const UOM_CATEGORIES: Record<UoM, string> = {
  KG: 'weight', POUND: 'weight', GRAM: 'weight', TON: 'weight', OUNCE: 'weight',
  LITER: 'volume', GALLON: 'volume', MILLILITER: 'volume', BARREL: 'volume', QUART: 'volume',
  METER: 'length', FOOT: 'length', INCH: 'length', CENTIMETER: 'length',
  EACH: 'count', DOZEN: 'count',
  BOX: 'container', CASE: 'container', PALLET: 'container', DRUM: 'container', BAG: 'container', CARTON: 'container'
};

/**
 * Get display-friendly label for UoM
 * @param uom - Unit of measure code
 * @param includeCode - Include code in label (e.g., "KG - Kilogram")
 * @returns Display-friendly label
 */
export function getUoMLabel(uom: UoM | string, includeCode = false): string {
  const displayName = UOM_DISPLAY_NAMES[uom as UoM];
  if (!displayName) return uom;
  
  if (includeCode) {
    return `${uom} - ${displayName}`;
  }
  
  return displayName;
}

/**
 * Get UoM category
 * @param uom - Unit of measure code
 * @returns Category (weight, volume, length, count, container)
 */
export function getUoMCategory(uom: UoM | string): string {
  return UOM_CATEGORIES[uom as UoM] || 'unknown';
}

/**
 * Get all UoMs by category
 * @param category - Category to filter by
 * @returns Array of UoM codes in that category
 */
export function getUoMsByCategory(category: string): UoM[] {
  return Object.entries(UOM_CATEGORIES)
    .filter(([_, cat]) => cat === category)
    .map(([uom, _]) => uom as UoM);
}

/**
 * Validate UoM code
 * @param uom - Unit of measure to validate
 * @returns true if valid, false otherwise
 */
export function isValidUoM(uom: string): uom is UoM {
  return uom in UOM_DISPLAY_NAMES;
}
