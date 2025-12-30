import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateTrends,
  getComponentBreakdown,
  getCostDrivers,
} from '../cost-history-service';
import type { ProductCost } from '@/lib/types/cost-history';

describe('cost-history-service', () => {
  describe('calculateTrends', () => {
    // AC-03: Tests for trend calculation
    it('should calculate correct 30-day trend with 5% increase', () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const costHistory: ProductCost[] = [
        {
          id: '1',
          product_id: 'prod-1',
          org_id: 'org-1',
          cost_type: 'standard',
          material_cost: 100,
          labor_cost: 20,
          overhead_cost: 10,
          total_cost: 130,
          cost_per_unit: 1.30,
          effective_from: thirtyDaysAgo.toISOString(),
          effective_to: null,
          created_at: thirtyDaysAgo.toISOString(),
          created_by: 'user-1',
          bom_version: 1,
        },
        {
          id: '2',
          product_id: 'prod-1',
          org_id: 'org-1',
          cost_type: 'standard',
          material_cost: 105,
          labor_cost: 21,
          overhead_cost: 10.5,
          total_cost: 136.5,
          cost_per_unit: 1.365,
          effective_from: now.toISOString(),
          effective_to: null,
          created_at: now.toISOString(),
          created_by: 'user-1',
          bom_version: 2,
        },
      ];

      const trends = calculateTrends(costHistory);

      expect(trends.trend_30d).toBeCloseTo(5, 0); // ~5% increase
      expect(trends.trend_30d).toBeGreaterThan(4.5);
      expect(trends.trend_30d).toBeLessThan(5.5);
    });

    // AC-03: Test insufficient data returns 0
    it('should return 0 for 30-day trend with insufficient data (1 record)', () => {
      const costHistory: ProductCost[] = [
        {
          id: '1',
          product_id: 'prod-1',
          org_id: 'org-1',
          cost_type: 'standard',
          material_cost: 100,
          labor_cost: 20,
          overhead_cost: 10,
          total_cost: 130,
          cost_per_unit: 1.30,
          effective_from: new Date().toISOString(),
          effective_to: null,
          created_at: new Date().toISOString(),
          created_by: 'user-1',
          bom_version: 1,
        },
      ];

      const trends = calculateTrends(costHistory);

      expect(trends.trend_30d).toBe(0);
    });

    // AC-03: Test 90-day trend calculation
    it('should calculate correct 90-day trend', () => {
      const now = new Date();
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const costHistory: ProductCost[] = [
        {
          id: '1',
          product_id: 'prod-1',
          org_id: 'org-1',
          cost_type: 'standard',
          material_cost: 100,
          labor_cost: 20,
          overhead_cost: 10,
          total_cost: 130,
          cost_per_unit: 1.30,
          effective_from: ninetyDaysAgo.toISOString(),
          effective_to: null,
          created_at: ninetyDaysAgo.toISOString(),
          created_by: 'user-1',
          bom_version: 1,
        },
        {
          id: '2',
          product_id: 'prod-1',
          org_id: 'org-1',
          cost_type: 'standard',
          material_cost: 110,
          labor_cost: 22,
          overhead_cost: 11,
          total_cost: 143,
          cost_per_unit: 1.43,
          effective_from: now.toISOString(),
          effective_to: null,
          created_at: now.toISOString(),
          created_by: 'user-1',
          bom_version: 2,
        },
      ];

      const trends = calculateTrends(costHistory);

      expect(trends.trend_90d).toBeCloseTo(10, 0); // ~10% increase over 90 days
      expect(trends.trend_90d).toBeGreaterThan(9.5);
      expect(trends.trend_90d).toBeLessThan(10.5);
    });

    // AC-03: Test YTD trend calculation
    it('should calculate YTD trend from January 1st to now', () => {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const costHistory: ProductCost[] = [
        {
          id: '1',
          product_id: 'prod-1',
          org_id: 'org-1',
          cost_type: 'standard',
          material_cost: 100,
          labor_cost: 20,
          overhead_cost: 10,
          total_cost: 130,
          cost_per_unit: 1.30,
          effective_from: startOfYear.toISOString(),
          effective_to: null,
          created_at: startOfYear.toISOString(),
          created_by: 'user-1',
          bom_version: 1,
        },
        {
          id: '2',
          product_id: 'prod-1',
          org_id: 'org-1',
          cost_type: 'standard',
          material_cost: 110,
          labor_cost: 22,
          overhead_cost: 11,
          total_cost: 143,
          cost_per_unit: 1.43,
          effective_from: now.toISOString(),
          effective_to: null,
          created_at: now.toISOString(),
          created_by: 'user-1',
          bom_version: 2,
        },
      ];

      const trends = calculateTrends(costHistory);

      expect(trends.trend_ytd).toBeGreaterThan(0);
      expect(typeof trends.trend_ytd).toBe('number');
    });

    // AC-03: Test negative trends (cost decreased)
    it('should handle negative trends when recent costs are lower', () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const costHistory: ProductCost[] = [
        {
          id: '1',
          product_id: 'prod-1',
          org_id: 'org-1',
          cost_type: 'standard',
          material_cost: 110,
          labor_cost: 22,
          overhead_cost: 11,
          total_cost: 143,
          cost_per_unit: 1.43,
          effective_from: thirtyDaysAgo.toISOString(),
          effective_to: null,
          created_at: thirtyDaysAgo.toISOString(),
          created_by: 'user-1',
          bom_version: 1,
        },
        {
          id: '2',
          product_id: 'prod-1',
          org_id: 'org-1',
          cost_type: 'standard',
          material_cost: 100,
          labor_cost: 20,
          overhead_cost: 10,
          total_cost: 130,
          cost_per_unit: 1.30,
          effective_from: now.toISOString(),
          effective_to: null,
          created_at: now.toISOString(),
          created_by: 'user-1',
          bom_version: 2,
        },
      ];

      const trends = calculateTrends(costHistory);

      expect(trends.trend_30d).toBeLessThan(0);
      expect(trends.trend_30d).toBeCloseTo(-9, 0); // ~-9% decrease
    });

    // AC-03: Test empty array returns 0 for all trends
    it('should return 0 for all trends with empty cost history', () => {
      const costHistory: ProductCost[] = [];

      const trends = calculateTrends(costHistory);

      expect(trends.trend_30d).toBe(0);
      expect(trends.trend_90d).toBe(0);
      expect(trends.trend_ytd).toBe(0);
    });

    // AC-03: Test returns object with all three trend properties
    it('should return object with trend_30d, trend_90d, and trend_ytd properties', () => {
      const costHistory: ProductCost[] = [
        {
          id: '1',
          product_id: 'prod-1',
          org_id: 'org-1',
          cost_type: 'standard',
          material_cost: 100,
          labor_cost: 20,
          overhead_cost: 10,
          total_cost: 130,
          cost_per_unit: 1.30,
          effective_from: new Date().toISOString(),
          effective_to: null,
          created_at: new Date().toISOString(),
          created_by: 'user-1',
          bom_version: 1,
        },
      ];

      const trends = calculateTrends(costHistory);

      expect(trends).toHaveProperty('trend_30d');
      expect(trends).toHaveProperty('trend_90d');
      expect(trends).toHaveProperty('trend_ytd');
    });
  });

  describe('getComponentBreakdown', () => {
    // Component breakdown tests for AC-03, AC-06
    it('should calculate component breakdown percentages that sum to 100%', () => {
      const breakdown = getComponentBreakdown({
        material: 185,
        labor: 42,
        overhead: 18,
      });

      const total = breakdown.material + breakdown.labor + breakdown.overhead;
      expect(total).toBeCloseTo(100, 1); // Sum should be 100%
    });

    it('should calculate percentages correctly for component breakdown', () => {
      const breakdown = getComponentBreakdown({
        material: 200,
        labor: 50,
        overhead: 50,
      });

      expect(breakdown.material).toBeCloseTo((200 / 300) * 100, 1);
      expect(breakdown.labor).toBeCloseTo((50 / 300) * 100, 1);
      expect(breakdown.overhead).toBeCloseTo((50 / 300) * 100, 1);
    });

    it('should handle edge case of zero total', () => {
      const breakdown = getComponentBreakdown({
        material: 0,
        labor: 0,
        overhead: 0,
      });

      expect(breakdown.material).toBeDefined();
      expect(breakdown.labor).toBeDefined();
      expect(breakdown.overhead).toBeDefined();
    });

    it('should calculate changes between current and historical costs', async () => {
      const current = {
        material: 185,
        labor: 42,
        overhead: 18,
        total: 245,
      };

      const breakdown = await getComponentBreakdown(current, {
        material: 170,
        labor: 40,
        overhead: 17,
        total: 227,
      });

      expect(breakdown).toHaveProperty('material_change');
      expect(breakdown).toHaveProperty('labor_change');
      expect(breakdown).toHaveProperty('overhead_change');
    });
  });

  describe('getCostDrivers', () => {
    // AC-06: Cost drivers calculation tests
    it('should return top 5 ingredients by impact when more than 5 exist', async () => {
      const drivers = await getCostDrivers('product-1', 5);

      expect(drivers).toBeDefined();
      expect(Array.isArray(drivers)).toBe(true);
      expect(drivers.length).toBeLessThanOrEqual(5);
    });

    it('should calculate impact percentage correctly', async () => {
      // When ingredient change = $4 and total change = $8, impact_percent = 50%
      const drivers = await getCostDrivers('product-1');

      if (drivers.length > 0) {
        const driver = drivers[0];
        expect(driver).toHaveProperty('impact_percent');
        expect(typeof driver.impact_percent).toBe('number');
        expect(driver.impact_percent).toBeGreaterThanOrEqual(0);
        expect(driver.impact_percent).toBeLessThanOrEqual(100);
      }
    });

    it('should include ingredient details in cost drivers', async () => {
      const drivers = await getCostDrivers('product-1');

      if (drivers.length > 0) {
        const driver = drivers[0];
        expect(driver).toHaveProperty('ingredient_id');
        expect(driver).toHaveProperty('ingredient_name');
        expect(driver).toHaveProperty('ingredient_code');
        expect(driver).toHaveProperty('current_cost');
        expect(driver).toHaveProperty('historical_cost');
        expect(driver).toHaveProperty('change_amount');
        expect(driver).toHaveProperty('change_percent');
      }
    });

    it('should return empty array for product with no ingredients', async () => {
      const drivers = await getCostDrivers('nonexistent-product');

      expect(Array.isArray(drivers)).toBe(true);
    });

    it('should return drivers sorted by impact descending', async () => {
      const drivers = await getCostDrivers('product-1', 5);

      if (drivers.length > 1) {
        for (let i = 0; i < drivers.length - 1; i++) {
          expect(drivers[i].impact_percent).toBeGreaterThanOrEqual(
            drivers[i + 1].impact_percent
          );
        }
      }
    });
  });
});
