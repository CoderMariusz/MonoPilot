import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateVariance,
  identifySignificantVariances,
} from '../variance-analysis-service';
import type { ProductCost, VarianceComponent, WorkOrderCost } from '@/lib/types/variance';

describe('variance-analysis-service', () => {
  describe('calculateVariance', () => {
    // AC-09: Material variance calculation tests
    it('should calculate correct material variance when standard=$185.50, actual=$188.20', () => {
      const standardCosts: ProductCost = {
        id: '1',
        product_id: 'prod-1',
        org_id: 'org-1',
        cost_type: 'standard',
        material_cost: 185.5,
        labor_cost: 45,
        overhead_cost: 20,
        total_cost: 250.5,
        cost_per_unit: 2.505,
        effective_from: new Date().toISOString(),
        effective_to: null,
        created_at: new Date().toISOString(),
        created_by: 'user-1',
        bom_version: 1,
      };

      const actualCosts: WorkOrderCost[] = [
        {
          id: '1',
          work_order_id: 'wo-1',
          org_id: 'org-1',
          product_id: 'prod-1',
          material_cost: 188.2,
          labor_cost: 45.5,
          overhead_cost: 20.5,
          total_cost: 254.2,
          created_at: new Date().toISOString(),
          created_by: 'user-1',
        },
      ];

      const variance = calculateVariance(standardCosts, actualCosts);

      expect(variance.components).toBeDefined();
      if (variance.components) {
        expect(variance.components.material.variance).toBeCloseTo(2.7, 1); // 188.2 - 185.5 = 2.7
        expect(variance.components.material.variance_percent).toBeCloseTo(1.46, 1); // (2.7 / 185.5) * 100 ≈ 1.46%
      }
    });

    // AC-09: Test variance calculations for all components
    it('should calculate variance for all components (material, labor, overhead, total)', () => {
      const standardCosts: ProductCost = {
        id: '1',
        product_id: 'prod-1',
        org_id: 'org-1',
        cost_type: 'standard',
        material_cost: 100,
        labor_cost: 30,
        overhead_cost: 20,
        total_cost: 150,
        cost_per_unit: 1.5,
        effective_from: new Date().toISOString(),
        effective_to: null,
        created_at: new Date().toISOString(),
        created_by: 'user-1',
        bom_version: 1,
      };

      const actualCosts: WorkOrderCost[] = [
        {
          id: '1',
          work_order_id: 'wo-1',
          org_id: 'org-1',
          product_id: 'prod-1',
          material_cost: 105,
          labor_cost: 32,
          overhead_cost: 22,
          total_cost: 159,
          created_at: new Date().toISOString(),
          created_by: 'user-1',
        },
      ];

      const variance = calculateVariance(standardCosts, actualCosts);

      expect(variance.components).toBeDefined();
      if (variance.components) {
        expect(variance.components.material).toBeDefined();
        expect(variance.components.labor).toBeDefined();
        expect(variance.components.overhead).toBeDefined();
        expect(variance.components.total).toBeDefined();
      }
    });

    // AC-10: Significant variance identification
    it('should identify significant variances for labor variance >5%', () => {
      const standardCosts: ProductCost = {
        id: '1',
        product_id: 'prod-1',
        org_id: 'org-1',
        cost_type: 'standard',
        material_cost: 100,
        labor_cost: 30,
        overhead_cost: 20,
        total_cost: 150,
        cost_per_unit: 1.5,
        effective_from: new Date().toISOString(),
        effective_to: null,
        created_at: new Date().toISOString(),
        created_by: 'user-1',
        bom_version: 1,
      };

      const actualCosts: WorkOrderCost[] = [
        {
          id: '1',
          work_order_id: 'wo-1',
          org_id: 'org-1',
          product_id: 'prod-1',
          material_cost: 100,
          labor_cost: 32.37, // 7.9% over standard (30 * 1.079 = 32.37)
          overhead_cost: 20,
          total_cost: 152.37,
          created_at: new Date().toISOString(),
          created_by: 'user-1',
        },
      ];

      const variance = calculateVariance(standardCosts, actualCosts);

      expect(variance.significant_variances).toBeDefined();
      expect(Array.isArray(variance.significant_variances)).toBe(true);
      const laborVariance = variance.significant_variances.find(
        (v) => v.component === 'labor'
      );
      expect(laborVariance).toBeDefined();
      if (laborVariance) {
        expect(laborVariance.variance_percent).toBeCloseTo(7.9, 0);
      }
    });

    // AC-11: Empty actual costs returns empty components
    it('should return empty for no work orders with work_orders_analyzed = 0', () => {
      const standardCosts: ProductCost = {
        id: '1',
        product_id: 'prod-1',
        org_id: 'org-1',
        cost_type: 'standard',
        material_cost: 100,
        labor_cost: 30,
        overhead_cost: 20,
        total_cost: 150,
        cost_per_unit: 1.5,
        effective_from: new Date().toISOString(),
        effective_to: null,
        created_at: new Date().toISOString(),
        created_by: 'user-1',
        bom_version: 1,
      };

      const actualCosts: WorkOrderCost[] = [];

      const variance = calculateVariance(standardCosts, actualCosts);

      expect(variance.components).toBeNull();
      expect(variance.work_orders_analyzed).toBe(0);
      expect(variance.significant_variances).toHaveLength(0);
    });

    // AC-08: Multiple work orders averaging
    it('should average actual values across multiple work orders', () => {
      const standardCosts: ProductCost = {
        id: '1',
        product_id: 'prod-1',
        org_id: 'org-1',
        cost_type: 'standard',
        material_cost: 100,
        labor_cost: 30,
        overhead_cost: 20,
        total_cost: 150,
        cost_per_unit: 1.5,
        effective_from: new Date().toISOString(),
        effective_to: null,
        created_at: new Date().toISOString(),
        created_by: 'user-1',
        bom_version: 1,
      };

      const actualCosts: WorkOrderCost[] = [
        {
          id: '1',
          work_order_id: 'wo-1',
          org_id: 'org-1',
          product_id: 'prod-1',
          material_cost: 100,
          labor_cost: 30,
          overhead_cost: 20,
          total_cost: 150,
          created_at: new Date().toISOString(),
          created_by: 'user-1',
        },
        {
          id: '2',
          work_order_id: 'wo-2',
          org_id: 'org-1',
          product_id: 'prod-1',
          material_cost: 110,
          labor_cost: 35,
          overhead_cost: 25,
          total_cost: 170,
          created_at: new Date().toISOString(),
          created_by: 'user-1',
        },
        {
          id: '3',
          work_order_id: 'wo-3',
          org_id: 'org-1',
          product_id: 'prod-1',
          material_cost: 105,
          labor_cost: 32,
          overhead_cost: 22,
          total_cost: 159,
          created_at: new Date().toISOString(),
          created_by: 'user-1',
        },
      ];

      const variance = calculateVariance(standardCosts, actualCosts);

      expect(variance.work_orders_analyzed).toBe(3);
      expect(variance.components).toBeDefined();
      if (variance.components) {
        // Average material: (100 + 110 + 105) / 3 = 105
        expect(variance.components.material.actual).toBeCloseTo(105, 1);
        // Average labor: (30 + 35 + 32) / 3 = 32.33
        expect(variance.components.labor.actual).toBeCloseTo(32.33, 1);
        // Average overhead: (20 + 25 + 22) / 3 = 22.33
        expect(variance.components.overhead.actual).toBeCloseTo(22.33, 1);
      }
    });

    // AC-08: Test work_orders_analyzed count
    it('should correctly count analyzed work orders', () => {
      const standardCosts: ProductCost = {
        id: '1',
        product_id: 'prod-1',
        org_id: 'org-1',
        cost_type: 'standard',
        material_cost: 100,
        labor_cost: 30,
        overhead_cost: 20,
        total_cost: 150,
        cost_per_unit: 1.5,
        effective_from: new Date().toISOString(),
        effective_to: null,
        created_at: new Date().toISOString(),
        created_by: 'user-1',
        bom_version: 1,
      };

      const actualCosts: WorkOrderCost[] = Array.from({ length: 12 }, (_, i) => ({
        id: `${i}`,
        work_order_id: `wo-${i}`,
        org_id: 'org-1',
        product_id: 'prod-1',
        material_cost: 100 + i,
        labor_cost: 30 + i,
        overhead_cost: 20 + i,
        total_cost: 150 + i * 3,
        created_at: new Date().toISOString(),
        created_by: 'user-1',
      }));

      const variance = calculateVariance(standardCosts, actualCosts);

      expect(variance.work_orders_analyzed).toBe(12);
    });
  });

  describe('identifySignificantVariances', () => {
    // AC-10: Threshold enforcement
    it('should not flag variance of 4.9% as significant with 5% threshold', () => {
      const components = {
        material: {
          standard: 100,
          actual: 104.9,
          variance: 4.9,
          variance_percent: 4.9,
        },
        labor: {
          standard: 30,
          actual: 30,
          variance: 0,
          variance_percent: 0,
        },
        overhead: {
          standard: 20,
          actual: 20,
          variance: 0,
          variance_percent: 0,
        },
        total: {
          standard: 150,
          actual: 154.9,
          variance: 4.9,
          variance_percent: 3.27,
        },
      };

      const threshold = 5;
      const significant = identifySignificantVariances(components, threshold);

      const materialVariance = significant.find((v) => v.component === 'material');
      expect(materialVariance).toBeUndefined(); // Should not be flagged
    });

    // AC-10: Test flag for variance above threshold
    it('should flag variance of 5.1% as significant with 5% threshold', () => {
      const components = {
        material: {
          standard: 100,
          actual: 105.1,
          variance: 5.1,
          variance_percent: 5.1,
        },
        labor: {
          standard: 30,
          actual: 30,
          variance: 0,
          variance_percent: 0,
        },
        overhead: {
          standard: 20,
          actual: 20,
          variance: 0,
          variance_percent: 0,
        },
        total: {
          standard: 150,
          actual: 155.1,
          variance: 5.1,
          variance_percent: 3.4,
        },
      };

      const threshold = 5;
      const significant = identifySignificantVariances(components, threshold);

      const materialVariance = significant.find((v) => v.component === 'material');
      expect(materialVariance).toBeDefined();
      if (materialVariance) {
        expect(materialVariance.variance_percent).toBeCloseTo(5.1, 1);
      }
    });

    // AC-10: Test direction flagging (over/under)
    it('should correctly flag direction for positive variance as "over"', () => {
      const components = {
        material: {
          standard: 100,
          actual: 106,
          variance: 6,
          variance_percent: 6,
        },
        labor: {
          standard: 30,
          actual: 30,
          variance: 0,
          variance_percent: 0,
        },
        overhead: {
          standard: 20,
          actual: 20,
          variance: 0,
          variance_percent: 0,
        },
        total: {
          standard: 150,
          actual: 156,
          variance: 6,
          variance_percent: 4,
        },
      };

      const significant = identifySignificantVariances(components, 5);

      const materialVariance = significant.find((v) => v.component === 'material');
      expect(materialVariance?.direction).toBe('over');
    });

    // AC-10: Test direction flagging for negative variance
    it('should correctly flag direction for negative variance as "under"', () => {
      const components = {
        material: {
          standard: 100,
          actual: 93,
          variance: -7,
          variance_percent: -7,
        },
        labor: {
          standard: 30,
          actual: 30,
          variance: 0,
          variance_percent: 0,
        },
        overhead: {
          standard: 20,
          actual: 20,
          variance: 0,
          variance_percent: 0,
        },
        total: {
          standard: 150,
          actual: 143,
          variance: -7,
          variance_percent: -4.67,
        },
      };

      const significant = identifySignificantVariances(components, 5);

      const materialVariance = significant.find((v) => v.component === 'material');
      expect(materialVariance?.direction).toBe('under');
    });

    // AC-10: Test multiple significant variances
    it('should identify multiple significant variances when both labor and overhead exceed threshold', () => {
      const components = {
        material: {
          standard: 100,
          actual: 101,
          variance: 1,
          variance_percent: 1,
        },
        labor: {
          standard: 30,
          actual: 32.4,
          variance: 2.4,
          variance_percent: 8, // 8% - significant
        },
        overhead: {
          standard: 20,
          actual: 21.1,
          variance: 1.1,
          variance_percent: 5.5, // 5.5% - significant
        },
        total: {
          standard: 150,
          actual: 154.5,
          variance: 4.5,
          variance_percent: 3,
        },
      };

      const significant = identifySignificantVariances(components, 5);

      expect(significant.length).toBeGreaterThanOrEqual(2);
      expect(significant.some((v) => v.component === 'labor')).toBe(true);
      expect(significant.some((v) => v.component === 'overhead')).toBe(true);
    });

    // AC-10: Test empty result when all within threshold
    it('should return empty array when all variances are below threshold', () => {
      const components = {
        material: {
          standard: 100,
          actual: 101,
          variance: 1,
          variance_percent: 1,
        },
        labor: {
          standard: 30,
          actual: 30.5,
          variance: 0.5,
          variance_percent: 1.67,
        },
        overhead: {
          standard: 20,
          actual: 20.5,
          variance: 0.5,
          variance_percent: 2.5,
        },
        total: {
          standard: 150,
          actual: 152,
          variance: 2,
          variance_percent: 1.33,
        },
      };

      const significant = identifySignificantVariances(components, 5);

      expect(significant).toHaveLength(0);
    });

    // AC-10: Test threshold property included
    it('should include threshold in returned significant variance objects', () => {
      const components = {
        material: {
          standard: 100,
          actual: 108,
          variance: 8,
          variance_percent: 8,
        },
        labor: {
          standard: 30,
          actual: 30,
          variance: 0,
          variance_percent: 0,
        },
        overhead: {
          standard: 20,
          actual: 20,
          variance: 0,
          variance_percent: 0,
        },
        total: {
          standard: 150,
          actual: 158,
          variance: 8,
          variance_percent: 5.33,
        },
      };

      const threshold = 5;
      const significant = identifySignificantVariances(components, threshold);

      expect(significant[0]).toHaveProperty('threshold');
      expect(significant[0].threshold).toBe(threshold);
    });
  });
});
