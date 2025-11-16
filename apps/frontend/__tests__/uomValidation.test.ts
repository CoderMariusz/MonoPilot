/**
 * UoM Validation Tests
 * Story 0.5: Fix LP UoM Constraint
 */

import { describe, it, expect } from 'vitest';
import { isValidUoM, getUoMLabel, getUoMCategory, getUoMsByCategory, UOM_DISPLAY_NAMES } from '../lib/utils/uom';
import type { UoM } from '../lib/types';

describe('UoM Validation', () => {
  describe('isValidUoM', () => {
    it('should validate all 22 standard UoMs as valid', () => {
      const validUoMs: UoM[] = [
        'KG', 'POUND', 'GRAM', 'TON', 'OUNCE',
        'LITER', 'GALLON', 'MILLILITER', 'BARREL', 'QUART',
        'METER', 'FOOT', 'INCH', 'CENTIMETER',
        'EACH', 'DOZEN',
        'BOX', 'CASE', 'PALLET', 'DRUM', 'BAG', 'CARTON'
      ];

      validUoMs.forEach(uom => {
        expect(isValidUoM(uom)).toBe(true);
      });
    });

    it('should reject invalid UoMs', () => {
      const invalidUoMs = ['KGS', 'EA', 'L', 'M', 'INVALID', 'kg', 'liter'];
      
      invalidUoMs.forEach(uom => {
        expect(isValidUoM(uom)).toBe(false);
      });
    });

    it('should be case-sensitive', () => {
      expect(isValidUoM('KG')).toBe(true);
      expect(isValidUoM('kg')).toBe(false);
      expect(isValidUoM('Kg')).toBe(false);
    });
  });

  describe('getUoMLabel', () => {
    it('should return display name for valid UoMs', () => {
      expect(getUoMLabel('KG')).toBe('Kilogram');
      expect(getUoMLabel('GALLON')).toBe('US Gallon');
      expect(getUoMLabel('EACH')).toBe('Each (Unit)');
    });

    it('should include code when includeCode is true', () => {
      expect(getUoMLabel('KG', true)).toBe('KG - Kilogram');
      expect(getUoMLabel('GALLON', true)).toBe('GALLON - US Gallon');
    });

    it('should return input for invalid UoMs', () => {
      expect(getUoMLabel('INVALID')).toBe('INVALID');
    });
  });

  describe('getUoMCategory', () => {
    it('should return correct category for weight UoMs', () => {
      expect(getUoMCategory('KG')).toBe('weight');
      expect(getUoMCategory('POUND')).toBe('weight');
      expect(getUoMCategory('TON')).toBe('weight');
    });

    it('should return correct category for volume UoMs', () => {
      expect(getUoMCategory('LITER')).toBe('volume');
      expect(getUoMCategory('GALLON')).toBe('volume');
    });

    it('should return correct category for container UoMs', () => {
      expect(getUoMCategory('BOX')).toBe('container');
      expect(getUoMCategory('PALLET')).toBe('container');
    });

    it('should return unknown for invalid UoMs', () => {
      expect(getUoMCategory('INVALID')).toBe('unknown');
    });
  });

  describe('getUoMsByCategory', () => {
    it('should return all weight UoMs', () => {
      const weightUoMs = getUoMsByCategory('weight');
      expect(weightUoMs).toContain('KG');
      expect(weightUoMs).toContain('POUND');
      expect(weightUoMs).toContain('GRAM');
      expect(weightUoMs).toContain('TON');
      expect(weightUoMs).toContain('OUNCE');
      expect(weightUoMs).toHaveLength(5);
    });

    it('should return all volume UoMs', () => {
      const volumeUoMs = getUoMsByCategory('volume');
      expect(volumeUoMs).toHaveLength(5);
      expect(volumeUoMs).toContain('GALLON');
    });

    it('should return all container UoMs', () => {
      const containerUoMs = getUoMsByCategory('container');
      expect(containerUoMs).toHaveLength(6);
      expect(containerUoMs).toContain('PALLET');
      expect(containerUoMs).toContain('DRUM');
    });

    it('should return empty array for invalid category', () => {
      expect(getUoMsByCategory('invalid')).toEqual([]);
    });
  });

  describe('UOM_DISPLAY_NAMES constant', () => {
    it('should have exactly 23 entries', () => {
      const count = Object.keys(UOM_DISPLAY_NAMES).length;
      expect(count).toBe(22);
    });

    it('should have non-empty display names', () => {
      Object.entries(UOM_DISPLAY_NAMES).forEach(([code, name]) => {
        expect(name).toBeTruthy();
        expect(name.length).toBeGreaterThan(0);
      });
    });
  });
});
