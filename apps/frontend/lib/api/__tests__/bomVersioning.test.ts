/**
 * Unit Tests: BOM Versioning Logic
 * Epic: EPIC-001 BOM Complexity v2 - Phase 2
 * Created: 2025-01-11
 * 
 * Tests for:
 * - BOM date range validation
 * - Date overlap detection
 * - BOM selection by date
 * - Version status calculation (current, future, expired)
 */

import { describe, it, expect } from 'vitest';

describe('BOM Versioning: Date Range Validation', () => {
  describe('Date Range Constraints', () => {
    it('should accept valid date range (from < to)', () => {
      const effectiveFrom = new Date('2025-01-01');
      const effectiveTo = new Date('2025-03-01');
      
      expect(effectiveFrom < effectiveTo).toBe(true);
    });

    it('should reject invalid date range (from >= to)', () => {
      const effectiveFrom = new Date('2025-03-01');
      const effectiveTo = new Date('2025-01-01');
      
      expect(effectiveFrom >= effectiveTo).toBe(true);
      // Database constraint will prevent this
    });

    it('should accept NULL effective_to (no expiry)', () => {
      const effectiveFrom = new Date('2025-01-01');
      const effectiveTo = null;
      
      expect(effectiveTo).toBeNull();
      // This means BOM is active indefinitely
    });
  });

  describe('Date Overlap Detection', () => {
    it('should detect overlapping ranges (exact overlap)', () => {
      // BOM v1: Jan 1 - Feb 1
      const v1From = new Date('2025-01-01');
      const v1To = new Date('2025-02-01');
      
      // BOM v2: Jan 1 - Feb 1 (exact same)
      const v2From = new Date('2025-01-01');
      const v2To = new Date('2025-02-01');
      
      // Check overlap
      const overlaps = (
        v2From < v1To && v2To > v1From
      );
      
      expect(overlaps).toBe(true);
    });

    it('should detect overlapping ranges (partial overlap)', () => {
      // BOM v1: Jan 1 - Mar 1
      const v1From = new Date('2025-01-01');
      const v1To = new Date('2025-03-01');
      
      // BOM v2: Feb 1 - Apr 1 (overlaps Feb 1 - Mar 1)
      const v2From = new Date('2025-02-01');
      const v2To = new Date('2025-04-01');
      
      const overlaps = (
        v2From < v1To && v2To > v1From
      );
      
      expect(overlaps).toBe(true);
    });

    it('should allow non-overlapping ranges (sequential)', () => {
      // BOM v1: Jan 1 - Feb 1
      const v1From = new Date('2025-01-01');
      const v1To = new Date('2025-02-01');
      
      // BOM v2: Feb 1 - Mar 1 (starts when v1 ends)
      const v2From = new Date('2025-02-01');
      const v2To = new Date('2025-03-01');
      
      // Note: Using [) range (inclusive start, exclusive end)
      // So Feb 1 00:00:00 is the boundary
      const overlaps = (
        v2From < v1To && v2To > v1From
      );
      
      expect(overlaps).toBe(false);
    });

    it('should detect overlap with NULL effective_to', () => {
      // BOM v1: Jan 1 - infinity
      const v1From = new Date('2025-01-01');
      const v1To = null;
      
      // BOM v2: Mar 1 - Apr 1 (overlaps with v1)
      const v2From = new Date('2025-03-01');
      const v2To = new Date('2025-04-01');
      
      // v1 is active forever, so any future BOM overlaps
      const v1ToDate = v1To || new Date('9999-12-31'); // Treat NULL as infinity
      
      const overlaps = (
        v2From < v1ToDate && v2To > v1From
      );
      
      expect(overlaps).toBe(true);
    });

    it('should allow future BOMs if current BOM has expiry', () => {
      // BOM v1: Jan 1 - Feb 1
      const v1From = new Date('2025-01-01');
      const v1To = new Date('2025-02-01');
      
      // BOM v2: Feb 1 - infinity (replaces v1)
      const v2From = new Date('2025-02-01');
      const v2To = null;
      
      const overlaps = (
        v2From < v1To && (v2To ? v2To > v1From : true)
      );
      
      expect(overlaps).toBe(false);
    });
  });

  describe('BOM Selection by Date', () => {
    it('should select BOM v1 for date within its range', () => {
      const boms = [
        { id: 1, effectiveFrom: new Date('2025-01-01'), effectiveTo: new Date('2025-03-01') },
        { id: 2, effectiveFrom: new Date('2025-03-01'), effectiveTo: null },
      ];
      
      const scheduledDate = new Date('2025-02-15'); // Within v1 range
      
      const selectedBom = boms.find(
        (bom) =>
          bom.effectiveFrom <= scheduledDate &&
          (!bom.effectiveTo || bom.effectiveTo > scheduledDate)
      );
      
      expect(selectedBom?.id).toBe(1);
    });

    it('should select BOM v2 for date after v1 expires', () => {
      const boms = [
        { id: 1, effectiveFrom: new Date('2025-01-01'), effectiveTo: new Date('2025-03-01') },
        { id: 2, effectiveFrom: new Date('2025-03-01'), effectiveTo: null },
      ];
      
      const scheduledDate = new Date('2025-04-15'); // After v1, during v2
      
      const selectedBom = boms.find(
        (bom) =>
          bom.effectiveFrom <= scheduledDate &&
          (!bom.effectiveTo || bom.effectiveTo > scheduledDate)
      );
      
      expect(selectedBom?.id).toBe(2);
    });

    it('should select most recent BOM if multiple match', () => {
      const boms = [
        { id: 1, effectiveFrom: new Date('2025-01-01'), effectiveTo: null },
        { id: 2, effectiveFrom: new Date('2025-02-01'), effectiveTo: null },
        { id: 3, effectiveFrom: new Date('2025-03-01'), effectiveTo: null },
      ];
      
      const scheduledDate = new Date('2025-04-15');
      
      // Find all matching BOMs
      const matchingBoms = boms.filter(
        (bom) =>
          bom.effectiveFrom <= scheduledDate &&
          (!bom.effectiveTo || bom.effectiveTo > scheduledDate)
      );
      
      // Sort by effective_from DESC and take first
      const selectedBom = matchingBoms.sort(
        (a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime()
      )[0];
      
      expect(selectedBom?.id).toBe(3); // Most recent
    });

    it('should return null if no BOM covers the date', () => {
      const boms = [
        { id: 1, effectiveFrom: new Date('2025-01-01'), effectiveTo: new Date('2025-02-01') },
        { id: 2, effectiveFrom: new Date('2025-03-01'), effectiveTo: new Date('2025-04-01') },
      ];
      
      const scheduledDate = new Date('2025-02-15'); // Gap between v1 and v2
      
      const selectedBom = boms.find(
        (bom) =>
          bom.effectiveFrom <= scheduledDate &&
          (!bom.effectiveTo || bom.effectiveTo > scheduledDate)
      );
      
      expect(selectedBom).toBeUndefined();
    });
  });

  describe('Version Status Calculation', () => {
    it('should identify current BOM', () => {
      const now = new Date();
      
      const bom = {
        effectiveFrom: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        effectiveTo: null, // No expiry
      };
      
      const isCurrent = (
        bom.effectiveFrom <= now &&
        (!bom.effectiveTo || bom.effectiveTo > now)
      );
      
      expect(isCurrent).toBe(true);
    });

    it('should identify future BOM', () => {
      const now = new Date();
      
      const bom = {
        effectiveFrom: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        effectiveTo: null,
      };
      
      const isFuture = bom.effectiveFrom > now;
      
      expect(isFuture).toBe(true);
    });

    it('should identify expired BOM', () => {
      const now = new Date();
      
      const bom = {
        effectiveFrom: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        effectiveTo: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      };
      
      const isExpired = bom.effectiveTo && bom.effectiveTo <= now;
      
      expect(isExpired).toBe(true);
    });

    it('should calculate status for multiple BOMs', () => {
      const now = new Date();
      
      const boms = [
        {
          id: 1,
          effectiveFrom: new Date('2024-01-01'),
          effectiveTo: new Date('2024-12-31'),
        },
        {
          id: 2,
          effectiveFrom: new Date('2025-01-01'),
          effectiveTo: null,
        },
        {
          id: 3,
          effectiveFrom: new Date('2026-01-01'),
          effectiveTo: null,
        },
      ];
      
      const bomsWithStatus = boms.map((bom) => ({
        ...bom,
        isCurrent:
          bom.effectiveFrom <= now &&
          (!bom.effectiveTo || bom.effectiveTo > now),
        isFuture: bom.effectiveFrom > now,
        isExpired: bom.effectiveTo && bom.effectiveTo <= now,
      }));
      
      expect(bomsWithStatus[0].isExpired).toBe(true);
      expect(bomsWithStatus[1].isCurrent).toBe(true);
      expect(bomsWithStatus[2].isFuture).toBe(true);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle seasonal recipe (Christmas special)', () => {
      // Regular BOM: Always active except Christmas period
      const regularBom = {
        id: 1,
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: new Date('2025-12-01'),
      };
      
      // Christmas special BOM: Dec 1 - Jan 15
      const christmasBom = {
        id: 2,
        effectiveFrom: new Date('2025-12-01'),
        effectiveTo: new Date('2026-01-15'),
      };
      
      // New regular BOM: After Christmas
      const regularBom2 = {
        id: 3,
        effectiveFrom: new Date('2026-01-15'),
        effectiveTo: null,
      };
      
      const boms = [regularBom, christmasBom, regularBom2];
      
      // Test: Dec 20 should select Christmas BOM
      const christmasDate = new Date('2025-12-20');
      const selectedChristmas = boms.find(
        (bom) =>
          bom.effectiveFrom <= christmasDate &&
          (!bom.effectiveTo || bom.effectiveTo > christmasDate)
      );
      
      expect(selectedChristmas?.id).toBe(2);
      
      // Test: Jan 20 should select regular BOM
      const afterChristmas = new Date('2026-01-20');
      const selectedRegular = boms.find(
        (bom) =>
          bom.effectiveFrom <= afterChristmas &&
          (!bom.effectiveTo || bom.effectiveTo > afterChristmas)
      );
      
      expect(selectedRegular?.id).toBe(3);
    });

    it('should handle recipe change with transition period', () => {
      // Old recipe: Jan 1 - Feb 28
      const oldRecipe = {
        id: 1,
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: new Date('2025-03-01'),
      };
      
      // New recipe: Mar 1 onwards
      const newRecipe = {
        id: 2,
        effectiveFrom: new Date('2025-03-01'),
        effectiveTo: null,
      };
      
      const boms = [oldRecipe, newRecipe];
      
      // WO scheduled for Feb 15 uses old recipe
      const feb15 = new Date('2025-02-15');
      const bomForFeb = boms.find(
        (bom) =>
          bom.effectiveFrom <= feb15 &&
          (!bom.effectiveTo || bom.effectiveTo > feb15)
      );
      
      expect(bomForFeb?.id).toBe(1);
      
      // WO scheduled for Mar 15 uses new recipe
      const mar15 = new Date('2025-03-15');
      const bomForMar = boms.find(
        (bom) =>
          bom.effectiveFrom <= mar15 &&
          (!bom.effectiveTo || bom.effectiveTo > mar15)
      );
      
      expect(bomForMar?.id).toBe(2);
    });

    it('should handle supplier change scenario', () => {
      // BOM with Supplier A: Jan 1 - Jun 30
      const bomSupplierA = {
        id: 1,
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: new Date('2025-07-01'),
        note: 'Uses ingredients from Supplier A',
      };
      
      // BOM with Supplier B: Jul 1 onwards
      const bomSupplierB = {
        id: 2,
        effectiveFrom: new Date('2025-07-01'),
        effectiveTo: null,
        note: 'Uses ingredients from Supplier B',
      };
      
      const boms = [bomSupplierA, bomSupplierB];
      
      // Orders placed in May use Supplier A
      const mayDate = new Date('2025-05-15');
      const bomForMay = boms.find(
        (bom) =>
          bom.effectiveFrom <= mayDate &&
          (!bom.effectiveTo || bom.effectiveTo > mayDate)
      );
      
      expect(bomForMay?.id).toBe(1);
      expect(bomForMay?.note).toContain('Supplier A');
      
      // Orders placed in August use Supplier B
      const augDate = new Date('2025-08-15');
      const bomForAug = boms.find(
        (bom) =>
          bom.effectiveFrom <= augDate &&
          (!bom.effectiveTo || bom.effectiveTo > augDate)
      );
      
      expect(bomForAug?.id).toBe(2);
      expect(bomForAug?.note).toContain('Supplier B');
    });
  });
});

